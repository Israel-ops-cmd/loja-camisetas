// Zera o estoque de teste antes de abrir a loja: as peças lisas e as peças
// prontas que o seed e a migration de estoque de lisas criaram (10 por
// variação). Depois disso, o estoque real é lançado no painel, em Estoque
// ("Chegaram peças").
//
//   npm run estoque:zerar-teste               mostra o que faria, sem gravar
//   npm run estoque:zerar-teste -- --aplicar  grava
//
// Usa o DIRECT_URL do .env.local. Para o banco de produção, defina o
// DIRECT_URL antes; ele vale no lugar do .env.local (ver docs/publicacao.md).
//
// Cada peça zerada ganha uma linha de ajuste no histórico do estoque. Se o
// banco já tiver pedido pago, o script para: aí o estoque pode ser real, e a
// contagem deve ser corrigida peça por peça no painel.

import { config } from "dotenv";
import { PrismaPg } from "@prisma/adapter-pg";

import { PrismaClient } from "../src/generated/prisma/client";

config({ path: ".env.local", quiet: true });

const OBSERVACAO = "Estoque de teste zerado antes do lançamento";
const STATUS_COM_PAGAMENTO = ["PAGO", "EM_SEPARACAO", "ENVIADO", "ENTREGUE"] as const;

const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DIRECT_URL }) });

/** Endereço do banco sem usuário e senha, para conferir onde vai gravar. */
function bancoAlvo() {
  try {
    const url = new URL(process.env.DIRECT_URL ?? "");
    return `${url.hostname}:${url.port || 5432}${url.pathname}`;
  } catch {
    return null;
  }
}

async function main() {
  const aplicar = process.argv.includes("--aplicar");
  const alvo = bancoAlvo();
  if (!alvo) {
    console.error("DIRECT_URL não configurado (.env.local ou variável de ambiente).");
    process.exitCode = 1;
    return;
  }
  console.log(`Banco: ${alvo}`);
  console.log(aplicar ? "Gravando.\n" : "Simulação: nada é gravado. Use -- --aplicar para gravar.\n");

  const pagos = await prisma.pedido.count({ where: { status: { in: [...STATUS_COM_PAGAMENTO] } } });
  if (pagos > 0) {
    console.error(`Este banco já tem ${pagos} pedido(s) pago(s): o estoque pode ser real. Nada foi alterado.`);
    console.error("Corrija a contagem pelo painel, em Estoque > Corrigir contagem.");
    process.exitCode = 1;
    return;
  }

  const lisas = await prisma.pecaLisa.findMany({
    where: { estoque: { not: 0 } },
    select: { id: true, estoque: true, modelo: { select: { nome: true } }, cor: { select: { nome: true } }, tamanho: { select: { nome: true } } },
  });
  const prontas = await prisma.variacao.findMany({
    where: { estoque: { not: 0 } },
    select: { id: true, estoque: true, produto: { select: { nome: true } }, modelo: { select: { nome: true } }, cor: { select: { nome: true } }, tamanho: { select: { nome: true } } },
  });

  const pecas = (lista: { estoque: number }[]) => lista.reduce((soma, p) => soma + p.estoque, 0);
  console.log(`Peças lisas com estoque: ${lisas.length} (${pecas(lisas)} peças)`);
  for (const l of lisas) console.log(`  ${l.modelo.nome} ${l.cor.nome} ${l.tamanho.nome}: ${l.estoque}`);
  console.log(`\nPeças prontas com estoque: ${prontas.length} (${pecas(prontas)} peças)`);
  for (const p of prontas) console.log(`  ${p.produto.nome} · ${p.modelo.nome} ${p.cor.nome} ${p.tamanho.nome}: ${p.estoque}`);

  if (lisas.length === 0 && prontas.length === 0) {
    console.log("\nNada a zerar.");
    return;
  }
  if (!aplicar) {
    console.log("\nSimulação concluída. Para gravar: npm run estoque:zerar-teste -- --aplicar");
    return;
  }

  // Tudo numa transação: se algo falhar, nada fica pela metade.
  await prisma.$transaction(
    async (tx) => {
      for (const l of lisas) {
        await tx.movimentacaoEstoque.create({ data: { pecaLisaId: l.id, quantidade: -l.estoque, motivo: "AJUSTE", observacao: OBSERVACAO } });
        await tx.pecaLisa.update({ where: { id: l.id }, data: { estoque: 0 } });
      }
      for (const p of prontas) {
        await tx.movimentacaoEstoque.create({ data: { variacaoId: p.id, quantidade: -p.estoque, motivo: "AJUSTE", observacao: OBSERVACAO } });
        await tx.variacao.update({ where: { id: p.id }, data: { estoque: 0 } });
      }
    },
    { timeout: 120_000, maxWait: 20_000 },
  );
  console.log("\nPronto. Lance o estoque real no painel, em Estoque (Chegaram peças).");
}

main()
  .catch((erro) => {
    console.error(erro);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
