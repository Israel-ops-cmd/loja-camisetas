import type { StatusPedido } from "@/generated/prisma/enums";

export const rotulosDeStatus: Record<StatusPedido, string> = {
  AGUARDANDO_PAGAMENTO: "Aguardando pagamento",
  PAGO: "Pago",
  EM_SEPARACAO: "Em separação",
  ENVIADO: "Enviado",
  ENTREGUE: "Entregue",
  CANCELADO: "Cancelado",
};

export function formatarNumeroDoPedido(numero: number) {
  return `#${numero}`;
}

const formatadorDeData = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  timeZone: "America/Sao_Paulo",
});

export function formatarData(data: Date) {
  return formatadorDeData.format(data);
}

const formatadorDeDataHora = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "America/Sao_Paulo",
});

export function formatarDataHora(data: Date) {
  return formatadorDeDataHora.format(data);
}

/** Caminho do pedido depois de pago. Cada passo pode ser desfeito (voltar um). */
export const PROXIMA_SITUACAO: Partial<Record<StatusPedido, StatusPedido>> = {
  PAGO: "EM_SEPARACAO",
  EM_SEPARACAO: "ENVIADO",
  ENVIADO: "ENTREGUE",
};

export const SITUACAO_ANTERIOR: Partial<Record<StatusPedido, StatusPedido>> = {
  EM_SEPARACAO: "PAGO",
  ENVIADO: "EM_SEPARACAO",
  ENTREGUE: "ENVIADO",
};

/** Texto do botão que leva o pedido para a situação. */
export const rotulosDoBotaoDeSituacao: Partial<Record<StatusPedido, string>> = {
  EM_SEPARACAO: "Comecei a separar",
  ENVIADO: "Enviei o pedido",
  ENTREGUE: "O cliente recebeu",
};

/** Rastreio no site do Melhor Rastreio (aceita Correios e transportadoras). */
export function linkDeRastreio(codigo: string) {
  return `https://www.melhorrastreio.com.br/rastreio/${encodeURIComponent(codigo)}`;
}
