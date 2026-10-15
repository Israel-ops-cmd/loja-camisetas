import Link from "next/link";
import type { ComponentProps } from "react";

const variantes = {
  /** Fundo Tinta, texto branco. O vermelho nunca vai em botão. */
  principal: "min-h-12 bg-tinta px-[34px] py-4 text-papel hover:bg-painel",
  /** Contorno fino de Tinta, para a ação ao lado da principal. */
  secundario: "min-h-12 border border-tinta px-[34px] py-4 text-tinta hover:bg-tinta hover:text-papel",
  /** Só texto com sublinhado de 1 px (o botão secundário do redesign). */
  texto: "min-h-11 border-b border-current px-0 py-1.5 hover:opacity-70",
  /** Contorno claro, para fundos escuros. */
  contorno: "min-h-12 border border-papel px-[34px] py-4 text-papel hover:bg-papel hover:text-tinta",
};

export type VarianteBotao = keyof typeof variantes;

/** Classes do botão, para usar também em `<button>`. */
export function classesBotao(variante: VarianteBotao = "principal") {
  return `texto-menu inline-flex items-center justify-center text-center transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-tinta disabled:cursor-not-allowed disabled:opacity-50 ${variantes[variante]}`;
}

type BotaoProps = ComponentProps<typeof Link> & {
  variante?: VarianteBotao;
};

export function Botao({
  variante = "principal",
  className = "",
  ...props
}: BotaoProps) {
  return (
    <Link className={`${classesBotao(variante)} ${className}`} {...props} />
  );
}
