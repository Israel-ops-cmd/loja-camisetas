import Link from "next/link";
import { z } from "zod";

import { AcoesDeEstoque } from "@/components/admin/AcoesDeEstoque";
import { exigirAdministrador } from "@/lib/auth";
import { lisasEsperandoEnvio, prontasEsperandoEnvio } from "@/lib/estoque";
import { CATEGORIA_DAS_LISAS, LIMITE_ULTIMAS_UNIDADES } from "@/lib/estoque-regras";
import { prisma } from "@/lib/prisma";

const ABAS = [
  { valor: "lisas", rotulo: "Peças lisas" },
  { valor: "prontas", rotulo: "Peças prontas" },
] as const;

const FILTROS = [
  { valor: "todos", rotulo: "Todos" },
  { valor: "acabando", rotulo: `Acabando (${LIMITE_ULTIMAS_UNIDADES} ou menos)` },
  { valor: "faltando", rotulo: "Faltando" },
] as const;

type Aba = (typeof ABAS)[number]["valor"];
type Filtro = (typeof FILTROS)[number]["valor"];

const filtroDoEstoque = (filtro: Filtro) =>
  filtro === "acabando" ? { lte: LIMITE_ULTIMAS_UNIDADES } : filtro === "faltando" ? { lt: 0 } : undefined;

export default async function PaginaAdminEstoque({ searchParams }: PageProps<"/admin/estoque">) {
  await exigirAdministrador();
  const busca = await searchParams;
  const produtoId = typeof busca.produto === "string" && z.uuid().safeParse(busca.produto).success ? busca.produto : null;
  const aba: Aba = produtoId || busca.aba === "prontas" ? "prontas" : "lisas";
  const filtro = FILTROS.find((f) => f.valor === busca.filtro)?.valor ?? "todos";

  const link = (mudanca: { aba?: Aba; filtro?: Filtro }) => {
    const p = new URLSearchParams();
    const proximaAba = mudanca.aba ?? aba;
    const proximoFiltro = mudanca.filtro ?? (mudanca.aba ? "todos" : filtro);
    if (proximaAba !== "lisas") p.set("aba", proximaAba);
    if (proximoFiltro !== "todos") p.set("filtro", proximoFiltro);
    if (produtoId && !mudanca.aba) p.set("produto", produtoId);
    const q = p.toString();
    return q ? `/admin/estoque?${q}` : "/admin/estoque";
  };

  return (
    <div className="secao">
      <div className="mx-auto max-w-3xl">
        <h1 className="titulo-destaque">Estoque</h1>
        <p className="mt-4 text-[16px] text-apoio">
          <strong>Peças lisas</strong> são as camisetas sem estampa, por modelo, cor e tamanho: vendem como lisas e
          viram arte ou personalização quando estampadas. <strong>Peças prontas</strong> são as já estampadas de cada
          arte. A loja vende primeiro a pronta; sem ela, usa uma lisa e o pedido entra em Produção.
        </p>

        <nav aria-label="Tipo de peça" className="mt-6 grid grid-cols-2 gap-2">
          {ABAS.map((a) => (
            <Link
              key={a.valor}
              href={link({ aba: a.valor })}
              aria-current={aba === a.valor ? "page" : undefined}
              className={`flex min-h-12 items-center justify-center rounded-xl border text-[16px] font-bold ${aba === a.valor ? "border-tinta bg-tinta text-papel" : "border-borda bg-papel hover:border-tinta"}`}
            >
              {a.rotulo}
            </Link>
          ))}
        </nav>

        <nav aria-label="Filtrar estoque" className="mt-4 flex flex-wrap gap-2">
          {FILTROS.map((f) => (
            <Link
              key={f.valor}
              href={link({ filtro: f.valor })}
              aria-current={filtro === f.valor ? "page" : undefined}
              className={`flex min-h-11 items-center rounded-full border px-4 text-[15px] font-semibold ${filtro === f.valor ? "border-tinta bg-tinta text-papel" : "border-borda hover:border-tinta"}`}
            >
              {f.rotulo}
            </Link>
          ))}
        </nav>

        {aba === "lisas" ? (
          <PecasLisas filtro={filtro} />
        ) : (
          <PecasProntas filtro={filtro} produtoId={produtoId} todos={link({ filtro })} />
        )}
      </div>
    </div>
  );
}

