"use client";

import Link from "next/link";
import { Check } from "lucide-react";
import { useState, useTransition } from "react";

import { salvarVariacoes } from "@/app/admin/produtos/acoes";
import { Aviso } from "@/components/formulario/Aviso";
import { classesBotao } from "@/components/ui/Botao";
import { centavosParaTexto, formatarPreco } from "@/lib/formatacao";

type Cor = { id: string; nome: string; hex: string };
type Tamanho = { id: string; nome: string };
type Modelo = { id: string; nome: string; ativo: boolean; cores: Cor[]; tamanhos: Tamanho[] };
type Variacao = {
  modeloId: string;
  corId: string;
  tamanhoId: string;
  ativo: boolean;
  precoEmCentavos: number | null;
  estoque: number;
};
type Escolha = { aVenda: boolean; preco: string };

const chave = (modeloId: string, corId: string, tamanhoId: string) => `${modeloId}:${corId}:${tamanhoId}`;

export function GradeDeVariacoes({
  produtoId,
  precoBase,
  modelos,
  variacoes,
}: {
  produtoId: string;
  precoBase: number;
  /** Cores e tamanhos de cada modelo (cadastrados em Modelos). */
  modelos: Modelo[];
  variacoes: Variacao[];
}) {
  const salvas = new Map(variacoes.map((v) => [chave(v.modeloId, v.corId, v.tamanhoId), v]));
  // Só guarda o que mudou; o resto vem do banco.
  const [mudancas, setMudancas] = useState<Record<string, Escolha>>({});
  const [resultado, setResultado] = useState<{ tipo: "erro" | "sucesso"; texto: string } | null>(null);
  const [salvando, iniciar] = useTransition();

  function escolha(k: string): Escolha {
    if (mudancas[k]) return mudancas[k];
    const v = salvas.get(k);
    return { aVenda: !!v?.ativo, preco: v?.precoEmCentavos ? centavosParaTexto(v.precoEmCentavos) : "" };
  }

  function mudar(k: string, parcial: Partial<Escolha>) {
    setResultado(null);
    setMudancas((m) => ({ ...m, [k]: { ...escolha(k), ...parcial } }));
  }

  function salvar() {
    const chaves = new Set([...salvas.keys(), ...Object.keys(mudancas)]);
    const combinacoes = [...chaves].map((k) => {
      const [modeloId, corId, tamanhoId] = k.split(":");
      const e = escolha(k);
      return { modeloId, corId, tamanhoId, aVenda: e.aVenda, precoProprio: e.preco };
    });
    iniciar(async () => {
      const r = await salvarVariacoes(produtoId, { combinacoes });
      if (r.ok) {
        setMudancas({});
        setResultado({ tipo: "sucesso", texto: r.mensagem ?? "Salvo." });
      } else {
        setResultado({ tipo: "erro", texto: r.erro });
      }
    });
  }

  const temMudancas = Object.keys(mudancas).length > 0;

  return (
    <div className="space-y-4">
      <p className="text-[15px] text-apoio">
        Abra cada modelo e toque nos tamanhos que você vende em cada cor. Tamanho novo começa com estoque 0: ele só
        aparece como disponível depois que você lançar as peças em “Lançar estoque deste produto”, no alto da página.
      </p>

      {modelos.map((modelo) => {
        const doModelo = modelo.cores.flatMap((cor) =>
          modelo.tamanhos.filter((t) => escolha(chave(modelo.id, cor.id, t.id)).aVenda),
        ).length;
        return (
          <details key={modelo.id} open={doModelo > 0} className="rounded-xl border border-borda">
            <summary className="flex min-h-14 cursor-pointer items-center gap-3 px-4 text-[17px] font-semibold">
              {modelo.nome}
              {!modelo.ativo && <span className="text-[13px] font-normal text-secundario">(modelo desligado)</span>}
              <span className="ml-auto text-[14px] font-normal text-secundario">
                {doModelo === 0 ? "não vende" : doModelo === 1 ? "1 combinação" : `${doModelo} combinações`}
              </span>
            </summary>
            <div className="space-y-3 border-t border-borda p-4">
              {modelo.cores.length === 0 || modelo.tamanhos.length === 0 ? (
                <p className="text-[15px] text-apoio">
                  Este modelo ainda não tem cores e tamanhos.{" "}
                  <Link href={`/admin/modelos/${modelo.id}`} className="font-semibold underline underline-offset-4">
                    Cadastrar no modelo
                  </Link>
                </p>
              ) : (
                modelo.cores.map((cor) => (
                  <GradeDaCor
                    key={cor.id}
                    modelo={modelo}
                    cor={cor}
                    precoBase={precoBase}
                    escolha={escolha}
                    mudar={mudar}
                    estoque={(k) => salvas.get(k)?.estoque}
                  />
                ))
              )}
            </div>
          </details>
        );
      })}

      <p className="text-[14px] text-secundario">
        Falta uma cor ou um tamanho? Eles são cadastrados em{" "}
        <Link href="/admin/modelos" className="font-semibold underline underline-offset-4">
          Modelos
        </Link>
        , junto com a tabela de medidas.
      </p>

      {resultado && <Aviso tipo={resultado.tipo}>{resultado.texto}</Aviso>}
      {temMudancas && !resultado && (
        <p className="text-[14px] font-semibold">Você mudou cores ou tamanhos. Toque em salvar para valer na loja.</p>
      )}
      <button
        type="button"
        onClick={salvar}
        disabled={salvando}
        className={`${classesBotao("secundario")} w-full sm:w-auto`}
      >
        {salvando ? "Salvando…" : "Salvar cores e tamanhos"}
      </button>
    </div>
  );
}

