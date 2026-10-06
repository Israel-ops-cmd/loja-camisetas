import type { Metadata } from "next";

import { PerguntasFrequentes } from "@/components/inicio/PerguntasFrequentes";
import { LOJA } from "@/lib/loja";

export const metadata: Metadata = {
  title: "Perguntas frequentes",
  description: `Pagamento, entrega, trocas, personalização e atacado na ${LOJA.nome}.`,
};

// Atualiza junto com a página inicial (a resposta do atacado vem do banco).
export const revalidate = 300;

export default function PaginaPerguntasFrequentes() {
  return <PerguntasFrequentes todas />;
}
