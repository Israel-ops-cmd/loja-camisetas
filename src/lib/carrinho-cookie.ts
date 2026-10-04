// Formato do cookie do carrinho, usado no servidor e no navegador.
// Guarda só IDs de variação e quantidades: preço e estoque sempre vêm do banco.
// Valor: "idDaVariacao:quantidade,idDaVariacao:quantidade"

export const NOME_COOKIE_CARRINHO = "carrinho";

/** Mantém o cookie bem abaixo do limite de 4 KB. */
export const MAXIMO_DE_ITENS = 50;

/** Teto técnico de segurança; o limite real é o estoque. */
const QUANTIDADE_MAXIMA = 9999;

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export type ItemDoCookie = { variacaoId: string; quantidade: number };

export function ehIdDeVariacao(valor: unknown): valor is string {
  return typeof valor === "string" && UUID.test(valor);
}

/** Lê o cookie ignorando qualquer parte inválida (cookie editado ou corrompido). */
export function lerCookieDoCarrinho(valor: string | undefined): ItemDoCookie[] {
  if (!valor) return [];

  let texto = valor;
  try {
    texto = decodeURIComponent(valor);
  } catch {
    return [];
  }

  const itens = new Map<string, number>();
  for (const parte of texto.split(",")) {
    const [variacaoId, quantidadeTexto] = parte.split(":");
    const quantidade = Number(quantidadeTexto);
    if (
      !ehIdDeVariacao(variacaoId) ||
      !Number.isInteger(quantidade) ||
      quantidade < 1
    ) {
      continue;
    }
    const id = variacaoId.toLowerCase();
    itens.set(
      id,
      Math.min((itens.get(id) ?? 0) + quantidade, QUANTIDADE_MAXIMA),
    );
    if (itens.size >= MAXIMO_DE_ITENS) break;
  }

  return [...itens].map(([variacaoId, quantidade]) => ({
    variacaoId,
    quantidade,
  }));
}

export function escreverCookieDoCarrinho(itens: ItemDoCookie[]) {
  return itens
    .filter((item) => item.quantidade > 0)
    .slice(0, MAXIMO_DE_ITENS)
    .map((item) => `${item.variacaoId}:${item.quantidade}`)
    .join(",");
}

/** Total de peças, para o contador do cabeçalho. */
export function contarPecas(itens: ItemDoCookie[]) {
  return itens.reduce((total, item) => total + item.quantidade, 0);
}
