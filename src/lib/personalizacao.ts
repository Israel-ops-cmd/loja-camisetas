import "server-only";

import { randomUUID } from "node:crypto";

import { Prisma } from "@/generated/prisma/client";
import {
  extensaoDoArquivo,
  PASTA_DO_STORAGE,
  temMiniatura,
} from "@/lib/personalizacao-regras";
import { prisma } from "@/lib/prisma";
import { criarClienteSupabase } from "@/lib/supabase/servidor";

/** Categoria cujos produtos podem ser personalizados (camisetas lisas). */
export const CATEGORIA_DAS_PECAS = "basicas";

export type PecaPersonalizavel = {
  id: string;
  nome: string;
  cores: { id: string; nome: string; hex: string }[];
  tamanhos: { id: string; nome: string }[];
};

/** Peças da categoria Camisetas Básicas, com as cores e tamanhos ativos. */
export async function listarPecasPersonalizaveis(): Promise<PecaPersonalizavel[]> {
  const produtos = await prisma.produto.findMany({
    where: {
      ativo: true,
      categoria: { slug: CATEGORIA_DAS_PECAS },
      variacoes: { some: { ativo: true } },
    },
    orderBy: { nome: "asc" },
    select: {
      id: true,
      nome: true,
      variacoes: {
        where: { ativo: true },
        select: {
          cor: { select: { id: true, nome: true, hex: true } },
          tamanho: { select: { id: true, nome: true, ordem: true } },
        },
      },
    },
  });

  return produtos.map((produto) => {
    const cores = new Map<string, PecaPersonalizavel["cores"][number]>();
    const tamanhos = new Map<string, { id: string; nome: string; ordem: number }>();
    for (const { cor, tamanho } of produto.variacoes) {
      cores.set(cor.id, cor);
      tamanhos.set(tamanho.id, tamanho);
    }
    return {
      id: produto.id,
      nome: produto.nome,
      cores: [...cores.values()].sort((a, b) => a.nome.localeCompare(b.nome)),
      tamanhos: [...tamanhos.values()]
        .sort((a, b) => a.ordem - b.ordem)
        .map(({ id, nome }) => ({ id, nome })),
    };
  });
}

// ---------------------------------------------------------------- Storage

/** Caminho novo para um arquivo do cliente (artes) ou da loja (prévias). */
export function caminhoNovo(
  clienteId: string,
  tipo: "artes" | "previas",
  nomeOriginal: string,
  personalizacaoId?: string,
) {
  const extensao = extensaoDoArquivo(nomeOriginal);
  const pasta =
    tipo === "artes"
      ? `${clienteId}/artes`
      : `${clienteId}/previas/${personalizacaoId}`;
  return `${pasta}/${randomUUID()}.${extensao}`;
}

/**
 * Link temporário para o navegador enviar o arquivo direto ao Storage.
 * Usa a sessão de quem pede: as regras do Storage só deixam o cliente
 * enviar para a própria pasta de artes, e o administrador para qualquer pasta.
 */
export async function criarEnvioAssinado(caminho: string) {
  const supabase = await criarClienteSupabase();
  const { data, error } = await supabase.storage
    .from(PASTA_DO_STORAGE)
    .createSignedUploadUrl(caminho);
  if (error || !data) {
    console.error("[storage] não foi possível preparar o envio:", error?.message);
    return null;
  }
  return { caminho: data.path, token: data.token };
}

/** Confere no banco do Storage que os arquivos existem e devolve o tamanho de cada um. */
export async function arquivosNoStorage(caminhos: string[]) {
  if (caminhos.length === 0) return new Map<string, number>();
  const linhas = await prisma.$queryRaw<{ name: string; tamanho: bigint | null }[]>`
    select name, (metadata->>'size')::bigint as tamanho
      from storage.objects
     where bucket_id = ${PASTA_DO_STORAGE} and name in (${Prisma.join(caminhos)})`;
  return new Map(linhas.map((l) => [l.name, Number(l.tamanho ?? 0)]));
}

export type ArquivoParaMostrar = {
  id: string;
  nome: string;
  tamanhoBytes: number;
  /** Link para ver (miniatura); nulo para formatos sem miniatura. */
  urlVer: string | null;
  urlBaixar: string | null;
};

/** Links temporários (1 hora), gerados com a sessão de quem está vendo. */
export async function linksDosArquivos(
  arquivos: { id: string; caminho: string; nomeOriginal: string; tamanhoBytes: number }[],
): Promise<ArquivoParaMostrar[]> {
  if (arquivos.length === 0) return [];
  const supabase = await criarClienteSupabase();
  const pasta = supabase.storage.from(PASTA_DO_STORAGE);

  return Promise.all(
    arquivos.map(async (arquivo) => {
      const [ver, baixar] = await Promise.all([
        temMiniatura(arquivo.nomeOriginal)
          ? pasta.createSignedUrl(arquivo.caminho, 3600)
          : Promise.resolve({ data: null }),
        pasta.createSignedUrl(arquivo.caminho, 3600, { download: arquivo.nomeOriginal }),
      ]);
      return {
        id: arquivo.id,
        nome: arquivo.nomeOriginal,
        tamanhoBytes: arquivo.tamanhoBytes,
        urlVer: ver.data?.signedUrl ?? null,
        urlBaixar: baixar.data?.signedUrl ?? null,
      };
    }),
  );
}

// ---------------------------------------------------------------- Consultas

export const incluirDetalhes = {
  produto: { select: { id: true, nome: true, pesoEmGramas: true, larguraCm: true, alturaCm: true, comprimentoCm: true } },
  cor: { select: { id: true, nome: true, hex: true } },
  cliente: { select: { nome: true, email: true, telefone: true } },
  itens: {
    orderBy: { tamanho: { ordem: "asc" } },
    select: { quantidade: true, tamanho: { select: { id: true, nome: true } } },
  },
  arquivos: {
    orderBy: { criadoEm: "asc" },
    select: { id: true, tipo: true, caminho: true, nomeOriginal: true, tamanhoBytes: true, criadoEm: true },
  },
  mensagens: { orderBy: { criadoEm: "asc" } },
  pedido: { select: { numero: true, status: true } },
} satisfies Prisma.PersonalizacaoInclude;

export type PersonalizacaoDetalhada = Prisma.PersonalizacaoGetPayload<{
  include: typeof incluirDetalhes;
}>;

export function quantidadeTotal(personalizacao: { itens: { quantidade: number }[] }) {
  return personalizacao.itens.reduce((total, item) => total + item.quantidade, 0);
}
