import "server-only";

import { cookies } from "next/headers";

import {
  escreverCookieDoCarrinho,
  lerCookieDoCarrinho,
  NOME_COOKIE_CARRINHO,
  type ItemDoCookie,
} from "@/lib/carrinho-cookie";
import { listarFaixasDeAtacado } from "@/lib/atacado";
import {
  faixaAplicavel,
  proximaFaixa,
  totaisComDesconto,
  type FaixaDeDesconto,
} from "@/lib/atacado-regras";
import { distribuirEstoque, ehCamisetaLisa, type Distribuicao } from "@/lib/estoque-regras";
import { prisma } from "@/lib/prisma";
import { fotosDaEscolha, precoDaVariacao } from "@/lib/produtos-regras";

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

/** O que define quanto há de cada variação: prontas da arte e a peça lisa. */
const selecaoDoEstoque = {
  id: true,
  estoque: true,
  pecaLisa: { select: { id: true, estoque: true } },
  produto: { select: { categoria: { select: { slug: true } } } },
} as const;

type EstoqueDaVariacao = {
  id: string;
  estoque: number;
  pecaLisa: { id: string; estoque: number };
  produto: { categoria: { slug: string } };
};

/**
 * Quanto dá para vender de cada item, na ordem do carrinho: cada arte usa as
 * suas prontas e depois as lisas, que são divididas entre todos os itens.
 */
function distribuirCarrinho(itens: ItemDoCookie[], porId: Map<string, EstoqueDaVariacao>) {
  const validos = itens.filter((i) => porId.has(i.variacaoId));
  const lisas = new Map<string, number>();
  for (const v of porId.values()) lisas.set(v.pecaLisa.id, v.pecaLisa.estoque);
  const divisao = distribuirEstoque(
    validos.map((i) => {
      const v = porId.get(i.variacaoId)!;
      return {
        quantidade: i.quantidade,
        prontas: ehCamisetaLisa(v.produto.categoria.slug) ? 0 : v.estoque,
        pecaLisaId: v.pecaLisa.id,
      };
    }),
    lisas,
  );
  return new Map(validos.map((i, n) => [i.variacaoId, divisao[n]]));
}

/**
 * Confere o carrinho como ficaria (itens vendáveis: ativos, de produto
 * ativo). Devolve a divisão de cada item; item fora da loja fica de fora.
 */
export async function conferirCarrinho(itens: ItemDoCookie[]): Promise<Map<string, Distribuicao>> {
  const variacoes = await prisma.variacao.findMany({
    where: { id: { in: itens.map((i) => i.variacaoId) }, ativo: true, produto: { ativo: true } },
    select: selecaoDoEstoque,
  });
  return distribuirCarrinho(itens, new Map(variacoes.map((v) => [v.id, v])));
}

export type ItemDoCarrinho = {
  variacaoId: string;
  sku: string;
  quantidade: number;
  /** Máximo deste item (prontas + lisas), mantendo os outros itens como estão. */
  estoque: number;
  esgotado: boolean;
  /** Peças que vão ser estampadas para o cliente (sem pronta da arte). */
  aEstampar: number;
  precoUnitarioEmCentavos: number;
  subtotalEmCentavos: number;
  produto: { nome: string; slug: string };
  /** Pacote de uma unidade, para o frete. */
  pacote: {
    pesoEmGramas: number;
    larguraCm: number;
    alturaCm: number;
    comprimentoCm: number;
  };
  /** Nome do modelo (Tradicional, Baby Look...). */
  modelo: string;
  cor: { nome: string; hex: string };
  tamanho: string;
  foto: { url: string; alt: string } | null;
};

export type Carrinho = {
  itens: ItemDoCarrinho[];
  /** Peças que entram no total (sem as esgotadas). */
  quantidadeDePecas: number;
  /** Peças a estampar no pedido: o despacho leva mais tempo. */
  pecasAEstampar: number;
  subtotalEmCentavos: number;
  /** Mensagens sobre correções feitas no carrinho. */
  avisos: string[];
  /** O cookie tem itens removidos ou quantidades acima do estoque. */
  precisaSincronizar: boolean;
  atacado: ResumoDoAtacado;
};

export type ResumoDoAtacado = {
  /** Percentual aplicado (0 = sem desconto). */
  percentual: number;
  descontoEmCentavos: number;
  /** Próxima faixa com desconto maior (para o incentivo "faltam N peças"). */
  proxima: (FaixaDeDesconto & { faltam: number }) | null;
};

