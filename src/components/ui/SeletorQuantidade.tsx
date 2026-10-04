"use client";

import { Minus, Plus } from "lucide-react";

type SeletorQuantidadeProps = {
  valor: number;
  minimo?: number;
  maximo: number;
  aoMudar: (valor: number) => void;
  desativado?: boolean;
  /** Nome do que está sendo contado, para leitores de tela. */
  rotulo?: string;
};

export function SeletorQuantidade({
  valor,
  minimo = 1,
  maximo,
  aoMudar,
  desativado = false,
  rotulo = "Quantidade",
}: SeletorQuantidadeProps) {
  const estiloBotao =
    "flex size-11 items-center justify-center rounded-full transition hover:bg-fundo disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent";

  return (
    <div
      role="group"
      aria-label={rotulo}
      className="inline-flex h-12 items-center rounded-full border border-borda bg-papel px-0.5"
    >
      <button
        type="button"
        onClick={() => aoMudar(valor - 1)}
        disabled={desativado || valor <= minimo}
        aria-label="Diminuir quantidade"
        className={estiloBotao}
      >
        <Minus aria-hidden="true" className="size-4" strokeWidth={1.8} />
      </button>
      <input
        type="number"
        inputMode="numeric"
        value={valor}
        min={minimo}
        max={maximo}
        disabled={desativado}
        aria-label={rotulo}
        onChange={(evento) => {
          const numero = Number(evento.target.value);
          if (Number.isInteger(numero)) {
            aoMudar(Math.min(Math.max(numero, minimo), maximo));
          }
        }}
        className="w-12 [appearance:textfield] bg-transparent text-center text-[15px] font-bold outline-none disabled:opacity-60 [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
      />
      <button
        type="button"
        onClick={() => aoMudar(valor + 1)}
        disabled={desativado || valor >= maximo}
        aria-label="Aumentar quantidade"
        className={estiloBotao}
      >
        <Plus aria-hidden="true" className="size-4" strokeWidth={1.8} />
      </button>
    </div>
  );
}
