import Link from "next/link";
import { notFound } from "next/navigation";
import { z } from "zod";

import { AcoesDeEstoque } from "@/components/admin/AcoesDeEstoque";
import { exigirAdministrador } from "@/lib/auth";
import { pecasEsperandoEnvio } from "@/lib/estoque";
import { rotulosDeMovimentacao } from "@/lib/estoque-regras";
import { formatarDataHora } from "@/lib/pedidos";
import { prisma } from "@/lib/prisma";

const LIMITE_DO_HISTORICO = 50;

export default async function PaginaHistoricoDoEstoque({ params }: PageProps<"/admin/estoque/[id]">) {
  await exigirAdministrador();
  const { id } = await params;
  if (!z.uuid().safeParse(id).success) notFound();

  const v = await prisma.variacao.findUnique({
    where: { id },
    select: {
      id: true,
      sku: true,
      estoque: true,
      ativo: true,
      produto: { select: { id: true, nome: true } },
      cor: { select: { nome: true, hex: true } },
      tamanho: { select: { nome: true } },
      movimentacoes: {
        orderBy: { criadoEm: "desc" },
        take: LIMITE_DO_HISTORICO,
        select: { id: true, quantidade: true, motivo: true, observacao: true, criadoEm: true, pedido: { select: { numero: true } } },
      },
    },
  });
  if (!v) notFound();
  const reservadas = (await pecasEsperandoEnvio([v.id])).get(v.id) ?? 0;

  return (
    <div className="secao">
      <div className="mx-auto max-w-3xl">
        <p className="sobretitulo text-secundario">
          <Link href={`/admin/estoque?produto=${v.produto.id}`} className="hover:text-tinta">Estoque</Link>
        </p>
        <h1 className="titulo-destaque mt-4 break-words">{v.produto.nome}</h1>
        <p className="mt-2 text-[14px] text-secundario">Código {v.sku}{!v.ativo && " · fora de venda"}</p>

        <section className="mt-8 rounded-[20px] bg-papel px-5 sm:px-8">
          <AcoesDeEstoque
            variacaoId={v.id}
            rotulo={`${v.cor.nome} · ${v.tamanho.nome}`}
            hex={v.cor.hex}
            estoque={v.estoque}
            reservadas={reservadas}
            mostrarHistorico={false}
          />
        </section>

        <section className="mt-6 rounded-[20px] bg-papel p-5 sm:p-8">
          <h2 className="sobretitulo">Histórico</h2>
          {v.movimentacoes.length === 0 ? (
            <p className="mt-4 text-[15px] text-apoio">Nenhuma movimentação ainda.</p>
          ) : (
            <ol className="mt-4 divide-y divide-borda">
              {v.movimentacoes.map((m) => (
                <li key={m.id} className="flex items-start gap-4 py-3">
                  <span
                    className={`w-14 shrink-0 text-right text-[18px] font-bold ${m.quantidade > 0 ? "" : "text-secundario"}`}
                  >
                    {m.quantidade > 0 ? `+${m.quantidade}` : `−${-m.quantidade}`}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-[15px] font-semibold">
                      {rotulosDeMovimentacao[m.motivo]}
                      {m.pedido && ` · pedido #${m.pedido.numero}`}
                    </span>
                    {m.observacao && m.motivo !== "VENDA" && m.motivo !== "CANCELAMENTO" && (
                      <span className="block text-[14px] text-apoio">{m.observacao}</span>
                    )}
                    <span className="block text-[13px] text-secundario">{formatarDataHora(m.criadoEm)}</span>
                  </span>
                </li>
              ))}
            </ol>
          )}
          {v.movimentacoes.length === LIMITE_DO_HISTORICO && (
            <p className="mt-3 text-[13px] text-secundario">Mostrando as {LIMITE_DO_HISTORICO} últimas.</p>
          )}
        </section>
      </div>
    </div>
  );
}
