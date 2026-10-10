// Dados da loja, usados no rodapé, no contato e nas políticas.
// Campo nulo ainda não foi definido: aparece como marcador entre colchetes onde é
// obrigatório (para ninguém publicar sem perceber) e some onde é opcional.
// `npm run conferir-marcadores` lista o que falta. Ver docs/pendencias.md.

export const LOJA = {
  nome: "Carta Viva",
  /** Razão social do CNPJ (a empresa ainda vai ser aberta). */
  razaoSocial: null as string | null,
  cnpj: null as string | null,
  /** Endereço de quem vende (o decreto do comércio eletrônico exige). */
  endereco: "Avenida Interventor Mário Câmara, 2038, Dix-Sept Rosado",
  cidade: "Natal/RN",
  /** Só os 8 números. */
  cep: "59054-600" as string | null,
  /** Só os números, com DDD. */
  whatsapp: "84987137644",
  /** A caixa ainda está sendo criada (ver docs/pendencias.md). */
  email: "contato@lojacartaviva.com.br",
  /** Começa com minúscula: aparece no meio de frases. */
  horario: "todos os dias, das 8h às 18h" as string | null,
  /** Endereço do perfil (https://instagram.com/...). Nulo: não aparece. */
  instagram: null as string | null,
};

/** Data da versão das políticas e dos termos (preencher ao publicar). */
export const ATUALIZACAO_DAS_POLITICAS: string | null = null;

/** Valor obrigatório: o próprio valor ou o marcador, bem visível. */
export function ou(valor: string | null, marcador: string) {
  return valor ?? `[${marcador}]`;
}

export function whatsappLegivel(numero = LOJA.whatsapp) {
  return numero.length === 11
    ? `(${numero.slice(0, 2)}) ${numero.slice(2, 7)}-${numero.slice(7)}`
    : `(${numero.slice(0, 2)}) ${numero.slice(2, 6)}-${numero.slice(6)}`;
}

export function linkDoWhatsapp(mensagem?: string) {
  return `https://wa.me/55${LOJA.whatsapp}${mensagem ? `?text=${encodeURIComponent(mensagem)}` : ""}`;
}

/** "Avenida ..., Natal/RN, CEP 59000-000" (com marcador no que faltar). */
export function enderecoCompleto() {
  const cep = LOJA.cep ? `${LOJA.cep.slice(0, 5)}-${LOJA.cep.slice(5)}` : null;
  return `${ou(LOJA.endereco, "ENDEREÇO")}, ${LOJA.cidade}, CEP ${ou(cep, "CEP")}`;
}

/** Primeira letra maiúscula (ex.: horário sozinho numa linha). */
export function comMaiuscula(texto: string) {
  return texto.charAt(0).toUpperCase() + texto.slice(1);
}

/** Nome, razão social e CNPJ (com marcador no que faltar). */
export function identificacaoDaLoja() {
  return `${LOJA.nome} · ${ou(LOJA.razaoSocial, "RAZÃO SOCIAL")} · CNPJ ${ou(LOJA.cnpj, "CNPJ")}`;
}
