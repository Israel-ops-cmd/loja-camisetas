import { ProdutoCartao } from "@/components/produto/ProdutoCartao";
import { Botao } from "@/components/ui/Botao";
import { listarDestaques } from "@/lib/catalogo";

export async function ProdutosDestaque() {
  const produtos = await listarDestaques();

  if (produtos.length === 0) return null;

  return (
    <section
      id="produtos"
      aria-labelledby="titulo-produtos"
      className="secao scroll-mt-18 bg-papel"
    >
      <div className="mx-auto max-w-7xl">
        <h2 id="titulo-produtos" className="titulo-listagem">
          Produtos Carta Viva
        </h2>
        <div className="mt-12 grid gap-x-5 gap-y-10 sm:grid-cols-2 lg:grid-cols-4">
          {produtos.map((produto) => (
            <ProdutoCartao
              key={produto.id}
              produto={produto}
              sizes="(min-width: 1280px) 300px, (min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"
            />
          ))}
        </div>
        <div className="mt-12 flex justify-center">
          <Botao href="/produtos" variante="secundario">
            Ver todos
          </Botao>
        </div>
      </div>
    </section>
  );
}
