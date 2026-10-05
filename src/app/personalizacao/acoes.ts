"use server";

import { refresh } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { garantirCliente, obterUsuario } from "@/lib/auth";
import { normalizarCep } from "@/lib/cep";
import {
  criarPedidoComEntrega,
  ErroAoCriarPedido,
  pedidoDaChave,
  validarDadosDoPedido,
  type ResultadoDoPedido,
} from "@/lib/criar-pedido";
import { cotarFrete, type CotacaoDoCarrinho } from "@/lib/frete";
import {
  arquivosNoStorage,
  caminhoNovo,
  CATEGORIA_DAS_PECAS,
  criarEnvioAssinado,
} from "@/lib/personalizacao";
import {
  extensaoDoArquivo,
  FORMATOS_DE_ARTE,
  MAXIMO_DE_ARQUIVOS,
  QUANTIDADE_MAXIMA_POR_TAMANHO,
  TAMANHO_MAXIMO_BYTES,
} from "@/lib/personalizacao-regras";
import { prisma } from "@/lib/prisma";

// Server Actions são endpoints públicos: login, dono do pedido, situação e
// arquivos são conferidos aqui. Preços nunca vêm do navegador.

export type ResultadoSimples = { ok: true } | { ok: false; erro: string };

// ---------------------------------------------------------------- Envio da arte

export type EnvioPreparado =
  | { ok: true; caminho: string; token: string }
  | { ok: false; erro: string };

export async function prepararEnvioDeArte(arquivo: unknown): Promise<EnvioPreparado> {
  const usuario = await obterUsuario();
  if (!usuario) return { ok: false, erro: "Entre na sua conta para enviar a arte." };

  const validacao = z
    .object({ nome: z.string().min(1).max(200), tamanho: z.number().int().positive() })
    .safeParse(arquivo);
  if (!validacao.success) return { ok: false, erro: "Arquivo inválido." };
  const { nome, tamanho } = validacao.data;

  if (!(FORMATOS_DE_ARTE as readonly string[]).includes(extensaoDoArquivo(nome))) {
    return { ok: false, erro: "Formato não aceito. Use PNG, JPG, SVG, PDF, CDR, AI ou PSD." };
  }
  if (tamanho > TAMANHO_MAXIMO_BYTES) {
    return { ok: false, erro: "O arquivo passa de 20 MB." };
  }

  const envio = await criarEnvioAssinado(caminhoNovo(usuario.id, "artes", nome));
  if (!envio) return { ok: false, erro: "Não conseguimos preparar o envio. Tente de novo." };
  return { ok: true, ...envio };
}

// ---------------------------------------------------------------- Pedido de personalização

function hojeEmSaoPaulo() {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "America/Sao_Paulo" }).format(new Date());
}

const esquemaPersonalizacao = z
  .object({
    produtoId: z.uuid("Escolha a peça."),
    corId: z.uuid("Escolha a cor."),
    quantidades: z.record(
      z.uuid(),
      z.number().int().min(0).max(QUANTIDADE_MAXIMA_POR_TAMANHO, `No máximo ${QUANTIDADE_MAXIMA_POR_TAMANHO} por tamanho.`),
    ),
    posicoes: z
      .array(z.enum(["FRENTE_PEITO", "FRENTE_GRANDE", "COSTAS"]))
      .min(1, "Escolha pelo menos uma posição para a estampa.")
      .max(3),
    descricao: z.string().trim().max(2000, "Texto longo demais (máximo de 2.000 caracteres).").optional(),
    prazoDesejado: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, "Data inválida.")
      .refine((data) => data >= hojeEmSaoPaulo(), "Escolha uma data a partir de hoje.")
      .optional(),
    arquivos: z
      .array(z.object({ caminho: z.string().min(1).max(300), nome: z.string().min(1).max(200) }))
      .max(MAXIMO_DE_ARQUIVOS, `Envie no máximo ${MAXIMO_DE_ARQUIVOS} arquivos.`),
  })
  .refine((d) => Object.values(d.quantidades).some((q) => q > 0), {
    message: "Informe a quantidade de pelo menos um tamanho.",
    path: ["quantidades"],
  })
  .refine((d) => d.arquivos.length > 0 || (d.descricao ?? "").length >= 10, {
    message: "Envie a arte ou descreva a ideia (pelo menos 10 caracteres).",
    path: ["descricao"],
  });

export type DadosDaPersonalizacao = z.input<typeof esquemaPersonalizacao>;
export type ResultadoDaPersonalizacao = { erro: string; campos?: Record<string, string> };

