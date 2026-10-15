"use server";

import { refresh } from "next/cache";
import { z } from "zod";

import type { Prisma } from "@/generated/prisma/client";
import { lisasEsperandoEnvio, prontasEsperandoEnvio } from "@/lib/estoque";
import {
  descreverEstoque,
  ehCamisetaLisa,
  MOTIVOS_DE_CORRECAO,
  QUANTIDADE_MAXIMA_NO_ESTOQUE,
} from "@/lib/estoque-regras";
import { administradorDaAcao, atualizarPaginasDoCatalogo, SEM_PERMISSAO } from "@/lib/painel";
import { prisma } from "@/lib/prisma";

// Formas de mexer no estoque pelo painel, cada uma com o seu motivo no
// histórico: "chegaram X peças" (ENTRADA, soma), "tem X na prateleira"
// (AJUSTE, grava a diferença) e "estampei X peças" (ESTAMPA, tira das lisas e
// soma às prontas da arte). Valem para as peças lisas (modelo + cor +
// tamanho) e para as prontas de cada arte (variação). Nenhuma deixa o estoque
// negativo; o negativo só aparece quando um pedido é pago sem peça.

export type ResultadoDoEstoque =
  | { ok: true; mensagem: string; estoque: number }
  | { ok: false; erro: string; estoqueAtual?: number };

const NAO_ENCONTRADA = "Não encontramos esta peça. Recarregue a página.";

const quantidade = (minimo: number, rotulo: string) =>
  z
    .number(`Digite ${rotulo} em números.`)
    .int(`Digite ${rotulo} sem vírgula.`)
    .min(minimo, minimo === 1 ? `Digite ${rotulo} (pelo menos 1).` : `A contagem não pode ser negativa.`)
    .max(QUANTIDADE_MAXIMA_NO_ESTOQUE, `Número alto demais. Confira se digitou certo (máximo ${QUANTIDADE_MAXIMA_NO_ESTOQUE.toLocaleString("pt-BR")}).`);

const observacao = z.string().trim().max(200, "Observação longa demais (até 200 letras).").optional();

const esquemaPeca = z.object({ tipo: z.enum(["lisa", "pronta"]), id: z.uuid() });
export type PecaDoEstoque = z.infer<typeof esquemaPeca>;

type Transacao = Prisma.TransactionClient;

/** Trava a linha da peça e devolve o estoque (ou null se não existir). */
async function travar(tx: Transacao, peca: PecaDoEstoque) {
  const linhas =
    peca.tipo === "lisa"
      ? await tx.$queryRaw<{ estoque: number }[]>`select estoque from pecas_lisas where id = ${peca.id}::uuid for update`
      : await tx.$queryRaw<{ estoque: number }[]>`select estoque from variacoes where id = ${peca.id}::uuid for update`;
  return linhas[0]?.estoque ?? null;
}

/** Soma ao estoque da peça e grava o histórico. */
async function mover(tx: Transacao, peca: PecaDoEstoque, n: number, dados: { motivo: "ENTRADA" | "AJUSTE" | "ESTAMPA"; observacao: string | null }) {
  const onde = peca.tipo === "lisa" ? { pecaLisaId: peca.id } : { variacaoId: peca.id };
  const { estoque } =
    peca.tipo === "lisa"
      ? await tx.pecaLisa.update({ where: { id: peca.id }, data: { estoque: { increment: n } }, select: { estoque: true } })
      : await tx.variacao.update({ where: { id: peca.id }, data: { estoque: { increment: n } }, select: { estoque: true } });
  await tx.movimentacaoEstoque.create({ data: { ...onde, quantidade: n, ...dados } });
  return estoque;
}

/** Peças vendidas que ainda estão na prateleira (o contador as vê, o sistema já as tirou). */
async function vendidasNaPrateleira(peca: PecaDoEstoque) {
  const mapa = peca.tipo === "lisa" ? await lisasEsperandoEnvio([peca.id]) : await prontasEsperandoEnvio([peca.id]);
  return mapa.get(peca.id) ?? 0;
}

/** Confere a peça: lisa existe; pronta é de uma arte (camiseta lisa não tem prontas). */
async function pecaValida(dados: unknown): Promise<PecaDoEstoque | null> {
  const validacao = esquemaPeca.safeParse(dados);
  if (!validacao.success) return null;
  const peca = validacao.data;
  if (peca.tipo === "lisa") {
    return (await prisma.pecaLisa.findUnique({ where: { id: peca.id }, select: { id: true } })) ? peca : null;
  }
  const variacao = await prisma.variacao.findUnique({
    where: { id: peca.id },
    select: { produto: { select: { categoria: { select: { slug: true } } } } },
  });
  return variacao && !ehCamisetaLisa(variacao.produto.categoria.slug) ? peca : null;
}

