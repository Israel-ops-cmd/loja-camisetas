"use client";

import { ArrowRight, RefreshCw, Undo2 } from "lucide-react";
import { useState, useTransition, type ReactNode } from "react";

import {
  cancelarPedido,
  conferirPagamento,
  estornarPagamento,
  mudarSituacao,
  resolverAlerta,
  type Resultado,
} from "@/app/admin/pedidos/acoes";
import { Aviso } from "@/components/formulario/Aviso";
import type { StatusPedido } from "@/generated/prisma/enums";
import { formatarPreco } from "@/lib/formatacao";
import { PROXIMA_SITUACAO, rotulosDeStatus, rotulosDoBotaoDeSituacao, SITUACAO_ANTERIOR } from "@/lib/pedidos";

const botaoPrincipal =
  "inline-flex min-h-14 w-full items-center justify-center gap-2 rounded-full bg-tinta px-6 text-[16px] font-bold text-papel hover:bg-painel disabled:opacity-50 sm:w-auto";
const botaoContorno =
  "inline-flex min-h-12 items-center justify-center gap-2 rounded-full border border-tinta px-5 text-[15px] font-semibold hover:bg-fundo disabled:opacity-50";
const botaoDiscreto =
  "inline-flex min-h-11 items-center gap-2 rounded-full px-3 text-[14px] font-semibold underline underline-offset-4 disabled:opacity-50";
const campo =
  "mt-1 w-full rounded-xl border border-borda bg-papel px-4 text-[16px] outline-none focus:border-tinta";

function useAcao() {
  const [mensagem, setMensagem] = useState<{ tipo: "erro" | "sucesso"; texto: string } | null>(null);
  const [ocupado, iniciar] = useTransition();
  function executar(acao: () => Promise<Resultado>, aoDarCerto?: () => void) {
    setMensagem(null);
    iniciar(async () => {
      const r = await acao();
      setMensagem(r.ok ? { tipo: "sucesso", texto: r.mensagem } : { tipo: "erro", texto: r.erro });
      if (r.ok) aoDarCerto?.();
    });
  }
  const aviso: ReactNode = mensagem && <Aviso tipo={mensagem.tipo}>{mensagem.texto}</Aviso>;
  return { executar, ocupado, aviso, limpar: () => setMensagem(null) };
}

/** Botão grande para o próximo passo e link pequeno para voltar um. */
export function BotoesDeSituacao({ numero, status, codigoRastreio }: { numero: number; status: StatusPedido; codigoRastreio: string | null }) {
  const proxima = PROXIMA_SITUACAO[status];
  const anterior = SITUACAO_ANTERIOR[status];
  const [codigo, setCodigo] = useState(codigoRastreio ?? "");
  const [confirmarVolta, setConfirmarVolta] = useState(false);
  const { executar, ocupado, aviso, limpar } = useAcao();

  if (!proxima && !anterior) return null;

  return (
    <div className="space-y-4">
      {proxima && (
        <div className="space-y-3">
          {proxima === "ENVIADO" && (
            <label className="block">
              <span className="block text-[15px] font-semibold">Código de rastreio</span>
              <input
                value={codigo}
                onChange={(e) => {
                  setCodigo(e.target.value);
                  limpar();
                }}
                autoCapitalize="characters"
                maxLength={60}
                placeholder="Ex.: AB123456789BR"
                className={`${campo} h-14 text-[18px] font-bold tracking-wide`}
              />
              <span className="mt-1 block text-[13px] text-secundario">
                Está no comprovante da postagem. O cliente vê esse código na página do pedido.
              </span>
            </label>
          )}
          <button
            type="button"
            disabled={ocupado}
            onClick={() => executar(() => mudarSituacao(numero, { de: status, para: proxima, codigoRastreio: codigo || undefined }))}
            className={botaoPrincipal}
          >
            {ocupado ? "Salvando…" : rotulosDoBotaoDeSituacao[proxima]}
            <ArrowRight aria-hidden="true" className="size-5" strokeWidth={2} />
          </button>
          <p className="text-[13px] text-secundario">
            Depois deste passo, o pedido fica “{rotulosDeStatus[proxima]}”.
          </p>
        </div>
      )}

      {aviso}

      {anterior &&
        (confirmarVolta ? (
          <div role="alert" className="rounded-xl border border-tinta p-4">
            <p className="text-[15px] font-semibold">
              Voltar o pedido para “{rotulosDeStatus[anterior]}”? Use só para corrigir um toque errado.
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <button
                type="button"
                disabled={ocupado}
                onClick={() => executar(() => mudarSituacao(numero, { de: status, para: anterior }), () => setConfirmarVolta(false))}
                className={botaoContorno}
              >
                Sim, voltar
              </button>
              <button type="button" onClick={() => setConfirmarVolta(false)} className={botaoDiscreto}>
                Cancelar
              </button>
            </div>
          </div>
        ) : (
          <button type="button" onClick={() => setConfirmarVolta(true)} className={botaoDiscreto}>
            <Undo2 aria-hidden="true" className="size-4" strokeWidth={2} />
            Voltar para “{rotulosDeStatus[anterior]}”
          </button>
        ))}
    </div>
  );
}

