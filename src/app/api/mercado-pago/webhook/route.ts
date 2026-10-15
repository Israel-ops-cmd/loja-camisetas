import { NextResponse, type NextRequest } from "next/server";

import {
  assinaturaValida,
  ErroMercadoPago,
  NaoEncontradoNoMercadoPago,
} from "@/lib/mercado-pago";
import { processarPagamento } from "@/lib/pagamento";

/**
 * Avisos do Mercado Pago. Só aceita avisos com assinatura válida e nunca usa
 * os dados do aviso: o pagamento é lido de novo na API.
 * Precisa responder 200/201 em até 22 s; erro faz o Mercado Pago tentar de novo.
 */
export async function POST(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const corpo = (await request.json().catch(() => null)) as {
    type?: string;
    data?: { id?: string | number };
  } | null;

  const tipo = searchParams.get("type") ?? corpo?.type ?? null;
  const idDoRecurso = searchParams.get("data.id") ?? (corpo?.data?.id != null ? String(corpo.data.id) : null);

  const valida = assinaturaValida({
    assinatura: request.headers.get("x-signature"),
    idDaRequisicao: request.headers.get("x-request-id"),
    idDoRecurso,
  });
  if (!valida) {
    console.error("[webhook] assinatura inválida", { tipo, idDoRecurso });
    return NextResponse.json({ erro: "assinatura inválida" }, { status: 401 });
  }

  // Outros avisos (merchant_order etc.) não interessam: confirma e ignora.
  if (tipo !== "payment" || !idDoRecurso) {
    return NextResponse.json({ ok: true });
  }

  try {
    await processarPagamento(idDoRecurso);
    console.info(`[webhook] pagamento ${idDoRecurso} processado`);
    return NextResponse.json({ ok: true });
  } catch (erro) {
    // Pagamento que não existe (ex.: "Simular notificação" do painel): não
    // adianta reenviar, então confirma o recebimento e só registra.
    if (erro instanceof NaoEncontradoNoMercadoPago) {
      console.warn(`[webhook] pagamento ${idDoRecurso} não existe no Mercado Pago; aviso ignorado`);
      return NextResponse.json({ ok: true, ignorado: "pagamento inexistente" });
    }
    console.error(`[webhook] falha ao processar o pagamento ${idDoRecurso}:`, erro);
    // 500 faz o Mercado Pago reenviar mais tarde.
    const status = erro instanceof ErroMercadoPago ? 502 : 500;
    return NextResponse.json({ erro: "falha ao processar" }, { status });
  }
}
