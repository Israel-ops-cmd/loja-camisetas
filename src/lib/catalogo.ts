import "server-only";

import type { Prisma } from "@/generated/prisma/client";
import { paraSlug } from "@/lib/formatacao";
import { prisma } from "@/lib/prisma";

export const ordenacoes = {
  recentes: "Mais recentes",
  "menor-preco": "Menor preço",
  "maior-preco": "Maior preço",
} as const;

export type Ordenacao = keyof typeof ordenacoes;

export type FiltrosCatalogo = {
  /** Slug da categoria */
  categoria?: string;
  /** Slug da cor (gerado a partir do nome) */
  cor?: string;
  /** Nome do tamanho (P, M, G, GG) */
  tamanho?: string;
  ordem: Ordenacao;
};

export type ProdutoResumo = {
  id: string;
  slug: string;
  nome: string;
  /** Menor preço entre as variações ativas, em centavos. */
  precoEmCentavos: number;
  /** As variações têm preços diferentes ("a partir de"). */
  precoVaria: boolean;
  esgotado: boolean;
  cores: { nome: string; hex: string }[];
  foto: { url: string; alt: string; enquadramento: string | null } | null;
};

export type OpcoesDeFiltro = {
  /** Todas as categorias, para aceitar links de categorias ainda vazias. */
  categorias: { slug: string; nome: string; totalDeProdutos: number }[];
  cores: { slug: string; nome: string; hex: string }[];
  tamanhos: string[];
};

const selecaoResumo = {
  id: true,
  slug: true,
  nome: true,
  precoBaseEmCentavos: true,
  imagens: {
    orderBy: { ordem: "asc" },
    take: 1,
    select: { url: true, alt: true, enquadramento: true },
  },
  variacoes: {
    where: { ativo: true },
    select: {
      estoque: true,
      precoEmCentavos: true,
      cor: { select: { nome: true, hex: true } },
    },
  },
} satisfies Prisma.ProdutoSelect;

type ProdutoComVariacoes = Prisma.ProdutoGetPayload<{
  select: typeof selecaoResumo;
}>;

function resumir(produto: ProdutoComVariacoes): ProdutoResumo {
  const precos = produto.variacoes.map(
    (v) => v.precoEmCentavos ?? produto.precoBaseEmCentavos,
  );
  const menorPreco = precos.length
    ? Math.min(...precos)
    : produto.precoBaseEmCentavos;

  const cores = new Map<string, { nome: string; hex: string }>();
  for (const { cor } of produto.variacoes) cores.set(cor.nome, cor);

  return {
    id: produto.id,
    slug: produto.slug,
    nome: produto.nome,
    precoEmCentavos: menorPreco,
    precoVaria: new Set(precos).size > 1,
    esgotado: produto.variacoes.every((v) => v.estoque <= 0),
    cores: [...cores.values()],
    foto: produto.imagens[0] ?? null,
  };
}

/** Produtos marcados como destaque, para a página inicial. */
export async function listarDestaques(limite = 4) {
  const produtos = await prisma.produto.findMany({
    where: { ativo: true, destaque: true },
    orderBy: { criadoEm: "desc" },
    take: limite,
    select: selecaoResumo,
  });
  return produtos.map(resumir);
}

export async function listarProdutos(
  filtros: FiltrosCatalogo,
  opcoes: OpcoesDeFiltro,
) {
  const nomeDaCor = opcoes.cores.find((c) => c.slug === filtros.cor)?.nome;

  // Cor e tamanho juntos significam "tem essa cor nesse tamanho, com estoque".
  const variacao: Prisma.VariacaoWhereInput = { ativo: true };
  if (nomeDaCor) variacao.cor = { nome: nomeDaCor };
  if (filtros.tamanho) {
    variacao.tamanho = { nome: filtros.tamanho };
    variacao.estoque = { gt: 0 };
  }

  const produtos = await prisma.produto.findMany({
    where: {
      ativo: true,
      ...(filtros.categoria && { categoria: { slug: filtros.categoria } }),
      variacoes: { some: variacao },
    },
    orderBy: { criadoEm: "desc" },
    select: selecaoResumo,
  });

  const resumos = produtos.map(resumir);

  // O preço exibido depende das variações, então a ordenação por preço é feita
  // aqui. Com o catálogo de uma loja pequena, isso não pesa.
  if (filtros.ordem === "menor-preco") {
    resumos.sort((a, b) => a.precoEmCentavos - b.precoEmCentavos);
  } else if (filtros.ordem === "maior-preco") {
    resumos.sort((a, b) => b.precoEmCentavos - a.precoEmCentavos);
  }

  return resumos;
}

/** Cores e tamanhos só entram se levarem a algum produto. */
export async function listarOpcoesDeFiltro(): Promise<OpcoesDeFiltro> {
  const comProdutoAtivo = {
    variacoes: { some: { ativo: true, produto: { ativo: true } } },
  };

  const [categorias, cores, tamanhos] = await Promise.all([
    prisma.categoria.findMany({
      orderBy: { ordem: "asc" },
      select: {
        slug: true,
        nome: true,
        _count: { select: { produtos: { where: { ativo: true } } } },
      },
    }),
    prisma.cor.findMany({
      where: comProdutoAtivo,
      orderBy: { nome: "asc" },
      select: { nome: true, hex: true },
    }),
    prisma.tamanho.findMany({
      where: comProdutoAtivo,
      orderBy: { ordem: "asc" },
      select: { nome: true },
    }),
  ]);

  return {
    categorias: categorias.map(({ _count, ...categoria }) => ({
      ...categoria,
      totalDeProdutos: _count.produtos,
    })),
    cores: cores.map((cor) => ({ ...cor, slug: paraSlug(cor.nome) })),
    tamanhos: tamanhos.map((t) => t.nome),
  };
}

type ParametrosDaUrl = Record<string, string | string[] | undefined>;

function primeiro(valor: string | string[] | undefined) {
  return Array.isArray(valor) ? valor[0] : valor;
}

/** Lê os filtros da URL e descarta valores que não existem. */
export function lerFiltros(
  parametros: ParametrosDaUrl,
  opcoes: OpcoesDeFiltro,
): FiltrosCatalogo {
  const categoria = primeiro(parametros.categoria);
  const cor = primeiro(parametros.cor);
  const tamanho = primeiro(parametros.tamanho)?.toUpperCase();
  const ordem = primeiro(parametros.ordem);

  return {
    categoria: opcoes.categorias.some((c) => c.slug === categoria)
      ? categoria
      : undefined,
    cor: opcoes.cores.some((c) => c.slug === cor) ? cor : undefined,
    tamanho:
      tamanho && opcoes.tamanhos.includes(tamanho) ? tamanho : undefined,
    ordem:
      ordem && Object.hasOwn(ordenacoes, ordem)
        ? (ordem as Ordenacao)
        : "recentes",
  };
}
