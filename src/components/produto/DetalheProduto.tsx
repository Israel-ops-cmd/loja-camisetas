"use client";

import Image from "next/image";
import Link from "next/link";
import { CircleAlert } from "lucide-react";
import { useState, useTransition, type ReactNode } from "react";

import { adicionarAoCarrinho } from "@/app/carrinho/acoes";
import { avisarCarrinhoAtualizado } from "@/components/carrinho/ContadorCarrinho";
import { classesBotao } from "@/components/ui/Botao";
import { SeletorQuantidade } from "@/components/ui/SeletorQuantidade";
import { formatarPreco } from "@/lib/formatacao";
import type { ProdutoDetalhe } from "@/lib/produto";

type DetalheProdutoProps = {
  produto: ProdutoDetalhe;
  limiteUltimasUnidades: number;
  /** Conteúdo abaixo da escolha (descrição, medidas), renderizado no servidor. */
  children?: ReactNode;
};

export function DetalheProduto({
  produto,
  limiteUltimasUnidades,
  children,
}: DetalheProdutoProps) {
  const [corId, setCorId] = useState<string | null>(
    produto.cores.length === 1 ? produto.cores[0].id : null,
  );
  const [tamanhoId, setTamanhoId] = useState<string | null>(null);
  const [fotoAtiva, setFotoAtiva] = useState(0);
  const [quantidade, setQuantidade] = useState(1);
  const [resultado, setResultado] = useState<
    { tipo: "ok" | "erro"; mensagem: string } | null
  >(null);
  const [adicionando, iniciarAdicao] = useTransition();

  const variacoesDaCor = corId
    ? produto.variacoes.filter((v) => v.corId === corId)
    : produto.variacoes;

  /** Estoque por tamanho na cor escolhida (ou em qualquer cor, se nenhuma). */
  const estoquePorTamanho = new Map<string, number>();
  for (const v of variacoesDaCor) {
    estoquePorTamanho.set(
      v.tamanhoId,
      (estoquePorTamanho.get(v.tamanhoId) ?? 0) + Math.max(v.estoque, 0),
    );
  }

  const variacao =
    corId && tamanhoId
      ? produto.variacoes.find(
          (v) => v.corId === corId && v.tamanhoId === tamanhoId,
        )
      : undefined;

  const precos = variacoesDaCor.map((v) => v.precoEmCentavos);
  const preco = variacao?.precoEmCentavos ?? Math.min(...precos);
  const precoVaria = !variacao && new Set(precos).size > 1;

  const esgotado = produto.variacoes.every((v) => v.estoque <= 0);

  const imagensDaCor = corId
    ? produto.imagens.filter((i) => i.corId === null || i.corId === corId)
    : produto.imagens;
  const imagens = imagensDaCor.length > 0 ? imagensDaCor : produto.imagens;
  const foto = imagens[Math.min(fotoAtiva, imagens.length - 1)];

  const nomeDaCor = produto.cores.find((c) => c.id === corId)?.nome;

  // A quantidade nunca passa do estoque da variação escolhida.
  const quantidadeMaxima = Math.max(variacao?.estoque ?? 1, 1);
  const quantidadeValida = Math.min(quantidade, quantidadeMaxima);
  const podeAdicionar = !!variacao && variacao.estoque > 0 && !adicionando;

  function adicionar() {
    if (!variacao) return;
    setResultado(null);
    iniciarAdicao(async () => {
      const resposta = await adicionarAoCarrinho(variacao.id, quantidadeValida);
      if (resposta.ok) {
        avisarCarrinhoAtualizado();
        setQuantidade(1);
        setResultado({
          tipo: "ok",
          mensagem:
            quantidadeValida === 1
              ? "Adicionado ao carrinho."
              : `${quantidadeValida} peças adicionadas ao carrinho.`,
        });
      } else {
        setResultado({ tipo: "erro", mensagem: resposta.erro });
      }
    });
  }

  function escolherCor(id: string) {
    setCorId(id);
    setResultado(null);
    setFotoAtiva(0);
    // Mantém o tamanho só se ele tiver estoque na nova cor.
    if (tamanhoId) {
      const temNaNovaCor = produto.variacoes.some(
        (v) => v.corId === id && v.tamanhoId === tamanhoId && v.estoque > 0,
      );
      if (!temNaNovaCor) setTamanhoId(null);
    }
  }

  return (
    <div className="grid gap-10 lg:grid-cols-2 lg:gap-16">
      {/* Galeria */}
      <div>
        <div className="relative flex aspect-square items-center justify-center overflow-hidden rounded-[20px] bg-produto">
          {foto ? (
            <Image
              key={foto.id}
              src={foto.url}
              alt={foto.alt}
              fill
              preload={fotoAtiva === 0}
              sizes="(min-width: 1280px) 600px, (min-width: 1024px) 50vw, 100vw"
              className="object-contain"
            />
          ) : (
            <span className="text-[12px] font-semibold tracking-[0.2em] text-secundario">
              [FOTO]
            </span>
          )}
        </div>

        {imagens.length > 1 && (
          <ul className="mt-3 grid grid-cols-5 gap-3">
            {imagens.map((imagem, indice) => {
              const ativa = imagem.id === foto?.id;
              return (
                <li key={imagem.id}>
                  <button
                    type="button"
                    onClick={() => setFotoAtiva(indice)}
                    aria-label={`Ver foto ${indice + 1} de ${imagens.length}`}
                    aria-pressed={ativa}
                    className={`relative block aspect-square w-full overflow-hidden rounded-xl bg-produto transition ${ativa ? "ring-2 ring-tinta ring-offset-2" : "opacity-70 hover:opacity-100"}`}
                  >
                    <Image
                      src={imagem.url}
                      alt=""
                      fill
                      sizes="120px"
                      className="object-cover"
                      style={
                        imagem.enquadramento
                          ? { objectPosition: imagem.enquadramento }
                          : undefined
                      }
                    />
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {/* Informações e escolha */}
      <div>
        <h1 className="font-titulo text-[clamp(30px,3.6vw,46px)] leading-[1.02] font-black uppercase">
          {produto.nome}
        </h1>

        <p className="mt-4 font-titulo text-[28px] font-extrabold">
          {precoVaria && (
            <span className="mr-2 font-sans text-[14px] font-semibold text-secundario">
              A partir de
            </span>
          )}
          {formatarPreco(preco)}
        </p>

        {produto.cores.length > 0 && (
          <fieldset className="mt-8">
            <legend className="sobretitulo">
              Cor
              {nomeDaCor && (
                <span className="ml-2 font-semibold tracking-normal text-apoio normal-case">
                  {nomeDaCor}
                </span>
              )}
            </legend>
            <div className="mt-3 flex flex-wrap gap-2">
              {produto.cores.map((cor) => {
                const ativa = cor.id === corId;
                return (
                  <button
                    key={cor.id}
                    type="button"
                    onClick={() => escolherCor(cor.id)}
                    aria-pressed={ativa}
                    aria-label={cor.nome}
                    title={cor.nome}
                    className="flex size-11 items-center justify-center rounded-lg"
                  >
                    <span
                      className={`size-8 rounded-md border transition ${ativa ? "border-tinta ring-2 ring-tinta ring-offset-2" : "border-borda"}`}
                      style={{ backgroundColor: cor.hex }}
                    />
                  </button>
                );
              })}
            </div>
          </fieldset>
        )}

        <fieldset className="mt-8">
          <legend className="sobretitulo">Tamanho</legend>
          <div className="mt-3 flex flex-wrap gap-2">
            {produto.tamanhos.map((tamanho) => {
              const disponivel = (estoquePorTamanho.get(tamanho.id) ?? 0) > 0;
              const ativo = tamanho.id === tamanhoId;
              return (
                <button
                  key={tamanho.id}
                  type="button"
                  disabled={!disponivel}
                  onClick={() => {
                    setTamanhoId(ativo ? null : tamanho.id);
                    setResultado(null);
                  }}
                  aria-pressed={ativo}
                  aria-label={
                    disponivel ? tamanho.nome : `${tamanho.nome}, esgotado`
                  }
                  className={`flex h-12 min-w-14 items-center justify-center rounded-lg border px-4 text-[14px] font-bold transition ${
                    ativo
                      ? "border-tinta bg-tinta text-papel"
                      : disponivel
                        ? "border-borda bg-papel hover:border-tinta"
                        : "cursor-not-allowed border-borda bg-fundo text-secundario line-through"
                  }`}
                >
                  {tamanho.nome}
                </button>
              );
            })}
          </div>
        </fieldset>

        <p role="status" className="mt-5 min-h-6 text-[15px] font-semibold">
          <Disponibilidade
            esgotado={esgotado}
            precisaDeCor={!corId && produto.cores.length > 1}
            estoque={variacao?.estoque}
            limite={limiteUltimasUnidades}
          />
        </p>

        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <SeletorQuantidade
            valor={quantidadeValida}
            maximo={quantidadeMaxima}
            aoMudar={(valor) => {
              setQuantidade(valor);
              setResultado(null);
            }}
            desativado={!variacao || variacao.estoque <= 0}
          />
          <button
            type="button"
            onClick={adicionar}
            disabled={!podeAdicionar}
            className={`${classesBotao("principal")} flex-1`}
          >
            {adicionando ? "Adicionando…" : "Adicionar ao carrinho"}
          </button>
        </div>

        <div aria-live="polite" className="mt-3 min-h-6 text-[15px]">
          {resultado?.tipo === "ok" && (
            <p className="font-semibold">
              {resultado.mensagem}{" "}
              <Link
                href="/carrinho"
                className="underline underline-offset-4 hover:text-secundario"
              >
                Ver carrinho
              </Link>
            </p>
          )}
          {resultado?.tipo === "erro" && (
            <p className="flex items-start gap-2 font-semibold">
              <CircleAlert
                aria-hidden="true"
                className="mt-0.5 size-5 shrink-0"
                strokeWidth={1.6}
              />
              {resultado.mensagem}
            </p>
          )}
        </div>

        {children}
      </div>
    </div>
  );
}

function Disponibilidade({
  esgotado,
  precisaDeCor,
  estoque,
  limite,
}: {
  esgotado: boolean;
  precisaDeCor: boolean;
  estoque: number | undefined;
  limite: number;
}) {
  if (esgotado) return <span>Esgotado no momento.</span>;
  if (precisaDeCor) return <span className="text-apoio">Escolha uma cor.</span>;
  if (estoque === undefined)
    return <span className="text-apoio">Escolha um tamanho.</span>;
  if (estoque <= 0) return <span>Esgotado nesse tamanho.</span>;
  if (estoque <= limite) {
    return (
      <span>
        {estoque === 1 ? "Última unidade!" : `Últimas ${estoque} unidades!`}
      </span>
    );
  }
  return <span>Em estoque.</span>;
}
