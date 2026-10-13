"use client";

import { Plus } from "lucide-react";
import { useState, useTransition, type FormEvent } from "react";

import { criarCor, criarTamanho } from "@/app/admin/produtos/acoes";
import { Aviso } from "@/components/formulario/Aviso";

// Cadastro rápido de cor e de tamanho, usado na página do modelo.

function useAcaoSimples() {
  const [resultado, setResultado] = useState<{ tipo: "erro" | "sucesso"; texto: string } | null>(null);
  const [enviando, iniciar] = useTransition();
  return { resultado, setResultado, enviando, iniciar };
}

export function NovaCor() {
  const [nome, setNome] = useState("");
  const [hex, setHex] = useState("#000000");
  const { resultado, setResultado, enviando, iniciar } = useAcaoSimples();

  function enviar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    iniciar(async () => {
      const r = await criarCor({ nome, hex });
      setResultado(r.ok ? { tipo: "sucesso", texto: r.mensagem ?? "Criada." } : { tipo: "erro", texto: r.erro });
      if (r.ok) setNome("");
    });
  }

  return (
    <form onSubmit={enviar} className="space-y-3 rounded-xl bg-fundo p-4">
      <p className="text-[15px] font-semibold">Falta uma cor na lista?</p>
      <div className="flex gap-3">
        <label className="block flex-1">
          <span className="block text-[14px]">Nome da cor</span>
          <input
            value={nome}
            onChange={(e) => {
              setNome(e.target.value);
              setResultado(null);
            }}
            maxLength={40}
            placeholder="Ex.: Verde-musgo"
            className="mt-1 h-12 w-full rounded-xl border border-borda bg-papel px-3 text-[16px] outline-none focus:border-tinta"
          />
        </label>
        <label className="block">
          <span className="block text-[14px]">Cor</span>
          <input
            type="color"
            value={hex}
            onChange={(e) => setHex(e.target.value)}
            className="mt-1 h-12 w-16 cursor-pointer rounded-xl border border-borda bg-papel p-1"
          />
        </label>
      </div>
      {resultado && <Aviso tipo={resultado.tipo}>{resultado.texto}</Aviso>}
      <button type="submit" disabled={enviando} className="inline-flex min-h-12 items-center gap-2 rounded-full border border-tinta px-6 text-[15px] font-semibold hover:bg-papel disabled:opacity-50">
        <Plus aria-hidden="true" className="size-4" strokeWidth={2} />
        {enviando ? "Criando…" : "Criar cor"}
      </button>
    </form>
  );
}

export function NovoTamanho() {
  const [nome, setNome] = useState("");
  const { resultado, setResultado, enviando, iniciar } = useAcaoSimples();

  function enviar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    iniciar(async () => {
      const r = await criarTamanho({ nome });
      setResultado(r.ok ? { tipo: "sucesso", texto: r.mensagem ?? "Criado." } : { tipo: "erro", texto: r.erro });
      if (r.ok) setNome("");
    });
  }

  return (
    <form onSubmit={enviar} className="space-y-3 rounded-xl bg-fundo p-4">
      <p className="text-[15px] font-semibold">Falta um tamanho na lista?</p>
      <label className="block">
        <span className="block text-[14px]">Tamanho</span>
        <input
          value={nome}
          onChange={(e) => {
            setNome(e.target.value);
            setResultado(null);
          }}
          maxLength={20}
          placeholder="Ex.: XG ou 10 anos"
          className="mt-1 h-12 w-full rounded-xl border border-borda bg-papel px-3 text-[16px] outline-none focus:border-tinta"
        />
      </label>
      {resultado && <Aviso tipo={resultado.tipo}>{resultado.texto}</Aviso>}
      <button type="submit" disabled={enviando} className="inline-flex min-h-12 items-center gap-2 rounded-full border border-tinta px-6 text-[15px] font-semibold hover:bg-papel disabled:opacity-50">
        <Plus aria-hidden="true" className="size-4" strokeWidth={2} />
        {enviando ? "Criando…" : "Criar tamanho"}
      </button>
    </form>
  );
}
