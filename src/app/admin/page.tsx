import { exigirAdministrador } from "@/lib/auth";

export default async function PaginaPainel() {
  const usuario = await exigirAdministrador();

  return (
    <div className="secao">
      <div className="mx-auto max-w-5xl">
        <p className="sobretitulo text-secundario">Painel</p>
        <h1 className="titulo-destaque mt-4">Olá, {usuario.nome}.</h1>
        <p className="texto-destaque mt-6 max-w-xl text-apoio">
          Aqui vão ficar o cadastro de produtos, o controle de estoque e os
          pedidos. Essas telas chegam nas próximas etapas.
        </p>
      </div>
    </div>
  );
}
