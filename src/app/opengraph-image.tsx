import { readFile } from "node:fs/promises";
import { join } from "node:path";

import { ImageResponse } from "next/og";

import { enderecoDoSite } from "@/lib/site";

// Imagem que aparece ao compartilhar um link do site (WhatsApp, Instagram,
// Facebook). Vale para todas as páginas sem imagem própria; a página de
// produto usa a foto do produto. Gerada no build, com as cores do redesign
// e a Manrope (assets/fontes).

export const alt = "Carta Viva: camisetas estampadas e personalizadas.";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const COR = { fundo: "#F5F2EC", tinta: "#1C1B19", apoio: "#4A4640", secundario: "#6B665E", borda: "#DDD6CA", lacre: "#C8102E" };

export default async function Imagem() {
  const [manropeSemi, manropeMedio] = await Promise.all([
    readFile(join(process.cwd(), "assets/fontes/Manrope-SemiBold.ttf")),
    readFile(join(process.cwd(), "assets/fontes/Manrope-Medium.ttf")),
  ]);
  const dominio = new URL(enderecoDoSite()).host;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: COR.fundo,
          color: COR.tinta,
          padding: "72px 80px",
          fontFamily: "Manrope",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          <svg width="80" height="80" viewBox="0 0 44 44" fill="none">
            <rect x="4" y="9" width="36" height="26" rx="3" stroke={COR.tinta} strokeWidth="1.8" />
            <path d="M5 12 L22 26 L39 12" stroke={COR.tinta} strokeWidth="1.8" strokeLinejoin="round" />
            <circle cx="22" cy="27" r="4" fill={COR.lacre} />
          </svg>
          <span style={{ fontSize: 30, fontWeight: 600, letterSpacing: "0.32em" }}>CARTA VIVA</span>
        </div>

        <div style={{ display: "flex", flexDirection: "column" }}>
          <span style={{ fontSize: 76, fontWeight: 500, lineHeight: 1.05, letterSpacing: "-0.02em" }}>Vista o que você quer dizer.</span>
          <span style={{ fontSize: 30, fontWeight: 500, color: COR.apoio, marginTop: 24, maxWidth: 900, lineHeight: 1.4 }}>
            Camisetas estampadas em Natal e enviadas para todo o Brasil. Estampas da casa, lisas e personalizadas com a sua arte.
          </span>
        </div>

        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", borderTop: `1px solid ${COR.borda}`, paddingTop: 24 }}>
          <span style={{ fontSize: 24, fontWeight: 500, color: COR.secundario }}>{dominio}</span>
          <span style={{ fontSize: 20, fontWeight: 600, letterSpacing: "0.2em", color: COR.secundario }}>CAMISETAS E PERSONALIZADOS</span>
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [
        { name: "Manrope", data: manropeSemi, weight: 600, style: "normal" },
        { name: "Manrope", data: manropeMedio, weight: 500, style: "normal" },
      ],
    },
  );
}
