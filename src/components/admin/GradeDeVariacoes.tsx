"use client";

import { Check, Plus } from "lucide-react";
import { useState, useTransition, type FormEvent } from "react";

import { criarCor, criarTamanho, salvarVariacoes } from "@/app/admin/produtos/acoes";
import { Aviso } from "@/components/formulario/Aviso";
import { classesBotao } from "@/components/ui/Botao";
import { centavosParaTexto, formatarPreco } from "@/lib/formatacao";

type Cor = { id: string; nome: string; hex: string };
type Tamanho = { id: string; nome: string };
type Variacao = { corId: string; tamanhoId: string; ativo: boolean; precoEmCentavos: number | null; estoque: number };
type Escolha = { aVenda: boolean; preco: string };

const chave = (corId: string, tamanhoId: string) => `${corId}:${tamanhoId}`;

export function GradeDeVariacoes({
  produtoId,
  precoBase,
  cores,
  tamanhos,
  variacoes,
}: {
  produtoId: string;
  precoBase: number;
  cores: Cor[];
  tamanhos: Tamanho[];
  variacoes: Variacao[];
}) {
  const salvas = new Map(variacoes.map((v) => [chave(v.corId, v.tamanhoId), v]));
  // Só guarda o que mudou; o resto vem do banco (assim cor ou tamanho novo
  // aparece sem perder o que já foi marcado).
  const [mudancas, setMudancas] = useState<Record<string, Escolha>>({});
  const [resultado, setResultado] = useState<{ tipo: "erro" | "sucesso"; texto: string } | null>(null);
  const [salvando, iniciar] = useTransition();

  function escolha(corId: string, tamanhoId: string): Escolha {
    const k = chave(corId, tamanhoId);
    if (mudancas[k]) return mudancas[k];
    const v = salvas.get(k);
    return { aVenda: !!v?.ativo, preco: v?.precoEmCentavos ? centavosParaTexto(v.precoEmCentavos) : "" };
  }

  function mudar(corId: string, tamanhoId: string, parcial: Partial<Escolha>) {
    setResultado(null);
    setMudancas((m) => ({ ...m, [chave(corId, tamanhoId)]: { ...escolha(corId, tamanhoId), ...parcial } }));
  }

  function salvar() {
    const chaves = new Set([...salvas.keys(), ...Object.keys(mudancas)]);
    const combinacoes = [...chaves].map((k) => {
      const [corId, tamanhoId] = k.split(":");
      const e = escolha(corId, tamanhoId);
      return { corId, tamanhoId, aVenda: e.aVenda, precoProprio: e.preco };
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
        Toque nos tamanhos que você vende em cada cor. Tamanho novo começa com estoque 0: ele só aparece como
        disponível depois que você lançar as peças em “Lançar estoque deste produto”, no alto da página.
      </p>

      {cores.map((cor) => {
        const marcados = tamanhos.filter((t) => escolha(cor.id, t.id).aVenda);
        const comPrecoProprio = marcados.some((t) => escolha(cor.id, t.id).preco);
        return (
          <section key={cor.id} className="rounded-xl border border-borda p-4">
            <h3 className="flex items-center gap-3 text-[16px] font-semibold">
              <span aria-hidden="true" className="size-6 rounded-full border border-borda" style={{ backgroundColor: cor.hex }} />
              {cor.nome}
              <span className="ml-auto text-[14px] font-normal text-secundario">
                {marcados.length === 0 ? "não vende" : marcados.length === 1 ? "1 tamanho" : `${marcados.length} tamanhos`}
              </span>
            </h3>
            <div className="mt-3 flex flex-wrap gap-2" role="group" aria-label={`Tamanhos à venda na cor ${cor.nome}`}>
              {tamanhos.map((t) => {
                const e = escolha(cor.id, t.id);
                const estoque = salvas.get(chave(cor.id, t.id))?.estoque;
                return (
                  <button
                    key={t.id}
                    type="button"
                    aria-pressed={e.aVenda}
                    onClick={() => mudar(cor.id, t.id, { aVenda: !e.aVenda })}
                    className={`flex min-h-12 min-w-16 flex-col items-center justify-center rounded-xl border px-3 text-[16px] font-bold ${e.aVenda ? "border-tinta bg-tinta text-papel" : "border-borda text-secundario hover:border-tinta"}`}
                  >
                    <span className="flex items-center gap-1">
                      {e.aVenda && <Check aria-hidden="true" className="size-4" strokeWidth={2.5} />}
                      {t.nome}
                    </span>
                    {e.aVenda && estoque !== undefined && (
                      <span className="text-[11px] font-normal">{estoque} em estoque</span>
                    )}
                  </button>
                );
              })}
            </div>

            {marcados.length > 0 && (
              <details className="mt-3" open={comPrecoProprio}>
                <summary className="flex min-h-11 cursor-pointer items-center text-[14px] font-semibold">
                  Algum tamanho com preço diferente?
                </summary>
                <p className="text-[13px] text-secundario">
                  Em branco, vale o preço do produto ({formatarPreco(precoBase)}).
                </p>
                <div className="mt-2 grid grid-cols-2 gap-3 sm:grid-cols-4">
                  {marcados.map((t) => (
                    <label key={t.id} className="block">
                      <span className="block text-[14px] font-semibold">{t.nome} (R$)</span>
                      <input
                        inputMode="decimal"
                        placeholder={centavosParaTexto(precoBase)}
                        value={escolha(cor.id, t.id).preco}
                        onChange={(ev) => mudar(cor.id, t.id, { preco: ev.target.value })}
                        className="mt-1 h-12 w-full rounded-xl border border-borda bg-papel px-3 text-[16px] outline-none focus:border-tinta"
                      />
                    </label>
                  ))}
                </div>
              </details>
            )}
          </section>
        );
      })}

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

      <div className="grid gap-4 border-t border-borda pt-6 sm:grid-cols-2">
        <NovaCor />
        <NovoTamanho />
      </div>
    </div>
  );
}

function useAcaoSimples() {
  const [resultado, setResultado] = useState<{ tipo: "erro" | "sucesso"; texto: string } | null>(null);
  const [enviando, iniciar] = useTransition();
  return { resultado, setResultado, enviando, iniciar };
}

function NovaCor() {
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

function NovoTamanho() {
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
