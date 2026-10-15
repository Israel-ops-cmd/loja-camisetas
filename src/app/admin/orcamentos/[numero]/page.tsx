import Link from "next/link";
import { notFound } from "next/navigation";
import { Mail, MessageCircle } from "lucide-react";

import { FormularioDoOrcamentoNoPainel } from "@/components/atacado/FormularioDoOrcamentoNoPainel";
import { Painel } from "@/components/ui/Painel";
import { exigirAdministrador } from "@/lib/auth";
import { rotulosDeStatusDoOrcamento, rotulosDeTipoDePeca } from "@/lib/orcamento-regras";
import { formatarData, formatarDataHora } from "@/lib/pedidos";
import { prisma } from "@/lib/prisma";
import { mascararTelefone } from "@/lib/validacao-br";

export default async function PaginaAdminOrcamento({ params }: PageProps<"/admin/orcamentos/[numero]">) {
  await exigirAdministrador();
  const { numero } = await params;
  const n = Number(numero);
  if (!Number.isInteger(n) || n <= 0) notFound();

  const o = await prisma.orcamento.findUnique({ where: { numero: n } });
  if (!o) notFound();

  const primeiroNome = o.nome.split(" ")[0];
  const whatsapp = `https://wa.me/55${o.telefone}?text=${encodeURIComponent(
    `Olá, ${primeiroNome}! Aqui é da Carta Viva, sobre o seu pedido de orçamento nº ${o.numero}.`,
  )}`;

  return (
    <div className="secao">
      <div className="mx-auto max-w-3xl">
        <p className="sobretitulo text-secundario">
          <Link href="/admin/orcamentos" className="hover:text-tinta">Orçamentos</Link>
        </p>
        <h1 className="titulo-destaque mt-4">nº {o.numero}</h1>
        <p className="mt-3">
          <span className="rounded-full bg-tinta px-3 py-1 text-[12px] font-bold tracking-[0.12em] text-papel uppercase">
            {rotulosDeStatusDoOrcamento[o.status]}
          </span>
          <span className="ml-3 text-[14px] text-secundario">recebido em {formatarDataHora(o.criadoEm)}</span>
        </p>

        <div className="mt-8 space-y-6">
          <Painel titulo="Contato">
            <p className="text-[16px] font-semibold">
              {o.nome}
              {o.empresa && <span className="font-normal text-apoio"> · {o.empresa}</span>}
            </p>
            <p className="mt-1 text-[15px] text-apoio">{o.cidade}/{o.uf}</p>
            <div className="mt-4 flex flex-col gap-2 sm:flex-row">
              <a
                href={whatsapp}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-tinta px-6 text-[14px] font-bold text-papel hover:bg-painel"
              >
                <MessageCircle aria-hidden="true" className="size-5" strokeWidth={1.6} />
                WhatsApp {mascararTelefone(o.telefone)}
              </a>
              <a
                href={`mailto:${o.email}?subject=${encodeURIComponent(`Orçamento nº ${o.numero} - Carta Viva`)}`}
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full border border-tinta px-6 text-[14px] font-bold hover:bg-fundo"
              >
                <Mail aria-hidden="true" className="size-5" strokeWidth={1.6} />
                {o.email}
              </a>
            </div>
          </Painel>

          <Painel titulo="Pedido">
            <dl className="grid gap-4 text-[15px] sm:grid-cols-3">
              <div>
                <dt className="text-[13px] text-secundario">Peça</dt>
                <dd className="font-semibold">{rotulosDeTipoDePeca[o.tipoDePeca]}</dd>
              </div>
              <div>
                <dt className="text-[13px] text-secundario">Quantidade</dt>
                <dd className="font-semibold">{o.quantidade} peças</dd>
              </div>
              <div>
                <dt className="text-[13px] text-secundario">Prazo</dt>
                <dd className="font-semibold">{o.prazoDesejado ? formatarData(o.prazoDesejado) : "Sem prazo"}</dd>
              </div>
              {o.mensagem && (
                <div className="sm:col-span-3">
                  <dt className="text-[13px] text-secundario">Mensagem</dt>
                  <dd className="whitespace-pre-line">{o.mensagem}</dd>
                </div>
              )}
            </dl>
          </Painel>

          <Painel titulo="Acompanhamento">
            <FormularioDoOrcamentoNoPainel numero={o.numero} status={o.status} anotacoes={o.anotacoes ?? ""} />
          </Painel>
        </div>
      </div>
    </div>
  );
}