/** Peças lisas de cada modelo: as cores e os tamanhos dele, e qualquer outra com peças. */
async function PecasLisas({ filtro }: { filtro: Filtro }) {
  const estoque = filtroDoEstoque(filtro);
  const modelos = await prisma.modelo.findMany({
    orderBy: { ordem: "asc" },
    select: {
      id: true,
      nome: true,
      ativo: true,
      cores: { select: { corId: true } },
      medidas: { select: { tamanhoId: true } },
      pecasLisas: {
        where: estoque && { estoque },
        orderBy: [{ cor: { nome: "asc" } }, { tamanho: { ordem: "asc" } }],
        select: {
          id: true,
          estoque: true,
          corId: true,
          tamanhoId: true,
          cor: { select: { nome: true, hex: true } },
          tamanho: { select: { nome: true } },
        },
      },
    },
  });
  const grupos = modelos
    .map((m) => {
      const cores = new Set(m.cores.map((c) => c.corId));
      const tamanhos = new Set(m.medidas.map((t) => t.tamanhoId));
      const pecas = m.pecasLisas.filter(
        (p) => p.estoque !== 0 || (m.ativo && cores.has(p.corId) && tamanhos.has(p.tamanhoId)),
      );
      return { ...m, pecas, total: pecas.reduce((s, p) => s + Math.max(p.estoque, 0), 0) };
    })
    .filter((m) => m.pecas.length > 0);
  const reservadas = await lisasEsperandoEnvio(grupos.flatMap((m) => m.pecas.map((p) => p.id)));

  if (grupos.length === 0) {
    return (
      <p className="mt-10 text-[16px] text-apoio">
        {filtro === "acabando"
          ? "Nenhuma peça lisa acabando."
          : filtro === "faltando"
            ? "Nada faltando: nenhum pedido pago ficou sem peça lisa."
            : "Nenhum modelo com cores e tamanhos. Cadastre em Modelos."}
      </p>
    );
  }

  return (
    <div className="mt-8 space-y-4">
      {grupos.map((m) => (
        <details key={m.id} open={filtro !== "todos" || grupos.length === 1} className="rounded-[20px] bg-papel px-5 sm:px-8">
          <summary className="flex min-h-16 cursor-pointer flex-wrap items-center gap-x-4 py-3">
            <span className="text-[18px] font-bold">{m.nome}</span>
            {!m.ativo && <span className="text-[13px] text-secundario">(modelo desligado)</span>}
            <span className="ml-auto text-[15px] text-secundario">
              {m.total === 1 ? "1 peça" : `${m.total} peças`}
            </span>
          </summary>
          <div className="divide-y divide-borda border-t border-borda">
            {m.pecas.map((p) => (
              <AcoesDeEstoque
                key={p.id}
                peca={{ tipo: "lisa", id: p.id }}
                rotulo={`${p.cor.nome} · ${p.tamanho.nome}`}
                hex={p.cor.hex}
                estoque={p.estoque}
                reservadas={reservadas.get(p.id) ?? 0}
              />
            ))}
          </div>
        </details>
      ))}
    </div>
  );
}

/** Peças prontas (já estampadas) de cada arte. Camisetas lisas não entram. */
async function PecasProntas({ filtro, produtoId, todos }: { filtro: Filtro; produtoId: string | null; todos: string }) {
  const estoque = filtroDoEstoque(filtro);
  const variacoes = { ativo: true, ...(estoque && { estoque }) };
  const produtos = await prisma.produto.findMany({
    where: {
      ...(produtoId && { id: produtoId }),
      categoria: { slug: { not: CATEGORIA_DAS_LISAS } },
      variacoes: { some: variacoes },
    },
    orderBy: [{ ativo: "desc" }, { nome: "asc" }],
    select: {
      id: true,
      nome: true,
      ativo: true,
      variacoes: {
        where: variacoes,
        orderBy: [{ modelo: { ordem: "asc" } }, { cor: { nome: "asc" } }, { tamanho: { ordem: "asc" } }],
        select: {
          id: true,
          estoque: true,
          pecaLisa: { select: { estoque: true } },
          modelo: { select: { nome: true } },
          cor: { select: { nome: true, hex: true } },
          tamanho: { select: { nome: true } },
        },
      },
    },
  });
  const reservadas = await prontasEsperandoEnvio(produtos.flatMap((p) => p.variacoes.map((v) => v.id)));
  const nomeDoProduto = produtoId ? produtos[0]?.nome : null;

  return (
    <>
      {produtoId && (
        <p className="mt-6 flex flex-wrap items-center gap-x-4 gap-y-1 text-[15px]">
          <span>
            Só o produto <strong>{nomeDoProduto ?? "escolhido"}</strong>.
          </span>
          <Link href={todos} className="inline-flex min-h-11 items-center font-semibold underline underline-offset-4">
            Ver todos os produtos
          </Link>
        </p>
      )}
      <p className="mt-6 text-[14px] text-apoio">
        Ter peça pronta é opcional: sem ela, a arte continua à venda usando as lisas. Use{" "}
        <strong>Estampar peças</strong> quando estampar lisas para deixar prontas.
      </p>

      {produtos.length === 0 ? (
        <p className="mt-10 text-[16px] text-apoio">
          {filtro === "acabando"
            ? "Nenhuma arte com peças prontas acabando."
            : filtro === "faltando"
              ? "Nada faltando."
              : "Nenhuma arte com cores e tamanhos à venda. Escolha os tamanhos na página do produto."}
        </p>
      ) : (
        <div className="mt-6 space-y-6">
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
                    peca={{ tipo: "pronta", id: v.id }}
                    rotulo={`${v.modelo.nome} · ${v.cor.nome} · ${v.tamanho.nome}`}
                    hex={v.cor.hex}
                    estoque={v.estoque}
                    reservadas={reservadas.get(v.id) ?? 0}
                    lisas={v.pecaLisa.estoque}
                  />
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </>
  );
}
