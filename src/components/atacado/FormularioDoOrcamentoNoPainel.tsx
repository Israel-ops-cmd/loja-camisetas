"use client";

import { useState, useTransition, type FormEvent } from "react";

import { atualizarOrcamento } from "@/app/admin/orcamentos/acoes";
import { Aviso } from "@/components/formulario/Aviso";
import { classesBotao } from "@/components/ui/Botao";
import type { StatusOrcamento } from "@/generated/prisma/enums";
import { ordemDosStatusDoOrcamento, rotulosDeStatusDoOrcamento } from "@/lib/orcamento-regras";

export function FormularioDoOrcamentoNoPainel({
  numero,
  status: statusInicial,
  anotacoes: anotacoesIniciais,
}: {
  numero: number;
  status: StatusOrcamento;
  anotacoes: string;
}) {
  const [status, setStatus] = useState(statusInicial);
  const [anotacoes, setAnotacoes] = useState(anotacoesIniciais);
  const [resultado, setResultado] = useState<{ tipo: "erro" | "sucesso"; texto: string } | null>(null);
  const [salvando, iniciar] = useTransition();

  function salvar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    setResultado(null);
    iniciar(async () => {
      const r = await atualizarOrcamento(numero, { status, anotacoes: anotacoes || undefined });
      setResultado(r.ok ? { tipo: "sucesso", texto: "Salvo." } : { tipo: "erro", texto: r.erro });
    });
  }

  return (
    <form onSubmit={salvar} className="space-y-4">
      <fieldset>
        <legend className="text-[14px] font-semibold">Situação</legend>
        <div className="mt-2 flex flex-wrap gap-2">
          {ordemDosStatusDoOrcamento.map((s) => (
            <label
              key={s}
              className={`flex min-h-11 cursor-pointer items-center rounded-full border px-4 text-[14px] font-semibold ${status === s ? "border-tinta bg-tinta text-papel" : "border-borda hover:border-tinta"}`}
            >
              <input type="radio" name="status" checked={status === s} onChange={() => setStatus(s)} className="sr-only" />
              {rotulosDeStatusDoOrcamento[s]}
            </label>
          ))}
        </div>
      </fieldset>
      <div>
        <label htmlFor="anotacoes" className="block text-[14px] font-semibold">
          Anotações da loja (o cliente não vê)
        </label>
        <textarea
          id="anotacoes"
          rows={4}
          maxLength={5000}
          value={anotacoes}
          onChange={(e) => setAnotacoes(e.target.value)}
          className="mt-2 w-full rounded-xl border border-borda bg-papel px-4 py-3 text-[16px] outline-none focus:border-tinta"
        />
      </div>
      {resultado && <Aviso tipo={resultado.tipo}>{resultado.texto}</Aviso>}
      <button type="submit" disabled={salvando} className={classesBotao("secundario")}>
        {salvando ? "Salvando…" : "Salvar"}
      </button>
    </form>
  );
}
