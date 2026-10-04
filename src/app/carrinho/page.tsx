import type { Metadata } from "next";
import { CircleAlert } from "lucide-react";

import { ItemCarrinho } from "@/components/carrinho/ItemCarrinho";
import { SincronizarCarrinho } from "@/components/carrinho/SincronizarCarrinho";
import { Botao } from "@/components/ui/Botao";
import { obterCarrinho } from "@/lib/carrinho";
import { formatarPreco } from "@/lib/formatacao";

export const metadata: Metadata = {
  title: "Carrinho",
  robots: { index: false },
};

export default async function PaginaCarrinho() {
  const carrinho = await obterCarrinho();

  return (
    <div className="secao">
      <div className="mx-auto max-w-6xl">
        <h1 className="titulo-listagem">Carrinho</h1>

        {carrinho.precisaSincronizar && <SincronizarCarrinho />}

        {carrinho.avisos.length > 0 && (
          <ul
            role="status"
            className="mx-auto mt-10 max-w-3xl space-y-2 rounded-[20px] border border-borda bg-papel p-5"
          >
            {carrinho.avisos.map((aviso) => (
              <li
                key={aviso}
                className="flex items-start gap-2 text-[15px] font-semibold"
              >
                <CircleAlert
                  aria-hidden="true"
                  className="mt-0.5 size-5 shrink-0"
                  strokeWidth={1.6}
                />
                {aviso}
              </li>
            ))}
          </ul>
        )}

        {carrinho.itens.length === 0 ? (
          <div className="mt-12 flex flex-col items-center rounded-[20px] bg-papel px-6 py-16 text-center">
            <p className="font-titulo text-[22px] font-bold uppercase">
              Seu carrinho está vazio
            </p>
            <p className="mt-3 max-w-md text-apoio">
              Escolha suas camisetas e elas aparecem aqui.
            </p>
            <Botao href="/produtos" className="mt-8">
              Ver produtos
            </Botao>
          </div>
        ) : (
          <div className="mt-12 grid gap-10 lg:grid-cols-[1fr_360px] lg:items-start">
            <ul className="divide-y divide-borda border-y border-borda">
              {carrinho.itens.map((item) => (
                <ItemCarrinho key={item.variacaoId} item={item} />
              ))}
            </ul>

            <section
              aria-labelledby="titulo-resumo"
              className="rounded-[20px] bg-papel p-6 lg:sticky lg:top-24"
            >
              <h2 id="titulo-resumo" className="sobretitulo">
                Resumo
              </h2>
              <dl className="mt-5 space-y-3 text-[15px]">
                <div className="flex justify-between gap-4">
                  <dt className="text-apoio">
                    Subtotal (
                    {carrinho.quantidadeDePecas === 1
                      ? "1 peça"
                      : `${carrinho.quantidadeDePecas} peças`}
                    )
                  </dt>
                  <dd className="font-semibold">
                    {formatarPreco(carrinho.subtotalEmCentavos)}
                  </dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-apoio">Frete</dt>
                  <dd className="text-right text-secundario">
                    Calculado na próxima etapa
                  </dd>
                </div>
                <div className="flex items-baseline justify-between gap-4 border-t border-borda pt-4">
                  <dt className="font-semibold">Total sem frete</dt>
                  <dd className="font-titulo text-[26px] font-extrabold">
                    {formatarPreco(carrinho.subtotalEmCentavos)}
                  </dd>
                </div>
              </dl>
              <Botao
                href="/produtos"
                variante="secundario"
                className="mt-6 w-full"
              >
                Continuar comprando
              </Botao>
            </section>
          </div>
        )}
      </div>
    </div>
  );
}
