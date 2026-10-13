"use client";

import Image from "next/image";
import Link from "next/link";
import { ChevronDown, CircleAlert, Shirt } from "lucide-react";
import { useState, useTransition, type ReactNode } from "react";

import { adicionarAoCarrinho } from "@/app/carrinho/acoes";
import { avisarCarrinhoAtualizado } from "@/components/carrinho/ContadorCarrinho";
import { classesBotao } from "@/components/ui/Botao";
import { TabelaDeMedidas } from "@/components/produto/TabelaDeMedidas";
import { SeletorQuantidade } from "@/components/ui/SeletorQuantidade";
import { formatarPreco } from "@/lib/formatacao";
import { PRAZO_DE_DESPACHO, PRAZO_DE_DESPACHO_A_ESTAMPAR } from "@/lib/politicas";
import type { ProdutoDetalhe } from "@/lib/produto";
import { fotosDaEscolha } from "@/lib/produtos-regras";

type DetalheProdutoProps = {
  produto: ProdutoDetalhe;
  limiteUltimasUnidades: number;
  /** Conteúdo abaixo da escolha (atacado, descrição), renderizado no servidor. */
  children?: ReactNode;
};

export function DetalheProduto({
  produto,
  limiteUltimasUnidades,
  children,
}: DetalheProdutoProps) {
  // Escolha em ordem: modelo, cor, tamanho. Com um modelo (ou uma cor) só,
  // ele já vem escolhido.
  const modeloUnico = produto.modelos.length === 1 ? produto.modelos[0].id : null;
  const [modeloId, setModeloId] = useState<string | null>(modeloUnico);
  const coresIniciais = coresDoModelo(modeloUnico);
  const [corId, setCorId] = useState<string | null>(
    coresIniciais.length === 1 ? coresIniciais[0].id : null,
  );
  const [tamanhoId, setTamanhoId] = useState<string | null>(null);
  const [fotoAtiva, setFotoAtiva] = useState(0);
  const [quantidade, setQuantidade] = useState(1);
  const [resultado, setResultado] = useState<
    { tipo: "ok" | "erro"; mensagem: string } | null
  >(null);
  const [adicionando, iniciarAdicao] = useTransition();

  function variacoesDoModelo(id: string | null) {
    return id ? produto.variacoes.filter((v) => v.modeloId === id) : produto.variacoes;
  }
  function coresDoModelo(id: string | null) {
    const variacoes = variacoesDoModelo(id);
    return produto.cores.filter((c) => variacoes.some((v) => v.corId === c.id));
  }

  const doModelo = variacoesDoModelo(modeloId);
  const cores = coresDoModelo(modeloId);
  const tamanhos = produto.tamanhos.filter((t) => doModelo.some((v) => v.tamanhoId === t.id));
  const variacoesDaCor = corId ? doModelo.filter((v) => v.corId === corId) : doModelo;

  /** Menor preço de cada modelo, para mostrar no botão do modelo. */
  const precoDoModelo = (id: string) => Math.min(...variacoesDoModelo(id).map((v) => v.precoEmCentavos));

  /** Estoque por tamanho na cor escolhida (ou em qualquer cor, se nenhuma). */
  const estoquePorTamanho = new Map<string, number>();
  for (const v of variacoesDaCor) {
    estoquePorTamanho.set(
      v.tamanhoId,
      (estoquePorTamanho.get(v.tamanhoId) ?? 0) + Math.max(v.estoque, 0),
    );
  }

  const variacao =
    modeloId && corId && tamanhoId
      ? doModelo.find((v) => v.corId === corId && v.tamanhoId === tamanhoId)
      : undefined;

  const precos = variacoesDaCor.map((v) => v.precoEmCentavos);
  const preco = variacao?.precoEmCentavos ?? Math.min(...precos);
  const precoVaria = !variacao && new Set(precos).size > 1;

  const esgotado = produto.variacoes.every((v) => v.estoque <= 0);

  const imagens = fotosDaEscolha(produto.imagens, { modeloId, corId });
  const foto = imagens[Math.min(fotoAtiva, imagens.length - 1)];

  const nomeDaCor = produto.cores.find((c) => c.id === corId)?.nome;
  const nomeDoModelo = produto.modelos.find((m) => m.id === modeloId)?.nome;

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

  function escolherModelo(id: string) {
    setModeloId(id);
    setResultado(null);
    setFotoAtiva(0);
    // Mantém a cor e o tamanho só se existirem no novo modelo.
    const novasCores = coresDoModelo(id);
    const cor = novasCores.some((c) => c.id === corId)
      ? corId
      : novasCores.length === 1
        ? novasCores[0].id
        : null;
    setCorId(cor);
    if (tamanhoId) {
      const temNoModelo = variacoesDoModelo(id).some(
        (v) => (!cor || v.corId === cor) && v.tamanhoId === tamanhoId && v.estoque > 0,
      );
      if (!temNoModelo) setTamanhoId(null);
    }
  }

  function escolherCor(id: string) {
    setCorId(id);
    setResultado(null);
    setFotoAtiva(0);
    // Mantém o tamanho só se ele tiver estoque na nova cor.
    if (tamanhoId) {
      const temNaNovaCor = doModelo.some(
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
              loading={fotoAtiva === 0 ? "eager" : undefined}
              fetchPriority={fotoAtiva === 0 ? "high" : undefined}
              sizes="(min-width: 1280px) 600px, (min-width: 1024px) 50vw, 100vw"
              className="object-contain"
            />
          ) : (
            <Shirt aria-hidden="true" className="size-24 text-secundario/40" strokeWidth={1} />
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

        {produto.modelos.length > 1 && (
          <fieldset className="mt-8">
            <legend className="sobretitulo">
              Modelo
              {nomeDoModelo && (
                <span className="ml-2 font-semibold tracking-normal text-apoio normal-case">
                  {nomeDoModelo}
                </span>
              )}
            </legend>
            <div className="mt-3 flex flex-wrap gap-2">
              {produto.modelos.map((modelo) => {
                const ativo = modelo.id === modeloId;
                return (
                  <button
                    key={modelo.id}
                    type="button"
                    onClick={() => escolherModelo(modelo.id)}
                    aria-pressed={ativo}
                    className={`flex min-h-14 flex-col items-start justify-center rounded-lg border px-4 py-2 text-left transition ${
                      ativo ? "border-tinta bg-tinta text-papel" : "border-borda bg-papel hover:border-tinta"
                    }`}
                  >
                    <span className="text-[14px] font-bold">{modelo.nome}</span>
                    <span className={`text-[13px] ${ativo ? "" : "text-secundario"}`}>
                      {formatarPreco(precoDoModelo(modelo.id))}
                    </span>
                  </button>
                );
              })}
            </div>
          </fieldset>
        )}

        {cores.length > 0 && (
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
              {cores.map((cor) => {
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
            {tamanhos.map((tamanho) => {
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
            precisaDeModelo={!modeloId}
            precisaDeCor={!corId && cores.length > 1}
            estoque={variacao?.estoque}
            limite={limiteUltimasUnidades}
          />
        </p>
        {variacao && variacao.estoque > 0 && (
          <p className="mt-1 text-[14px] text-apoio">
            {quantidadeValida <= variacao.prontaEntrega
              ? `Pronta entrega: despacho em ${PRAZO_DE_DESPACHO} depois do pagamento.`
              : `Estampada para você: despacho em ${PRAZO_DE_DESPACHO_A_ESTAMPAR} depois do pagamento.`}
          </p>
        )}

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

        <details className="group mt-8 border-y border-borda">
          <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between gap-4 font-semibold [&::-webkit-details-marker]:hidden">
            Tabela de medidas{nomeDoModelo && produto.modelos.length > 1 ? ` · ${nomeDoModelo}` : ""}
            <ChevronDown
              aria-hidden="true"
              className="size-5 shrink-0 transition group-open:rotate-180"
              strokeWidth={1.6}
            />
          </summary>
          {/* Com o modelo escolhido, só a tabela dele. */}
          <TabelaDeMedidas
            modelos={modeloId ? produto.modelos.filter((m) => m.id === modeloId) : produto.modelos}
          />
        </details>
      </div>
    </div>
  );
}

function Disponibilidade({
  esgotado,
  precisaDeModelo,
  precisaDeCor,
  estoque,
  limite,
}: {
  esgotado: boolean;
  precisaDeModelo: boolean;
  precisaDeCor: boolean;
  estoque: number | undefined;
  limite: number;
}) {
  if (esgotado) return <span>Esgotado no momento.</span>;
  if (precisaDeModelo) return <span className="text-apoio">Escolha um modelo.</span>;
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
