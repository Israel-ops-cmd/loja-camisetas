"use client";

import Image from "next/image";
import { ArrowDown, ArrowUp, Trash2 } from "lucide-react";
import { useState, useTransition } from "react";

import {
  adicionarFotos,
  atualizarFoto,
  moverFoto,
  prepararEnvioDeFoto,
  removerFoto,
} from "@/app/admin/produtos/acoes";
import { Aviso } from "@/components/formulario/Aviso";
import { EnvioDeArquivos, type ArquivoEnviado } from "@/components/personalizacao/EnvioDeArquivos";
import { ENQUADRAMENTOS, FORMATOS_DE_FOTO, PASTA_DE_FOTOS, TAMANHO_MAXIMO_DA_FOTO } from "@/lib/produtos-regras";

type Foto = { id: string; url: string; alt: string; corId: string | null; enquadramento: string | null };
type Cor = { id: string; nome: string };
type Mensagem = { tipo: "erro" | "sucesso"; texto: string } | null;

const classeSelecao =
  "mt-1 h-12 w-full rounded-xl border border-borda bg-papel px-3 text-[16px] outline-none focus:border-tinta";

export function FotosDoProduto({ produtoId, fotos, cores }: { produtoId: string; fotos: Foto[]; cores: Cor[] }) {
  const [mensagem, setMensagem] = useState<Mensagem>(null);
  const [gravando, iniciar] = useTransition();

  function enviadas(lista: ArquivoEnviado[]) {
    if (lista.length === 0) return;
    iniciar(async () => {
      const r = await adicionarFotos(
        produtoId,
        lista.map((a) => ({ caminho: a.caminho, nome: a.nome })),
      );
      setMensagem(r.ok ? { tipo: "sucesso", texto: r.mensagem ?? "Pronto." } : { tipo: "erro", texto: r.erro });
    });
  }

  return (
    <div className="space-y-6">
      <div className="rounded-xl bg-fundo p-4">
        <EnvioDeArquivos
          preparar={(arquivo) => prepararEnvioDeFoto(produtoId, arquivo)}
          formatos={FORMATOS_DE_FOTO}
          maximo={10}
          arquivos={[]}
          aoMudar={enviadas}
          pasta={PASTA_DE_FOTOS}
          tamanhoMaximo={TAMANHO_MAXIMO_DA_FOTO}
          rotulo="Adicionar fotos"
          ajuda="Tire a foto com boa luz, de preferência com a peça esticada ou vestida. Pode escolher até 10 de uma vez. A primeira foto é a que aparece na lista de produtos."
          textoDoBotao="Escolher fotos"
        />
        {gravando && <p className="mt-2 text-[14px] text-secundario">Guardando as fotos…</p>}
        {mensagem && (
          <div className="mt-3">
            <Aviso tipo={mensagem.tipo}>{mensagem.texto}</Aviso>
          </div>
        )}
      </div>

      {fotos.length === 0 ? (
        <p className="text-[15px] text-apoio">Este produto ainda não tem fotos.</p>
      ) : (
        <ol className="space-y-4">
          {fotos.map((foto, i) => (
            <FotoNoPainel
              key={foto.id}
              foto={foto}
              posicao={i}
              total={fotos.length}
              cores={cores}
            />
          ))}
        </ol>
      )}
    </div>
  );
}

