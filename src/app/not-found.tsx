import { Marca } from "@/components/marca/Logo";
import { Botao } from "@/components/ui/Botao";

export default function NaoEncontrado() {
  return (
    <div className="secao flex flex-col items-center text-center">
      <Marca className="size-16 text-tinta" />
      <p className="sobretitulo mt-8 text-secundario">Erro 404</p>
      <h1 className="titulo-destaque mt-4">Página não encontrada.</h1>
      <p className="texto-destaque mt-6 max-w-md text-apoio">
        Essa carta se perdeu no caminho. O endereço pode estar errado ou o
        produto não está mais disponível.
      </p>
      <div className="mt-9 flex flex-col gap-3 sm:flex-row">
        <Botao href="/produtos">Ver produtos</Botao>
        <Botao href="/" variante="secundario">
          Página inicial
        </Botao>
      </div>
    </div>
  );
}