export async function enviarPersonalizacao(dados: unknown): Promise<ResultadoDaPersonalizacao> {
  const usuario = await obterUsuario();
  if (!usuario) return { erro: "Entre na sua conta para enviar o pedido." };

  const validacao = esquemaPersonalizacao.safeParse(dados);
  if (!validacao.success) {
    const campos: Record<string, string> = {};
    for (const problema of validacao.error.issues) campos[String(problema.path[0])] ??= problema.message;
    return { erro: "Confira os campos destacados.", campos };
  }
  const d = validacao.data;

  // A peça precisa ser uma camiseta lisa ativa, e cor e tamanhos precisam existir nela.
  const tamanhosPedidos = Object.entries(d.quantidades).filter(([, q]) => q > 0);
  const variacoes = await prisma.variacao.findMany({
    where: {
      ativo: true,
      produtoId: d.produtoId,
      corId: d.corId,
      tamanhoId: { in: tamanhosPedidos.map(([id]) => id) },
      produto: { ativo: true, categoria: { slug: CATEGORIA_DAS_PECAS } },
    },
    select: { tamanhoId: true },
  });
  if (variacoes.length !== tamanhosPedidos.length) {
    return { erro: "Essa combinação de peça, cor e tamanho não está disponível. Recarregue a página." };
  }

  // Arquivos: só os que o próprio cliente enviou agora, que existem no Storage
  // e que ainda não estão em outro pedido.
  const caminhos = [...new Set(d.arquivos.map((a) => a.caminho))];
  if (caminhos.some((c) => !c.startsWith(`${usuario.id}/artes/`))) {
    return { erro: "Arquivo inválido. Envie a arte de novo." };
  }
  const noStorage = await arquivosNoStorage(caminhos);
  if (noStorage.size !== caminhos.length) {
    return { erro: "Algum arquivo não terminou de enviar. Envie de novo." };
  }
  const jaUsados = await prisma.personalizacaoArquivo.count({ where: { caminho: { in: caminhos } } });
  if (jaUsados > 0) return { erro: "Algum arquivo já foi usado em outro pedido. Envie de novo." };

  await garantirCliente({ id: usuario.id, email: usuario.email, user_metadata: { nome: usuario.nome } });

  const personalizacao = await prisma.personalizacao.create({
    data: {
      clienteId: usuario.id,
      produtoId: d.produtoId,
      corId: d.corId,
      posicoes: d.posicoes,
      descricao: d.descricao || null,
      prazoDesejado: d.prazoDesejado ? new Date(`${d.prazoDesejado}T12:00:00Z`) : null,
      itens: {
        create: tamanhosPedidos.map(([tamanhoId, quantidade]) => ({ tamanhoId, quantidade })),
      },
      arquivos: {
        create: caminhos.map((caminho) => ({
          tipo: "ARTE" as const,
          caminho,
          nomeOriginal: d.arquivos.find((a) => a.caminho === caminho)!.nome,
          tamanhoBytes: noStorage.get(caminho)!,
        })),
      },
    },
    select: { numero: true },
  });

  redirect(`/conta/personalizacoes/${personalizacao.numero}?novo=1`);
}

// ---------------------------------------------------------------- Prévia

async function personalizacaoDoCliente(numero: unknown) {
  const usuario = await obterUsuario();
  if (!usuario || typeof numero !== "number" || !Number.isInteger(numero)) return null;
  const personalizacao = await prisma.personalizacao.findFirst({
    where: { numero, clienteId: usuario.id },
  });
  return personalizacao ? { usuario, personalizacao } : null;
}

export async function aprovarPrevia(numero: unknown): Promise<ResultadoSimples> {
  const encontrado = await personalizacaoDoCliente(numero);
  if (!encontrado) return { ok: false, erro: "Pedido não encontrado." };

  const { count } = await prisma.personalizacao.updateMany({
    where: { id: encontrado.personalizacao.id, status: "PREVIA_ENVIADA" },
    data: { status: "APROVADA" },
  });
  if (count === 0) return { ok: false, erro: "Essa prévia não está mais esperando aprovação. Recarregue a página." };
  refresh();
  return { ok: true };
}

export async function pedirAjuste(numero: unknown, texto: unknown): Promise<ResultadoSimples> {
  const encontrado = await personalizacaoDoCliente(numero);
  if (!encontrado) return { ok: false, erro: "Pedido não encontrado." };

  const validacao = z.string().trim().min(5, "Conte o que precisa mudar.").max(2000).safeParse(texto);
  if (!validacao.success) return { ok: false, erro: validacao.error.issues[0].message };

  const ok = await prisma.$transaction(async (tx) => {
    const { count } = await tx.personalizacao.updateMany({
      where: { id: encontrado.personalizacao.id, status: "PREVIA_ENVIADA" },
      data: { status: "AJUSTE_SOLICITADO" },
    });
    if (count === 0) return false;
    await tx.personalizacaoMensagem.create({
      data: { personalizacaoId: encontrado.personalizacao.id, autor: "CLIENTE", texto: validacao.data },
    });
    return true;
  });
  if (!ok) return { ok: false, erro: "Essa prévia não está mais esperando aprovação. Recarregue a página." };
  refresh();
  return { ok: true };
}

