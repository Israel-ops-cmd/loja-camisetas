"use server";

import { createHash } from "node:crypto";

import { headers } from "next/headers";
import { z } from "zod";

import {
  LIMITE_DE_ENVIOS_POR_HORA,
  QUANTIDADE_MAXIMA_DO_ORCAMENTO,
  rotulosDeTipoDePeca,
} from "@/lib/orcamento-regras";
import { enviarDepois } from "@/lib/emails/envio";
import { emailsDeOrcamento, urlDoSite } from "@/lib/emails/eventos";
import { prisma } from "@/lib/prisma";
import { apenasDigitos, telefoneValido, UFS } from "@/lib/validacao-br";

// Formulário público (sem login). Proteções contra robôs de spam:
// um campo escondido que pessoas não veem e um limite de envios por IP.
// O IP não é guardado: só um hash dele, para contar os envios.

export type ResultadoDoOrcamento =
  | { ok: true; numero: number | null }
  | { ok: false; erro: string; campos?: Record<string, string> };

function hojeEmSaoPaulo() {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "America/Sao_Paulo" }).format(new Date());
}

const texto = (minimo: number, maximo: number, mensagem: string) =>
  z.string().trim().min(minimo, mensagem).max(maximo, "Texto longo demais.");

const esquema = z.object({
  nome: texto(2, 100, "Informe seu nome."),
  empresa: z.string().trim().max(100, "Texto longo demais.").optional(),
  email: z.string().trim().toLowerCase().pipe(z.email("Confira o e-mail.")),
  telefone: z.string().refine(telefoneValido, "WhatsApp inválido. Use DDD + número."),
  cidade: texto(2, 100, "Informe a cidade."),
  uf: z.enum(UFS, "Escolha o estado."),
  tipoDePeca: z.enum(["LISA", "ESTAMPA_DA_CASA", "PERSONALIZADA", "NAO_SEI"], "Escolha o tipo de peça."),
  quantidade: z
    .number("Informe a quantidade.")
    .int("Use um número inteiro.")
    .min(1, "Informe a quantidade.")
    .max(QUANTIDADE_MAXIMA_DO_ORCAMENTO, "Quantidade alta demais para este formulário. Fale com a gente."),
  prazoDesejado: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Data inválida.")
    .refine((d) => d >= hojeEmSaoPaulo(), "Escolha uma data a partir de hoje.")
    .optional(),
  mensagem: z.string().trim().max(2000, "Texto longo demais (máximo de 2.000 caracteres).").optional(),
  /** Campo escondido: pessoas deixam vazio, robôs preenchem. */
  site: z.string().optional(),
});

export type DadosDoOrcamento = z.input<typeof esquema>;

async function hashDoIp() {
  const cabecalhos = await headers();
  const ip =
    cabecalhos.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    cabecalhos.get("x-real-ip") ||
    "desconhecido";
  return createHash("sha256").update(`carta-viva:orcamento:${ip}`).digest("hex");
}

export async function enviarOrcamento(dados: unknown): Promise<ResultadoDoOrcamento> {
  const validacao = esquema.safeParse(dados);
  if (!validacao.success) {
    const campos: Record<string, string> = {};
    for (const problema of validacao.error.issues) campos[String(problema.path[0])] ??= problema.message;
    return { ok: false, erro: "Confira os campos destacados.", campos };
  }
  const d = validacao.data;

  // Robô: responde como se tivesse dado certo, sem gravar nada.
  if (d.site) return { ok: true, numero: null };

  const ipHash = await hashDoIp();
  const recentes = await prisma.orcamento.count({
    where: { ipHash, criadoEm: { gt: new Date(Date.now() - 60 * 60 * 1000) } },
  });
  if (recentes >= LIMITE_DE_ENVIOS_POR_HORA) {
    return {
      ok: false,
      erro: "Recebemos vários pedidos de orçamento deste aparelho agora há pouco. Aguarde alguns minutos e tente de novo.",
    };
  }

  // Confirmação para quem pediu e aviso para a loja, na mesma transação.
  const site = await urlDoSite();
  const emails: string[] = [];
  const orcamento = await prisma.$transaction(async (tx) => {
    const criado = await tx.orcamento.create({
      data: {
        nome: d.nome,
        empresa: d.empresa || null,
        email: d.email,
        telefone: apenasDigitos(d.telefone),
        cidade: d.cidade,
        uf: d.uf,
        tipoDePeca: d.tipoDePeca,
        quantidade: d.quantidade,
        prazoDesejado: d.prazoDesejado ? new Date(`${d.prazoDesejado}T12:00:00Z`) : null,
        mensagem: d.mensagem || null,
        ipHash,
      },
    });
    emails.push(...(await emailsDeOrcamento(tx, { ...criado, tipoDePeca: rotulosDeTipoDePeca[criado.tipoDePeca] }, site)));
    return criado;
  });
  enviarDepois(emails);

  return { ok: true, numero: orcamento.numero };
}
