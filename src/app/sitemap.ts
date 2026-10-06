import type { MetadataRoute } from "next";

import { prisma } from "@/lib/prisma";
import { enderecoDoSite } from "@/lib/site";

// Mapa do site para o Google: páginas públicas e cada produto à venda.
// Refeito a cada hora (produto novo no painel entra sozinho).
export const revalidate = 3600;

const PAGINAS: { caminho: string; frequencia: MetadataRoute.Sitemap[number]["changeFrequency"]; prioridade: number }[] = [
  { caminho: "/", frequencia: "daily", prioridade: 1 },
  { caminho: "/produtos", frequencia: "daily", prioridade: 0.9 },
  { caminho: "/personalizacao", frequencia: "monthly", prioridade: 0.7 },
  { caminho: "/atacado", frequencia: "monthly", prioridade: 0.7 },
  { caminho: "/perguntas-frequentes", frequencia: "monthly", prioridade: 0.5 },
  { caminho: "/contato", frequencia: "yearly", prioridade: 0.4 },
  { caminho: "/politica-de-troca", frequencia: "yearly", prioridade: 0.3 },
  { caminho: "/privacidade", frequencia: "yearly", prioridade: 0.2 },
  { caminho: "/termos", frequencia: "yearly", prioridade: 0.2 },
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = enderecoDoSite();
  const produtos = await prisma.produto.findMany({
    where: { ativo: true, variacoes: { some: { ativo: true } } },
    select: { slug: true, atualizadoEm: true, imagens: { orderBy: { ordem: "asc" }, take: 1, select: { url: true } } },
    orderBy: { atualizadoEm: "desc" },
  });

  return [
    ...PAGINAS.map((p) => ({ url: `${base}${p.caminho === "/" ? "" : p.caminho}`, changeFrequency: p.frequencia, priority: p.prioridade })),
    ...produtos.map((p) => ({
      url: `${base}/produtos/${p.slug}`,
      lastModified: p.atualizadoEm,
      changeFrequency: "weekly" as const,
      priority: 0.8,
      images: p.imagens.map((i) => (i.url.startsWith("http") ? i.url : `${base}${i.url}`)),
    })),
  ];
}
