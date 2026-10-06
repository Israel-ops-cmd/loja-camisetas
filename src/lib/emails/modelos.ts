import "server-only";

import { formatarPreco } from "@/lib/formatacao";
import { formatarData } from "@/lib/pedidos";
import type { ConteudoDoEmail } from "@/lib/emails/envio";

// Modelos dos e-mails. HTML simples em tabelas (o que os programas de e-mail
// entendem), com as cores da identidade e fontes de reserva (e-mail não carrega
// Archivo nem Manrope), e uma versão em texto puro.

const COR = { tinta: "#141414", papel: "#FFFFFF", fundo: "#F1F1EF", borda: "#DEDEDB", lacre: "#C8102E", secundario: "#5A5A5A", apoio: "#3F3F3F" };
const FONTE = "Helvetica, Arial, sans-serif";

export function escapar(texto: string) {
  return texto.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}

/** Parágrafo com texto do usuário: escapa e mantém as quebras de linha. */
function paragrafo(texto: string, estilo = "") {
  return `<p style="margin:0 0 16px;font-size:16px;line-height:1.55;color:${COR.apoio};${estilo}">${escapar(texto).replace(/\n/g, "<br>")}</p>`;
}

type Bloco =
  | { tipo: "texto"; texto: string; destaque?: boolean }
  | { tipo: "botao"; texto: string; url: string }
  | { tipo: "lista"; titulo?: string; linhas: [string, string][]; total?: [string, string] }
  | { tipo: "caixa"; titulo: string; texto: string };

function layout({ titulo, blocos, rodape }: { titulo: string; blocos: Bloco[]; rodape: string }): { html: string; texto: string } {
  const html = blocos
    .map((b) => {
      switch (b.tipo) {
        case "texto":
          return paragrafo(b.texto, b.destaque ? `font-weight:700;color:${COR.tinta};` : "");
        case "botao":
          return `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:8px 0 24px"><tr><td style="border-radius:999px;background:${COR.lacre}"><a href="${escapar(b.url)}" style="display:inline-block;padding:14px 32px;font-family:${FONTE};font-size:15px;font-weight:700;color:${COR.papel};text-decoration:none;border-radius:999px">${escapar(b.texto)}</a></td></tr></table>`;
        case "lista":
          return `${b.titulo ? `<p style="margin:8px 0 8px;font-size:12px;font-weight:700;letter-spacing:.14em;text-transform:uppercase;color:${COR.secundario}">${escapar(b.titulo)}</p>` : ""}<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 20px;border-top:1px solid ${COR.borda}">${b.linhas
            .map(
              ([esq, dir]) =>
                `<tr><td style="padding:10px 0;border-bottom:1px solid ${COR.borda};font-size:15px;color:${COR.tinta}">${escapar(esq)}</td><td align="right" style="padding:10px 0 10px 12px;border-bottom:1px solid ${COR.borda};font-size:15px;color:${COR.tinta};white-space:nowrap">${escapar(dir)}</td></tr>`,
            )
            .join("")}${b.total ? `<tr><td style="padding:12px 0;font-size:16px;font-weight:700;color:${COR.tinta}">${escapar(b.total[0])}</td><td align="right" style="padding:12px 0;font-size:18px;font-weight:800;color:${COR.tinta}">${escapar(b.total[1])}</td></tr>` : ""}</table>`;
        case "caixa":
          return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 20px"><tr><td style="padding:16px 18px;background:${COR.fundo};border-radius:12px"><p style="margin:0 0 6px;font-size:12px;font-weight:700;letter-spacing:.14em;text-transform:uppercase;color:${COR.secundario}">${escapar(b.titulo)}</p><p style="margin:0;font-size:15px;line-height:1.5;color:${COR.tinta}">${escapar(b.texto).replace(/\n/g, "<br>")}</p></td></tr></table>`;
      }
    })
    .join("\n");

  const documento = `<!doctype html>
<html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escapar(titulo)}</title></head>
<body style="margin:0;padding:0;background:${COR.fundo};font-family:${FONTE}">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${COR.fundo}"><tr><td align="center" style="padding:24px 12px">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px">
<tr><td style="padding:8px 4px 20px;font-family:${FONTE}">
<span style="font-size:18px;font-weight:800;letter-spacing:.2em;color:${COR.tinta}">CARTA VIVA</span><span style="display:inline-block;width:8px;height:8px;margin:0 0 2px 6px;border-radius:50%;background:${COR.lacre}"></span><br>
<span style="font-size:10px;font-weight:600;letter-spacing:.42em;color:${COR.secundario}">CAMISETAS</span>
</td></tr>
<tr><td style="background:${COR.papel};border-radius:20px;padding:32px 28px;font-family:${FONTE}">
<h1 style="margin:0 0 20px;font-size:24px;line-height:1.2;font-weight:800;color:${COR.tinta}">${escapar(titulo)}</h1>
${html}
</td></tr>
<tr><td style="padding:20px 4px;font-family:${FONTE};font-size:12px;line-height:1.5;color:${COR.secundario}">${escapar(rodape)}</td></tr>
</table></td></tr></table>
</body></html>`;

  const texto = [
    "CARTA VIVA CAMISETAS",
    "",
    titulo,
    "",
    ...blocos.flatMap((b) => {
      switch (b.tipo) {
        case "texto":
          return [b.texto, ""];
        case "botao":
          return [`${b.texto}: ${b.url}`, ""];
        case "lista":
          return [...(b.titulo ? [b.titulo.toUpperCase()] : []), ...b.linhas.map(([e, d]) => `- ${e}: ${d}`), ...(b.total ? [`${b.total[0]}: ${b.total[1]}`] : []), ""];
        case "caixa":
          return [b.titulo.toUpperCase(), b.texto, ""];
      }
    }),
    "--",
    rodape,
  ].join("\n");

  return { html: documento, texto };
}

