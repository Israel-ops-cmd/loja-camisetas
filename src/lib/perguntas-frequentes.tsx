import "server-only";

import Link from "next/link";
import type { ReactNode } from "react";

import { listarFaixasDeAtacado } from "@/lib/atacado";
import { MAXIMO_DE_PARCELAS, PRAZO_DE_PAGAMENTO_DIAS } from "@/lib/pagamento";
import { FORMATOS_DE_ARTE, formatarTamanhoDoArquivo, MAXIMO_DE_ARQUIVOS, TAMANHO_MAXIMO_BYTES } from "@/lib/personalizacao-regras";
import {
  DIAS_PARA_ARREPENDIMENTO,
  DIAS_PARA_DEFEITO,
  DIAS_PARA_TROCA,
  PRAZO_DE_DESPACHO,
  PRAZO_DE_PRODUCAO,
  PRAZO_DE_RESPOSTA_DO_ORCAMENTO,
} from "@/lib/politicas";

// Perguntas frequentes: a página inicial mostra as marcadas com `destaque`;
// /perguntas-frequentes mostra todas. Os números vêm do código e do banco
// (atacado). Prazos de despacho e de produção ficam em src/lib/politicas.ts.

export type Pergunta = { pergunta: string; resposta: ReactNode; destaque?: boolean };

export async function listarPerguntasFrequentes(): Promise<Pergunta[]> {
  const faixas = await listarFaixasDeAtacado();
  const formatos = FORMATOS_DE_ARTE.filter((f) => f !== "jpeg").map((f) => f.toUpperCase()).join(", ");

  return [
    {
      destaque: true,
      pergunta: "Quais são as formas de pagamento?",
      resposta: (
        <>
          Pix, boleto ou cartão de crédito em até {MAXIMO_DE_PARCELAS}x (os juros do parcelamento ficam por conta de quem
          compra). O pagamento é feito no ambiente seguro do Mercado Pago, e a loja não vê os dados do cartão.
        </>
      ),
    },
    {
      destaque: true,
      pergunta: "Qual é o prazo de entrega?",
      resposta: (
        <>
          Despachamos os pedidos com peças em estoque em {PRAZO_DE_DESPACHO} depois da confirmação do pagamento. O prazo da transportadora
          aparece no carrinho, quando você calcula o frete pelo CEP, e conta a partir da postagem. Quando o pedido sai, você
          recebe o código de rastreio por e-mail.
        </>
      ),
    },
    {
      pergunta: "Vocês entregam em todo o Brasil?",
      resposta: (
        <>
          Sim. Enviamos pelos Correios e por outras transportadoras do Melhor Envio. O valor e o prazo do frete aparecem no
          carrinho, pelo seu CEP.
        </>
      ),
    },
    {
      destaque: true,
      pergunta: "Como funciona a troca?",
      resposta: (
        <>
          Você pode trocar o tamanho ou a cor em até {DIAS_PARA_TROCA} dias depois de receber, com a peça sem uso e com
          etiqueta. Também pode desistir da compra em até {DIAS_PARA_ARREPENDIMENTO} dias, e peça com defeito tem{" "}
          {DIAS_PARA_DEFEITO} dias para ser trocada. Peças personalizadas têm regras próprias. Tudo explicado na{" "}
          <Link href="/politica-de-troca">política de trocas</Link>.
        </>
      ),
    },
    {
      destaque: true,
      pergunta: "Como envio a minha arte para personalizar?",
      resposta: (
        <>
          Na página de <Link href="/personalizacao">personalização</Link>, escolha a peça, a cor, os tamanhos e onde vai a
          estampa, e envie até {MAXIMO_DE_ARQUIVOS} arquivos ({formatos}, até {formatarTamanhoDoArquivo(TAMANHO_MAXIMO_BYTES)}{" "}
          cada) ou descreva a sua ideia. A loja manda uma prévia com o preço; você aprova ou pede ajustes, e só então paga. A
          produção leva {PRAZO_DE_PRODUCAO} depois da confirmação do pagamento, conforme a quantidade.
        </>
      ),
    },
    {
      destaque: true,
      pergunta: "Qual é a quantidade mínima no atacado?",
      resposta:
        faixas.length > 0 ? (
          <>
            O desconto por quantidade começa em {faixas[0].minimoDePecas} peças ({faixas[0].percentual}% de desconto) e
            entra sozinho no carrinho, somando qualquer produto da loja. Para pedidos maiores ou sob medida, peça um{" "}
            <Link href="/atacado#orcamento">orçamento</Link>: respondemos em {PRAZO_DE_RESPOSTA_DO_ORCAMENTO}.
          </>
        ) : (
          <>
            Para comprar em quantidade, peça um <Link href="/atacado#orcamento">orçamento</Link>: respondemos em{" "}
            {PRAZO_DE_RESPOSTA_DO_ORCAMENTO} com as condições para o seu pedido.
          </>
        ),
    },
    {
      pergunta: "Preciso criar uma conta para comprar?",
      resposta: (
        <>
          Sim. Com a conta, você acompanha os pedidos e as personalizações em Minha conta, e não precisa digitar o endereço de
          novo na próxima compra. Os seus dados são usados como explica a <Link href="/privacidade">política de privacidade</Link>.
        </>
      ),
    },
    {
      pergunta: "Como acompanho o meu pedido?",
      resposta: (
        <>
          Em <Link href="/conta">Minha conta</Link> aparecem todos os pedidos e a situação de cada um. Também mandamos e-mails
          quando o pagamento é aprovado e quando o pedido é enviado, com o código de rastreio.
        </>
      ),
    },
    {
      pergunta: "Fiz o pedido e não paguei. O que acontece?",
      resposta: (
        <>
          O pedido espera o pagamento por {PRAZO_DE_PAGAMENTO_DIAS} dias. No dia seguinte ao pedido, mandamos um lembrete por
          e-mail com o link para pagar. Se o prazo terminar sem pagamento, o pedido é cancelado sozinho, sem nenhuma cobrança.
        </>
      ),
    },
  ];
}
