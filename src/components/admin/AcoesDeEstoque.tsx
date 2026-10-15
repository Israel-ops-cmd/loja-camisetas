"use client";

import Link from "next/link";
import { History, PackagePlus, ClipboardCheck, Stamp } from "lucide-react";
import { useState, useTransition, type FormEvent } from "react";

import { corrigirContagem, estamparPecas, lancarEntrada, type PecaDoEstoque } from "@/app/admin/estoque/acoes";
import { Aviso } from "@/components/formulario/Aviso";
import {
  descreverEstoque,
  MOTIVOS_DE_CORRECAO,
  situacaoDoEstoque,
  type MotivoDeCorrecao,
} from "@/lib/estoque-regras";

type Props = {
  /** Peça lisa (modelo + cor + tamanho) ou prontas de uma arte (variação). */
  peca: PecaDoEstoque;
  /** Ex.: "Tradicional · Preta · M" */
  rotulo: string;
  hex: string;
  estoque: number;
  /** Peças pagas que ainda estão na loja esperando envio. */
  reservadas: number;
  /** Na página de histórico o link não aparece. */
  mostrarHistorico?: boolean;
  /** Prontas: peças lisas do mesmo modelo, cor e tamanho (para "Estampar peças"). */
  lisas?: number;
};

const classeCampo =
  "mt-1 h-14 w-full rounded-xl border border-borda bg-papel px-4 text-[20px] font-bold outline-none focus:border-tinta";
const classeBotaoGrande =
  "inline-flex min-h-12 flex-1 items-center justify-center gap-2 rounded-full px-5 text-[15px] font-bold";

const destaquePorSituacao = {
  faltando: "bg-tinta text-papel",
  esgotado: "border border-tinta",
  acabando: "border border-tinta",
  normal: "",
};

const numero = (texto: string) => (texto.trim() === "" ? Number.NaN : Number(texto));

type Formulario = "entrada" | "contagem" | "estampa";

export function AcoesDeEstoque({ peca, rotulo, hex, estoque, reservadas, mostrarHistorico = true, lisas }: Props) {
  const [aberto, setAberto] = useState<Formulario | null>(null);
  const [mensagem, setMensagem] = useState<{ tipo: "erro" | "sucesso"; texto: string } | null>(null);
  // Peça pronta é opcional (sem ela a arte usa as lisas): zero não é alarme.
  const situacao = peca.tipo === "pronta" && estoque >= 0 ? "normal" : situacaoDoEstoque(estoque);

  function abrir(qual: Formulario) {
    setMensagem(null);
    setAberto((atual) => (atual === qual ? null : qual));
  }

  return (
    <div className="py-4">
      <div className="flex items-center gap-3">
        <span aria-hidden="true" className="size-5 shrink-0 rounded-full border border-borda" style={{ backgroundColor: hex }} />
        <span className="min-w-0 flex-1 text-[16px] font-semibold">{rotulo}</span>
        <span className={`rounded-full px-3 py-1 text-[16px] font-bold ${destaquePorSituacao[situacao]}`}>
          {peca.tipo === "pronta" && estoque >= 0
            ? estoque === 1
              ? "1 pronta"
              : `${estoque} prontas`
            : descreverEstoque(estoque)}
          {situacao === "acabando" && <span className="font-normal"> · acabando</span>}
        </span>
      </div>
      {reservadas > 0 && (
        <p className="mt-1 text-[13px] text-secundario">
          Mais {reservadas === 1 ? "1 peça vendida" : `${reservadas} peças vendidas`} esperando{" "}
          {peca.tipo === "lisa" ? "envio ou estampa" : "envio"}.
        </p>
      )}

      <div className="mt-3 flex flex-wrap gap-2">
        <button
          type="button"
          aria-expanded={aberto === "entrada"}
          onClick={() => abrir("entrada")}
          className={`${classeBotaoGrande} ${aberto === "entrada" ? "bg-tinta text-papel" : "border border-tinta hover:bg-fundo"}`}
        >
          <PackagePlus aria-hidden="true" className="size-5" strokeWidth={1.8} />
          Chegaram peças
        </button>
        <button
          type="button"
          aria-expanded={aberto === "contagem"}
          onClick={() => abrir("contagem")}
          className={`${classeBotaoGrande} ${aberto === "contagem" ? "bg-tinta text-papel" : "border border-tinta hover:bg-fundo"}`}
        >
          <ClipboardCheck aria-hidden="true" className="size-5" strokeWidth={1.8} />
          Corrigir contagem
        </button>
        {lisas !== undefined && (
          <button
            type="button"
            aria-expanded={aberto === "estampa"}
            onClick={() => abrir("estampa")}
            className={`${classeBotaoGrande} ${aberto === "estampa" ? "bg-tinta text-papel" : "border border-tinta hover:bg-fundo"}`}
          >
            <Stamp aria-hidden="true" className="size-5" strokeWidth={1.8} />
            Estampar peças
          </button>
        )}
        {mostrarHistorico && (
          <Link
            href={`/admin/estoque/${peca.id}`}
            className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full px-4 text-[15px] font-semibold underline underline-offset-4"
          >
            <History aria-hidden="true" className="size-5" strokeWidth={1.8} />
            Histórico
          </Link>
        )}
      </div>

      {aberto === "entrada" && (
        <FormularioEntrada peca={peca} estoque={estoque} aoTerminar={(texto) => { setAberto(null); setMensagem({ tipo: "sucesso", texto }); }} />
      )}
      {aberto === "contagem" && (
        <FormularioContagem
          peca={peca}
          estoque={estoque}
          reservadas={reservadas}
          aoTerminar={(texto) => { setAberto(null); setMensagem({ tipo: "sucesso", texto }); }}
        />
      )}
      {aberto === "estampa" && lisas !== undefined && (
        <FormularioEstampa
          variacaoId={peca.id}
          estoque={estoque}
          lisas={lisas}
          aoTerminar={(texto) => { setAberto(null); setMensagem({ tipo: "sucesso", texto }); }}
        />
      )}
      {mensagem && (
        <div className="mt-3">
          <Aviso tipo={mensagem.tipo}>{mensagem.texto}</Aviso>
        </div>
      )}
    </div>
  );
}

