"use client";

import { Check } from "lucide-react";
import { useState, useTransition } from "react";

import { marcarEstampadas } from "@/app/admin/producao/acoes";

/** "Estampadas": tira o item da lista de produção. */
export function BotaoEstampadas({ itemId }: { itemId: string }) {
  const [erro, setErro] = useState<string | null>(null);
  const [salvando, iniciar] = useTransition();

  return (
    <div className="shrink-0">
      <button
        type="button"
        disabled={salvando}
        onClick={() =>
          iniciar(async () => {
            setErro(null);
            const r = await marcarEstampadas(itemId);
            if (!r.ok) setErro(r.erro);
          })
        }
        className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full border border-tinta px-5 text-[15px] font-bold hover:bg-fundo disabled:opacity-50"
      >
        <Check aria-hidden="true" className="size-5" strokeWidth={2} />
        {salvando ? "Salvando…" : "Estampadas"}
      </button>
      {erro && (
        <p role="alert" className="mt-2 max-w-60 text-[13px] font-semibold">
          {erro}
        </p>
      )}
    </div>
  );
}
