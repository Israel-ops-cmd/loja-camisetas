import Link from "next/link";

import type { StatusPersonalizacao } from "@/generated/prisma/enums";
import { exigirAdministrador } from "@/lib/auth";
import { formatarData } from "@/lib/pedidos";
import {
  formatarNumeroDaPersonalizacao,
  rotulosDeStatusDaPersonalizacao,
} from "@/lib/personalizacao-regras";
import { prisma } from "@/lib/prisma";

/** O que precisa de ação da loja aparece primeiro. */
const PRIORIDADE: StatusPersonalizacao[] = [
  "RECEBIDA",
  "AJUSTE_SOLICITADO",
  "PREVIA_ENVIADA",
  "APROVADA",
  "CONVERTIDA",
  "CANCELADA",
];

export default async function PaginaAdminPersonalizacoes() {
  await exigirAdministrador();

  const lista = await prisma.personalizacao.findMany({
    orderBy: { criadoEm: "desc" },
    take: 200,
    select: {
      numero: true,
      status: true,
      criadoEm: true,
      prazoDesejado: true,
      cliente: { select: { nome: true } },
      produto: { select: { nome: true } },
      cor: { select: { nome: true } },
      itens: { select: { quantidade: true } },
    },
  });
  lista.sort((a, b) => PRIORIDADE.indexOf(a.status) - PRIORIDADE.indexOf(b.status));

  return (
    <div className="secao">
      <div className="mx-auto max-w-5xl">
        <p className="sobretitulo text-secundario">
          <Link href="/admin" className="hover:text-tinta">Painel</Link>
        </p>
        <h1 className="titulo-destaque mt-4">Personalizações</h1>

        {lista.length === 0 ? (
          <p className="mt-10 text-apoio">Nenhum pedido de personalização ainda.</p>
        ) : (
          <ul className="mt-10 divide-y divide-borda rounded-[20px] bg-papel">
            {lista.map((p) => {
              const pecas = p.itens.reduce((t, i) => t + i.quantidade, 0);
              const precisaDeAcao = p.status === "RECEBIDA" || p.status === "AJUSTE_SOLICITADO";
              return (
                <li key={p.numero}>
                  <Link
                    href={`/admin/personalizacoes/${p.numero}`}
                    className="flex min-h-16 flex-wrap items-center justify-between gap-x-6 gap-y-1 px-6 py-4 hover:bg-fundo"
                  >
                    <span>
                      <span className="font-semibold">
                        {formatarNumeroDaPersonalizacao(p.numero)} · {p.cliente.nome}
                      </span>
                      <span className="block text-[14px] text-secundario">
                        {p.produto.nome}, {p.cor.nome} · {pecas} peças · {formatarData(p.criadoEm)}
                        {p.prazoDesejado && ` · prazo ${formatarData(p.prazoDesejado)}`}
                      </span>
                    </span>
                    <span
                      className={`rounded-full px-3 py-1 text-[12px] font-bold tracking-[0.12em] uppercase ${precisaDeAcao ? "bg-tinta text-papel" : "border border-borda"}`}
                    >
                      {rotulosDeStatusDaPersonalizacao[p.status]}
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
