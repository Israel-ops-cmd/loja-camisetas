import type { Metadata } from "next";
import { SlidersHorizontal } from "lucide-react";

import { Filtros } from "@/components/catalogo/Filtros";
import { FiltrosAtivos } from "@/components/catalogo/FiltrosAtivos";
import { Ordenacao } from "@/components/catalogo/Ordenacao";
import { ProdutoCartao } from "@/components/produto/ProdutoCartao";
import { Botao } from "@/components/ui/Botao";
import {
  lerFiltros,
  listarOpcoesDeFiltro,
  listarProdutos,
} from "@/lib/catalogo";
import { hrefCatalogo } from "@/lib/url-catalogo";

/**
 * Título e texto de cada categoria, para ela ter página própria no Google
 * (`/produtos?categoria=...`). Categoria fora da lista usa o nome dela.
 */
const TEXTOS_DAS_CATEGORIAS: Record<string, { titulo: string; descricao: string }> = {
  "colecao-carta-viva": {
    titulo: "Coleção Carta Viva: camisetas cristãs",
    descricao:
      "A coleção que deu nome à loja, nascida de 2 Coríntios 3:3. Camisetas cristãs em cinco modelos, do Tradicional ao Infantil.",
  },
  "estampas-da-casa": {
    titulo: "Camisetas estampadas",
    descricao:
      "As estampas que a gente cria e estampa aqui em Natal. Tem frase de fé, tem outros temas, e sempre chega coisa nova.",
  },
  basicas: {
    titulo: "Camisetas lisas",
    descricao:
      "Camiseta sem estampa, a mesma que usamos nas nossas estampas. Boa para o dia a dia e para quem vai personalizar depois.",
  },
};

export async function generateMetadata({ searchParams }: PageProps<"/produtos">): Promise<Metadata> {
  const parametros = await searchParams;
  const categoria = typeof parametros.categoria === "string" ? parametros.categoria : undefined;
  const outrosFiltros = ["modelo", "cor", "tamanho", "ordem"].some((p) => parametros[p] !== undefined);
  const texto = categoria ? TEXTOS_DAS_CATEGORIAS[categoria] : undefined;

  // Só a categoria sozinha vira página própria; combinações de filtros
  // apontam para ela (ou para /produtos), para o Google não ver duplicatas.
  if (texto) {
    return {
      title: texto.titulo,
      description: texto.descricao,
      alternates: { canonical: `/produtos?categoria=${categoria}` },
      ...(outrosFiltros && { robots: { index: false, follow: true } }),
    };
  }
  return {
    alternates: { canonical: "/produtos" },
    title: "Camisetas estampadas e lisas",
    description:
      "Todas as camisetas da Carta Viva: as estampas da casa, a Coleção Carta Viva e as lisas. Escolha o modelo, a cor e o tamanho. Enviamos para todo o Brasil.",
    ...((outrosFiltros || categoria) && { robots: { index: false, follow: true } }),
  };
}

export default async function PaginaProdutos({
  searchParams,
}: PageProps<"/produtos">) {
  const opcoes = await listarOpcoesDeFiltro();
  const filtros = lerFiltros(await searchParams, opcoes);
  const produtos = await listarProdutos(filtros, opcoes);

  const totalDeFiltros = [filtros.categoria, filtros.modelo, filtros.cor, filtros.tamanho]
    .filter(Boolean).length;
  const categoria = opcoes.categorias.find((c) => c.slug === filtros.categoria);

  return (
    <div className="largura pt-10 pb-24 lg:pt-14">
      <div>
        <h1 className="titulo-destaque">{categoria?.nome ?? "Produtos"}</h1>
        {categoria && TEXTOS_DAS_CATEGORIAS[categoria.slug] && (
          <p className="mt-4 max-w-[620px] text-apoio">{TEXTOS_DAS_CATEGORIAS[categoria.slug].descricao}</p>
        )}

        <div className="mt-10 grid gap-10 lg:grid-cols-[220px_1fr] lg:gap-14">
          <aside aria-label="Filtros" className="hidden lg:block">
            <Filtros filtros={filtros} opcoes={opcoes} />
          </aside>

          <div>
            {/* No celular, os filtros abrem num painel. Funciona sem JavaScript. */}
            <details className="group mb-6 border border-borda lg:hidden">
              <summary className="texto-menu flex min-h-12 cursor-pointer list-none items-center justify-center gap-2 px-5 [&::-webkit-details-marker]:hidden">
                <SlidersHorizontal
                  aria-hidden="true"
                  className="size-5"
                  strokeWidth={1.4}
                />
                Filtrar
                {totalDeFiltros > 0 && (
                  <span className=" bg-tinta px-2 py-0.5 text-[11px] text-papel">
                    {totalDeFiltros}
                  </span>
                )}
              </summary>
              <div className="border-t border-borda p-5">
                <Filtros filtros={filtros} opcoes={opcoes} />
              </div>
            </details>

            <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-2 border-b border-borda pb-4">
              <p className="text-[14px] text-secundario" aria-live="polite">
                {produtos.length === 1
                  ? "1 produto"
                  : `${produtos.length} produtos`}
              </p>
              <Ordenacao filtros={filtros} />
            </div>

            <div className="mt-4">
              <FiltrosAtivos filtros={filtros} opcoes={opcoes} />
            </div>

            {/* Título para leitores de tela: os cartões usam h3. */}
            <h2 className="sr-only">Lista de produtos</h2>
            {produtos.length > 0 ? (
              <div className="mt-8 grid grid-cols-2 gap-x-3 gap-y-10 sm:gap-x-5 md:grid-cols-3 lg:grid-cols-2 xl:grid-cols-3">
                {produtos.map((produto) => (
                  <ProdutoCartao
                    key={produto.id}
                    produto={produto}
                    sizes="(min-width: 1280px) 340px, 50vw"
                  />
                ))}
              </div>
            ) : (
              <div className="mt-8 flex flex-col items-center border-y border-borda px-6 py-16 text-center">
                <p className="font-titulo text-[28px]">
                  Nenhum produto encontrado
                </p>
                <p className="mt-3 max-w-md text-apoio">
                  {totalDeFiltros > 0
                    ? "Nenhuma camiseta combina com esses filtros. Tente tirar algum deles."
                    : "Ainda não há produtos cadastrados."}
                </p>
                {totalDeFiltros > 0 && (
                  <Botao
                    href={hrefCatalogo({ ordem: filtros.ordem })}
                    variante="secundario"
                    className="mt-8"
                  >
                    Limpar filtros
                  </Botao>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
