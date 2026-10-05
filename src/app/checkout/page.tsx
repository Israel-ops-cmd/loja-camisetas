import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { cotarFreteDoCheckout, finalizarPedido } from "@/app/checkout/acoes";
import { FormularioCheckout } from "@/components/checkout/FormularioCheckout";
import { exigirUsuario } from "@/lib/auth";
import { obterCarrinho } from "@/lib/carrinho";
import { cotarFreteDoCarrinho, lerEscolhaDeFrete } from "@/lib/frete";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = {
  title: "Finalizar compra",
  robots: { index: false },
};

export default async function PaginaCheckout() {
  const usuario = await exigirUsuario("/checkout");

  const carrinho = await obterCarrinho();
  // Carrinho vazio, item esgotado ou corrigido: o carrinho mostra o motivo.
  if (
    carrinho.itens.length === 0 ||
    carrinho.precisaSincronizar ||
    carrinho.itens.some((item) => item.esgotado)
  ) {
    redirect("/carrinho");
  }

  const [cliente, enderecos, escolhaDeFrete] = await Promise.all([
    prisma.cliente.findUnique({
      where: { id: usuario.id },
      select: { nome: true, cpf: true, telefone: true },
    }),
    prisma.endereco.findMany({
      where: { clienteId: usuario.id },
      orderBy: [{ principal: "desc" }, { criadoEm: "desc" }],
      select: {
        id: true,
        destinatario: true,
        cep: true,
        logradouro: true,
        numero: true,
        complemento: true,
        bairro: true,
        cidade: true,
        uf: true,
      },
    }),
    lerEscolhaDeFrete(),
  ]);

  // Com endereço salvo, a entrega já vem cotada para ele.
  const enderecoInicial = enderecos[0];
  const cotacaoInicial = enderecoInicial
    ? await cotarFreteDoCarrinho(
        carrinho,
        enderecoInicial.cep,
        escolhaDeFrete?.cep === enderecoInicial.cep
          ? escolhaDeFrete.servicoId
          : null,
      )
    : null;

  return (
    <div className="secao">
      <div className="mx-auto max-w-6xl">
        <h1 className="titulo-listagem">Finalizar compra</h1>
        <FormularioCheckout
          // Uma chave por abertura da página: um segundo envio dela não
          // cria outro pedido.
          chave={crypto.randomUUID()}
          comprador={{
            nome: cliente?.nome ?? usuario.nome,
            email: usuario.email,
            cpf: cliente?.cpf ?? "",
            telefone: cliente?.telefone ?? "",
          }}
          enderecos={enderecos}
          itens={carrinho.itens.map((item) => ({
            variacaoId: item.variacaoId,
            nome: item.produto.nome,
            detalhe: `${item.cor.nome} · ${item.tamanho}`,
            quantidade: item.quantidade,
            subtotalEmCentavos: item.subtotalEmCentavos,
          }))}
          subtotalEmCentavos={carrinho.subtotalEmCentavos}
          cotacaoInicial={cotacaoInicial}
          servicoPreferido={escolhaDeFrete?.servicoId ?? null}
          cotar={cotarFreteDoCheckout}
          finalizar={finalizarPedido}
          voltar={{ href: "/carrinho", rotulo: "Voltar ao carrinho" }}
        />
      </div>
    </div>
  );
}
