import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";

import {
  cotarFreteDaPersonalizacao,
  finalizarPersonalizacao,
} from "@/app/personalizacao/acoes";
import { FormularioCheckout } from "@/components/checkout/FormularioCheckout";
import { exigirUsuario } from "@/lib/auth";
import { formatarNumeroDaPersonalizacao } from "@/lib/personalizacao-regras";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = {
  title: "Pagar personalização",
  robots: { index: false },
};

/** Entrega e pagamento de uma personalização aprovada (mesmo formulário do checkout). */
export default async function PaginaFinalizarPersonalizacao({
  params,
}: PageProps<"/conta/personalizacoes/[numero]/finalizar">) {
  const { numero } = await params;
  const usuario = await exigirUsuario(`/conta/personalizacoes/${numero}/finalizar`);
  const n = Number(numero);
  if (!Number.isInteger(n) || n <= 0) notFound();

  const p = await prisma.personalizacao.findFirst({
    where: { numero: n, clienteId: usuario.id },
    include: {
      produto: { select: { nome: true } },
      cor: { select: { nome: true } },
      itens: { orderBy: { tamanho: { ordem: "asc" } }, include: { tamanho: true } },
    },
  });
  if (!p) notFound();
  if (p.status !== "APROVADA" || p.precoUnitarioEmCentavos === null) {
    redirect(`/conta/personalizacoes/${p.numero}`);
  }
  const preco = p.precoUnitarioEmCentavos;

  const [cliente, enderecos] = await Promise.all([
    prisma.cliente.findUnique({
      where: { id: usuario.id },
      select: { nome: true, cpf: true, telefone: true },
    }),
    prisma.endereco.findMany({
      where: { clienteId: usuario.id },
      orderBy: [{ principal: "desc" }, { criadoEm: "desc" }],
      select: {
        id: true, destinatario: true, cep: true, logradouro: true, numero: true,
        complemento: true, bairro: true, cidade: true, uf: true,
      },
    }),
  ]);

  const enderecoInicial = enderecos[0];
  const cotacaoInicial = enderecoInicial
    ? await cotarFreteDaPersonalizacao(p.numero, enderecoInicial.cep)
    : null;

  return (
    <div className="secao">
      <div className="mx-auto max-w-6xl">
        <h1 className="titulo-listagem">Pagar personalização</h1>
        <p className="mt-4 text-center text-apoio">
          Personalização {formatarNumeroDaPersonalizacao(p.numero)} · {p.produto.nome}, {p.cor.nome}
        </p>
        <FormularioCheckout
          chave={crypto.randomUUID()}
          comprador={{
            nome: cliente?.nome ?? usuario.nome,
            email: usuario.email,
            cpf: cliente?.cpf ?? "",
            telefone: cliente?.telefone ?? "",
          }}
          enderecos={enderecos}
          itens={p.itens.map((item) => ({
            variacaoId: item.tamanhoId,
            nome: `${p.produto.nome} personalizada`,
            detalhe: `${p.cor.nome} · ${item.tamanho.nome}`,
            quantidade: item.quantidade,
            subtotalEmCentavos: preco * item.quantidade,
          }))}
          subtotalEmCentavos={p.itens.reduce((t, i) => t + i.quantidade * preco, 0)}
          cotacaoInicial={cotacaoInicial?.ok ? cotacaoInicial : null}
          servicoPreferido={null}
          cotar={cotarFreteDaPersonalizacao.bind(null, p.numero)}
          finalizar={finalizarPersonalizacao.bind(null, p.numero)}
          voltar={{ href: `/conta/personalizacoes/${p.numero}`, rotulo: "Voltar à personalização" }}
        />
      </div>
    </div>
  );
}
