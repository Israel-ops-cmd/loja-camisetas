// Regras do frete grátis. Sem código de servidor: o carrinho, o checkout e as
// páginas institucionais usam os mesmos números.

import { formatarPreco } from "@/lib/formatacao";
import type { OpcaoDeFrete } from "@/lib/melhor-envio";

/**
 * Frete grátis para todo o Brasil a partir deste total em produtos, já com o
 * desconto de atacado. Único lugar do valor mínimo.
 */
export const FRETE_GRATIS_A_PARTIR_DE_EM_CENTAVOS = 40_000;

export function ganhouFreteGratis(totalDosProdutosEmCentavos: number) {
  return totalDosProdutosEmCentavos >= FRETE_GRATIS_A_PARTIR_DE_EM_CENTAVOS;
}

export function faltaParaFreteGratis(totalDosProdutosEmCentavos: number) {
  return Math.max(0, FRETE_GRATIS_A_PARTIR_DE_EM_CENTAVOS - totalDosProdutosEmCentavos);
}

/**
 * Com frete grátis, a loja paga o valor da opção mais barata: ela sai de
 * graça e, nas mais rápidas, o cliente paga só a diferença. Cada opção com
 * desconto guarda o preço original em `precoOriginalEmCentavos`.
 */
export function aplicarFreteGratis(
  opcoes: OpcaoDeFrete[],
  totalDosProdutosEmCentavos: number,
): OpcaoDeFrete[] {
  if (opcoes.length === 0 || !ganhouFreteGratis(totalDosProdutosEmCentavos)) return opcoes;
  const pagoPelaLoja = Math.min(...opcoes.map((o) => o.precoEmCentavos));
  return opcoes.map((opcao) => ({
    ...opcao,
    precoEmCentavos: opcao.precoEmCentavos - pagoPelaLoja,
    precoOriginalEmCentavos: opcao.precoEmCentavos,
  }));
}

/** "Grátis" quando a loja pagou o frete todo; senão, o valor cobrado. */
export function textoDoFrete(freteEmCentavos: number, freteDescontoEmCentavos: number) {
  return freteEmCentavos === 0 && freteDescontoEmCentavos > 0 ? "Grátis" : formatarPreco(freteEmCentavos);
}