function GradeDaCor({
  modelo,
  cor,
  precoBase,
  escolha,
  mudar,
  estoque,
}: {
  modelo: Modelo;
  cor: Cor;
  precoBase: number;
  escolha: (k: string) => Escolha;
  mudar: (k: string, parcial: Partial<Escolha>) => void;
  estoque: (k: string) => number | undefined;
}) {
  const k = (tamanhoId: string) => chave(modelo.id, cor.id, tamanhoId);
  const marcados = modelo.tamanhos.filter((t) => escolha(k(t.id)).aVenda);
  const comPrecoProprio = marcados.some((t) => escolha(k(t.id)).preco);

  return (
    <section className="rounded-xl bg-fundo p-4">
      <h3 className="flex items-center gap-3 text-[16px] font-semibold">
        <span aria-hidden="true" className="size-6 rounded-full border border-borda" style={{ backgroundColor: cor.hex }} />
        {cor.nome}
        <span className="ml-auto text-[14px] font-normal text-secundario">
          {marcados.length === 0 ? "não vende" : marcados.length === 1 ? "1 tamanho" : `${marcados.length} tamanhos`}
        </span>
      </h3>
      <div
        className="mt-3 flex flex-wrap gap-2"
        role="group"
        aria-label={`Tamanhos à venda no modelo ${modelo.nome}, cor ${cor.nome}`}
      >
        {modelo.tamanhos.map((t) => {
          const e = escolha(k(t.id));
          const pecas = estoque(k(t.id));
          return (
            <button
              key={t.id}
              type="button"
              aria-pressed={e.aVenda}
              onClick={() => mudar(k(t.id), { aVenda: !e.aVenda })}
              className={`flex min-h-12 min-w-16 flex-col items-center justify-center rounded-xl border px-3 text-[16px] font-bold ${e.aVenda ? "border-tinta bg-tinta text-papel" : "border-borda bg-papel text-secundario hover:border-tinta"}`}
            >
              <span className="flex items-center gap-1">
                {e.aVenda && <Check aria-hidden="true" className="size-4" strokeWidth={2.5} />}
                {t.nome}
              </span>
              {e.aVenda && pecas !== undefined && <span className="text-[11px] font-normal">{pecas} em estoque</span>}
            </button>
          );
        })}
      </div>

      {marcados.length > 0 && (
        <details className="mt-3" open={comPrecoProprio}>
          <summary className="flex min-h-11 cursor-pointer items-center text-[14px] font-semibold">
            Algum tamanho com preço diferente?
          </summary>
          <p className="text-[13px] text-secundario">Em branco, vale o preço do produto ({formatarPreco(precoBase)}).</p>
          <div className="mt-2 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {marcados.map((t) => (
              <label key={t.id} className="block">
                <span className="block text-[14px] font-semibold">{t.nome} (R$)</span>
                <input
                  inputMode="decimal"
                  placeholder={centavosParaTexto(precoBase)}
                  value={escolha(k(t.id)).preco}
                  onChange={(ev) => mudar(k(t.id), { preco: ev.target.value })}
                  className="mt-1 h-12 w-full rounded-xl border border-borda bg-papel px-3 text-[16px] outline-none focus:border-tinta"
                />
              </label>
            ))}
          </div>
        </details>
      )}
    </section>
  );
}