const RODAPE_CLIENTE = "Carta Viva Camisetas. Você recebeu este e-mail por causa de um pedido feito no nosso site. Dúvidas? É só responder este e-mail.";
const RODAPE_LOJA = "Aviso automático do site da Carta Viva Camisetas.";

// ---------------------------------------------------------------- Pedidos

export type PedidoParaEmail = {
  numero: number;
  compradorNome: string;
  compradorEmail: string;
  compradorTelefone: string;
  itens: { quantidade: number; nomeProduto: string; nomeCor: string; nomeTamanho: string; precoUnitarioEmCentavos: number }[];
  subtotalEmCentavos: number;
  descontoEmCentavos: number;
  descontoPercentual: number;
  freteEmCentavos: number;
  totalEmCentavos: number;
  entregaDestinatario: string;
  entregaLogradouro: string;
  entregaNumero: string;
  entregaComplemento: string | null;
  entregaBairro: string;
  entregaCidade: string;
  entregaUf: string;
  entregaCep: string;
  freteServico: string | null;
  freteTransportadora: string | null;
  fretePrazoMinimoDias: number | null;
  fretePrazoDias: number | null;
  metodoPagamento: string | null;
  codigoRastreio: string | null;
  motivoCancelamento: string | null;
};

const primeiroNome = (nome: string) => nome.trim().split(/\s+/)[0];
const urlDoPedido = (site: string, numero: number) => `${site}/pedidos/${numero}`;

function resumoDoPedido(p: PedidoParaEmail): Bloco {
  const linhas: [string, string][] = p.itens.map((i) => [
    `${i.quantidade}× ${i.nomeProduto} (${i.nomeCor}, ${i.nomeTamanho})`,
    formatarPreco(i.precoUnitarioEmCentavos * i.quantidade),
  ]);
  if (p.descontoEmCentavos > 0) linhas.push([`Desconto de atacado (${p.descontoPercentual}%)`, `−${formatarPreco(p.descontoEmCentavos)}`]);
  linhas.push([`Frete${p.freteServico ? ` (${p.freteServico})` : ""}`, formatarPreco(p.freteEmCentavos)]);
  return { tipo: "lista", titulo: `Pedido #${p.numero}`, linhas, total: ["Total", formatarPreco(p.totalEmCentavos)] };
}

