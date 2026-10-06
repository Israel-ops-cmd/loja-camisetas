"use server";

import { refresh } from "next/cache";
import { z } from "zod";

import {
  cancelarEtiqueta as cancelarNoMelhorEnvio,
  comprarEtiqueta as comprarNoMelhorEnvio,
  cotarEtiqueta,
  ErroDoMelhorEnvio,
  ETIQUETA_ATIVA,
  linkParaImprimir,
  situacaoDaEtiqueta,
} from "@/lib/etiquetas";
import { formatarPreco } from "@/lib/formatacao";
import { administradorDaAcao, SEM_PERMISSAO } from "@/lib/painel";
import { registrar } from "@/lib/pagamento";
import { prisma } from "@/lib/prisma";

// Ações da etiqueta de envio no painel. Cada uma confere se quem chama é
// administrador. Comprar gasta saldo da carteira do Melhor Envio: só depois de
// a pessoa ver o preço e confirmar.

type Falha = { ok: false; erro: string };
const NAO_ENCONTRADO: Falha = { ok: false, erro: "Pedido não encontrado. Volte para a lista e abra de novo." };
/** Diferença de preço (centavos) a partir da qual a compra pede nova confirmação. */
const TOLERANCIA_DE_PRECO = 100;

function mensagem(erro: unknown) {
  if (erro instanceof ErroDoMelhorEnvio) return erro.message;
  console.error("[etiqueta]", erro);
  return "Algo deu errado ao falar com o Melhor Envio. Tente de novo em instantes.";
}

async function pedidoDoPainel(numero: unknown) {
  if (typeof numero !== "number" || !Number.isInteger(numero) || numero <= 0) return null;
  return prisma.pedido.findUnique({
    where: { numero },
    select: { id: true, status: true, melhorEnvioEtiquetaId: true, freteServicoId: true },
  });
}

const PODE_TER_ETIQUETA = ["PAGO", "EM_SEPARACAO"];

/** Preço atual da etiqueta, para mostrar antes de comprar. */
export async function prepararEtiqueta(numero: unknown): Promise<{ ok: true; precoEmCentavos: number } | Falha> {
  if (!(await administradorDaAcao())) return { ok: false, erro: SEM_PERMISSAO };
  const pedido = await pedidoDoPainel(numero);
  if (!pedido) return NAO_ENCONTRADO;
  if (!PODE_TER_ETIQUETA.includes(pedido.status)) return { ok: false, erro: "A etiqueta só pode ser comprada para pedido pago que ainda não foi enviado." };
  try {
    const { precoEmCentavos } = await cotarEtiqueta(pedido.id);
    return { ok: true, precoEmCentavos };
  } catch (erro) {
    return { ok: false, erro: mensagem(erro) };
  }
}

export async function comprarEtiqueta(
  numero: unknown,
  dados: unknown,
): Promise<{ ok: true; mensagem: string } | { ok: false; erro: string; novoPreco?: number }> {
  const admin = await administradorDaAcao();
  if (!admin) return { ok: false, erro: SEM_PERMISSAO };
  const pedido = await pedidoDoPainel(numero);
  const validacao = z.object({ precoVisto: z.number().int().nonnegative() }).safeParse(dados);
  if (!pedido || !validacao.success) return NAO_ENCONTRADO;
  if (!PODE_TER_ETIQUETA.includes(pedido.status)) return { ok: false, erro: "A etiqueta só pode ser comprada para pedido pago que ainda não foi enviado." };

  try {
    // Ainda sem envio no Melhor Envio: confere se o preço continua o que a pessoa viu.
    if (!pedido.melhorEnvioEtiquetaId) {
      const { precoEmCentavos } = await cotarEtiqueta(pedido.id);
      if (precoEmCentavos > validacao.data.precoVisto + TOLERANCIA_DE_PRECO) {
        return {
          ok: false,
          novoPreco: precoEmCentavos,
          erro: `O preço da etiqueta mudou para ${formatarPreco(precoEmCentavos)}. Confira e confirme de novo.`,
        };
      }
    }
    const situacao = await comprarNoMelhorEnvio(pedido.id, admin.nome);
    refresh();
    return {
      ok: true,
      mensagem:
        situacao.status === "generated"
          ? "Etiqueta comprada e pronta. Toque em “Imprimir etiqueta”."
          : "Etiqueta comprada. Ela fica pronta para imprimir em instantes: toque em “Atualizar” se o botão de imprimir não aparecer.",
    };
  } catch (erro) {
    refresh();
    return { ok: false, erro: mensagem(erro) };
  }
}

