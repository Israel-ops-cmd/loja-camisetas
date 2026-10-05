import "server-only";

import { unstable_cache } from "next/cache";
import { cookies } from "next/headers";

import { precoComDesconto } from "@/lib/atacado-regras";
import type { Carrinho } from "@/lib/carrinho";
import { buscarCep, normalizarCep, type EnderecoDoCep } from "@/lib/cep";
import {
  cotarNoMelhorEnvio,
  ErroDeFrete,
  type OpcaoDeFrete,
  type PacoteDoItem,
} from "@/lib/melhor-envio";

const NOME_COOKIE_FRETE = "frete";
const TRINTA_DIAS = 60 * 60 * 24 * 30;
const MENSAGEM_GENERICA =
  "Não conseguimos calcular o frete agora. Tente de novo em instantes.";

/** O cookie guarda só o CEP e o serviço escolhido. O preço é sempre recotado. */
export type EscolhaDeFrete = { cep: string; servicoId: number | null };

export async function lerEscolhaDeFrete(): Promise<EscolhaDeFrete | null> {
  const valor = (await cookies()).get(NOME_COOKIE_FRETE)?.value;
  const [cepTexto, servicoTexto] = (valor ?? "").split(":");
  const cep = normalizarCep(cepTexto);
  if (!cep) return null;

  const servicoId = Number(servicoTexto);
  return {
    cep,
    servicoId: Number.isInteger(servicoId) && servicoId > 0 ? servicoId : null,
  };
}

/** Só funciona em Server Actions e Route Handlers. */
export async function gravarEscolhaDeFrete(escolha: EscolhaDeFrete) {
  (await cookies()).set(
    NOME_COOKIE_FRETE,
    `${escolha.cep}:${escolha.servicoId ?? ""}`,
    {
      path: "/",
      maxAge: TRINTA_DIAS,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      httpOnly: true,
    },
  );
}

export async function apagarEscolhaDeFrete() {
  (await cookies()).delete(NOME_COOKIE_FRETE);
}

function pacotesDoCarrinho(carrinho: Carrinho): PacoteDoItem[] {
  return carrinho.itens
    .filter((item) => !item.esgotado && item.quantidade > 0)
    .map((item) => ({
      id: item.variacaoId,
      ...item.pacote,
      // Valor declarado (seguro) com o desconto de atacado, igual ao do checkout.
      valorEmCentavos: precoComDesconto(item.precoUnitarioEmCentavos, carrinho.atacado.percentual),
      quantidade: item.quantidade,
    }));
}

/**
 * Mesmo CEP com o mesmo carrinho dá a mesma cotação por 10 minutos, sem
 * chamar o Melhor Envio de novo. Erros não ficam guardados.
 */
const cotarComCache = unstable_cache(cotarNoMelhorEnvio, ["melhor-envio"], {
  revalidate: 600,
});

export type CotacaoDoCarrinho =
  | {
      ok: true;
      cep: string;
      endereco: EnderecoDoCep | null;
      opcoes: OpcaoDeFrete[];
      escolhida: OpcaoDeFrete;
    }
  | { ok: false; cep: string; erro: string };

export function cotarFreteDoCarrinho(
  carrinho: Carrinho,
  cep: string,
  servicoId: number | null,
): Promise<CotacaoDoCarrinho> {
  return cotarFrete(pacotesDoCarrinho(carrinho), cep, servicoId);
}

/** Cota qualquer conjunto de pacotes (carrinho ou personalização). */
export async function cotarFrete(
  pacotes: PacoteDoItem[],
  cep: string,
  servicoId: number | null,
): Promise<CotacaoDoCarrinho> {
  if (pacotes.length === 0) {
    return { ok: false, cep, erro: "Adicione produtos para calcular o frete." };
  }

  // O ViaCEP só confirma o CEP e mostra a cidade. Se ele estiver fora do ar,
  // a cotação segue mesmo assim.
  let endereco: EnderecoDoCep | null = null;
  try {
    endereco = await buscarCep(cep);
    if (!endereco) {
      return { ok: false, cep, erro: "Esse CEP não existe. Confira o número." };
    }
  } catch (erro) {
    console.error("[frete] ViaCEP indisponível:", erro);
  }

  try {
    const opcoes = await cotarComCache(cep, pacotes);
    const escolhida =
      opcoes.find((opcao) => opcao.servicoId === servicoId) ?? opcoes[0];
    return { ok: true, cep, endereco, opcoes, escolhida };
  } catch (erro) {
    if (erro instanceof ErroDeFrete) {
      return { ok: false, cep, erro: erro.message };
    }
    console.error("[frete] erro inesperado na cotação:", erro);
    return { ok: false, cep, erro: MENSAGEM_GENERICA };
  }
}
