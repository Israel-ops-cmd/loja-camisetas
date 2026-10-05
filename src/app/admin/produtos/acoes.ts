"use server";

import { randomUUID } from "node:crypto";

import { refresh } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { Prisma } from "@/generated/prisma/client";
import { lerPrecoEmCentavos, paraSlug } from "@/lib/formatacao";
import { administradorDaAcao, atualizarPaginasDoCatalogo, SEM_PERMISSAO } from "@/lib/painel";
import { prisma } from "@/lib/prisma";
import {
  ENQUADRAMENTOS,
  FORMATOS_DE_FOTO,
  gerarSku,
  LIMITES_DO_PACOTE,
  PASTA_DE_FOTOS,
  TAMANHO_MAXIMO_DA_FOTO,
} from "@/lib/produtos-regras";
import { extensaoDoArquivo } from "@/lib/personalizacao-regras";
import { criarClienteSupabase } from "@/lib/supabase/servidor";

// Ações do painel de produtos. Cada uma confere se quem chama é
// administrador. As mensagens são para quem não é da área de tecnologia:
// dizem o que aconteceu e o que fazer.

export type Resultado = { ok: true; mensagem?: string } | { ok: false; erro: string; campos?: Record<string, string> };

function errosPorCampo(erro: z.ZodError) {
  const campos: Record<string, string> = {};
  for (const problema of erro.issues) campos[String(problema.path[0])] ??= problema.message;
  return campos;
}

// ---------------------------------------------------------------- Dados do produto

const inteiroEntre = (minimo: number, maximo: number, nome: string) =>
  z
    .number(`Digite ${nome} em números.`)
    .int(`Digite ${nome} sem vírgula.`)
    .min(minimo, `${nome[0].toUpperCase()}${nome.slice(1)} precisa ser pelo menos ${minimo}.`)
    .max(maximo, `${nome[0].toUpperCase()}${nome.slice(1)} pode ser no máximo ${maximo}.`);

const esquemaProduto = z.object({
  nome: z.string().trim().min(2, "Digite o nome do produto.").max(120, "Nome longo demais (até 120 letras)."),
  slug: z.string().trim().max(120, "Endereço longo demais.").optional(),
  categoriaId: z.uuid("Escolha a categoria."),
  descricao: z.string().trim().max(5000, "Descrição longa demais (até 5.000 letras).").optional(),
  preco: z.string().max(20),
  ativo: z.boolean(),
  destaque: z.boolean(),
  pesoEmGramas: inteiroEntre(LIMITES_DO_PACOTE.pesoEmGramas.minimo, LIMITES_DO_PACOTE.pesoEmGramas.maximo, "o peso"),
  larguraCm: inteiroEntre(LIMITES_DO_PACOTE.centimetros.minimo, LIMITES_DO_PACOTE.centimetros.maximo, "a largura"),
  alturaCm: inteiroEntre(LIMITES_DO_PACOTE.centimetros.minimo, LIMITES_DO_PACOTE.centimetros.maximo, "a altura"),
  comprimentoCm: inteiroEntre(LIMITES_DO_PACOTE.centimetros.minimo, LIMITES_DO_PACOTE.centimetros.maximo, "o comprimento"),
});

export type DadosDoProduto = z.input<typeof esquemaProduto>;

