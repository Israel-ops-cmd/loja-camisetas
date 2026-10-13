"use server";

import { refresh } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { paraSlug } from "@/lib/formatacao";
import { administradorDaAcao, atualizarPaginasDoCatalogo, SEM_PERMISSAO } from "@/lib/painel";
import { prisma } from "@/lib/prisma";
import { LIMITES_DO_PACOTE, lerMedidaEmMm } from "@/lib/produtos-regras";

// Ações do painel de modelos (Tradicional, Baby Look...). Cada uma confere se
// quem chama é administrador.

export type Resultado = { ok: true; mensagem?: string } | { ok: false; erro: string; campos?: Record<string, string> };

const inteiroEntre = (minimo: number, maximo: number, nome: string) =>
  z
    .number(`Digite ${nome} em números.`)
    .int(`Digite ${nome} sem vírgula.`)
    .min(minimo, `${nome[0].toUpperCase()}${nome.slice(1)} precisa ser pelo menos ${minimo}.`)
    .max(maximo, `${nome[0].toUpperCase()}${nome.slice(1)} pode ser no máximo ${maximo}.`);

const esquemaModelo = z.object({
  nome: z.string().trim().min(2, "Digite o nome do modelo.").max(60, "Nome longo demais (até 60 letras)."),
  ativo: z.boolean(),
  pesoEmGramas: inteiroEntre(LIMITES_DO_PACOTE.pesoEmGramas.minimo, LIMITES_DO_PACOTE.pesoEmGramas.maximo, "o peso"),
  larguraCm: inteiroEntre(LIMITES_DO_PACOTE.centimetros.minimo, LIMITES_DO_PACOTE.centimetros.maximo, "a largura"),
  alturaCm: inteiroEntre(LIMITES_DO_PACOTE.centimetros.minimo, LIMITES_DO_PACOTE.centimetros.maximo, "a altura"),
  comprimentoCm: inteiroEntre(LIMITES_DO_PACOTE.centimetros.minimo, LIMITES_DO_PACOTE.centimetros.maximo, "o comprimento"),
});

export type DadosDoModelo = z.input<typeof esquemaModelo>;

const idValido = (id: unknown): id is string => typeof id === "string" && z.uuid().safeParse(id).success;

/** Slugs dos produtos que vendem o modelo, para atualizar as páginas da loja. */
async function slugsDosProdutos(modeloId: string) {
  const produtos = await prisma.produto.findMany({
    where: { variacoes: { some: { modeloId } } },
    select: { slug: true },
  });
  return produtos.map((p) => p.slug);
}

/** Cria (id nulo) ou atualiza o modelo. Ao criar, leva para a página de edição. */
export async function salvarModelo(id: unknown, dados: unknown): Promise<Resultado> {
  if (!(await administradorDaAcao())) return { ok: false, erro: SEM_PERMISSAO };
  if (id !== null && !idValido(id)) return { ok: false, erro: "Modelo não encontrado. Volte para a lista e abra de novo." };

  const validacao = esquemaModelo.safeParse(dados);
  if (!validacao.success) {
    const campos: Record<string, string> = {};
    for (const problema of validacao.error.issues) campos[String(problema.path[0])] ??= problema.message;
    return { ok: false, erro: "Confira os campos marcados abaixo.", campos };
  }
  const d = validacao.data;

  const outro = await prisma.modelo.findFirst({
    where: { nome: { equals: d.nome, mode: "insensitive" }, ...(id ? { id: { not: id } } : {}) },
    select: { id: true },
  });
  if (outro) return { ok: false, erro: "Já existe um modelo com esse nome.", campos: { nome: "Use outro nome." } };

  if (id === null) {
    const slug = paraSlug(d.nome);
    if (!slug || (await prisma.modelo.findUnique({ where: { slug } }))) {
      return { ok: false, erro: "Já existe um modelo com esse nome.", campos: { nome: "Use outro nome." } };
    }
    const ultimo = await prisma.modelo.aggregate({ _max: { ordem: true } });
    const criado = await prisma.modelo.create({
      data: { ...d, slug, ordem: (ultimo._max.ordem ?? 0) + 1 },
      select: { id: true },
    });
    redirect(`/admin/modelos/${criado.id}?novo=1`);
  }

  if (!(await prisma.modelo.findUnique({ where: { id }, select: { id: true } }))) {
    return { ok: false, erro: "Modelo não encontrado. Volte para a lista e abra de novo." };
  }
  await prisma.modelo.update({ where: { id }, data: d });
  atualizarPaginasDoCatalogo(...(await slugsDosProdutos(id)));
  refresh();
  return { ok: true, mensagem: "Dados do modelo salvos." };
}

