import type { Metadata } from "next";
import { Archivo, Manrope } from "next/font/google";

import { Cabecalho } from "@/components/layout/Cabecalho";
import { FaixaAviso } from "@/components/layout/FaixaAviso";
import { Rodape } from "@/components/layout/Rodape";

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

export const metadata: Metadata = {
  title: {
    default: "Carta Viva Camisetas",
    template: "%s | Carta Viva Camisetas",
  },
  description:
    "Camisetas lisas, estampas da casa e peças personalizadas com a sua arte. Para usar, presentear ou vestir a sua equipe.",
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
