import type { FiltrosCatalogo } from "@/lib/catalogo";

/**
 * Monta a URL de /produtos a partir dos filtros atuais com algumas mudanças.
 * `undefined` remove o filtro. A ordenação padrão não aparece na URL.
 */
export function hrefCatalogo(
  atuais: FiltrosCatalogo,
  mudancas: Partial<FiltrosCatalogo> = {},
) {
  const filtros = { ...atuais, ...mudancas };
  const parametros = new URLSearchParams();

  if (filtros.categoria) parametros.set("categoria", filtros.categoria);
  if (filtros.cor) parametros.set("cor", filtros.cor);
  if (filtros.tamanho) parametros.set("tamanho", filtros.tamanho);
  if (filtros.ordem && filtros.ordem !== "recentes") {
    parametros.set("ordem", filtros.ordem);
  }

  const busca = parametros.toString();
  return busca ? `/produtos?${busca}` : "/produtos";
}
