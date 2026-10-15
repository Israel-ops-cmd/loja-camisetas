// Lista o que ainda falta preencher antes de publicar:
// 1. marcadores entre colchetes no código, como [PRAZO DE DESPACHO];
// 2. dados da loja ainda nulos em src/lib/loja.ts (viram marcador na tela);
// 3. produtos à venda sem foto ou sem descrição (consulta o banco do .env.local).
// Uso: npm run conferir-marcadores. Sai com erro (código 1) se faltar algo.

import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";

import { config } from "dotenv";
import pg from "pg";

const RAIZ = process.cwd();
const PASTAS = ["src"];
const IGNORAR = [join("src", "generated")];
const MARCADOR = /\[[A-ZÁÉÍÓÚÂÊÔÃÕÇ][A-ZÁÉÍÓÚÂÊÔÃÕÇ0-9 ,.:/()-]{2,}\]/g;
/** Campos de src/lib/loja.ts que podem ficar vazios (somem da tela). */
const OPCIONAIS = new Set(["instagram"]);

function arquivos(pasta) {
  return readdirSync(pasta).flatMap((nome) => {
    const caminho = join(pasta, nome);
    if (IGNORAR.some((i) => caminho.startsWith(join(RAIZ, i)))) return [];
    if (statSync(caminho).isDirectory()) return arquivos(caminho);
    return /\.(tsx?|mjs)$/.test(nome) ? [caminho] : [];
  });
}

const achados = [];
for (const arquivo of PASTAS.flatMap((p) => arquivos(join(RAIZ, p)))) {
  readFileSync(arquivo, "utf8")
    .split(/\r?\n/)
    .forEach((linha, i) => {
      for (const m of linha.matchAll(MARCADOR)) achados.push(`${relative(RAIZ, arquivo)}:${i + 1}  ${m[0]}`);
    });
}

const loja = readFileSync(join(RAIZ, "src/lib/loja.ts"), "utf8");
const vazios = [...loja.matchAll(/^\s+(\w+): null as string \| null,/gm)].map((m) => m[1]);
const obrigatorios = vazios.filter((c) => !OPCIONAIS.has(c));
const opcionais = vazios.filter((c) => OPCIONAIS.has(c));
const semData = /ATUALIZACAO_DAS_POLITICAS: string \| null = null/.test(loja);

console.log(achados.length ? `Marcadores no código (${achados.length}):\n  ${achados.join("\n  ")}` : "Nenhum marcador no código.");
console.log(
  obrigatorios.length || semData
    ? `\nDados da loja sem preencher (src/lib/loja.ts): ${[...obrigatorios, ...(semData ? ["ATUALIZACAO_DAS_POLITICAS"] : [])].join(", ")}`
    : "\nDados obrigatórios da loja preenchidos.",
);
if (opcionais.length) console.log(`Opcionais vazios (não aparecem no site): ${opcionais.join(", ")}`);

let produtosIncompletos = 0;
config({ path: join(RAIZ, ".env.local"), quiet: true });
if (process.env.DIRECT_URL) {
  const banco = new pg.Client({ connectionString: process.env.DIRECT_URL });
  try {
    await banco.connect();
    const { rows } = await banco.query(`
      select p.nome,
        not exists (select 1 from produto_imagens i where i."produtoId" = p.id) as sem_foto,
        coalesce(trim(p.descricao), '') = '' as sem_descricao
      from produtos p where p.ativo order by p.nome`);
    const faltando = rows.filter((r) => r.sem_foto || r.sem_descricao);
    produtosIncompletos = faltando.length;
    const linhas = faltando.map(
      (r) => `${r.nome}: ${[r.sem_foto && "sem foto", r.sem_descricao && "sem descrição"].filter(Boolean).join(", ")}`,
    );
    console.log(
      faltando.length
        ? `\nProdutos à venda incompletos (${faltando.length}):\n  ${linhas.join("\n  ")}`
        : "\nTodos os produtos à venda têm foto e descrição.",
    );
  } catch (erro) {
    console.log(`\nNão foi possível conferir os produtos no banco: ${erro.message}`);
  } finally {
    await banco.end().catch(() => {});
  }
} else {
  console.log("\nSem DIRECT_URL no .env.local: produtos não conferidos.");
}

process.exit(achados.length || obrigatorios.length || semData || produtosIncompletos ? 1 : 0);
