import Link from "next/link";
import { notFound } from "next/navigation";
import { CircleAlert, ExternalLink, Mail, MessageCircle } from "lucide-react";

import {
  BotaoConferirPagamento,
  BotaoResolverAlerta,
  BotoesDeSituacao,
  CancelarPedido,
  EstornarPagamento,
} from "@/components/admin/AcoesDoPedido";
import { EtiquetaDoPedido } from "@/components/admin/EtiquetaDoPedido";
import { Painel } from "@/components/ui/Painel";
import { exigirAdministrador } from "@/lib/auth";
import { remetenteIncompleto, situacaoDaEtiqueta } from "@/lib/etiquetas";
import { formatarPreco } from "@/lib/formatacao";
import { buscarPagamentosDoPedido, type PagamentoMercadoPago } from "@/lib/mercado-pago";
import { prazoDePagamento } from "@/lib/pagamento";
import { formatarData, formatarDataHora, linkDeRastreio, rotulosDeStatus } from "@/lib/pedidos";
import { prisma } from "@/lib/prisma";
import { mascararCep, mascararCpf, mascararTelefone } from "@/lib/validacao-br";

const situacaoNoMercadoPago: Record<string, string> = {
  approved: "Aprovado",
  pending: "Aguardando pagamento",
  in_process: "Em análise",
  authorized: "Autorizado",
  rejected: "Recusado",
  cancelled: "Cancelado",
  refunded: "Estornado",
  charged_back: "Contestado pelo cliente",
};

const formas: Record<string, string> = {
  credit_card: "Cartão de crédito",
  debit_card: "Cartão de débito",
  bank_transfer: "Pix",
  ticket: "Boleto",
  account_money: "Saldo Mercado Pago",
};

const proximoPasso: Partial<Record<string, string>> = {
  PAGO: "Pagamento confirmado e estoque já baixado. Separe as peças abaixo.",
  EM_SEPARACAO: "Quando postar o pacote, toque em “Enviei o pedido” e digite o código de rastreio.",
  ENVIADO: "Quando o cliente receber (veja no rastreio), toque em “O cliente recebeu”.",
  ENTREGUE: "Pedido concluído.",
};