const esquemaGrade = z.object({
  cores: z.array(z.uuid()).max(100),
  medidas: z
    .array(
      z.object({
        tamanhoId: z.uuid(),
        comprimento: z.string().max(10),
        largura: z.string().max(10),
        manga: z.string().max(10),
      }),
    )
    .max(50),
});

/**
 * Grava as cores e os tamanhos do modelo, com a tabela de medidas. Uma cor ou
 * um tamanho à venda em algum produto não pode sair do modelo.
 */
export async function salvarCoresETamanhos(modeloId: unknown, dados: unknown): Promise<Resultado> {
  if (!(await administradorDaAcao())) return { ok: false, erro: SEM_PERMISSAO };
  if (!idValido(modeloId)) return { ok: false, erro: "Modelo não encontrado." };
  const validacao = esquemaGrade.safeParse(dados);
  if (!validacao.success) return { ok: false, erro: "Não conseguimos ler as cores e os tamanhos. Recarregue a página." };
  const { cores, medidas } = validacao.data;

  const modelo = await prisma.modelo.findUnique({ where: { id: modeloId }, select: { id: true } });
  if (!modelo) return { ok: false, erro: "Modelo não encontrado." };

  const [coresQueExistem, tamanhosQueExistem] = await Promise.all([
    prisma.cor.findMany({ where: { id: { in: cores } }, select: { id: true } }),
    prisma.tamanho.findMany({ where: { id: { in: medidas.map((m) => m.tamanhoId) } }, select: { id: true, nome: true } }),
  ]);
  if (coresQueExistem.length !== new Set(cores).size || tamanhosQueExistem.length !== new Set(medidas.map((m) => m.tamanhoId)).size) {
    return { ok: false, erro: "Alguma cor ou tamanho não existe mais. Recarregue a página." };
  }
  const nomeDoTamanho = new Map(tamanhosQueExistem.map((t) => [t.id, t.nome]));

  // Confere todas as medidas antes de gravar.
  const linhas: { tamanhoId: string; comprimentoMm: number; larguraMm: number; mangaMm: number }[] = [];
  for (const m of medidas) {
    const comprimentoMm = lerMedidaEmMm(m.comprimento);
    const larguraMm = lerMedidaEmMm(m.largura);
    const mangaMm = lerMedidaEmMm(m.manga);
    if (comprimentoMm === null || larguraMm === null || mangaMm === null) {
      return {
        ok: false,
        erro: `Confira as medidas do tamanho ${nomeDoTamanho.get(m.tamanhoId)}: use centímetros, como 68 ou 11,5.`,
      };
    }
    linhas.push({ tamanhoId: m.tamanhoId, comprimentoMm, larguraMm, mangaMm });
  }

  // O que está à venda continua no modelo.
  const aVenda = await prisma.variacao.findMany({
    where: {
      modeloId,
      ativo: true,
      OR: [{ corId: { notIn: cores } }, { tamanhoId: { notIn: linhas.map((l) => l.tamanhoId) } }],
    },
    select: { cor: { select: { id: true, nome: true } }, tamanho: { select: { id: true, nome: true } }, produto: { select: { nome: true } } },
    take: 1,
  });
  if (aVenda.length > 0) {
    const v = aVenda[0];
    const oQue = cores.includes(v.cor.id) ? `o tamanho ${v.tamanho.nome}` : `a cor ${v.cor.nome}`;
    return {
      ok: false,
      erro: `Não dá para tirar ${oQue}: há peças à venda em “${v.produto.nome}”. Tire de venda nos produtos primeiro.`,
    };
  }

  await prisma.$transaction([
    prisma.modeloCor.deleteMany({ where: { modeloId, corId: { notIn: cores } } }),
    prisma.modeloCor.createMany({ data: cores.map((corId) => ({ modeloId, corId })), skipDuplicates: true }),
    prisma.medidaDoModelo.deleteMany({ where: { modeloId, tamanhoId: { notIn: linhas.map((l) => l.tamanhoId) } } }),
    ...linhas.map((l) =>
      prisma.medidaDoModelo.upsert({
        where: { modeloId_tamanhoId: { modeloId, tamanhoId: l.tamanhoId } },
        update: l,
        create: { modeloId, ...l },
      }),
    ),
  ]);

  atualizarPaginasDoCatalogo(...(await slugsDosProdutos(modeloId)));
  refresh();
  return { ok: true, mensagem: "Cores, tamanhos e medidas salvos." };
}