function FotoNoPainel({ foto, posicao, total, cores }: { foto: Foto; posicao: number; total: number; cores: Cor[] }) {
  const [alt, setAlt] = useState(foto.alt);
  const [corId, setCorId] = useState(foto.corId ?? "");
  const [enquadramento, setEnquadramento] = useState(foto.enquadramento ?? "");
  const [confirmarRemocao, setConfirmarRemocao] = useState(false);
  const [mensagem, setMensagem] = useState<Mensagem>(null);
  const [ocupado, iniciar] = useTransition();

  const mudou = alt !== foto.alt || corId !== (foto.corId ?? "") || enquadramento !== (foto.enquadramento ?? "");
  // Enquadramento antigo, fora das opções (fotos de exemplo): continua na lista.
  const opcoes = ENQUADRAMENTOS.some((e) => e.valor === (foto.enquadramento ?? ""))
    ? ENQUADRAMENTOS
    : [...ENQUADRAMENTOS, { valor: foto.enquadramento ?? "", rotulo: "Ajuste atual" }];

  function executar(acao: () => Promise<{ ok: true; mensagem?: string } | { ok: false; erro: string }>) {
    setMensagem(null);
    iniciar(async () => {
      const r = await acao();
      if (!r.ok) setMensagem({ tipo: "erro", texto: r.erro });
      else if (r.mensagem) setMensagem({ tipo: "sucesso", texto: r.mensagem });
    });
  }

  return (
    <li className={`rounded-xl border border-borda p-4 ${ocupado ? "opacity-60" : ""}`}>
      <div className="flex flex-col gap-4 sm:flex-row">
        <div className="relative aspect-square w-full shrink-0 overflow-hidden rounded-xl bg-produto sm:w-48">
          <Image
            src={foto.url}
            alt={foto.alt}
            fill
            sizes="(min-width: 640px) 192px, 100vw"
            className="object-cover"
            style={enquadramento ? { objectPosition: enquadramento } : undefined}
          />
          <span className="absolute top-2 left-2 rounded-full bg-tinta px-3 py-1 text-[13px] font-bold text-papel">
            {posicao === 0 ? "Foto principal" : `Foto ${posicao + 1}`}
          </span>
        </div>

        <div className="min-w-0 flex-1 space-y-3">
          <label className="block">
            <span className="block text-[14px] font-semibold">Descrição da foto</span>
            <input
              value={alt}
              onChange={(e) => setAlt(e.target.value)}
              maxLength={200}
              className={classeSelecao}
            />
            <span className="mt-1 block text-[13px] text-secundario">
              O que aparece na foto. Ex.: Camiseta preta dobrada, estampa na frente.
            </span>
          </label>
          <label className="block">
            <span className="block text-[14px] font-semibold">Mostrar quando o cliente escolher a cor</span>
            <select value={corId} onChange={(e) => setCorId(e.target.value)} className={classeSelecao}>
              <option value="">Qualquer cor</option>
              {cores.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nome}
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="block text-[14px] font-semibold">Recorte na lista de produtos</span>
            <select value={enquadramento} onChange={(e) => setEnquadramento(e.target.value)} className={classeSelecao}>
              {opcoes.map((e) => (
                <option key={e.valor} value={e.valor}>
                  {e.rotulo}
                </option>
              ))}
            </select>
            <span className="mt-1 block text-[13px] text-secundario">
              A lista mostra a foto em quadrado. Veja na prévia ao lado se a estampa aparece.
            </span>
          </label>

          {mensagem && <Aviso tipo={mensagem.tipo}>{mensagem.texto}</Aviso>}

          <div className="flex flex-wrap gap-2">
            {mudou && (
              <button
                type="button"
                disabled={ocupado}
                onClick={() => executar(() => atualizarFoto(foto.id, { alt, corId: corId || null, enquadramento }))}
                className="inline-flex min-h-12 items-center rounded-full bg-tinta px-6 text-[15px] font-bold text-papel hover:bg-painel"
              >
                Salvar foto
              </button>
            )}
            <button
              type="button"
              disabled={ocupado || posicao === 0}
              onClick={() => executar(() => moverFoto(foto.id, -1))}
              className="inline-flex min-h-12 items-center gap-1 rounded-full border border-borda px-4 text-[15px] font-semibold hover:border-tinta disabled:opacity-40"
            >
              <ArrowUp aria-hidden="true" className="size-4" strokeWidth={2} />
              Subir
            </button>
            <button
              type="button"
              disabled={ocupado || posicao === total - 1}
              onClick={() => executar(() => moverFoto(foto.id, 1))}
              className="inline-flex min-h-12 items-center gap-1 rounded-full border border-borda px-4 text-[15px] font-semibold hover:border-tinta disabled:opacity-40"
            >
              <ArrowDown aria-hidden="true" className="size-4" strokeWidth={2} />
              Descer
            </button>
            {!confirmarRemocao && (
              <button
                type="button"
                disabled={ocupado}
                onClick={() => setConfirmarRemocao(true)}
                className="inline-flex min-h-12 items-center gap-1 rounded-full border border-borda px-4 text-[15px] font-semibold hover:border-tinta"
              >
                <Trash2 aria-hidden="true" className="size-4" strokeWidth={1.8} />
                Remover
              </button>
            )}
          </div>

          {confirmarRemocao && (
            <div role="alert" className="rounded-xl border border-tinta p-4">
              <p className="text-[15px] font-semibold">Remover esta foto? Ela sai da loja e não dá para desfazer.</p>
              <div className="mt-3 flex flex-wrap gap-2">
                <button
                  type="button"
                  disabled={ocupado}
                  onClick={() => executar(() => removerFoto(foto.id))}
                  className="inline-flex min-h-12 items-center rounded-full bg-tinta px-6 text-[15px] font-bold text-papel hover:bg-painel"
                >
                  Sim, remover
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmarRemocao(false)}
                  className="inline-flex min-h-12 items-center rounded-full border border-borda px-6 text-[15px] font-semibold hover:border-tinta"
                >
                  Cancelar
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </li>
  );
}