function FormularioEntrada({
  peca,
  estoque,
  aoTerminar,
}: {
  peca: PecaDoEstoque;
  estoque: number;
  aoTerminar: (mensagem: string) => void;
}) {
  const [quantidade, setQuantidade] = useState("");
  const [observacao, setObservacao] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [salvando, iniciar] = useTransition();
  const chegaram = numero(quantidade);
  const previsto = Number.isInteger(chegaram) && chegaram > 0 ? estoque + chegaram : null;

  function salvar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    setErro(null);
    iniciar(async () => {
      const r = await lancarEntrada(peca, { quantidade: chegaram, observacao: observacao || undefined });
      if (r.ok) aoTerminar(r.mensagem);
      else setErro(r.erro);
    });
  }

  return (
    <form onSubmit={salvar} noValidate className="mt-3 space-y-3 rounded-xl bg-fundo p-4">
      <label className="block">
        <span className="block text-[15px] font-semibold">Quantas peças chegaram?</span>
        <input
          inputMode="numeric"
          autoFocus
          value={quantidade}
          onChange={(e) => setQuantidade(e.target.value.replace(/\D/g, ""))}
          className={classeCampo}
        />
        <span className="mt-1 block text-[13px] text-secundario">
          {previsto !== null
            ? `O estoque vai de ${estoque} para ${previsto}.`
            : "Só as peças novas deste lote. O sistema soma ao que já tem."}
        </span>
      </label>
      <label className="block">
        <span className="block text-[14px] font-semibold">Observação (opcional)</span>
        <input
          value={observacao}
          onChange={(e) => setObservacao(e.target.value)}
          maxLength={200}
          placeholder="Ex.: lote do fornecedor"
          className="mt-1 h-12 w-full rounded-xl border border-borda bg-papel px-4 text-[16px] outline-none focus:border-tinta"
        />
      </label>
      {erro && <Aviso tipo="erro">{erro}</Aviso>}
      <button type="submit" disabled={salvando} className="inline-flex min-h-12 w-full items-center justify-center rounded-full bg-tinta px-6 text-[15px] font-bold text-papel hover:bg-painel disabled:opacity-50 sm:w-auto">
        {salvando ? "Salvando…" : "Somar ao estoque"}
      </button>
    </form>
  );
}

