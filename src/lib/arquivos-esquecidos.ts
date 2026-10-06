import "server-only";

import { PASTA_DO_STORAGE } from "@/lib/personalizacao-regras";
import { GUARDA } from "@/lib/politicas";
import { prisma } from "@/lib/prisma";
import { PASTA_DE_FOTOS } from "@/lib/produtos-regras";

// Arquivos no Storage que não estão ligados a nada: foto enviada sem ser
// registrada (internet caiu no meio), arte de formulário de personalização
// que não foi enviado. Só entram os que têm mais de um dia, para não apagar
// um envio em andamento. Também entram as artes e prévias de personalizações
// canceladas ou recusadas há mais tempo que o prazo de guarda da política de
// privacidade (GUARDA.artesCanceladasEmDias).

export type ArquivoEsquecido = { pasta: string; caminho: string; bytes: number; prazoVencido: boolean };

export async function listarArquivosEsquecidos(): Promise<ArquivoEsquecido[]> {
  const dias = GUARDA.artesCanceladasEmDias;
  const linhas = await prisma.$queryRaw<{ pasta: string; caminho: string; bytes: bigint | null; vencido: boolean }[]>`
    select o.bucket_id as pasta, o.name as caminho, (o.metadata->>'size')::bigint as bytes,
      exists (select 1 from personalizacao_arquivos a where a.caminho = o.name) as vencido
    from storage.objects o
    where o.created_at < now() - interval '1 day'
      and o.name not like '%.emptyFolderPlaceholder'
      and (
        (o.bucket_id = ${PASTA_DE_FOTOS}
          and not exists (select 1 from produto_imagens i where i."caminhoNoStorage" = o.name))
        or
        (o.bucket_id = ${PASTA_DO_STORAGE}
          and not exists (select 1 from personalizacao_arquivos a where a.caminho = o.name))
        or
        (o.bucket_id = ${PASTA_DO_STORAGE}
          and exists (
            select 1 from personalizacao_arquivos a join personalizacoes p on p.id = a."personalizacaoId"
            where a.caminho = o.name and p.status in ('CANCELADA', 'RECUSADA')
              and p."atualizadoEm" < now() - make_interval(days => ${dias}::int)))
      )
    order by o.created_at
    limit 1000`;
  return linhas.map((l) => ({ pasta: l.pasta, caminho: l.caminho, bytes: Number(l.bytes ?? 0), prazoVencido: l.vencido }));
}
