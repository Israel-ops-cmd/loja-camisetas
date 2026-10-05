"use server";

import { refresh } from "next/cache";
import { z } from "zod";

import {
  descreverEstoque,
  MOTIVOS_DE_CORRECAO,
  QUANTIDADE_MAXIMA_NO_ESTOQUE,
  STATUS_ESPERANDO_ENVIO,
} from "@/lib/estoque-regras";
import { administradorDaAcao, atualizarPaginasDoCatalogo, SEM_PERMISSAO } from "@/lib/painel";
import { prisma } from "@/lib/prisma";

// Duas formas de mexer no estoque pelo painel, cada uma com o seu motivo no
// histórico: "chegaram X peças" (ENTRADA, soma) e "tem X na prateleira"
// (AJUSTE, grava a diferença). Nenhuma deixa o estoque negativo; o negativo
// só aparece quando um pedido é pago sem peça (opção C).

export type ResultadoDoEstoque =
  | { ok: true; mensagem: string; estoque: number }
  | { ok: false; erro: string; estoqueAtual?: number };

const NAO_ENCONTRADA = "Não encontramos este tamanho. Recarregue a página.";

const quantidade = (minimo: number, rotulo: string) =>
  z
    .number(`Digite ${rotulo} em números.`)
    .int(`Digite ${rotulo} sem vírgula.`)
    .min(minimo, minimo === 1 ? `Digite quantas peças chegaram (pelo menos 1).` : `A contagem não pode ser negativa.`)
    .max(QUANTIDADE_MAXIMA_NO_ESTOQUE, `Número alto demais. Confira se digitou certo (máximo ${QUANTIDADE_MAXIMA_NO_ESTOQUE.toLocaleString("pt-BR")}).`);

const observacao = z.string().trim().max(200, "Observação longa demais (até 200 letras).").optional();

type Transacao = Parameters<Parameters<typeof prisma.$transaction>[0]>[0];

/** Peças já pagas (estoque já baixado) que ainda não saíram da loja. */
async function pecasEsperandoEnvio(tx: Transacao, vid: string) {
  const soma = await tx.itemPedido.aggregate({
    where: { variacaoId: vid, pedido: { status: { in: STATUS_ESPERANDO_ENVIO } } },
    _sum: { quantidade: true },
  });
  return soma._sum.quantidade ?? 0;
}

function variacaoId(id: unknown) {
  return typeof id === "string" && z.uuid().safeParse(id).success ? id : null;
}

/** "Chegaram X peças": soma ao estoque, mesmo que tenha havido venda enquanto isso. */
export async function lancarEntrada(id: unknown, dados: unknown): Promise<ResultadoDoEstoque> {
  if (!(await administradorDaAcao())) return { ok: false, erro: SEM_PERMISSAO };
  const vid = variacaoId(id);
  if (!vid) return { ok: false, erro: NAO_ENCONTRADA };
  const validacao = z.object({ quantidade: quantidade(1, "quantas peças chegaram"), observacao }).safeParse(dados);
  if (!validacao.success) return { ok: false, erro: validacao.error.issues[0].message };
  const { quantidade: chegaram, observacao: nota } = validacao.data;

  const resultado = await prisma.$transaction(async (tx) => {
    const atual = await tx.variacao.findUnique({ where: { id: vid }, select: { estoque: true } });
    if (!atual) return null;
    if (atual.estoque + chegaram > QUANTIDADE_MAXIMA_NO_ESTOQUE) return { acima: true as const, estoque: atual.estoque };
    const variacao = await tx.variacao.update({
      where: { id: vid },
      data: { estoque: { increment: chegaram } },
      select: { estoque: true, produto: { select: { slug: true } } },
    });
    await tx.movimentacaoEstoque.create({
      data: { variacaoId: vid, quantidade: chegaram, motivo: "ENTRADA", observacao: nota || null },
    });
    return variacao;
  });
  if (!resultado) return { ok: false, erro: NAO_ENCONTRADA };
  if ("acima" in resultado) {
    return { ok: false, erro: "O estoque passaria do máximo aceito. Confira se digitou certo.", estoqueAtual: resultado.estoque };
  }

  atualizarPaginasDoCatalogo(resultado.produto.slug);
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
export async function corrigirContagem(id: unknown, dados: unknown): Promise<ResultadoDoEstoque> {
  if (!(await administradorDaAcao())) return { ok: false, erro: SEM_PERMISSAO };
  const vid = variacaoId(id);
  if (!vid) return { ok: false, erro: NAO_ENCONTRADA };
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
    const [atual] = await tx.$queryRaw<{ estoque: number }[]>`
      select estoque from variacoes where id = ${vid}::uuid for update`;
    if (!atual) return { tipo: "nao-encontrada" as const };
    if (atual.estoque !== estoqueVisto) return { tipo: "mudou" as const, estoque: atual.estoque };
    // Peças vendidas que ainda estão na prateleira esperando envio não contam.
    const reservadas = await pecasEsperandoEnvio(tx, vid);
    const novoEstoque = contado - reservadas;
    if (novoEstoque < 0) return { tipo: "menos-que-reservadas" as const, reservadas };
    const diferenca = novoEstoque - atual.estoque;
    if (diferenca === 0) return { tipo: "igual" as const, estoque: atual.estoque };
    const variacao = await tx.variacao.update({
      where: { id: vid },
      data: { estoque: novoEstoque },
      select: { estoque: true, produto: { select: { slug: true } } },
    });
    await tx.movimentacaoEstoque.create({
      data: { variacaoId: vid, quantidade: diferenca, motivo: "AJUSTE", observacao: nota ? `${motivo}: ${nota}` : motivo },
    });
    return { tipo: "gravado" as const, estoque: variacao.estoque, slug: variacao.produto.slug, diferenca };
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
      atualizarPaginasDoCatalogo(resultado.slug);
      refresh();
      return {
        ok: true,
        estoque: resultado.estoque,
        mensagem: `Contagem salva (${resultado.diferenca > 0 ? "+" : "−"}${Math.abs(resultado.diferenca)}). Agora: ${descreverEstoque(resultado.estoque)}.`,
      };
  }
}
