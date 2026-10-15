// Cadastra as estampas de docs/catalogo-lancamento.md: as 12 do lançamento e
// as 8 da Coleção Carta Viva, com modelos, cores, tamanhos, preço por modelo,
// referência e descrição. Também completa a "Camiseta lisa" (modelos com preço
// de lisa) e esconde os produtos de exemplo que não estão no catálogo.
//
//   npm run catalogo:importar               mostra o que faria, sem gravar
//   npm run catalogo:importar -- --aplicar  grava
//
// Usa o DIRECT_URL do .env.local. Para outro banco (produção), defina o
// DIRECT_URL antes; ele vale no lugar do .env.local (ver docs/publicacao.md).
//
// Pode rodar quantas vezes quiser: só cria o que falta. Nunca sobrescreve o
// que foi mudado no painel (nome, descrição, referência, preços, "Mostrar na
// loja", fotos), nem cria estoque de peças prontas.

import { existsSync, readdirSync, readFileSync } from "node:fs";
import path from "node:path";

import { config } from "dotenv";
import { PrismaPg } from "@prisma/adapter-pg";

import { PrismaClient } from "../src/generated/prisma/client";
import { lerPrecoEmCentavos, paraSlug } from "../src/lib/formatacao";
import { gerarSku } from "../src/lib/produtos-regras";

config({ path: ".env.local", quiet: true });

const ARQUIVO = "docs/catalogo-lancamento.md";
const PASTA_DAS_FOTOS = "public/fotos/colecao-carta-viva";
const CATEGORIA_DAS_ESTAMPAS = "estampas-da-casa";
/** Categoria das 8 estampas da coleção (criada pela migration 20261017120000_categoria_colecao). */
const CATEGORIA_DA_COLECAO = "colecao-carta-viva";
const CAMISETA_LISA = "camiseta-lisa";
/** Descrição da camiseta lisa, gravada só se ela ainda não tiver uma. */
const DESCRICAO_DA_LISA =
  "Camiseta sem estampa, a mesma peça que usamos nas nossas estampas e nas personalizações. Escolha o modelo, a cor e o tamanho: as medidas de cada modelo estão logo abaixo.";
/**
 * Fotos de uma cor só, com o nome padrão (sem a cor no fim do nome). As que
 * terminam com a cor (ex.: carta-viva-oversized-costas-preta.jpg) já são
 * reconhecidas pelo nome.
 */
const CORES_DAS_FOTOS: Record<string, string> = {
  "amem-oversized-premium-frente.jpg": "Bege",
};
/** Texto alternativo gerado pelas versões anteriores, que pode ser trocado. */
const ALT_ANTIGO = "Ilustração da camiseta";
/** Produtos de exemplo do seed. Os que não estão no catálogo ficam escondidos. */
const EXEMPLOS_DO_SEED = ["nao-temas-creia", "nao-me-envergonho-do-evangelho", "jesus-my-best-friend", "o-justo-vive-pela-fe"];

// ---------------------------------------------------------------- Leitura do catálogo

type ModeloDoCatalogo = { nome: string; estampada: number; lisa: number | null; cores: string[] };
type Lado = { lado: "frente" | "costas"; texto: string };
type Estampa = {
  nome: string;
  slug: string;
  referencia: string | null;
  referenciaAConfirmar: boolean;
  descricao: string;
  /** Nome do modelo → cores do catálogo. */
  modelos: Map<string, string[]>;
  /** Só a coleção tem fotos. */
  colecao: boolean;
  lados: Lado[];
};

class ErroNoCatalogo extends Error {}

