import "server-only";

import { cookies } from "next/headers";

import {
  escreverCookieDoCarrinho,
  lerCookieDoCarrinho,
  NOME_COOKIE_CARRINHO,
  type ItemDoCookie,
} from "@/lib/carrinho-cookie";
import { prisma } from "@/lib/prisma";

const TRINTA_DIAS = 60 * 60 * 24 * 30;

export async function lerItensDoCarrinho() {
  const loja = await cookies();
  return lerCookieDoCarrinho(loja.get(NOME_COOKIE_CARRINHO)?.value);
}

/** Só funciona em Server Actions e Route Handlers. */
export async function gravarItensDoCarrinho(itens: ItemDoCookie[]) {
  const loja = await cookies();
  const valor = escreverCookieDoCarrinho(itens);

  if (!valor) {
    loja.delete(NOME_COOKIE_CARRINHO);
    return;
  }

  loja.set(NOME_COOKIE_CARRINHO, valor, {
    path: "/",
    maxAge: TRINTA_DIAS,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    // Legível no navegador para o contador do cabeçalho. Não há risco:
    // o cookie só tem IDs e quantidades, e tudo é conferido no servidor.
    httpOnly: false,
  });
}

/** Variação vendável (ativa, de produto ativo) com o estoque atual. */
export async function obterVariacaoVendavel(variacaoId: string) {
  return prisma.variacao.findFirst({
    where: { id: variacaoId, ativo: true, produto: { ativo: true } },
    select: { id: true, estoque: true },
  });
}

export type ItemDoCarrinho = {
  variacaoId: string;
  quantidade: number;
  /** Estoque atual da variação. */
  estoque: number;
  esgotado: boolean;
  precoUnitarioEmCentavos: number;
  subtotalEmCentavos: number;
  produto: { nome: string; slug: string };
  cor: { nome: string; hex: string };
  tamanho: string;
  foto: { url: string; alt: string } | null;
};

export type Carrinho = {
  itens: ItemDoCarrinho[];
  /** Peças que entram no total (sem as esgotadas). */
  quantidadeDePecas: number;
  subtotalEmCentavos: number;
  /** Mensagens sobre correções feitas no carrinho. */
  avisos: string[];
  /** O cookie tem itens removidos ou quantidades acima do estoque. */
  precisaSincronizar: boolean;
};

/**
 * Junta o cookie com o banco e corrige o que mudou desde que o item foi
 * adicionado: variação desativada sai, quantidade acima do estoque é reduzida
 * e item esgotado fica marcado, fora do total.
 */
export async function obterCarrinho(): Promise<Carrinho> {
  const itensDoCookie = await lerItensDoCarrinho();
  if (itensDoCookie.length === 0) {
    return {
      itens: [],
      quantidadeDePecas: 0,
      subtotalEmCentavos: 0,
      avisos: [],
      precisaSincronizar: false,
    };
  }

  const variacoes = await prisma.variacao.findMany({
    where: {
      id: { in: itensDoCookie.map((item) => item.variacaoId) },
      ativo: true,
      produto: { ativo: true },
    },
    select: {
      id: true,
      estoque: true,
      precoEmCentavos: true,
      corId: true,
      cor: { select: { nome: true, hex: true } },
      tamanho: { select: { nome: true } },
      produto: {
        select: {
          nome: true,
          slug: true,
          precoBaseEmCentavos: true,
          imagens: {
            orderBy: { ordem: "asc" },
            select: { url: true, alt: true, corId: true },
          },
        },
      },
    },
  });
  const porId = new Map(variacoes.map((v) => [v.id, v]));

  const itens: ItemDoCarrinho[] = [];
  const avisos: string[] = [];
  let precisaSincronizar = false;

  for (const { variacaoId, quantidade } of itensDoCookie) {
    const variacao = porId.get(variacaoId);
    if (!variacao) {
      avisos.push(
        "Um item saiu do carrinho porque não está mais disponível na loja.",
      );
      precisaSincronizar = true;
      continue;
    }

    const nome = `${variacao.produto.nome} (${variacao.cor.nome}, ${variacao.tamanho.nome})`;
    const estoque = Math.max(variacao.estoque, 0);
    const esgotado = estoque === 0;
    let quantidadeFinal = quantidade;

    if (esgotado) {
      avisos.push(`${nome} esgotou. Remova o item para continuar.`);
    } else if (quantidade > estoque) {
      quantidadeFinal = estoque;
      precisaSincronizar = true;
      avisos.push(
        `A quantidade de ${nome} foi ajustada para ${estoque}, o que temos em estoque.`,
      );
    }

    const preco =
      variacao.precoEmCentavos ?? variacao.produto.precoBaseEmCentavos;
    const imagens = variacao.produto.imagens;
    const foto =
      imagens.find((i) => i.corId === variacao.corId) ??
      imagens.find((i) => i.corId === null) ??
      imagens[0] ??
      null;

    itens.push({
      variacaoId,
      quantidade: quantidadeFinal,
      estoque,
      esgotado,
      precoUnitarioEmCentavos: preco,
      subtotalEmCentavos: esgotado ? 0 : preco * quantidadeFinal,
      produto: { nome: variacao.produto.nome, slug: variacao.produto.slug },
      cor: variacao.cor,
      tamanho: variacao.tamanho.nome,
      foto: foto && { url: foto.url, alt: foto.alt },
    });
  }

  const disponiveis = itens.filter((item) => !item.esgotado);
  return {
    itens,
    quantidadeDePecas: disponiveis.reduce((t, i) => t + i.quantidade, 0),
    subtotalEmCentavos: disponiveis.reduce(
      (t, i) => t + i.subtotalEmCentavos,
      0,
    ),
    avisos: [...new Set(avisos)],
    precisaSincronizar,
  };
}
