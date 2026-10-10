type MarcaProps = {
  className?: string;
};

/** Envelope com lacre. O traço segue a cor do texto; o lacre é sempre vermelho. */
export function Marca({ className }: MarcaProps) {
  return (
    <svg
      viewBox="0 0 44 44"
      fill="none"
      aria-hidden="true"
      className={className}
    >
      <rect
        x="4"
        y="9"
        width="36"
        height="26"
        rx="4"
        stroke="currentColor"
        strokeWidth="2.5"
      />
      <path
        d="M5 12 L22 26 L39 12"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinejoin="round"
      />
      <circle cx="22" cy="27" r="4.5" className="fill-lacre" />
    </svg>
  );
}

type LogoProps = {
  /** Use `true` sobre fundo escuro: traço branco e texto secundário claro. */
  escuro?: boolean;
  className?: string;
};

export function Logo({ escuro = false, className = "" }: LogoProps) {
  return (
    <span
      className={`inline-flex items-center gap-2.5 ${escuro ? "text-papel" : "text-tinta"} ${className}`}
    >
      <Marca className="size-11 shrink-0" />
      <span className="font-titulo text-[19px] leading-none font-extrabold tracking-[0.2em]">
        CARTA VIVA
      </span>
    </span>
  );
}