/** Atualiza as páginas da loja que mostram a peça. */
async function atualizarLoja(peca: PecaDoEstoque) {
  const produtos = await prisma.produto.findMany({
    where: peca.tipo === "lisa" ? { variacoes: { some: { pecaLisa: { id: peca.id } } } } : { variacoes: { some: { id: peca.id } } },
    select: { slug: true },
  });
  atualizarPaginasDoCatalogo(...produtos.map((p) => p.slug));
}

/** "Chegaram X peças": soma ao estoque, mesmo que tenha havido venda enquanto isso. */
export async function lancarEntrada(pecaRecebida: unknown, dados: unknown): Promise<ResultadoDoEstoque> {
  if (!(await administradorDaAcao())) return { ok: false, erro: SEM_PERMISSAO };
  const peca = await pecaValida(pecaRecebida);
  if (!peca) return { ok: false, erro: NAO_ENCONTRADA };
  const validacao = z.object({ quantidade: quantidade(1, "quantas peças chegaram"), observacao }).safeParse(dados);
  if (!validacao.success) return { ok: false, erro: validacao.error.issues[0].message };
  const { quantidade: chegaram, observacao: nota } = validacao.data;

  const resultado = await prisma.$transaction(async (tx) => {
    const atual = await travar(tx, peca);
    if (atual === null) return null;
    if (atual + chegaram > QUANTIDADE_MAXIMA_NO_ESTOQUE) return { acima: true as const, estoque: atual };
    return { estoque: await mover(tx, peca, chegaram, { motivo: "ENTRADA", observacao: nota || null }) };
  });
  if (!resultado) return { ok: false, erro: NAO_ENCONTRADA };
  if ("acima" in resultado) {
    return { ok: false, erro: "O estoque passaria do máximo aceito. Confira se digitou certo.", estoqueAtual: resultado.estoque };
  }

  await atualizarLoja(peca);
  refresh();
  return {
    ok: true,
    estoque: resultado.estoque,
    mensagem: `${chegaram === 1 ? "1 peça somada" : `${chegaram} peças somadas`}. Agora: ${descreverEstoque(resultado.estoque)}.`,
  };
}

/**
 * "Tem X na prateleira": grava a contagem e registra a diferença. Se o estoque
 * mudou desde que a tela foi aberta (uma venda, por exemplo), não grava e
 * pede para conferir, para a contagem não apagar a venda.
 */
export async function corrigirContagem(pecaRecebida: unknown, dados: unknown): Promise<ResultadoDoEstoque> {
  if (!(await administradorDaAcao())) return { ok: false, erro: SEM_PERMISSAO };
  const peca = await pecaValida(pecaRecebida);
  if (!peca) return { ok: false, erro: NAO_ENCONTRADA };
  const validacao = z
    .object({
      contado: quantidade(0, "quantas peças tem"),
      estoqueVisto: z.number().int(),
      motivo: z.enum(MOTIVOS_DE_CORRECAO, "Escolha o motivo da correção."),
      observacao,
    })
    .safeParse(dados);
  if (!validacao.success) return { ok: false, erro: validacao.error.issues[0].message };
  const { contado, estoqueVisto, motivo, observacao: nota } = validacao.data;
  if (motivo === "Outro" && !nota) return { ok: false, erro: "Escreva em poucas palavras o motivo da correção." };

  const resultado = await prisma.$transaction(async (tx) => {
    // Trava a linha: uma venda confirmada ao mesmo tempo espera esta correção terminar.
    const atual = await travar(tx, peca);
    if (atual === null) return { tipo: "nao-encontrada" as const };
    if (atual !== estoqueVisto) return { tipo: "mudou" as const, estoque: atual };
    // Peças vendidas que ainda estão na prateleira esperando envio não contam.
    const reservadas = await vendidasNaPrateleira(peca);
    const novoEstoque = contado - reservadas;
    if (novoEstoque < 0) return { tipo: "menos-que-reservadas" as const, reservadas };
    const diferenca = novoEstoque - atual;
    if (diferenca === 0) return { tipo: "igual" as const, estoque: atual };
    const estoque = await mover(tx, peca, diferenca, { motivo: "AJUSTE", observacao: nota ? `${motivo}: ${nota}` : motivo });
    return { tipo: "gravado" as const, estoque, diferenca };
  });

  switch (resultado.tipo) {
    case "nao-encontrada":
      return { ok: false, erro: NAO_ENCONTRADA };
    case "mudou":
      refresh();
      return {
        ok: false,
        estoqueAtual: resultado.estoque,
        erro: `O estoque mudou enquanto você contava (provavelmente uma venda). Agora o sistema mostra ${descreverEstoque(resultado.estoque).toLowerCase()}. Confira a prateleira de novo e salve.`,
      };
    case "menos-que-reservadas":
      return {
        ok: false,
        erro: `Você contou menos peças do que as ${resultado.reservadas} já vendidas que esperam envio. Confira a prateleira de novo. Se faltar peça mesmo, os pedidos pagos precisam ser produzidos ou estornados.`,
      };
    case "igual":
      return { ok: true, estoque: resultado.estoque, mensagem: "A contagem bate com o sistema. Nada mudou." };
    case "gravado":
      await atualizarLoja(peca);
      refresh();
      return {
        ok: true,
        estoque: resultado.estoque,
        mensagem: `Contagem salva (${resultado.diferenca > 0 ? "+" : "−"}${Math.abs(resultado.diferenca)}). Agora: ${descreverEstoque(resultado.estoque)}.`,
      };
  }
}

