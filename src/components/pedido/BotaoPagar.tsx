"use client";

import { useState, useTransition } from "react";

import { pagarPedido } from "@/app/pedidos/acoes";
import { Aviso } from "@/components/formulario/Aviso";
import { classesBotao } from "@/components/ui/Botao";

export function BotaoPagar({
  numero,
  rotulo = "Pagar agora",
}: {
  numero: number;
  rotulo?: string;
}) {
  const [erro, setErro] = useState<string | null>(null);
  const [abrindo, iniciar] = useTransition();

  return (
    <div>
      <button
        type="button"
        disabled={abrindo}
        onClick={() => {
          setErro(null);
          iniciar(async () => {
            // Em caso de sucesso, a ação leva para o Mercado Pago.
            const resultado = await pagarPedido(numero);
            if (resultado) setErro(resultado.erro);
          });
        }}
        className={`${classesBotao("principal")} w-full sm:w-auto`}
      >
        {abrindo ? "Abrindo o Mercado Pago…" : rotulo}
      </button>
      <p className="mt-3 text-[13px] text-secundario">
        Pix, cartão em até 6x ou boleto, no ambiente seguro do Mercado Pago.
      </p>
      {erro && (
        <div className="mt-3">
          <Aviso tipo="erro">{erro}</Aviso>
        </div>
      )}
    </div>
  );
}
