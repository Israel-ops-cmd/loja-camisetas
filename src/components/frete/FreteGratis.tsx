import { Truck } from "lucide-react";

import { formatarPreco } from "@/lib/formatacao";
import {
  FRETE_GRATIS_A_PARTIR_DE_EM_CENTAVOS,
  faltaParaFreteGratis,
} from "@/lib/frete-regras";
import type { OpcaoDeFrete } from "@/lib/melhor-envio";

/** Quanto falta para o frete grátis, com barra de progresso. */
export function AvisoFreteGratis({
  totalDosProdutosEmCentavos,
  className = "",
}: {
  /** Total dos produtos, já com o desconto de atacado. */
  totalDosProdutosEmCentavos: number;
  className?: string;
}) {
  const falta = faltaParaFreteGratis(totalDosProdutosEmCentavos);
  const progresso = Math.min(
    100,
    Math.round((totalDosProdutosEmCentavos / FRETE_GRATIS_A_PARTIR_DE_EM_CENTAVOS) * 100),
  );

  return (
    <div className={`rounded-xl bg-fundo px-4 py-3 text-[14px] ${className}`}>
      <p className="flex items-start gap-2">
        <Truck aria-hidden="true" className="mt-0.5 size-4 shrink-0" strokeWidth={1.8} />
        {falta === 0 ? (
          <span>
            <strong>Você ganhou frete grátis</strong> na opção mais econômica.
          </span>
        ) : (
          <span>
            Faltam <strong>{formatarPreco(falta)}</strong> em produtos para ganhar{" "}
            <strong>frete grátis</strong>.
          </span>
        )}
      </p>
      <div
        role="progressbar"
        aria-label="Caminho até o frete grátis"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={progresso}
        className="mt-2 h-1.5 overflow-hidden rounded-full bg-borda"
      >
        <div className="h-full rounded-full bg-tinta transition-[width]" style={{ width: `${progresso}%` }} />
      </div>
    </div>
  );
}

/** Preço de uma opção de entrega, com o original riscado quando houver frete grátis. */
export function PrecoDaOpcao({ opcao }: { opcao: OpcaoDeFrete }) {
  const original = opcao.precoOriginalEmCentavos;
  return (
    <span className="shrink-0 text-right">
      {original !== undefined && original !== opcao.precoEmCentavos && (
        <s className="block text-[13px] font-normal text-secundario">
          <span className="sr-only">De </span>
          {formatarPreco(original)}
        </s>
      )}
      <span className="font-bold">
        {original !== undefined && <span className="sr-only">por </span>}
        {opcao.precoEmCentavos === 0 ? "Grátis" : formatarPreco(opcao.precoEmCentavos)}
      </span>
    </span>
  );
}
