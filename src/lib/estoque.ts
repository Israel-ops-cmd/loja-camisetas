import "server-only";

import { Prisma } from "@/generated/prisma/client";
import { ehCamisetaLisa, STATUS_ESPERANDO_ENVIO } from "@/lib/estoque-regras";
import { prisma } from "@/lib/prisma";

type Transacao = Prisma.TransactionClient;

// ---------------------------------------------------------------- Peças esperando envio

/** Itens pagos que ainda estão na loja, com a divisão entre prontas e lisas. */
function itensEsperandoEnvio(onde: Prisma.ItemPedidoWhereInput) {
  return prisma.itemPedido.findMany({
    where: { ...onde, pedido: { status: { in: STATUS_ESPERANDO_ENVIO } } },
    select: {
      quantidade: true,
      quantidadeDaLisa: true,
      estampar: true,
      estampadoEm: true,
      variacaoId: true,
      variacao: { select: { pecaLisa: { select: { id: true } } } },
      pedido: { select: { personalizacao: { select: { id: true } } } },
    },
  });
}

/**
 * Peças prontas de cada arte que já foram vendidas e ainda estão na
 * prateleira (id da variação → quantidade): as que saíram das prontas e as
 * lisas que já foram estampadas com a arte.
 */
export async function prontasEsperandoEnvio(variacaoIds: string[]) {
  const total = new Map<string, number>();
  if (variacaoIds.length === 0) return total;
  for (const item of await itensEsperandoEnvio({ variacaoId: { in: variacaoIds } })) {
    const estampadasDaArte = item.estampar && item.estampadoEm && !item.pedido.personalizacao ? item.quantidadeDaLisa : 0;
    const n = item.quantidade - item.quantidadeDaLisa + estampadasDaArte;
    if (n > 0) total.set(item.variacaoId, (total.get(item.variacaoId) ?? 0) + n);
  }
  return total;
}

/**
 * Peças lisas já vendidas que ainda estão na prateleira, sem estampa (id da
 * peça lisa → quantidade): camisetas lisas e peças que esperam a estampa.
 */
export async function lisasEsperandoEnvio(pecaLisaIds: string[]) {
  const total = new Map<string, number>();
  if (pecaLisaIds.length === 0) return total;
  const itens = await itensEsperandoEnvio({ quantidadeDaLisa: { gt: 0 }, variacao: { pecaLisa: { id: { in: pecaLisaIds } } } });
  for (const item of itens) {
    if (item.estampar && item.estampadoEm) continue;
    const id = item.variacao.pecaLisa.id;
    total.set(id, (total.get(id) ?? 0) + item.quantidadeDaLisa);
  }
  return total;
}

// ---------------------------------------------------------------- Baixa e devolução

function somar(mapa: Map<string, number>, id: string, n: number) {
  if (n !== 0) mapa.set(id, (mapa.get(id) ?? 0) + n);
}

async function itensDoPedido(tx: Transacao, pedidoId: string) {
  return tx.itemPedido.findMany({
    where: { pedidoId },
    orderBy: { id: "asc" },
    select: {
      id: true,
      quantidade: true,
      quantidadeDaLisa: true,
      estampar: true,
      estampadoEm: true,
      nomeProduto: true,
      nomeCor: true,
      nomeTamanho: true,
      variacaoId: true,
      variacao: {
        select: {
          pecaLisa: { select: { id: true } },
          produto: { select: { categoria: { select: { slug: true } } } },
        },
      },
    },
  });
}

/**
 * Trava as linhas de estoque, sempre na mesma ordem (variações, depois
 * lisas, por id), para duas vendas ao mesmo tempo não se travarem.
 */
async function travar(tx: Transacao, variacaoIds: string[], pecaLisaIds: string[]) {
  if (variacaoIds.length === 0) return { estoqueDaVariacao: new Map<string, number>(), estoqueDaLisa: new Map<string, number>() };
  const ids = (lista: string[]) => Prisma.join([...new Set(lista)].map((id) => Prisma.sql`${id}::uuid`));
  const variacoes = await tx.$queryRaw<{ id: string; estoque: number }[]>`
    select id, estoque from variacoes where id in (${ids(variacaoIds)}) order by id for update`;
  const lisas = await tx.$queryRaw<{ id: string; estoque: number }[]>`
    select id, estoque from pecas_lisas where id in (${ids(pecaLisaIds)}) order by id for update`;
  return {
    estoqueDaVariacao: new Map(variacoes.map((v) => [v.id, v.estoque])),
    estoqueDaLisa: new Map(lisas.map((l) => [l.id, l.estoque])),
  };
}

async function gravarMovimentos(
  tx: Transacao,
  pedidoId: string,
  motivo: "VENDA" | "CANCELAMENTO",
  observacao: string,
  porVariacao: Map<string, number>,
  porLisa: Map<string, number>,
) {
  for (const [id, quantidade] of porVariacao) {
    await tx.variacao.update({ where: { id }, data: { estoque: { increment: quantidade } } });
  }
  for (const [id, quantidade] of porLisa) {
    await tx.pecaLisa.update({ where: { id }, data: { estoque: { increment: quantidade } } });
  }
  await tx.movimentacaoEstoque.createMany({
    data: [
      ...[...porVariacao].map(([variacaoId, quantidade]) => ({ variacaoId, pedidoId, quantidade, motivo, observacao })),
      ...[...porLisa].map(([pecaLisaId, quantidade]) => ({ pecaLisaId, pedidoId, quantidade, motivo, observacao })),
    ],
  });
}

