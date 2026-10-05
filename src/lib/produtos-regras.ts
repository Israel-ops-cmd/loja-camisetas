// Regras do cadastro de produtos (painel), usadas no navegador e no servidor.

/** Pasta pública do Storage para as fotos dos produtos (criada pela migration). */
export const PASTA_DE_FOTOS = "produtos";
export const FORMATOS_DE_FOTO = ["jpg", "jpeg", "png", "webp"] as const;
export const TAMANHO_MAXIMO_DA_FOTO = 10 * 1024 * 1024;

/**
 * Enquadramento da foto nos cartões quadrados, em linguagem simples.
 * O valor é o "object-position" do CSS.
 */
export const ENQUADRAMENTOS = [
  { valor: "", rotulo: "Centralizada" },
  { valor: "50% 20%", rotulo: "Mostrar mais a parte de cima" },
  { valor: "50% 80%", rotulo: "Mostrar mais a parte de baixo" },
  { valor: "20% 50%", rotulo: "Mostrar mais o lado esquerdo" },
  { valor: "80% 50%", rotulo: "Mostrar mais o lado direito" },
] as const;

/** Limites do pacote de uma peça (frete). */
export const LIMITES_DO_PACOTE = {
  pesoEmGramas: { minimo: 1, maximo: 30_000 },
  centimetros: { minimo: 1, maximo: 200 },
};

/** Código da variação: "CV-CAMISETA-LISA-PRETA-M". */
export function gerarSku(slugDoProduto: string, nomeDaCor: string, nomeDoTamanho: string) {
  const limpar = (t: string) =>
    t
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .toUpperCase()
      .replace(/[^A-Z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
  return `CV-${limpar(slugDoProduto)}-${limpar(nomeDaCor)}-${limpar(nomeDoTamanho)}`;
}
