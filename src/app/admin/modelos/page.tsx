import Link from "next/link";
import { Plus } from "lucide-react";

import { classesBotao } from "@/components/ui/Botao";
import { exigirAdministrador } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export default async function PaginaAdminModelos() {
  await exigirAdministrador();

  const modelos = await prisma.modelo.findMany({
    orderBy: { ordem: "asc" },
    select: {
      id: true,
      nome: true,
      ativo: true,
      cores: { orderBy: { cor: { nome: "asc" } }, select: { cor: { select: { id: true, nome: true, hex: true } } } },
      medidas: { orderBy: { tamanho: { ordem: "asc" } }, select: { tamanho: { select: { nome: true } } } },
    },
  });

  return (
    <div className="secao">
      <div className="mx-auto max-w-5xl">
        <h1 className="titulo-destaque">Modelos</h1>
        <p className="mt-4 max-w-2xl text-[16px] text-apoio">
          O modelo é o tipo de peça (Tradicional, Baby Look...). Cada um tem as suas cores, os seus tamanhos com a tabela
          de medidas e o pacote para o frete. Nos produtos, você escolhe em quais modelos cada arte é vendida.
        </p>
        <Link href="/admin/modelos/novo" className={`${classesBotao("principal")} mt-6 w-full gap-2 sm:w-auto`}>
          <Plus aria-hidden="true" className="size-5" strokeWidth={2} />
          Cadastrar modelo novo
        </Link>

        <ul className="mt-8 divide-y divide-borda rounded-[20px] bg-papel">
          {modelos.map((m) => (
            <li key={m.id}>
              <Link href={`/admin/modelos/${m.id}`} className="flex min-h-20 items-center gap-4 px-4 py-4 hover:bg-fundo sm:px-6">
                <span className="min-w-0 flex-1">
                  <span className="block font-semibold">{m.nome}</span>
                  <span className="mt-1 block text-[14px] text-secundario">
                    {m.medidas.length > 0 ? `Tamanhos ${m.medidas.map((t) => t.tamanho.nome).join(", ")}` : "Sem tamanhos"}
                  </span>
                  <span className="mt-2 flex flex-wrap gap-1.5" aria-label={`Cores: ${m.cores.map((c) => c.cor.nome).join(", ") || "nenhuma"}`}>
                    {m.cores.map(({ cor }) => (
                      <span
                        key={cor.id}
                        title={cor.nome}
                        aria-hidden="true"
                        className="size-5 rounded-full border border-borda"
                        style={{ backgroundColor: cor.hex }}
                      />
                    ))}
                  </span>
                </span>
                <span
                  className={`shrink-0 rounded-full px-3 py-1 text-[12px] font-bold tracking-[0.12em] uppercase ${m.ativo ? "bg-tinta text-papel" : "border border-borda text-secundario"}`}
                >
                  {m.ativo ? "Em uso" : "Desligado"}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