function enderecoDoPedido(p: PedidoParaEmail): Bloco {
  const cep = `${p.entregaCep.slice(0, 5)}-${p.entregaCep.slice(5)}`;
  return {
    tipo: "caixa",
    titulo: "Entrega",
    texto: `${p.entregaDestinatario}\n${p.entregaLogradouro}, ${p.entregaNumero}${p.entregaComplemento ? `, ${p.entregaComplemento}` : ""}\n${p.entregaBairro} · ${p.entregaCidade}/${p.entregaUf} · ${cep}`,
  };
}

function prazoDoFrete(p: PedidoParaEmail) {
  if (!p.fretePrazoDias) return null;
  const faixa = p.fretePrazoMinimoDias && p.fretePrazoMinimoDias !== p.fretePrazoDias ? `${p.fretePrazoMinimoDias} a ${p.fretePrazoDias}` : String(p.fretePrazoDias);
  return `${faixa} dias úteis depois da postagem`;
}

export function emailPagamentoAprovado(p: PedidoParaEmail, site: string): ConteudoDoEmail {
  const prazo = prazoDoFrete(p);
  return {
    assunto: `Pedido #${p.numero} confirmado`,
    ...layout({
      titulo: `Pagamento aprovado, ${primeiroNome(p.compradorNome)}!`,
      blocos: [
        { tipo: "texto", texto: `Recebemos o pagamento do seu pedido #${p.numero}${p.metodoPagamento ? ` (${p.metodoPagamento})` : ""}. Agora vamos separar as peças com carinho.` },
        { tipo: "texto", texto: `Quando o pedido for postado, mandamos outro e-mail com o código de rastreio.${prazo ? ` O frete leva ${prazo}.` : ""}` },
        resumoDoPedido(p),
        enderecoDoPedido(p),
        { tipo: "botao", texto: "Ver meu pedido", url: urlDoPedido(site, p.numero) },
      ],
      rodape: RODAPE_CLIENTE,
    }),
  };
}

export function emailPedidoEnviado(p: PedidoParaEmail, site: string, linkDeRastreio: string | null): ConteudoDoEmail {
  const prazo = prazoDoFrete(p);
  return {
    assunto: `Pedido #${p.numero} enviado`,
    ...layout({
      titulo: "Seu pedido está a caminho",
      blocos: [
        { tipo: "texto", texto: `Oi, ${primeiroNome(p.compradorNome)}! O pedido #${p.numero} foi postado${p.freteServico ? ` pelo ${p.freteServico}${p.freteTransportadora ? ` (${p.freteTransportadora})` : ""}` : ""}.${prazo ? ` O prazo é de ${prazo}.` : ""}` },
        ...(p.codigoRastreio ? [{ tipo: "caixa", titulo: "Código de rastreio", texto: p.codigoRastreio } as Bloco] : []),
        ...(linkDeRastreio ? [{ tipo: "botao", texto: "Acompanhar a entrega", url: linkDeRastreio } as Bloco] : []),
        enderecoDoPedido(p),
        { tipo: "texto", texto: `Você também acompanha tudo em ${urlDoPedido(site, p.numero)}` },
      ],
      rodape: RODAPE_CLIENTE,
    }),
  };
}

/** Por que o pedido foi cancelado: muda o texto do e-mail. */
export type MotivoDoCancelamento = "loja" | "prazo" | "estorno" | "contestacao";

