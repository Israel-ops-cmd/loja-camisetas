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

export const metadata: Metadata = {
  alternates: { canonical: "/produtos" },
  title: "Produtos",
  description:
    "Camisetas lisas e estampas da casa da Carta Viva. Filtre por categoria, cor e tamanho.",
};

export default async function PaginaProdutos({
  searchParams,
}: PageProps<"/produtos">) {
  const opcoes = await listarOpcoesDeFiltro();
  const filtros = lerFiltros(await searchParams, opcoes);
  const produtos = await listarProdutos(filtros, opcoes);

  const totalDeFiltros = [filtros.categoria, filtros.cor, filtros.tamanho]
    .filter(Boolean).length;
  const categoria = opcoes.categorias.find((c) => c.slug === filtros.categoria);

  return (
    <div className="secao">
      <div className="mx-auto max-w-7xl">
        <h1 className="titulo-listagem">{categoria?.nome ?? "Produtos"}</h1>

        <div className="mt-12 grid gap-10 lg:grid-cols-[220px_1fr]">
          <aside aria-label="Filtros" className="hidden lg:block">
            <Filtros filtros={filtros} opcoes={opcoes} />
          </aside>

          <div>
            {/* No celular, os filtros abrem num painel. Funciona sem JavaScript. */}
            <details className="group mb-6 rounded-[20px] border border-borda bg-papel lg:hidden">
              <summary className="texto-menu flex min-h-12 cursor-pointer list-none items-center justify-center gap-2 px-5 font-bold [&::-webkit-details-marker]:hidden">
                <SlidersHorizontal
                  aria-hidden="true"
                  className="size-5"
                  strokeWidth={1.6}
                />
                Filtrar
                {totalDeFiltros > 0 && (
                  <span className="rounded-full bg-tinta px-2 py-0.5 text-[11px] text-papel">
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
              <div className="mt-8 grid gap-x-5 gap-y-10 sm:grid-cols-2 xl:grid-cols-3">
                {produtos.map((produto) => (
                  <ProdutoCartao
                    key={produto.id}
                    produto={produto}
                    sizes="(min-width: 1280px) 320px, (min-width: 640px) 50vw, 100vw"
                  />
                ))}
              </div>
            ) : (
              <div className="mt-8 flex flex-col items-center rounded-[20px] bg-papel px-6 py-16 text-center">
                <p className="font-titulo text-[22px] font-bold uppercase">
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
