import "server-only";

import { cache } from "react";

import type { FaixaDeDesconto } from "@/lib/atacado-regras";
import { prisma } from "@/lib/prisma";

/** Faixas ativas, da menor para a maior quantidade. Uma consulta por requisição. */
export const listarFaixasDeAtacado = cache(async (): Promise<FaixaDeDesconto[]> => {
  return prisma.faixaAtacado.findMany({
    where: { ativo: true, percentual: { gt: 0 } },
    orderBy: { minimoDePecas: "asc" },
    select: { minimoDePecas: true, percentual: true },
  });
});
