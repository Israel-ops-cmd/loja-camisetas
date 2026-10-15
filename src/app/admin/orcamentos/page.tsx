import Link from "next/link";

import type { StatusOrcamento } from "@/generated/prisma/enums";
import { exigirAdministrador } from "@/lib/auth";
import { rotulosDeStatusDoOrcamento, rotulosDeTipoDePeca } from "@/lib/orcamento-regras";
import { formatarData } from "@/lib/pedidos";
import { prisma } from "@/lib/prisma";

const PRIORIDADE: StatusOrcamento[] = ["NOVO", "EM_CONTATO", "FECHADO", "SEM_RETORNO"];

export default async function PaginaAdminOrcamentos() {
  await exigirAdministrador();

  const lista = await prisma.orcamento.findMany({
    orderBy: { criadoEm: "desc" },
    take: 200,
    select: {
      numero: true, status: true, nome: true, empresa: true, cidade: true, uf: true,
      tipoDePeca: true, quantidade: true, criadoEm: true,
    },
  });
  lista.sort((a, b) => PRIORIDADE.indexOf(a.status) - PRIORIDADE.indexOf(b.status));

  return (
    <div className="secao">
      <div className="mx-auto max-w-5xl">
        <p className="sobretitulo text-secundario">
          <Link href="/admin" className="hover:text-tinta">Painel</Link>
        </p>
        <h1 className="titulo-destaque mt-4">Orçamentos</h1>

        {lista.length === 0 ? (
          <p className="mt-10 text-apoio">Nenhum pedido de orçamento ainda.</p>
        ) : (
          <ul className="mt-10 divide-y divide-borda rounded-[20px] bg-papel">
            {lista.map((o) => (
              <li key={o.numero}>
                <Link
                  href={`/admin/orcamentos/${o.numero}`}
                  className="flex min-h-16 flex-wrap items-center justify-between gap-x-6 gap-y-1 px-6 py-4 hover:bg-fundo"
                >
                  <span>
                    <span className="font-semibold">
                      nº {o.numero} · {o.nome}
                      {o.empresa && ` (${o.empresa})`}
                    </span>
                    <span className="block text-[14px] text-secundario">
                      {o.quantidade} peças · {rotulosDeTipoDePeca[o.tipoDePeca]} · {o.cidade}/{o.uf} ·{" "}
                      {formatarData(o.criadoEm)}
                    </span>
                  </span>
                  <span
                    className={`rounded-full px-3 py-1 text-[12px] font-bold tracking-[0.12em] uppercase ${o.status === "NOVO" ? "bg-tinta text-papel" : "border border-borda"}`}
                  >
                    {rotulosDeStatusDoOrcamento[o.status]}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
