import { formatarPreco } from "@/lib/formatacao";
import { FRETE_GRATIS_A_PARTIR_DE_EM_CENTAVOS } from "@/lib/frete-regras";
import { MAXIMO_DE_PARCELAS } from "@/lib/pagamento";

export function FaixaAviso() {
  const valor = formatarPreco(FRETE_GRATIS_A_PARTIR_DE_EM_CENTAVOS).replace(",00", "");
  return (
    <p className="bg-areia px-5 py-2 text-center text-[11px] tracking-[0.06em] text-apoio sm:py-2.5 sm:text-[12px] sm:tracking-[0.08em]">
      Frete grátis para todo o Brasil acima de {valor}
      <span className="hidden sm:inline"> · Pix, cartão em até {MAXIMO_DE_PARCELAS}x e boleto</span>
    </p>
  );
}
