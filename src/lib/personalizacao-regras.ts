// Regras da personalização usadas no navegador e no servidor.
// A conferência que vale é sempre a do servidor.

import type {
  PosicaoEstampa,
  StatusPersonalizacao,
} from "@/generated/prisma/enums";

/** Pasta privada no Supabase Storage (criada pela migration). */
export const PASTA_DO_STORAGE = "personalizacao";

export const TAMANHO_MAXIMO_BYTES = 20 * 1024 * 1024;
export const MAXIMO_DE_ARQUIVOS = 3;
export const QUANTIDADE_MAXIMA_POR_TAMANHO = 500;

/**
 * Formatos aceitos. Os de programas de design (.cdr, .ai, .psd) não têm
 * miniatura no site: aparecem com um ícone genérico.
 */
export const FORMATOS_DE_ARTE = ["png", "jpg", "jpeg", "svg", "pdf", "cdr", "ai", "psd"] as const;
/** A prévia precisa ser uma imagem que o cliente consiga ver no site. */
export const FORMATOS_DE_PREVIA = ["png", "jpg", "jpeg"] as const;
const COM_MINIATURA = new Set(["png", "jpg", "jpeg", "svg"]);

export function extensaoDoArquivo(nome: string) {
  const partes = nome.toLowerCase().split(".");
  return partes.length > 1 ? partes.pop()! : "";
}

export function temMiniatura(nome: string) {
  return COM_MINIATURA.has(extensaoDoArquivo(nome));
}

export function formatarTamanhoDoArquivo(bytes: number) {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1).replace(".", ",").replace(/,0$/, "")} MB`;
}

export const rotulosDePosicao: Record<PosicaoEstampa, { titulo: string; detalhe: string }> = {
  FRENTE_PEITO: { titulo: "Frente, no peito", detalhe: "Estampa pequena, do lado esquerdo" },
  FRENTE_GRANDE: { titulo: "Frente, grande", detalhe: "Estampa no centro da frente" },
  COSTAS: { titulo: "Costas", detalhe: "Estampa grande nas costas" },
};

export const ordemDasPosicoes: PosicaoEstampa[] = ["FRENTE_PEITO", "FRENTE_GRANDE", "COSTAS"];

export const rotulosDeStatusDaPersonalizacao: Record<StatusPersonalizacao, string> = {
  RECEBIDA: "Recebido",
  PREVIA_ENVIADA: "Prévia enviada",
  AJUSTE_SOLICITADO: "Ajuste solicitado",
  APROVADA: "Aprovado",
  CONVERTIDA: "Virou pedido",
  CANCELADA: "Cancelado",
  RECUSADA: "Recusado",
};

/** Texto que o cliente confirma ao enviar a arte. A data da confirmação fica no pedido. */
export const DECLARACAO_DE_DIREITOS =
  "Declaro que tenho direito de usar a arte, as imagens, os textos e as marcas enviados (sou o autor ou tenho autorização de quem é) e que eles não violam direitos de outras pessoas.";

export function formatarNumeroDaPersonalizacao(numero: number) {
  return `nº ${numero}`;
}

export { lerPrecoEmCentavos } from "@/lib/formatacao";