/** Linhas da primeira tabela depois do título, já sem cabeçalho, como células. */
function tabelaDepoisDe(linhas: string[], titulo: string) {
  const inicio = linhas.findIndex((l) => l.startsWith(titulo));
  if (inicio < 0) throw new ErroNoCatalogo(`Não achei a seção "${titulo}".`);
  const tabela: string[][] = [];
  for (const linha of linhas.slice(inicio + 1)) {
    if (linha.startsWith("## ")) break;
    if (!linha.startsWith("|")) {
      if (tabela.length > 0) break;
      continue;
    }
    tabela.push(linha.slice(1, linha.lastIndexOf("|")).split("|").map((c) => c.trim()));
  }
  if (tabela.length < 3) throw new ErroNoCatalogo(`A tabela de "${titulo}" está vazia.`);
  return tabela.slice(2); // cabeçalho e separador
}

const semParenteses = (texto: string) => texto.replace(/\s*\(.*?\)\s*/g, " ").trim();
const lista = (texto: string) => texto.split(",").map((c) => c.trim()).filter(Boolean);

function preco(texto: string, onde: string) {
  if (texto === "—" || texto === "-") return null;
  const centavos = lerPrecoEmCentavos(texto.replace("R$", "").trim());
  if (centavos === null || centavos <= 0) throw new ErroNoCatalogo(`Preço inválido em ${onde}: "${texto}".`);
  return centavos;
}

function referencia(texto: string) {
  const limpa = texto.replace(/\(a confirmar\)/i, "").trim();
  return { referencia: limpa === "—" || limpa === "" ? null : limpa, referenciaAConfirmar: /a confirmar/i.test(texto) };
}

export function lerCatalogo(texto: string) {
  const linhas = texto.split(/\r?\n/);

  const modelos: ModeloDoCatalogo[] = tabelaDepoisDe(linhas, "## Modelos, preços e cores").map(([nome, estampada, lisa, cores]) => ({
    nome: semParenteses(nome),
    estampada: preco(estampada, `"${nome}"`)!,
    lisa: preco(lisa, `"${nome}"`),
    cores: lista(cores),
  }));

  // "Modelos: T = Tradicional, BL = Baby Look, ..."
  const legenda = linhas.find((l) => l.startsWith("Modelos: T ="));
  if (!legenda) throw new ErroNoCatalogo('Não achei a legenda "Modelos: T = Tradicional, ...".');
  const siglas = new Map([...legenda.matchAll(/(\w+) = ([^,.]+)/g)].map((m) => [m[1], m[2].trim()]));

  const lancamento: Estampa[] = tabelaDepoisDe(linhas, "## As 12 estampas do lançamento").map(
    ([nome, ref, siglasDosModelos, cores, descricao]) => {
      const porModelo = new Map<string, string[]>();
      for (const sigla of lista(siglasDosModelos)) {
        const modelo = siglas.get(sigla);
        if (!modelo) throw new ErroNoCatalogo(`Modelo "${sigla}" desconhecido em "${nome}".`);
        porModelo.set(modelo, lista(cores));
      }
      return { nome, slug: paraSlug(nome), ...referencia(ref), descricao, modelos: porModelo, colecao: false, lados: [] };
    },
  );

  const colecao: Estampa[] = tabelaDepoisDe(linhas, "## Coleção Carta Viva").map(([estampa, ref, frente, costas, descricao]) => {
    const encontrado = estampa.match(/^(.*?)\s*\(`([a-z0-9-]+)`\)$/);
    if (!encontrado) throw new ErroNoCatalogo(`Não entendi o nome e o endereço de "${estampa}".`);
    const lados: Lado[] = [{ lado: "frente", texto: frente }];
    if (costas !== "—") lados.push({ lado: "costas", texto: costas });
    return {
      nome: encontrado[1],
      slug: encontrado[2],
      ...referencia(ref),
      descricao,
      // Todos os modelos, em todas as cores de cada um.
      modelos: new Map(modelos.map((m) => [m.nome, m.cores])),
      colecao: true,
      lados,
    };
  });

  const estampas = [...lancamento, ...colecao];
  const repetidas = estampas.filter((e, i) => estampas.findIndex((o) => o.slug === e.slug) !== i);
  if (repetidas.length > 0) throw new ErroNoCatalogo(`Endereço repetido: ${repetidas.map((e) => e.slug).join(", ")}.`);
  return { modelos, estampas };
}

