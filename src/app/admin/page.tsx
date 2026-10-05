import Link from "next/link";
import { Palette } from "lucide-react";

import { exigirAdministrador } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export default async function PaginaPainel() {
  const usuario = await exigirAdministrador();
  const aguardandoLoja = await prisma.personalizacao.count({
    where: { status: { in: ["RECEBIDA", "AJUSTE_SOLICITADO"] } },
  });

  return (
    <div className="secao">
      <div className="mx-auto max-w-5xl">
        <p className="sobretitulo text-secundario">Painel</p>
        <h1 className="titulo-destaque mt-4">Olá, {usuario.nome}.</h1>
        <p className="texto-destaque mt-6 max-w-xl text-apoio">
          O cadastro de produtos, o controle de estoque e a lista de pedidos chegam
          nas próximas etapas.
        </p>

        <ul className="mt-10 grid gap-4 sm:grid-cols-2">
          <li>
            <Link
              href="/admin/personalizacoes"
              className="flex min-h-28 items-start gap-4 rounded-[20px] bg-papel p-6 transition hover:ring-2 hover:ring-tinta"
            >
              <Palette aria-hidden="true" className="size-7 shrink-0" strokeWidth={1.5} />
              <span>
                <span className="block font-titulo text-[20px] font-bold uppercase">Personalizações</span>
                <span className="mt-1 block text-[14px] text-apoio">
                  {aguardandoLoja === 0
                    ? "Nada esperando a loja."
                    : aguardandoLoja === 1
                      ? "1 pedido esperando prévia."
                      : `${aguardandoLoja} pedidos esperando prévia.`}
                </span>
              </span>
            </Link>
          </li>
        </ul>
      </div>
    </div>
  );
}
