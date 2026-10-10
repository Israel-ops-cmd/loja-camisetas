import "server-only";

import { precoComDesconto } from "@/lib/atacado-regras";
import { buscarCep } from "@/lib/cep";
import { cepDeOrigem, chamarMelhorEnvio, ErroDoMelhorEnvio } from "@/lib/melhor-envio";
import { registrar } from "@/lib/pagamento";
import { prisma } from "@/lib/prisma";

// Etiqueta de envio pelo Melhor Envio: carrinho → compra (saldo da carteira)
// → geração → impressão. O id do envio fica no pedido logo depois de entrar
// no carrinho, para uma compra interrompida continuar de onde parou.
// Referência: https://docs.melhorenvio.com.br/reference/inserir-fretes-no-carrinho

export { ErroDoMelhorEnvio };

/** Situações do envio no Melhor Envio, em português. */
export const rotulosDaEtiqueta: Record<string, string> = {
  pending: "No carrinho do Melhor Envio, ainda não paga",
  released: "Paga, sendo gerada",
  generated: "Pronta para imprimir",
  posted: "Postada",
  delivered: "Entregue",
  undelivered: "Não entregue",
  canceled: "Cancelada",
  expired: "Expirada",
  paused: "Pausada",
  suspended: "Suspensa",
};

/** Etiqueta já paga que ainda pode ser impressa e usada. */
export const ETIQUETA_ATIVA = ["released", "generated", "posted", "delivered", "undelivered", "paused", "suspended"];

// ---------------------------------------------------------------- Remetente

const VARIAVEIS_DO_REMETENTE = {
  nome: "MELHOR_ENVIO_REMETENTE_NOME",
  telefone: "MELHOR_ENVIO_REMETENTE_TELEFONE",
  documento: "MELHOR_ENVIO_REMETENTE_DOCUMENTO",
  endereco: "MELHOR_ENVIO_REMETENTE_ENDERECO",
  numero: "MELHOR_ENVIO_REMETENTE_NUMERO",
  bairro: "MELHOR_ENVIO_REMETENTE_BAIRRO",
} as const;

/** Variáveis do remetente que faltam no ambiente (vazio = tudo certo). */
export function remetenteIncompleto() {
  return Object.values(VARIAVEIS_DO_REMETENTE).filter((nome) => !process.env[nome]?.trim());
}

async function remetente() {
  const faltando = remetenteIncompleto();
  if (faltando.length > 0) {
    throw new ErroDoMelhorEnvio(`Faltam os dados do remetente nas variáveis de ambiente: ${faltando.join(", ")}.`);
  }
  const env = (nome: string) => process.env[nome]!.trim();
  const cep = cepDeOrigem();
  const local = await buscarCep(cep).catch(() => null);
  if (!local?.cidade || !local.uf) {
    throw new ErroDoMelhorEnvio("Não conseguimos ler a cidade do CEP de origem (MELHOR_ENVIO_CEP_ORIGEM). Tente de novo em instantes.");
  }
  const documento = env(VARIAVEIS_DO_REMETENTE.documento).replace(/\D/g, "");
  return {
    name: env(VARIAVEIS_DO_REMETENTE.nome),
    phone: env(VARIAVEIS_DO_REMETENTE.telefone).replace(/\D/g, ""),
    email: process.env.MELHOR_ENVIO_REMETENTE_EMAIL?.trim() || process.env.MELHOR_ENVIO_EMAIL_CONTATO,
    // CPF (11 dígitos) em "document"; CNPJ (14) em "company_document".
    ...(documento.length === 14
      ? { company_document: documento, state_register: process.env.MELHOR_ENVIO_REMETENTE_IE?.trim() || undefined }
      : { document: documento }),
    address: env(VARIAVEIS_DO_REMETENTE.endereco),
    number: env(VARIAVEIS_DO_REMETENTE.numero),
    complement: process.env.MELHOR_ENVIO_REMETENTE_COMPLEMENTO?.trim() || undefined,
    district: env(VARIAVEIS_DO_REMETENTE.bairro),
    city: local.cidade,
    state_abbr: local.uf,
    country_id: "BR",
    postal_code: cep,
  };
}

// ---------------------------------------------------------------- Pedido

function carregarPedido(pedidoId: string) {
  return prisma.pedido.findUniqueOrThrow({
    where: { id: pedidoId },
    include: {
      itens: {
        include: {
          variacao: {
            select: { produto: { select: { pesoEmGramas: true, larguraCm: true, alturaCm: true, comprimentoCm: true } } },
          },
        },
      },
    },
  });
}
type PedidoParaEtiqueta = Awaited<ReturnType<typeof carregarPedido>>;

