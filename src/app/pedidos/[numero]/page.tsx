import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { Aviso } from "@/components/formulario/Aviso";
import { BotaoPagar } from "@/components/pedido/BotaoPagar";
import { Botao } from "@/components/ui/Botao";
import { exigirUsuario } from "@/lib/auth";
import { formatarPreco } from "@/lib/formatacao";
import { conferirPagamentosDoPedido, prazoDePagamento } from "@/lib/pagamento";
import {
  formatarData,
  formatarNumeroDoPedido,
  rotulosDeStatus,
} from "@/lib/pedidos";
import { prisma } from "@/lib/prisma";
import { mascararCep } from "@/lib/validacao-br";

export const metadata: Metadata = {
  title: "Pedido",
  robots: { index: false },
};

function prazo(minimo: number | null, maximo: number | null) {
  if (!maximo) return null;
  if (!minimo || minimo === maximo) return `${maximo} dias úteis`;
  return `${minimo} a ${maximo} dias úteis`;
}

export default async function PaginaPedido({
  params,
  searchParams,
}: PageProps<"/pedidos/[numero]">) {
  const { numero } = await params;
  const usuario = await exigirUsuario(`/pedidos/${numero}`);
  const { novo, retorno } = await searchParams;

  const numeroDoPedido = Number(numero);
  if (!Number.isInteger(numeroDoPedido) || numeroDoPedido <= 0) notFound();

  // Só o dono vê o pedido. Para qualquer outra pessoa, ele não existe.
  const buscar = () =>
    prisma.pedido.findFirst({
      where: { numero: numeroDoPedido, clienteId: usuario.id },
      include: { itens: { orderBy: { nomeProduto: "asc" } } },
    });
  let pedido = await buscar();
  if (!pedido) notFound();

  // Volta do Mercado Pago: confere o pagamento na hora, sem esperar o webhook.
  // Os dados da URL não são usados; a situação vem da API do Mercado Pago.
  if (retorno && pedido.status === "AGUARDANDO_PAGAMENTO") {
    try {
      await conferirPagamentosDoPedido(pedido.id);
      pedido = (await buscar())!;
    } catch (erro) {
      console.error("[pedido] não foi possível conferir o pagamento:", erro);
    }
  }

  const prazoDoFrete = prazo(pedido.fretePrazoMinimoDias, pedido.fretePrazoDias);
  const venceEm = prazoDePagamento(pedido.criadoEm);
  const vencido = venceEm <= new Date();
  const emAnalise = ["pending", "in_process", "authorized"].includes(
    pedido.mercadoPagoStatus ?? "",
  );
  const recusado =
    ["rejected", "cancelled"].includes(pedido.mercadoPagoStatus ?? "") ||
    retorno === "recusado";
  // Pagamento aprovado com valor diferente do pedido: o administrador decide.
  const emVerificacao = pedido.mercadoPagoStatus === "valor_divergente";

  return (
    <div className="secao">
      <div className="mx-auto max-w-3xl">
        <p className="sobretitulo text-center text-secundario">
          Pedido {formatarNumeroDoPedido(pedido.numero)}
        </p>
        <h1 className="titulo-listagem mt-3">
          {novo ? "Pedido recebido" : rotulosDeStatus[pedido.status]}
        </h1>

        <div className="mt-10 space-y-3">
          {novo && (
            <Aviso tipo="sucesso">
              Recebemos o seu pedido {formatarNumeroDoPedido(pedido.numero)}.
              Obrigado, {pedido.compradorNome.split(" ")[0]}!
            </Aviso>
          )}
          {pedido.status === "PAGO" && (
            <Aviso tipo="sucesso">
              Pagamento aprovado
              {pedido.metodoPagamento && ` (${pedido.metodoPagamento})`}. Seu
              pedido vai para separação.
            </Aviso>
          )}
          {pedido.status === "CANCELADO" && (
            <Aviso tipo="info">Este pedido foi cancelado.</Aviso>
          )}
          {pedido.status === "AGUARDANDO_PAGAMENTO" && vencido && (
            <Aviso tipo="info">
              O prazo para pagar terminou em {formatarData(venceEm)}. Para
              comprar, monte o carrinho de novo.
            </Aviso>
          )}
          {pedido.status === "AGUARDANDO_PAGAMENTO" && emVerificacao && (
            <Aviso tipo="info">
              Recebemos um pagamento com valor diferente do total do pedido e
              estamos verificando. Não é preciso pagar de novo: vamos entrar em
              contato.
            </Aviso>
          )}
          {pedido.status === "AGUARDANDO_PAGAMENTO" && !vencido && !emVerificacao && (
            <>
              {emAnalise ? (
                <Aviso tipo="info">
                  Pagamento em análise ou aguardando o Pix ou o boleto. Assim que
                  o Mercado Pago confirmar, o pedido segue para separação.
                </Aviso>
              ) : recusado ? (
                <Aviso tipo="erro">
                  O pagamento não foi aprovado. Tente de novo com outro cartão ou
                  outra forma de pagamento.
                </Aviso>
              ) : (
                <Aviso tipo="info">
                  Pague até {formatarData(venceEm)}. O pedido só segue para
                  separação depois que o pagamento for confirmado.
                </Aviso>
              )}
              <div className="rounded-[20px] bg-papel p-6">
                <BotaoPagar
                  numero={pedido.numero}
                  rotulo={
                    emAnalise
                      ? "Ver pagamento"
                      : recusado
                        ? "Tentar de novo"
                        : "Pagar agora"
                  }
                />
              </div>
            </>
          )}
        </div>

        <section className="mt-6 rounded-[20px] bg-papel p-6 sm:p-8">
          <dl className="grid gap-4 text-[15px] sm:grid-cols-3">
            <div>
              <dt className="text-[13px] text-secundario">Data</dt>
              <dd className="font-semibold">{formatarData(pedido.criadoEm)}</dd>
            </div>
            <div>
              <dt className="text-[13px] text-secundario">Situação</dt>
              <dd className="font-semibold">{rotulosDeStatus[pedido.status]}</dd>
            </div>
            <div>
              <dt className="text-[13px] text-secundario">Total</dt>
              <dd className="font-semibold">{formatarPreco(pedido.totalEmCentavos)}</dd>
            </div>
          </dl>
        </section>

        <section
          aria-labelledby="titulo-itens"
          className="mt-6 rounded-[20px] bg-papel p-6 sm:p-8"
        >
          <h2 id="titulo-itens" className="sobretitulo">
            Itens
          </h2>
          <ul className="mt-4 divide-y divide-borda">
            {pedido.itens.map((item) => (
              <li key={item.id} className="flex justify-between gap-4 py-3 text-[15px]">
                <span>
                  <span className="font-semibold">
                    {item.quantidade}× {item.nomeProduto}
                  </span>
                  <span className="block text-[14px] text-secundario">
                    {item.nomeCor} · Tamanho {item.nomeTamanho}
                  </span>
                </span>
                <span className="shrink-0">
                  {formatarPreco(item.precoUnitarioEmCentavos * item.quantidade)}
                </span>
              </li>
            ))}
          </ul>
          <dl className="mt-4 space-y-2 border-t border-borda pt-4 text-[15px]">
            <div className="flex justify-between">
              <dt className="text-apoio">Subtotal</dt>
              <dd>{formatarPreco(pedido.subtotalEmCentavos)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-apoio">Frete</dt>
              <dd>{formatarPreco(pedido.freteEmCentavos)}</dd>
            </div>
            {pedido.descontoEmCentavos > 0 && (
              <div className="flex justify-between">
                <dt className="text-apoio">Desconto</dt>
                <dd>−{formatarPreco(pedido.descontoEmCentavos)}</dd>
              </div>
            )}
            <div className="flex justify-between font-semibold">
              <dt>Total</dt>
              <dd className="font-titulo text-[22px] font-extrabold">
                {formatarPreco(pedido.totalEmCentavos)}
              </dd>
            </div>
          </dl>
        </section>

        <section
          aria-labelledby="titulo-entrega"
          className="mt-6 rounded-[20px] bg-papel p-6 sm:p-8"
        >
          <h2 id="titulo-entrega" className="sobretitulo">
            Entrega
          </h2>
          <p className="mt-4 text-[15px] leading-relaxed">
            <span className="font-semibold">{pedido.entregaDestinatario}</span>
            <br />
            {pedido.entregaLogradouro}, {pedido.entregaNumero}
            {pedido.entregaComplemento && ` · ${pedido.entregaComplemento}`}
            <br />
            {pedido.entregaBairro} · {pedido.entregaCidade}/{pedido.entregaUf} ·{" "}
            {mascararCep(pedido.entregaCep)}
          </p>
          {pedido.freteServico && (
            <p className="mt-3 text-[15px] text-apoio">
              {pedido.freteServico}
              {pedido.freteTransportadora && ` · ${pedido.freteTransportadora}`}
              {prazoDoFrete && ` · ${prazoDoFrete} após a postagem`}
            </p>
          )}
          {pedido.codigoRastreio && (
            <p className="mt-3 text-[15px]">
              Código de rastreio:{" "}
              <span className="font-semibold">{pedido.codigoRastreio}</span>
            </p>
          )}
        </section>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Botao href="/conta" variante="secundario">
            Meus pedidos
          </Botao>
          <Botao href="/produtos" variante="secundario">
            Continuar comprando
          </Botao>
        </div>
      </div>
    </div>
  );
}
