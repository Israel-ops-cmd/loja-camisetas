import Link from "next/link";
import { X } from "lucide-react";

import type { FiltrosCatalogo, OpcoesDeFiltro } from "@/lib/catalogo";
import { hrefCatalogo } from "@/lib/url-catalogo";

type FiltrosAtivosProps = {
  filtros: FiltrosCatalogo;
  opcoes: OpcoesDeFiltro;
};

export function FiltrosAtivos({ filtros, opcoes }: FiltrosAtivosProps) {
  const ativos = [
    filtros.categoria && {
      rotulo: opcoes.categorias.find((c) => c.slug === filtros.categoria)?.nome,
      href: hrefCatalogo(filtros, { categoria: undefined }),
    },
    filtros.cor && {
      rotulo: opcoes.cores.find((c) => c.slug === filtros.cor)?.nome,
      href: hrefCatalogo(filtros, { cor: undefined }),
    },
    filtros.tamanho && {
      rotulo: `Tamanho ${filtros.tamanho}`,
      href: hrefCatalogo(filtros, { tamanho: undefined }),
    },
  ].filter((filtro) => !!filtro);

  if (ativos.length === 0) return null;

  return (
    <div className="flex flex-wrap items-center gap-2">
      {ativos.map((filtro) => (
        <Link
          key={filtro.href}
          href={filtro.href}
          scroll={false}
          className="inline-flex min-h-11 items-center gap-1.5 rounded-full border border-borda bg-papel py-2 pr-3 pl-4 text-[14px] font-semibold transition hover:border-tinta"
        >
          {filtro.rotulo}
          <X aria-hidden="true" className="size-4" strokeWidth={1.8} />
          <span className="sr-only">(remover filtro)</span>
        </Link>
      ))}
      <Link
        href={hrefCatalogo({ ordem: filtros.ordem })}
        scroll={false}
        className="inline-flex min-h-11 items-center px-2 text-[14px] font-semibold text-secundario underline underline-offset-4 hover:text-tinta"
      >
        Limpar filtros
      </Link>
    </div>
  );
}
