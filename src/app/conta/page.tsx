import type { Metadata } from "next";
import Link from "next/link";
import { LayoutDashboard, LogOut } from "lucide-react";

import { sair } from "@/app/conta/acoes";
import { Aviso } from "@/components/formulario/Aviso";
import { exigirUsuario } from "@/lib/auth";

export const metadata: Metadata = {
  title: "Minha conta",
  robots: { index: false },
};

export default async function PaginaConta({
  searchParams,
}: PageProps<"/conta">) {
  const usuario = await exigirUsuario("/conta");
  const parametros = await searchParams;

  return (
    <div className="secao">
      <div className="mx-auto max-w-3xl">
        <h1 className="titulo-listagem">Minha conta</h1>

        <div className="mt-10 space-y-3">
          {parametros["boas-vindas"] && (
            <Aviso tipo="sucesso">
              Conta confirmada. Boas-vindas à Carta Viva, {usuario.nome}!
            </Aviso>
          )}
          {parametros.senha === "alterada" && (
            <Aviso tipo="sucesso">Senha alterada.</Aviso>
          )}
        </div>

        <section
          aria-labelledby="titulo-dados"
          className="mt-6 rounded-[20px] bg-papel p-6 sm:p-8"
        >
          <h2 id="titulo-dados" className="sobretitulo">
            Seus dados
          </h2>
          <dl className="mt-5 space-y-4">
            <div>
              <dt className="text-[13px] text-secundario">Nome</dt>
              <dd className="text-[16px] font-semibold">{usuario.nome}</dd>
            </div>
            <div>
              <dt className="text-[13px] text-secundario">E-mail</dt>
              <dd className="text-[16px] font-semibold break-all">
                {usuario.email}
              </dd>
            </div>
          </dl>
          <Link
            href="/recuperar-senha"
            className="mt-5 inline-flex min-h-11 items-center text-[14px] underline underline-offset-4 hover:text-secundario"
          >
            Trocar senha
          </Link>
        </section>

        <section
          aria-labelledby="titulo-pedidos"
          className="mt-6 rounded-[20px] bg-papel p-6 sm:p-8"
        >
          <h2 id="titulo-pedidos" className="sobretitulo">
            Pedidos
          </h2>
          <p className="mt-4 text-apoio">Você ainda não fez nenhum pedido.</p>
        </section>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          {usuario.administrador && (
            <Link
              href="/admin"
              className="texto-menu inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-tinta px-7 font-bold text-papel transition hover:bg-painel"
            >
              <LayoutDashboard aria-hidden="true" className="size-5" strokeWidth={1.6} />
              Ir para o painel
            </Link>
          )}
          <form action={sair}>
            <button
              type="submit"
              className="texto-menu inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-full border border-borda bg-papel px-7 font-bold transition hover:border-tinta"
            >
              <LogOut aria-hidden="true" className="size-5" strokeWidth={1.6} />
              Sair
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
