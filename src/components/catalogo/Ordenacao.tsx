import Link from "next/link";

import {
  ordenacoes,
  type FiltrosCatalogo,
  type Ordenacao as TipoOrdenacao,
} from "@/lib/catalogo";
import { hrefCatalogo } from "@/lib/url-catalogo";

export function Ordenacao({ filtros }: { filtros: FiltrosCatalogo }) {
  const opcoes = Object.entries(ordenacoes) as [TipoOrdenacao, string][];

  return (
    <nav aria-label="Ordenar produtos" className="flex flex-wrap items-center gap-x-1">
      <span className="mr-1 text-[13px] text-secundario">Ordenar:</span>
      {opcoes.map(([valor, rotulo]) => {
        const ativo = valor === filtros.ordem;
        return (
          <Link
            key={valor}
            href={hrefCatalogo(filtros, { ordem: valor })}
            scroll={false}
            aria-current={ativo ? "true" : undefined}
            className={`inline-flex min-h-11 items-center rounded-full px-3 text-[14px] transition ${ativo ? "font-bold text-tinta" : "text-apoio hover:text-tinta"}`}
          >
            {rotulo}
          </Link>
        );
      })}
    </nav>
  );
}
