"use client";

import { Printer, RefreshCw, Tag } from "lucide-react";
import { useState, useTransition } from "react";

import {
  atualizarEtiqueta,
  cancelarEtiqueta,
  comprarEtiqueta,
  imprimirEtiqueta,
  prepararEtiqueta,
} from "@/app/admin/pedidos/etiqueta-acoes";
import { Aviso } from "@/components/formulario/Aviso";
import { formatarPreco } from "@/lib/formatacao";

type Etiqueta = { status: string; rotulo: string; protocolo: string; precoEmCentavos: number; rastreio: string | null };

const botaoPrincipal =
  "inline-flex min-h-14 w-full items-center justify-center gap-2 rounded-full bg-tinta px-6 text-[16px] font-bold text-papel hover:bg-painel disabled:opacity-50 sm:w-auto";
const botaoContorno =
  "inline-flex min-h-12 items-center justify-center gap-2 rounded-full border border-tinta px-5 text-[15px] font-semibold hover:bg-fundo disabled:opacity-50";
const botaoDiscreto =
  "inline-flex min-h-11 items-center gap-2 rounded-full px-3 text-[14px] font-semibold underline underline-offset-4 disabled:opacity-50";

export function EtiquetaDoPedido({
  numero,
  servico,
  freteCobrado,
  freteDaLoja,
  etiqueta,
  erroAoLer,
  podeComprar,
  faltaRemetente,
}: {
  numero: number;
  servico: string;
  freteCobrado: number;
  /** Parte do frete paga pela loja (frete grátis). */
  freteDaLoja: number;
  etiqueta: Etiqueta | null;
  erroAoLer: boolean;
  podeComprar: boolean;
  faltaRemetente: string[];
}) {
  const [preco, setPreco] = useState<number | null>(null);
  const [cancelando, setCancelando] = useState(false);
  const [motivo, setMotivo] = useState("");
  const [mensagem, setMensagem] = useState<{ tipo: "erro" | "sucesso" | "info"; texto: string } | null>(null);
  const [ocupado, iniciar] = useTransition();

  const ativa = etiqueta && !["pending", "canceled", "expired"].includes(etiqueta.status);
  const interrompida = etiqueta?.status === "pending";
  // Cotação do frete na hora da compra: o que o cliente pagou mais o frete grátis.
  const freteCotado = freteCobrado + freteDaLoja;

  function preparar() {
    setMensagem(null);
    iniciar(async () => {
      const r = await prepararEtiqueta(numero);
      if (r.ok) setPreco(r.precoEmCentavos);
      else setMensagem({ tipo: "erro", texto: r.erro });
    });
  }

  function comprar(precoVisto: number) {
    setMensagem(null);
    iniciar(async () => {
      const r = await comprarEtiqueta(numero, { precoVisto });
      if (r.ok) {
        setPreco(null);
        setMensagem({ tipo: "sucesso", texto: r.mensagem });
      } else {
        if (r.novoPreco) setPreco(r.novoPreco);
        setMensagem({ tipo: "erro", texto: r.erro });
      }
    });
  }

  function imprimir() {
    setMensagem(null);
    // Abre a aba já no toque (o celular bloqueia aba aberta depois de esperar a resposta).
    const aba = window.open("", "_blank");
    iniciar(async () => {
      const r = await imprimirEtiqueta(numero);
      if (r.ok && aba) aba.location.href = r.url;
      else {
        aba?.close();
        setMensagem(r.ok ? { tipo: "info", texto: `Abra a etiqueta por este link: ${r.url}` } : { tipo: "erro", texto: r.erro });
      }
    });
  }

  function atualizar() {
    setMensagem(null);
    iniciar(async () => {
      const r = await atualizarEtiqueta(numero);
      setMensagem(r.ok ? { tipo: "info", texto: r.mensagem } : { tipo: "erro", texto: r.erro });
    });
  }

  function cancelar() {
    iniciar(async () => {
      const r = await cancelarEtiqueta(numero, { motivo });
      setMensagem(r.ok ? { tipo: "sucesso", texto: r.mensagem } : { tipo: "erro", texto: r.erro });
      if (r.ok) setCancelando(false);
    });
  }

  const aviso = mensagem && (
    <Aviso tipo={mensagem.tipo === "info" ? "info" : mensagem.tipo}>{mensagem.texto}</Aviso>
  );

  if (erroAoLer) {
    return (
      <div className="space-y-3">
        <p className="text-[15px]">Não conseguimos ler a etiqueta no Melhor Envio agora.</p>
        <button type="button" onClick={atualizar} disabled={ocupado} className={botaoContorno}>
          <RefreshCw aria-hidden="true" className={`size-4 ${ocupado ? "animate-spin" : ""}`} strokeWidth={2} />
          Tentar de novo
        </button>
        {aviso}
      </div>
    );
  }

  if (ativa) {
    const podeCancelar = etiqueta.status === "released" || etiqueta.status === "generated";
    return (
      <div className="space-y-4">
        <dl className="grid gap-3 text-[15px] sm:grid-cols-2">
          <div>
            <dt className="text-[13px] text-secundario">Situação</dt>
            <dd className="font-semibold">{etiqueta.rotulo}</dd>
          </div>
          <div>
            <dt className="text-[13px] text-secundario">Custo</dt>
            <dd className="font-semibold">{formatarPreco(etiqueta.precoEmCentavos)}</dd>
          </div>
          <div>
            <dt className="text-[13px] text-secundario">Rastreio</dt>
            <dd className="font-semibold">{etiqueta.rastreio ?? "aparece depois que a etiqueta é gerada"}</dd>
          </div>
          <div>
            <dt className="text-[13px] text-secundario">Protocolo no Melhor Envio</dt>
            <dd>{etiqueta.protocolo}</dd>
          </div>
        </dl>
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={imprimir} disabled={ocupado} className={botaoPrincipal}>
            <Printer aria-hidden="true" className="size-5" strokeWidth={1.8} />
            Imprimir etiqueta
          </button>
          <button type="button" onClick={atualizar} disabled={ocupado} className={botaoContorno}>
            <RefreshCw aria-hidden="true" className={`size-4 ${ocupado ? "animate-spin" : ""}`} strokeWidth={2} />
            Atualizar
          </button>
        </div>
        <p className="text-[13px] text-secundario">
          Cole a etiqueta no pacote e leve a uma agência {servico.toLowerCase().includes("jadlog") ? "da Jadlog" : "dos Correios"}.
          Depois toque em “Enviei o pedido”, acima.
        </p>
        {aviso}
        {podeCancelar &&
          (cancelando ? (
            <div role="alert" className="space-y-3 rounded-xl border border-tinta p-4">
              <p className="text-[15px] font-semibold">
                Cancelar a etiqueta? O valor volta para a carteira do Melhor Envio. Só dá para cancelar antes de postar.
              </p>
              <label className="block">
                <span className="block text-[14px] font-semibold">Motivo</span>
                <input
                  value={motivo}
                  onChange={(e) => setMotivo(e.target.value)}
                  maxLength={200}
                  placeholder="Ex.: endereço errado"
                  className="mt-1 h-12 w-full rounded-xl border border-borda bg-papel px-4 text-[16px] outline-none focus:border-tinta"
                />
              </label>
              <div className="flex flex-wrap gap-2">
                <button type="button" onClick={cancelar} disabled={ocupado} className={botaoContorno}>
                  {ocupado ? "Cancelando…" : "Sim, cancelar etiqueta"}
                </button>
                <button type="button" onClick={() => setCancelando(false)} className={botaoDiscreto}>
                  Não cancelar
                </button>
              </div>
            </div>
          ) : (
            <button type="button" onClick={() => setCancelando(true)} className={botaoDiscreto}>
              Cancelar etiqueta
            </button>
          ))}
      </div>
    );
  }

  if (!podeComprar) {
    return <p className="text-[15px] text-apoio">Sem etiqueta. Ela pode ser comprada quando o pedido está pago e ainda não foi enviado.</p>;
  }

  if (faltaRemetente.length > 0) {
    return (
      <Aviso tipo="info">
        Para comprar etiquetas pelo painel, faltam os dados do remetente nas configurações da loja ({faltaRemetente.join(", ")}). Peça
        para quem cuida do site preencher.
      </Aviso>
    );
  }

  return (
    <div className="space-y-4">
      {interrompida && (
        <Aviso tipo="info">A compra da etiqueta começou, mas não terminou. Toque em “Terminar compra”.</Aviso>
      )}
      <p className="text-[15px]">
        Frete escolhido pelo cliente: <strong>{servico}</strong>,{" "}
        {freteDaLoja === 0
          ? `pago ${formatarPreco(freteCobrado)}.`
          : freteCobrado === 0
            ? `com frete grátis (cotado em ${formatarPreco(freteCotado)} na compra; a loja paga a etiqueta).`
            : `pago ${formatarPreco(freteCobrado)}, com ${formatarPreco(freteDaLoja)} de frete grátis pago pela loja.`}
      </p>
      {interrompida ? (
        <button type="button" onClick={() => comprar(etiqueta!.precoEmCentavos)} disabled={ocupado} className={botaoPrincipal}>
          <Tag aria-hidden="true" className="size-5" strokeWidth={1.8} />
          {ocupado ? "Comprando…" : "Terminar compra"}
        </button>
      ) : preco === null ? (
        <button type="button" onClick={preparar} disabled={ocupado} className={botaoPrincipal}>
          <Tag aria-hidden="true" className="size-5" strokeWidth={1.8} />
          {ocupado ? "Consultando preço…" : "Gerar etiqueta de envio"}
        </button>
      ) : (
        <div role="alert" className="space-y-3 rounded-xl border border-tinta p-4">
          <p className="text-[16px] font-semibold">
            A etiqueta custa {formatarPreco(preco)}, pagos com o saldo da carteira do Melhor Envio.
          </p>
          {preco > freteCotado && (
            <p className="text-[14px] text-apoio">
              É {formatarPreco(preco - freteCotado)} a mais do que o frete cotado na compra (o preço do Melhor Envio mudou desde então).
            </p>
          )}
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={() => comprar(preco)} disabled={ocupado} className={botaoPrincipal}>
              {ocupado ? "Comprando…" : `Comprar etiqueta por ${formatarPreco(preco)}`}
            </button>
            <button type="button" onClick={() => setPreco(null)} className={botaoDiscreto}>
              Agora não
            </button>
          </div>
        </div>
      )}
      {aviso}
    </div>
  );
}
