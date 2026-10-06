"use server";

import { refresh } from "next/cache";
import { z } from "zod";

import type { StatusPedido } from "@/generated/prisma/enums";
import {
  buscarPagamento,
  ErroMercadoPago,
  estornarPagamentoNoMercadoPago,
  expirarCobranca,
} from "@/lib/mercado-pago";
import { enviarDepois } from "@/lib/emails/envio";
import { emailDeCancelamento, emailDeEnvio, urlDoSite } from "@/lib/emails/eventos";
import { administradorDaAcao, SEM_PERMISSAO } from "@/lib/painel";
import { conferirPagamentosDoPedido, processarPagamento, registrar } from "@/lib/pagamento";
import { PROXIMA_SITUACAO, rotulosDeStatus, SITUACAO_ANTERIOR } from "@/lib/pedidos";
import { prisma } from "@/lib/prisma";

// Ações do painel de pedidos. Cada uma confere se quem chama é administrador,
// trava a linha do pedido e confere a situação que a pessoa estava vendo:
// dois toques seguidos (ou duas pessoas) não fazem a mesma mudança duas vezes.

export type Resultado = { ok: true; mensagem: string } | { ok: false; erro: string };

const NAO_ENCONTRADO = "Pedido não encontrado. Volte para a lista e abra de novo.";
const MUDOU = "Este pedido mudou enquanto a tela estava aberta. A página foi atualizada: confira e tente de novo.";

function numeroDoPedido(valor: unknown) {
  return typeof valor === "number" && Number.isInteger(valor) && valor > 0 ? valor : null;
}

type Transacao = Parameters<Parameters<typeof prisma.$transaction>[0]>[0];

async function travar(tx: Transacao, numero: number) {
  const [linha] = await tx.$queryRaw<{ id: string; status: StatusPedido }[]>`
    select id, status from pedidos where numero = ${numero} for update`;
  return linha ?? null;
}

const STATUS = z.enum(["AGUARDANDO_PAGAMENTO", "PAGO", "EM_SEPARACAO", "ENVIADO", "ENTREGUE", "CANCELADO"]);

/** Avança ou volta um passo: Pago → Em separação → Enviado → Entregue. */
export async function mudarSituacao(numero: unknown, dados: unknown): Promise<Resultado> {
  const admin = await administradorDaAcao();
  if (!admin) return { ok: false, erro: SEM_PERMISSAO };
  const n = numeroDoPedido(numero);
  const validacao = z
    .object({
      de: STATUS,
      para: STATUS,
      codigoRastreio: z.string().trim().max(60, "Código de rastreio longo demais.").optional(),
    })
    .safeParse(dados);
  if (!n || !validacao.success) return { ok: false, erro: NAO_ENCONTRADO };
  const { de, para } = validacao.data;
  const avancando = PROXIMA_SITUACAO[de] === para;
  if (!avancando && SITUACAO_ANTERIOR[de] !== para) return { ok: false, erro: "Essa mudança de situação não é possível." };

  const codigo = validacao.data.codigoRastreio?.replace(/\s+/g, "").toUpperCase() || null;
  if (avancando && para === "ENVIADO" && (!codigo || codigo.length < 8)) {
    return { ok: false, erro: "Digite o código de rastreio que está no comprovante de postagem (ex.: AB123456789BR)." };
  }

  const site = await urlDoSite();
  const emails: string[] = [];
  const resultado = await prisma.$transaction(async (tx) => {
    const pedido = await travar(tx, n);
    if (!pedido) return NAO_ENCONTRADO;
    if (pedido.status !== de) return MUDOU;
    const agora = new Date();
    await tx.pedido.update({
      where: { id: pedido.id },
      data: {
        status: para,
        ...(para === "ENVIADO" && avancando && { enviadoEm: agora, codigoRastreio: codigo }),
        ...(para === "ENTREGUE" && { entregueEm: agora }),
        // Voltando, limpa a data do passo desfeito (o código de rastreio fica).
        ...(!avancando && de === "ENVIADO" && { enviadoEm: null }),
        ...(!avancando && de === "ENTREGUE" && { entregueEm: null }),
      },
    });
    await registrar(
      tx,
      pedido.id,
      avancando
        ? `Situação mudou para "${rotulosDeStatus[para]}"${para === "ENVIADO" ? ` (rastreio ${codigo})` : ""}.`
        : `Situação voltou de "${rotulosDeStatus[de]}" para "${rotulosDeStatus[para]}".`,
      admin.nome,
    );
    // Primeira vez que fica "Enviado": avisa o cliente com o rastreio (uma vez só).
    if (avancando && para === "ENVIADO") {
      const completo = await tx.pedido.findUniqueOrThrow({ where: { id: pedido.id }, include: { itens: true } });
      emails.push(...(await emailDeEnvio(tx, completo, site)));
    }
    return null;
  });

  refresh();
  if (resultado) return { ok: false, erro: resultado };
  enviarDepois(emails);
  return { ok: true, mensagem: `Pedido agora está "${rotulosDeStatus[para]}".` };
}

