import type { Metadata } from "next";
import Link from "next/link";

import { Documento } from "@/components/institucional/Documento";
import { linkDoWhatsapp, LOJA, whatsappLegivel } from "@/lib/loja";
import { DIAS_PARA_ARREPENDIMENTO, DIAS_PARA_DEFEITO, DIAS_PARA_TROCA } from "@/lib/politicas";

export const metadata: Metadata = {
  alternates: { canonical: "/politica-de-troca" },
  title: "Trocas e devoluções",
  description: `Como trocar ou devolver uma compra da ${LOJA.nome}: arrependimento em ${DIAS_PARA_ARREPENDIMENTO} dias, troca de tamanho e defeito.`,
};

// RASCUNHO PROVISÓRIO: prazos e frete da troca a confirmar com o pai do Israel,
// e o texto todo passa por revisão jurídica antes de publicar.

export default function PaginaPoliticaDeTroca() {
  const contato = (
    <>
      pelo <a href={linkDoWhatsapp("Olá! Quero falar sobre uma troca ou devolução.")} target="_blank" rel="noopener noreferrer">WhatsApp {whatsappLegivel()}</a>{" "}
      ou pelo e-mail <a href={`mailto:${LOJA.email}`}>{LOJA.email}</a>
    </>
  );

  return (
    <Documento
      sobretitulo="Políticas"
      titulo="Trocas e devoluções"
      resumo={
        <p>
          Queremos que a camiseta chegue do jeito que você imaginou. Se não chegar, aqui está como resolver: desistir da
          compra, trocar o tamanho ou a cor, ou trocar uma peça com defeito.
        </p>
      }
      secoes={[
        {
          id: "arrependimento",
          titulo: `Desistiu da compra? Você tem ${DIAS_PARA_ARREPENDIMENTO} dias`,
          conteudo: (
            <>
              <p>
                Em compras pela internet, você pode desistir em até <strong>{DIAS_PARA_ARREPENDIMENTO} dias corridos</strong>{" "}
                contados do dia em que recebeu o pedido, sem precisar explicar o motivo. É o direito de arrependimento do
                Código de Defesa do Consumidor (art. 49).
              </p>
              <ul>
                <li>A peça precisa voltar sem uso, sem lavar e com a etiqueta.</li>
                <li>O frete da devolução fica por nossa conta: enviamos as instruções de postagem.</li>
                <li>Devolvemos o valor total pago, incluindo o frete da entrega.</li>
              </ul>
              <p>
                Peças personalizadas seguem uma regra própria, explicada em “Peças personalizadas”, mais abaixo.
              </p>
            </>
          ),
        },
        {
          id: "troca",
          titulo: "Troca de tamanho ou cor",
          conteudo: (
            <>
              <p>
                Não serviu ou preferia outra cor? Você pode trocar em até <strong>{DIAS_PARA_TROCA} dias</strong> depois de
                receber o pedido.
              </p>
              <ul>
                <li>A peça precisa estar sem uso, sem lavar e com a etiqueta.</li>
                <li>
                  A loja paga o frete da primeira troca quando ela acontece por erro nosso (peça, cor ou tamanho diferente do
                  pedido) ou por defeito. Nos outros casos, como um tamanho que não serviu, o frete da troca (envio e volta) é por
                  sua conta.
                </li>
                <li>
                  A troca depende de termos a peça no tamanho ou na cor que você quer. Se não tivermos, você escolhe outra peça
                  ou recebe o valor de volta.
                </li>
              </ul>
            </>
          ),
        },
        {
          id: "defeito",
          titulo: "Peça com defeito",
          conteudo: (
            <>
              <p>
                Se a peça chegar com defeito (costura aberta, furo, mancha, estampa falhada ou diferente da que você comprou),
                avise em até <strong>{DIAS_PARA_DEFEITO} dias</strong> depois de receber. O frete de ida e volta é por nossa
                conta.
              </p>
              <p>
                Mande fotos do defeito junto com o número do pedido. Depois de conferir, enviamos uma peça nova igual. Se não
                tivermos, você escolhe outra peça ou recebe o valor de volta.
              </p>
            </>
          ),
        },
        {
          id: "personalizadas",
          titulo: "Peças personalizadas",
          conteudo: (
            <>
              <p>
                As peças personalizadas são produzidas sob encomenda, com a sua arte e a prévia que você aprovou antes do
                pagamento: cor, tamanhos, posição e tamanho da estampa.
              </p>
              <ul>
                <li>
                  <strong>Defeito de produção:</strong> estampa diferente da prévia aprovada, falha na impressão ou defeito na
                  peça. Refazemos a peça ou devolvemos o valor, com o frete por nossa conta, no mesmo prazo de{" "}
                  {DIAS_PARA_DEFEITO} dias.
                </li>
                <li>
                  <strong>Tamanho, cor ou mudança de ideia:</strong> como esses detalhes são escolhidos por você e aprovados na
                  prévia, não fazemos troca de peça personalizada por esses motivos.
                </li>
                <li>
                  <strong>Desistência ({DIAS_PARA_ARREPENDIMENTO} dias):</strong>{" "}
                  {"[REGRA DO ARREPENDIMENTO PARA PEÇAS PERSONALIZADAS, A DEFINIR NA REVISÃO JURÍDICA]"}
                </li>
              </ul>
              <p>Confira com atenção a prévia e os tamanhos antes de aprovar: é ela que vale para a produção.</p>
            </>
          ),
        },
        {
          id: "como-pedir",
          titulo: "Como pedir a troca ou a devolução",
          conteudo: (
            <>
              <p>Fale com a gente {contato}, com:</p>
              <ul>
                <li>o número do pedido (ele está no e-mail de confirmação e em Minha conta);</li>
                <li>o que você quer: devolver, trocar (por qual tamanho ou cor) ou resolver um defeito;</li>
                <li>fotos, no caso de defeito.</li>
              </ul>
              <p>Respondemos com as instruções para enviar a peça. Não mande a peça antes de falar com a gente.</p>
            </>
          ),
        },
        {
          id: "reembolso",
          titulo: "Como o dinheiro volta",
          conteudo: (
            <>
              <p>
                Assim que a peça devolvida chega e é conferida, fazemos o estorno pelo Mercado Pago, na mesma forma de
                pagamento da compra:
              </p>
              <ul>
                <li>Pix e saldo do Mercado Pago: o valor volta para a conta de origem.</li>
                <li>Cartão de crédito: o estorno aparece na fatura em até duas faturas, conforme o banco.</li>
                <li>Boleto: o estorno também é feito pelo Mercado Pago, que informa como o valor será devolvido.</li>
              </ul>
              <p>
                Você recebe um e-mail quando o estorno é feito. Dúvidas sobre a compra em geral estão nos{" "}
                <Link href="/termos">termos de uso</Link> e nas <Link href="/perguntas-frequentes">perguntas frequentes</Link>.
              </p>
            </>
          ),
        },
      ]}
    />
  );
}
