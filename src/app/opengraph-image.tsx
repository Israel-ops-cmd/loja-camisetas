import { readFile } from "node:fs/promises";
import { join } from "node:path";

import { ImageResponse } from "next/og";

import { enderecoDoSite } from "@/lib/site";

// Imagem que aparece ao compartilhar um link do site (WhatsApp, Instagram,
// Facebook). Vale para todas as páginas sem imagem própria; a página de
// produto usa a foto do produto. Gerada no build, com as cores e as fontes
// da identidade (assets/fontes).

export const alt = "Carta Viva: camisetas e personalizados.";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const COR = { tinta: "#141414", papel: "#FFFFFF", lacre: "#C8102E", secundarioEscuro: "#B8B8B8", apoioEscuro: "#D6D6D6" };

export default async function Imagem() {
  const [archivo, manropeSemi, manropeMedio] = await Promise.all([
    readFile(join(process.cwd(), "assets/fontes/Archivo-ExtraBold.ttf")),
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
          background: COR.tinta,
          color: COR.papel,
          padding: "72px 80px",
          fontFamily: "Manrope",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 22 }}>
          <svg width="96" height="96" viewBox="0 0 44 44" fill="none">
            <rect x="4" y="9" width="36" height="26" rx="4" stroke={COR.papel} strokeWidth="2.5" />
            <path d="M5 12 L22 26 L39 12" stroke={COR.papel} strokeWidth="2.5" strokeLinejoin="round" />
            <circle cx="22" cy="27" r="4.5" fill={COR.lacre} />
          </svg>
          <span style={{ fontFamily: "Archivo", fontSize: 48, letterSpacing: "0.2em" }}>CARTA VIVA</span>
        </div>

        <div style={{ display: "flex", flexDirection: "column" }}>
          <span style={{ fontFamily: "Archivo", fontSize: 76, lineHeight: 1.02 }}>Vista o que você quer dizer.</span>
          <span style={{ fontSize: 30, fontWeight: 500, color: COR.apoioEscuro, marginTop: 24, maxWidth: 900, lineHeight: 1.35 }}>
            Camisetas e personalizados: estampas da casa, peças lisas e produtos com a sua arte.
          </span>
        </div>

        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <span style={{ fontSize: 24, color: COR.secundarioEscuro }}>{dominio}</span>
          <span style={{ display: "flex", width: 120, height: 8, borderRadius: 999, background: COR.lacre }} />
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [
        { name: "Archivo", data: archivo, weight: 800, style: "normal" },
        { name: "Manrope", data: manropeSemi, weight: 600, style: "normal" },
        { name: "Manrope", data: manropeMedio, weight: 500, style: "normal" },
      ],
    },
  );
}
