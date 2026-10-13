import Link from "next/link";
import { Boxes, ClipboardList, Package, Palette, Percent, Shirt, Stamp } from "lucide-react";

import { LimpezaDeArquivos } from "@/components/admin/LimpezaDeArquivos";
import { listarArquivosEsquecidos } from "@/lib/arquivos-esquecidos";
import { exigirAdministrador } from "@/lib/auth";
import { formatarTamanhoDoArquivo } from "@/lib/personalizacao-regras";
import { LIMITE_ULTIMAS_UNIDADES, STATUS_ESPERANDO_ENVIO } from "@/lib/estoque-regras";
import { prisma } from "@/lib/prisma";

export default async function PaginaPainel() {
  const usuario = await exigirAdministrador();
  // Peças lisas usadas por algo à venda na loja. As prontas são opcionais:
  // só contam quando faltam (pedido pago sem peça, de antes das lisas).
  const lisasEmUso = { variacoes: { some: { ativo: true, produto: { ativo: true } } } };
  const [aguardandoLoja, orcamentosNovos, produtosNaLoja, acabando, lisasFaltando, prontasFaltando, faixasLigadas, paraEstampar] =
    await Promise.all([
      prisma.personalizacao.count({ where: { status: { in: ["RECEBIDA", "AJUSTE_SOLICITADO"] } } }),
      prisma.orcamento.count({ where: { status: "NOVO" } }),
      prisma.produto.count({ where: { ativo: true } }),
      prisma.pecaLisa.count({ where: { ...lisasEmUso, estoque: { gte: 0, lte: LIMITE_ULTIMAS_UNIDADES } } }),
      prisma.pecaLisa.count({ where: { estoque: { lt: 0 } } }),
      prisma.variacao.count({ where: { estoque: { lt: 0 } } }),
      prisma.faixaAtacado.count({ where: { ativo: true } }),
      prisma.itemPedido.aggregate({
        where: { estampar: true, estampadoEm: null, pedido: { status: { in: STATUS_ESPERANDO_ENVIO } } },
        _sum: { quantidadeDaLisa: true },
      }),
    ]);
  const faltando = lisasFaltando + prontasFaltando;
  const pecasParaEstampar = paraEstampar._sum.quantidadeDaLisa ?? 0;
  const [paraSeparar, comAlerta, arquivosParaLimpar] = await Promise.all([
    prisma.pedido.count({ where: { status: { in: ["PAGO", "EM_SEPARACAO"] } } }),
    prisma.pedido.count({ where: { alerta: { not: null } } }),
    listarArquivosEsquecidos(),
  ]);
  const pendentes =
    arquivosParaLimpar.length > 0
      ? {
          quantidade: arquivosParaLimpar.length,
          tamanho: formatarTamanhoDoArquivo(arquivosParaLimpar.reduce((soma, a) => soma + a.bytes, 0)),
        }
      : null;

  return (
    <div className="secao">
      <div className="mx-auto max-w-5xl">
        <p className="sobretitulo text-secundario">Painel</p>
        <h1 className="titulo-destaque mt-4">Olá, {usuario.nome}.</h1>
        <ul className="mt-10 grid gap-4 sm:grid-cols-2">
          <li>
            <Link
              href="/admin/pedidos"
              className={`flex min-h-28 items-start gap-4 rounded-[20px] p-6 transition hover:ring-2 hover:ring-tinta ${paraSeparar + comAlerta > 0 ? "bg-tinta text-papel" : "bg-papel"}`}
            >
              <Package aria-hidden="true" className="size-7 shrink-0" strokeWidth={1.5} />
              <span>
                <span className="block font-titulo text-[20px] font-bold uppercase">Pedidos</span>
                <span className={`mt-1 block text-[14px] ${paraSeparar + comAlerta > 0 ? "" : "text-apoio"}`}>
                  {paraSeparar === 0
                    ? "Nenhum pedido para separar."
                    : paraSeparar === 1
                      ? "1 pedido para separar e enviar."
                      : `${paraSeparar} pedidos para separar e enviar.`}
                  {comAlerta > 0 && (comAlerta === 1 ? " 1 precisa de decisão." : ` ${comAlerta} precisam de decisão.`)}
                </span>
              </span>
            </Link>
          </li>
          <li>
            <Link
              href="/admin/producao"
              className={`flex min-h-28 items-start gap-4 rounded-[20px] p-6 transition hover:ring-2 hover:ring-tinta ${pecasParaEstampar > 0 ? "bg-tinta text-papel" : "bg-papel"}`}
            >
              <Stamp aria-hidden="true" className="size-7 shrink-0" strokeWidth={1.5} />
              <span>
                <span className="block font-titulo text-[20px] font-bold uppercase">Produção</span>
                <span className={`mt-1 block text-[14px] ${pecasParaEstampar > 0 ? "" : "text-apoio"}`}>
                  {pecasParaEstampar === 0
                    ? "Nada para estampar."
                    : pecasParaEstampar === 1
                      ? "1 peça para estampar."
                      : `${pecasParaEstampar} peças para estampar.`}
                </span>
              </span>
            </Link>
          </li>
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
              href={
                faltando > 0
                  ? `/admin/estoque?${lisasFaltando > 0 ? "" : "aba=prontas&"}filtro=faltando`
                  : acabando > 0
                    ? "/admin/estoque?filtro=acabando"
                    : "/admin/estoque"
              }
              className="flex min-h-28 items-start gap-4 rounded-[20px] bg-papel p-6 transition hover:ring-2 hover:ring-tinta"
            >
              <Boxes aria-hidden="true" className="size-7 shrink-0" strokeWidth={1.5} />
              <span>
                <span className="block font-titulo text-[20px] font-bold uppercase">Estoque</span>
                <span className="mt-1 block text-[14px] text-apoio">
                  {faltando > 0
                    ? `${faltando === 1 ? "1 tamanho" : `${faltando} tamanhos`} com peça faltando para pedido pago.`
                    : acabando === 0
                      ? "Nenhuma peça lisa acabando."
                      : `${acabando === 1 ? "1 tamanho de peça lisa acabando" : `${acabando} tamanhos de peça lisa acabando`} (${LIMITE_ULTIMAS_UNIDADES} ou menos).`}
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

        <section className="mt-10 rounded-[20px] bg-papel p-6 sm:p-8">
          <h2 className="sobretitulo">Manutenção</h2>
          <div className="mt-4">
            <LimpezaDeArquivos pendentes={pendentes} />
          </div>
        </section>
      </div>
    </div>
  );
}
