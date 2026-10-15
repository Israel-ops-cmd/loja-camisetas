import type { StatusOrcamento, TipoDePecaOrcamento } from "@/generated/prisma/enums";

export const rotulosDeTipoDePeca: Record<TipoDePecaOrcamento, string> = {
  LISA: "Camiseta lisa",
  ESTAMPA_DA_CASA: "Estampa da casa",
  PERSONALIZADA: "Personalizada com a minha arte",
  NAO_SEI: "Ainda não sei",
};

export const ordemDosTipos: TipoDePecaOrcamento[] = ["LISA", "ESTAMPA_DA_CASA", "PERSONALIZADA", "NAO_SEI"];

export const rotulosDeStatusDoOrcamento: Record<StatusOrcamento, string> = {
  NOVO: "Novo",
  EM_CONTATO: "Em contato",
  FECHADO: "Fechado",
  SEM_RETORNO: "Sem retorno",
};

export const ordemDosStatusDoOrcamento: StatusOrcamento[] = ["NOVO", "EM_CONTATO", "FECHADO", "SEM_RETORNO"];

export const QUANTIDADE_MAXIMA_DO_ORCAMENTO = 100_000;

/** Envios por IP aceitos em uma hora (proteção contra spam). */
export const LIMITE_DE_ENVIOS_POR_HORA = 3;

export const AVISO_DE_DADOS =
  "Usamos seus dados só para responder a este orçamento.";
