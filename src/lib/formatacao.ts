const formatadorDeReais = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

/** Preços são guardados em centavos, como inteiro. */
export function formatarPreco(centavos: number) {
  return formatadorDeReais.format(centavos / 100);
}

/** "25", "25,5", "R$ 1.250,00" → centavos. Nulo se não for um valor válido. */
export function lerPrecoEmCentavos(texto: string) {
  const limpo = texto.replace(/R\$|\s/g, "").replace(/\./g, "").replace(",", ".");
  if (!/^\d+(\.\d{1,2})?$/.test(limpo)) return null;
  const centavos = Math.round(Number(limpo) * 100);
  return Number.isSafeInteger(centavos) ? centavos : null;
}

/** 4990 → "49,90" (para preencher campos de preço). */
export function centavosParaTexto(centavos: number) {
  return (centavos / 100).toFixed(2).replace(".", ",");
}

/** "Azul-marinho" → "azul-marinho", "Off-White" → "off-white". */
export function paraSlug(texto: string) {
  return texto
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}