/**
 * "Estampei X peças com esta arte": tira X peças lisas (mesmo modelo, cor e
 * tamanho) e soma X prontas na arte. Não deixa as lisas negativas.
 */
export async function estamparPecas(variacaoId: unknown, dados: unknown): Promise<ResultadoDoEstoque> {
  if (!(await administradorDaAcao())) return { ok: false, erro: SEM_PERMISSAO };
  const peca = await pecaValida({ tipo: "pronta", id: variacaoId });
  if (!peca) return { ok: false, erro: NAO_ENCONTRADA };
  const validacao = z.object({ quantidade: quantidade(1, "quantas peças você estampou"), observacao }).safeParse(dados);
  if (!validacao.success) return { ok: false, erro: validacao.error.issues[0].message };
  const { quantidade: estampadas, observacao: nota } = validacao.data;

  const variacao = await prisma.variacao.findUniqueOrThrow({
    where: { id: peca.id },
    select: { pecaLisa: { select: { id: true } }, produto: { select: { nome: true } } },
  });
  const lisa: PecaDoEstoque = { tipo: "lisa", id: variacao.pecaLisa.id };

  const resultado = await prisma.$transaction(async (tx) => {
    // Mesma ordem da baixa por venda (variação, depois lisa), para não haver impasse.
    const prontas = await travar(tx, peca);
    const lisas = await travar(tx, lisa);
    if (prontas === null || lisas === null) return null;
    if (estampadas > lisas) return { faltam: true as const, lisas };
    if (prontas + estampadas > QUANTIDADE_MAXIMA_NO_ESTOQUE) return { acima: true as const, estoque: prontas };
    const texto = nota || null;
    await mover(tx, lisa, -estampadas, { motivo: "ESTAMPA", observacao: `Estampadas com “${variacao.produto.nome}”${texto ? `: ${texto}` : ""}` });
    return { estoque: await mover(tx, peca, estampadas, { motivo: "ESTAMPA", observacao: texto }) };
  });
  if (!resultado) return { ok: false, erro: NAO_ENCONTRADA };
  if ("faltam" in resultado) {
    const lisas = resultado.lisas ?? 0;
    return {
      ok: false,
      erro:
        lisas <= 0
          ? "O sistema não tem peças lisas desse modelo, cor e tamanho. Lance a entrada das lisas antes (aba Peças lisas)."
          : `O sistema só tem ${lisas === 1 ? "1 peça lisa" : `${lisas} peças lisas`} desse modelo, cor e tamanho. Confira a contagem das lisas antes.`,
    };
  }
  if ("acima" in resultado) {
    return { ok: false, erro: "O estoque passaria do máximo aceito. Confira se digitou certo.", estoqueAtual: resultado.estoque };
  }

  await atualizarLoja(peca);
  refresh();
  return {
    ok: true,
    estoque: resultado.estoque,
    mensagem: `${estampadas === 1 ? "1 peça lisa virou pronta" : `${estampadas} peças lisas viraram prontas`}. Agora a arte tem ${resultado.estoque === 1 ? "1 peça pronta" : `${resultado.estoque} peças prontas`}.`,
  };
}
