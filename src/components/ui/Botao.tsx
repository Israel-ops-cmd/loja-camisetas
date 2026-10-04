import Link from "next/link";
import type { ComponentProps } from "react";

const variantes = {
  /** Fundo Lacre. No máximo um por seção. */
  principal: "bg-lacre text-papel hover:brightness-110",
  /** Fundo Tinta, para fundos claros. */
  secundario: "bg-tinta text-papel hover:bg-painel",
  /** Contorno branco, para fundos escuros. */
  contorno: "border-[1.5px] border-papel text-papel hover:bg-papel hover:text-tinta",
};

export type VarianteBotao = keyof typeof variantes;

/** Classes do botão, para usar também em `<button>`. */
export function classesBotao(variante: VarianteBotao = "principal") {
  return `texto-menu inline-flex min-h-11 items-center justify-center rounded-full px-9 py-4 text-center font-bold transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-lacre disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:brightness-100 ${variantes[variante]}`;
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
