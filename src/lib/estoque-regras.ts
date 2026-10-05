// Regras do estoque usadas no navegador e no servidor (loja e painel).

import type { MotivoMovimentacao, StatusPedido } from "@/generated/prisma/enums";

/**
 * Pedidos pagos (estoque já baixado) cujas peças ainda estão na loja. Na
 * contagem da prateleira, essas peças são descontadas.
 */
export const STATUS_ESPERANDO_ENVIO: StatusPedido[] = ["PAGO", "EM_SEPARACAO"];

/** Até este estoque, a loja mostra "Últimas N unidades" e o painel, "acabando". */
export const LIMITE_ULTIMAS_UNIDADES = 3;

/** Maior quantidade aceita numa entrada ou contagem (trava contra erro de digitação). */
export const QUANTIDADE_MAXIMA_NO_ESTOQUE = 10_000;

/** Motivos da correção de contagem, gravados na observação da movimentação. */
export const MOTIVOS_DE_CORRECAO = ["Contagem", "Defeito", "Brinde", "Outro"] as const;
export type MotivoDeCorrecao = (typeof MOTIVOS_DE_CORRECAO)[number];

export const rotulosDeMovimentacao: Record<MotivoMovimentacao, string> = {
  ENTRADA: "Chegaram peças",
  VENDA: "Venda",
  AJUSTE: "Correção de contagem",
  CANCELAMENTO: "Devolvido ao estoque",
};

export type SituacaoDoEstoque = "faltando" | "esgotado" | "acabando" | "normal";

export function situacaoDoEstoque(estoque: number): SituacaoDoEstoque {
  if (estoque < 0) return "faltando";
  if (estoque === 0) return "esgotado";
  if (estoque <= LIMITE_ULTIMAS_UNIDADES) return "acabando";
  return "normal";
}

/** "12 peças", "1 peça", "Esgotado", "Faltam 2 peças". */
export function descreverEstoque(estoque: number) {
  if (estoque < 0) return estoque === -1 ? "Falta 1 peça" : `Faltam ${-estoque} peças`;
  if (estoque === 0) return "Esgotado";
  return estoque === 1 ? "1 peça" : `${estoque} peças`;
}
