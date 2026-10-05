import Link from "next/link";
import { z } from "zod";

import { AcoesDeEstoque } from "@/components/admin/AcoesDeEstoque";
import { exigirAdministrador } from "@/lib/auth";
import { pecasEsperandoEnvio } from "@/lib/estoque";
import { LIMITE_ULTIMAS_UNIDADES } from "@/lib/estoque-regras";
import { prisma } from "@/lib/prisma";

const FILTROS = [
  { valor: "todos", rotulo: "Todos" },
  { valor: "acabando", rotulo: `Acabando (${LIMITE_ULTIMAS_UNIDADES} ou menos)` },
  { valor: "faltando", rotulo: "Faltando" },
] as const;

export default async function PaginaAdminEstoque({ searchParams }: PageProps<"/admin/estoque">) {
  await exigirAdministrador();
  const busca = await searchParams;
  const filtro = FILTROS.find((f) => f.valor === busca.filtro)?.valor ?? "todos";
  const produtoId = typeof busca.produto === "string" && z.uuid().safeParse(busca.produto).success ? busca.produto : null;

  const estoque =
    filtro === "acabando" ? { lte: LIMITE_ULTIMAS_UNIDADES } : filtro === "faltando" ? { lt: 0 } : undefined;
  const produtos = await prisma.produto.findMany({
    where: {
      ...(produtoId && { id: produtoId }),
      variacoes: { some: { ativo: true, ...(estoque && { estoque }) } },
    },
    orderBy: [{ ativo: "desc" }, { nome: "asc" }],
    select: {
      id: true,
      nome: true,
      ativo: true,
      variacoes: {
        where: { ativo: true, ...(estoque && { estoque }) },
        orderBy: [{ cor: { nome: "asc" } }, { tamanho: { ordem: "asc" } }],
        select: { id: true, estoque: true, cor: { select: { nome: true, hex: true } }, tamanho: { select: { nome: true } } },
      },
    },
  });
  const reservadas = await pecasEsperandoEnvio(produtos.flatMap((p) => p.variacoes.map((v) => v.id)));
  const nomeDoProduto = produtoId ? produtos[0]?.nome : null;

  const link = (f: string) => {
    const p = new URLSearchParams();
    if (f !== "todos") p.set("filtro", f);
    if (produtoId) p.set("produto", produtoId);
    const q = p.toString();
    return q ? `/admin/estoque?${q}` : "/admin/estoque";
  };

  return (
    <div className="secao">
      <div className="mx-auto max-w-3xl">
        <h1 className="titulo-destaque">Estoque</h1>
        <p className="mt-4 text-[16px] text-apoio">
          Use <strong>Chegaram peças</strong> quando receber um lote (o sistema soma) e <strong>Corrigir contagem</strong>{" "}
          quando contar a prateleira (o sistema acerta o total). Tudo fica no histórico.
        </p>

        {produtoId && (
          <p className="mt-6 flex flex-wrap items-center gap-x-4 gap-y-1 text-[15px]">
            <span>
              Só o produto <strong>{nomeDoProduto ?? "escolhido"}</strong>.
            </span>
            <Link href={filtro === "todos" ? "/admin/estoque" : `/admin/estoque?filtro=${filtro}`} className="inline-flex min-h-11 items-center font-semibold underline underline-offset-4">
              Ver todos os produtos
            </Link>
          </p>
        )}

        <nav aria-label="Filtrar estoque" className="mt-6 flex flex-wrap gap-2">
          {FILTROS.map((f) => (
            <Link
              key={f.valor}
              href={link(f.valor)}
              aria-current={filtro === f.valor ? "page" : undefined}
              className={`flex min-h-11 items-center rounded-full border px-4 text-[15px] font-semibold ${filtro === f.valor ? "border-tinta bg-tinta text-papel" : "border-borda hover:border-tinta"}`}
            >
              {f.rotulo}
            </Link>
          ))}
        </nav>

        {produtos.length === 0 ? (
          <p className="mt-10 text-[16px] text-apoio">
            {filtro === "acabando"
              ? "Nenhum tamanho acabando. Tudo com estoque."
              : filtro === "faltando"
                ? "Nada faltando: nenhum pedido pago ficou sem peça."
                : "Nenhum produto com cores e tamanhos à venda. Escolha os tamanhos na página do produto."}
          </p>
        ) : (
          <div className="mt-8 space-y-6">
            {produtos.map((p) => (
              <section key={p.id} className="rounded-[20px] bg-papel px-5 py-4 sm:px-8">
                <h2 className="flex flex-wrap items-baseline justify-between gap-x-4 pt-2">
                  <span className="text-[18px] font-bold">{p.nome}</span>
                  <Link href={`/admin/produtos/${p.id}`} className="inline-flex min-h-11 items-center text-[14px] font-semibold underline underline-offset-4">
                    {p.ativo ? "Editar produto" : "Escondido da loja · editar"}
                  </Link>
                </h2>
                <div className="divide-y divide-borda">
                  {p.variacoes.map((v) => (
                    <AcoesDeEstoque
                      key={v.id}
                      variacaoId={v.id}
                      rotulo={`${v.cor.nome} · ${v.tamanho.nome}`}
                      hex={v.cor.hex}
                      estoque={v.estoque}
                      reservadas={reservadas.get(v.id) ?? 0}
                    />
                  ))}
                </div>
              </section>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
