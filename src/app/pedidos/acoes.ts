"use server";

import { redirect } from "next/navigation";

import { obterUsuario } from "@/lib/auth";
import {
  criarCobranca,
  ErroMercadoPago,
  valorDaCobranca,
} from "@/lib/mercado-pago";
import { origemDoSite } from "@/lib/origem";
import { MAXIMO_DE_PARCELAS, prazoDePagamento } from "@/lib/pagamento";
import { prisma } from "@/lib/prisma";

export type ResultadoPagar = { erro: string };

/** Leva o cliente para o Mercado Pago. Reaproveita a cobrança já criada. */
export async function pagarPedido(numero: unknown): Promise<ResultadoPagar> {
  const usuario = await obterUsuario();
  if (!usuario) return { erro: "Sua sessão expirou. Entre de novo para pagar." };
  if (typeof numero !== "number" || !Number.isInteger(numero)) {
    return { erro: "Pedido inválido." };
  }

  const pedido = await prisma.pedido.findFirst({
    where: { numero, clienteId: usuario.id },
    include: { itens: true },
  });
  if (!pedido) return { erro: "Pedido não encontrado." };
  if (pedido.status !== "AGUARDANDO_PAGAMENTO") {
    return { erro: "Esse pedido não está aguardando pagamento." };
  }

  const expiraEm = prazoDePagamento(pedido.criadoEm);
  if (expiraEm <= new Date()) {
    return {
      erro: "O prazo para pagar esse pedido terminou. Monte o carrinho de novo para fazer um novo pedido.",
    };
  }

  if (pedido.mercadoPagoStatus === "valor_divergente") {
    return {
      erro: "Recebemos um pagamento com valor diferente do pedido e estamos verificando. Fale com a gente antes de pagar de novo.",
    };
  }

  // Só reaproveita a cobrança se ela cobrar exatamente o total do pedido.
  let link = pedido.mercadoPagoLink;
  if (
    link &&
    pedido.mercadoPagoPreferenciaId &&
    (await valorDaCobranca(pedido.mercadoPagoPreferenciaId)) !== pedido.totalEmCentavos
  ) {
    link = null;
  }
  if (!link) {
    try {
      const cobranca = await criarCobranca({
        pedidoId: pedido.id,
        numero: pedido.numero,
        itens: pedido.itens.map((item) => ({
          sku: item.sku,
          titulo: `${item.nomeProduto} (${item.nomeCor}, ${item.nomeTamanho})`,
          quantidade: item.quantidade,
          precoEmCentavos: item.precoUnitarioEmCentavos,
        })),
        freteEmCentavos: pedido.freteEmCentavos,
        comprador: {
          nome: pedido.compradorNome,
          email: pedido.compradorEmail,
          cpf: pedido.compradorCpf,
          telefone: pedido.compradorTelefone,
        },
        expiraEm,
        origem: await origemDoSite(),
        maximoDeParcelas: MAXIMO_DE_PARCELAS,
      });
      link = cobranca.link;
      await prisma.pedido.update({
        where: { id: pedido.id },
        data: {
          mercadoPagoPreferenciaId: cobranca.preferenciaId,
          mercadoPagoLink: cobranca.link,
        },
      });
    } catch (erro) {
      if (erro instanceof ErroMercadoPago) return { erro: erro.message };
      console.error("[pagamento] erro ao criar a cobrança:", erro);
      return { erro: "Não conseguimos abrir o pagamento agora. Tente de novo em instantes." };
    }
  }

  redirect(link);
}
