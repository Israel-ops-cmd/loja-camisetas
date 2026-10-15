import type { ReactNode } from "react";

import { Marca } from "@/components/marca/Logo";
import { formatarPreco } from "@/lib/formatacao";
import { FRETE_GRATIS_A_PARTIR_DE_EM_CENTAVOS } from "@/lib/frete-regras";
import { MAXIMO_DE_PARCELAS } from "@/lib/pagamento";
import { DIAS_PARA_TROCA, PRAZO_DE_DESPACHO_A_ESTAMPAR } from "@/lib/politicas";

const traco = {
  width: 26,
  height: 26,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.3,
  "aria-hidden": true,
} as const;

export function Vantagens() {
  const vantagens: { icone: ReactNode; titulo: string; texto: string }[] = [
    {
      icone: (
        <svg {...traco}>
          <path d="M3 7h11v9H3z" />
          <path d="M14 10h4l3 3v3h-7" />
          <circle cx="7" cy="17.5" r="1.5" />
          <circle cx="17" cy="17.5" r="1.5" />
        </svg>
      ),
      titulo: `Frete grátis acima de ${formatarPreco(FRETE_GRATIS_A_PARTIR_DE_EM_CENTAVOS).replace(",00", "")}`,
      texto: "Para todo o Brasil, na opção mais econômica.",
    },
    {
      icone: (
        <svg {...traco}>
          <rect x="3" y="6" width="18" height="12" rx="1.5" />
          <path d="M3 10h18" />
        </svg>
      ),
      titulo: "Pix, cartão e boleto",
      texto: `No cartão, em até ${MAXIMO_DE_PARCELAS}x.`,
    },
    {
      icone: (
        <svg {...traco}>
          <path d="M4 12a8 8 0 0 1 14-5l2 2" />
          <path d="M20 4v5h-5" />
          <path d="M20 12a8 8 0 0 1-14 5l-2-2" />
          <path d="M4 20v-5h5" />
        </svg>
      ),
      titulo: `Troca em ${DIAS_PARA_TROCA} dias`,
      texto: "Tamanho ou cor, depois de receber.",
    },
    {
      icone: <Marca className="size-[26px]" />,
      titulo: "Estampada em Natal",
      texto: `Despacho em ${PRAZO_DE_DESPACHO_A_ESTAMPAR}.`,
    },
  ];

  return (
    <section aria-label="Vantagens" className="largura pb-26">
      <ul className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
        {vantagens.map((v) => (
          <li key={v.titulo} className="flex flex-col gap-2.5">
            {v.icone}
            <span className="text-[14px] font-semibold">{v.titulo}</span>
            <span className="text-[13px] text-secundario">{v.texto}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
