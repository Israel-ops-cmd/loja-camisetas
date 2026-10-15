"use client";

import Image from "next/image";
import Link from "next/link";
import { ChevronDown, CircleAlert, Shirt } from "lucide-react";
import { useRef, useState, useTransition, type ReactNode, type Ref } from "react";

import { adicionarAoCarrinho } from "@/app/carrinho/acoes";
import { avisarCarrinhoAtualizado } from "@/components/carrinho/ContadorCarrinho";
import { TabelaDeMedidas } from "@/components/produto/TabelaDeMedidas";
import { classesBotao } from "@/components/ui/Botao";
import { SeletorQuantidade } from "@/components/ui/SeletorQuantidade";
import { formatarPreco } from "@/lib/formatacao";
import { PRAZO_DE_DESPACHO, PRAZO_DE_DESPACHO_A_ESTAMPAR } from "@/lib/politicas";
import type { ProdutoDetalhe } from "@/lib/produto";
import { fotosDaEscolha } from "@/lib/produtos-regras";

type DetalheProdutoProps = {
  produto: ProdutoDetalhe;
  limiteUltimasUnidades: number;
  /** Linha abaixo do preço (parcelas e atacado). */
  condicoes: string;
  /** Texto da sanfona "Envio e troca". */
  envioETroca: ReactNode;
};

