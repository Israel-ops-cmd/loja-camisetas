import type { Metadata } from "next";
import Link from "next/link";

import { Documento } from "@/components/institucional/Documento";
import { identificacaoDaLoja, linkDoWhatsapp, LOJA, ou, whatsappLegivel } from "@/lib/loja";
import { MAXIMO_DE_PARCELAS, PRAZO_DE_PAGAMENTO_DIAS } from "@/lib/pagamento";
import { DECLARACAO_DE_DIREITOS } from "@/lib/personalizacao-regras";

export const metadata: Metadata = {
  title: "Termos de uso",
  description: `Regras de compra na ${LOJA.nome}: conta, preços, pagamento, entrega, atacado e personalização.`,
};

// RASCUNHO: passa por revisão jurídica antes de publicar. Os números vêm do
// código (prazo de pagamento, parcelas); prazos de despacho e de produção
// ainda dependem do pai do Israel.

export default function PaginaTermos() {
  return (
    <Documento
      sobretitulo="Políticas"
      titulo="Termos de uso"
      resumo={<p>As regras para comprar na {LOJA.nome}. Ao criar a conta ou fazer um pedido, você concorda com elas.</p>}
      secoes={[
        {
          id: "quem-vende",
          titulo: "Quem vende",
          conteudo: (
            <p>
              Este site é da {identificacaoDaLoja()}, com endereço em {ou(LOJA.endereco, "ENDEREÇO")}, {LOJA.cidade}.
              Atendimento pelo{" "}
              <a href={linkDoWhatsapp()} target="_blank" rel="noopener noreferrer">WhatsApp {whatsappLegivel()}</a> e pelo
              e-mail <a href={`mailto:${LOJA.email}`}>{LOJA.email}</a>, {ou(LOJA.horario, "HORÁRIO")}.
            </p>
          ),
        },
        {
          id: "conta",
          titulo: "Sua conta",
          conteudo: (
            <ul>
              <li>Para comprar, pedir uma personalização ou acompanhar pedidos, é preciso criar uma conta com e-mail e senha.</li>
              <li>Use dados verdadeiros: eles vão para a cobrança e para a etiqueta de envio.</li>
              <li>A senha é pessoal. Se achar que alguém a descobriu, troque em “Esqueci minha senha”.</li>
            </ul>
          ),
        },
        {
          id: "precos",
          titulo: "Produtos e preços",
          conteudo: (
            <ul>
              <li>Os preços estão em reais e podem mudar, mas o preço de um pedido já feito não muda.</li>
              <li>
                As cores das fotos podem variar um pouco conforme a tela do aparelho. Algumas imagens são montagens que mostram
                como a estampa fica na peça.
              </li>
              <li>
                A disponibilidade de cada cor e tamanho é conferida na hora da compra. Em casos raros, a peça pode acabar entre o
                pedido e a confirmação do pagamento: aí avisamos e você escolhe esperar a reposição ou receber o valor de volta.
              </li>
            </ul>
          ),
        },
        {
          id: "pagamento",
          titulo: "Pagamento",
          conteudo: (
            <ul>
              <li>
                O pagamento é feito no ambiente do Mercado Pago: Pix, boleto ou cartão em até {MAXIMO_DE_PARCELAS}x (com os
                juros do parcelamento por conta de quem compra). A loja não recebe os dados do cartão.
              </li>
              <li>
                O pedido tem {PRAZO_DE_PAGAMENTO_DIAS} dias para ser pago. Depois disso, ele é cancelado automaticamente, sem
                nenhuma cobrança. Se você pagou com boleto no último dia, esperamos a compensação antes de cancelar.
              </li>
              <li>O pedido só segue para separação depois que o Mercado Pago confirma o pagamento.</li>
            </ul>
          ),
        },
        {
          id: "atacado",
          titulo: "Atacado",
          conteudo: (
            <p>
              Comprando várias peças, o desconto por quantidade entra sozinho no carrinho, conforme a tabela da página{" "}
              <Link href="/atacado">Atacado</Link> no momento do pedido. Pedidos maiores ou diferentes do que está no site são
              combinados por orçamento.
            </p>
          ),
        },
        {
          id: "entrega",
          titulo: "Entrega",
          conteudo: (
            <ul>
              <li>Enviamos para todo o Brasil pelas transportadoras do Melhor Envio (como os Correios).</li>
              <li>Despachamos o pedido em até [PRAZO DE DESPACHO] depois da confirmação do pagamento.</li>
              <li>
                O prazo de entrega aparece no carrinho, ao calcular o frete pelo CEP, e conta a partir da postagem. Quando o
                pedido sai, você recebe um e-mail com o código de rastreio.
              </li>
              <li>Confira o endereço antes de finalizar: um endereço errado pode atrasar ou impedir a entrega.</li>
            </ul>
          ),
        },
        {
          id: "personalizacao",
          titulo: "Personalização",
          conteudo: (
            <>
              <ul>
                <li>Você envia a arte ou descreve a ideia. A loja prepara uma prévia com o preço por peça.</li>
                <li>Você aprova a prévia ou pede ajustes. A produção só começa depois da aprovação e do pagamento.</li>
                <li>O prazo de produção é de [PRAZO DE PRODUÇÃO DA PERSONALIZAÇÃO], contado da confirmação do pagamento.</li>
                <li>As cores impressas podem variar um pouco em relação às da tela.</li>
              </ul>
              <p>Ao enviar a arte, você confirma esta declaração:</p>
              <p className="rounded-xl bg-fundo p-4 text-tinta">“{DECLARACAO_DE_DIREITOS}”</p>
              <p>
                A loja pode recusar um pedido de personalização, explicando o motivo, por exemplo quando a arte usa marcas,
                personagens ou imagens de terceiros sem autorização, ou tem conteúdo ofensivo ou ilegal. Nesses casos nada é
                cobrado.
              </p>
            </>
          ),
        },
        {
          id: "trocas-e-privacidade",
          titulo: "Trocas, devoluções e privacidade",
          conteudo: (
            <p>
              As regras de troca, devolução e defeito estão na <Link href="/politica-de-troca">política de trocas</Link>. O
              uso dos seus dados está explicado na <Link href="/privacidade">política de privacidade</Link>.
            </p>
          ),
        },
        {
          id: "mudancas",
          titulo: "Mudanças nestes termos",
          conteudo: (
            <p>
              Podemos atualizar estes termos. A data da versão fica no alto da página, e um pedido já feito segue as regras
              da data em que foi feito. Valem as leis brasileiras, incluindo o Código de Defesa do Consumidor.
            </p>
          ),
        },
      ]}
    />
  );
}
