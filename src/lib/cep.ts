import "server-only";

import { unstable_cache } from "next/cache";

export type EnderecoDoCep = {
  cep: string;
  logradouro: string;
  bairro: string;
  cidade: string;
  uf: string;
};

/** Só os 8 dígitos, ou `null` se não for um CEP. */
export function normalizarCep(valor: unknown) {
  if (typeof valor !== "string") return null;
  const digitos = valor.replace(/\D/g, "");
  return digitos.length === 8 ? digitos : null;
}

export function formatarCep(cep: string) {
  return `${cep.slice(0, 5)}-${cep.slice(5)}`;
}

/**
 * Consulta o ViaCEP. Devolve `null` quando o CEP não existe e lança erro
 * quando o serviço não responde (quem chama decide se isso bloqueia).
 */
async function consultarViaCep(cep: string): Promise<EnderecoDoCep | null> {
  const resposta = await fetch(`https://viacep.com.br/ws/${cep}/json/`, {
    signal: AbortSignal.timeout(5000),
    cache: "no-store",
  });
  if (resposta.status === 400) return null;
  if (!resposta.ok) throw new Error(`ViaCEP respondeu ${resposta.status}`);

  const dados = await resposta.json();
  if (dados.erro) return null;

  return {
    cep,
    logradouro: dados.logradouro ?? "",
    bairro: dados.bairro ?? "",
    cidade: dados.localidade ?? "",
    uf: dados.uf ?? "",
  };
}

/** Endereços de CEP quase nunca mudam: guarda por um dia. */
export const buscarCep = unstable_cache(consultarViaCep, ["viacep"], {
  revalidate: 60 * 60 * 24,
});
