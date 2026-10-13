"use client";

import { Check } from "lucide-react";
import { useState, useTransition } from "react";

import { salvarCoresETamanhos } from "@/app/admin/modelos/acoes";
import { Aviso } from "@/components/formulario/Aviso";
import { NovaCor, NovoTamanho } from "@/components/admin/NovaCorOuTamanho";
import { classesBotao } from "@/components/ui/Botao";
import { mmParaTexto } from "@/lib/produtos-regras";

type Cor = { id: string; nome: string; hex: string };
type Tamanho = { id: string; nome: string };
type Medida = { comprimento: string; largura: string; manga: string };

const classeDoCampo =
  "mt-1 h-12 w-full rounded-xl border border-borda bg-papel px-3 text-[16px] outline-none focus:border-tinta";

/** Cores do modelo e tamanhos com a tabela de medidas (em cm). */
export function CoresETamanhosDoModelo({
  modeloId,
  cores,
  tamanhos,
  coresDoModelo,
  medidasDoModelo,
}: {
  modeloId: string;
  /** Todas as cores e todos os tamanhos cadastrados. */
  cores: Cor[];
  tamanhos: Tamanho[];
  coresDoModelo: string[];
  medidasDoModelo: { tamanhoId: string; comprimentoMm: number; larguraMm: number; mangaMm: number }[];
}) {
  const [marcadas, setMarcadas] = useState(() => new Set(coresDoModelo));
  const [medidas, setMedidas] = useState<Record<string, Medida>>(() =>
    Object.fromEntries(
      medidasDoModelo.map((m) => [
        m.tamanhoId,
        { comprimento: mmParaTexto(m.comprimentoMm), largura: mmParaTexto(m.larguraMm), manga: mmParaTexto(m.mangaMm) },
      ]),
    ),
  );
  const [resultado, setResultado] = useState<{ tipo: "erro" | "sucesso"; texto: string } | null>(null);
  const [salvando, iniciar] = useTransition();

  function alternarCor(id: string) {
    setResultado(null);
    setMarcadas((atual) => {
      const nova = new Set(atual);
      if (nova.has(id)) nova.delete(id);
      else nova.add(id);
      return nova;
    });
  }

  function alternarTamanho(id: string) {
    setResultado(null);
    setMedidas(({ [id]: existente, ...resto }) =>
      existente ? resto : { ...resto, [id]: { comprimento: "", largura: "", manga: "" } },
    );
  }

  function mudarMedida(id: string, campo: keyof Medida, valor: string) {
    setResultado(null);
    setMedidas((atual) => ({ ...atual, [id]: { ...atual[id], [campo]: valor } }));
  }

  function salvar() {
    iniciar(async () => {
      const r = await salvarCoresETamanhos(modeloId, {
        cores: [...marcadas],
        // Na ordem dos tamanhos, para a mensagem de erro apontar o primeiro.
        medidas: tamanhos.filter((t) => medidas[t.id]).map((t) => ({ tamanhoId: t.id, ...medidas[t.id] })),
      });
      setResultado(r.ok ? { tipo: "sucesso", texto: r.mensagem ?? "Salvo." } : { tipo: "erro", texto: r.erro });
    });
  }

  return (
    <div className="space-y-6">
      <fieldset>
        <legend className="text-[16px] font-semibold">Cores deste modelo</legend>
        <div className="mt-3 flex flex-wrap gap-2">
          {cores.map((cor) => {
            const marcada = marcadas.has(cor.id);
            return (
              <button
                key={cor.id}
                type="button"
                aria-pressed={marcada}
                onClick={() => alternarCor(cor.id)}
                className={`flex min-h-12 items-center gap-2 rounded-full border px-4 text-[15px] font-semibold ${marcada ? "border-tinta bg-tinta text-papel" : "border-borda text-secundario hover:border-tinta"}`}
              >
                <span aria-hidden="true" className="size-5 rounded-full border border-borda" style={{ backgroundColor: cor.hex }} />
                {cor.nome}
                {marcada && <Check aria-hidden="true" className="size-4" strokeWidth={2.5} />}
              </button>
            );
          })}
        </div>
      </fieldset>

      <fieldset>
        <legend className="text-[16px] font-semibold">Tamanhos e tabela de medidas</legend>
        <p className="mt-1 text-[14px] text-apoio">
          Toque nos tamanhos deste modelo e preencha as medidas da peça em centímetros (pode usar meio centímetro, como
          11,5). A loja mostra essa tabela na página dos produtos.
        </p>
        <div className="mt-3 flex flex-wrap gap-2" role="group" aria-label="Tamanhos deste modelo">
          {tamanhos.map((t) => {
            const marcado = !!medidas[t.id];
            return (
              <button
                key={t.id}
                type="button"
                aria-pressed={marcado}
                onClick={() => alternarTamanho(t.id)}
                className={`flex min-h-12 min-w-14 items-center justify-center gap-1 rounded-xl border px-3 text-[16px] font-bold ${marcado ? "border-tinta bg-tinta text-papel" : "border-borda text-secundario hover:border-tinta"}`}
              >
                {marcado && <Check aria-hidden="true" className="size-4" strokeWidth={2.5} />}
                {t.nome}
              </button>
            );
          })}
        </div>

        <div className="mt-4 space-y-3">
          {tamanhos
            .filter((t) => medidas[t.id])
            .map((t) => (
              <div key={t.id} className="rounded-xl bg-fundo p-3">
                <p className="text-[15px] font-bold">Tamanho {t.nome}</p>
                <div className="grid grid-cols-3 gap-3">
                  {(
                    [
                      ["comprimento", "Comprimento"],
                      ["largura", "Largura"],
                      ["manga", "Manga"],
                    ] as const
                  ).map(([campo, rotulo]) => (
                    <label key={campo} className="block">
                      <span className="block text-[13px]">{rotulo} (cm)</span>
                      <input
                        inputMode="decimal"
                        value={medidas[t.id][campo]}
                        onChange={(e) => mudarMedida(t.id, campo, e.target.value)}
                        className={classeDoCampo}
                      />
                    </label>
                  ))}
                </div>
              </div>
            ))}
        </div>
      </fieldset>

      {resultado && <Aviso tipo={resultado.tipo}>{resultado.texto}</Aviso>}
      <button type="button" onClick={salvar} disabled={salvando} className={`${classesBotao("secundario")} w-full sm:w-auto`}>
        {salvando ? "Salvando…" : "Salvar cores, tamanhos e medidas"}
      </button>

      <div className="grid gap-4 border-t border-borda pt-6 sm:grid-cols-2">
        <NovaCor />
        <NovoTamanho />
      </div>
    </div>
  );
}