/** Cria (id nulo) ou atualiza o produto. Ao criar, leva para a página de edição. */
export async function salvarProduto(id: unknown, dados: unknown): Promise<Resultado> {
  if (!(await administradorDaAcao())) return { ok: false, erro: SEM_PERMISSAO };
  if (id !== null && (typeof id !== "string" || !z.uuid().safeParse(id).success)) {
    return { ok: false, erro: "Produto não encontrado. Volte para a lista e abra de novo." };
  }

  const validacao = esquemaProduto.safeParse(dados);
  const textoDoPreco = (dados as { preco?: unknown } | null)?.preco;
  const preco = typeof textoDoPreco === "string" ? lerPrecoEmCentavos(textoDoPreco) : null;
  // Mostra todos os problemas de uma vez, inclusive o do preço.
  const errosDosCampos: Record<string, string> = validacao.success ? {} : errosPorCampo(validacao.error);
  if (preco === null || preco <= 0) errosDosCampos.preco = "Digite o preço de uma peça, por exemplo 49,90.";
  if (!validacao.success || preco === null || preco <= 0) {
    return { ok: false, erro: "Confira os campos marcados abaixo.", campos: errosDosCampos };
  }
  const d = validacao.data;

  const slug = paraSlug(d.slug || d.nome);
  if (!slug) {
    return { ok: false, erro: "Confira o endereço da página.", campos: { slug: "Use letras e números no endereço." } };
  }
  const outro = await prisma.produto.findFirst({
    where: { slug, ...(id ? { id: { not: id } } : {}) },
    select: { nome: true },
  });
  if (outro) {
    return {
      ok: false,
      erro: "Esse endereço de página já está em uso.",
      campos: { slug: `O produto "${outro.nome}" já usa esse endereço. Troque ou acrescente uma palavra.` },
    };
  }

  const categoria = await prisma.categoria.findUnique({ where: { id: d.categoriaId }, select: { id: true } });
  if (!categoria) return { ok: false, erro: "Escolha a categoria.", campos: { categoriaId: "Escolha uma categoria da lista." } };

  const registro = {
    nome: d.nome,
    slug,
    categoriaId: d.categoriaId,
    descricao: d.descricao || null,
    precoBaseEmCentavos: preco,
    ativo: d.ativo,
    destaque: d.destaque,
    pesoEmGramas: d.pesoEmGramas,
    larguraCm: d.larguraCm,
    alturaCm: d.alturaCm,
    comprimentoCm: d.comprimentoCm,
  };

  if (id === null) {
    const criado = await prisma.produto.create({ data: registro, select: { id: true } });
    atualizarPaginasDoCatalogo(slug);
    redirect(`/admin/produtos/${criado.id}?novo=1`);
  }

  const antes = await prisma.produto.findUnique({ where: { id }, select: { slug: true } });
  if (!antes) return { ok: false, erro: "Produto não encontrado. Volte para a lista e abra de novo." };
  await prisma.produto.update({ where: { id }, data: registro });
  atualizarPaginasDoCatalogo(antes.slug, slug);
  refresh();
  return { ok: true, mensagem: "Dados do produto salvos." };
}

// ---------------------------------------------------------------- Cores e tamanhos

const esquemaGrade = z.object({
  combinacoes: z
    .array(
      z.object({
        corId: z.uuid(),
        tamanhoId: z.uuid(),
        aVenda: z.boolean(),
        /** Vazio = usa o preço do produto. */
        precoProprio: z.string().max(20).optional(),
      }),
    )
    .max(500),
});

/**
 * Marca quais combinações de cor e tamanho estão à venda. Combinação nova é
 * criada com estoque 0; desmarcar só tira de venda (nunca apaga).
 */
