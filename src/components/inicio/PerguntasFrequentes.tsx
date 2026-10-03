import { ChevronDown } from "lucide-react";

// Respostas ainda não fornecidas (prazos, trocas, atacado):
// os marcadores entre colchetes são trocados quando chegarem.
const perguntas = [
  {
    pergunta: "Quais são as formas de pagamento?",
    resposta: "Pix, cartão e boleto.",
  },
  { pergunta: "Qual é o prazo de entrega?", resposta: "[RESPOSTA]" },
  { pergunta: "Como funciona a troca?", resposta: "[RESPOSTA]" },
  {
    pergunta: "Como envio a minha arte para personalizar?",
    resposta: "[RESPOSTA]",
  },
  {
    pergunta: "Qual é a quantidade mínima no atacado?",
    resposta: "[RESPOSTA]",
  },
];

export function PerguntasFrequentes() {
  return (
    <section
      id="perguntas-frequentes"
      aria-labelledby="titulo-perguntas"
      className="secao scroll-mt-18 bg-papel"
    >
      <div className="mx-auto max-w-3xl">
        <h2 id="titulo-perguntas" className="titulo-listagem">
          Perguntas frequentes
        </h2>
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
              <p className="pb-5 text-apoio">{item.resposta}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
