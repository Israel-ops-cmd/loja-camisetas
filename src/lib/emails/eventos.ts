import "server-only";

import { emailDaLoja, registrarEmail } from "@/lib/emails/envio";
import {
  emailLembreteDePagamento,
  emailLojaAjusteSolicitado,
  emailLojaAlerta,
  emailLojaNovaPersonalizacao,
  emailLojaNovoOrcamento,
  emailLojaPedidoPago,
  emailOrcamentoRecebido,
  emailPagamentoAprovado,
  emailPedidoCancelado,
  emailPedidoEnviado,
  emailPersonalizacaoRecebida,
  emailPersonalizacaoRecusada,
  emailPreviaPronta,
  type MotivoDoCancelamento,
  type OrcamentoParaEmail,
  type PedidoParaEmail,
  type PersonalizacaoParaEmail,
} from "@/lib/emails/modelos";
import { origemDoSite } from "@/lib/origem";
import { linkDeRastreio } from "@/lib/pedidos";
import { prisma } from "@/lib/prisma";

// Um função por acontecimento: monta o e-mail e coloca na fila, dentro da
// transação de quem chamou. Devolvem as chaves para `enviarDepois`.
// Chave = TIPO:id — o mesmo acontecimento nunca gera dois e-mails.

type Cliente = Parameters<Parameters<typeof prisma.$transaction>[0]>[0] | typeof prisma;

/** Endereço do site para os links (SITE_URL ou o da requisição atual). */
export async function urlDoSite() {
  const configurado = process.env.SITE_URL?.trim().replace(/\/+$/, "");
  if (configurado) return configurado;
  try {
    return await origemDoSite();
  } catch {
    return "";
  }
}

type PedidoComId = PedidoParaEmail & { id: string };

export async function emailsDePedidoPago(tx: Cliente, pedido: PedidoComId, site: string) {
  const chaves = [
    await registrarEmail(tx, { tipo: "PAGAMENTO_APROVADO", chave: `PAGAMENTO_APROVADO:${pedido.id}`, para: pedido.compradorEmail, ...emailPagamentoAprovado(pedido, site) }),
  ];
  const loja = emailDaLoja();
  if (loja) chaves.push(await registrarEmail(tx, { tipo: "LOJA_PEDIDO_PAGO", chave: `LOJA_PEDIDO_PAGO:${pedido.id}`, para: loja, ...emailLojaPedidoPago(pedido, site) }));
  return chaves;
}

/** Aviso para a loja. `referencia` distingue alertas diferentes do mesmo pedido (ex.: id do pagamento). */
export async function emailDeAlerta(tx: Cliente, pedido: { id: string; numero: number }, referencia: string, alerta: string, site: string) {
  const loja = emailDaLoja();
  if (!loja) return [];
  return [await registrarEmail(tx, { tipo: "LOJA_ALERTA", chave: `LOJA_ALERTA:${pedido.id}:${referencia}`, para: loja, ...emailLojaAlerta(pedido.numero, alerta, site) })];
}

export async function emailDeCancelamento(tx: Cliente, pedido: PedidoComId, motivo: MotivoDoCancelamento, site: string) {
  return [
    await registrarEmail(tx, { tipo: "PEDIDO_CANCELADO", chave: `PEDIDO_CANCELADO:${pedido.id}`, para: pedido.compradorEmail, ...emailPedidoCancelado(pedido, site, motivo) }),
  ];
}

export async function emailDeEnvio(tx: Cliente, pedido: PedidoComId, site: string) {
  return [
    await registrarEmail(tx, {
      tipo: "PEDIDO_ENVIADO",
      chave: `PEDIDO_ENVIADO:${pedido.id}`,
      para: pedido.compradorEmail,
      ...emailPedidoEnviado(pedido, site, pedido.codigoRastreio ? linkDeRastreio(pedido.codigoRastreio) : null),
    }),
  ];
}

export async function emailDeLembrete(tx: Cliente, pedido: PedidoComId, site: string, cancelaEm: Date) {
  return [
    await registrarEmail(tx, { tipo: "LEMBRETE_PAGAMENTO", chave: `LEMBRETE_PAGAMENTO:${pedido.id}`, para: pedido.compradorEmail, ...emailLembreteDePagamento(pedido, site, cancelaEm) }),
  ];
}