export function DetalheProduto({ produto, limiteUltimasUnidades, condicoes, envioETroca }: DetalheProdutoProps) {
  // Escolha em ordem: modelo, cor, tamanho. Com um modelo (ou uma cor) só,
  // ele já vem escolhido.
  const modeloUnico = produto.modelos.length === 1 ? produto.modelos[0].id : null;
  const [modeloId, setModeloId] = useState<string | null>(modeloUnico);
  const coresIniciais = coresDoModelo(modeloUnico);
  const [corId, setCorId] = useState<string | null>(coresIniciais.length === 1 ? coresIniciais[0].id : null);
  const [tamanhoId, setTamanhoId] = useState<string | null>(null);
  const [fotoVisivel, setFotoVisivel] = useState(0);
  const [quantidade, setQuantidade] = useState(1);
  const [resultado, setResultado] = useState<{ tipo: "ok" | "erro"; mensagem: string } | null>(null);
  const [adicionando, iniciarAdicao] = useTransition();
  const carrossel = useRef<HTMLUListElement>(null);
  const medidas = useRef<HTMLDetailsElement>(null);

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
    estoquePorTamanho.set(v.tamanhoId, (estoquePorTamanho.get(v.tamanhoId) ?? 0) + Math.max(v.estoque, 0));
  }

  const variacao =
    modeloId && corId && tamanhoId ? doModelo.find((v) => v.corId === corId && v.tamanhoId === tamanhoId) : undefined;

  const precos = variacoesDaCor.map((v) => v.precoEmCentavos);
  const preco = variacao?.precoEmCentavos ?? Math.min(...precos);
  const precoVaria = !variacao && new Set(precos).size > 1;

  const esgotado = produto.variacoes.every((v) => v.estoque <= 0);
  const imagens = fotosDaEscolha(produto.imagens, { modeloId, corId });

  const nomeDaCor = produto.cores.find((c) => c.id === corId)?.nome;
  const nomeDoModelo = produto.modelos.find((m) => m.id === modeloId)?.nome;
  const nomeDoTamanho = produto.tamanhos.find((t) => t.id === tamanhoId)?.nome;

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
          mensagem: quantidadeValida === 1 ? "Adicionado à sacola." : `${quantidadeValida} peças adicionadas à sacola.`,
        });
      } else {
        setResultado({ tipo: "erro", mensagem: resposta.erro });
      }
    });
  }

  function voltarParaAPrimeiraFoto() {
    setFotoVisivel(0);
    carrossel.current?.scrollTo({ left: 0 });
  }

  function escolherModelo(id: string) {
    setModeloId(id);
    setResultado(null);
    voltarParaAPrimeiraFoto();
    // Mantém a cor e o tamanho só se existirem no novo modelo.
    const novasCores = coresDoModelo(id);
    const cor = novasCores.some((c) => c.id === corId) ? corId : novasCores.length === 1 ? novasCores[0].id : null;
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
    voltarParaAPrimeiraFoto();
    // Mantém o tamanho só se ele tiver estoque na nova cor.
    if (tamanhoId) {
      const temNaNovaCor = doModelo.some((v) => v.corId === id && v.tamanhoId === tamanhoId && v.estoque > 0);
      if (!temNaNovaCor) setTamanhoId(null);
    }
  }

  const botaoAdicionar = (classe: string, texto = "Adicionar à sacola") => (
    <button type="button" onClick={adicionar} disabled={!podeAdicionar} className={`${classesBotao("principal")} ${classe}`}>
      {adicionando ? "Adicionando…" : texto}
    </button>
  );

  return (
    <div className="grid grid-cols-[minmax(0,1fr)] items-start gap-x-10 gap-y-8 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:gap-x-18">
      {/* Fotos: carrossel no celular, grade no computador (a primeira grande). */}
      <section aria-label="Fotos" className="-mx-[clamp(20px,5vw,72px)] min-w-0 sm:mx-0">
        {imagens.length === 0 ? (
          <div className="flex aspect-square items-center justify-center bg-produto">
            <Shirt aria-hidden="true" className="size-24 text-secundario/40" strokeWidth={1} />
          </div>
        ) : (
          <>
            <ul
              ref={carrossel}
              onScroll={(e) => {
                const lista = e.currentTarget;
                setFotoVisivel(Math.round(lista.scrollLeft / lista.clientWidth));
              }}
              className="flex snap-x snap-mandatory overflow-x-auto [scrollbar-width:none] lg:grid lg:grid-cols-2 lg:gap-3 lg:overflow-visible"
            >
              {imagens.map((imagem, indice) => (
                <li key={imagem.id} className="relative aspect-square w-full shrink-0 snap-center bg-produto lg:first:col-span-2">
                  <Image
                    src={imagem.url}
                    alt={imagem.alt}
                    fill
                    loading={indice === 0 ? "eager" : undefined}
                    fetchPriority={indice === 0 ? "high" : undefined}
                    sizes={indice === 0 ? "(min-width: 768px) 45vw, 100vw" : "(min-width: 1024px) 23vw, (min-width: 768px) 45vw, 100vw"}
                    className="object-cover"
                    style={imagem.enquadramento ? { objectPosition: imagem.enquadramento } : undefined}
                  />
                </li>
              ))}
            </ul>
            {imagens.length > 1 && imagens.length <= 8 && (
              <div aria-hidden="true" className="mt-3.5 flex justify-center gap-1.5 lg:hidden">
                {imagens.map((imagem, indice) => (
                  <span key={imagem.id} className={`h-0.5 w-4.5 ${indice === fotoVisivel ? "bg-tinta" : "bg-secundario-escuro"}`} />
                ))}
              </div>
            )}
            {/* Muitas fotos (vários modelos e cores): contador no lugar dos traços. */}
            {imagens.length > 8 && (
              <p aria-hidden="true" className="mt-3 text-center text-[13px] text-secundario tabular-nums lg:hidden">
                {fotoVisivel + 1} / {imagens.length}
              </p>
            )}
          </>
        )}
      </section>

      {/* Informações e escolha */}
      <section aria-labelledby="titulo-produto" className="flex min-w-0 max-w-[520px] flex-col gap-7">
        <div className="flex flex-col gap-2">
          <span className="sobretitulo text-secundario">{produto.categoria.nome}</span>
          <h1 id="titulo-produto" className="font-titulo text-[38px] leading-[1.05] font-medium lg:text-[52px]">
            {produto.nome}
          </h1>
          {produto.referencia && (
            <span className="font-titulo text-[17px] text-secundario italic lg:text-[19px]">{produto.referencia}</span>
          )}
          <span className="mt-2 text-[22px] font-medium lg:text-[26px]">
            {precoVaria && <span className="mr-1.5 text-[14px] font-normal text-secundario">a partir de</span>}
            {formatarPreco(preco)}
          </span>
          <span className="text-[13px] text-secundario">{condicoes}</span>
        </div>

        {produto.modelos.length > 1 && (
          <fieldset>
            <legend className="rotulo mb-3">
              Modelo
              {nomeDoModelo && (
                <span className="font-normal tracking-normal text-secundario normal-case"> · {nomeDoModelo}</span>
              )}
            </legend>
            <div className="-mx-[clamp(20px,5vw,72px)] flex gap-2 overflow-x-auto px-[clamp(20px,5vw,72px)] [scrollbar-width:none] sm:mx-0 sm:grid sm:grid-cols-[repeat(auto-fit,minmax(150px,1fr))] sm:overflow-visible sm:px-0">
              {produto.modelos.map((modelo) => {
                const ativo = modelo.id === modeloId;
                return (
                  <button
                    key={modelo.id}
                    type="button"
                    onClick={() => escolherModelo(modelo.id)}
                    aria-pressed={ativo}
                    className={`flex min-h-14 shrink-0 flex-col items-start justify-center px-3.5 py-2.5 text-left transition ${
                      ativo ? "border-[1.5px] border-tinta bg-papel" : "border border-opcao hover:border-tinta"
                    }`}
                  >
                    <span className="text-[14px] font-semibold">{modelo.nome}</span>
                    <span className="text-[12px] text-secundario">{formatarPreco(precoDoModelo(modelo.id))}</span>
                  </button>
                );
              })}
            </div>
          </fieldset>
        )}

        {cores.length > 0 && (
          <fieldset>
            <legend className="rotulo mb-3">
              Cor
              {nomeDaCor && <span className="font-normal tracking-normal text-secundario normal-case"> · {nomeDaCor}</span>}
            </legend>
            <div className="flex flex-wrap gap-1.5">
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
                    className={`flex size-11 items-center justify-center rounded-full p-1 transition ${
                      ativa ? "border-[1.5px] border-tinta" : "border border-transparent hover:border-opcao"
                    }`}
                  >
                    <span className="block size-full rounded-full border border-opcao" style={{ backgroundColor: cor.hex }} />
                  </button>
                );
              })}
            </div>
          </fieldset>
        )}

        <fieldset>
          <legend className="rotulo mb-3 flex w-full justify-between">
            <span>Tamanho</span>
            <a
              href="#medidas"
              onClick={() => {
                if (medidas.current) medidas.current.open = true;
              }}
              className="border-b border-tinta font-normal tracking-normal normal-case hover:opacity-70"
            >
              Tabela de medidas
            </a>
          </legend>
          <div className="grid grid-cols-4 gap-2">
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
                  aria-label={disponivel ? tamanho.nome : `${tamanho.nome}, esgotado`}
                  className={`flex h-12 items-center justify-center text-[14px] transition ${
                    ativo
                      ? "border-[1.5px] border-tinta bg-papel font-semibold"
                      : disponivel
                        ? "border border-opcao hover:border-tinta"
                        : "cursor-not-allowed border border-borda text-secundario line-through"
                  }`}
                >
                  {tamanho.nome}
                </button>
              );
            })}
          </div>
        </fieldset>

        <div className="flex flex-col gap-3">
          <p role="status" className="min-h-6 text-[14px]">
            <Disponibilidade
              esgotado={esgotado}
              precisaDeModelo={!modeloId}
              precisaDeCor={!corId && cores.length > 1}
              estoque={variacao?.estoque}
              limite={limiteUltimasUnidades}
            />
          </p>
          <div className="flex items-center gap-3">
            <span className="rotulo hidden sm:inline">Qtd.</span>
            <SeletorQuantidade
              valor={quantidadeValida}
              maximo={quantidadeMaxima}
              aoMudar={(valor) => {
                setQuantidade(valor);
                setResultado(null);
              }}
              desativado={!variacao || variacao.estoque <= 0}
            />
            {botaoAdicionar("hidden flex-1 sm:inline-flex")}
          </div>
          {variacao && variacao.estoque > 0 && (
            <p className="flex items-center gap-2 text-[13px] text-apoio">
              <span aria-hidden="true" className="size-2 shrink-0 rounded-full bg-lacre" />
              {quantidadeValida <= variacao.prontaEntrega
                ? `Pronta entrega: despacho em ${PRAZO_DE_DESPACHO}`
                : `Estampada para você: despacho em ${PRAZO_DE_DESPACHO_A_ESTAMPAR}`}
            </p>
          )}
          <div aria-live="polite" className="text-[14px]">
            {resultado?.tipo === "ok" && (
              <p className="font-semibold">
                {resultado.mensagem}{" "}
                <Link href="/carrinho" className="border-b border-tinta hover:opacity-70">
                  Ver sacola
                </Link>
              </p>
            )}
            {resultado?.tipo === "erro" && (
              <p className="flex items-start gap-2 font-semibold">
                <CircleAlert aria-hidden="true" className="mt-0.5 size-5 shrink-0" strokeWidth={1.4} />
                {resultado.mensagem}
              </p>
            )}
          </div>
        </div>

        <div className="border-t border-borda">
          {produto.descricao && (
            <Sanfona titulo="Descrição" aberta>
              <p className="text-[15px] whitespace-pre-line text-apoio">{produto.descricao}</p>
            </Sanfona>
          )}
          <Sanfona
            id="medidas"
            refDetalhes={medidas}
            titulo={nomeDoModelo && produto.modelos.length > 1 ? `Medidas do ${nomeDoModelo}` : "Medidas"}
          >
            {/* Com o modelo escolhido, só a tabela dele. */}
            <TabelaDeMedidas modelos={modeloId ? produto.modelos.filter((m) => m.id === modeloId) : produto.modelos} />
          </Sanfona>
          <Sanfona titulo="Envio e troca">
            <div className="text-[15px] text-apoio">{envioETroca}</div>
          </Sanfona>
        </div>
      </section>

      {/* Celular: barra fixa de compra. */}
      <div data-barra-de-compra className="fixed inset-x-0 bottom-0 z-30 flex items-center gap-3 border-t border-borda bg-fundo px-4 pt-3 pb-5 sm:hidden">
        <div className="flex min-w-0 flex-1 flex-col leading-tight">
          <span className="truncate text-[12px] text-secundario">
            {[nomeDoModelo, nomeDoTamanho].filter(Boolean).join(" · ") || "Escolha modelo e tamanho"}
          </span>
          <span className="font-semibold">{formatarPreco(preco)}</span>
        </div>
        {botaoAdicionar("min-h-[50px] shrink-0 whitespace-nowrap px-6", "Adicionar")}
      </div>
    </div>
  );
}

