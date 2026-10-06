import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronDown, ChevronRight } from "lucide-react";

import { DetalheProduto } from "@/components/produto/DetalheProduto";
import { ProdutoCartao } from "@/components/produto/ProdutoCartao";
import { listarFaixasDeAtacado } from "@/lib/atacado";
import { listarRelacionados } from "@/lib/catalogo";
import { DadosEstruturados } from "@/components/seo/DadosEstruturados";
import { LIMITE_ULTIMAS_UNIDADES, obterProduto } from "@/lib/produto";
import { enderecoDoSite } from "@/lib/site";

// Cada produto é gerado na primeira visita e refeito a cada minuto.
// O estoque é conferido de novo no carrinho e no checkout.
export const revalidate = 60;

export async function generateStaticParams() {
  return [];
}

/** Descrição para o Google: uma linha, até 160 caracteres. */
function resumir(texto: string) {
  const linha = texto.replace(/s+/g, " ").trim();
  return linha.length <= 160 ? linha : `${linha.slice(0, 157).replace(/s+S*$/, "")}…`;
}

export async function generateMetadata({
  params,
}: PageProps<"/produtos/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const produto = await obterProduto(slug);
  if (!produto) return {};

  // Ao compartilhar, a foto principal em JPEG otimizado (cerca de 100 KB: o
  // WhatsApp não mostra prévias pesadas). Sem foto, vale a imagem da marca
  // (gerada em src/app/opengraph-image.tsx; precisa ser dita aqui, porque a
  // página define o openGraph e deixa de herdar a do site).
  const foto = produto.imagens[0];
  const imagem = foto
    ? [{ url: `/_next/image?url=${encodeURIComponent(foto.url)}&w=1200&q=75`, width: 1200, alt: foto.alt }]
    : [{ url: "/opengraph-image", width: 1200, height: 630, alt: "Carta Viva Camisetas" }];
  const descricao = resumir(
    produto.descricao ?? `Camiseta ${produto.nome}, da linha ${produto.categoria.nome} da Carta Viva.`,
  );
  return {
    title: produto.nome,
    description: descricao,
    alternates: { canonical: `/produtos/${produto.slug}` },
    openGraph: { title: produto.nome, description: descricao, url: `/produtos/${produto.slug}`, images: imagem },
    twitter: { card: "summary_large_image", images: imagem },
  };
}

export default async function PaginaProduto({
  params,
}: PageProps<"/produtos/[slug]">) {
  const { slug } = await params;
  const produto = await obterProduto(slug);

  // Sem variação ativa, o produto não pode ser comprado (e não aparece na listagem).
  if (!produto || produto.variacoes.length === 0) notFound();

  const [relacionados, faixas] = await Promise.all([
    listarRelacionados(produto.id, produto.categoria.id),
    listarFaixasDeAtacado(),
  ]);

  const site = enderecoDoSite();
  const url = `${site}/produtos/${produto.slug}`;
  const precos = produto.variacoes.map((v) => v.precoEmCentavos / 100);
  const disponivel = produto.variacoes.some((v) => v.estoque > 0);
  const disponibilidade = `https://schema.org/${disponivel ? "InStock" : "OutOfStock"}`;

  return (
    <>
      <DadosEstruturados
        dados={{
          "@context": "https://schema.org",
          "@type": "Product",
          name: produto.nome,
          url,
          ...(produto.descricao && { description: produto.descricao }),
          image: produto.imagens.map((i) => (i.url.startsWith("http") ? i.url : `${site}${i.url}`)),
          brand: { "@type": "Brand", name: "Carta Viva Camisetas" },
          category: produto.categoria.nome,
          offers:
            Math.min(...precos) === Math.max(...precos)
              ? { "@type": "Offer", url, priceCurrency: "BRL", price: precos[0].toFixed(2), availability: disponibilidade }
              : {
                  "@type": "AggregateOffer",
                  url,
                  priceCurrency: "BRL",
                  lowPrice: Math.min(...precos).toFixed(2),
                  highPrice: Math.max(...precos).toFixed(2),
                  offerCount: precos.length,
                  availability: disponibilidade,
                },
        }}
      />
      <DadosEstruturados
        dados={{
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          itemListElement: [
            { "@type": "ListItem", position: 1, name: "Início", item: site },
            { "@type": "ListItem", position: 2, name: "Produtos", item: `${site}/produtos` },
            { "@type": "ListItem", position: 3, name: produto.categoria.nome, item: `${site}/produtos?categoria=${produto.categoria.slug}` },
            { "@type": "ListItem", position: 4, name: produto.nome, item: url },
          ],
        }}
      />
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
            {faixas[0] && (
              <p className="mt-6 rounded-xl bg-papel px-4 py-3 text-[14px]">
                <strong>Atacado:</strong> a partir de {faixas[0].minimoDePecas} peças no carrinho,{" "}
                {faixas[0].percentual}% de desconto, somando qualquer produto.{" "}
                <Link href="/atacado" className="underline underline-offset-4">
                  Ver tabela
                </Link>
              </p>
            )}
            {/* Sem descrição cadastrada, o bloco não aparece (o comando
                conferir-marcadores avisa quais produtos estão sem). */}
            {produto.descricao && (
              <div className="mt-10 border-t border-borda pt-8">
                <h2 className="sobretitulo">Descrição</h2>
                <p className="mt-3 whitespace-pre-line text-apoio">{produto.descricao}</p>
              </div>
            )}

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
