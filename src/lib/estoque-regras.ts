// Regras do estoque usadas no navegador e no servidor (loja e painel).

import type { MotivoMovimentacao, StatusPedido } from "@/generated/prisma/enums";

/**
 * Pedidos pagos (estoque já baixado) cujas peças ainda estão na loja. Na
 * contagem da prateleira, essas peças são descontadas.
 */
export const STATUS_ESPERANDO_ENVIO: StatusPedido[] = ["PAGO", "EM_SEPARACAO"];

/** Até este estoque, a loja mostra "Últimas N unidades" e o painel, "acabando". */
export const LIMITE_ULTIMAS_UNIDADES = 3;

/** Maior quantidade aceita numa entrada ou contagem (trava contra erro de digitação). */
export const QUANTIDADE_MAXIMA_NO_ESTOQUE = 10_000;

/** Motivos da correção de contagem, gravados na observação da movimentação. */
export const MOTIVOS_DE_CORRECAO = ["Contagem", "Defeito", "Brinde", "Outro"] as const;
export type MotivoDeCorrecao = (typeof MOTIVOS_DE_CORRECAO)[number];

export const rotulosDeMovimentacao: Record<MotivoMovimentacao, string> = {
  ENTRADA: "Chegaram peças",
  VENDA: "Venda",
  AJUSTE: "Correção de contagem",
  CANCELAMENTO: "Devolvido ao estoque",
  ESTAMPA: "Estampadas com a arte",
};

export type SituacaoDoEstoque = "faltando" | "esgotado" | "acabando" | "normal";

export function situacaoDoEstoque(estoque: number): SituacaoDoEstoque {
  if (estoque < 0) return "faltando";
  if (estoque === 0) return "esgotado";
  if (estoque <= LIMITE_ULTIMAS_UNIDADES) return "acabando";
  return "normal";
}

/** "12 peças", "1 peça", "Esgotado", "Faltam 2 peças". */
export function descreverEstoque(estoque: number) {
  if (estoque < 0) return estoque === -1 ? "Falta 1 peça" : `Faltam ${-estoque} peças`;
  if (estoque === 0) return "Esgotado";
  return estoque === 1 ? "1 peça" : `${estoque} peças`;
}

// ---------------------------------------------------------------- Peças lisas e prontas

/**
 * Categoria das camisetas lisas: a variação delas não tem estoque próprio, a
 * venda sai direto da peça lisa. É também a categoria das peças base da
 * personalização.
 */
export const CATEGORIA_DAS_LISAS = "basicas";

export const ehCamisetaLisa = (categoriaSlug: string) => categoriaSlug === CATEGORIA_DAS_LISAS;

export type ItemParaDistribuir = {
  quantidade: number;
  /** Peças prontas da arte (0 numa camiseta lisa ou numa personalização). */
  prontas: number;
  /** Peça lisa usada na falta de pronta. */
  pecaLisaId: string;
};

export type Distribuicao = {
  /** Quanto dá para vender deste item (prontas + lisas). */
  possivel: number;
  prontas: number;
  /** Peças que saem das lisas. */
  daLisa: number;
  /** Máximo deste item, mantendo os outros itens como estão. */
  limite: number;
};

/**
 * Divide os itens entre as peças prontas de cada um e as lisas, que são
 * compartilhadas (duas artes no M preto usam as mesmas lisas). Os primeiros
 * itens têm preferência. Estoque negativo conta como zero.
 */
export function distribuirEstoque(itens: ItemParaDistribuir[], lisas: Map<string, number>): Distribuicao[] {
  const restante = new Map([...lisas].map(([id, n]) => [id, Math.max(n, 0)]));
  const divididos = itens.map((item) => {
    const prontas = Math.min(item.quantidade, Math.max(item.prontas, 0));
    const daLisa = Math.min(item.quantidade - prontas, restante.get(item.pecaLisaId) ?? 0);
    restante.set(item.pecaLisaId, (restante.get(item.pecaLisaId) ?? 0) - daLisa);
    return { prontas, daLisa };
  });
  return divididos.map(({ prontas, daLisa }, i) => ({
    possivel: prontas + daLisa,
    prontas,
    daLisa,
    limite: Math.max(itens[i].prontas, 0) + daLisa + (restante.get(itens[i].pecaLisaId) ?? 0),
  }));
}

/** Prazo para despachar depois do pagamento, em dias úteis. */
export const DIAS_PARA_DESPACHAR = {
  pronta: 2,
  aEstampar: 4,
  /** Máximo da produção da personalização (PRAZO_DE_PRODUCAO, em politicas.ts). */
  personalizacao: 5,
} as const;

/**
 * Dia (no horário de Brasília) que fica `dias` dias úteis depois de `inicio`.
 * Conta segunda a sexta; feriados não entram na conta. Devolve o dia ao meio-dia UTC.
 */
export function somarDiasUteis(inicio: Date, dias: number) {
  const data = new Date(inicio.getTime() - 3 * 60 * 60 * 1000);
  data.setUTCHours(12, 0, 0, 0);
  let faltam = dias;
  while (faltam > 0) {
    data.setUTCDate(data.getUTCDate() + 1);
    const semana = data.getUTCDay();
    if (semana !== 0 && semana !== 6) faltam--;
  }
  return data;
}
