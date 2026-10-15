import type { Metadata } from "next";
import { Cormorant_Garamond, Manrope } from "next/font/google";

import { Cabecalho } from "@/components/layout/Cabecalho";
import { FaixaAviso } from "@/components/layout/FaixaAviso";
import { Rodape } from "@/components/layout/Rodape";
import { enderecoDoSite, podeIndexar } from "@/lib/site";

import "./globals.css";

const cormorant = Cormorant_Garamond({
  variable: "--font-cormorant",
  subsets: ["latin"],
  weight: ["400", "500"],
  style: ["normal", "italic"],
});

const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

// A camiseta é o carro-forte e a loja atende todos os públicos (as estampas
// cristãs são uma das linhas). Os termos buscados entram no título e na descrição.
const TITULO = "Carta Viva | Camisetas estampadas e personalizadas";
const DESCRICAO =
  "Camisetas estampadas em Natal e enviadas para todo o Brasil. Estampas da casa, camisetas lisas e personalizadas com a sua arte, também no atacado.";

export const metadata: Metadata = {
  metadataBase: new URL(enderecoDoSite()),
  title: {
    default: TITULO,
    template: "%s | Carta Viva",
  },
  description: DESCRICAO,
  applicationName: "Carta Viva",
  // Cartão ao compartilhar o link (a imagem vem de opengraph-image.tsx).
  openGraph: {
    type: "website",
    locale: "pt_BR",
    siteName: "Carta Viva",
    title: TITULO,
    description: DESCRICAO,
  },
  twitter: { card: "summary_large_image" },
  // Só a produção com o domínio definitivo entra no Google (ver src/lib/site.ts).
  robots: podeIndexar() ? { index: true, follow: true } : { index: false, follow: false },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="pt-BR"
      className={`${cormorant.variable} ${manrope.variable} h-full scroll-smooth antialiased`}
    >
      <body className="flex min-h-full flex-col">
        <FaixaAviso />
        <Cabecalho />
        <main className="flex-1">{children}</main>
        <Rodape />
      </body>
    </html>
  );
}