// ---------------------------------------------------------------- Importação

const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DIRECT_URL }) });

type Tx = Parameters<Parameters<typeof prisma.$transaction>[0]>[0];

/** Endereço do banco sem usuário e senha, para conferir onde vai gravar. */
function bancoAlvo() {
  try {
    const url = new URL(process.env.DIRECT_URL ?? "");
    return `${url.hostname}:${url.port || 5432}${url.pathname}`;
  } catch {
    return null;
  }
}

async function importar(tx: Tx, catalogo: ReturnType<typeof lerCatalogo>, relatorio: string[]) {
  const modelosDoBanco = await tx.modelo.findMany({
    orderBy: { ordem: "asc" },
    select: {
      id: true,
      nome: true,
      slug: true,
      ordem: true,
      cores: { select: { cor: { select: { id: true, nome: true } } } },
      medidas: { orderBy: { tamanho: { ordem: "asc" } }, select: { tamanho: { select: { id: true, nome: true } } } },
    },
  });
  const arquivosDasFotos = readdirSync(PASTA_DAS_FOTOS);
  const modeloPorNome = new Map(modelosDoBanco.map((m) => [m.nome, m]));
  const precoDoCatalogo = new Map(catalogo.modelos.map((m) => [m.nome, m]));
  for (const m of catalogo.modelos) {
    if (!modeloPorNome.has(m.nome)) throw new ErroNoCatalogo(`O modelo "${m.nome}" não existe no banco.`);
  }
  const skus = new Set((await tx.variacao.findMany({ select: { sku: true } })).map((v) => v.sku));
  const categorias = new Map(
    (await tx.categoria.findMany({ where: { slug: { in: [CATEGORIA_DAS_ESTAMPAS, CATEGORIA_DA_COLECAO] } } })).map((c) => [c.slug, c.id]),
  );
  for (const slug of [CATEGORIA_DAS_ESTAMPAS, CATEGORIA_DA_COLECAO]) {
    if (!categorias.has(slug)) throw new ErroNoCatalogo(`A categoria "${slug}" não existe no banco. Rode as migrations antes.`);
  }
  const categoriaDa = (e: { colecao: boolean }) => categorias.get(e.colecao ? CATEGORIA_DA_COLECAO : CATEGORIA_DAS_ESTAMPAS)!;

  /**
   * Garante modelos, cores, tamanhos e preços do produto. Cada modelo usa só
   * as cores do catálogo que ele tem (ex.: Bege só existe no Oversized Premium).
   */
  async function completarGrade(produto: { id: string; slug: string }, pedidos: Map<string, string[]>, lisa: boolean) {
    const existentes = await tx.variacao.findMany({
      where: { produtoId: produto.id },
      select: { modeloId: true, corId: true, tamanhoId: true },
    });
    const temVariacao = new Set(existentes.map((v) => `${v.modeloId}:${v.corId}:${v.tamanhoId}`));
    const precosExistentes = new Map(
      (await tx.precoDoModelo.findMany({ where: { produtoId: produto.id } })).map((p) => [p.modeloId, p.precoEmCentavos]),
    );

    const novas: { modeloId: string; corId: string; tamanhoId: string; sku: string }[] = [];
    const novosPrecos: { produtoId: string; modeloId: string; precoEmCentavos: number }[] = [];
    const resumo: string[] = [];
    for (const modelo of modelosDoBanco.filter((m) => pedidos.has(m.nome))) {
      const coresDoModelo = new Map(modelo.cores.map(({ cor }) => [cor.nome, cor]));
      const cores = pedidos.get(modelo.nome)!.filter((c) => coresDoModelo.has(c)).map((c) => coresDoModelo.get(c)!);
      const foraDoModelo = pedidos.get(modelo.nome)!.filter((c) => !coresDoModelo.has(c));
      if (cores.length === 0) {
        relatorio.push(`  ! ${modelo.nome}: nenhuma das cores (${pedidos.get(modelo.nome)!.join(", ")}) existe neste modelo. Ficou de fora.`);
        continue;
      }
      let criadas = 0;
      for (const cor of cores) {
        for (const { tamanho } of modelo.medidas) {
          if (temVariacao.has(`${modelo.id}:${cor.id}:${tamanho.id}`)) continue;
          const base = gerarSku(produto.slug, modelo.nome, cor.nome, tamanho.nome);
          let sku = base;
          for (let n = 2; skus.has(sku); n++) sku = `${base}-${n}`;
          skus.add(sku);
          novas.push({ modeloId: modelo.id, corId: cor.id, tamanhoId: tamanho.id, sku });
          criadas++;
        }
      }
      const catalogoDoModelo = precoDoCatalogo.get(modelo.nome)!;
      const precoCerto = lisa ? catalogoDoModelo.lisa : catalogoDoModelo.estampada;
      const salvo = precosExistentes.get(modelo.id);
      let textoDoPreco = "";
      if (precoCerto !== null && salvo === undefined) {
        novosPrecos.push({ produtoId: produto.id, modeloId: modelo.id, precoEmCentavos: precoCerto });
        textoDoPreco = `, preço R$ ${(precoCerto / 100).toFixed(2).replace(".", ",")}`;
      } else if (precoCerto !== null && salvo !== precoCerto) {
        textoDoPreco = `, preço já cadastrado R$ ${(salvo! / 100).toFixed(2).replace(".", ",")} (catálogo: R$ ${(precoCerto / 100).toFixed(2).replace(".", ",")}; não mudei)`;
      }
      resumo.push(
        `  ${modelo.nome}: ${cores.map((c) => c.nome).join(", ")} · ${criadas === 0 ? "nada novo" : `${criadas} combinações novas`}${textoDoPreco}` +
          (foraDoModelo.length > 0
            ? ` (sem ${foraDoModelo.join(", ")}, que não ${foraDoModelo.length === 1 ? "existe" : "existem"} neste modelo)`
            : ""),
      );
    }

    // Toda variação aponta para a peça lisa do mesmo modelo, cor e tamanho.
    await tx.pecaLisa.createMany({
      data: novas.map(({ modeloId, corId, tamanhoId }) => ({ modeloId, corId, tamanhoId })),
      skipDuplicates: true,
    });
    await tx.variacao.createMany({ data: novas.map((v) => ({ ...v, produtoId: produto.id, estoque: 0 })) });
    await tx.precoDoModelo.createMany({ data: novosPrecos, skipDuplicates: true });
    return resumo;
  }

  for (const estampa of catalogo.estampas) {
    for (const nome of estampa.modelos.keys()) {
      if (!modeloPorNome.has(nome)) throw new ErroNoCatalogo(`Modelo "${nome}" de "${estampa.nome}" não existe no banco.`);
    }
    const precos = [...estampa.modelos.keys()].map((n) => precoDoCatalogo.get(n)!.estampada);

    let produto = await tx.produto.findUnique({
      where: { slug: estampa.slug },
      select: { id: true, slug: true, descricao: true, referencia: true, ativo: true, categoriaId: true },
    });
    if (!produto) {
      produto = await tx.produto.create({
        data: {
          nome: estampa.nome,
          slug: estampa.slug,
          descricao: estampa.descricao,
          referencia: estampa.referencia,
          precoBaseEmCentavos: Math.min(...precos),
          categoriaId: categoriaDa(estampa),
          // Sem foto, a estampa do lançamento espera a foto para aparecer.
          ativo: estampa.colecao,
        },
        select: { id: true, slug: true, descricao: true, referencia: true, ativo: true, categoriaId: true },
      });
      relatorio.push(`+ ${estampa.nome} (/produtos/${estampa.slug}): novo, ${estampa.colecao ? "visível" : "escondido até ter foto"}`);
    } else {
      // Já existe: preenche só o que está vazio.
      // A coleção sai de "Estampas da Casa" para a categoria dela (decisão de
      // 16/10/2026); outra categoria escolhida no painel fica como está.
      const paraColecao = estampa.colecao && produto.categoriaId === categorias.get(CATEGORIA_DAS_ESTAMPAS);
      const vazio = {
        ...(!produto.descricao && { descricao: estampa.descricao }),
        ...(!produto.referencia && estampa.referencia && { referencia: estampa.referencia }),
        ...(paraColecao && { categoriaId: categorias.get(CATEGORIA_DA_COLECAO) }),
      };
      const preenchidos = [
        vazio.descricao && "descrição",
        vazio.referencia && "referência",
      ].filter(Boolean);
      if (Object.keys(vazio).length > 0) await tx.produto.update({ where: { id: produto.id }, data: vazio });
      relatorio.push(
        `= ${estampa.nome} (/produtos/${estampa.slug}): já existe, ${produto.ativo ? "visível" : "escondido"}` +
          (preenchidos.length > 0 ? `; preenchi ${preenchidos.join(" e ")}` : "") +
          (paraColecao ? "; movi para a categoria Coleção Carta Viva" : ""),
      );
    }
    if (estampa.referenciaAConfirmar) relatorio.push(`  ! Referência a confirmar: ${estampa.referencia}`);
    relatorio.push(...(await completarGrade(produto, estampa.modelos, false)));

    if (estampa.colecao) {
      const fotos = await tx.produtoImagem.findMany({
        where: { produtoId: produto.id },
        select: { id: true, url: true, ordem: true, alt: true, corId: true },
      });
      const porUrl = new Map(fotos.map((f) => [f.url, f]));
      let ordem = Math.max(-1, ...fotos.map((f) => f.ordem)) + 1;
      const novas = [];
      let atualizadas = 0;
      for (const modelo of modelosDoBanco.filter((m) => estampa.modelos.has(m.nome))) {
        const corPeloSlug = new Map(modelo.cores.map(({ cor }) => [paraSlug(cor.nome), cor]));
        const corPeloNome = new Map(modelo.cores.map(({ cor }) => [cor.nome, cor]));
        for (const { lado, texto } of estampa.lados) {
          const base = `${estampa.slug}-${modelo.slug}-${lado}`;
          if (!existsSync(path.join(PASTA_DAS_FOTOS, `${base}.jpg`))) {
            throw new ErroNoCatalogo(`Falta a imagem ${PASTA_DAS_FOTOS}/${base}.jpg.`);
          }
          // A foto padrão e as de uma cor só (<base>-<cor>.jpg).
          const arquivos: { arquivo: string; cor: { id: string; nome: string } | null }[] = [];
          for (const arquivo of arquivosDasFotos) {
            if (arquivo === `${base}.jpg`) {
              const nomeDaCor = CORES_DAS_FOTOS[arquivo];
              const cor = nomeDaCor ? corPeloNome.get(nomeDaCor) : null;
              if (nomeDaCor && !cor) throw new ErroNoCatalogo(`A cor ${nomeDaCor} da foto ${arquivo} não existe no modelo ${modelo.nome}.`);
              arquivos.push({ arquivo, cor: cor ?? null });
            } else if (arquivo.startsWith(`${base}-`) && arquivo.endsWith(".jpg")) {
              const sufixo = arquivo.slice(base.length + 1, -".jpg".length);
              const cor = corPeloSlug.get(sufixo);
              if (!cor) throw new ErroNoCatalogo(`A foto ${arquivo} termina com "${sufixo}", que não é uma cor do modelo ${modelo.nome}.`);
              arquivos.push({ arquivo, cor });
            }
          }
          for (const { arquivo, cor } of arquivos) {
            const url = `/fotos/colecao-carta-viva/${arquivo}`;
            const alt = `Camiseta “${estampa.nome}”, modelo ${modelo.nome}${cor ? `, cor ${cor.nome}` : ""}, ${lado}: ${texto}`.slice(0, 200);
            const existente = porUrl.get(url);
            if (!existente) {
              novas.push({ produtoId: produto.id, modeloId: modelo.id, corId: cor?.id ?? null, url, alt, ordem: ordem++ });
              continue;
            }
            // Só preenche a cor vazia e troca o texto gerado antes; o resto é do painel.
            const mudancas = {
              ...(cor && !existente.corId && { corId: cor.id }),
              ...(existente.alt.startsWith(ALT_ANTIGO) && { alt }),
            };
            if (Object.keys(mudancas).length > 0) {
              await tx.produtoImagem.update({ where: { id: existente.id }, data: mudancas });
              atualizadas++;
            }
          }
        }
      }
      await tx.produtoImagem.createMany({ data: novas });
      relatorio.push(
        `  Fotos: ${novas.length === 0 ? "nada novo" : `${novas.length} novas`}${atualizadas > 0 ? `, ${atualizadas} com cor ou texto atualizado` : ""}` +
          (novas.some((n) => n.corId) ? ` (${novas.filter((n) => n.corId).length} de uma cor só)` : ""),
      );
    }
  }

  // Camiseta lisa: os modelos com preço de lisa, em todas as cores do catálogo.
  const lisa = await tx.produto.findUnique({
    where: { slug: CAMISETA_LISA },
    select: { id: true, slug: true, ativo: true, descricao: true },
  });
  if (!lisa) {
    relatorio.push(`! Não achei a "${CAMISETA_LISA}". Cadastre a camiseta lisa pelo painel.`);
  } else {
    relatorio.push(`= Camiseta lisa (/produtos/${CAMISETA_LISA}): ${lisa.ativo ? "visível" : "escondida"}`);
    if (!lisa.descricao) {
      await tx.produto.update({ where: { id: lisa.id }, data: { descricao: DESCRICAO_DA_LISA } });
      relatorio.push("+ Camiseta lisa: descrição");
    }
    const modelosDaLisa = new Map(catalogo.modelos.filter((m) => m.lisa !== null).map((m) => [m.nome, m.cores]));
    relatorio.push(...(await completarGrade(lisa, modelosDaLisa, true)));
  }

  // Exemplos do seed fora do catálogo.
  const noCatalogo = new Set(catalogo.estampas.map((e) => e.slug));
  for (const slug of EXEMPLOS_DO_SEED.filter((s) => !noCatalogo.has(s))) {
    const { count } = await tx.produto.updateMany({ where: { slug, ativo: true }, data: { ativo: false } });
    if (count > 0) relatorio.push(`- /produtos/${slug}: exemplo do seed, escondido da loja`);
  }
}

const NAO_GRAVAR = new Error("simulação");

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

  const catalogo = lerCatalogo(readFileSync(ARQUIVO, "utf8"));
  const relatorio: string[] = [];
  try {
    // Tudo numa transação: se algo falhar, nada fica pela metade. Na
    // simulação, a transação é desfeita no fim.
    await prisma.$transaction(
      async (tx) => {
        await importar(tx, catalogo, relatorio);
        if (!aplicar) throw NAO_GRAVAR;
      },
      { timeout: 120_000, maxWait: 20_000 },
    );
  } catch (erro) {
    if (erro !== NAO_GRAVAR) {
      console.log(relatorio.join("\n"));
      console.error(`\nNada foi gravado. ${erro instanceof ErroNoCatalogo ? erro.message : erro}`);
      process.exitCode = 1;
      return;
    }
  }
  console.log(relatorio.join("\n"));
  console.log(
    aplicar
      ? "\nPronto. As páginas da loja se atualizam sozinhas em alguns minutos."
      : "\nSimulação concluída. Para gravar: npm run catalogo:importar -- --aplicar",
  );
}

main()
  .catch((erro) => {
    console.error(erro);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
