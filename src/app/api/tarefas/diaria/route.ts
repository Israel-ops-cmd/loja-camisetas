import { timingSafeEqual } from "node:crypto";

import { NextResponse, type NextRequest } from "next/server";

import { executarTarefaDiaria } from "@/lib/tarefas";

// Chamada uma vez por dia pela Vercel (vercel.json > crons). A Vercel manda o
// cabeçalho "Authorization: Bearer <CRON_SECRET>"; sem ele, nada roda.
export const maxDuration = 60;

function autorizado(cabecalho: string | null) {
  const segredo = process.env.CRON_SECRET;
  if (!segredo || segredo.length < 16 || !cabecalho) return false;
  const esperado = Buffer.from(`Bearer ${segredo}`);
  const recebido = Buffer.from(cabecalho);
  return esperado.length === recebido.length && timingSafeEqual(esperado, recebido);
}

export async function GET(request: NextRequest) {
  if (!process.env.CRON_SECRET) {
    console.error("[tarefa diária] CRON_SECRET não definido: a tarefa não roda sem ele.");
  }
  if (!autorizado(request.headers.get("authorization"))) {
    return NextResponse.json({ erro: "não autorizado" }, { status: 401 });
  }

  const inicio = Date.now();
  const resumo = await executarTarefaDiaria();
  const resultado = { ...resumo, segundos: Math.round((Date.now() - inicio) / 100) / 10 };
  console.log("[tarefa diária]", JSON.stringify(resultado));
  return NextResponse.json(resultado, { status: resumo.erros.length > 0 ? 500 : 200 });
}
