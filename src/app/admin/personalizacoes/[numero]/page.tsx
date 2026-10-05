import Link from "next/link";
import { notFound } from "next/navigation";

import { Aviso } from "@/components/formulario/Aviso";
import {
  Conversa,
  ListaDeArquivos,
  Orcamento,
  Painel,
  ResumoDaPersonalizacao,
} from "@/components/personalizacao/Detalhes";
import {
  BotaoCancelarPersonalizacao,
  FormularioPrevia,
} from "@/components/personalizacao/FormularioPrevia";
import { exigirAdministrador } from "@/lib/auth";
import { formatarNumeroDoPedido, rotulosDeStatus } from "@/lib/pedidos";
import { incluirDetalhes, linksDosArquivos } from "@/lib/personalizacao";
import {
  formatarNumeroDaPersonalizacao,
  rotulosDeStatusDaPersonalizacao,
} from "@/lib/personalizacao-regras";
import { prisma } from "@/lib/prisma";
import { mascararTelefone } from "@/lib/validacao-br";

export default async function PaginaAdminPersonalizacao({
  params,
}: PageProps<"/admin/personalizacoes/[numero]">) {
  await exigirAdministrador();
  const { numero } = await params;
  const n = Number(numero);
  if (!Number.isInteger(n) || n <= 0) notFound();

  const p = await prisma.personalizacao.findUnique({ where: { numero: n }, include: incluirDetalhes });
  if (!p) notFound();

  const [artes, previas] = await Promise.all([
    linksDosArquivos(p.arquivos.filter((a) => a.tipo === "ARTE")),
    linksDosArquivos(p.arquivos.filter((a) => a.tipo === "PREVIA")),
  ]);
  const aceitaPrevia = ["RECEBIDA", "AJUSTE_SOLICITADO", "PREVIA_ENVIADA"].includes(p.status);
  const precoAtual =
    p.precoUnitarioEmCentavos !== null
      ? (p.precoUnitarioEmCentavos / 100).toFixed(2).replace(".", ",")
      : "";

  return (
    <div className="secao">
      <div className="mx-auto max-w-4xl">
        <p className="sobretitulo text-secundario">
          <Link href="/admin/personalizacoes" className="hover:text-tinta">Personalizações</Link>
        </p>
        <h1 className="titulo-destaque mt-4">{formatarNumeroDaPersonalizacao(p.numero)}</h1>
        <p className="mt-3 text-[15px]">
          <span className="rounded-full bg-tinta px-3 py-1 text-[12px] font-bold tracking-[0.12em] text-papel uppercase">
            {rotulosDeStatusDaPersonalizacao[p.status]}
          </span>
        </p>

        <div className="mt-8 space-y-6">
          {p.status === "CONVERTIDA" && p.pedido && (
            <Aviso tipo="sucesso">
              Virou o pedido de compra {formatarNumeroDoPedido(p.pedido.numero)} (
              {rotulosDeStatus[p.pedido.status]}).
            </Aviso>
          )}

          <Painel titulo="Cliente">
            <p className="text-[15px]">
              <span className="font-semibold">{p.cliente.nome}</span> · {p.cliente.email}
              {p.cliente.telefone && ` · ${mascararTelefone(p.cliente.telefone)}`}
            </p>
          </Painel>

          <Painel titulo="Pedido">
            <ResumoDaPersonalizacao p={p} />
          </Painel>

          <Painel titulo="Arte enviada pelo cliente">
            <ListaDeArquivos arquivos={artes} />
          </Painel>

          {p.mensagens.length > 0 && (
            <Painel titulo="Conversa">
              <Conversa p={p} nomeDoCliente={p.cliente.nome} />
            </Painel>
          )}

          {previas.length > 0 && (
            <Painel titulo="Prévias enviadas">
              <ListaDeArquivos arquivos={previas} grande />
              <div className="mt-6">
                <Orcamento p={p} />
              </div>
            </Painel>
          )}

          {aceitaPrevia && (
            <Painel titulo={p.status === "PREVIA_ENVIADA" ? "Enviar nova prévia" : "Enviar prévia"}>
              <FormularioPrevia numero={p.numero} precoAtual={precoAtual} />
            </Painel>
          )}

          {p.status !== "CONVERTIDA" && p.status !== "CANCELADA" && (
            <BotaoCancelarPersonalizacao numero={p.numero} />
          )}
        </div>
      </div>
    </div>
  );
}
