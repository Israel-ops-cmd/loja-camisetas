// Dados da loja, usados no rodapé, no contato e nas políticas.
// Campo nulo ainda não foi definido: aparece como marcador entre colchetes onde é
// obrigatório (para ninguém publicar sem perceber) e some onde é opcional.
// `npm run conferir-marcadores` lista o que falta. Ver docs/pendencias.md.

export const LOJA = {
  nome: "Carta Viva Camisetas",
  /** Razão social do CNPJ (a empresa ainda vai ser aberta). */
  razaoSocial: null as string | null,
  cnpj: null as string | null,
  /** Endereço completo de quem vende (o decreto do comércio eletrônico exige). */
  endereco: null as string | null,
  cidade: "Natal/RN",
  /** Só os números, com DDD. */
  whatsapp: "84987137644",
  /** PROVISÓRIO: trocar por um e-mail da loja. */
  email: "israellipe2020@gmail.com",
  horario: null as string | null,
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

/** Nome, razão social e CNPJ (com marcador no que faltar). */
export function identificacaoDaLoja() {
  return `${LOJA.nome} · ${ou(LOJA.razaoSocial, "RAZÃO SOCIAL")} · CNPJ ${ou(LOJA.cnpj, "CNPJ")}`;
}
