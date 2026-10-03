import { Botao } from "@/components/ui/Botao";

export function Hero() {
  return (
    <section className="secao bg-tinta text-papel">
      <div className="mx-auto grid max-w-7xl items-center gap-12 lg:grid-cols-[1.1fr_1fr]">
        <div>
          <p className="sobretitulo text-secundario-escuro">
            Carta Viva Camisetas
          </p>
          <h1 className="titulo-hero mt-5">Vista o que você quer dizer.</h1>
          <p className="texto-destaque mt-6 max-w-xl text-apoio-escuro">
            Camisetas lisas, estampas da casa e peças personalizadas com a sua
            arte. Para usar, presentear ou vestir a sua equipe.
          </p>
          <div className="mt-9 flex flex-col gap-3 sm:flex-row">
            <Botao href="/#produtos">Ver produtos</Botao>
            <Botao href="/#personalizacao" variante="contorno">
              Personalizar
            </Botao>
          </div>
        </div>

        <div className="flex aspect-[5/4] items-center justify-center rounded-[28px] bg-painel p-8">
          <CamisetaIlustrada className="h-full max-h-[420px] w-auto" />
        </div>
      </div>
    </section>
  );
}

function CamisetaIlustrada({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 320 300"
      role="img"
      aria-label="Camiseta com a área de estampa marcada: sua arte aqui"
      className={className}
    >
      <path
        d="M112 20 C124 38 196 38 208 20 L268 46 L304 112 L262 132 L248 108 L248 282 L72 282 L72 108 L58 132 L16 112 L52 46 Z"
        className="fill-produto"
        strokeLinejoin="round"
      />
      <path
        d="M112 20 C124 38 196 38 208 20"
        fill="none"
        className="stroke-borda"
        strokeWidth="6"
        strokeLinecap="round"
      />
      <rect
        x="110"
        y="90"
        width="100"
        height="110"
        rx="8"
        fill="none"
        className="stroke-secundario"
        strokeWidth="2"
        strokeDasharray="7 6"
      />
      <text
        x="160"
        y="140"
        textAnchor="middle"
        className="fill-secundario font-sans text-[11px] font-bold tracking-[0.2em]"
      >
        <tspan x="160">SUA ARTE</tspan>
        <tspan x="160" dy="18">
          AQUI
        </tspan>
      </text>
    </svg>
  );
}
