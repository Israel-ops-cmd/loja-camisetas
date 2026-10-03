import { Atacado } from "@/components/inicio/Atacado";
import { Categorias } from "@/components/inicio/Categorias";
import { Hero } from "@/components/inicio/Hero";
import { PerguntasFrequentes } from "@/components/inicio/PerguntasFrequentes";
import { Personalizacao } from "@/components/inicio/Personalizacao";
import { ProdutosDestaque } from "@/components/inicio/ProdutosDestaque";
import { Vantagens } from "@/components/inicio/Vantagens";

export default function PaginaInicial() {
  return (
    <>
      <Hero />
      <Categorias />
      <ProdutosDestaque />
      <Personalizacao />
      <Atacado />
      <Vantagens />
      <PerguntasFrequentes />
    </>
  );
}
