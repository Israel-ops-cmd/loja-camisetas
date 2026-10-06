import type { Metadata } from "next";
import Link from "next/link";

import { FormularioOrcamento } from "@/components/atacado/FormularioOrcamento";
import { listarFaixasDeAtacado } from "@/lib/atacado";
import { descreverFaixa } from "@/lib/atacado-regras";
import { obterUsuario } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = {
  alternates: { canonical: "/atacado" },
  title: "Atacado",
  description:
    "Camisetas em quantidade para empresas, igrejas, eventos e revenda, com desconto progressivo e orçamento sob medida.",
};

function hojeEmSaoPaulo() {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "America/Sao_Paulo" }).format(new Date());
}

export default async function PaginaAtacado() {
  const [faixas, usuario] = await Promise.all([listarFaixasDeAtacado(), obterUsuario()]);
  const cliente = usuario
    ? await prisma.cliente.findUnique({ where: { id: usuario.id }, select: { telefone: true } })
    : null;

  return (
    <>
      <section className="secao bg-tinta text-papel">
        <div className="mx-auto max-w-7xl">
          <p className="sobretitulo text-secundario-escuro">Atacado</p>
          <h1 className="titulo-destaque mt-5">Comprando em quantidade?</h1>
          <p className="texto-destaque mt-6 max-w-2xl text-apoio-escuro">
            Camisetas para empresas, igrejas, eventos e revenda, com preço menor por
            quantidade. Conte o que você precisa e a gente monta o orçamento.
          </p>
        </div>
      </section>

      {faixas.length > 0 && (
        <section aria-labelledby="titulo-descontos" className="secao">
          <div className="mx-auto max-w-5xl">
            <h2 id="titulo-descontos" className="titulo-listagem">Desconto por quantidade</h2>
            <p className="mx-auto mt-4 max-w-2xl text-center text-apoio">
              O desconto entra sozinho no carrinho, somando todas as peças, de qualquer
              produto da loja.
            </p>
            <ul className="mt-10 grid gap-4 sm:grid-cols-3">
              {faixas.map((faixa, i) => (
                <li key={faixa.minimoDePecas} className="rounded-[20px] bg-papel p-6 text-center">
                  <p className="font-titulo text-[44px] leading-none font-black">{faixa.percentual}%</p>
                  <p className="mt-2 text-[13px] font-bold tracking-[0.16em] text-secundario uppercase">de desconto</p>
                  <p className="mt-4 text-[15px] font-semibold">{descreverFaixa(faixa, faixas[i + 1])}</p>
                </li>
              ))}
            </ul>
            <p className="mt-6 text-center text-[14px] text-apoio">
              Quer a sua arte na camiseta? O preço é orçado junto com a prévia, na{" "}
              <Link href="/personalizacao" className="underline underline-offset-4">personalização</Link>.
            </p>
          </div>
        </section>
      )}

      <section id="orcamento" aria-labelledby="titulo-orcamento" className="secao scroll-mt-18 bg-papel">
        <div className="mx-auto max-w-3xl">
          <h2 id="titulo-orcamento" className="titulo-listagem">Pedir orçamento</h2>
          <p className="mx-auto mt-4 max-w-xl text-center text-apoio">
            Para quantidades maiores, revenda ou um pedido diferente do que está no site.
          </p>
          <div className="mt-10">
            <FormularioOrcamento
              inicial={{
                nome: usuario?.nome ?? "",
                email: usuario?.email ?? "",
                telefone: cliente?.telefone ?? "",
              }}
              hoje={hojeEmSaoPaulo()}
            />
          </div>
        </div>
      </section>
    </>
  );
}