export async function salvarVariacoes(produtoId: unknown, dados: unknown): Promise<Resultado> {
  if (!(await administradorDaAcao())) return { ok: false, erro: SEM_PERMISSAO };
  if (typeof produtoId !== "string" || !z.uuid().safeParse(produtoId).success) {
    return { ok: false, erro: "Produto não encontrado." };
  }
  const validacao = esquemaGrade.safeParse(dados);
  if (!validacao.success) return { ok: false, erro: "Não conseguimos ler as cores e tamanhos. Recarregue a página." };

  const produto = await prisma.produto.findUnique({ where: { id: produtoId }, select: { slug: true } });
  if (!produto) return { ok: false, erro: "Produto não encontrado." };

  const combinacoes = validacao.data.combinacoes;
  const [cores, tamanhos] = await Promise.all([
    prisma.cor.findMany({ where: { id: { in: combinacoes.map((c) => c.corId) } } }),
    prisma.tamanho.findMany({ where: { id: { in: combinacoes.map((c) => c.tamanhoId) } } }),
  ]);
  const corPorId = new Map(cores.map((c) => [c.id, c]));
  const tamanhoPorId = new Map(tamanhos.map((t) => [t.id, t]));

  // Confere todos os preços antes de gravar qualquer coisa.
  const precos = new Map<string, number | null>();
  for (const c of combinacoes) {
    const cor = corPorId.get(c.corId);
    const tamanho = tamanhoPorId.get(c.tamanhoId);
    if (!cor || !tamanho) return { ok: false, erro: "Alguma cor ou tamanho não existe mais. Recarregue a página." };
    const texto = c.precoProprio?.trim() ?? "";
    if (!texto) {
      precos.set(`${c.corId}:${c.tamanhoId}`, null);
      continue;
    }
    const centavos = lerPrecoEmCentavos(texto);
    if (centavos === null || centavos <= 0) {
      return { ok: false, erro: `Confira o preço de ${cor.nome}, tamanho ${tamanho.nome}. Use, por exemplo, 49,90, ou deixe em branco.` };
    }
    precos.set(`${c.corId}:${c.tamanhoId}`, centavos);
  }

  await prisma.$transaction(async (tx) => {
    for (const c of combinacoes) {
      const chave = { produtoId, corId: c.corId, tamanhoId: c.tamanhoId };
      const precoEmCentavos = precos.get(`${c.corId}:${c.tamanhoId}`) ?? null;
      const existente = await tx.variacao.findUnique({ where: { produtoId_corId_tamanhoId: chave } });
      if (existente) {
        await tx.variacao.update({ where: { id: existente.id }, data: { ativo: c.aVenda, precoEmCentavos } });
      } else if (c.aVenda) {
        // O código pode já existir se outro produto usou este endereço antes.
        const base = gerarSku(produto.slug, corPorId.get(c.corId)!.nome, tamanhoPorId.get(c.tamanhoId)!.nome);
        let sku = base;
        for (let n = 2; await tx.variacao.findUnique({ where: { sku }, select: { id: true } }); n++) sku = `${base}-${n}`;
        await tx.variacao.create({ data: { ...chave, sku, estoque: 0, precoEmCentavos } });
      }
    }
  });

  atualizarPaginasDoCatalogo(produto.slug);
  refresh();
  return { ok: true, mensagem: "Cores e tamanhos salvos." };
}

