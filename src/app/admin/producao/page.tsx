import Link from "next/link";

import { BotaoEstampadas } from "@/components/admin/BotaoEstampadas";
import { exigirAdministrador } from "@/lib/auth";
import { DIAS_PARA_DESPACHAR, somarDiasUteis, STATUS_ESPERANDO_ENVIO } from "@/lib/estoque-regras";
import { formatarData } from "@/lib/pedidos";
import { prisma } from "@/lib/prisma";

/**
 * Peças para estampar: as de pedidos pagos que saíram das lisas (arte sem
 * peça pronta ou personalização). Agrupadas por arte, com o prazo de despacho.
 */
export default async function PaginaProducao() {
  await exigirAdministrador();

  const itens = await prisma.itemPedido.findMany({
    where: {
      estampar: true,
      estampadoEm: null,
      quantidadeDaLisa: { gt: 0 },
      pedido: { status: { in: STATUS_ESPERANDO_ENVIO } },
    },
    orderBy: { pedido: { pagoEm: "asc" } },
    select: {
      id: true,
      quantidadeDaLisa: true,
      nomeProduto: true,
      nomeCor: true,
      nomeTamanho: true,
      variacao: {
        select: {
          produtoId: true,
          modelo: { select: { nome: true } },
          cor: { select: { hex: true } },
        },
      },
      pedido: { select: { numero: true, pagoEm: true, criadoEm: true, personalizacao: { select: { numero: true } } } },
    },
  });

  const hoje = somarDiasUteis(new Date(), 0);
  const grupos = new Map<
    string,
    { titulo: string; link: string; linhas: ((typeof itens)[number] & { prazo: Date })[] }
  >();
  for (const item of itens) {
    const personalizacao = item.pedido.personalizacao;
    const chave = personalizacao ? `p${personalizacao.numero}` : item.variacao.produtoId;
    if (!grupos.has(chave)) {
      grupos.set(
        chave,
        personalizacao
          ? { titulo: `Personalização nº ${personalizacao.numero}`, link: `/admin/personalizacoes/${personalizacao.numero}`, linhas: [] }
          : { titulo: item.nomeProduto, link: `/admin/produtos/${item.variacao.produtoId}`, linhas: [] },
      );
    }
    const dias = personalizacao ? DIAS_PARA_DESPACHAR.personalizacao : DIAS_PARA_DESPACHAR.aEstampar;
    grupos.get(chave)!.linhas.push({ ...item, prazo: somarDiasUteis(item.pedido.pagoEm ?? item.pedido.criadoEm, dias) });
  }
  const total = itens.reduce((s, i) => s + i.quantidadeDaLisa, 0);

  return (
    <div className="secao">
      <div className="mx-auto max-w-3xl">
        <h1 className="titulo-destaque">Produção</h1>
        <p className="mt-4 text-[16px] text-apoio">
          Peças de pedidos pagos que saíram das lisas e precisam ser estampadas antes do envio. Toque em{" "}
          <strong>Estampadas</strong> quando terminar: se o pedido for cancelado depois, elas voltam como peças
          prontas da arte. O prazo é para despachar (dias úteis, sem contar feriados).
        </p>

        {itens.length === 0 ? (
          <p className="mt-10 text-[16px] text-apoio">Nada para estampar agora.</p>
        ) : (
          <>
            <p className="mt-6 text-[16px] font-semibold">
              {total === 1 ? "1 peça para estampar." : `${total} peças para estampar.`}
            </p>
            <div className="mt-6 space-y-6">
              {[...grupos.values()].map((g) => (
                <section key={g.link} className="rounded-[20px] bg-papel px-5 py-4 sm:px-8">
                  <h2 className="flex flex-wrap items-baseline justify-between gap-x-4 pt-2">
                    <span className="text-[18px] font-bold">{g.titulo}</span>
                    <Link href={g.link} className="inline-flex min-h-11 items-center text-[14px] font-semibold underline underline-offset-4">
                      Ver arte
                    </Link>
                  </h2>
                  <ul className="divide-y divide-borda">
                    {g.linhas.map((l) => {
                      const atrasado = l.prazo < hoje;
                      return (
                        <li key={l.id} className="flex flex-wrap items-center gap-4 py-4">
                          <span
                            aria-hidden="true"
                            className="size-5 shrink-0 rounded-full border border-borda"
                            style={{ backgroundColor: l.variacao.cor.hex }}
                          />
                          <span className="min-w-0 flex-1">
                            <span className="block text-[16px] font-semibold">
                              {l.quantidadeDaLisa}× {l.variacao.modelo.nome} · {l.nomeCor} · {l.nomeTamanho}
                            </span>
                            <span className="block text-[14px] text-apoio">
                              <Link href={`/admin/pedidos/${l.pedido.numero}`} className="underline underline-offset-4">
                                Pedido #{l.pedido.numero}
                              </Link>{" "}
                              · <span className={atrasado ? "font-bold text-tinta" : ""}>
                                {atrasado ? "atrasado, era até" : "despachar até"} {formatarData(l.prazo)}
                              </span>
                            </span>
                          </span>
                          <BotaoEstampadas itemId={l.id} />
                        </li>
                      );
                    })}
                  </ul>
                </section>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