// ---------------------------------------------------------------- Pagamento

/** Itens do pedido e pacotes do frete para uma personalização aprovada. */
async function montarCompra(personalizacaoId: string) {
  const p = await prisma.personalizacao.findUniqueOrThrow({
    where: { id: personalizacaoId },
    include: {
      produto: true,
      cor: true,
      itens: { include: { tamanho: true } },
    },
  });
  if (p.precoUnitarioEmCentavos === null) return null;

  const variacoes = await prisma.variacao.findMany({
    where: {
      ativo: true,
      produtoId: p.produtoId,
      corId: p.corId,
      tamanhoId: { in: p.itens.map((i) => i.tamanhoId) },
    },
  });
  const porTamanho = new Map(variacoes.map((v) => [v.tamanhoId, v]));
  if (p.itens.some((i) => !porTamanho.has(i.tamanhoId))) return null;

  const preco = p.precoUnitarioEmCentavos;
  return {
    personalizacao: p,
    itens: p.itens.map((item) => ({
      variacaoId: porTamanho.get(item.tamanhoId)!.id,
      quantidade: item.quantidade,
      precoUnitarioEmCentavos: preco,
      nomeProduto: `${p.produto.nome} personalizada (nº ${p.numero})`,
      nomeCor: p.cor.nome,
      nomeTamanho: item.tamanho.nome,
      sku: porTamanho.get(item.tamanhoId)!.sku,
    })),
    pacotes: p.itens.map((item) => ({
      id: porTamanho.get(item.tamanhoId)!.id,
      pesoEmGramas: p.produto.pesoEmGramas,
      larguraCm: p.produto.larguraCm,
      alturaCm: p.produto.alturaCm,
      comprimentoCm: p.produto.comprimentoCm,
      valorEmCentavos: preco,
      quantidade: item.quantidade,
    })),
  };
}

export async function cotarFreteDaPersonalizacao(
  numero: number,
  cep: unknown,
): Promise<CotacaoDoCarrinho | { ok: false; cep: string; erro: string }> {
  const cepNormalizado = normalizarCep(cep);
  if (!cepNormalizado) return { ok: false, cep: "", erro: "Digite um CEP com 8 números." };

  const encontrado = await personalizacaoDoCliente(numero);
  if (!encontrado || encontrado.personalizacao.status !== "APROVADA") {
    return { ok: false, cep: cepNormalizado, erro: "Esse pedido não está pronto para pagamento." };
  }
  const compra = await montarCompra(encontrado.personalizacao.id);
  if (!compra) {
    return { ok: false, cep: cepNormalizado, erro: "Não conseguimos calcular o frete desse pedido. Fale com a gente." };
  }
  return cotarFrete(compra.pacotes, cepNormalizado, null);
}

export async function finalizarPersonalizacao(
  numero: number,
  dados: unknown,
): Promise<ResultadoDoPedido> {
  const usuario = await obterUsuario();
  if (!usuario) return { erro: "Sua sessão expirou. Entre de novo para finalizar." };

  const validacao = validarDadosDoPedido(dados);
  if (!validacao.ok) return validacao.resultado;

  const existente = await pedidoDaChave(validacao.dados.chave);
  if (existente) {
    if (existente.clienteId !== usuario.id) return { erro: "Não foi possível finalizar. Recarregue a página." };
    redirect(`/pedidos/${existente.numero}?novo=1`);
  }

  const encontrado = await personalizacaoDoCliente(numero);
  if (!encontrado) return { erro: "Pedido não encontrado." };
  if (encontrado.personalizacao.status !== "APROVADA") {
    return { erro: "Esse pedido não está pronto para pagamento. Recarregue a página." };
  }
  const compra = await montarCompra(encontrado.personalizacao.id);
  if (!compra) return { erro: "Não conseguimos montar esse pedido. Fale com a gente." };

  const resultado = await criarPedidoComEntrega({
    usuario,
    dados: validacao.dados,
    itens: compra.itens,
    pacotes: compra.pacotes,
    // Na mesma transação: só converte se ainda estiver aprovada e sem pedido.
    aoCriar: async (tx, pedidoId) => {
      const { count } = await tx.personalizacao.updateMany({
        where: { id: encontrado.personalizacao.id, status: "APROVADA", pedidoId: null },
        data: { status: "CONVERTIDA", pedidoId },
      });
      if (count === 0) throw new ErroAoCriarPedido("Esse pedido já foi finalizado. Recarregue a página.");
    },
  });
  if (!resultado.ok) {
    return { erro: resultado.erro, campos: resultado.campos, recotarFrete: resultado.recotarFrete };
  }
  redirect(`/pedidos/${resultado.numero}?novo=1`);
}
