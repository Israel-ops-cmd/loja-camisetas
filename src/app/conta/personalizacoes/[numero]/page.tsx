import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { Aviso } from "@/components/formulario/Aviso";
import { AcoesDaPrevia } from "@/components/personalizacao/AcoesDaPrevia";
import {
  Conversa,
  ListaDeArquivos,
  Orcamento,
  Painel,
  ResumoDaPersonalizacao,
} from "@/components/personalizacao/Detalhes";
import { Botao } from "@/components/ui/Botao";
import { exigirUsuario } from "@/lib/auth";
import { incluirDetalhes, linksDosArquivos } from "@/lib/personalizacao";
import {
  formatarNumeroDaPersonalizacao,
  rotulosDeStatusDaPersonalizacao,
} from "@/lib/personalizacao-regras";
import { formatarNumeroDoPedido } from "@/lib/pedidos";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = {
  title: "Personalização",
  robots: { index: false },
};

export default async function PaginaMinhaPersonalizacao({
  params,
  searchParams,
}: PageProps<"/conta/personalizacoes/[numero]">) {
  const { numero } = await params;
  const usuario = await exigirUsuario(`/conta/personalizacoes/${numero}`);
  const { novo } = await searchParams;

  const n = Number(numero);
  if (!Number.isInteger(n) || n <= 0) notFound();

  // Só o dono vê. Para qualquer outra pessoa, não existe.
  const p = await prisma.personalizacao.findFirst({
    where: { numero: n, clienteId: usuario.id },
    include: incluirDetalhes,
  });
  if (!p) notFound();

  const [artes, previas] = await Promise.all([
    linksDosArquivos(p.arquivos.filter((a) => a.tipo === "ARTE")),
    linksDosArquivos(p.arquivos.filter((a) => a.tipo === "PREVIA")),
  ]);

  return (
    <div className="secao">
      <div className="mx-auto max-w-4xl">
        <p className="sobretitulo text-center text-secundario">
          Personalização {formatarNumeroDaPersonalizacao(p.numero)}
        </p>
        <h1 className="titulo-listagem mt-3">{rotulosDeStatusDaPersonalizacao[p.status]}</h1>

        <div className="mt-10 space-y-3">
          {novo && (
            <Aviso tipo="sucesso">
              Recebemos o seu pedido de personalização. Vamos preparar a prévia e o
              preço e avisar por aqui.
            </Aviso>
          )}
          {p.status === "RECEBIDA" && !novo && (
            <Aviso tipo="info">Estamos preparando a prévia e o preço.</Aviso>
          )}
          {p.status === "AJUSTE_SOLICITADO" && (
            <Aviso tipo="info">Recebemos o seu pedido de ajuste. Vamos enviar uma nova prévia.</Aviso>
          )}
          {p.status === "APROVADA" && (
            <Aviso tipo="sucesso">Prévia aprovada! Agora é só escolher a entrega e pagar.</Aviso>
          )}
          {p.status === "CANCELADA" && <Aviso tipo="info">Este pedido de personalização foi cancelado.</Aviso>}
          {p.status === "RECUSADA" && (
            <Aviso tipo="info">
              <strong>Não conseguimos produzir este pedido.</strong>
              {p.motivoRecusa && (
                <span className="mt-1 block whitespace-pre-line">{p.motivoRecusa}</span>
              )}
              <span className="mt-2 block text-[14px] text-apoio">
                Se quiser, envie um novo pedido de personalização.
              </span>
            </Aviso>
          )}
          {p.status === "CONVERTIDA" && p.pedido && (
            <Aviso tipo="sucesso">
              Este pedido virou o pedido de compra{" "}
              <Link href={`/pedidos/${p.pedido.numero}`} className="font-semibold underline underline-offset-4">
                {formatarNumeroDoPedido(p.pedido.numero)}
              </Link>
              .
            </Aviso>
          )}
        </div>

        <div className="mt-6 space-y-6">
          {previas.length > 0 && (
            <Painel titulo="Prévia">
              <ListaDeArquivos arquivos={previas} grande />
              <div className="mt-6">
                <Orcamento p={p} />
              </div>
              {p.status === "PREVIA_ENVIADA" && (
                <div className="mt-6">
                  <AcoesDaPrevia numero={p.numero} />
                </div>
              )}
              {p.status === "APROVADA" && (
                <div className="mt-6">
                  <Botao href={`/conta/personalizacoes/${p.numero}/finalizar`}>Escolher entrega e pagar</Botao>
                </div>
              )}
            </Painel>
          )}

          {p.mensagens.length > 0 && (
            <Painel titulo="Conversa">
              <Conversa p={p} nomeDoCliente="Você" />
            </Painel>
          )}

          <Painel titulo="Seu pedido">
            <ResumoDaPersonalizacao p={p} />
          </Painel>

          <Painel titulo="Arquivos enviados">
            <ListaDeArquivos arquivos={artes} />
          </Painel>
        </div>

        <div className="mt-8">
          <Botao href="/conta" variante="secundario">
            Minha conta
          </Botao>
        </div>
      </div>
    </div>
  );
}
