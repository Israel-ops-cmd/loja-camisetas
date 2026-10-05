import "server-only";

import { STATUS_ESPERANDO_ENVIO } from "@/lib/estoque-regras";
import { prisma } from "@/lib/prisma";

/** Peças pagas que ainda estão na loja, por variação (id → quantidade). */
export async function pecasEsperandoEnvio(variacaoIds: string[]) {
  if (variacaoIds.length === 0) return new Map<string, number>();
  const grupos = await prisma.itemPedido.groupBy({
    by: ["variacaoId"],
    where: { variacaoId: { in: variacaoIds }, pedido: { status: { in: STATUS_ESPERANDO_ENVIO } } },
    _sum: { quantidade: true },
  });
  return new Map(grupos.map((g) => [g.variacaoId, g._sum.quantidade ?? 0]));
}
