"use server";

import { refresh } from "next/cache";

import {
  conferirCarrinho,
  gravarItensDoCarrinho,
  lerItensDoCarrinho,
  obterCarrinho,
} from "@/lib/carrinho";
import { ehIdDeVariacao, MAXIMO_DE_ITENS } from "@/lib/carrinho-cookie";
import { normalizarCep } from "@/lib/cep";
import {
  apagarEscolhaDeFrete,
  cotarFreteDoCarrinho,
  gravarEscolhaDeFrete,
  lerEscolhaDeFrete,
} from "@/lib/frete";

// Server Actions são endpoints públicos: tudo que chega do navegador é
// validado aqui, e estoque e disponibilidade são conferidos no banco.

export type ResultadoCarrinho =
  | { ok: true; quantidadeNoCarrinho: number }
  | { ok: false; erro: string };

function ehQuantidade(valor: unknown): valor is number {
  return typeof valor === "number" && Number.isInteger(valor) && valor >= 0;
}

function unidades(n: number) {
  return n === 1 ? "1 unidade" : `${n} unidades`;
}

export async function adicionarAoCarrinho(
  variacaoId: unknown,
  quantidade: unknown,
): Promise<ResultadoCarrinho> {
  if (!ehIdDeVariacao(variacaoId) || !ehQuantidade(quantidade) || quantidade < 1) {
    return { ok: false, erro: "Escolha a cor, o tamanho e a quantidade." };
  }

  const id = variacaoId.toLowerCase();
  const itens = await lerItensDoCarrinho();
  const existente = itens.find((item) => item.variacaoId === id);
  const jaNoCarrinho = existente?.quantidade ?? 0;

  // Confere o carrinho inteiro: outras artes podem usar as mesmas peças lisas.
  const comONovo = existente
    ? itens.map((i) => (i === existente ? { ...i, quantidade: jaNoCarrinho + quantidade } : i))
    : [...itens, { variacaoId: id, quantidade }];
  const divisao = (await conferirCarrinho(comONovo)).get(id);
  if (!divisao) {
    return { ok: false, erro: "Esse produto não está mais disponível." };
  }
  if (divisao.limite <= 0) {
    return { ok: false, erro: "Esse tamanho acabou de esgotar." };
  }
  if (jaNoCarrinho + quantidade > divisao.limite) {
    const restante = divisao.limite - jaNoCarrinho;
    return {
      ok: false,
      erro:
        jaNoCarrinho > 0
          ? restante > 0
            ? `Você já tem ${unidades(jaNoCarrinho)} na sacola. Dá para adicionar mais ${unidades(restante)}.`
            : `Você já tem na sacola todo o estoque desse tamanho (${unidades(divisao.limite)}).`
          : `Só temos ${unidades(divisao.limite)} desse tamanho.`,
    };
  }

  if (!existente && itens.length >= MAXIMO_DE_ITENS) {
    return {
      ok: false,
      erro: "A sacola chegou ao limite de itens diferentes. Finalize ou remova algum item.",
    };
  }

  if (existente) {
    existente.quantidade += quantidade;
  } else {
    itens.push({ variacaoId: id, quantidade });
  }
  await gravarItensDoCarrinho(itens);

  return { ok: true, quantidadeNoCarrinho: jaNoCarrinho + quantidade };
}

/** Quantidade 0 remove o item. */
export async function alterarQuantidade(
  variacaoId: unknown,
  quantidade: unknown,
): Promise<ResultadoCarrinho> {
  if (!ehIdDeVariacao(variacaoId) || !ehQuantidade(quantidade)) {
    return { ok: false, erro: "Quantidade inválida." };
  }
  if (quantidade === 0) return removerDoCarrinho(variacaoId);

  const itens = await lerItensDoCarrinho();
  const item = itens.find((i) => i.variacaoId === variacaoId.toLowerCase());
  if (!item) return { ok: false, erro: "Esse item não está na sacola." };

  const divisao = (
    await conferirCarrinho(itens.map((i) => (i === item ? { ...i, quantidade } : i)))
  ).get(item.variacaoId);
  if (!divisao || divisao.limite <= 0) {
    refresh();
    return { ok: false, erro: "Esse item esgotou. Remova-o da sacola." };
  }
  if (quantidade > divisao.limite) {
    return {
      ok: false,
      erro: `Só temos ${unidades(divisao.limite)} desse tamanho.`,
    };
  }

  item.quantidade = quantidade;
  await gravarItensDoCarrinho(itens);
  refresh();

  return { ok: true, quantidadeNoCarrinho: quantidade };
}

export async function removerDoCarrinho(
  variacaoId: unknown,
): Promise<ResultadoCarrinho> {
  if (!ehIdDeVariacao(variacaoId)) {
    return { ok: false, erro: "Item inválido." };
  }

  const itens = await lerItensDoCarrinho();
  await gravarItensDoCarrinho(
    itens.filter((item) => item.variacaoId !== variacaoId.toLowerCase()),
  );
  refresh();

  return { ok: true, quantidadeNoCarrinho: 0 };
}

/**
 * Grava no cookie as correções que a página do carrinho mostrou
 * (itens indisponíveis removidos, quantidades reduzidas ao estoque).
 */
export async function sincronizarCarrinho(): Promise<void> {
  const carrinho = await obterCarrinho();
  if (!carrinho.precisaSincronizar) return;

  await gravarItensDoCarrinho(
    carrinho.itens.map(({ variacaoId, quantidade }) => ({
      variacaoId,
      quantidade,
    })),
  );
}

// ---------------------------------------------------------------- Frete

export type ResultadoFrete = { ok: true } | { ok: false; erro: string };

/** Cota o frete para o CEP e guarda o CEP com a opção mais barata. */
export async function calcularFrete(cep: unknown): Promise<ResultadoFrete> {
  const cepNormalizado = normalizarCep(cep);
  if (!cepNormalizado) {
    return { ok: false, erro: "Digite um CEP com 8 números." };
  }

  const carrinho = await obterCarrinho();
  const cotacao = await cotarFreteDoCarrinho(carrinho, cepNormalizado, null);
  if (!cotacao.ok) return { ok: false, erro: cotacao.erro };

  await gravarEscolhaDeFrete({
    cep: cepNormalizado,
    servicoId: cotacao.escolhida.servicoId,
  });
  refresh();
  return { ok: true };
}

/** Troca a opção de entrega. O preço é recotado ao renderizar a página. */
export async function escolherFrete(servicoId: unknown): Promise<ResultadoFrete> {
  const escolha = await lerEscolhaDeFrete();
  if (!escolha) return { ok: false, erro: "Calcule o frete primeiro." };
  if (
    typeof servicoId !== "number" ||
    !Number.isInteger(servicoId) ||
    servicoId <= 0
  ) {
    return { ok: false, erro: "Opção de entrega inválida." };
  }

  await gravarEscolhaDeFrete({ cep: escolha.cep, servicoId });
  refresh();
  return { ok: true };
}

/** "Trocar CEP": esquece o CEP guardado. */
export async function limparFrete(): Promise<void> {
  await apagarEscolhaDeFrete();
  refresh();
}
