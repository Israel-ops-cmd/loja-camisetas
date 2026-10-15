import type { MetadataRoute } from "next";

import { CAMINHOS_PRIVADOS, enderecoDoSite, podeIndexar } from "@/lib/site";

// Fora da produção com domínio definitivo, nada é indexado (prévias e o
// endereço .vercel.app não devem aparecer no Google).
export default function robots(): MetadataRoute.Robots {
  if (!podeIndexar()) {
    return { rules: { userAgent: "*", disallow: "/" } };
  }
  return {
    rules: { userAgent: "*", allow: "/", disallow: CAMINHOS_PRIVADOS },
    sitemap: `${enderecoDoSite()}/sitemap.xml`,
    host: enderecoDoSite(),
  };
}
