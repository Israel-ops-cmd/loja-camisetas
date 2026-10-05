import "server-only";

import { cache } from "react";

import { prisma } from "@/lib/prisma";

export { LIMITE_ULTIMAS_UNIDADES } from "@/lib/estoque-regras";

export type ProdutoDetalhe = {
  id: string;
  slug: string;
  nome: string;
  descricao: string | null;
  categoria: { id: string; nome: string; slug: string };
  imagens: {
    id: string;
    url: string;
    alt: string;
    enquadramento: string | null;
    /** Nulo: a foto vale para todas as cores. */
    corId: string | null;
  }[];
  cores: { id: string; nome: string; hex: string }[];
  tamanhos: { id: string; nome: string }[];
  variacoes: {
    id: string;
    corId: string;
    tamanhoId: string;
    estoque: number;
    /** Preço final da variação (o próprio ou o base do produto). */
    precoEmCentavos: number;
  }[];
};

/**
 * Produto ativo pelo slug, ou `null`. Envolvido em `cache` para que a página
 * e o `generateMetadata` façam uma consulta só por requisição.
 */
export const obterProduto = cache(
  async (slug: string): Promise<ProdutoDetalhe | null> => {
    const produto = await prisma.produto.findUnique({
      where: { slug, ativo: true },
      select: {
        id: true,
        slug: true,
        nome: true,
        descricao: true,
        precoBaseEmCentavos: true,
        categoria: { select: { id: true, nome: true, slug: true } },
        imagens: {
          orderBy: { ordem: "asc" },
          select: {
            id: true,
            url: true,
            alt: true,
            enquadramento: true,
            corId: true,
          },
        },
        variacoes: {
          where: { ativo: true },
          select: {
            id: true,
            estoque: true,
            precoEmCentavos: true,
            cor: { select: { id: true, nome: true, hex: true } },
            tamanho: { select: { id: true, nome: true, ordem: true } },
          },
        },
      },
    });

    if (!produto) return null;

    const cores = new Map<string, ProdutoDetalhe["cores"][number]>();
    const tamanhos = new Map<string, { id: string; nome: string; ordem: number }>();
    for (const { cor, tamanho } of produto.variacoes) {
      cores.set(cor.id, cor);
      tamanhos.set(tamanho.id, tamanho);
    }

    return {
      id: produto.id,
      slug: produto.slug,
      nome: produto.nome,
      descricao: produto.descricao,
      categoria: produto.categoria,
      imagens: produto.imagens,
      cores: [...cores.values()].sort((a, b) => a.nome.localeCompare(b.nome)),
      tamanhos: [...tamanhos.values()]
        .sort((a, b) => a.ordem - b.ordem)
        .map(({ id, nome }) => ({ id, nome })),
      variacoes: produto.variacoes.map((v) => ({
        id: v.id,
        corId: v.cor.id,
        tamanhoId: v.tamanho.id,
        estoque: v.estoque,
        precoEmCentavos: v.precoEmCentavos ?? produto.precoBaseEmCentavos,
      })),
    };
  },
);
