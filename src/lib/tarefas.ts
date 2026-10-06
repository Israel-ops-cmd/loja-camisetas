import "server-only";

import { expirarCobranca } from "@/lib/mercado-pago";
import { conferirPagamentosDoPedido, prazoDePagamento, PRAZO_DE_PAGAMENTO_DIAS, registrar } from "@/lib/pagamento";
import { prisma } from "@/lib/prisma";

// Tarefa diária (Vercel Cron): rede de segurança do webhook e limpeza dos
// pedidos que não foram pagos. Cada pedido é tratado separadamente: um erro
// em um não impede os outros.

const DIA = 24 * 60 * 60 * 1000;

/**
 * Boleto pago no último dia pode levar até 3 dias úteis para compensar. Com
 * pagamento pendente no Mercado Pago, o pedido espera mais estes dias depois
 * do prazo antes de ser cancelado.
 */
export const TOLERANCIA_PARA_COMPENSACAO_DIAS = 5;

/** Situações do Mercado Pago em que o pagamento ainda pode ser aprovado. */
const PAGAMENTO_EM_ANDAMENTO = ["pending", "in_process", "authorized"];

/** Para não estourar o tempo da função se um dia acumular muita coisa. */
const LIMITE_POR_EXECUCAO = 100;

export const MOTIVO_DO_CANCELAMENTO_POR_PRAZO = `O prazo de ${PRAZO_DE_PAGAMENTO_DIAS} dias para pagar terminou.`;

export type ResumoDaTarefa = {
  conferidos: number;
  viraramPagos: number[];
  cancelados: number[];
  esperandoCompensacao: number[];
  erros: { numero: number; erro: string }[];
};

/** Confere no Mercado Pago os pedidos pendentes que já abriram a cobrança. */
async function conferirPendentes(resumo: ResumoDaTarefa) {
  const pendentes = await prisma.pedido.findMany({
    where: { status: "AGUARDANDO_PAGAMENTO", mercadoPagoPreferenciaId: { not: null } },
    orderBy: { criadoEm: "asc" },
    take: LIMITE_POR_EXECUCAO,
    select: { id: true, numero: true },
  });
  for (const pedido of pendentes) {
    try {
      await conferirPagamentosDoPedido(pedido.id);
      resumo.conferidos++;
      const depois = await prisma.pedido.update({
        where: { id: pedido.id },
        data: { pagamentoConferidoEm: new Date() },
        select: { status: true },
      });
      if (depois.status === "PAGO") resumo.viraramPagos.push(pedido.numero);
    } catch (erro) {
      resumo.erros.push({ numero: pedido.numero, erro: erro instanceof Error ? erro.message : String(erro) });
    }
  }
}

/** Cancela os pedidos não pagos cujo prazo terminou (com tolerância para boleto). */
async function cancelarVencidos(resumo: ResumoDaTarefa, agora: Date) {
  const vencidos = await prisma.pedido.findMany({
    where: { status: "AGUARDANDO_PAGAMENTO", criadoEm: { lt: new Date(agora.getTime() - PRAZO_DE_PAGAMENTO_DIAS * DIA) } },
    orderBy: { criadoEm: "asc" },
    take: LIMITE_POR_EXECUCAO,
    select: { id: true, numero: true },
  });

  for (const { id, numero } of vencidos) {
    try {
      const resultado = await prisma.$transaction(async (tx) => {
        // Trava e relê: o pedido pode ter sido pago agora há pouco.
        const [pedido] = await tx.$queryRaw<
          { status: string; criadoEm: Date; mercadoPagoStatus: string | null; mercadoPagoPreferenciaId: string | null }[]
        >`select status, "criadoEm", "mercadoPagoStatus", "mercadoPagoPreferenciaId" from pedidos where id = ${id}::uuid for update`;
        if (!pedido || pedido.status !== "AGUARDANDO_PAGAMENTO") return { tipo: "ignorado" as const };
        // Pagamento com valor diferente: tem alerta e quem decide é o administrador.
        if (pedido.mercadoPagoStatus === "valor_divergente") return { tipo: "ignorado" as const };

        const fimDoPrazo = prazoDePagamento(pedido.criadoEm);
        const emAndamento = PAGAMENTO_EM_ANDAMENTO.includes(pedido.mercadoPagoStatus ?? "");
        if (emAndamento && agora.getTime() < fimDoPrazo.getTime() + TOLERANCIA_PARA_COMPENSACAO_DIAS * DIA) {
          return { tipo: "esperando" as const };
        }

        await tx.pedido.update({
          where: { id },
          data: { status: "CANCELADO", canceladoEm: agora, motivoCancelamento: MOTIVO_DO_CANCELAMENTO_POR_PRAZO },
        });
        await registrar(
          tx,
          id,
          `Cancelado automaticamente: o prazo para pagar terminou em ${fimDoPrazo.toLocaleDateString("pt-BR", { timeZone: "America/Sao_Paulo" })}${emAndamento ? ` e o pagamento pendente não foi compensado em ${TOLERANCIA_PARA_COMPENSACAO_DIAS} dias` : ""}.`,
        );
        return { tipo: "cancelado" as const, preferencia: pedido.mercadoPagoPreferenciaId };
      });

      if (resultado.tipo === "cancelado") {
        resumo.cancelados.push(numero);
        if (resultado.preferencia) await expirarCobranca(resultado.preferencia);
      } else if (resultado.tipo === "esperando") {
        resumo.esperandoCompensacao.push(numero);
      }
    } catch (erro) {
      resumo.erros.push({ numero, erro: erro instanceof Error ? erro.message : String(erro) });
    }
  }
}

export async function executarTarefaDiaria(agora = new Date()): Promise<ResumoDaTarefa> {
  const resumo: ResumoDaTarefa = { conferidos: 0, viraramPagos: [], cancelados: [], esperandoCompensacao: [], erros: [] };
  // Primeiro confere: um pedido pago no último minuto não pode ser cancelado.
  await conferirPendentes(resumo);
  await cancelarVencidos(resumo, agora);
  return resumo;
}
