import { ProdutoCartao } from "@/components/produto/ProdutoCartao";
import { Botao } from "@/components/ui/Botao";

// Os produtos reais vêm do banco a partir da etapa 3 (feat/catalogo).
const marcadores = Array.from({ length: 4 }, (_, i) => i);

export function ProdutosDestaque() {
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
          {marcadores.map((i) => (
            <ProdutoCartao
              key={i}
              nome="[NOME DO PRODUTO]"
              precoEmCentavos={null}
              cores={[]}
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
