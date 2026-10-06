import type { Metadata } from "next";
import { Archivo, Manrope } from "next/font/google";

import { Cabecalho } from "@/components/layout/Cabecalho";
import { FaixaAviso } from "@/components/layout/FaixaAviso";
import { Rodape } from "@/components/layout/Rodape";
import { enderecoDoSite, podeIndexar } from "@/lib/site";

import "./globals.css";

const archivo = Archivo({
  variable: "--font-archivo",
  subsets: ["latin"],
  weight: ["500", "700", "800", "900"],
});

const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const DESCRICAO =
  "Camisetas lisas, estampas da casa e peças personalizadas com a sua arte. Para usar, presentear ou vestir a sua equipe.";

export const metadata: Metadata = {
  metadataBase: new URL(enderecoDoSite()),
  title: {
    default: "Carta Viva Camisetas",
    template: "%s | Carta Viva Camisetas",
  },
  description: DESCRICAO,
  applicationName: "Carta Viva Camisetas",
  // Cartão ao compartilhar o link (a imagem vem de opengraph-image.tsx).
  openGraph: {
    type: "website",
    locale: "pt_BR",
    siteName: "Carta Viva Camisetas",
    title: "Carta Viva Camisetas",
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
      className={`${archivo.variable} ${manrope.variable} h-full scroll-smooth antialiased`}
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
