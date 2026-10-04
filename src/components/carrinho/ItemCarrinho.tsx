"use client";

import Image from "next/image";
import Link from "next/link";
import { CircleAlert, Trash2 } from "lucide-react";
import { useEffect, useRef, useState, useTransition } from "react";

import { alterarQuantidade, removerDoCarrinho } from "@/app/carrinho/acoes";
import { avisarCarrinhoAtualizado } from "@/components/carrinho/ContadorCarrinho";
import { SeletorQuantidade } from "@/components/ui/SeletorQuantidade";
import type { ItemDoCarrinho } from "@/lib/carrinho";
import { formatarPreco } from "@/lib/formatacao";

/** Espera o cliente parar de clicar antes de gravar a nova quantidade. */
const ESPERA_MS = 400;

export function ItemCarrinho({ item }: { item: ItemDoCarrinho }) {
  const [quantidade, setQuantidade] = useState(item.quantidade);
  const [erro, setErro] = useState<string | null>(null);
  const [salvando, iniciar] = useTransition();
  const espera = useRef<ReturnType<typeof setTimeout>>(undefined);

  // Quando o servidor devolve uma quantidade nova (correção de estoque),
  // o campo acompanha.
  const [quantidadeDoServidor, setQuantidadeDoServidor] = useState(
    item.quantidade,
  );
  if (item.quantidade !== quantidadeDoServidor) {
    setQuantidadeDoServidor(item.quantidade);
    setQuantidade(item.quantidade);
  }

  useEffect(() => () => clearTimeout(espera.current), []);

  function mudarQuantidade(nova: number) {
    setQuantidade(nova);
    setErro(null);
    clearTimeout(espera.current);
    espera.current = setTimeout(() => {
      iniciar(async () => {
        const resposta = await alterarQuantidade(item.variacaoId, nova);
        if (resposta.ok) {
          avisarCarrinhoAtualizado();
        } else {
          setErro(resposta.erro);
          setQuantidade(item.quantidade);
        }
      });
    }, ESPERA_MS);
  }

  function remover() {
    clearTimeout(espera.current);
    iniciar(async () => {
      await removerDoCarrinho(item.variacaoId);
      avisarCarrinhoAtualizado();
    });
  }

  const subtotal = item.precoUnitarioEmCentavos * quantidade;

  return (
    <li
      className={`flex gap-4 py-6 transition sm:gap-6 ${salvando ? "opacity-60" : ""}`}
    >
      <Link
        href={`/produtos/${item.produto.slug}`}
        className="relative size-24 shrink-0 overflow-hidden rounded-xl bg-produto sm:size-32"
        tabIndex={-1}
        aria-hidden="true"
      >
        {item.foto && (
          <Image
            src={item.foto.url}
            alt=""
            fill
            sizes="128px"
            className={`object-cover ${item.esgotado ? "opacity-50" : ""}`}
          />
        )}
      </Link>

      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h2 className="text-[14px] font-semibold tracking-[0.1em] uppercase">
              <Link
                href={`/produtos/${item.produto.slug}`}
                className="hover:text-secundario"
              >
                {item.produto.nome}
              </Link>
            </h2>
            <p className="mt-1 flex items-center gap-2 text-[14px] text-apoio">
              <span
                aria-hidden="true"
                className="size-3.5 rounded border border-borda"
                style={{ backgroundColor: item.cor.hex }}
              />
              {item.cor.nome} · Tamanho {item.tamanho}
            </p>
            <p className="mt-1 text-[14px] text-secundario">
              {formatarPreco(item.precoUnitarioEmCentavos)} cada
            </p>
          </div>

          <button
            type="button"
            onClick={remover}
            disabled={salvando}
            className="-mt-2 -mr-2 flex size-11 shrink-0 items-center justify-center rounded-full transition hover:bg-fundo"
          >
            <Trash2 aria-hidden="true" className="size-5" strokeWidth={1.6} />
            <span className="sr-only">Remover {item.produto.nome}</span>
          </button>
        </div>

        <div className="mt-auto flex flex-wrap items-end justify-between gap-3 pt-4">
          {item.esgotado ? (
            <p className="rounded-full bg-tinta px-3 py-1 text-[11px] font-bold tracking-[0.16em] text-papel uppercase">
              Esgotado
            </p>
          ) : (
            <SeletorQuantidade
              valor={quantidade}
              maximo={item.estoque}
              aoMudar={mudarQuantidade}
              rotulo={`Quantidade de ${item.produto.nome}`}
            />
          )}
          {!item.esgotado && (
            <p className="font-titulo text-[20px] font-extrabold">
              {formatarPreco(subtotal)}
            </p>
          )}
        </div>

        {erro && (
          <p
            role="alert"
            className="mt-3 flex items-start gap-2 text-[14px] font-semibold"
          >
            <CircleAlert
              aria-hidden="true"
              className="mt-0.5 size-4 shrink-0"
              strokeWidth={1.6}
            />
            {erro}
          </p>
        )}
      </div>
    </li>
  );
}