function FormularioContagem({
  peca,
  estoque: estoqueInicial,
  reservadas,
  aoTerminar,
}: {
  peca: PecaDoEstoque;
  estoque: number;
  reservadas: number;
  aoTerminar: (mensagem: string) => void;
}) {
  // Estoque que a pessoa viu ao abrir: se mudar no meio (venda), o servidor avisa.
  const [estoqueVisto, setEstoqueVisto] = useState(estoqueInicial);
  const [contado, setContado] = useState("");
  const [motivo, setMotivo] = useState<MotivoDeCorrecao>("Contagem");
  const [observacao, setObservacao] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [salvando, iniciar] = useTransition();
  const naPrateleira = numero(contado);
  const valido = Number.isInteger(naPrateleira) && naPrateleira >= 0;
  const novo = valido ? naPrateleira - reservadas : null;

  function salvar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    setErro(null);
    iniciar(async () => {
      const r = await corrigirContagem(peca, {
        contado: naPrateleira,
        estoqueVisto,
        motivo,
        observacao: observacao || undefined,
      });
      if (r.ok) aoTerminar(r.mensagem);
      else {
        setErro(r.erro);
        if (r.estoqueAtual !== undefined) setEstoqueVisto(r.estoqueAtual);
      }
    });
  }

  return (
    <form onSubmit={salvar} noValidate className="mt-3 space-y-3 rounded-xl bg-fundo p-4">
      <label className="block">
        <span className="block text-[15px] font-semibold">Quantas peças tem na prateleira?</span>
        <input
          inputMode="numeric"
          autoFocus
          value={contado}
          onChange={(e) => setContado(e.target.value.replace(/\D/g, ""))}
          className={classeCampo}
        />
        <span className="mt-1 block text-[13px] text-secundario">
          {reservadas > 0 && (
            <>
              Conte todas, inclusive as {reservadas === 1 ? "1 peça já vendida" : `${reservadas} peças já vendidas`} que
              esperam envio: o sistema desconta.{" "}
            </>
          )}
          {novo === null
            ? `Hoje o sistema mostra ${estoqueVisto} à venda.`
            : novo < 0
              ? `Isso é menos do que as peças já vendidas. Confira de novo.`
              : novo === estoqueVisto
                ? "Bate com o sistema. Nada muda."
                : `O estoque à venda vai de ${estoqueVisto} para ${novo}.`}
        </span>
      </label>

      <fieldset>
        <legend className="text-[14px] font-semibold">Motivo</legend>
        <div className="mt-2 flex flex-wrap gap-2">
          {MOTIVOS_DE_CORRECAO.map((m) => (
            <label
              key={m}
              className={`flex min-h-11 cursor-pointer items-center rounded-full border px-4 text-[15px] font-semibold ${motivo === m ? "border-tinta bg-tinta text-papel" : "border-borda bg-papel hover:border-tinta"}`}
            >
              <input type="radio" name={`motivo-${peca.id}`} checked={motivo === m} onChange={() => setMotivo(m)} className="sr-only" />
              {m}
            </label>
          ))}
        </div>
      </fieldset>
      <label className="block">
        <span className="block text-[14px] font-semibold">
          {motivo === "Outro" ? "Qual o motivo?" : "Observação (opcional)"}
        </span>
        <input
          value={observacao}
          onChange={(e) => setObservacao(e.target.value)}
          maxLength={200}
          placeholder={motivo === "Defeito" ? "Ex.: mancha na frente" : ""}
          className="mt-1 h-12 w-full rounded-xl border border-borda bg-papel px-4 text-[16px] outline-none focus:border-tinta"
        />
      </label>
      {erro && <Aviso tipo="erro">{erro}</Aviso>}
      <button type="submit" disabled={salvando} className="inline-flex min-h-12 w-full items-center justify-center rounded-full bg-tinta px-6 text-[15px] font-bold text-papel hover:bg-painel disabled:opacity-50 sm:w-auto">
        {salvando ? "Salvando…" : "Salvar contagem"}
      </button>
    </form>
  );
}

function FormularioEstampa({
  variacaoId,
  estoque,
  lisas,
  aoTerminar,
}: {
  variacaoId: string;
  estoque: number;
  lisas: number;
  aoTerminar: (mensagem: string) => void;
}) {
  const [quantidade, setQuantidade] = useState("");
  const [observacao, setObservacao] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [salvando, iniciar] = useTransition();
  const estampadas = numero(quantidade);
  const valido = Number.isInteger(estampadas) && estampadas > 0;

  function salvar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    setErro(null);
    iniciar(async () => {
      const r = await estamparPecas(variacaoId, { quantidade: estampadas, observacao: observacao || undefined });
      if (r.ok) aoTerminar(r.mensagem);
      else setErro(r.erro);
    });
  }

  return (
    <form onSubmit={salvar} noValidate className="mt-3 space-y-3 rounded-xl bg-fundo p-4">
      <label className="block">
        <span className="block text-[15px] font-semibold">Quantas peças lisas você estampou com esta arte?</span>
        <input
          inputMode="numeric"
          autoFocus
          value={quantidade}
          onChange={(e) => setQuantidade(e.target.value.replace(/\D/g, ""))}
          className={classeCampo}
        />
        <span className="mt-1 block text-[13px] text-secundario">
          {valido
            ? estampadas > lisas
              ? `O sistema só tem ${Math.max(lisas, 0) === 1 ? "1 lisa" : `${Math.max(lisas, 0)} lisas`} desse modelo, cor e tamanho.`
              : `As lisas vão de ${lisas} para ${lisas - estampadas}, e as prontas de ${estoque} para ${estoque + estampadas}.`
            : `Sai das peças lisas do mesmo modelo, cor e tamanho (hoje ${Math.max(lisas, 0)}) e entra nas prontas desta arte.`}
        </span>
      </label>
      <label className="block">
        <span className="block text-[14px] font-semibold">Observação (opcional)</span>
        <input
          value={observacao}
          onChange={(e) => setObservacao(e.target.value)}
          maxLength={200}
          className="mt-1 h-12 w-full rounded-xl border border-borda bg-papel px-4 text-[16px] outline-none focus:border-tinta"
        />
      </label>
      {erro && <Aviso tipo="erro">{erro}</Aviso>}
      <button type="submit" disabled={salvando} className="inline-flex min-h-12 w-full items-center justify-center rounded-full bg-tinta px-6 text-[15px] font-bold text-papel hover:bg-painel disabled:opacity-50 sm:w-auto">
        {salvando ? "Salvando…" : "Tirar das lisas e somar às prontas"}
      </button>
    </form>
  );
}
