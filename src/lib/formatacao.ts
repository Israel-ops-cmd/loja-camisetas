const formatadorDeReais = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

/** Preços são guardados em centavos, como inteiro. */
export function formatarPreco(centavos: number) {
  return formatadorDeReais.format(centavos / 100);
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
