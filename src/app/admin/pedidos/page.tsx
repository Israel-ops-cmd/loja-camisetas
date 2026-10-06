import Link from "next/link";
import { CircleAlert, Search } from "lucide-react";

import type { Prisma } from "@/generated/prisma/client";
import { exigirAdministrador } from "@/lib/auth";
import { formatarPreco } from "@/lib/formatacao";
import { formatarData, rotulosDeStatus } from "@/lib/pedidos";
import { prisma } from "@/lib/prisma";

const FILTROS = [
  { valor: "atencao", rotulo: "Para fazer", onde: { OR: [{ alerta: { not: null } }, { status: { in: ["PAGO", "EM_SEPARACAO"] } }] } },
  { valor: "aguardando", rotulo: "Aguardando pagamento", onde: { status: "AGUARDANDO_PAGAMENTO" } },
  { valor: "enviados", rotulo: "Enviados", onde: { status: "ENVIADO" } },
  { valor: "entregues", rotulo: "Entregues", onde: { status: "ENTREGUE" } },
  { valor: "cancelados", rotulo: "Cancelados", onde: { status: "CANCELADO" } },
  { valor: "todos", rotulo: "Todos", onde: {} },
] satisfies { valor: string; rotulo: string; onde: Prisma.PedidoWhereInput }[];

const LIMITE = 100;

export default async function PaginaAdminPedidos({ searchParams }: PageProps<"/admin/pedidos">) {
  await exigirAdministrador();
  const busca = await searchParams;
  const filtro = FILTROS.find((f) => f.valor === busca.filtro) ?? FILTROS[0];
  const termo = typeof busca.busca === "string" ? busca.busca.trim().slice(0, 80) : "";
  const numero = /^#?\d{1,9}$/.test(termo) ? Number(termo.replace("#", "")) : null;

  const onde: Prisma.PedidoWhereInput = termo
    ? numero
      ? { numero }
      : {
          OR: [
            { compradorNome: { contains: termo, mode: "insensitive" } },
            { compradorEmail: { contains: termo, mode: "insensitive" } },
          ],
        }
    : filtro.onde;

  const pedidos = await prisma.pedido.findMany({
    where: onde,
    // "Para fazer": os mais antigos primeiro (quem pagou antes recebe antes).
    orderBy: filtro.valor === "atencao" && !termo ? [{ pagoEm: "asc" }, { criadoEm: "asc" }] : { criadoEm: "desc" },
    take: LIMITE,
    select: {
      numero: true,
      status: true,
      compradorNome: true,
      totalEmCentavos: true,
      criadoEm: true,
      pagoEm: true,
      alerta: true,
      personalizacao: { select: { numero: true } },
      itens: { select: { quantidade: true } },
    },
  });
  // Com alerta primeiro.
  pedidos.sort((a, b) => Number(!!b.alerta) - Number(!!a.alerta));

  return (
    <div className="secao">
      <div className="mx-auto max-w-5xl">
        <h1 className="titulo-destaque">Pedidos</h1>

        <form action="/admin/pedidos" className="mt-6 flex gap-2">
          <label htmlFor="busca" className="sr-only">Buscar pedido</label>
          <input
            id="busca"
            name="busca"
            defaultValue={termo}
            placeholder="Número ou nome do cliente"
            className="h-12 min-w-0 flex-1 rounded-full border border-borda bg-papel px-5 text-[16px] outline-none focus:border-tinta"
          />
          <button type="submit" className="inline-flex min-h-12 items-center gap-2 rounded-full bg-tinta px-5 text-[15px] font-bold text-papel hover:bg-painel">
            <Search aria-hidden="true" className="size-5" strokeWidth={1.8} />
            <span className="sr-only sm:not-sr-only">Buscar</span>
          </button>
        </form>

        {termo ? (
          <p className="mt-4 text-[15px]">
            Resultado da busca por <strong>{termo}</strong>.{" "}
            <Link href="/admin/pedidos" className="inline-flex min-h-11 items-center font-semibold underline underline-offset-4">
              Limpar busca
            </Link>
          </p>
        ) : (
          <nav aria-label="Filtrar pedidos" className="mt-4 flex gap-2 overflow-x-auto pb-1">
            {FILTROS.map((f) => (
              <Link
                key={f.valor}
                href={f.valor === "atencao" ? "/admin/pedidos" : `/admin/pedidos?filtro=${f.valor}`}
                aria-current={filtro.valor === f.valor ? "page" : undefined}
                className={`flex min-h-11 shrink-0 items-center rounded-full border px-4 text-[15px] font-semibold ${filtro.valor === f.valor ? "border-tinta bg-tinta text-papel" : "border-borda hover:border-tinta"}`}
              >
                {f.rotulo}
              </Link>
            ))}
          </nav>
        )}

        {pedidos.length === 0 ? (
          <p className="mt-10 text-[16px] text-apoio">
            {termo
              ? "Nenhum pedido encontrado. Confira o número ou tente parte do nome."
              : filtro.valor === "atencao"
                ? "Nada para fazer agora. Os pedidos pagos aparecem aqui para separar e enviar."
                : "Nenhum pedido aqui."}
          </p>
        ) : (
          <ul className="mt-6 divide-y divide-borda rounded-[20px] bg-papel">
            {pedidos.map((p) => {
              const pecas = p.itens.reduce((soma, i) => soma + i.quantidade, 0);
              return (
                <li key={p.numero}>
                  <Link
                    href={`/admin/pedidos/${p.numero}`}
                    className="flex min-h-20 flex-wrap items-center justify-between gap-x-4 gap-y-2 px-5 py-4 hover:bg-fundo sm:px-6"
                  >
                    <span className="min-w-0">
                      <span className="block font-semibold">
                        #{p.numero} · {p.compradorNome}
                      </span>
                      <span className="block text-[14px] text-secundario">
                        {pecas === 1 ? "1 peça" : `${pecas} peças`} · {formatarPreco(p.totalEmCentavos)} ·{" "}
                        {p.pagoEm ? `pago em ${formatarData(p.pagoEm)}` : `feito em ${formatarData(p.criadoEm)}`}
                        {p.personalizacao && ` · personalização nº ${p.personalizacao.numero}`}
                      </span>
                      {p.alerta && (
                        <span className="mt-1 flex items-center gap-1 text-[14px] font-semibold">
                          <CircleAlert aria-hidden="true" className="size-4 shrink-0" strokeWidth={2} />
                          Precisa de decisão
                        </span>
                      )}
                    </span>
                    <span
                      className={`shrink-0 rounded-full px-3 py-1 text-[12px] font-bold tracking-[0.12em] uppercase ${p.status === "PAGO" || p.status === "EM_SEPARACAO" ? "bg-tinta text-papel" : "border border-borda"}`}
                    >
                      {rotulosDeStatus[p.status]}
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
        {pedidos.length === LIMITE && (
          <p className="mt-3 text-[13px] text-secundario">Mostrando os {LIMITE} primeiros. Use a busca para achar um pedido.</p>
        )}
      </div>
    </div>
  );
}