/**
 * Baixa o estoque de um pedido pago. Em cada item de arte, usa primeiro as
 * peças prontas e o resto sai das lisas, marcado para estampar. Camiseta lisa
 * sai das lisas; personalização sai das lisas, para estampar. Se faltar peça,
 * a lisa fica negativa e a função devolve o que faltou (para o alerta), com
 * quantas peças vão para a estampa. Roda uma vez por pedido.
 */
export async function baixarEstoqueDoPedido(tx: Transacao, pedidoId: string, observacao: string) {
  const jaBaixado = await tx.movimentacaoEstoque.findFirst({ where: { pedidoId, motivo: "VENDA" }, select: { id: true } });
  if (jaBaixado) return { faltas: [], pecasAEstampar: 0, personalizacao: false };

  const personalizacao = await tx.personalizacao.findUnique({ where: { pedidoId }, select: { id: true } });
  const itens = await itensDoPedido(tx, pedidoId);
  const { estoqueDaVariacao, estoqueDaLisa } = await travar(
    tx,
    itens.map((i) => i.variacaoId),
    itens.map((i) => i.variacao.pecaLisa.id),
  );

  const porVariacao = new Map<string, number>();
  const porLisa = new Map<string, number>();
  const faltas: string[] = [];
  let pecasAEstampar = 0;
  for (const item of itens) {
    const lisa = ehCamisetaLisa(item.variacao.produto.categoria.slug);
    const daArte = !lisa && !personalizacao;
    const prontasNaPrateleira = daArte
      ? Math.max(estoqueDaVariacao.get(item.variacaoId)! + (porVariacao.get(item.variacaoId) ?? 0), 0)
      : 0;
    const prontas = Math.min(item.quantidade, prontasNaPrateleira);
    const daLisa = item.quantidade - prontas;

    const pecaLisaId = item.variacao.pecaLisa.id;
    const lisasAntes = Math.max(estoqueDaLisa.get(pecaLisaId)! + (porLisa.get(pecaLisaId) ?? 0), 0);
    if (daLisa > lisasAntes) {
      faltas.push(`${item.nomeProduto} (${item.nomeCor}, ${item.nomeTamanho}): faltam ${daLisa - lisasAntes}`);
    }

    somar(porVariacao, item.variacaoId, -prontas);
    somar(porLisa, pecaLisaId, -daLisa);
    if (!lisa || personalizacao) pecasAEstampar += daLisa;
    await tx.itemPedido.update({
      where: { id: item.id },
      data: { quantidadeDaLisa: daLisa, estampar: !lisa || !!personalizacao },
    });
  }

  await gravarMovimentos(tx, pedidoId, "VENDA", observacao, porVariacao, porLisa);
  return { faltas, pecasAEstampar, personalizacao: !!personalizacao };
}

/**
 * Devolve ao estoque as peças de um pedido cancelado depois do pagamento.
 * Prontas voltam para a arte; lisas ainda sem estampa voltam para as lisas;
 * lisas já estampadas com uma arte voltam como prontas dela. Peças
 * personalizadas já estampadas não voltam (a arte é do cliente): a função
 * devolve quantas foram, para o histórico. Roda uma vez por pedido.
 */
export async function devolverEstoqueDoPedido(tx: Transacao, pedidoId: string, observacao: string) {
  const jaDevolvido = await tx.movimentacaoEstoque.findFirst({
    where: { pedidoId, motivo: "CANCELAMENTO" },
    select: { id: true },
  });
  const baixado = await tx.movimentacaoEstoque.findFirst({ where: { pedidoId, motivo: "VENDA" }, select: { id: true } });
  if (jaDevolvido || !baixado) return { personalizadasPerdidas: 0 };

  const personalizacao = await tx.personalizacao.findUnique({ where: { pedidoId }, select: { id: true } });
  const itens = await itensDoPedido(tx, pedidoId);
  await travar(
    tx,
    itens.map((i) => i.variacaoId),
    itens.map((i) => i.variacao.pecaLisa.id),
  );

  const porVariacao = new Map<string, number>();
  const porLisa = new Map<string, number>();
  let personalizadasPerdidas = 0;
  for (const item of itens) {
    somar(porVariacao, item.variacaoId, item.quantidade - item.quantidadeDaLisa);
    if (!(item.estampar && item.estampadoEm)) {
      somar(porLisa, item.variacao.pecaLisa.id, item.quantidadeDaLisa);
    } else if (personalizacao) {
      personalizadasPerdidas += item.quantidadeDaLisa;
    } else {
      somar(porVariacao, item.variacaoId, item.quantidadeDaLisa);
    }
  }

  await gravarMovimentos(tx, pedidoId, "CANCELAMENTO", observacao, porVariacao, porLisa);
  return { personalizadasPerdidas };
}
