import "server-only";

import { prisma } from "@/lib/prisma";
import {
  buscarPagamento,
  buscarPagamentosDoPedido,
  type PagamentoMercadoPago,
} from "@/lib/mercado-pago";

/** Prazo para pagar o pedido. A cobrança vence junto (Pix e boleto inclusive). */
export const PRAZO_DE_PAGAMENTO_DIAS = 3;
/** Parcelas no cartão (juros por conta do comprador). */
export const MAXIMO_DE_PARCELAS = 6;

export function prazoDePagamento(criadoEm: Date) {
  return new Date(criadoEm.getTime() + PRAZO_DE_PAGAMENTO_DIAS * 24 * 60 * 60 * 1000);
}

const FORMAS: Record<string, string> = {
  credit_card: "Cartão de crédito",
  debit_card: "Cartão de débito",
  bank_transfer: "Pix",
  ticket: "Boleto",
  account_money: "Saldo Mercado Pago",
};

/**
 * Aplica ao pedido a situação de um pagamento do Mercado Pago.
 * O pagamento é sempre lido da API (nunca do aviso recebido) e a função pode
 * rodar várias vezes para o mesmo pagamento sem efeito repetido.
 *
 * - approved: confere valor e moeda, baixa o estoque e marca o pedido como PAGO.
 *   Se faltar estoque, o pedido fica PAGO com alerta para o administrador decidir.
 * - pending / in_process / rejected / cancelled: só registra a situação.
 * - refunded / charged_back de um pedido pago: cancela e devolve o estoque.
 */
export async function processarPagamento(idDoPagamento: string) {
  return aplicar(await buscarPagamento(idDoPagamento));
}

/** Usado na volta do cliente: confere todos os pagamentos do pedido. */
export async function conferirPagamentosDoPedido(pedidoId: string) {
  const pagamentos = await buscarPagamentosDoPedido(pedidoId);
  // Do mais antigo para o mais recente, para a última situação prevalecer.
  for (const pagamento of pagamentos.reverse()) await aplicar(pagamento);
}

async function aplicar(pagamento: PagamentoMercadoPago) {
  const pedidoId = pagamento.external_reference;
  if (!pedidoId || !/^[0-9a-f-]{36}$/i.test(pedidoId)) return;

  await prisma.$transaction(async (tx) => {
    // Trava a linha do pedido: dois avisos ao mesmo tempo esperam um pelo outro.
    const travado = await tx.$queryRaw<{ id: string }[]>`
      select id from pedidos where id = ${pedidoId}::uuid for update`;
    if (travado.length === 0) {
      console.error(`[pagamento] ${pagamento.id}: pedido ${pedidoId} não existe`);
      return;
    }

    const pedido = await tx.pedido.findUniqueOrThrow({
      where: { id: pedidoId },
      include: { itens: true },
    });
    const idDoPagamento = String(pagamento.id);
    const status = pagamento.status;

    // Estorno ou contestação de um pedido pago: cancela e devolve o estoque.
    if (status === "refunded" || status === "charged_back") {
      if (pedido.status === "CANCELADO" || pedido.mercadoPagoPagamentoId !== idDoPagamento) {
        return;
      }
      for (const item of pedido.itens) {
        const jaDevolvido = await tx.movimentacaoEstoque.findFirst({
          where: { pedidoId, variacaoId: item.variacaoId, motivo: "CANCELAMENTO" },
        });
        if (jaDevolvido) continue;
        await tx.variacao.update({
          where: { id: item.variacaoId },
          data: { estoque: { increment: item.quantidade } },
        });
        await tx.movimentacaoEstoque.create({
          data: {
            variacaoId: item.variacaoId,
            pedidoId,
            quantidade: item.quantidade,
            motivo: "CANCELAMENTO",
            observacao: `Pagamento ${idDoPagamento} ${status === "refunded" ? "estornado" : "contestado"}`,
          },
        });
      }
      await tx.pedido.update({
        where: { id: pedidoId },
        data: { status: "CANCELADO", mercadoPagoStatus: status },
      });
      return;
    }

    if (status !== "approved") {
      // Um pedido já pago não volta atrás por aviso de outra tentativa.
      if (pedido.status === "AGUARDANDO_PAGAMENTO") {
        await tx.pedido.update({
          where: { id: pedidoId },
          data: { mercadoPagoStatus: status },
        });
      }
      return;
    }

    // Aprovado. Já processado? Nada a fazer.
    if (pedido.mercadoPagoPagamentoId === idDoPagamento) return;

    if (pedido.status !== "AGUARDANDO_PAGAMENTO") {
      // Pagamento aprovado em pedido cancelado ou já pago por outro pagamento.
      await tx.pedido.update({
        where: { id: pedidoId },
        data: {
          alerta: juntarAlerta(
            pedido.alerta,
            `Pagamento ${idDoPagamento} aprovado com o pedido em "${pedido.status}". Verifique e estorne se for o caso.`,
          ),
        },
      });
      return;
    }

    const valorPago = Math.round(pagamento.transaction_amount * 100);
    if (pagamento.currency_id !== "BRL" || valorPago !== pedido.totalEmCentavos) {
      await tx.pedido.update({
        where: { id: pedidoId },
        data: {
          mercadoPagoStatus: "valor_divergente",
          alerta: juntarAlerta(
            pedido.alerta,
            `Pagamento ${idDoPagamento} aprovado com valor ${pagamento.currency_id} ${valorPago / 100}, diferente do total do pedido. Pedido NÃO foi marcado como pago.`,
          ),
        },
      });
      console.error(`[pagamento] valor divergente no pedido ${pedido.numero}`);
      return;
    }

    // Baixa de estoque. Se faltar, o pedido segue pago com alerta (decisão
    // do administrador: produzir ou estornar). O estoque pode ficar negativo,
    // indicando quantas peças faltam.
    const faltas: string[] = [];
    for (const item of pedido.itens) {
      const jaBaixado = await tx.movimentacaoEstoque.findFirst({
        where: { pedidoId, variacaoId: item.variacaoId, motivo: "VENDA" },
      });
      if (jaBaixado) continue;

      const variacao = await tx.variacao.update({
        where: { id: item.variacaoId },
        data: { estoque: { decrement: item.quantidade } },
        select: { estoque: true },
      });
      if (variacao.estoque < 0) {
        faltas.push(`${item.nomeProduto} (${item.nomeCor}, ${item.nomeTamanho}): faltam ${Math.min(-variacao.estoque, item.quantidade)}`);
      }
      await tx.movimentacaoEstoque.create({
        data: {
          variacaoId: item.variacaoId,
          pedidoId,
          quantidade: -item.quantidade,
          motivo: "VENDA",
          observacao: `Pagamento ${idDoPagamento}`,
        },
      });
    }

    await tx.pedido.update({
      where: { id: pedidoId },
      data: {
        status: "PAGO",
        pagoEm: pagamento.date_approved ? new Date(pagamento.date_approved) : new Date(),
        mercadoPagoPagamentoId: idDoPagamento,
        mercadoPagoStatus: status,
        metodoPagamento: FORMAS[pagamento.payment_type_id] ?? pagamento.payment_type_id,
        alerta:
          faltas.length > 0
            ? juntarAlerta(pedido.alerta, `Pago sem estoque suficiente: ${faltas.join("; ")}. Decida entre produzir ou estornar.`)
            : pedido.alerta,
      },
    });
  });
}

function juntarAlerta(atual: string | null, novo: string) {
  return atual ? `${atual}\n${novo}` : novo;
}
