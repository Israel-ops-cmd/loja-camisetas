"use server";

import { refresh } from "next/cache";
import { z } from "zod";

import { obterUsuario } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// O layout de /admin não protege Server Actions: confere de novo aqui.

const esquema = z.object({
  status: z.enum(["NOVO", "EM_CONTATO", "FECHADO", "SEM_RETORNO"], "Situação inválida."),
  anotacoes: z.string().trim().max(5000, "Anotações longas demais.").optional(),
});

export async function atualizarOrcamento(
  numero: unknown,
  dados: unknown,
): Promise<{ ok: true } | { ok: false; erro: string }> {
  const usuario = await obterUsuario();
  if (!usuario?.administrador) return { ok: false, erro: "Sem permissão." };
  if (typeof numero !== "number" || !Number.isInteger(numero)) return { ok: false, erro: "Orçamento inválido." };

  const validacao = esquema.safeParse(dados);
  if (!validacao.success) return { ok: false, erro: validacao.error.issues[0].message };

  const { count } = await prisma.orcamento.updateMany({
    where: { numero },
    data: { status: validacao.data.status, anotacoes: validacao.data.anotacoes || null },
  });
  if (count === 0) return { ok: false, erro: "Orçamento não encontrado." };
  refresh();
  return { ok: true };
}
