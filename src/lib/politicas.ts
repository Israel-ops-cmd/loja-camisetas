// Números das políticas da loja, usados nas páginas e na limpeza automática.
// Os provisórios precisam da confirmação do pai do Israel e da revisão
// jurídica antes de publicar (ver docs/pendencias.md).

/** Direito de arrependimento em compra fora da loja física (CDC, art. 49). */
export const DIAS_PARA_ARREPENDIMENTO = 7;

/** PROVISÓRIO: prazo para trocar tamanho ou cor, contado do recebimento. */
export const DIAS_PARA_TROCA = 30;

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
