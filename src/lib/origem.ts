import "server-only";

import { headers } from "next/headers";

/**
 * Endereço do site na requisição atual (http://localhost:3000, o túnel de
 * teste ou o domínio real). Usado nos links de e-mail e nos retornos do
 * Mercado Pago, que só aceitam endereços cadastrados ou https.
 */
export async function origemDoSite() {
  const cabecalhos = await headers();
  const origem = cabecalhos.get("origin");
  if (origem) return origem;
  const host = cabecalhos.get("x-forwarded-host") ?? cabecalhos.get("host");
  const protocolo = cabecalhos.get("x-forwarded-proto") ?? "https";
  return `${protocolo}://${host}`;
}
