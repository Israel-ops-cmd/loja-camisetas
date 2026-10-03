import {
  ProdutoCartao,
  type ProdutoCartaoProps,
} from "@/components/produto/ProdutoCartao";
import { Botao } from "@/components/ui/Botao";

// Os produtos vêm do banco a partir da etapa 3 (feat/catalogo).
// Preço, cores e etiqueta ainda não foram fornecidos.
const produtos: ProdutoCartaoProps[] = [
  {
    nome: "Não temas, creia",
    foto: {
      src: "/fotos/nao-temas-creia-casal.jpg",
      alt: "Camiseta azul-marinho “Não temas, creia”, vestida por um casal: frente e costas",
    },
  },
  {
    nome: "Não me envergonho do evangelho",
    foto: {
      src: "/fotos/nao-me-envergonho-casal.jpg",
      alt: "Camiseta branca “Não me envergonho do evangelho”, vestida por um casal: frente com Romanos 1:16 e costas",
    },
  },
  {
    nome: "Jesus, my best friend",
    foto: {
      src: "/fotos/jesus-my-best-friend.jpg",
      alt: "Camiseta preta “Jesus, my best friend”, vestida por uma mulher",
      posicao: "object-[50%_45%]",
    },
  },
  {
    nome: "O justo vive pela fé",
    foto: {
      src: "/fotos/o-justo-vive-pela-fe.jpg",
      alt: "Costas da camiseta clara “O justo vive pela fé”, com a ilustração de uma Bíblia",
      posicao: "object-[50%_42%]",
    },
  },
].map((produto) => ({
  ...produto,
  precoEmCentavos: null,
  cores: [],
  etiqueta: "[ETIQUETA]",
}));

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
          {produtos.map((produto) => (
            <ProdutoCartao key={produto.nome} {...produto} />
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
