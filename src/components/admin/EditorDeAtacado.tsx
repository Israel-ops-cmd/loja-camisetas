"use client";

import { Plus, X } from "lucide-react";
import { useState, useTransition } from "react";

import { salvarTabelaDeAtacado } from "@/app/admin/atacado/acoes";
import { Aviso } from "@/components/formulario/Aviso";
import { classesBotao } from "@/components/ui/Botao";
import { descreverFaixa, LIMITES_DA_TABELA, precoComDesconto } from "@/lib/atacado-regras";
import { formatarPreco } from "@/lib/formatacao";

type Linha = { chave: number; minimo: string; percentual: string };

const classeCampo =
  "h-12 w-20 rounded-xl border bg-papel px-3 text-center text-[18px] font-bold outline-none focus:border-tinta";
const numero = (texto: string) => (texto.trim() === "" ? Number.NaN : Number(texto));

export function EditorDeAtacado({
  ligado: ligadoInicial,
  faixas,
  precoDeExemplo,
}: {
  ligado: boolean;
  faixas: { minimoDePecas: number; percentual: number }[];
  /** Preço de uma peça para mostrar o exemplo em reais. */
  precoDeExemplo: number;
}) {
  const [ligado, setLigado] = useState(ligadoInicial);
  const [linhas, setLinhas] = useState<Linha[]>(() =>
    faixas.map((f, i) => ({ chave: i, minimo: String(f.minimoDePecas), percentual: String(f.percentual) })),
  );
  const [proximaChave, setProximaChave] = useState(faixas.length);
  const [resultado, setResultado] = useState<{ tipo: "erro" | "sucesso"; texto: string; linha?: number } | null>(null);
  const [salvando, iniciar] = useTransition();

  function mudar(chave: number, campo: "minimo" | "percentual", valor: string) {
    setResultado(null);
    setLinhas((ls) => ls.map((l) => (l.chave === chave ? { ...l, [campo]: valor.replace(/\D/g, "") } : l)));
  }

  function adicionar() {
    setResultado(null);
    const ultima = linhas.at(-1);
    const sugestao = ultima
      ? { minimo: String((numero(ultima.minimo) || 0) * 2 || ""), percentual: String((numero(ultima.percentual) || 0) + 5) }
      : { minimo: "10", percentual: "5" };
    setLinhas((ls) => [...ls, { chave: proximaChave, ...sugestao }]);
    setProximaChave((c) => c + 1);
  }

  function salvar() {
    iniciar(async () => {
      const r = await salvarTabelaDeAtacado({
        ligado,
        faixas: linhas.map((l) => ({ minimoDePecas: numero(l.minimo), percentual: numero(l.percentual) })),
      });
      setResultado(r.ok ? { tipo: "sucesso", texto: r.mensagem } : { tipo: "erro", texto: r.erro, linha: r.linha });
    });
  }

  // Prévia na ordem em que o cliente vê (só linhas completas).
  const previa = linhas
    .map((l) => ({ minimoDePecas: numero(l.minimo), percentual: numero(l.percentual) }))
    .filter((f) => Number.isInteger(f.minimoDePecas) && Number.isInteger(f.percentual) && f.percentual > 0)
    .sort((a, b) => a.minimoDePecas - b.minimoDePecas);

  return (
    <div className="space-y-6">
      <label className="flex min-h-14 cursor-pointer items-start gap-4 rounded-xl border border-borda px-4 py-3 hover:border-tinta">
        <input
          type="checkbox"
          checked={ligado}
          onChange={(e) => {
            setLigado(e.target.checked);
            setResultado(null);
          }}
          className="mt-0.5 size-6 shrink-0 accent-tinta"
        />
        <span>
          <span className="block text-[16px] font-semibold">Desconto de atacado ligado</span>
          <span className="block text-[14px] text-secundario">
            {ligado
              ? "O carrinho dá o desconto automaticamente quando o cliente junta as peças da tabela."
              : "Desligado: ninguém recebe desconto e a tabela some da loja. As faixas ficam guardadas."}
          </span>
        </span>
      </label>

      <div>
        <p className="text-[15px] font-semibold">Faixas de desconto</p>
        <p className="mt-1 text-[14px] text-secundario">
          Conta o total de peças do carrinho, somando produtos diferentes. Vale a maior faixa alcançada.
        </p>
        {linhas.length === 0 ? (
          <p className="mt-4 text-[15px] text-apoio">Nenhuma faixa. Toque em “Adicionar faixa”.</p>
        ) : (
          <ol className="mt-4 space-y-3">
            {linhas.map((l, i) => (
              <li
                key={l.chave}
                className={`flex flex-wrap items-center gap-x-3 gap-y-2 rounded-xl border p-3 text-[16px] ${resultado?.tipo === "erro" && resultado.linha === i ? "border-tinta" : "border-borda"}`}
              >
                <span className="w-full text-[13px] font-semibold text-secundario sm:w-auto">Faixa {i + 1}</span>
                <label className="flex items-center gap-2">
                  A partir de
                  <input
                    inputMode="numeric"
                    aria-label={`Faixa ${i + 1}: a partir de quantas peças`}
                    value={l.minimo}
                    onChange={(e) => mudar(l.chave, "minimo", e.target.value)}
                    className={`${classeCampo} border-borda`}
                  />
                  peças
                </label>
                <label className="flex items-center gap-2">
                  <input
                    inputMode="numeric"
                    aria-label={`Faixa ${i + 1}: percentual de desconto`}
                    value={l.percentual}
                    onChange={(e) => mudar(l.chave, "percentual", e.target.value)}
                    className={`${classeCampo} border-borda`}
                  />
                  % de desconto
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setResultado(null);
                    setLinhas((ls) => ls.filter((x) => x.chave !== l.chave));
                  }}
                  className="ml-auto inline-flex min-h-11 items-center gap-1 rounded-full px-3 text-[14px] font-semibold hover:bg-fundo"
                >
                  <X aria-hidden="true" className="size-4" strokeWidth={2} />
                  Remover
                </button>
              </li>
            ))}
          </ol>
        )}
        {linhas.length < LIMITES_DA_TABELA.faixas && (
          <button
            type="button"
            onClick={adicionar}
            className="mt-3 inline-flex min-h-12 items-center gap-2 rounded-full border border-tinta px-6 text-[15px] font-semibold hover:bg-fundo"
          >
            <Plus aria-hidden="true" className="size-4" strokeWidth={2} />
            Adicionar faixa
          </button>
        )}
      </div>

      <div className="rounded-xl bg-fundo p-4">
        <p className="text-[15px] font-semibold">Como o cliente vê</p>
        {!ligado || previa.length === 0 ? (
          <p className="mt-2 text-[15px] text-apoio">Sem desconto de atacado.</p>
        ) : (
          <ul className="mt-2 space-y-1 text-[15px]">
            {previa.map((f, i) => (
              <li key={`${f.minimoDePecas}-${i}`}>
                <strong>{descreverFaixa(f, previa[i + 1])}</strong>: {f.percentual}% de desconto
                {f.percentual <= LIMITES_DA_TABELA.percentual.maximo && (
                  <span className="text-secundario">
                    {" "}
                    (peça de {formatarPreco(precoDeExemplo)} sai por{" "}
                    {formatarPreco(precoComDesconto(precoDeExemplo, f.percentual))})
                  </span>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>

      {resultado && <Aviso tipo={resultado.tipo}>{resultado.texto}</Aviso>}
      <button type="button" onClick={salvar} disabled={salvando} className={`${classesBotao("secundario")} w-full sm:w-auto`}>
        {salvando ? "Salvando…" : "Salvar tabela"}
      </button>
    </div>
  );
}