export async function imprimirEtiqueta(numero: unknown): Promise<{ ok: true; url: string } | Falha> {
  if (!(await administradorDaAcao())) return { ok: false, erro: SEM_PERMISSAO };
  const pedido = await pedidoDoPainel(numero);
  if (!pedido?.melhorEnvioEtiquetaId) return NAO_ENCONTRADO;
  try {
    const situacao = await situacaoDaEtiqueta(pedido.melhorEnvioEtiquetaId);
    if (!ETIQUETA_ATIVA.includes(situacao.status)) {
      return { ok: false, erro: `A etiqueta está "${situacao.rotulo}" e não pode ser impressa.` };
    }
    return { ok: true, url: await linkParaImprimir(pedido.melhorEnvioEtiquetaId) };
  } catch (erro) {
    return { ok: false, erro: mensagem(erro) };
  }
}

/** Relê a situação no Melhor Envio (geração e código de rastreio). */
export async function atualizarEtiqueta(numero: unknown): Promise<{ ok: true; mensagem: string } | Falha> {
  if (!(await administradorDaAcao())) return { ok: false, erro: SEM_PERMISSAO };
  const pedido = await pedidoDoPainel(numero);
  if (!pedido?.melhorEnvioEtiquetaId) return NAO_ENCONTRADO;
  try {
    const situacao = await situacaoDaEtiqueta(pedido.melhorEnvioEtiquetaId);
    refresh();
    return { ok: true, mensagem: `Etiqueta: ${situacao.rotulo.toLowerCase()}.${situacao.rastreio ? ` Rastreio ${situacao.rastreio}.` : ""}` };
  } catch (erro) {
    return { ok: false, erro: mensagem(erro) };
  }
}

/** Cancela a etiqueta (antes de postar). O valor volta para a carteira do Melhor Envio. */
export async function cancelarEtiqueta(numero: unknown, dados: unknown): Promise<{ ok: true; mensagem: string } | Falha> {
  const admin = await administradorDaAcao();
  if (!admin) return { ok: false, erro: SEM_PERMISSAO };
  const pedido = await pedidoDoPainel(numero);
  const validacao = z
    .object({ motivo: z.string().trim().min(5, "Escreva o motivo em poucas palavras.").max(200, "Motivo longo demais.") })
    .safeParse(dados);
  if (!pedido?.melhorEnvioEtiquetaId) return NAO_ENCONTRADO;
  if (!validacao.success) return { ok: false, erro: validacao.error.issues[0].message };

  const envioId = pedido.melhorEnvioEtiquetaId;
  try {
    await cancelarNoMelhorEnvio(envioId, validacao.data.motivo);
  } catch (erro) {
    return { ok: false, erro: mensagem(erro) };
  }
  await prisma.$transaction(async (tx) => {
    await tx.pedido.updateMany({ where: { id: pedido.id, melhorEnvioEtiquetaId: envioId }, data: { melhorEnvioEtiquetaId: null } });
    await registrar(tx, pedido.id, `Etiqueta do Melhor Envio cancelada. Motivo: ${validacao.data.motivo}`, admin.nome);
  });
  refresh();
  return { ok: true, mensagem: "Etiqueta cancelada. O valor volta para a carteira do Melhor Envio." };
}
