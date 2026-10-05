"use client";

import { Check } from "lucide-react";
import { useState, useTransition, type FormEvent, type ReactNode } from "react";

import { enviarPersonalizacao, prepararEnvioDeArte } from "@/app/personalizacao/acoes";
import { Aviso } from "@/components/formulario/Aviso";
import {
  EnvioDeArquivos,
  type ArquivoEnviado,
} from "@/components/personalizacao/EnvioDeArquivos";
import { IlustracaoCamiseta } from "@/components/personalizacao/IlustracaoCamiseta";
import { classesBotao } from "@/components/ui/Botao";
import { SeletorQuantidade } from "@/components/ui/SeletorQuantidade";
import type { PosicaoEstampa } from "@/generated/prisma/enums";
import type { PecaPersonalizavel } from "@/lib/personalizacao";
import {
  FORMATOS_DE_ARTE,
  MAXIMO_DE_ARQUIVOS,
  ordemDasPosicoes,
  QUANTIDADE_MAXIMA_POR_TAMANHO,
  rotulosDePosicao,
} from "@/lib/personalizacao-regras";

export function FormularioPersonalizacao({
  pecas,
  hoje,
}: {
  pecas: PecaPersonalizavel[];
  /** Data de hoje (AAAA-MM-DD), para o mínimo do prazo desejado. */
  hoje: string;
}) {
  const [produtoId, setProdutoId] = useState(pecas[0].id);
  const peca = pecas.find((p) => p.id === produtoId) ?? pecas[0];
  const [corId, setCorId] = useState(peca.cores[0]?.id ?? "");
  const [quantidades, setQuantidades] = useState<Record<string, number>>({});
  const [posicoes, setPosicoes] = useState<PosicaoEstampa[]>(["COSTAS"]);
  const [arquivos, setArquivos] = useState<ArquivoEnviado[]>([]);
  const [descricao, setDescricao] = useState("");
  const [prazo, setPrazo] = useState("");
  const [enviandoArquivo, setEnviandoArquivo] = useState(false);
  const [erros, setErros] = useState<Record<string, string>>({});
  const [erroGeral, setErroGeral] = useState<string | null>(null);
  const [enviando, iniciar] = useTransition();

  const cor = peca.cores.find((c) => c.id === corId) ?? peca.cores[0];
  const total = peca.tamanhos.reduce((t, tam) => t + (quantidades[tam.id] ?? 0), 0);

  function escolherPeca(id: string) {
    const nova = pecas.find((p) => p.id === id)!;
    setProdutoId(id);
    setCorId(nova.cores.find((c) => c.id === corId)?.id ?? nova.cores[0]?.id ?? "");
    setQuantidades({});
  }

  function alternarPosicao(posicao: PosicaoEstampa) {
    setPosicoes((atuais) =>
      atuais.includes(posicao) ? atuais.filter((p) => p !== posicao) : [...atuais, posicao],
    );
  }

  function enviar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    setErroGeral(null);
    setErros({});
    iniciar(async () => {
      // Em caso de sucesso, a ação leva para a página do pedido.
      const resultado = await enviarPersonalizacao({
        produtoId,
        corId: cor.id,
        quantidades: Object.fromEntries(
          peca.tamanhos.map((t) => [t.id, quantidades[t.id] ?? 0]),
        ),
        posicoes,
        descricao: descricao || undefined,
        prazoDesejado: prazo || undefined,
        arquivos: arquivos.map(({ caminho, nome }) => ({ caminho, nome })),
      });
      if (!resultado) return;
      setErroGeral(resultado.erro);
      setErros(resultado.campos ?? {});
    });
  }

  return (
    <form onSubmit={enviar} noValidate className="grid gap-10 lg:grid-cols-[1fr_400px] lg:items-start">
      <div className="space-y-6">
        <Bloco numero="01" titulo="Escolha a peça">
          {pecas.length > 1 && (
            <fieldset className="mb-6">
              <legend className="text-[14px] font-semibold">Peça</legend>
              <div className="mt-2 flex flex-wrap gap-2">
                {pecas.map((p) => (
                  <label
                    key={p.id}
                    className={`flex min-h-12 cursor-pointer items-center rounded-full border px-5 text-[14px] font-semibold ${p.id === produtoId ? "border-tinta bg-tinta text-papel" : "border-borda hover:border-tinta"}`}
                  >
                    <input
                      type="radio"
                      name="peca"
                      checked={p.id === produtoId}
                      onChange={() => escolherPeca(p.id)}
                      className="sr-only"
                    />
                    {p.nome}
                  </label>
                ))}
              </div>
            </fieldset>
          )}

          <fieldset>
            <legend className="text-[14px] font-semibold">
              Cor <span className="font-normal text-apoio">· {cor?.nome}</span>
            </legend>
            <div className="mt-2 flex flex-wrap gap-2">
              {peca.cores.map((c) => (
                <label key={c.id} title={c.nome} className="flex size-11 cursor-pointer items-center justify-center rounded-lg">
                  <input
                    type="radio"
                    name="cor"
                    checked={c.id === cor?.id}
                    onChange={() => setCorId(c.id)}
                    className="sr-only"
                    aria-label={c.nome}
                  />
                  <span
                    className={`size-8 rounded-md border ${c.id === cor?.id ? "border-tinta ring-2 ring-tinta ring-offset-2" : "border-borda"}`}
                    style={{ backgroundColor: c.hex }}
                  />
                </label>
              ))}
            </div>
          </fieldset>

          <fieldset className="mt-6">
            <legend className="text-[14px] font-semibold">Quantidade por tamanho</legend>
            <ul className="mt-2 divide-y divide-borda">
              {peca.tamanhos.map((tamanho) => (
                <li key={tamanho.id} className="flex items-center justify-between gap-4 py-2">
                  <span className="w-12 text-[15px] font-bold">{tamanho.nome}</span>
                  <SeletorQuantidade
                    valor={quantidades[tamanho.id] ?? 0}
                    minimo={0}
                    maximo={QUANTIDADE_MAXIMA_POR_TAMANHO}
                    aoMudar={(valor) => setQuantidades((q) => ({ ...q, [tamanho.id]: valor }))}
                    rotulo={`Quantidade no tamanho ${tamanho.nome}`}
                  />
                </li>
              ))}
            </ul>
            <p className="mt-2 text-[14px] text-apoio">
              Total: <strong className="text-tinta">{total === 1 ? "1 peça" : `${total} peças`}</strong>
            </p>
            {erros.quantidades && <p className="mt-1 text-[13px] font-semibold">{erros.quantidades}</p>}
          </fieldset>

          <fieldset className="mt-6">
            <legend className="text-[14px] font-semibold">Onde vai a estampa</legend>
            <div className="mt-2 grid gap-2 sm:grid-cols-3">
              {ordemDasPosicoes.map((posicao) => {
                const marcada = posicoes.includes(posicao);
                return (
                  <label
                    key={posicao}
                    className={`relative flex min-h-16 cursor-pointer flex-col rounded-xl border px-4 py-3 ${marcada ? "border-tinta" : "border-borda hover:border-secundario"}`}
                  >
                    <input
                      type="checkbox"
                      checked={marcada}
                      onChange={() => alternarPosicao(posicao)}
                      className="sr-only"
                    />
                    <span className="flex items-center justify-between gap-2 text-[14px] font-semibold">
                      {rotulosDePosicao[posicao].titulo}
                      <span
                        aria-hidden="true"
                        className={`flex size-5 items-center justify-center rounded border ${marcada ? "border-tinta bg-tinta text-papel" : "border-borda"}`}
                      >
                        {marcada && <Check className="size-3.5" strokeWidth={2.5} />}
                      </span>
                    </span>
                    <span className="mt-1 text-[13px] text-apoio">{rotulosDePosicao[posicao].detalhe}</span>
                  </label>
                );
              })}
            </div>
            {erros.posicoes && <p className="mt-1 text-[13px] font-semibold">{erros.posicoes}</p>}
          </fieldset>
        </Bloco>

        <Bloco numero="02" titulo="Envie a sua arte">
          <EnvioDeArquivos
            preparar={prepararEnvioDeArte}
            formatos={FORMATOS_DE_ARTE}
            maximo={MAXIMO_DE_ARQUIVOS}
            arquivos={arquivos}
            aoMudar={setArquivos}
            aoEnviar={setEnviandoArquivo}
            rotulo="Arquivos da estampa"
            ajuda={`Até ${MAXIMO_DE_ARQUIVOS} arquivos de até 20 MB: PNG, JPG, SVG, PDF, CDR, AI ou PSD. Não tem a arte pronta? Descreva a ideia abaixo.`}
            erro={erros.arquivos}
          />

          <div className="mt-6">
            <label htmlFor="descricao" className="block text-[14px] font-semibold">
              Ideia, textos e observações
            </label>
            <textarea
              id="descricao"
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              rows={5}
              maxLength={2000}
              placeholder="Ex.: logo da igreja nas costas, nome do evento embaixo, letras brancas."
              aria-invalid={erros.descricao ? true : undefined}
              className={`mt-2 w-full rounded-xl border bg-papel px-4 py-3 text-[16px] outline-none focus:border-tinta ${erros.descricao ? "border-tinta" : "border-borda"}`}
            />
            {erros.descricao && <p className="mt-1 text-[13px] font-semibold">{erros.descricao}</p>}
          </div>

          <div className="mt-6 max-w-xs">
            <label htmlFor="prazo" className="block text-[14px] font-semibold">
              Precisa até quando? (opcional)
            </label>
            <input
              id="prazo"
              type="date"
              min={hoje}
              value={prazo}
              onChange={(e) => setPrazo(e.target.value)}
              className="mt-2 h-12 w-full rounded-xl border border-borda bg-papel px-4 text-[16px] outline-none focus:border-tinta"
            />
            {erros.prazoDesejado && <p className="mt-1 text-[13px] font-semibold">{erros.prazoDesejado}</p>}
          </div>
        </Bloco>
      </div>

      <section aria-labelledby="titulo-revisao" className="space-y-5 lg:sticky lg:top-24">
        <IlustracaoCamiseta hex={cor?.hex} posicoes={posicoes} />
        <div className="rounded-[20px] bg-papel p-6">
          <h2 id="titulo-revisao" className="sobretitulo">
            03 · Aprove e receba
          </h2>
          <p className="mt-3 text-[15px] text-apoio">
            A gente prepara a prévia da estampa e o preço. Você só paga depois de aprovar.
          </p>
          {erroGeral && (
            <div className="mt-4">
              <Aviso tipo="erro">{erroGeral}</Aviso>
            </div>
          )}
          <button
            type="submit"
            disabled={enviando || enviandoArquivo}
            className={`${classesBotao("principal")} mt-5 w-full`}
          >
            {enviando ? "Enviando…" : enviandoArquivo ? "Aguarde o arquivo…" : "Enviar pedido"}
          </button>
        </div>
      </section>
    </form>
  );
}

function Bloco({ numero, titulo, children }: { numero: string; titulo: string; children: ReactNode }) {
  return (
    <section className="rounded-[20px] bg-papel p-6 sm:p-8">
      <h2 className="flex items-baseline gap-3 font-titulo text-[20px] font-bold uppercase">
        <span className="font-black text-secundario">{numero}</span>
        {titulo}
      </h2>
      <div className="mt-5">{children}</div>
    </section>
  );
}
