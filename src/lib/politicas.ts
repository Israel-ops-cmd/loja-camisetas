// Números das políticas da loja, usados nas páginas, nos e-mails e na limpeza
// automática. Confirmados pelo pai do Israel em 10/10/2026; o texto das
// políticas ainda passa por revisão jurídica (ver docs/pendencias.md).

import { DIAS_PARA_DESPACHAR } from "@/lib/estoque-regras";

/** Direito de arrependimento em compra fora da loja física (CDC, art. 49). */
export const DIAS_PARA_ARREPENDIMENTO = 7;

/** Prazo para trocar tamanho ou cor, contado do recebimento. */
export const DIAS_PARA_TROCA = 7;

/** Despacho de pedido com peças prontas, depois da confirmação do pagamento. */
export const PRAZO_DE_DESPACHO = `até ${DIAS_PARA_DESPACHAR.pronta} dias úteis`;

/** Despacho quando alguma peça da arte ainda vai ser estampada (peça lisa). */
export const PRAZO_DE_DESPACHO_A_ESTAMPAR = `até ${DIAS_PARA_DESPACHAR.aEstampar} dias úteis`;

/** Prazo de despacho de um carrinho, para mostrar antes da compra. */
export function textoDoPrazoDeDespacho(pecasAEstampar: number) {
  return pecasAEstampar === 0
    ? `Despacho em ${PRAZO_DE_DESPACHO} depois da confirmação do pagamento.`
    : `${pecasAEstampar === 1 ? "1 peça vai ser estampada" : `${pecasAEstampar} peças vão ser estampadas`} para você: despacho em ${PRAZO_DE_DESPACHO_A_ESTAMPAR} depois da confirmação do pagamento.`;
}

/** Produção da personalização, depois da confirmação do pagamento (varia com a quantidade). */
export const PRAZO_DE_PRODUCAO = "de 1 a 5 dias úteis";

/** Resposta aos pedidos de orçamento do atacado. */
export const PRAZO_DE_RESPOSTA_DO_ORCAMENTO = "até 2 dias úteis";

/** Prazo para reclamar de defeito aparente em bem durável (CDC, art. 26, II). Revisão jurídica. */
export const DIAS_PARA_DEFEITO = 90;

/** Por quanto tempo cada dado fica guardado (política de privacidade). */
export const GUARDA = {
  /** Pedidos e pagamentos: obrigações fiscais e do Código de Defesa do Consumidor. */
  pedidosEmAnos: 5,
  /** Pedidos de orçamento do atacado. */
  orcamentosEmMeses: 12,
  /** Artes e prévias de personalizações canceladas ou recusadas. */
  artesCanceladasEmDias: 90,
  /** Registro dos e-mails enviados pela loja. */
  emailsEmMeses: 12,
};
