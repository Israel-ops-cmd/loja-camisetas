import "server-only";

import { createHmac, timingSafeEqual } from "node:crypto";

// API do Mercado Pago (Checkout Pro). Chamadas diretas, sem SDK.
// Preferências: https://www.mercadopago.com.br/developers/pt/reference/preferences/_checkout_preferences/post
// Webhooks:     https://www.mercadopago.com.br/developers/pt/docs/checkout-pro/payment-notifications

const API = "https://api.mercadopago.com";
const TEMPO_LIMITE_MS = 10_000;

export class ErroMercadoPago extends Error {}

function token() {
  const valor = process.env.MERCADO_PAGO_ACCESS_TOKEN;
  if (!valor) throw new Error("Defina MERCADO_PAGO_ACCESS_TOKEN no .env.local.");
  return valor;
}

async function chamar<T>(caminho: string, opcoes: RequestInit = {}): Promise<T> {
  let resposta: Response;
  try {
    resposta = await fetch(`${API}${caminho}`, {
      ...opcoes,
      headers: {
        Authorization: `Bearer ${token()}`,
        "Content-Type": "application/json",
        ...opcoes.headers,
      },
      signal: AbortSignal.timeout(TEMPO_LIMITE_MS),
      cache: "no-store",
    });
  } catch (erro) {
    console.error(`[mercado-pago] falha de rede em ${caminho}:`, erro);
    throw new ErroMercadoPago("O Mercado Pago não respondeu. Tente de novo em instantes.");
  }

  if (!resposta.ok) {
    console.error(
      `[mercado-pago] ${opcoes.method ?? "GET"} ${caminho} respondeu ${resposta.status}:`,
      (await resposta.text()).slice(0, 800),
    );
    throw new ErroMercadoPago("Não conseguimos falar com o Mercado Pago agora. Tente de novo em instantes.");
  }
  return resposta.json() as Promise<T>;
}

// ---------------------------------------------------------------- Cobrança

export type DadosDaCobranca = {
  pedidoId: string;
  numero: number;
  itens: { sku: string; titulo: string; quantidade: number; precoEmCentavos: number }[];
  freteEmCentavos: number;
  comprador: { nome: string; email: string; cpf: string; telefone: string };
  expiraEm: Date;
  /** Endereço do site (https://...), para o retorno e o webhook. */
  origem: string;
  /** Até quantas parcelas no cartão. */
  maximoDeParcelas: number;
};

export async function criarCobranca(dados: DadosDaCobranca) {
  const https = dados.origem.startsWith("https://");
  const voltar = (retorno: string) =>
    `${dados.origem}/pedidos/${dados.numero}?retorno=${retorno}`;
  const [nome, ...sobrenome] = dados.comprador.nome.trim().split(/\s+/);

  const preferencia = await chamar<{ id: string; init_point: string }>(
    "/checkout/preferences",
    {
      method: "POST",
      body: JSON.stringify({
        external_reference: dados.pedidoId,
        items: dados.itens.map((item) => ({
          id: item.sku,
          title: item.titulo,
          quantity: item.quantidade,
          unit_price: item.precoEmCentavos / 100,
          currency_id: "BRL",
        })),
        shipments: { mode: "not_specified", cost: dados.freteEmCentavos / 100 },
        payer: {
          name: nome,
          surname: sobrenome.join(" "),
          email: dados.comprador.email,
          identification: { type: "CPF", number: dados.comprador.cpf },
          phone: {
            area_code: dados.comprador.telefone.slice(0, 2),
            number: dados.comprador.telefone.slice(2),
          },
        },
        payment_methods: { installments: dados.maximoDeParcelas },
        back_urls: {
          success: voltar("aprovado"),
          pending: voltar("pendente"),
          failure: voltar("recusado"),
        },
        // O Mercado Pago só aceita retorno automático e webhook em https.
        ...(https && {
          auto_return: "approved",
          notification_url: `${dados.origem}/api/mercado-pago/webhook`,
        }),
        statement_descriptor: "CARTAVIVA",
        expires: true,
        expiration_date_from: new Date().toISOString(),
        expiration_date_to: dados.expiraEm.toISOString(),
        // Vencimento do Pix e do boleto.
        date_of_expiration: dados.expiraEm.toISOString(),
        metadata: { pedido_numero: dados.numero },
      }),
    },
  );

  return { preferenciaId: preferencia.id, link: preferencia.init_point };
}

// ---------------------------------------------------------------- Pagamento

export type PagamentoMercadoPago = {
  id: number;
  status: string;
  status_detail: string;
  external_reference: string | null;
  transaction_amount: number;
  currency_id: string;
  payment_type_id: string;
  payment_method_id: string;
  date_approved: string | null;
};

export function buscarPagamento(id: string) {
  return chamar<PagamentoMercadoPago>(`/v1/payments/${encodeURIComponent(id)}`);
}

/** Pagamentos ligados a um pedido (pela referência externa). */
export async function buscarPagamentosDoPedido(pedidoId: string) {
  const resultado = await chamar<{ results: PagamentoMercadoPago[] }>(
    `/v1/payments/search?external_reference=${encodeURIComponent(pedidoId)}&sort=date_created&criteria=desc&limit=10`,
  );
  return resultado.results ?? [];
}

// ---------------------------------------------------------------- Webhook

/**
 * Confere a assinatura do aviso (cabeçalho x-signature: "ts=...,v1=...").
 * Modelo assinado: "id:<data.id>;request-id:<x-request-id>;ts:<ts>;",
 * com HMAC SHA-256 e a chave secreta do webhook. Partes ausentes são omitidas.
 */
export function assinaturaValida({
  assinatura,
  idDaRequisicao,
  idDoRecurso,
}: {
  assinatura: string | null;
  idDaRequisicao: string | null;
  idDoRecurso: string | null;
}) {
  const segredo = process.env.MERCADO_PAGO_WEBHOOK_SECRET;
  if (!segredo || !assinatura) return false;

  const partes = Object.fromEntries(
    assinatura.split(",").map((parte) => {
      const [chave, ...valor] = parte.trim().split("=");
      return [chave, valor.join("=")];
    }),
  );
  const { ts, v1 } = partes;
  if (!ts || !v1) return false;

  let modelo = "";
  if (idDoRecurso) modelo += `id:${idDoRecurso.toLowerCase()};`;
  if (idDaRequisicao) modelo += `request-id:${idDaRequisicao};`;
  modelo += `ts:${ts};`;

  const esperado = createHmac("sha256", segredo).update(modelo).digest("hex");
  const a = Buffer.from(esperado, "hex");
  const b = Buffer.from(v1, "hex");
  return a.length === b.length && timingSafeEqual(a, b);
}
