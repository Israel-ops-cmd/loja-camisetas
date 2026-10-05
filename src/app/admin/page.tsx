import Link from "next/link";
import { Boxes, ClipboardList, Palette, Percent, Shirt } from "lucide-react";

import { exigirAdministrador } from "@/lib/auth";
import { LIMITE_ULTIMAS_UNIDADES } from "@/lib/estoque-regras";
import { prisma } from "@/lib/prisma";

export default async function PaginaPainel() {
  const usuario = await exigirAdministrador();
  const aVendaNaLoja = { ativo: true, produto: { ativo: true } };
  const [aguardandoLoja, orcamentosNovos, produtosNaLoja, acabando, faltando, faixasLigadas] = await Promise.all([
    prisma.personalizacao.count({ where: { status: { in: ["RECEBIDA", "AJUSTE_SOLICITADO"] } } }),
    prisma.orcamento.count({ where: { status: "NOVO" } }),
    prisma.produto.count({ where: { ativo: true } }),
    prisma.variacao.count({ where: { ...aVendaNaLoja, estoque: { lte: LIMITE_ULTIMAS_UNIDADES } } }),
    prisma.variacao.count({ where: { ...aVendaNaLoja, estoque: { lt: 0 } } }),
    prisma.faixaAtacado.count({ where: { ativo: true } }),
  ]);

  return (
    <div className="secao">
      <div className="mx-auto max-w-5xl">
        <p className="sobretitulo text-secundario">Painel</p>
        <h1 className="titulo-destaque mt-4">Olá, {usuario.nome}.</h1>
        <p className="texto-destaque mt-6 max-w-xl text-apoio">
          A lista de pedidos chega na próxima etapa.
        </p>

        <ul className="mt-10 grid gap-4 sm:grid-cols-2">
          <li>
            <Link
              href="/admin/produtos"
              className="flex min-h-28 items-start gap-4 rounded-[20px] bg-papel p-6 transition hover:ring-2 hover:ring-tinta"
            >
              <Shirt aria-hidden="true" className="size-7 shrink-0" strokeWidth={1.5} />
              <span>
                <span className="block font-titulo text-[20px] font-bold uppercase">Produtos</span>
                <span className="mt-1 block text-[14px] text-apoio">
                  {produtosNaLoja === 1 ? "1 produto na loja." : `${produtosNaLoja} produtos na loja.`} Cadastrar,
                  editar e trocar fotos.
                </span>
              </span>
            </Link>
          </li>
          <li>
            <Link
              href={faltando > 0 ? "/admin/estoque?filtro=faltando" : acabando > 0 ? "/admin/estoque?filtro=acabando" : "/admin/estoque"}
              className="flex min-h-28 items-start gap-4 rounded-[20px] bg-papel p-6 transition hover:ring-2 hover:ring-tinta"
            >
              <Boxes aria-hidden="true" className="size-7 shrink-0" strokeWidth={1.5} />
              <span>
                <span className="block font-titulo text-[20px] font-bold uppercase">Estoque</span>
                <span className="mt-1 block text-[14px] text-apoio">
                  {faltando > 0
                    ? `${faltando === 1 ? "1 tamanho" : `${faltando} tamanhos`} com peça faltando para pedido pago.`
                    : acabando === 0
                      ? "Nada acabando."
                      : `${acabando === 1 ? "1 tamanho acabando" : `${acabando} tamanhos acabando`} (${LIMITE_ULTIMAS_UNIDADES} peças ou menos).`}
                </span>
              </span>
            </Link>
          </li>
          <li>
            <Link
              href="/admin/atacado"
              className="flex min-h-28 items-start gap-4 rounded-[20px] bg-papel p-6 transition hover:ring-2 hover:ring-tinta"
            >
              <Percent aria-hidden="true" className="size-7 shrink-0" strokeWidth={1.5} />
              <span>
                <span className="block font-titulo text-[20px] font-bold uppercase">Atacado</span>
                <span className="mt-1 block text-[14px] text-apoio">
                  {faixasLigadas === 0
                    ? "Desconto por quantidade desligado."
                    : `Desconto por quantidade ligado, ${faixasLigadas === 1 ? "1 faixa" : `${faixasLigadas} faixas`}.`}
                </span>
              </span>
            </Link>
          </li>
          <li>
            <Link
              href="/admin/personalizacoes"
              className="flex min-h-28 items-start gap-4 rounded-[20px] bg-papel p-6 transition hover:ring-2 hover:ring-tinta"
            >
              <Palette aria-hidden="true" className="size-7 shrink-0" strokeWidth={1.5} />
              <span>
                <span className="block font-titulo text-[20px] font-bold uppercase">Personalizações</span>
                <span className="mt-1 block text-[14px] text-apoio">
                  {aguardandoLoja === 0
                    ? "Nada esperando a loja."
                    : aguardandoLoja === 1
                      ? "1 pedido esperando prévia."
                      : `${aguardandoLoja} pedidos esperando prévia.`}
                </span>
              </span>
            </Link>
          </li>
          <li>
            <Link
              href="/admin/orcamentos"
              className="flex min-h-28 items-start gap-4 rounded-[20px] bg-papel p-6 transition hover:ring-2 hover:ring-tinta"
            >
              <ClipboardList aria-hidden="true" className="size-7 shrink-0" strokeWidth={1.5} />
              <span>
                <span className="block font-titulo text-[20px] font-bold uppercase">Orçamentos</span>
                <span className="mt-1 block text-[14px] text-apoio">
                  {orcamentosNovos === 0
                    ? "Nenhum orçamento novo."
                    : orcamentosNovos === 1
                      ? "1 orçamento novo."
                      : `${orcamentosNovos} orçamentos novos.`}
                </span>
              </span>
            </Link>
          </li>
        </ul>
      </div>
    </div>
  );
}
