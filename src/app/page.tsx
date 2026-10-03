import { Atacado } from "@/components/inicio/Atacado";
import { Categorias } from "@/components/inicio/Categorias";
import { Hero } from "@/components/inicio/Hero";
import { PerguntasFrequentes } from "@/components/inicio/PerguntasFrequentes";
import { Personalizacao } from "@/components/inicio/Personalizacao";
import { ProdutosDestaque } from "@/components/inicio/ProdutosDestaque";
import { Vantagens } from "@/components/inicio/Vantagens";

// Os destaques vêm do banco. A página é gerada estática e refeita a cada
// 5 minutos; o painel (etapa 12) vai forçar a atualização ao editar produtos.
export const revalidate = 300;

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
