import "server-only";

import type { Prisma } from "@/generated/prisma/client";
import { ehCamisetaLisa } from "@/lib/estoque-regras";
import { paraSlug } from "@/lib/formatacao";
import { prisma } from "@/lib/prisma";
import { precoDaVariacao } from "@/lib/produtos-regras";

export const ordenacoes = {
  recentes: "Mais recentes",
  "menor-preco": "Menor preço",
  "maior-preco": "Maior preço",
} as const;

export type Ordenacao = keyof typeof ordenacoes;

export type FiltrosCatalogo = {
  /** Slug da categoria */
  categoria?: string;
  /** Slug do modelo (tradicional, baby-look...) */
  modelo?: string;
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
  modelos: { slug: string; nome: string }[];
  cores: { slug: string; nome: string; hex: string }[];
  tamanhos: string[];
};

const selecaoResumo = {
  id: true,
  slug: true,
  nome: true,
  precoBaseEmCentavos: true,
  precosDosModelos: { select: { modeloId: true, precoEmCentavos: true } },
  categoria: { select: { slug: true } },
  imagens: {
    orderBy: { ordem: "asc" },
    take: 1,
    select: { url: true, alt: true, enquadramento: true },
  },
  variacoes: {
    where: { ativo: true },
    select: {
      estoque: true,
      pecaLisa: { select: { estoque: true } },
      precoEmCentavos: true,
      modeloId: true,
      modelo: { select: { slug: true } },
      cor: { select: { nome: true, hex: true } },
    },
  },
} satisfies Prisma.ProdutoSelect;

type ProdutoComVariacoes = Prisma.ProdutoGetPayload<{
  select: typeof selecaoResumo;
}>;

/** Com `modelo` (filtro do catálogo), o preço considera só esse modelo. */
function resumir(produto: ProdutoComVariacoes, modelo?: string): ProdutoResumo {
  const doModelo = modelo ? produto.variacoes.filter((v) => v.modelo.slug === modelo) : [];
  const precos = (doModelo.length > 0 ? doModelo : produto.variacoes).map((v) =>
    precoDaVariacao(v, produto),
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
    // Arte: prontas ou lisas. Camiseta lisa: só as lisas.
    esgotado: produto.variacoes.every(
      (v) => v.pecaLisa.estoque <= 0 && (ehCamisetaLisa(produto.categoria.slug) || v.estoque <= 0),
    ),
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
  return produtos.map((p) => resumir(p));
}

/** Outros produtos da mesma categoria, para "Você também pode gostar". */
export async function listarRelacionados(
  produtoId: string,
  categoriaId: string,
  limite = 4,
) {
  const produtos = await prisma.produto.findMany({
    where: { ativo: true, categoriaId, id: { not: produtoId } },
    orderBy: [{ destaque: "desc" }, { criadoEm: "desc" }],
    take: limite,
    select: selecaoResumo,
  });
  return produtos.map((p) => resumir(p));
}

export async function listarProdutos(
  filtros: FiltrosCatalogo,
  opcoes: OpcoesDeFiltro,
) {
  const nomeDaCor = opcoes.cores.find((c) => c.slug === filtros.cor)?.nome;

  // Cor e tamanho juntos significam "tem essa cor nesse tamanho, com estoque"
  // (peça pronta da arte ou peça lisa; nas camisetas lisas a variação fica em 0).
  const variacao: Prisma.VariacaoWhereInput = { ativo: true };
  if (nomeDaCor) variacao.cor = { nome: nomeDaCor };
  if (filtros.modelo) variacao.modelo = { slug: filtros.modelo };
  if (filtros.tamanho) {
    variacao.tamanho = { nome: filtros.tamanho };
    variacao.OR = [{ estoque: { gt: 0 } }, { pecaLisa: { estoque: { gt: 0 } } }];
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

  const resumos = produtos.map((p) => resumir(p, filtros.modelo));

  // O preço exibido depende das variações, então a ordenação por preço é feita
  // aqui. Com o catálogo de uma loja pequena, isso não pesa.
  if (filtros.ordem === "menor-preco") {
    resumos.sort((a, b) => a.precoEmCentavos - b.precoEmCentavos);
  } else if (filtros.ordem === "maior-preco") {
    resumos.sort((a, b) => b.precoEmCentavos - a.precoEmCentavos);
  }

  return resumos;
}

/** Modelos, cores e tamanhos só entram se levarem a algum produto. */
export async function listarOpcoesDeFiltro(): Promise<OpcoesDeFiltro> {
  const comProdutoAtivo = {
    variacoes: { some: { ativo: true, produto: { ativo: true } } },
  };

  const [categorias, modelos, cores, tamanhos] = await Promise.all([
    prisma.categoria.findMany({
      orderBy: { ordem: "asc" },
      select: {
        slug: true,
        nome: true,
        _count: { select: { produtos: { where: { ativo: true } } } },
      },
    }),
    prisma.modelo.findMany({
      where: comProdutoAtivo,
      orderBy: { ordem: "asc" },
      select: { slug: true, nome: true },
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
    modelos,
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
  const modelo = primeiro(parametros.modelo);
  const cor = primeiro(parametros.cor);
  const tamanho = primeiro(parametros.tamanho)?.toUpperCase();
  const ordem = primeiro(parametros.ordem);

  return {
    categoria: opcoes.categorias.some((c) => c.slug === categoria)
      ? categoria
      : undefined,
    modelo: opcoes.modelos.some((m) => m.slug === modelo) ? modelo : undefined,
    cor: opcoes.cores.some((c) => c.slug === cor) ? cor : undefined,
    tamanho:
      tamanho && opcoes.tamanhos.includes(tamanho) ? tamanho : undefined,
    ordem:
      ordem && Object.hasOwn(ordenacoes, ordem)
        ? (ordem as Ordenacao)
        : "recentes",
  };
}
