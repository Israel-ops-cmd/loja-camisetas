import Link from "next/link";
import { ChevronDown } from "lucide-react";

import { DadosEstruturados, textoDe } from "@/components/seo/DadosEstruturados";
import { listarPerguntasFrequentes } from "@/lib/perguntas-frequentes";

/**
 * Lista em sanfona. Na página inicial mostra só as perguntas em destaque,
 * com link para a página completa.
 */
export async function PerguntasFrequentes({ todas = false }: { todas?: boolean }) {
  const perguntas = (await listarPerguntasFrequentes()).filter((p) => todas || p.destaque);
  const Titulo = todas ? "h1" : "h2";

  return (
    <section
      id="perguntas-frequentes"
      aria-labelledby="titulo-perguntas"
      className="secao scroll-mt-18 bg-papel"
    >
      {todas && (
        <DadosEstruturados
          dados={{
            "@context": "https://schema.org",
            "@type": "FAQPage",
            mainEntity: perguntas.map((p) => ({
              "@type": "Question",
              name: p.pergunta,
              acceptedAnswer: { "@type": "Answer", text: textoDe(p.resposta).replace(/s+/g, " ").trim() },
            })),
          }}
        />
      )}
      <div className="mx-auto max-w-3xl">
        <Titulo id="titulo-perguntas" className={todas ? "titulo-destaque" : "titulo-listagem"}>
          Perguntas frequentes
        </Titulo>
        <div className="mt-12 border-t border-borda">
          {perguntas.map((item) => (
            <details key={item.pergunta} className="group border-b border-borda">
              <summary className="flex min-h-16 cursor-pointer list-none items-center justify-between gap-4 py-4 font-semibold [&::-webkit-details-marker]:hidden">
                {item.pergunta}
                <ChevronDown
                  aria-hidden="true"
                  className="size-5 shrink-0 transition group-open:rotate-180"
                  strokeWidth={1.6}
                />
              </summary>
              <p className="pb-5 text-apoio [&_a]:font-semibold [&_a]:text-tinta [&_a]:underline [&_a]:underline-offset-4">
                {item.resposta}
              </p>
            </details>
          ))}
        </div>
        {todas ? (
          <p className="mt-10 text-apoio">
            Não achou a resposta? <Link href="/contato" className="font-semibold text-tinta underline underline-offset-4">Fale com a gente</Link>.
          </p>
        ) : (
          <Link
            href="/perguntas-frequentes"
            className="mt-8 inline-flex min-h-11 items-center font-semibold underline underline-offset-4"
          >
            Ver todas as perguntas
          </Link>
        )}
      </div>
    </section>
  );
}
