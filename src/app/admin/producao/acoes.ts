"use server";

import { refresh } from "next/cache";
import { z } from "zod";

import { STATUS_ESPERANDO_ENVIO } from "@/lib/estoque-regras";
import { registrar } from "@/lib/pagamento";
import { administradorDaAcao, SEM_PERMISSAO } from "@/lib/painel";
import { detalheDoItem } from "@/lib/pedidos";
import { prisma } from "@/lib/prisma";

export type Resultado = { ok: true; mensagem: string } | { ok: false; erro: string };

/**
 * Marca as peças de um item como estampadas. Se o pedido for cancelado
 * depois, elas voltam como peças prontas da arte (não como lisas).
 */
export async function marcarEstampadas(itemId: unknown): Promise<Resultado> {
  const admin = await administradorDaAcao();
  if (!admin) return { ok: false, erro: SEM_PERMISSAO };
  if (typeof itemId !== "string" || !z.uuid().safeParse(itemId).success) {
    return { ok: false, erro: "Item não encontrado. Recarregue a página." };
  }

  const resultado = await prisma.$transaction(async (tx) => {
    const item = await tx.itemPedido.findUnique({
      where: { id: itemId },
      select: { pedidoId: true, quantidadeDaLisa: true, nomeProduto: true, nomeModelo: true, nomeCor: true, nomeTamanho: true },
    });
    if (!item) return null;
    const { count } = await tx.itemPedido.updateMany({
      where: {
        id: itemId,
        estampar: true,
        estampadoEm: null,
        quantidadeDaLisa: { gt: 0 },
        pedido: { status: { in: STATUS_ESPERANDO_ENVIO } },
      },
      data: { estampadoEm: new Date() },
    });
    if (count === 0) return { mudou: true as const };
    const pecas = item.quantidadeDaLisa === 1 ? "1 peça estampada" : `${item.quantidadeDaLisa} peças estampadas`;
    await registrar(tx, item.pedidoId, `${pecas}: ${item.nomeProduto} (${detalheDoItem(item)}).`, admin.nome);
    return { pecas };
  });

  if (!resultado) return { ok: false, erro: "Item não encontrado. Recarregue a página." };
  refresh();
  if ("mudou" in resultado) {
    return { ok: false, erro: "Esse item já foi marcado ou o pedido mudou de situação. A página foi atualizada." };
  }
  return { ok: true, mensagem: `${resultado.pecas[0].toUpperCase()}${resultado.pecas.slice(1)}.` };
}
