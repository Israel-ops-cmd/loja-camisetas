import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { DetalheProduto } from "@/components/produto/DetalheProduto";
import { ProdutoCartao } from "@/components/produto/ProdutoCartao";
import { listarFaixasDeAtacado } from "@/lib/atacado";
import { CATEGORIA_DA_COLECAO, listarRelacionados } from "@/lib/catalogo";
import { DadosEstruturados } from "@/components/seo/DadosEstruturados";
import { formatarPreco } from "@/lib/formatacao";
import { FRETE_GRATIS_A_PARTIR_DE_EM_CENTAVOS } from "@/lib/frete-regras";
import { MAXIMO_DE_PARCELAS } from "@/lib/pagamento";
import { DIAS_PARA_ARREPENDIMENTO, DIAS_PARA_TROCA } from "@/lib/politicas";
import { LIMITE_ULTIMAS_UNIDADES, obterProduto } from "@/lib/produto";
import { enderecoDoSite } from "@/lib/site";

// Cada produto é gerado na primeira visita e refeito a cada minuto.
// O estoque é conferido de novo no carrinho e no checkout.
export const revalidate = 60;

export async function generateStaticParams() {
  return [];
}

/** Descrição para o Google: uma linha, até 160 caracteres. */
/** "Camiseta Amém (Salmos 41:13)": o nome sozinho ("Amém") não diz o que é. */
function tituloDoProduto(nome: string, referencia: string | null) {
  const comTipo = /^camiseta/i.test(nome) ? nome : `Camiseta ${nome}`;
  return referencia ? `${comTipo} (${referencia})` : comTipo;
}

function resumir(texto: string) {
  const linha = texto.replace(/\s+/g, " ").trim();
  return linha.length <= 160 ? linha : `${linha.slice(0, 157).replace(/\s+\S*$/, "")}…`;
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
    : [{ url: "/opengraph-image", width: 1200, height: 630, alt: "Carta Viva" }];
  // Título e descrição com os termos que as pessoas buscam ("camiseta",
  // o versículo), e não só o nome da estampa.
  const titulo = tituloDoProduto(produto.nome, produto.referencia);
  const descricao = resumir(
    `${produto.descricao ?? ""} ${
      produto.categoria.slug === "basicas"
        ? "Camiseta lisa da Carta Viva."
        : produto.categoria.slug === CATEGORIA_DA_COLECAO
          ? "Camiseta da Coleção Carta Viva, estampada em Natal."
          : "Camiseta estampada em Natal pela Carta Viva."
    } Enviamos para todo o Brasil.`,
  );
  return {
    title: titulo,
    description: descricao,
    alternates: { canonical: `/produtos/${produto.slug}` },
    openGraph: { title: titulo, description: descricao, url: `/produtos/${produto.slug}`, images: imagem },
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
  // Política de devolução nas ofertas: o Google mostra nos resultados de compras.
  const devolucao = {
    hasMerchantReturnPolicy: {
      "@type": "MerchantReturnPolicy",
      applicableCountry: "BR",
      returnPolicyCategory: "https://schema.org/MerchantReturnFiniteReturnWindow",
      merchantReturnDays: DIAS_PARA_ARREPENDIMENTO,
      returnMethod: "https://schema.org/ReturnByMail",
      returnFees: "https://schema.org/FreeReturn",
    },
  };

  return (
    <>
      <DadosEstruturados
        dados={{
          "@context": "https://schema.org",
          "@type": "Product",
          name: tituloDoProduto(produto.nome, produto.referencia),
          url,
          ...(produto.descricao && { description: produto.descricao }),
          image: produto.imagens.map((i) => (i.url.startsWith("http") ? i.url : `${site}${i.url}`)),
          brand: { "@type": "Brand", name: "Carta Viva" },
          category: produto.categoria.nome,
          offers:
            Math.min(...precos) === Math.max(...precos)
              ? { "@type": "Offer", url, priceCurrency: "BRL", price: precos[0].toFixed(2), availability: disponibilidade, ...devolucao }
              : {
                  "@type": "AggregateOffer",
                  url,
                  priceCurrency: "BRL",
                  lowPrice: Math.min(...precos).toFixed(2),
                  highPrice: Math.max(...precos).toFixed(2),
                  offerCount: precos.length,
                  availability: disponibilidade,
                  ...devolucao,
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
      <div className="largura pb-24">
        <nav aria-label="Você está em" className="py-2.5 text-[12px] text-secundario">
          <ol className="flex flex-wrap items-center gap-x-2">
            <li>
              <Link href="/" className="inline-flex min-h-11 items-center hover:text-tinta">
                Início
              </Link>
            </li>
            <li aria-hidden="true">/</li>
            <li>
              <Link href={`/produtos?categoria=${produto.categoria.slug}`} className="inline-flex min-h-11 items-center hover:text-tinta">
                {produto.categoria.nome}
              </Link>
            </li>
            <li aria-hidden="true">/</li>
            <li aria-current="page" className="text-tinta">
              {produto.nome}
            </li>
          </ol>
        </nav>

        {/* Sem descrição cadastrada, a sanfona Descrição não aparece (o comando
            conferir-marcadores avisa quais produtos estão sem). */}
        <DetalheProduto
          produto={produto}
          limiteUltimasUnidades={LIMITE_ULTIMAS_UNIDADES}
          condicoes={[
            `ou em até ${MAXIMO_DE_PARCELAS}x no cartão`,
            faixas[0] && `${faixas[0].percentual}% de desconto a partir de ${faixas[0].minimoDePecas} peças`,
          ]
            .filter(Boolean)
            .join(" · ")}
          envioETroca={
            <>
              Frete grátis acima de {formatarPreco(FRETE_GRATIS_A_PARTIR_DE_EM_CENTAVOS).replace(",00", "")} na opção mais
              econômica. Troca de tamanho ou cor em até {DIAS_PARA_TROCA} dias depois de receber.{" "}
              <Link href="/politica-de-troca" className="border-b border-tinta hover:opacity-70">
                Política de troca
              </Link>
              {faixas[0] && (
                <>
                  {" "}
                  · Atacado:{" "}
                  <Link href="/atacado" className="border-b border-tinta hover:opacity-70">
                    ver tabela
                  </Link>
                </>
              )}
            </>
          }
        />
      </div>

      {relacionados.length > 0 && (
        <section aria-labelledby="titulo-relacionados" className="largura pb-26">
          <h2 id="titulo-relacionados" className="mb-7 border-t border-borda pt-7 font-titulo text-[26px] lg:text-[32px]">
            {produto.categoria.slug === CATEGORIA_DA_COLECAO ? "Da mesma coleção" : "Você também pode gostar"}
          </h2>
          <div className="grid grid-cols-2 gap-x-3 gap-y-10 sm:gap-x-5 md:grid-cols-4">
            {relacionados.map((relacionado) => (
              <ProdutoCartao
                key={relacionado.id}
                produto={relacionado}
                sizes="(min-width: 1440px) 330px, (min-width: 1024px) 23vw, 50vw"
              />
            ))}
          </div>
        </section>
      )}
    </>
  );
}