type ServicoCotado = {
  id: number;
  error?: string;
  price?: string;
  custom_price?: string;
  packages?: { dimensions: { height: number; width: number; length: number }; weight: string }[];
};

/** Preço atual da etiqueta no serviço escolhido pelo cliente e os volumes calculados. */
async function cotar(pedido: PedidoParaEtiqueta) {
  if (!pedido.freteServicoId) throw new ErroDoMelhorEnvio("Este pedido não tem serviço de frete escolhido.");
  const resposta = await chamarMelhorEnvio<ServicoCotado | ServicoCotado[]>("POST", "/api/v2/me/shipment/calculate", {
    from: { postal_code: cepDeOrigem() },
    to: { postal_code: pedido.entregaCep },
    services: String(pedido.freteServicoId),
    products: pedido.itens.map((item) => ({
      id: item.id,
      width: item.variacao.produto.larguraCm,
      height: item.variacao.produto.alturaCm,
      length: item.variacao.produto.comprimentoCm,
      weight: item.variacao.produto.pesoEmGramas / 1000,
      insurance_value: precoComDesconto(item.precoUnitarioEmCentavos, pedido.descontoPercentual) / 100,
      quantity: item.quantidade,
    })),
  });
  const servico = Array.isArray(resposta) ? resposta.find((s) => s.id === pedido.freteServicoId) : resposta;
  if (!servico || servico.error) {
    throw new ErroDoMelhorEnvio(
      `O serviço ${pedido.freteServico ?? ""} não está disponível para este pedido agora${servico?.error ? `: ${servico.error}` : ""}.`,
    );
  }
  const preco = Math.round(Number(servico.custom_price ?? servico.price) * 100);
  const volumes = (servico.packages ?? []).map((p) => ({
    height: p.dimensions.height,
    width: p.dimensions.width,
    length: p.dimensions.length,
    weight: Number(p.weight),
  }));
  if (!Number.isFinite(preco) || volumes.length === 0) throw new ErroDoMelhorEnvio("Resposta inesperada do Melhor Envio. Tente de novo.");
  return { precoEmCentavos: preco, volumes };
}

export async function cotarEtiqueta(pedidoId: string) {
  return cotar(await carregarPedido(pedidoId));
}

type EnvioNoMelhorEnvio = {
  id: string;
  protocol: string;
  status: string;
  price: number;
  tracking: string | null;
  self_tracking: string | null;
};

export async function situacaoDaEtiqueta(envioId: string) {
  const envio = await chamarMelhorEnvio<EnvioNoMelhorEnvio>("GET", `/api/v2/me/orders/${encodeURIComponent(envioId)}`);
  return {
    status: envio.status,
    rotulo: rotulosDaEtiqueta[envio.status] ?? envio.status,
    protocolo: envio.protocol,
    precoEmCentavos: Math.round(envio.price * 100),
    rastreio: envio.tracking ?? envio.self_tracking ?? null,
  };
}

/**
 * Compra a etiqueta do pedido (ou continua uma compra interrompida).
 * O valor sai do saldo da carteira do Melhor Envio.
 */
