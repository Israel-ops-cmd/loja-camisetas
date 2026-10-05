"use server";

import { redirect } from "next/navigation";

import { precoComDesconto } from "@/lib/atacado-regras";
import { obterUsuario } from "@/lib/auth";
import { gravarItensDoCarrinho, obterCarrinho } from "@/lib/carrinho";
import { buscarCep, normalizarCep, type EnderecoDoCep } from "@/lib/cep";
import {
  criarPedidoComEntrega,
  pedidoDaChave,
  validarDadosDoPedido,
  type ResultadoDoPedido,
} from "@/lib/criar-pedido";
import { cotarFreteDoCarrinho, type CotacaoDoCarrinho } from "@/lib/frete";

// Server Actions são endpoints públicos. Nada do que vem do navegador é
// confiado: carrinho, estoque, preços e frete são recalculados aqui.

export async function buscarEnderecoPorCep(
  cep: unknown,
): Promise<{ ok: true; endereco: EnderecoDoCep } | { ok: false; erro: string }> {
  const cepNormalizado = normalizarCep(cep);
  if (!cepNormalizado) return { ok: false, erro: "Digite um CEP com 8 números." };

  try {
    const endereco = await buscarCep(cepNormalizado);
    if (!endereco) return { ok: false, erro: "Esse CEP não existe. Confira o número." };
    return { ok: true, endereco };
  } catch {
    return {
      ok: false,
      erro: "Não conseguimos buscar o CEP agora. Preencha o endereço à mão.",
    };
  }
}

export async function cotarFreteDoCheckout(
  cep: unknown,
): Promise<CotacaoDoCarrinho | { ok: false; cep: string; erro: string }> {
  const cepNormalizado = normalizarCep(cep);
  if (!cepNormalizado) {
    return { ok: false, cep: "", erro: "Digite um CEP com 8 números." };
  }
  const carrinho = await obterCarrinho();
  return cotarFreteDoCarrinho(carrinho, cepNormalizado, null);
}

export async function finalizarPedido(
  dados: unknown,
): Promise<ResultadoDoPedido> {
  const usuario = await obterUsuario();
  if (!usuario) {
    return { erro: "Sua sessão expirou. Entre de novo para finalizar." };
  }

  const validacao = validarDadosDoPedido(dados);
  if (!validacao.ok) return validacao.resultado;

  // Clique duplo ou reenvio: devolve o pedido já criado com essa chave.
  const existente = await pedidoDaChave(validacao.dados.chave);
  if (existente) {
    if (existente.clienteId !== usuario.id) {
      return { erro: "Não foi possível finalizar. Recarregue a página." };
    }
    redirect(`/pedidos/${existente.numero}?novo=1`);
  }

  // Carrinho conferido de novo no banco.
  const carrinho = await obterCarrinho();
  if (carrinho.itens.length === 0) {
    return { erro: "Seu carrinho está vazio.", revisarCarrinho: true };
  }
  if (carrinho.precisaSincronizar || carrinho.itens.some((i) => i.esgotado)) {
    return {
      erro: "Algum item do carrinho mudou de estoque ou saiu da loja. Revise o carrinho antes de finalizar.",
      revisarCarrinho: true,
    };
  }

  const resultado = await criarPedidoComEntrega({
    usuario,
    dados: validacao.dados,
    itens: carrinho.itens.map((item) => ({
      variacaoId: item.variacaoId,
      quantidade: item.quantidade,
      precoUnitarioEmCentavos: item.precoUnitarioEmCentavos,
      nomeProduto: item.produto.nome,
      nomeCor: item.cor.nome,
      nomeTamanho: item.tamanho,
      sku: item.sku,
    })),
    pacotes: carrinho.itens.map((item) => ({
      id: item.variacaoId,
      ...item.pacote,
      valorEmCentavos: precoComDesconto(item.precoUnitarioEmCentavos, carrinho.atacado.percentual),
      quantidade: item.quantidade,
    })),
    // Recalculado no servidor a partir do carrinho, nunca vindo do navegador.
    descontoPercentual: carrinho.atacado.percentual,
  });
  if (!resultado.ok) {
    return {
      erro: resultado.erro,
      campos: resultado.campos,
      recotarFrete: resultado.recotarFrete,
    };
  }

  // Os itens agora estão no pedido. O estoque só baixa quando o pagamento
  // for confirmado pelo Mercado Pago.
  await gravarItensDoCarrinho([]);
  redirect(`/pedidos/${resultado.numero}?novo=1`);
}