export function emailPedidoCancelado(p: PedidoParaEmail, site: string, motivo: MotivoDoCancelamento): ConteudoDoEmail {
  const nome = primeiroNome(p.compradorNome);
  const blocos: Bloco[] =
    motivo === "prazo"
      ? [
          { tipo: "texto", texto: `Oi, ${nome}. O pedido #${p.numero} foi cancelado automaticamente porque o prazo para pagar terminou e não recebemos o pagamento.` },
          { tipo: "texto", texto: "Nenhum valor foi cobrado. Se ainda quiser as peças, é só montar o carrinho de novo no site." },
          { tipo: "botao", texto: "Voltar para a loja", url: `${site}/produtos` },
        ]
      : motivo === "loja"
        ? [
            { tipo: "texto", texto: `Oi, ${nome}. O pedido #${p.numero} foi cancelado pela loja antes do pagamento.` },
            ...(p.motivoCancelamento ? [{ tipo: "caixa", titulo: "Motivo", texto: p.motivoCancelamento } as Bloco] : []),
            { tipo: "texto", texto: "Nenhum valor foi cobrado. Se tiver alguma dúvida, é só responder este e-mail." },
          ]
        : motivo === "estorno"
          ? [
              { tipo: "texto", texto: `Oi, ${nome}. O pedido #${p.numero} foi cancelado e o valor pago (${formatarPreco(p.totalEmCentavos)}) foi devolvido pelo Mercado Pago.` },
              ...(p.motivoCancelamento ? [{ tipo: "caixa", titulo: "Motivo", texto: p.motivoCancelamento } as Bloco] : []),
              { tipo: "texto", texto: "A devolução segue a forma de pagamento: no Pix e no saldo do Mercado Pago ela é rápida; no cartão, aparece na fatura em até duas faturas, conforme o banco." },
            ]
          : [
              { tipo: "texto", texto: `Oi, ${nome}. O pagamento do pedido #${p.numero} foi contestado junto ao cartão ou ao Mercado Pago, e por isso o pedido foi cancelado.` },
              { tipo: "texto", texto: "Se você não reconhece essa contestação, responda este e-mail que a gente ajuda." },
            ];
  return {
    assunto: `Pedido #${p.numero} cancelado`,
    ...layout({
      titulo: "Pedido cancelado",
      blocos: [...blocos, { tipo: "texto", texto: `Detalhes do pedido: ${urlDoPedido(site, p.numero)}` }],
      rodape: RODAPE_CLIENTE,
    }),
  };
}

export function emailLembreteDePagamento(p: PedidoParaEmail, site: string, cancelaEm: Date): ConteudoDoEmail {
  return {
    assunto: `Falta pagar o pedido #${p.numero}`,
    ...layout({
      titulo: "Seu pedido está esperando o pagamento",
      blocos: [
        { tipo: "texto", texto: `Oi, ${primeiroNome(p.compradorNome)}! O pedido #${p.numero} ainda não foi pago. As peças ficam reservadas para você até ${formatarData(cancelaEm)}.` },
        { tipo: "texto", texto: `Se o pagamento não for confirmado até ${formatarData(cancelaEm)}, o pedido será cancelado automaticamente.`, destaque: true },
        resumoDoPedido(p),
        { tipo: "botao", texto: "Pagar agora", url: urlDoPedido(site, p.numero) },
        { tipo: "texto", texto: "Já pagou com boleto? A confirmação pode levar até 3 dias úteis: não precisa pagar de novo." },
      ],
      rodape: RODAPE_CLIENTE,
    }),
  };
}

export function emailLojaPedidoPago(p: PedidoParaEmail, site: string): ConteudoDoEmail {
  const pecas = p.itens.reduce((s, i) => s + i.quantidade, 0);
  return {
    assunto: `Novo pedido pago: #${p.numero} (${pecas} ${pecas === 1 ? "peça" : "peças"})`,
    ...layout({
      titulo: `Pedido #${p.numero} pago: separar e enviar`,
      blocos: [
        { tipo: "texto", texto: `${p.compradorNome} pagou ${formatarPreco(p.totalEmCentavos)}${p.metodoPagamento ? ` (${p.metodoPagamento})` : ""}. Frete: ${p.freteServico ?? "não informado"}.` },
        resumoDoPedido(p),
        enderecoDoPedido(p),
        { tipo: "botao", texto: "Abrir no painel", url: `${site}/admin/pedidos/${p.numero}` },
      ],
      rodape: RODAPE_LOJA,
    }),
  };
}

