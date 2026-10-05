import type { Metadata } from "next";
import Link from "next/link";
import { LayoutDashboard, LogOut } from "lucide-react";

import { sair } from "@/app/conta/acoes";
import { Aviso } from "@/components/formulario/Aviso";
import { exigirUsuario } from "@/lib/auth";
import { formatarPreco } from "@/lib/formatacao";
import {
  formatarData,
  formatarNumeroDoPedido,
  rotulosDeStatus,
} from "@/lib/pedidos";
import {
  formatarNumeroDaPersonalizacao,
  rotulosDeStatusDaPersonalizacao,
} from "@/lib/personalizacao-regras";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = {
  title: "Minha conta",
  robots: { index: false },
};

export default async function PaginaConta({
  searchParams,
}: PageProps<"/conta">) {
  const usuario = await exigirUsuario("/conta");
  const parametros = await searchParams;
  const pedidos = await prisma.pedido.findMany({
    where: { clienteId: usuario.id },
    orderBy: { criadoEm: "desc" },
    take: 50,
    select: {
      numero: true,
      status: true,
      totalEmCentavos: true,
      criadoEm: true,
    },
  });
  const personalizacoes = await prisma.personalizacao.findMany({
    where: { clienteId: usuario.id },
    orderBy: { criadoEm: "desc" },
    take: 50,
    select: { numero: true, status: true, criadoEm: true, produto: { select: { nome: true } } },
  });

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
          {pedidos.length === 0 ? (
            <p className="mt-4 text-apoio">Você ainda não fez nenhum pedido.</p>
          ) : (
            <ul className="mt-4 divide-y divide-borda">
              {pedidos.map((pedido) => (
                <li key={pedido.numero}>
                  <Link
                    href={`/pedidos/${pedido.numero}`}
                    className="flex min-h-16 flex-wrap items-center justify-between gap-x-4 gap-y-1 py-3 hover:text-secundario"
                  >
                    <span>
                      <span className="font-semibold">
                        Pedido {formatarNumeroDoPedido(pedido.numero)}
                      </span>
                      <span className="block text-[14px] text-secundario">
                        {formatarData(pedido.criadoEm)} ·{" "}
                        {rotulosDeStatus[pedido.status]}
                      </span>
                    </span>
                    <span className="font-semibold">
                      {formatarPreco(pedido.totalEmCentavos)}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        {personalizacoes.length > 0 && (
          <section
            aria-labelledby="titulo-personalizacoes"
            className="mt-6 rounded-[20px] bg-papel p-6 sm:p-8"
          >
            <h2 id="titulo-personalizacoes" className="sobretitulo">
              Personalizações
            </h2>
            <ul className="mt-4 divide-y divide-borda">
              {personalizacoes.map((p) => (
                <li key={p.numero}>
                  <Link
                    href={`/conta/personalizacoes/${p.numero}`}
                    className="flex min-h-16 flex-wrap items-center justify-between gap-x-4 gap-y-1 py-3 hover:text-secundario"
                  >
                    <span>
                      <span className="font-semibold">
                        Personalização {formatarNumeroDaPersonalizacao(p.numero)}
                      </span>
                      <span className="block text-[14px] text-secundario">
                        {p.produto.nome} · {formatarData(p.criadoEm)}
                      </span>
                    </span>
                    <span
                      className={`rounded-full px-3 py-1 text-[12px] font-bold tracking-[0.12em] uppercase ${p.status === "PREVIA_ENVIADA" || p.status === "APROVADA" ? "bg-tinta text-papel" : "border border-borda"}`}
                    >
                      {rotulosDeStatusDaPersonalizacao[p.status]}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}

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
