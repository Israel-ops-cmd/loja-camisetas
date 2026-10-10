// Números das políticas da loja, usados nas páginas, nos e-mails e na limpeza
// automática. Confirmados pelo pai do Israel em 10/10/2026; o texto das
// políticas ainda passa por revisão jurídica (ver docs/pendencias.md).

/** Direito de arrependimento em compra fora da loja física (CDC, art. 49). */
export const DIAS_PARA_ARREPENDIMENTO = 7;

/** Prazo para trocar tamanho ou cor, contado do recebimento. */
export const DIAS_PARA_TROCA = 7;

/** Despacho de pedido com peças em estoque, depois da confirmação do pagamento. */
export const PRAZO_DE_DESPACHO = "até 2 dias úteis";

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
