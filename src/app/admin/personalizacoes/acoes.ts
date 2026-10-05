"use server";

import { refresh } from "next/cache";
import { z } from "zod";

import { obterUsuario } from "@/lib/auth";
import { arquivosNoStorage, caminhoNovo, criarEnvioAssinado } from "@/lib/personalizacao";
import {
  extensaoDoArquivo,
  FORMATOS_DE_PREVIA,
  lerPrecoEmCentavos,
  MAXIMO_DE_ARQUIVOS,
  TAMANHO_MAXIMO_BYTES,
} from "@/lib/personalizacao-regras";
import { prisma } from "@/lib/prisma";

// Ações do painel. O layout de /admin não protege Server Actions: cada uma
// confere de novo se quem chama é administrador.

type Resultado = { ok: true } | { ok: false; erro: string };

async function personalizacaoParaAdmin(numero: unknown) {
  const usuario = await obterUsuario();
  if (!usuario?.administrador) return null;
  if (typeof numero !== "number" || !Number.isInteger(numero)) return null;
  return prisma.personalizacao.findUnique({ where: { numero } });
}

export async function prepararEnvioDePrevia(
  numero: unknown,
  arquivo: unknown,
): Promise<{ ok: true; caminho: string; token: string } | { ok: false; erro: string }> {
  const personalizacao = await personalizacaoParaAdmin(numero);
  if (!personalizacao) return { ok: false, erro: "Sem permissão ou pedido não encontrado." };

  const validacao = z
    .object({ nome: z.string().min(1).max(200), tamanho: z.number().int().positive() })
    .safeParse(arquivo);
  if (!validacao.success) return { ok: false, erro: "Arquivo inválido." };
  const { nome, tamanho } = validacao.data;

  if (!(FORMATOS_DE_PREVIA as readonly string[]).includes(extensaoDoArquivo(nome))) {
    return { ok: false, erro: "A prévia precisa ser uma imagem PNG ou JPG." };
  }
  if (tamanho > TAMANHO_MAXIMO_BYTES) return { ok: false, erro: "O arquivo passa de 20 MB." };

  const envio = await criarEnvioAssinado(
    caminhoNovo(personalizacao.clienteId, "previas", nome, personalizacao.id),
  );
  if (!envio) return { ok: false, erro: "Não conseguimos preparar o envio. Tente de novo." };
  return { ok: true, ...envio };
}

const esquemaPrevia = z.object({
  preco: z.string().max(20),
  mensagem: z.string().trim().max(2000, "Texto longo demais.").optional(),
  arquivos: z
    .array(z.object({ caminho: z.string().min(1).max(300), nome: z.string().min(1).max(200) }))
    .min(1, "Envie a imagem da prévia.")
    .max(MAXIMO_DE_ARQUIVOS, `No máximo ${MAXIMO_DE_ARQUIVOS} imagens.`),
});

export async function enviarPrevia(numero: unknown, dados: unknown): Promise<Resultado> {
  const personalizacao = await personalizacaoParaAdmin(numero);
  if (!personalizacao) return { ok: false, erro: "Sem permissão ou pedido não encontrado." };
  if (!["RECEBIDA", "AJUSTE_SOLICITADO", "PREVIA_ENVIADA"].includes(personalizacao.status)) {
    return { ok: false, erro: "Esse pedido não aceita mais prévia." };
  }

  const validacao = esquemaPrevia.safeParse(dados);
  if (!validacao.success) return { ok: false, erro: validacao.error.issues[0].message };
  const { preco, mensagem, arquivos } = validacao.data;

  const precoEmCentavos = lerPrecoEmCentavos(preco);
  if (precoEmCentavos === null || precoEmCentavos <= 0 || precoEmCentavos > 100_000_00) {
    return { ok: false, erro: "Informe o preço por peça, por exemplo 49,90." };
  }

  const pasta = `${personalizacao.clienteId}/previas/${personalizacao.id}/`;
  const caminhos = [...new Set(arquivos.map((a) => a.caminho))];
  if (caminhos.some((c) => !c.startsWith(pasta))) return { ok: false, erro: "Arquivo inválido. Envie de novo." };
  const noStorage = await arquivosNoStorage(caminhos);
  if (noStorage.size !== caminhos.length) {
    return { ok: false, erro: "Alguma imagem não terminou de enviar. Envie de novo." };
  }

  await prisma.$transaction(async (tx) => {
    await tx.personalizacaoArquivo.createMany({
      data: caminhos.map((caminho) => ({
        personalizacaoId: personalizacao.id,
        tipo: "PREVIA" as const,
        caminho,
        nomeOriginal: arquivos.find((a) => a.caminho === caminho)!.nome,
        tamanhoBytes: noStorage.get(caminho)!,
      })),
      skipDuplicates: true,
    });
    if (mensagem) {
      await tx.personalizacaoMensagem.create({
        data: { personalizacaoId: personalizacao.id, autor: "LOJA", texto: mensagem },
      });
    }
    await tx.personalizacao.update({
      where: { id: personalizacao.id },
      data: { status: "PREVIA_ENVIADA", precoUnitarioEmCentavos: precoEmCentavos },
    });
  });

  refresh();
  return { ok: true };
}

export async function cancelarPersonalizacao(numero: unknown, motivo: unknown): Promise<Resultado> {
  const personalizacao = await personalizacaoParaAdmin(numero);
  if (!personalizacao) return { ok: false, erro: "Sem permissão ou pedido não encontrado." };

  const texto = z.string().trim().max(2000).optional().safeParse(motivo);
  if (!texto.success) return { ok: false, erro: "Texto longo demais." };

  const cancelou = await prisma.$transaction(async (tx) => {
    const { count } = await tx.personalizacao.updateMany({
      where: { id: personalizacao.id, status: { notIn: ["CONVERTIDA", "CANCELADA"] } },
      data: { status: "CANCELADA" },
    });
    if (count === 0) return false;
    if (texto.data) {
      await tx.personalizacaoMensagem.create({
        data: { personalizacaoId: personalizacao.id, autor: "LOJA", texto: texto.data },
      });
    }
    return true;
  });
  if (!cancelou) return { ok: false, erro: "Esse pedido já virou pedido de compra ou já foi cancelado." };
  refresh();
  return { ok: true };
}
