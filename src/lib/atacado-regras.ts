// Desconto de atacado: regra única para carrinho, pedido e cobrança.
// O desconto é aplicado no preço de cada peça, arredondado para baixo ao
// centavo (a favor do cliente). Assim a soma cobrada é sempre exata.

export type FaixaDeDesconto = { minimoDePecas: number; percentual: number };

export function precoComDesconto(precoEmCentavos: number, percentual: number) {
  if (percentual <= 0 || precoEmCentavos <= 0) return precoEmCentavos;
  // Nunca zera a peça: o Mercado Pago recusa item com preço 0.
  return Math.max(1, Math.floor((precoEmCentavos * (100 - percentual)) / 100));
}

/** Faixa que vale para essa quantidade de peças (a de maior mínimo alcançado). */
export function faixaAplicavel(quantidadeDePecas: number, faixas: FaixaDeDesconto[]) {
  return (
    [...faixas]
      .sort((a, b) => b.minimoDePecas - a.minimoDePecas)
      .find((f) => quantidadeDePecas >= f.minimoDePecas) ?? null
  );
}

/** Próxima faixa com desconto maior, e quantas peças faltam para ela. */
export function proximaFaixa(quantidadeDePecas: number, faixas: FaixaDeDesconto[]) {
  const atual = faixaAplicavel(quantidadeDePecas, faixas)?.percentual ?? 0;
  const proxima = [...faixas]
    .sort((a, b) => a.minimoDePecas - b.minimoDePecas)
    .find((f) => f.minimoDePecas > quantidadeDePecas && f.percentual > atual);
  return proxima ? { ...proxima, faltam: proxima.minimoDePecas - quantidadeDePecas } : null;
}

/** Subtotal cheio, desconto e total dos itens com o percentual aplicado por peça. */
export function totaisComDesconto(
  itens: { precoEmCentavos: number; quantidade: number }[],
  percentual: number,
) {
  const subtotal = itens.reduce((t, i) => t + i.precoEmCentavos * i.quantidade, 0);
  const comDesconto = itens.reduce(
    (t, i) => t + precoComDesconto(i.precoEmCentavos, percentual) * i.quantidade,
    0,
  );
  return { subtotal, desconto: subtotal - comDesconto, totalDosItens: comDesconto };
}

export function descreverFaixa(faixa: FaixaDeDesconto, seguinte?: FaixaDeDesconto) {
  return seguinte
    ? `${faixa.minimoDePecas} a ${seguinte.minimoDePecas - 1} peças`
    : `${faixa.minimoDePecas} peças ou mais`;
}

/** Travas do editor da tabela no painel (contra erro de digitação). */
export const LIMITES_DA_TABELA = {
  faixas: 5,
  minimoDePecas: { minimo: 2, maximo: 10_000 },
  percentual: { minimo: 1, maximo: 50 },
};
