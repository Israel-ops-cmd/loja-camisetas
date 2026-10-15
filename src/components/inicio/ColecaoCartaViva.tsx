import { CabecalhoDaSecao } from "@/components/inicio/CabecalhoDaSecao";
import { ProdutoCartao } from "@/components/produto/ProdutoCartao";
import { AoRolar } from "@/components/ui/AoRolar";
import { CATEGORIA_DA_COLECAO, listarDaColecao } from "@/lib/catalogo";

/** Quatro estampas da coleção (as marcadas como destaque primeiro). */
export async function ColecaoCartaViva() {
  const { produtos, total } = await listarDaColecao();
  if (produtos.length === 0) return null;

  return (
    <section id="colecao" aria-labelledby="titulo-colecao" className="largura scroll-mt-20 pb-28">
      <AoRolar>
        <CabecalhoDaSecao
          id="titulo-colecao"
          sobretitulo="Novidades"
          titulo="Coleção Carta Viva"
          link={{ href: `/produtos?categoria=${CATEGORIA_DA_COLECAO}`, texto: `Ver as ${total} estampas` }}
        />
        <div className="grid grid-cols-2 gap-x-5 gap-y-10 lg:grid-cols-4">
          {produtos.map((produto) => (
            <ProdutoCartao
              key={produto.id}
              produto={produto}
              sizes="(min-width: 1440px) 330px, (min-width: 1024px) 23vw, 50vw"
            />
          ))}
        </div>
      </AoRolar>
    </section>
  );
}
