import Link from "next/link";
import type { ReactNode } from "react";

import type { FiltrosCatalogo, OpcoesDeFiltro } from "@/lib/catalogo";
import { hrefCatalogo } from "@/lib/url-catalogo";

type FiltrosProps = {
  filtros: FiltrosCatalogo;
  opcoes: OpcoesDeFiltro;
};

/**
 * Cada opção é um link para a URL com o filtro trocado: funciona sem
 * JavaScript, e clicar na opção já selecionada remove o filtro.
 */
export function Filtros({ filtros, opcoes }: FiltrosProps) {
  const categorias = opcoes.categorias.filter(
    (c) => c.totalDeProdutos > 0 || c.slug === filtros.categoria,
  );

  return (
    <div className="space-y-8">
      {categorias.length > 0 && (
        <Grupo titulo="Categoria">
          <ul>
            {categorias.map((categoria) => {
              const ativo = categoria.slug === filtros.categoria;
              return (
                <li key={categoria.slug}>
                  <OpcaoLink
                    href={hrefCatalogo(filtros, {
                      categoria: ativo ? undefined : categoria.slug,
                    })}
                    ativo={ativo}
                    className="flex min-h-11 items-center justify-between gap-3"
                  >
                    <span>{categoria.nome}</span>
                    <span className="text-[13px] text-secundario">
                      {categoria.totalDeProdutos}
                    </span>
                  </OpcaoLink>
                </li>
              );
            })}
          </ul>
        </Grupo>
      )}

      {opcoes.cores.length > 0 && (
        <Grupo titulo="Cor">
          <ul>
            {opcoes.cores.map((cor) => {
              const ativo = cor.slug === filtros.cor;
              return (
                <li key={cor.slug}>
                  <OpcaoLink
                    href={hrefCatalogo(filtros, {
                      cor: ativo ? undefined : cor.slug,
                    })}
                    ativo={ativo}
                    className="flex min-h-11 items-center gap-3"
                  >
                    <span
                      aria-hidden="true"
                      className={`size-[18px] shrink-0 rounded border ${ativo ? "border-tinta ring-2 ring-tinta ring-offset-2" : "border-borda"}`}
                      style={{ backgroundColor: cor.hex }}
                    />
                    {cor.nome}
                  </OpcaoLink>
                </li>
              );
            })}
          </ul>
        </Grupo>
      )}

      {opcoes.tamanhos.length > 0 && (
        <Grupo titulo="Tamanho" legenda="Mostra só o que tem em estoque.">
          <ul className="flex flex-wrap gap-2">
            {opcoes.tamanhos.map((tamanho) => {
              const ativo = tamanho === filtros.tamanho;
              return (
                <li key={tamanho}>
                  <Link
                    href={hrefCatalogo(filtros, {
                      tamanho: ativo ? undefined : tamanho,
                    })}
                    scroll={false}
                    aria-current={ativo ? "true" : undefined}
                    className={`flex size-11 items-center justify-center rounded-lg border text-[13px] font-bold transition ${ativo ? "border-tinta bg-tinta text-papel" : "border-borda bg-papel hover:border-tinta"}`}
                  >
                    {tamanho}
                  </Link>
                </li>
              );
            })}
          </ul>
        </Grupo>
      )}
    </div>
  );
}

function Grupo({
  titulo,
  legenda,
  children,
}: {
  titulo: string;
  legenda?: string;
  children: ReactNode;
}) {
  return (
    <section>
      <h2 className="sobretitulo text-tinta">{titulo}</h2>
      {legenda && (
        <p className="mt-1 text-[13px] text-secundario">{legenda}</p>
      )}
      <div className="mt-3">{children}</div>
    </section>
  );
}

function OpcaoLink({
  href,
  ativo,
  className,
  children,
}: {
  href: string;
  ativo: boolean;
  className: string;
  children: ReactNode;
}) {
  return (
    <Link
      href={href}
      scroll={false}
      aria-current={ativo ? "true" : undefined}
      className={`${className} text-[15px] transition ${ativo ? "font-bold text-tinta" : "text-apoio hover:text-tinta"}`}
    >
      {children}
    </Link>
  );
}
