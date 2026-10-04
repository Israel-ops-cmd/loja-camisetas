import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronDown, ChevronRight } from "lucide-react";

import { DetalheProduto } from "@/components/produto/DetalheProduto";
import { ProdutoCartao } from "@/components/produto/ProdutoCartao";
import { listarRelacionados } from "@/lib/catalogo";
import { LIMITE_ULTIMAS_UNIDADES, obterProduto } from "@/lib/produto";

// Cada produto é gerado na primeira visita e refeito a cada minuto.
// O estoque é conferido de novo no carrinho e no checkout.
export const revalidate = 60;

export async function generateStaticParams() {
  return [];
}

export async function generateMetadata({
  params,
}: PageProps<"/produtos/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const produto = await obterProduto(slug);
  if (!produto) return {};

  const foto = produto.imagens[0];
  return {
    title: produto.nome,
    description:
      produto.descricao ??
      `Camiseta ${produto.nome}, da linha ${produto.categoria.nome} da Carta Viva.`,
    openGraph: foto
      ? { images: [{ url: foto.url, alt: foto.alt }] }
      : undefined,
  };
}

export default async function PaginaProduto({
  params,
}: PageProps<"/produtos/[slug]">) {
  const { slug } = await params;
  const produto = await obterProduto(slug);

  // Sem variação ativa, o produto não pode ser comprado (e não aparece na listagem).
  if (!produto || produto.variacoes.length === 0) notFound();

  const relacionados = await listarRelacionados(
    produto.id,
    produto.categoria.id,
  );

  return (
    <>
      <div className="secao">
        <div className="mx-auto max-w-7xl">
          <nav aria-label="Trilha de navegação" className="mb-8">
            <ol className="flex flex-wrap items-center gap-1 text-[13px] text-secundario">
              <li>
                <Link
                  href="/produtos"
                  className="inline-flex min-h-11 items-center hover:text-tinta"
                >
                  Produtos
                </Link>
              </li>
              <li aria-hidden="true">
                <ChevronRight className="size-4" strokeWidth={1.6} />
              </li>
              <li>
                <Link
                  href={`/produtos?categoria=${produto.categoria.slug}`}
                  className="inline-flex min-h-11 items-center hover:text-tinta"
                >
                  {produto.categoria.nome}
                </Link>
              </li>
            </ol>
          </nav>

          <DetalheProduto
            produto={produto}
            limiteUltimasUnidades={LIMITE_ULTIMAS_UNIDADES}
          >
            <div className="mt-10 border-t border-borda pt-8">
              <h2 className="sobretitulo">Descrição</h2>
              <p className="mt-3 whitespace-pre-line text-apoio">
                {produto.descricao ?? "[DESCRIÇÃO DO PRODUTO]"}
              </p>
            </div>

            <details className="group mt-8 border-y border-borda">
              <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between gap-4 font-semibold [&::-webkit-details-marker]:hidden">
                Tabela de medidas
                <ChevronDown
                  aria-hidden="true"
                  className="size-5 shrink-0 transition group-open:rotate-180"
                  strokeWidth={1.6}
                />
              </summary>
              <p className="pb-5 text-apoio">[TABELA DE MEDIDAS]</p>
            </details>
          </DetalheProduto>
        </div>
      </div>

      {relacionados.length > 0 && (
        <section
          aria-labelledby="titulo-relacionados"
          className="secao bg-papel"
        >
          <div className="mx-auto max-w-7xl">
            <h2 id="titulo-relacionados" className="titulo-listagem">
              Você também pode gostar
            </h2>
            <div className="mt-12 grid gap-x-5 gap-y-10 sm:grid-cols-2 lg:grid-cols-4">
              {relacionados.map((relacionado) => (
                <ProdutoCartao
                  key={relacionado.id}
                  produto={relacionado}
                  sizes="(min-width: 1280px) 300px, (min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"
                />
              ))}
            </div>
          </div>
        </section>
      )}
    </>
  );
}