export function emailLojaAlerta(numero: number, alerta: string, site: string): ConteudoDoEmail {
  return {
    assunto: `Pedido #${numero} precisa de decisão`,
    ...layout({
      titulo: `Pedido #${numero} precisa de decisão`,
      blocos: [
        { tipo: "caixa", titulo: "O que aconteceu", texto: alerta },
        { tipo: "texto", texto: "Abra o pedido no painel para ver os detalhes, falar com o cliente e, se for o caso, estornar." },
        { tipo: "botao", texto: "Abrir no painel", url: `${site}/admin/pedidos/${numero}` },
      ],
      rodape: RODAPE_LOJA,
    }),
  };
}

// ---------------------------------------------------------------- Personalização

export type PersonalizacaoParaEmail = {
  numero: number;
  nomeDoCliente: string;
  emailDoCliente: string;
  produto: string;
  cor: string;
  pecas: number;
};

export function emailPersonalizacaoRecebida(x: PersonalizacaoParaEmail, site: string): ConteudoDoEmail {
  return {
    assunto: `Recebemos seu pedido de personalização nº ${x.numero}`,
    ...layout({
      titulo: "Recebemos sua arte!",
      blocos: [
        { tipo: "texto", texto: `Oi, ${primeiroNome(x.nomeDoCliente)}! Seu pedido de personalização nº ${x.numero} (${x.pecas} ${x.pecas === 1 ? "peça" : "peças"} de ${x.produto}, ${x.cor}) chegou para a loja.` },
        { tipo: "texto", texto: "Agora vamos preparar uma prévia de como a camiseta vai ficar, com o preço. Avisamos por e-mail quando ela estiver pronta, e você aprova ou pede ajustes pelo site, em Minha conta." },
        { tipo: "botao", texto: "Acompanhar o pedido", url: `${site}/conta/personalizacoes/${x.numero}` },
      ],
      rodape: RODAPE_CLIENTE,
    }),
  };
}

export function emailPreviaPronta(x: PersonalizacaoParaEmail, site: string, precoUnitario: number, recado: string | null): ConteudoDoEmail {
  return {
    assunto: `A prévia da sua personalização nº ${x.numero} está pronta`,
    ...layout({
      titulo: "Sua prévia está pronta",
      blocos: [
        { tipo: "texto", texto: `Oi, ${primeiroNome(x.nomeDoCliente)}! Preparamos a prévia do pedido de personalização nº ${x.numero}. O preço ficou em ${formatarPreco(precoUnitario)} por peça.` },
        ...(recado ? [{ tipo: "caixa", titulo: "Recado da loja", texto: recado } as Bloco] : []),
        { tipo: "texto", texto: "Veja a prévia no site: se estiver tudo certo, é só aprovar e escolher a entrega. Se quiser mudar algo, peça um ajuste por lá." },
        { tipo: "botao", texto: "Ver a prévia", url: `${site}/conta/personalizacoes/${x.numero}` },
      ],
      rodape: RODAPE_CLIENTE,
    }),
  };
}

export function emailPersonalizacaoRecusada(x: PersonalizacaoParaEmail, site: string, motivo: string): ConteudoDoEmail {
  return {
    assunto: `Sobre o seu pedido de personalização nº ${x.numero}`,
    ...layout({
      titulo: "Não vamos conseguir produzir este pedido",
      blocos: [
        { tipo: "texto", texto: `Oi, ${primeiroNome(x.nomeDoCliente)}. Analisamos o pedido de personalização nº ${x.numero} e não vamos conseguir produzi-lo.` },
        { tipo: "caixa", titulo: "Motivo", texto: motivo },
        { tipo: "texto", texto: "Nenhum valor foi cobrado. Se quiser enviar outra arte ou tirar dúvidas, é só responder este e-mail." },
        { tipo: "botao", texto: "Ver o pedido", url: `${site}/conta/personalizacoes/${x.numero}` },
      ],
      rodape: RODAPE_CLIENTE,
    }),
  };
}