export async function criarCor(dados: unknown): Promise<Resultado> {
  if (!(await administradorDaAcao())) return { ok: false, erro: SEM_PERMISSAO };
  const validacao = z
    .object({
      nome: z.string().trim().min(2, "Digite o nome da cor.").max(40, "Nome longo demais."),
      hex: z.string().regex(/^#[0-9a-fA-F]{6}$/, "Escolha a cor no quadradinho."),
    })
    .safeParse(dados);
  if (!validacao.success) return { ok: false, erro: validacao.error.issues[0].message };

  const nome = validacao.data.nome[0].toUpperCase() + validacao.data.nome.slice(1);
  const existe = await prisma.cor.findFirst({ where: { nome: { equals: nome, mode: "insensitive" } } });
  if (existe) return { ok: false, erro: `A cor "${existe.nome}" já existe. Use a que está na lista.` };
  await prisma.cor.create({ data: { nome, hex: validacao.data.hex.toUpperCase() } });
  refresh();
  return { ok: true, mensagem: `Cor "${nome}" criada.` };
}

export async function criarTamanho(dados: unknown): Promise<Resultado> {
  if (!(await administradorDaAcao())) return { ok: false, erro: SEM_PERMISSAO };
  const validacao = z
    .object({ nome: z.string().trim().min(1, "Digite o tamanho, por exemplo XG ou 10 anos.").max(20, "Nome longo demais.") })
    .safeParse(dados);
  if (!validacao.success) return { ok: false, erro: validacao.error.issues[0].message };

  const nome = validacao.data.nome.toUpperCase();
  const existe = await prisma.tamanho.findFirst({ where: { nome: { equals: nome, mode: "insensitive" } } });
  if (existe) return { ok: false, erro: `O tamanho "${existe.nome}" já existe. Use o que está na lista.` };
  const ultimo = await prisma.tamanho.aggregate({ _max: { ordem: true } });
  await prisma.tamanho.create({ data: { nome, ordem: (ultimo._max.ordem ?? 0) + 1 } });
  refresh();
  return { ok: true, mensagem: `Tamanho "${nome}" criado. Ele aparece depois dos outros.` };
}

// ---------------------------------------------------------------- Fotos

async function produtoExiste(produtoId: unknown) {
  if (typeof produtoId !== "string" || !z.uuid().safeParse(produtoId).success) return null;
  return prisma.produto.findUnique({ where: { id: produtoId }, select: { id: true, nome: true, slug: true } });
}

export async function prepararEnvioDeFoto(
  produtoId: unknown,
  arquivo: unknown,
): Promise<{ ok: true; caminho: string; token: string } | { ok: false; erro: string }> {
  if (!(await administradorDaAcao())) return { ok: false, erro: SEM_PERMISSAO };
  const produto = await produtoExiste(produtoId);
  if (!produto) return { ok: false, erro: "Produto não encontrado." };

  const validacao = z.object({ nome: z.string().min(1).max(200), tamanho: z.number().int().positive() }).safeParse(arquivo);
  if (!validacao.success) return { ok: false, erro: "Arquivo inválido." };
  const extensao = extensaoDoArquivo(validacao.data.nome);
  if (!(FORMATOS_DE_FOTO as readonly string[]).includes(extensao)) {
    return { ok: false, erro: "Use uma foto JPG, PNG ou WebP (as fotos do celular costumam ser JPG)." };
  }
  if (validacao.data.tamanho > TAMANHO_MAXIMO_DA_FOTO) {
    return { ok: false, erro: "A foto passa de 10 MB. Tire a foto em resolução menor ou envie por outro aparelho." };
  }

  const supabase = await criarClienteSupabase();
  const caminho = `${produto.id}/${randomUUID()}.${extensao === "jpeg" ? "jpg" : extensao}`;
  const { data, error } = await supabase.storage.from(PASTA_DE_FOTOS).createSignedUploadUrl(caminho);
  if (error || !data) {
    console.error("[produtos] não foi possível preparar o envio:", error?.message);
    return { ok: false, erro: "Não conseguimos preparar o envio. Tente de novo." };
  }
  return { ok: true, caminho: data.path, token: data.token };
}

export async function adicionarFotos(produtoId: unknown, arquivos: unknown): Promise<Resultado> {
  if (!(await administradorDaAcao())) return { ok: false, erro: SEM_PERMISSAO };
  const produto = await produtoExiste(produtoId);
  if (!produto) return { ok: false, erro: "Produto não encontrado." };

  const validacao = z
    .array(z.object({ caminho: z.string().min(1).max(300), nome: z.string().min(1).max(200) }))
    .min(1)
    .max(10)
    .safeParse(arquivos);
  if (!validacao.success) return { ok: false, erro: "Escolha pelo menos uma foto." };
  const caminhos = validacao.data.map((a) => a.caminho);
  if (caminhos.some((c) => !c.startsWith(`${produto.id}/`))) return { ok: false, erro: "Foto inválida. Envie de novo." };

  const noStorage = await prisma.$queryRaw<{ name: string }[]>`
    select name from storage.objects where bucket_id = ${PASTA_DE_FOTOS} and name in (${Prisma.join(caminhos)})`;
  if (noStorage.length !== caminhos.length) return { ok: false, erro: "Alguma foto não terminou de enviar. Envie de novo." };

  const supabase = await criarClienteSupabase();
  const ultima = await prisma.produtoImagem.aggregate({ where: { produtoId: produto.id }, _max: { ordem: true } });
  let ordem = (ultima._max.ordem ?? -1) + 1;
  await prisma.produtoImagem.createMany({
    data: caminhos.map((caminho) => ({
      produtoId: produto.id,
      url: supabase.storage.from(PASTA_DE_FOTOS).getPublicUrl(caminho).data.publicUrl,
      caminhoNoStorage: caminho,
      alt: produto.nome,
      ordem: ordem++,
    })),
    skipDuplicates: true,
  });

  atualizarPaginasDoCatalogo(produto.slug);
  refresh();
  return { ok: true, mensagem: caminhos.length === 1 ? "Foto adicionada." : `${caminhos.length} fotos adicionadas.` };
}

async function fotoDoPainel(fotoId: unknown) {
  if (typeof fotoId !== "string" || !z.uuid().safeParse(fotoId).success) return null;
  return prisma.produtoImagem.findUnique({ where: { id: fotoId }, include: { produto: { select: { slug: true } } } });
}

export async function atualizarFoto(fotoId: unknown, dados: unknown): Promise<Resultado> {
  if (!(await administradorDaAcao())) return { ok: false, erro: SEM_PERMISSAO };
  const foto = await fotoDoPainel(fotoId);
  if (!foto) return { ok: false, erro: "Foto não encontrada. Recarregue a página." };

  const validacao = z
    .object({
      alt: z.string().trim().min(3, "Descreva a foto em poucas palavras (ajuda quem não enxerga e o Google).").max(200, "Descrição longa demais."),
      corId: z.uuid().nullable(),
      enquadramento: z.string().max(20),
    })
    .safeParse(dados);
  if (!validacao.success) return { ok: false, erro: validacao.error.issues[0].message };
  const { alt, corId, enquadramento } = validacao.data;

  const enquadramentoValido =
    ENQUADRAMENTOS.some((e) => e.valor === enquadramento) || enquadramento === (foto.enquadramento ?? "");
  if (!enquadramentoValido) return { ok: false, erro: "Escolha uma das opções de enquadramento." };
  if (corId && !(await prisma.cor.findUnique({ where: { id: corId } }))) {
    return { ok: false, erro: "Essa cor não existe mais. Recarregue a página." };
  }

  await prisma.produtoImagem.update({
    where: { id: foto.id },
    data: { alt, corId, enquadramento: enquadramento || null },
  });
  atualizarPaginasDoCatalogo(foto.produto.slug);
  refresh();
  return { ok: true, mensagem: "Foto salva." };
}

/** Sobe (-1) ou desce (+1) a foto na ordem. A primeira é a que aparece nos cartões. */
export async function moverFoto(fotoId: unknown, direcao: unknown): Promise<Resultado> {
  if (!(await administradorDaAcao())) return { ok: false, erro: SEM_PERMISSAO };
  const foto = await fotoDoPainel(fotoId);
  if (!foto || (direcao !== -1 && direcao !== 1)) return { ok: false, erro: "Foto não encontrada. Recarregue a página." };

  const fotos = await prisma.produtoImagem.findMany({
    where: { produtoId: foto.produtoId },
    orderBy: [{ ordem: "asc" }, { id: "asc" }],
    select: { id: true },
  });
  const posicao = fotos.findIndex((f) => f.id === foto.id);
  const destino = posicao + (direcao as number);
  if (destino < 0 || destino >= fotos.length) return { ok: true };
  [fotos[posicao], fotos[destino]] = [fotos[destino], fotos[posicao]];

  await prisma.$transaction(fotos.map((f, ordem) => prisma.produtoImagem.update({ where: { id: f.id }, data: { ordem } })));
  atualizarPaginasDoCatalogo(foto.produto.slug);
  refresh();
  return { ok: true };
}

export async function removerFoto(fotoId: unknown): Promise<Resultado> {
  if (!(await administradorDaAcao())) return { ok: false, erro: SEM_PERMISSAO };
  const foto = await fotoDoPainel(fotoId);
  if (!foto) return { ok: false, erro: "Foto não encontrada. Recarregue a página." };

  await prisma.produtoImagem.delete({ where: { id: foto.id } });
  if (foto.caminhoNoStorage) {
    const supabase = await criarClienteSupabase();
    const { data, error } = await supabase.storage.from(PASTA_DE_FOTOS).remove([foto.caminhoNoStorage]);
    if (error || data.length === 0) {
      console.error("[produtos] foto apagada do banco, mas não do Storage:", foto.caminhoNoStorage, error?.message ?? "");
    }
  }
  atualizarPaginasDoCatalogo(foto.produto.slug);
  refresh();
  return { ok: true, mensagem: "Foto removida." };
}
