"use client";

import { useState, useTransition } from "react";

import { aprovarPrevia, pedirAjuste } from "@/app/personalizacao/acoes";
import { Aviso } from "@/components/formulario/Aviso";
import { classesBotao } from "@/components/ui/Botao";

export function AcoesDaPrevia({ numero }: { numero: number }) {
  const [modo, setModo] = useState<"inicio" | "ajuste">("inicio");
  const [texto, setTexto] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [pendente, iniciar] = useTransition();

  function executar(acao: () => Promise<{ ok: true } | { ok: false; erro: string }>) {
    setErro(null);
    iniciar(async () => {
      const resultado = await acao();
      if (!resultado.ok) setErro(resultado.erro);
    });
  }

  return (
    <div className="space-y-4">
      {erro && <Aviso tipo="erro">{erro}</Aviso>}

      {modo === "inicio" ? (
        <div className="flex flex-col gap-3 sm:flex-row">
          <button
            type="button"
            disabled={pendente}
            onClick={() => executar(() => aprovarPrevia(numero))}
            className={classesBotao("principal")}
          >
            {pendente ? "Aprovando…" : "Aprovar prévia"}
          </button>
          <button
            type="button"
            disabled={pendente}
            onClick={() => setModo("ajuste")}
            className="inline-flex min-h-12 items-center justify-center rounded-full border border-tinta px-7 text-[13px] font-bold tracking-[0.16em] uppercase transition hover:bg-tinta hover:text-papel"
          >
            Pedir ajuste
          </button>
        </div>
      ) : (
        <div>
          <label htmlFor="ajuste" className="block text-[14px] font-semibold">
            O que precisa mudar?
          </label>
          <textarea
            id="ajuste"
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            rows={4}
            maxLength={2000}
            className="mt-2 w-full rounded-xl border border-borda bg-papel px-4 py-3 text-[16px] outline-none focus:border-tinta"
          />
          <div className="mt-3 flex flex-col gap-3 sm:flex-row">
            <button
              type="button"
              disabled={pendente}
              onClick={() => executar(() => pedirAjuste(numero, texto))}
              className={classesBotao("secundario")}
            >
              {pendente ? "Enviando…" : "Enviar pedido de ajuste"}
            </button>
            <button
              type="button"
              onClick={() => setModo("inicio")}
              className="inline-flex min-h-11 items-center justify-center px-4 text-[14px] underline underline-offset-4"
            >
              Voltar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