export function emailLojaNovaPersonalizacao(x: PersonalizacaoParaEmail, site: string): ConteudoDoEmail {
  return {
    assunto: `Nova personalização nº ${x.numero}: ${x.pecas} ${x.pecas === 1 ? "peça" : "peças"}`,
    ...layout({
      titulo: `Nova personalização nº ${x.numero}`,
      blocos: [
        { tipo: "texto", texto: `${x.nomeDoCliente} enviou uma arte para ${x.pecas} ${x.pecas === 1 ? "peça" : "peças"} de ${x.produto} (${x.cor}). Prepare a prévia e o preço no painel.` },
        { tipo: "botao", texto: "Abrir no painel", url: `${site}/admin/personalizacoes/${x.numero}` },
      ],
      rodape: RODAPE_LOJA,
    }),
  };
}

export function emailLojaAjusteSolicitado(x: PersonalizacaoParaEmail, site: string, pedido: string): ConteudoDoEmail {
  return {
    assunto: `Ajuste pedido na personalização nº ${x.numero}`,
    ...layout({
      titulo: `${primeiroNome(x.nomeDoCliente)} pediu um ajuste`,
      blocos: [
        { tipo: "caixa", titulo: "O que o cliente pediu", texto: pedido },
        { tipo: "botao", texto: "Abrir no painel", url: `${site}/admin/personalizacoes/${x.numero}` },
      ],
      rodape: RODAPE_LOJA,
    }),
  };
}

// ---------------------------------------------------------------- Orçamentos

export type OrcamentoParaEmail = {
  numero: number;
  nome: string;
  empresa: string | null;
  email: string;
  telefone: string;
  cidade: string;
  uf: string;
  tipoDePeca: string;
  quantidade: number;
  prazoDesejado: Date | null;
  mensagem: string | null;
};

const telefoneLegivel = (t: string) => (t.length === 11 ? `(${t.slice(0, 2)}) ${t.slice(2, 7)}-${t.slice(7)}` : t.length === 10 ? `(${t.slice(0, 2)}) ${t.slice(2, 6)}-${t.slice(6)}` : t);

export function emailOrcamentoRecebido(o: OrcamentoParaEmail): ConteudoDoEmail {
  return {
    assunto: `Recebemos seu pedido de orçamento nº ${o.numero}`,
    ...layout({
      titulo: "Recebemos seu pedido de orçamento",
      blocos: [
        { tipo: "texto", texto: `Oi, ${primeiroNome(o.nome)}! Recebemos o pedido de orçamento nº ${o.numero}: ${o.quantidade} peças (${o.tipoDePeca}).` },
        { tipo: "texto", texto: `Vamos montar o orçamento e responder pelo WhatsApp ${telefoneLegivel(o.telefone)} ou por este e-mail. Se quiser acrescentar alguma informação, é só responder esta mensagem.` },
      ],
      rodape: "Carta Viva Camisetas. Você recebeu este e-mail porque pediu um orçamento no nosso site.",
    }),
  };
}

export function emailLojaNovoOrcamento(o: OrcamentoParaEmail, site: string): ConteudoDoEmail {
  const zap = `https://wa.me/55${o.telefone}`;
  return {
    assunto: `Novo orçamento nº ${o.numero}: ${o.quantidade} peças`,
    ...layout({
      titulo: `Novo orçamento nº ${o.numero}`,
      blocos: [
        {
          tipo: "lista",
          linhas: [
            ["Nome", `${o.nome}${o.empresa ? ` (${o.empresa})` : ""}`],
            ["Peça", o.tipoDePeca],
            ["Quantidade", `${o.quantidade} peças`],
            ["Cidade", `${o.cidade}/${o.uf}`],
            ["Prazo", o.prazoDesejado ? formatarData(o.prazoDesejado) : "Sem prazo"],
            ["WhatsApp", telefoneLegivel(o.telefone)],
            ["E-mail", o.email],
          ],
        },
        ...(o.mensagem ? [{ tipo: "caixa", titulo: "Mensagem", texto: o.mensagem } as Bloco] : []),
        { tipo: "botao", texto: "Abrir no painel", url: `${site}/admin/orcamentos/${o.numero}` },
        { tipo: "texto", texto: `WhatsApp direto: ${zap}` },
      ],
      rodape: RODAPE_LOJA,
    }),
  };
}