export default async function PaginaAdminPedido({ params }: PageProps<"/admin/pedidos/[numero]">) {
  await exigirAdministrador();
  const { numero } = await params;
  const n = Number(numero);
  if (!Number.isInteger(n) || n <= 0) notFound();

  const pedido = await prisma.pedido.findUnique({
    where: { numero: n },
    include: {
      itens: { orderBy: [{ nomeProduto: "asc" }, { nomeCor: "asc" }, { nomeTamanho: "asc" }] },
      historico: { orderBy: { criadoEm: "desc" } },
      personalizacao: { select: { numero: true } },
    },
  });
  if (!pedido) notFound();

  // Pagamentos no Mercado Pago (só se o cliente chegou a abrir a cobrança).
  // Etiqueta no Melhor Envio (situação lida na hora).
  let etiqueta: Awaited<ReturnType<typeof situacaoDaEtiqueta>> | null = null;
  let erroNaEtiqueta = false;
  if (pedido.melhorEnvioEtiquetaId) {
    try {
      etiqueta = await situacaoDaEtiqueta(pedido.melhorEnvioEtiquetaId);
    } catch {
      erroNaEtiqueta = true;
    }
  }
  const mostrarEtiqueta =
    !!pedido.melhorEnvioEtiquetaId || ["PAGO", "EM_SEPARACAO"].includes(pedido.status);

  let pagamentos: PagamentoMercadoPago[] = [];
  let erroNosPagamentos = false;
  if (pedido.mercadoPagoPreferenciaId) {
    try {
      pagamentos = await buscarPagamentosDoPedido(pedido.id);
    } catch {
      erroNosPagamentos = true;
    }
  }

  const pecas = pedido.itens.reduce((soma, i) => soma + i.quantidade, 0);
  const primeiroNome = pedido.compradorNome.split(" ")[0];
  const whatsapp = `https://wa.me/55${pedido.compradorTelefone}?text=${encodeURIComponent(
    `Olá, ${primeiroNome}! Aqui é da Carta Viva, sobre o seu pedido #${pedido.numero}.`,
  )}`;
  const venceEm = prazoDePagamento(pedido.criadoEm);
  const enviado = pedido.status === "ENVIADO" || pedido.status === "ENTREGUE";

  return (
    <div className="secao">
      <div className="mx-auto max-w-3xl">
        <p className="sobretitulo text-secundario">
          <Link href="/admin/pedidos" className="hover:text-tinta">Pedidos</Link>
        </p>
        <h1 className="titulo-destaque mt-4">#{pedido.numero}</h1>
        <p className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-2">
          <span className="rounded-full bg-tinta px-3 py-1 text-[12px] font-bold tracking-[0.12em] text-papel uppercase">
            {rotulosDeStatus[pedido.status]}
          </span>
          <span className="text-[14px] text-secundario">feito em {formatarDataHora(pedido.criadoEm)}</span>
          {pedido.personalizacao && (
            <Link href={`/admin/personalizacoes/${pedido.personalizacao.numero}`} className="inline-flex min-h-11 items-center text-[14px] font-semibold underline underline-offset-4">
              Personalização nº {pedido.personalizacao.numero}
            </Link>
          )}
        </p>

        <div className="mt-8 space-y-6">
          {pedido.alerta && (
            <section role="alert" className="rounded-[20px] border-2 border-tinta bg-papel p-6 sm:p-8">
              <h2 className="flex items-center gap-2 text-[18px] font-bold">
                <CircleAlert aria-hidden="true" className="size-6 shrink-0" strokeWidth={2} />
                Precisa de decisão
              </h2>
              <ul className="mt-3 space-y-2 text-[15px]">
                {pedido.alerta.split("\n").map((linha) => (
                  <li key={linha}>{linha}</li>
                ))}
              </ul>
              <p className="mt-3 text-[14px] text-apoio">
                Fale com o cliente pelos botões abaixo. Se for devolver o dinheiro, use o estorno em “Pagamentos”.
                Depois de resolver, marque aqui.
              </p>
              <BotaoResolverAlerta numero={pedido.numero} />
            </section>
          )}

          <Painel titulo="O que fazer agora">
            {pedido.status === "AGUARDANDO_PAGAMENTO" && (
              <div className="space-y-4">
                <p className="text-[16px]">
                  O cliente ainda não pagou. O prazo vai até <strong>{formatarData(venceEm)}</strong>. A loja confere
                  sozinha quando o cliente abre o pedido, e você pode conferir aqui.
                </p>
                <BotaoConferirPagamento numero={pedido.numero} />
                <CancelarPedido numero={pedido.numero} />
              </div>
            )}
            {pedido.status === "CANCELADO" && (
              <p className="text-[16px]">
                Pedido cancelado{pedido.canceladoEm && ` em ${formatarDataHora(pedido.canceladoEm)}`}.
                {pedido.motivoCancelamento && (
                  <>
                    {" "}
                    Motivo: <em>{pedido.motivoCancelamento}</em>
                  </>
                )}
              </p>
            )}
            {proximoPasso[pedido.status] && (
              <div className="space-y-4">
                <p className="text-[16px]">{proximoPasso[pedido.status]}</p>
                <BotoesDeSituacao
                  numero={pedido.numero}
                  status={pedido.status}
                  codigoRastreio={pedido.codigoRastreio ?? etiqueta?.rastreio ?? null}
                />
              </div>
            )}
          </Painel>

          {mostrarEtiqueta && (
            <Painel titulo="Etiqueta de envio">
              <EtiquetaDoPedido
                numero={pedido.numero}
                servico={[pedido.freteTransportadora, pedido.freteServico].filter(Boolean).join(" ") || "frete escolhido"}
                freteCobrado={pedido.freteEmCentavos}
                etiqueta={etiqueta}
                erroAoLer={erroNaEtiqueta}
                podeComprar={["PAGO", "EM_SEPARACAO"].includes(pedido.status)}
                faltaRemetente={remetenteIncompleto()}
              />
            </Painel>
          )}

          <Painel titulo={`Itens · ${pecas === 1 ? "1 peça" : `${pecas} peças`}`}>
            <ul className="divide-y divide-borda">
              {pedido.itens.map((item) => (
                <li key={item.id} className="flex items-start justify-between gap-4 py-3">
                  <span>
                    <span className="block text-[17px] font-bold">
                      {item.quantidade}× {item.nomeProduto}
                    </span>
                    <span className="block text-[15px]">
                      {item.nomeCor} · Tamanho <strong>{item.nomeTamanho}</strong>
                    </span>
                    <span className="block text-[12px] text-secundario">{item.sku}</span>
                  </span>
                  <span className="shrink-0 text-[15px]">{formatarPreco(item.precoUnitarioEmCentavos * item.quantidade)}</span>
                </li>
              ))}
            </ul>
            <dl className="mt-3 space-y-1 border-t border-borda pt-3 text-[15px]">
              <div className="flex justify-between">
                <dt className="text-apoio">Subtotal</dt>
                <dd>{formatarPreco(pedido.subtotalEmCentavos)}</dd>
              </div>
              {pedido.descontoEmCentavos > 0 && (
                <div className="flex justify-between">
                  <dt className="text-apoio">Desconto de atacado ({pedido.descontoPercentual}%)</dt>
                  <dd>−{formatarPreco(pedido.descontoEmCentavos)}</dd>
                </div>
              )}
              <div className="flex justify-between">
                <dt className="text-apoio">Frete</dt>
                <dd>{formatarPreco(pedido.freteEmCentavos)}</dd>
              </div>
              <div className="flex justify-between text-[17px] font-bold">
                <dt>Total</dt>
                <dd>{formatarPreco(pedido.totalEmCentavos)}</dd>
              </div>
            </dl>
          </Painel>

          <Painel titulo="Cliente">
            <p className="text-[16px] font-semibold">{pedido.compradorNome}</p>
            <p className="mt-1 text-[14px] text-apoio">CPF {mascararCpf(pedido.compradorCpf)}</p>
            <div className="mt-4 flex flex-col gap-2 sm:flex-row">
              <a
                href={whatsapp}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-tinta px-6 text-[14px] font-bold text-papel hover:bg-painel"
              >
                <MessageCircle aria-hidden="true" className="size-5" strokeWidth={1.6} />
                WhatsApp {mascararTelefone(pedido.compradorTelefone)}
              </a>
              <a
                href={`mailto:${pedido.compradorEmail}?subject=${encodeURIComponent(`Pedido #${pedido.numero} - Carta Viva`)}`}
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full border border-tinta px-6 text-[14px] font-bold hover:bg-fundo"
              >
                <Mail aria-hidden="true" className="size-5" strokeWidth={1.6} />
                <span className="truncate">{pedido.compradorEmail}</span>
              </a>
            </div>
          </Painel>

          <Painel titulo="Entrega">
            <p className="text-[16px] leading-relaxed">
              <span className="font-semibold">{pedido.entregaDestinatario}</span>
              <br />
              {pedido.entregaLogradouro}, {pedido.entregaNumero}
              {pedido.entregaComplemento && ` · ${pedido.entregaComplemento}`}
              <br />
              {pedido.entregaBairro} · {pedido.entregaCidade}/{pedido.entregaUf} · {mascararCep(pedido.entregaCep)}
            </p>
            {pedido.freteServico && (
              <p className="mt-3 text-[15px] text-apoio">
                Frete escolhido: <strong>{pedido.freteServico}</strong>
                {pedido.freteTransportadora && ` (${pedido.freteTransportadora})`} · {formatarPreco(pedido.freteEmCentavos)}
                {pedido.fretePrazoDias && ` · até ${pedido.fretePrazoDias} dias úteis`}
              </p>
            )}
            {pedido.codigoRastreio && (
              <p className="mt-3 text-[15px]">
                Rastreio:{" "}
                <a
                  href={linkDeRastreio(pedido.codigoRastreio)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex min-h-11 items-center gap-1 font-semibold underline underline-offset-4"
                >
                  {pedido.codigoRastreio}
                  <ExternalLink aria-hidden="true" className="size-4" strokeWidth={1.8} />
                </a>
                {pedido.enviadoEm && <span className="text-secundario"> · enviado em {formatarData(pedido.enviadoEm)}</span>}
              </p>
            )}
          </Painel>

          <Painel titulo="Pagamentos no Mercado Pago">
            {erroNosPagamentos ? (
              <p className="text-[15px]">Não conseguimos falar com o Mercado Pago agora. Recarregue a página em instantes.</p>
            ) : pagamentos.length === 0 ? (
              <p className="text-[15px] text-apoio">
                {pedido.mercadoPagoPreferenciaId ? "O cliente abriu a cobrança, mas ainda não houve pagamento." : "O cliente ainda não abriu a cobrança."}
              </p>
            ) : (
              <ul className="divide-y divide-borda">
                {pagamentos.map((p) => {
                  const id = String(p.id);
                  const doPedido = pedido.mercadoPagoPagamentoId === id;
                  return (
                    <li key={id} className="space-y-2 py-3">
                      <p className="flex flex-wrap items-baseline justify-between gap-x-4">
                        <span className="text-[16px] font-semibold">
                          {situacaoNoMercadoPago[p.status] ?? p.status} · {formatarPreco(Math.round(p.transaction_amount * 100))}
                        </span>
                        <span className="text-[13px] text-secundario">{formatarDataHora(new Date(p.date_created))}</span>
                      </p>
                      <p className="text-[13px] text-secundario">
                        {formas[p.payment_type_id] ?? p.payment_type_id} · pagamento {id}
                        {doPedido && " · este pagou o pedido"}
                      </p>
                      {p.status === "approved" && (
                        <EstornarPagamento
                          numero={pedido.numero}
                          pagamentoId={id}
                          valorEmCentavos={Math.round(p.transaction_amount * 100)}
                          doPedido={doPedido}
                          enviado={enviado}
                        />
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
            {pedido.status !== "AGUARDANDO_PAGAMENTO" && pagamentos.length > 0 && (
              <div className="mt-4 border-t border-borda pt-4">
                <p className="mb-3 text-[14px] text-apoio">
                  Estornou ou mudou algo direto no Mercado Pago? Confira aqui para o pedido acompanhar.
                </p>
                <BotaoConferirPagamento numero={pedido.numero} />
              </div>
            )}
          </Painel>

          <Painel titulo="Histórico">
            {pedido.historico.length === 0 ? (
              <p className="text-[15px] text-apoio">Nada registrado ainda.</p>
            ) : (
              <ol className="space-y-3">
                {pedido.historico.map((h) => (
                  <li key={h.id} className="text-[15px]">
                    <span className="block">{h.texto}</span>
                    <span className="block text-[13px] text-secundario">
                      {formatarDataHora(h.criadoEm)} · {h.autor ?? "sistema"}
                    </span>
                  </li>
                ))}
              </ol>
            )}
            <p className="mt-4 text-[13px] text-secundario">Pedido feito em {formatarDataHora(pedido.criadoEm)}.</p>
          </Painel>
        </div>
      </div>
    </div>
  );
}
