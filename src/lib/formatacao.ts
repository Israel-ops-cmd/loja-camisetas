const formatadorDeReais = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

/** Preços são guardados em centavos, como inteiro. */
export function formatarPreco(centavos: number) {
  return formatadorDeReais.format(centavos / 100);
}
