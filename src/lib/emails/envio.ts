import "server-only";

import { after } from "next/server";

import type { TipoEmail } from "@/generated/prisma/enums";
import { prisma } from "@/lib/prisma";

// Fila de e-mails. O e-mail é gravado na mesma transação do evento (pedido
// pago, prévia enviada...), enviado logo depois da resposta (after) e, se
// falhar, reenviado pela tarefa diária. A chave única impede o mesmo e-mail
// duas vezes, e o Resend recebe a chave como "Idempotency-Key".
// API: https://resend.com/docs/api-reference/emails/send-email

const API_DO_RESEND = "https://api.resend.com/emails";
/** Remetente enquanto não há domínio verificado no Resend. */
const REMETENTE_PADRAO = "Carta Viva <onboarding@resend.dev>";
export const MAXIMO_DE_TENTATIVAS = 3;

type Transacao = Parameters<Parameters<typeof prisma.$transaction>[0]>[0];
type Cliente = Transacao | typeof prisma;

export type ConteudoDoEmail = { assunto: string; html: string; texto: string };

/** E-mail da loja (avisos internos). Sem ele, os avisos para a loja não são gerados. */
export function emailDaLoja() {
  return process.env.EMAIL_DA_LOJA?.trim() || null;
}

/**
 * Coloca o e-mail na fila (dentro da transação do evento, quando houver).
 * Devolve a chave, para enviar depois do commit com `enviarDepois`.
 * Se a chave já existe, nada muda: o e-mail já foi gerado antes.
 */
export async function registrarEmail(
  cliente: Cliente,
  dados: { tipo: TipoEmail; chave: string; para: string } & ConteudoDoEmail,
) {
  await cliente.email.createMany({
    data: [
      {
        tipo: dados.tipo,
        chave: dados.chave,
        destinatario: dados.para,
        assunto: dados.assunto,
        html: dados.html,
        texto: dados.texto,
      },
    ],
    skipDuplicates: true,
  });
  return dados.chave;
}

/** Envia os e-mails da fila depois da resposta (não atrasa quem clicou). */
export function enviarDepois(chaves: string[]) {
  if (chaves.length === 0) return;
  try {
    after(() => enviarEmails(chaves));
  } catch {
    // Fora de uma requisição (ex.: script): envia agora, sem esperar.
    void enviarEmails(chaves);
  }
}

async function chamarResend(email: { chave: string; destinatario: string; assunto: string; html: string; texto: string }) {
  const chave = process.env.RESEND_API_KEY?.trim();
  if (!chave) return { ok: false as const, semChave: true, erro: "RESEND_API_KEY não configurada" };

  // Modo de teste: tudo vai para um endereço só, com o destinatário real no assunto.
  const teste = process.env.EMAIL_DESTINO_TESTE?.trim();
  const para = teste || email.destinatario;
  const assunto = teste ? `[teste para ${email.destinatario}] ${email.assunto}` : email.assunto;
  const responderPara = process.env.EMAIL_RESPONDER_PARA?.trim() || emailDaLoja();

  try {
    const resposta = await fetch(API_DO_RESEND, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${chave}`,
        "Content-Type": "application/json",
        "Idempotency-Key": email.chave.slice(0, 256),
      },
      body: JSON.stringify({
        from: process.env.EMAIL_REMETENTE?.trim() || REMETENTE_PADRAO,
        to: [para],
        subject: assunto,
        html: email.html,
        text: email.texto,
        ...(responderPara && { reply_to: responderPara }),
      }),
      signal: AbortSignal.timeout(10_000),
      cache: "no-store",
    });
    const corpo = await resposta.text();
    if (!resposta.ok) return { ok: false as const, semChave: false, erro: `HTTP ${resposta.status}: ${corpo.slice(0, 300)}` };
    const id = (JSON.parse(corpo) as { id?: string }).id ?? null;
    return { ok: true as const, id };
  } catch (erro) {
    return { ok: false as const, semChave: false, erro: erro instanceof Error ? erro.message : String(erro) };
  }
}

/** Envia os e-mails pendentes destas chaves. Seguro de repetir. */
export async function enviarEmails(chaves: string[]) {
  const emails = await prisma.email.findMany({
    where: { chave: { in: chaves }, status: { not: "ENVIADO" }, tentativas: { lt: MAXIMO_DE_TENTATIVAS } },
  });
  let enviados = 0;
  for (const email of emails) {
    const r = await chamarResend(email);
    if (r.ok) {
      enviados++;
      await prisma.email.update({
        where: { id: email.id },
        data: { status: "ENVIADO", enviadoEm: new Date(), idNoServico: r.id, erro: null, tentativas: { increment: 1 } },
      });
    } else if (r.semChave) {
      // Sem chave não conta tentativa: o e-mail sai quando a chave for configurada.
      console.error(`[e-mail] ${email.tipo} não enviado: ${r.erro}`);
      await prisma.email.update({ where: { id: email.id }, data: { erro: r.erro } });
    } else {
      console.error(`[e-mail] ${email.tipo} para ${email.destinatario} falhou: ${r.erro}`);
      await prisma.email.update({
        where: { id: email.id },
        data: { status: "FALHOU", erro: r.erro, tentativas: { increment: 1 } },
      });
    }
  }
  return enviados;
}

/**
 * Para a tarefa diária: reenvia o que ficou pendente ou falhou nos últimos
 * 3 dias (e-mail mais velho que isso já perdeu o sentido).
 */
export async function reenviarEmailsAtrasados() {
  const agora = Date.now();
  const atrasados = await prisma.email.findMany({
    where: {
      criadoEm: { gt: new Date(agora - 3 * 24 * 60 * 60 * 1000) },
      tentativas: { lt: MAXIMO_DE_TENTATIVAS },
      OR: [{ status: "FALHOU" }, { status: "PENDENTE", criadoEm: { lt: new Date(agora - 10 * 60 * 1000) } }],
    },
    select: { chave: true },
    take: 200,
  });
  return { tentados: atrasados.length, enviados: await enviarEmails(atrasados.map((e) => e.chave)) };
}
