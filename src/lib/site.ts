// Endereço público do site, para links completos (SEO, compartilhamento,
// sitemap). Ordem: SITE_URL (domínio definitivo) → endereço de produção da
// Vercel → endereço desta prévia → localhost.

export function enderecoDoSite() {
  const configurado = process.env.SITE_URL?.trim().replace(/\/+$/, "");
  if (configurado) return configurado;
  const vercel = process.env.VERCEL_PROJECT_PRODUCTION_URL ?? process.env.VERCEL_URL;
  if (vercel) return `https://${vercel}`;
  return "http://localhost:3000";
}

/**
 * O Google só deve indexar a produção com o domínio definitivo: prévias da
 * Vercel, o endereço .vercel.app e o computador local ficam de fora.
 */
export function podeIndexar() {
  return process.env.VERCEL_ENV === "production" && Boolean(process.env.SITE_URL?.trim());
}

/** Caminhos que não fazem sentido no Google (área logada, compra e sistema). */
export const CAMINHOS_PRIVADOS = [
  "/admin",
  "/api/",
  "/auth/",
  "/conta",
  "/carrinho",
  "/checkout",
  "/pedidos/",
  "/entrar",
  "/cadastro",
  "/recuperar-senha",
  "/redefinir-senha",
];