/** Lê os pagamentos do pedido no Mercado Pago e aplica o que tiver mudado. */
export async function conferirPagamento(numero: unknown): Promise<Resultado> {
  if (!(await administradorDaAcao())) return { ok: false, erro: SEM_PERMISSAO };
  const n = numeroDoPedido(numero);
  const pedido = n ? await prisma.pedido.findUnique({ where: { numero: n }, select: { id: true, status: true, alerta: true } }) : null;
  if (!pedido) return { ok: false, erro: NAO_ENCONTRADO };

  try {
    await conferirPagamentosDoPedido(pedido.id);
  } catch (erro) {
    return { ok: false, erro: erro instanceof ErroMercadoPago ? erro.message : "Não conseguimos conferir agora. Tente de novo." };
  }
  await prisma.pedido.update({ where: { id: pedido.id }, data: { pagamentoConferidoEm: new Date() } });
  const depois = await prisma.pedido.findUniqueOrThrow({ where: { id: pedido.id }, select: { status: true, alerta: true } });
  refresh();
  const novoAlerta = !!depois.alerta && depois.alerta !== pedido.alerta;
  return {
    ok: true,
    mensagem:
      depois.status !== pedido.status
        ? `Conferido: o pedido mudou para "${rotulosDeStatus[depois.status]}".${novoAlerta ? " Há um alerta para decidir." : ""}`
        : novoAlerta
          ? "Conferido: o Mercado Pago tem um pagamento que precisa de decisão. Veja o alerta no alto da página."
          : "Conferido no Mercado Pago. Nada mudou.",
  };
}

const motivo = z
  .string()
  .trim()
  .min(5, "Escreva o motivo em poucas palavras. O cliente vê esse texto.")
  .max(300, "Motivo longo demais (até 300 letras).");

/** Cancela um pedido que ainda não foi pago (nenhum estoque foi baixado). */
export async function cancelarPedido(numero: unknown, dados: unknown): Promise<Resultado> {
  const admin = await administradorDaAcao();
  if (!admin) return { ok: false, erro: SEM_PERMISSAO };
  const n = numeroDoPedido(numero);
  const validacao = z.object({ motivo }).safeParse(dados);
  if (!n) return { ok: false, erro: NAO_ENCONTRADO };
  if (!validacao.success) return { ok: false, erro: validacao.error.issues[0].message };

  const pedido = await prisma.pedido.findUnique({ where: { numero: n }, select: { id: true } });
  if (!pedido) return { ok: false, erro: NAO_ENCONTRADO };

  // Antes de cancelar, confere se o cliente não acabou de pagar.
  try {
    await conferirPagamentosDoPedido(pedido.id);
  } catch {
    return { ok: false, erro: "Não conseguimos conferir o pagamento no Mercado Pago antes de cancelar. Tente de novo em instantes." };
  }

  const site = await urlDoSite();
  const emails: string[] = [];
  const resultado = await prisma.$transaction(async (tx) => {
    const travado = await travar(tx, n);
    if (!travado) return { erro: NAO_ENCONTRADO };
    if (travado.status !== "AGUARDANDO_PAGAMENTO") {
      return {
        erro: `O pedido já está "${rotulosDeStatus[travado.status]}" e não pode ser cancelado assim.${travado.status === "PAGO" ? " Se precisar devolver o dinheiro, use “Estornar e cancelar”." : ""}`,
      };
    }
    const atualizado = await tx.pedido.update({
      where: { id: travado.id },
      data: { status: "CANCELADO", canceladoEm: new Date(), motivoCancelamento: validacao.data.motivo },
      include: { itens: true },
    });
    await registrar(tx, travado.id, `Pedido cancelado antes do pagamento. Motivo: ${validacao.data.motivo}`, admin.nome);
    emails.push(...(await emailDeCancelamento(tx, atualizado, "loja", site)));
    return { preferencia: atualizado.mercadoPagoPreferenciaId };
  });
  enviarDepois(emails);

  refresh();
  if ("erro" in resultado) return { ok: false, erro: resultado.erro! };
  if (resultado.preferencia) await expirarCobranca(resultado.preferencia);
  return { ok: true, mensagem: "Pedido cancelado. O link de pagamento foi encerrado." };
}

/**
 * Devolve ao cliente o valor total de um pagamento aprovado deste pedido.
 * Se for o pagamento do pedido, ele é cancelado e as peças voltam ao estoque
 * (pela mesma rotina que trata estornos feitos no Mercado Pago).
 */
