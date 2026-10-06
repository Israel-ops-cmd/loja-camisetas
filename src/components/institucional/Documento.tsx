import type { ReactNode } from "react";

import { ATUALIZACAO_DAS_POLITICAS, ou } from "@/lib/loja";

/** Página de texto longo (políticas e termos): título, sumário e seções. */
export function Documento({
  sobretitulo,
  titulo,
  resumo,
  secoes,
  mostrarData = true,
}: {
  sobretitulo: string;
  titulo: string;
  /** Parágrafo de abertura, em destaque. */
  resumo: ReactNode;
  secoes: { id: string; titulo: string; conteudo: ReactNode }[];
  mostrarData?: boolean;
}) {
  return (
    <>
      <section className="secao bg-tinta text-papel">
        <div className="mx-auto max-w-3xl">
          <p className="sobretitulo text-secundario-escuro">{sobretitulo}</p>
          <h1 className="titulo-destaque mt-5">{titulo}</h1>
          <div className="texto-destaque mt-6 text-apoio-escuro">{resumo}</div>
          {mostrarData && (
            <p className="mt-6 text-[13px] text-secundario-escuro">
              Última atualização: {ou(ATUALIZACAO_DAS_POLITICAS, "DATA DA PUBLICAÇÃO")}
            </p>
          )}
        </div>
      </section>

      <div className="secao">
        <div className="mx-auto max-w-3xl">
          {secoes.length > 3 && (
            <nav aria-labelledby="titulo-sumario" className="rounded-[20px] bg-papel p-6">
              <h2 id="titulo-sumario" className="sobretitulo">Nesta página</h2>
              <ol className="mt-3 space-y-1">
                {secoes.map((s, i) => (
                  <li key={s.id}>
                    <a href={`#${s.id}`} className="inline-flex min-h-11 items-center text-[15px] underline-offset-4 hover:underline">
                      {i + 1}. {s.titulo}
                    </a>
                  </li>
                ))}
              </ol>
            </nav>
          )}

          <div className="mt-6 space-y-6">
            {secoes.map((s, i) => (
              <section
                key={s.id}
                id={s.id}
                aria-labelledby={`titulo-${s.id}`}
                className="scroll-mt-24 rounded-[20px] bg-papel p-6 sm:p-8"
              >
                <h2 id={`titulo-${s.id}`} className="font-titulo text-[22px] leading-tight font-bold">
                  {secoes.length > 3 && `${i + 1}. `}
                  {s.titulo}
                </h2>
                <div className="mt-4 space-y-4 text-[16px] leading-relaxed text-apoio [&_a]:font-semibold [&_a]:text-tinta [&_a]:underline [&_a]:underline-offset-4 [&_li]:ml-5 [&_li]:list-disc [&_strong]:text-tinta [&_ul]:space-y-2">
                  {s.conteudo}
                </div>
              </section>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
