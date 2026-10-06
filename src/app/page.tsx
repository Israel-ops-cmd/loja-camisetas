import type { Metadata } from "next";

import { Atacado } from "@/components/inicio/Atacado";
import { Categorias } from "@/components/inicio/Categorias";
import { Hero } from "@/components/inicio/Hero";
import { PerguntasFrequentes } from "@/components/inicio/PerguntasFrequentes";
import { Personalizacao } from "@/components/inicio/Personalizacao";
import { ProdutosDestaque } from "@/components/inicio/ProdutosDestaque";
import { Vantagens } from "@/components/inicio/Vantagens";
import { DadosEstruturados } from "@/components/seo/DadosEstruturados";
import { LOJA } from "@/lib/loja";
import { enderecoDoSite } from "@/lib/site";

// Os destaques vêm do banco. A página é gerada estática e refeita a cada
// 5 minutos; o painel força a atualização ao editar produtos.
export const revalidate = 300;

export const metadata: Metadata = { alternates: { canonical: "/" } };

export default function PaginaInicial() {
  const site = enderecoDoSite();
  return (
    <>
      <DadosEstruturados
        dados={{
          "@context": "https://schema.org",
          "@type": "OnlineStore",
          name: LOJA.nome,
          url: site,
          logo: `${site}/icon.svg`,
          image: `${site}/opengraph-image`,
          email: LOJA.email,
          telephone: `+55${LOJA.whatsapp}`,
          address: { "@type": "PostalAddress", addressLocality: "Natal", addressRegion: "RN", addressCountry: "BR" },
          ...(LOJA.instagram && { sameAs: [LOJA.instagram] }),
        }}
      />
      <Hero />
      <Categorias />
      <ProdutosDestaque />
      <Personalizacao />
      <Atacado />
      <Vantagens />
      <PerguntasFrequentes />
    </>
  );
}