/** Desconto de atacado pelo total de peças disponíveis (produtos misturados). */
async function resumoDoAtacado(
  itens: { precoUnitarioEmCentavos: number; quantidade: number }[],
): Promise<ResumoDoAtacado> {
  const faixas = await listarFaixasDeAtacado();
  const pecas = itens.reduce((t, i) => t + i.quantidade, 0);
  const percentual = faixaAplicavel(pecas, faixas)?.percentual ?? 0;
  const { desconto } = totaisComDesconto(
    itens.map((i) => ({ precoEmCentavos: i.precoUnitarioEmCentavos, quantidade: i.quantidade })),
    percentual,
  );
  return { percentual, descontoEmCentavos: desconto, proxima: proximaFaixa(pecas, faixas) };
}

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
      pecasAEstampar: 0,
      subtotalEmCentavos: 0,
      avisos: [],
      precisaSincronizar: false,
      atacado: await resumoDoAtacado([]),
    };
  }

  const variacoes = await prisma.variacao.findMany({
    where: {
      id: { in: itensDoCookie.map((item) => item.variacaoId) },
      ativo: true,
      produto: { ativo: true },
    },
    select: {
      ...selecaoDoEstoque,
      sku: true,
      precoEmCentavos: true,
      modeloId: true,
      corId: true,
      cor: { select: { nome: true, hex: true } },
      tamanho: { select: { nome: true } },
      modelo: { select: { nome: true, pesoEmGramas: true, larguraCm: true, alturaCm: true, comprimentoCm: true } },
      produto: {
        select: {
          nome: true,
          slug: true,
          precoBaseEmCentavos: true,
          precosDosModelos: { select: { modeloId: true, precoEmCentavos: true } },
          categoria: { select: { slug: true } },
          imagens: {
            orderBy: { ordem: "asc" },
            select: { url: true, alt: true, corId: true, modeloId: true },
          },
        },
      },
    },
  });
  const porId = new Map(variacoes.map((v) => [v.id, v]));
  const divisao = distribuirCarrinho(itensDoCookie, porId);

  const itens: ItemDoCarrinho[] = [];
  const avisos: string[] = [];
  let precisaSincronizar = false;

  for (const { variacaoId, quantidade } of itensDoCookie) {
    const variacao = porId.get(variacaoId);
    if (!variacao) {
      avisos.push(
        "Um item saiu da sacola porque não está mais disponível na loja.",
      );
      precisaSincronizar = true;
      continue;
    }

    const nome = `${variacao.produto.nome} (${variacao.modelo.nome}, ${variacao.cor.nome}, ${variacao.tamanho.nome})`;
    const { possivel, prontas, limite } = divisao.get(variacaoId)!;
    const esgotado = possivel === 0;
    let quantidadeFinal = quantidade;

    if (esgotado) {
      avisos.push(`${nome} esgotou. Remova o item para continuar.`);
    } else if (quantidade > possivel) {
      quantidadeFinal = possivel;
      precisaSincronizar = true;
      avisos.push(
        `A quantidade de ${nome} foi ajustada para ${possivel}, o que temos em estoque.`,
      );
    }
    const aEstampar = esgotado || ehCamisetaLisa(variacao.produto.categoria.slug) ? 0 : quantidadeFinal - prontas;

    const preco = precoDaVariacao(variacao, variacao.produto);
    const foto =
      fotosDaEscolha(variacao.produto.imagens, { modeloId: variacao.modeloId, corId: variacao.corId })[0] ?? null;

    itens.push({
      variacaoId,
      sku: variacao.sku,
      quantidade: quantidadeFinal,
      estoque: limite,
      esgotado,
      aEstampar,
      precoUnitarioEmCentavos: preco,
      subtotalEmCentavos: esgotado ? 0 : preco * quantidadeFinal,
      produto: { nome: variacao.produto.nome, slug: variacao.produto.slug },
      pacote: {
        pesoEmGramas: variacao.modelo.pesoEmGramas,
        larguraCm: variacao.modelo.larguraCm,
        alturaCm: variacao.modelo.alturaCm,
        comprimentoCm: variacao.modelo.comprimentoCm,
      },
      modelo: variacao.modelo.nome,
      cor: variacao.cor,
      tamanho: variacao.tamanho.nome,
      foto: foto && { url: foto.url, alt: foto.alt },
    });
  }

  const disponiveis = itens.filter((item) => !item.esgotado);
  return {
    itens,
    quantidadeDePecas: disponiveis.reduce((t, i) => t + i.quantidade, 0),
    pecasAEstampar: disponiveis.reduce((t, i) => t + i.aEstampar, 0),
    subtotalEmCentavos: disponiveis.reduce(
      (t, i) => t + i.subtotalEmCentavos,
      0,
    ),
    avisos: [...new Set(avisos)],
    precisaSincronizar,
    atacado: await resumoDoAtacado(disponiveis),
  };
}
