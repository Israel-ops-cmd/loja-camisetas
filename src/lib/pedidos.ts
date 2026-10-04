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