export function BotaoConferirPagamento({ numero }: { numero: number }) {
  const { executar, ocupado, aviso } = useAcao();
  return (
    <div className="space-y-3">
      <button type="button" disabled={ocupado} onClick={() => executar(() => conferirPagamento(numero))} className={botaoContorno}>
        <RefreshCw aria-hidden="true" className={`size-4 ${ocupado ? "animate-spin" : ""}`} strokeWidth={2} />
        {ocupado ? "Conferindo…" : "Conferir pagamento no Mercado Pago"}
      </button>
      {aviso}
    </div>
  );
}

/** Pedido não pago: cancela com motivo (o cliente vê). */
export function CancelarPedido({ numero }: { numero: number }) {
  const [aberto, setAberto] = useState(false);
  const [motivo, setMotivo] = useState("");
  const { executar, ocupado, aviso } = useAcao();

  if (!aberto) {
    return (
      <div className="space-y-3">
        <button type="button" onClick={() => setAberto(true)} className={botaoDiscreto}>
          Cancelar este pedido
        </button>
        {aviso}
      </div>
    );
  }
  return (
    <div role="alert" className="space-y-3 rounded-xl border border-tinta p-4">
      <p className="text-[15px] font-semibold">
        Cancelar o pedido #{numero}? O link de pagamento deixa de funcionar e não dá para desfazer.
      </p>
      <label className="block">
        <span className="block text-[14px] font-semibold">Motivo (o cliente vê)</span>
        <textarea
          rows={2}
          maxLength={300}
          value={motivo}
          onChange={(e) => setMotivo(e.target.value)}
          placeholder="Ex.: cancelado a pedido do cliente"
          className={`${campo} py-3`}
        />
      </label>
      {aviso}
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          disabled={ocupado}
          onClick={() => executar(() => cancelarPedido(numero, { motivo }), () => setAberto(false))}
          className={botaoContorno}
        >
          {ocupado ? "Cancelando…" : "Sim, cancelar pedido"}
        </button>
        <button type="button" onClick={() => setAberto(false)} className={botaoDiscreto}>
          Não cancelar
        </button>
      </div>
    </div>
  );
}

/** Devolve o valor de um pagamento aprovado. */
export function EstornarPagamento({
  numero,
  pagamentoId,
  valorEmCentavos,
  doPedido,
  enviado,
}: {
  numero: number;
  pagamentoId: string;
  valorEmCentavos: number;
  /** É o pagamento que pagou o pedido (estornar cancela o pedido). */
  doPedido: boolean;
  /** O pedido já saiu da loja. */
  enviado: boolean;
}) {
  const [aberto, setAberto] = useState(false);
  const [motivo, setMotivo] = useState("");
  const { executar, ocupado, aviso } = useAcao();
  const valor = formatarPreco(valorEmCentavos);

  if (!aberto) {
    return (
      <div className="space-y-3">
        <button type="button" onClick={() => setAberto(true)} className={botaoContorno}>
          <Undo2 aria-hidden="true" className="size-4" strokeWidth={2} />
          {doPedido ? `Estornar ${valor} e cancelar` : `Estornar ${valor}`}
        </button>
        {aviso}
      </div>
    );
  }
  return (
    <div role="alert" className="space-y-3 rounded-xl border border-tinta p-4">
      <p className="text-[15px] font-semibold">Devolver {valor} ao cliente pelo Mercado Pago? Não dá para desfazer.</p>
      {doPedido && (
        <p className="text-[14px] text-apoio">
          O pedido será cancelado e as peças voltam para o estoque.
          {enviado && " Como ele já foi enviado, se as peças não voltarem para a loja, corrija a contagem no Estoque."}
        </p>
      )}
      <label className="block">
        <span className="block text-[14px] font-semibold">Motivo (o cliente vê)</span>
        <textarea
          rows={2}
          maxLength={300}
          value={motivo}
          onChange={(e) => setMotivo(e.target.value)}
          placeholder="Ex.: peça em falta no estoque"
          className={`${campo} py-3`}
        />
      </label>
      {aviso}
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          disabled={ocupado}
          onClick={() => executar(() => estornarPagamento(numero, { pagamentoId, motivo }), () => setAberto(false))}
          className={botaoContorno}
        >
          {ocupado ? "Estornando…" : `Sim, devolver ${valor}`}
        </button>
        <button type="button" onClick={() => setAberto(false)} className={botaoDiscreto}>
          Não estornar
        </button>
      </div>
    </div>
  );
}

export function BotaoResolverAlerta({ numero }: { numero: number }) {
  const { executar, ocupado, aviso } = useAcao();
  return (
    <div className="mt-3 space-y-3">
      <button type="button" disabled={ocupado} onClick={() => executar(() => resolverAlerta(numero))} className={botaoContorno}>
        {ocupado ? "Salvando…" : "Já resolvi este alerta"}
      </button>
      {aviso}
    </div>
  );
}