function Sanfona({
  titulo,
  aberta = false,
  id,
  refDetalhes,
  children,
}: {
  titulo: string;
  aberta?: boolean;
  id?: string;
  refDetalhes?: Ref<HTMLDetailsElement>;
  children: ReactNode;
}) {
  return (
    <details id={id} ref={refDetalhes} open={aberta} className="group scroll-mt-24 border-b border-borda py-4.5">
      <summary className="rotulo flex cursor-pointer list-none items-center justify-between gap-4 [&::-webkit-details-marker]:hidden">
        {titulo}
        <ChevronDown aria-hidden="true" className="size-4 shrink-0 transition group-open:rotate-180" strokeWidth={1.4} />
      </summary>
      <div className="mt-3.5">{children}</div>
    </details>
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
  if (esgotado) return <span className="font-semibold">Esgotado no momento.</span>;
  if (precisaDeModelo) return <span className="text-secundario">Escolha um modelo.</span>;
  if (precisaDeCor) return <span className="text-secundario">Escolha uma cor.</span>;
  if (estoque === undefined) return <span className="text-secundario">Escolha um tamanho.</span>;
  if (estoque <= 0) return <span className="font-semibold">Esgotado nesse tamanho.</span>;
  if (estoque <= limite) {
    return <span className="font-semibold">{estoque === 1 ? "Última unidade!" : `Últimas ${estoque} unidades!`}</span>;
  }
  return <span className="text-secundario">Em estoque.</span>;
}
