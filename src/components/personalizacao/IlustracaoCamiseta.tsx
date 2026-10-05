import type { PosicaoEstampa } from "@/generated/prisma/enums";

const CORPO =
  "M112 20 C124 38 196 38 208 20 L268 46 L304 112 L262 132 L248 108 L248 282 L72 282 L72 108 L58 132 L16 112 L52 46 Z";

/** Caixa de seleção com alças nos cantos (docs/identidade-visual.md). */
function Caixa({ x, y, largura, altura, rotulo, sobreEscuro }: { x: number; y: number; largura: number; altura: number; rotulo: boolean; sobreEscuro: boolean }) {
  const traco = sobreEscuro ? "stroke-papel" : "stroke-tinta";
  const alcas = [
    [x, y],
    [x + largura, y],
    [x, y + altura],
    [x + largura, y + altura],
  ];
  return (
    <g>
      <rect
        x={x}
        y={y}
        width={largura}
        height={altura}
        rx="4"
        fill="none"
        className={traco}
        strokeWidth="2"
        strokeDasharray="6 5"
      />
      {alcas.map(([cx, cy]) => (
        <rect
          key={`${cx}-${cy}`}
          x={cx - 4}
          y={cy - 4}
          width="8"
          height="8"
          className={sobreEscuro ? "fill-tinta stroke-papel" : "fill-papel stroke-tinta"}
          strokeWidth="1.5"
        />
      ))}
      {rotulo && (
        <text
          x={x + largura / 2}
          y={y + altura / 2 + 4}
          textAnchor="middle"
          className={`${sobreEscuro ? "fill-papel" : "fill-tinta"} font-sans text-[10px] font-bold tracking-[0.18em]`}
        >
          SUA ARTE AQUI
        </text>
      )}
    </g>
  );
}

/** Cor escura (luminância baixa): a caixa fica clara para aparecer. */
function ehEscura(hex: string) {
  const n = Number.parseInt(hex.replace("#", ""), 16);
  const [r, g, b] = [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  return 0.2126 * r + 0.7152 * g + 0.0722 * b < 110;
}

/**
 * Camiseta lisa, frente e costas, com a área de estampa marcada nas posições
 * escolhidas. A cor da peça acompanha a escolha do cliente.
 */
export function IlustracaoCamiseta({
  hex = "#FFFFFF",
  posicoes,
}: {
  hex?: string;
  posicoes: PosicaoEstampa[];
}) {
  const sobreEscuro = ehEscura(hex);
  const vistas = [
    { titulo: "Frente", caixas: [
      posicoes.includes("FRENTE_PEITO") && { x: 172, y: 78, largura: 46, altura: 40, rotulo: false },
      posicoes.includes("FRENTE_GRANDE") && { x: 110, y: 120, largura: 100, altura: 100, rotulo: true },
    ] },
    { titulo: "Costas", caixas: [
      posicoes.includes("COSTAS") && { x: 100, y: 80, largura: 120, altura: 150, rotulo: true },
    ] },
  ];

  return (
    <div className="grid grid-cols-2 gap-4">
      {vistas.map((vista) => (
        <figure key={vista.titulo} className="rounded-[20px] bg-produto p-4">
          <svg viewBox="0 0 320 300" role="img" aria-label={`${vista.titulo} da camiseta`} className="h-auto w-full">
            <path d={CORPO} fill={hex} className="stroke-borda" strokeWidth="3" strokeLinejoin="round" />
            <path
              d={vista.titulo === "Frente" ? "M112 20 C124 44 196 44 208 20" : "M112 20 C124 30 196 30 208 20"}
              fill="none"
              className="stroke-borda"
              strokeWidth="5"
              strokeLinecap="round"
            />
            {vista.caixas.map(
              (caixa) =>
                caixa && <Caixa key={`${caixa.x}-${caixa.y}`} {...caixa} sobreEscuro={sobreEscuro} />,
            )}
          </svg>
          <figcaption className="mt-2 text-center text-[12px] font-semibold tracking-[0.2em] text-secundario uppercase">
            {vista.titulo}
          </figcaption>
        </figure>
      ))}
    </div>
  );
}