// ---------------------------------------------------------------- Personalização

/** Dados da personalização para os e-mails (com o cliente). */
export async function personalizacaoParaEmail(tx: Cliente, personalizacaoId: string): Promise<PersonalizacaoParaEmail & { id: string }> {
  const p = await tx.personalizacao.findUniqueOrThrow({
    where: { id: personalizacaoId },
    select: {
      id: true,
      numero: true,
      cliente: { select: { nome: true, email: true } },
      produto: { select: { nome: true } },
      cor: { select: { nome: true } },
      itens: { select: { quantidade: true } },
    },
  });
  return {
    id: p.id,
    numero: p.numero,
    nomeDoCliente: p.cliente.nome,
    emailDoCliente: p.cliente.email,
    produto: p.produto.nome,
    cor: p.cor.nome,
    pecas: p.itens.reduce((s, i) => s + i.quantidade, 0),
  };
}

export async function emailsDePersonalizacaoRecebida(tx: Cliente, x: PersonalizacaoParaEmail & { id: string }, site: string) {
  const chaves = [
    await registrarEmail(tx, { tipo: "PERSONALIZACAO_RECEBIDA", chave: `PERSONALIZACAO_RECEBIDA:${x.id}`, para: x.emailDoCliente, ...emailPersonalizacaoRecebida(x, site) }),
  ];
  const loja = emailDaLoja();
  if (loja) chaves.push(await registrarEmail(tx, { tipo: "LOJA_NOVA_PERSONALIZACAO", chave: `LOJA_NOVA_PERSONALIZACAO:${x.id}`, para: loja, ...emailLojaNovaPersonalizacao(x, site) }));
  return chaves;
}

/** `previaId`: cada prévia nova (depois de um ajuste) gera um e-mail novo. */
export async function emailDePreviaPronta(tx: Cliente, x: PersonalizacaoParaEmail & { id: string }, previaId: string, precoUnitario: number, recado: string | null, site: string) {
  return [
    await registrarEmail(tx, { tipo: "PREVIA_PRONTA", chave: `PREVIA_PRONTA:${previaId}`, para: x.emailDoCliente, ...emailPreviaPronta(x, site, precoUnitario, recado) }),
  ];
}

export async function emailDeRecusa(tx: Cliente, x: PersonalizacaoParaEmail & { id: string }, motivo: string, site: string) {
  return [
    await registrarEmail(tx, { tipo: "PERSONALIZACAO_RECUSADA", chave: `PERSONALIZACAO_RECUSADA:${x.id}`, para: x.emailDoCliente, ...emailPersonalizacaoRecusada(x, site, motivo) }),
  ];
}

/** `mensagemId`: cada pedido de ajuste gera um aviso. */
export async function emailDeAjuste(tx: Cliente, x: PersonalizacaoParaEmail & { id: string }, mensagemId: string, pedido: string, site: string) {
  const loja = emailDaLoja();
  if (!loja) return [];
  return [await registrarEmail(tx, { tipo: "LOJA_AJUSTE_SOLICITADO", chave: `LOJA_AJUSTE_SOLICITADO:${mensagemId}`, para: loja, ...emailLojaAjusteSolicitado(x, site, pedido) })];
}

// ---------------------------------------------------------------- Orçamentos

export async function emailsDeOrcamento(tx: Cliente, o: OrcamentoParaEmail & { id: string }, site: string) {
  const chaves = [await registrarEmail(tx, { tipo: "ORCAMENTO_RECEBIDO", chave: `ORCAMENTO_RECEBIDO:${o.id}`, para: o.email, ...emailOrcamentoRecebido(o) })];
  const loja = emailDaLoja();
  if (loja) chaves.push(await registrarEmail(tx, { tipo: "LOJA_NOVO_ORCAMENTO", chave: `LOJA_NOVO_ORCAMENTO:${o.id}`, para: loja, ...emailLojaNovoOrcamento(o, site) }));
  return chaves;
}