export async function estornarPagamento(numero: unknown, dados: unknown): Promise<Resultado> {
  const admin = await administradorDaAcao();
  if (!admin) return { ok: false, erro: SEM_PERMISSAO };
  const n = numeroDoPedido(numero);
  const validacao = z.object({ pagamentoId: z.string().regex(/^\d{1,20}$/), motivo }).safeParse(dados);
  if (!n) return { ok: false, erro: NAO_ENCONTRADO };
  if (!validacao.success) {
    const problema = validacao.error.issues[0];
    return { ok: false, erro: problema.path[0] === "motivo" ? problema.message : "Pagamento não encontrado. Recarregue a página." };
  }
  const { pagamentoId, motivo: texto } = validacao.data;

  const pedido = await prisma.pedido.findUnique({
    where: { numero: n },
    select: { id: true, mercadoPagoPagamentoId: true },
  });
  if (!pedido) return { ok: false, erro: NAO_ENCONTRADO };

  let pagamento;
  try {
    pagamento = await buscarPagamento(pagamentoId);
  } catch {
    return { ok: false, erro: "Não encontramos esse pagamento no Mercado Pago. Recarregue a página." };
  }
  if (pagamento.external_reference !== pedido.id) return { ok: false, erro: "Esse pagamento não é deste pedido." };
  if (pagamento.status === "refunded") {
    await processarPagamento(pagamentoId);
    refresh();
    return { ok: true, mensagem: "Esse pagamento já estava estornado. A página foi atualizada." };
  }
  if (pagamento.status !== "approved") {
    return { ok: false, erro: "Só dá para estornar pagamento aprovado. Esse ainda não foi aprovado." };
  }

  try {
    await estornarPagamentoNoMercadoPago(pagamentoId);
  } catch (erro) {
    const status = erro instanceof ErroMercadoPago ? erro.status : undefined;
    const detalhe = erro instanceof ErroMercadoPago ? erro.detalhe : undefined;
    console.error(`[pedidos] estorno do pagamento ${pagamentoId} recusado: HTTP ${status ?? "sem resposta"}, ${detalhe ?? erro}`);
    await prisma.$transaction((tx) =>
      registrar(
        tx,
        pedido.id,
        `Estorno do pagamento ${pagamentoId} recusado pelo Mercado Pago (${status ? `HTTP ${status}` : "sem resposta"}${detalhe ? `: ${detalhe}` : ""}). Nada foi devolvido.`,
        admin.nome,
      ),
    );
    refresh();
    return { ok: false, erro: mensagemDoEstornoRecusado(status, detalhe) };
  }

  const ehDoPedido = pedido.mercadoPagoPagamentoId === pagamentoId;
  // O motivo vai antes: o e-mail de cancelamento é gerado ao aplicar o estorno.
  if (ehDoPedido) await prisma.pedido.update({ where: { id: pedido.id }, data: { motivoCancelamento: texto } });
  // Aplica o estorno no pedido (cancela e devolve o estoque, se for o pagamento dele).
  try {
    await processarPagamento(pagamentoId);
  } catch (erro) {
    console.error(`[pedidos] estorno ${pagamentoId} feito, mas não aplicado ao pedido agora:`, erro);
  }
  await prisma.$transaction(async (tx) => {
    await registrar(
      tx,
      pedido.id,
      `Estorno de ${pagamento.transaction_amount.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })} pedido pelo painel (pagamento ${pagamentoId}). Motivo: ${texto}`,
      admin.nome,
    );
  });

  refresh();
  return {
    ok: true,
    mensagem: ehDoPedido
      ? "Estorno feito. O pedido foi cancelado e as peças voltaram para o estoque."
      : "Estorno feito. O valor volta para o cliente pelo Mercado Pago.",
  };
}

/** O que dizer a quem tentou estornar, conforme a resposta do Mercado Pago. */
function mensagemDoEstornoRecusado(status?: number, detalhe?: string) {
  const final = "Nada foi devolvido e o pedido não mudou.";
  if (status === undefined) return `O Mercado Pago não respondeu. Tente de novo em instantes. ${final}`;
  if (status === 401 || status === 403) {
    return `O Mercado Pago recusou o estorno por falta de permissão das credenciais da loja (erro ${status}). ${final} Faça o estorno pelo site ou app do Mercado Pago e depois toque em “Conferir pagamento” aqui.`;
  }
  if (status >= 500) return `O Mercado Pago está com problemas agora (erro ${status}). Tente de novo mais tarde. ${final}`;
  return `O Mercado Pago não aceitou o estorno (erro ${status}${detalhe ? `: ${detalhe}` : ""}). Pode faltar saldo disponível na conta ou o prazo para estorno ter passado. ${final}`;
}

/** O administrador já tratou o alerta: some do destaque e fica no histórico. */
export async function resolverAlerta(numero: unknown): Promise<Resultado> {
  const admin = await administradorDaAcao();
  if (!admin) return { ok: false, erro: SEM_PERMISSAO };
  const n = numeroDoPedido(numero);
  if (!n) return { ok: false, erro: NAO_ENCONTRADO };

  const resultado = await prisma.$transaction(async (tx) => {
    const travado = await travar(tx, n);
    if (!travado) return NAO_ENCONTRADO;
    const { alerta } = await tx.pedido.findUniqueOrThrow({ where: { id: travado.id }, select: { alerta: true } });
    if (!alerta) return null;
    await tx.pedido.update({ where: { id: travado.id }, data: { alerta: null } });
    await registrar(tx, travado.id, `Alerta marcado como resolvido: ${alerta}`, admin.nome);
    return null;
  });
  refresh();
  if (resultado) return { ok: false, erro: resultado };
  return { ok: true, mensagem: "Alerta resolvido. Ele continua no histórico do pedido." };
}
