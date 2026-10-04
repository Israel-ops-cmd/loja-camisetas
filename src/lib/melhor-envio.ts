import "server-only";

// Cotação de frete na API do Melhor Envio.
// Documentação: https://docs.melhorenvio.com.br/reference/calculo-de-fretes-por-produtos

const TEMPO_LIMITE_MS = 8000;

export class ErroDeFrete extends Error {}

export type PacoteDoItem = {
  id: string;
  pesoEmGramas: number;
  larguraCm: number;
  alturaCm: number;
  comprimentoCm: number;
  /** Valor declarado de uma unidade, em centavos (seguro). */
  valorEmCentavos: number;
  quantidade: number;
};

export type OpcaoDeFrete = {
  /** ID do serviço no Melhor Envio (1 = PAC, 2 = SEDEX...). */
  servicoId: number;
  servico: string;
  transportadora: string;
  precoEmCentavos: number;
  prazoMinimoDias: number;
  prazoMaximoDias: number;
};

type ServicoDaApi = {
  id: number;
  name: string;
  company?: { name?: string };
  custom_price?: string;
  price?: string;
  custom_delivery_time?: number;
  delivery_time?: number;
  custom_delivery_range?: { min: number; max: number };
  delivery_range?: { min: number; max: number };
  error?: string;
};

function configuracao() {
  const {
    MELHOR_ENVIO_TOKEN: token,
    MELHOR_ENVIO_AMBIENTE: ambiente,
    MELHOR_ENVIO_CEP_ORIGEM: cepOrigem,
    MELHOR_ENVIO_EMAIL_CONTATO: email,
  } = process.env;

  if (!token || !cepOrigem || !email) {
    throw new Error(
      "Melhor Envio não configurado: defina MELHOR_ENVIO_TOKEN, MELHOR_ENVIO_CEP_ORIGEM e MELHOR_ENVIO_EMAIL_CONTATO.",
    );
  }

  return {
    token,
    cepOrigem: cepOrigem.replace(/\D/g, ""),
    email,
    url:
      ambiente === "producao"
        ? "https://melhorenvio.com.br"
        : "https://sandbox.melhorenvio.com.br",
  };
}

function emCentavos(valor: string | undefined) {
  const numero = Number(valor);
  return Number.isFinite(numero) ? Math.round(numero * 100) : null;
}

/**
 * Cota o frete para um CEP. Usa o preço e o prazo personalizados da conta
 * (`custom_*`), que já incluem os ajustes feitos no painel do Melhor Envio.
 * Lança `ErroDeFrete` com uma mensagem que pode ser mostrada ao cliente.
 */
export async function cotarNoMelhorEnvio(
  cepDestino: string,
  itens: PacoteDoItem[],
): Promise<OpcaoDeFrete[]> {
  const config = configuracao();

  let resposta: Response;
  try {
    resposta = await fetch(`${config.url}/api/v2/me/shipment/calculate`, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        Authorization: `Bearer ${config.token}`,
        "User-Agent": `Carta Viva Camisetas (${config.email})`,
      },
      body: JSON.stringify({
        from: { postal_code: config.cepOrigem },
        to: { postal_code: cepDestino },
        products: itens.map((item) => ({
          id: item.id,
          width: item.larguraCm,
          height: item.alturaCm,
          length: item.comprimentoCm,
          weight: item.pesoEmGramas / 1000,
          insurance_value: item.valorEmCentavos / 100,
          quantity: item.quantidade,
        })),
      }),
      signal: AbortSignal.timeout(TEMPO_LIMITE_MS),
      cache: "no-store",
    });
  } catch (erro) {
    console.error("[frete] falha ao chamar o Melhor Envio:", erro);
    throw new ErroDeFrete(
      "Não conseguimos calcular o frete agora. Tente de novo em instantes.",
    );
  }

  if (resposta.status === 422) {
    throw new ErroDeFrete("Confira o CEP e tente de novo.");
  }
  if (!resposta.ok) {
    console.error(
      `[frete] Melhor Envio respondeu ${resposta.status}:`,
      (await resposta.text()).slice(0, 500),
    );
    throw new ErroDeFrete(
      "Não conseguimos calcular o frete agora. Tente de novo em instantes.",
    );
  }

  const servicos: unknown = await resposta.json().catch(() => null);
  if (!Array.isArray(servicos)) {
    console.error("[frete] resposta inesperada do Melhor Envio:", servicos);
    throw new ErroDeFrete(
      "Não conseguimos calcular o frete agora. Tente de novo em instantes.",
    );
  }

  const opcoes: OpcaoDeFrete[] = [];

  for (const servico of servicos as ServicoDaApi[]) {
    if (servico.error) continue;
    const preco = emCentavos(servico.custom_price ?? servico.price);
    const faixa = servico.custom_delivery_range ?? servico.delivery_range;
    const prazo = servico.custom_delivery_time ?? servico.delivery_time;
    if (preco === null || prazo === undefined) continue;

    opcoes.push({
      servicoId: servico.id,
      servico: servico.name,
      transportadora: servico.company?.name ?? "",
      precoEmCentavos: preco,
      prazoMinimoDias: faixa?.min ?? prazo,
      prazoMaximoDias: faixa?.max ?? prazo,
    });
  }

  if (opcoes.length === 0) {
    throw new ErroDeFrete(
      "Nenhuma transportadora entrega nesse CEP. Confira o número ou fale com a gente.",
    );
  }

  return opcoes.sort((a, b) => a.precoEmCentavos - b.precoEmCentavos);
}
