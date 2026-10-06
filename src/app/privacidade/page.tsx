import type { Metadata } from "next";
import Link from "next/link";

import { Documento } from "@/components/institucional/Documento";
import { identificacaoDaLoja, linkDoWhatsapp, LOJA, ou, whatsappLegivel } from "@/lib/loja";
import { GUARDA } from "@/lib/politicas";

export const metadata: Metadata = {
  alternates: { canonical: "/privacidade" },
  title: "Privacidade",
  description: `Como a ${LOJA.nome} usa, guarda e protege os seus dados, de acordo com a LGPD.`,
};

// RASCUNHO: passa por revisão jurídica antes de publicar. Descreve o que o
// site faz hoje; se algo mudar (ex.: ferramenta de análise de visitas), a
// política precisa mudar junto.

export default function PaginaPrivacidade() {
  return (
    <Documento
      sobretitulo="Políticas"
      titulo="Privacidade"
      resumo={
        <p>
          Usamos os seus dados só para vender, entregar e atender. Não vendemos dados, não usamos ferramentas de anúncio e
          não vemos os dados do seu cartão.
        </p>
      }
      secoes={[
        {
          id: "quem-somos",
          titulo: "Quem cuida dos seus dados",
          conteudo: (
            <>
              <p>
                A responsável pelos dados pessoais tratados neste site é a {identificacaoDaLoja()}, com endereço em{" "}
                {ou(LOJA.endereco, "ENDEREÇO")}, {LOJA.cidade}.
              </p>
              <p>
                Para qualquer assunto sobre os seus dados, fale com a gente pelo e-mail{" "}
                <a href={`mailto:${LOJA.email}`}>{LOJA.email}</a> ou pelo{" "}
                <a href={linkDoWhatsapp()} target="_blank" rel="noopener noreferrer">WhatsApp {whatsappLegivel()}</a>.
              </p>
            </>
          ),
        },
        {
          id: "quais-dados",
          titulo: "Quais dados usamos e para quê",
          conteudo: (
            <ul>
              <li>
                <strong>Conta:</strong> nome, e-mail e senha, para você entrar no site e acompanhar os pedidos. A senha fica
                guardada de forma cifrada pelo serviço de login: nem a loja consegue vê-la.
              </li>
              <li>
                <strong>Pedidos:</strong> CPF, telefone, endereço de entrega e as peças compradas, para cobrar, emitir os
                documentos de envio, entregar e falar com você sobre o pedido.
              </li>
              <li>
                <strong>Pagamento:</strong> o pagamento acontece no ambiente do Mercado Pago. Os dados do cartão vão direto
                para ele e nunca passam pela loja. Recebemos só a confirmação, a forma de pagamento e o valor.
              </li>
              <li>
                <strong>Personalização:</strong> as artes, imagens e textos que você envia e a descrição do pedido, para
                preparar a prévia e produzir as peças. Também registramos a data e a hora em que você declarou ter direito
                de usar a arte.
              </li>
              <li>
                <strong>Orçamento de atacado:</strong> nome, empresa, e-mail, WhatsApp, cidade e a mensagem, para responder
                ao pedido. Guardamos também um resumo embaralhado (hash) do endereço IP de quem enviou, só para limitar
                envios repetidos de robôs.
              </li>
              <li>
                <strong>E-mails:</strong> guardamos uma cópia dos e-mails que a loja envia (confirmação, envio, lembretes),
                para reenviar se algo falhar e para tirar dúvidas.
              </li>
            </ul>
          ),
        },
        {
          id: "por-que",
          titulo: "Por que podemos usar esses dados (LGPD)",
          conteudo: (
            <ul>
              <li>
                <strong>Para cumprir o contrato de compra</strong> que você faz com a loja: cadastro, pedido, pagamento,
                entrega, personalização e atendimento.
              </li>
              <li>
                <strong>Para cumprir obrigações legais:</strong> guardar os registros das vendas, como pedem as leis fiscais e o
                Código de Defesa do Consumidor.
              </li>
              <li>
                <strong>Por interesse legítimo da loja,</strong> sempre de forma limitada: proteger o formulário de orçamento
                contra robôs e manter a segurança do site.
              </li>
            </ul>
          ),
        },
        {
          id: "com-quem",
          titulo: "Com quem compartilhamos",
          conteudo: (
            <>
              <p>Só com os serviços que fazem a loja funcionar, e só com o necessário para cada um:</p>
              <ul>
                <li><strong>Supabase:</strong> banco de dados, login e guarda dos arquivos (artes, prévias e fotos).</li>
                <li><strong>Vercel:</strong> hospedagem do site.</li>
                <li><strong>Mercado Pago:</strong> pagamento (nome, e-mail, CPF, telefone e o valor da compra).</li>
                <li>
                  <strong>Melhor Envio e a transportadora escolhida</strong> (Correios ou outra): cálculo do frete e entrega
                  (nome, CPF, telefone, e-mail e endereço, impressos na etiqueta).
                </li>
                <li><strong>Resend:</strong> envio dos e-mails da loja.</li>
                <li><strong>ViaCEP:</strong> preenchimento do endereço a partir do CEP (recebe só o CEP).</li>
              </ul>
              <p>
                Alguns desses serviços guardam ou processam dados em servidores fora do Brasil, com as proteções previstas
                na LGPD. Não vendemos nem alugamos dados a ninguém.
              </p>
            </>
          ),
        },
        {
          id: "cookies",
          titulo: "Cookies",
          conteudo: (
            <>
              <p>O site usa só cookies necessários para funcionar:</p>
              <ul>
                <li><strong>Login:</strong> mantém você conectado à sua conta.</li>
                <li><strong>Carrinho:</strong> guarda as peças que você escolheu.</li>
                <li><strong>Frete:</strong> lembra o CEP e a forma de entrega escolhidos.</li>
              </ul>
              <p>Não usamos cookies de anúncio nem ferramentas que acompanham a sua navegação em outros sites.</p>
            </>
          ),
        },
        {
          id: "quanto-tempo",
          titulo: "Por quanto tempo guardamos",
          conteudo: (
            <ul>
              <li><strong>Pedidos e pagamentos:</strong> {GUARDA.pedidosEmAnos} anos depois da compra, por obrigação legal.</li>
              <li><strong>Conta:</strong> enquanto ela existir. Você pode pedir a exclusão quando quiser (veja abaixo).</li>
              <li><strong>Pedidos de orçamento:</strong> {GUARDA.orcamentosEmMeses} meses depois do envio.</li>
              <li>
                <strong>Artes e prévias de personalizações canceladas ou recusadas:</strong> {GUARDA.artesCanceladasEmDias} dias
                depois do cancelamento ou da recusa. Nas personalizações que viraram pedido, elas seguem o prazo dos pedidos.
              </li>
              <li><strong>Cópias dos e-mails enviados:</strong> {GUARDA.emailsEmMeses} meses.</li>
            </ul>
          ),
        },
        {
          id: "seus-direitos",
          titulo: "Seus direitos",
          conteudo: (
            <>
              <p>Pela LGPD, você pode pedir a qualquer momento:</p>
              <ul>
                <li>a confirmação de que tratamos os seus dados e uma cópia deles;</li>
                <li>a correção de dados errados ou desatualizados;</li>
                <li>
                  a exclusão dos dados e da conta (menos o que a lei manda guardar, como os registros dos pedidos);
                </li>
                <li>a portabilidade dos dados para outro fornecedor;</li>
                <li>informações sobre com quem compartilhamos os seus dados.</li>
              </ul>
              <p>
                Para pedir, escreva para <a href={`mailto:${LOJA.email}`}>{LOJA.email}</a> a partir do e-mail da sua conta.
                Respondemos em até 15 dias. Você também pode reclamar à Autoridade Nacional de Proteção de Dados (ANPD).
              </p>
            </>
          ),
        },
        {
          id: "seguranca",
          titulo: "Segurança",
          conteudo: (
            <p>
              O site usa conexão cifrada (HTTPS), o acesso ao banco de dados é restrito ao servidor da loja, as artes da
              personalização ficam numa pasta privada e só o próprio cliente e a loja conseguem abri-las. Se acontecer
              algum incidente de segurança que possa afetar você, avisamos. Veja também os{" "}
              <Link href="/termos">termos de uso</Link>.
            </p>
          ),
        },
      ]}
    />
  );
}