export async function comprarEtiqueta(pedidoId: string, autor: string) {
  const pedido = await carregarPedido(pedidoId);
  let envioId = pedido.melhorEnvioEtiquetaId;

  // Envio anterior cancelado ou expirado: começa outro.
  if (envioId) {
    const atual = await situacaoDaEtiqueta(envioId);
    if (atual.status === "canceled" || atual.status === "expired") {
      await prisma.pedido.updateMany({ where: { id: pedidoId, melhorEnvioEtiquetaId: envioId }, data: { melhorEnvioEtiquetaId: null } });
      envioId = null;
    }
  }

  if (!envioId) {
    const { volumes } = await cotar(pedido);
    if (volumes.length > 1) {
      throw new ErroDoMelhorEnvio(
        `O pedido não cabe em um pacote só (${volumes.length} volumes). Gere as etiquetas direto no site do Melhor Envio.`,
      );
    }
    const valorDosItens = pedido.itens.reduce(
      (soma, item) => soma + precoComDesconto(item.precoUnitarioEmCentavos, pedido.descontoPercentual) * item.quantidade,
      0,
    );
    const envio = await chamarMelhorEnvio<{ id: string }>("POST", "/api/v2/me/cart", {
      service: pedido.freteServicoId,
      from: await remetente(),
      to: {
        name: pedido.entregaDestinatario,
        phone: pedido.compradorTelefone,
        email: pedido.compradorEmail,
        document: pedido.compradorCpf,
        address: pedido.entregaLogradouro,
        number: pedido.entregaNumero,
        complement: pedido.entregaComplemento ?? undefined,
        district: pedido.entregaBairro,
        city: pedido.entregaCidade,
        state_abbr: pedido.entregaUf,
        country_id: "BR",
        postal_code: pedido.entregaCep,
      },
      products: pedido.itens.map((item) => ({
        name: `${item.nomeProduto} ${item.nomeCor} ${item.nomeTamanho}`.slice(0, 100),
        quantity: item.quantidade,
        unitary_value: precoComDesconto(item.precoUnitarioEmCentavos, pedido.descontoPercentual) / 100,
      })),
      volumes,
      options: {
        insurance_value: valorDosItens / 100,
        receipt: false,
        own_hand: false,
        reverse: false,
        // Declaração de conteúdo (sem nota fiscal). Ver docs/pendencias.md.
        non_commercial: true,
        platform: "Carta Viva",
        tags: [{ tag: `Pedido #${pedido.numero}`, url: null }],
      },
    });
    // Guarda o envio só se ninguém guardou outro ao mesmo tempo (toque duplo).
    const guardado = await prisma.pedido.updateMany({
      where: { id: pedidoId, melhorEnvioEtiquetaId: null },
      data: { melhorEnvioEtiquetaId: envio.id },
    });
    if (guardado.count === 0) {
      throw new ErroDoMelhorEnvio("A etiqueta deste pedido já está sendo comprada. Recarregue a página.");
    }
    envioId = envio.id;
  }

  let situacao = await situacaoDaEtiqueta(envioId);
  if (situacao.status === "pending") {
    try {
      await chamarMelhorEnvio("POST", "/api/v2/me/shipment/checkout", { orders: [envioId] });
    } catch (erro) {
      // "Já foi paga" (toque duplo) não é problema: segue para a geração.
      situacao = await situacaoDaEtiqueta(envioId);
      if (situacao.status === "pending") {
        const detalhe = erro instanceof ErroDoMelhorEnvio ? erro.detalhe : undefined;
        throw new ErroDoMelhorEnvio(
          `O Melhor Envio não concluiu a compra${detalhe ? `: ${detalhe}` : ""}. Confira o saldo da carteira no Melhor Envio e tente de novo.`,
        );
      }
    }
    situacao = await situacaoDaEtiqueta(envioId);
    await prisma.$transaction((tx) =>
      registrar(tx, pedidoId, `Etiqueta comprada no Melhor Envio (${situacao.protocolo}) por R$ ${(situacao.precoEmCentavos / 100).toFixed(2).replace(".", ",")}.`, autor),
    );
  }
  if (situacao.status === "released") {
    try {
      await chamarMelhorEnvio("POST", "/api/v2/me/shipment/generate", { orders: [envioId] });
    } catch (erro) {
      // A etiqueta já está paga (a geração pode já estar em andamento);
      // "Imprimir" pede a geração de novo se ela ainda não tiver acontecido.
      console.error(`[etiqueta] geração do envio ${envioId} não foi pedida agora:`, erro);
    }
    situacao = await situacaoDaEtiqueta(envioId);
  }
  return situacao;
}

/** Link (público, temporário) do PDF da etiqueta para imprimir. */
export async function linkParaImprimir(envioId: string) {
  if ((await situacaoDaEtiqueta(envioId)).status === "released") {
    await chamarMelhorEnvio("POST", "/api/v2/me/shipment/generate", { orders: [envioId] }).catch((erro) =>
      console.error(`[etiqueta] geração do envio ${envioId} antes de imprimir:`, erro),
    );
  }
  const { url } = await chamarMelhorEnvio<{ url: string }>("POST", "/api/v2/me/shipment/print", { mode: "public", orders: [envioId] });
  return url;
}

/** Cancela a etiqueta antes da postagem; o valor volta para a carteira do Melhor Envio. */
export async function cancelarEtiqueta(envioId: string, motivo: string) {
  const pode = await chamarMelhorEnvio<Record<string, { cancellable: boolean; uncancellable_reason: string | null }>>(
    "POST",
    "/api/v2/me/shipment/cancellable",
    { orders: [envioId] },
  );
  const situacao = pode[envioId];
  if (!situacao?.cancellable) {
    throw new ErroDoMelhorEnvio(
      `O Melhor Envio não deixa cancelar esta etiqueta${situacao?.uncancellable_reason ? `: ${situacao.uncancellable_reason}` : " (ela pode já ter sido postada)"}.`,
    );
  }
  await chamarMelhorEnvio("POST", "/api/v2/me/shipment/cancel", {
    order: { id: envioId, reason_id: "2", description: motivo.slice(0, 255) },
  });
}
