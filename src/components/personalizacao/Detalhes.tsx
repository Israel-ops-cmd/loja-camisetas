import { Download, FileText } from "lucide-react";

import type { ArquivoParaMostrar, PersonalizacaoDetalhada } from "@/lib/personalizacao";
import { quantidadeTotal } from "@/lib/personalizacao";
import { formatarPreco } from "@/lib/formatacao";
import { formatarData } from "@/lib/pedidos";
import {
  formatarTamanhoDoArquivo,
  ordemDasPosicoes,
  rotulosDePosicao,
} from "@/lib/personalizacao-regras";

export { Painel } from "@/components/ui/Painel";

/** Peça, cor, posições, quantidades, prazo e descrição. */
export function ResumoDaPersonalizacao({ p }: { p: PersonalizacaoDetalhada }) {
  const total = quantidadeTotal(p);
  const posicoes = ordemDasPosicoes.filter((pos) => p.posicoes.includes(pos));

  return (
    <dl className="grid gap-5 text-[15px] sm:grid-cols-2">
      <div>
        <dt className="text-[13px] text-secundario">Peça</dt>
        <dd className="flex items-center gap-2 font-semibold">
          {p.produto.nome} ·
          <span aria-hidden="true" className="size-4 rounded border border-borda" style={{ backgroundColor: p.cor.hex }} />
          {p.cor.nome}
        </dd>
      </div>
      <div>
        <dt className="text-[13px] text-secundario">Estampa</dt>
        <dd className="font-semibold">{posicoes.map((pos) => rotulosDePosicao[pos].titulo).join(" · ")}</dd>
      </div>
      <div>
        <dt className="text-[13px] text-secundario">Quantidades</dt>
        <dd className="font-semibold">
          {p.itens.map((i) => `${i.tamanho.nome}: ${i.quantidade}`).join(" · ")}
          <span className="font-normal text-apoio"> ({total === 1 ? "1 peça" : `${total} peças`})</span>
        </dd>
      </div>
      <div>
        <dt className="text-[13px] text-secundario">Prazo desejado</dt>
        <dd className="font-semibold">{p.prazoDesejado ? formatarData(p.prazoDesejado) : "Sem prazo"}</dd>
      </div>
      {p.descricao && (
        <div className="sm:col-span-2">
          <dt className="text-[13px] text-secundario">Ideia e observações</dt>
          <dd className="whitespace-pre-line">{p.descricao}</dd>
        </div>
      )}
    </dl>
  );
}

/** Preço por peça × quantidade (sem frete). */
export function Orcamento({ p }: { p: PersonalizacaoDetalhada }) {
  if (p.precoUnitarioEmCentavos === null) return null;
  const total = quantidadeTotal(p);
  return (
    <dl className="space-y-2 text-[15px]">
      <div className="flex justify-between gap-4">
        <dt className="text-apoio">Preço por peça</dt>
        <dd className="font-semibold">{formatarPreco(p.precoUnitarioEmCentavos)}</dd>
      </div>
      <div className="flex justify-between gap-4">
        <dt className="text-apoio">Quantidade</dt>
        <dd>{total === 1 ? "1 peça" : `${total} peças`}</dd>
      </div>
      <div className="flex items-baseline justify-between gap-4 border-t border-borda pt-3">
        <dt className="font-semibold">Total sem frete</dt>
        <dd className="font-titulo text-[24px] font-extrabold">
          {formatarPreco(p.precoUnitarioEmCentavos * total)}
        </dd>
      </div>
    </dl>
  );
}

/** Miniatura para imagens; ícone genérico para PDF, CDR, AI e PSD. */
export function ListaDeArquivos({ arquivos, grande = false }: { arquivos: ArquivoParaMostrar[]; grande?: boolean }) {
  if (arquivos.length === 0) return <p className="text-apoio">Nenhum arquivo.</p>;
  return (
    <ul className={`grid gap-4 ${grande ? "sm:grid-cols-2" : "grid-cols-2 sm:grid-cols-3"}`}>
      {arquivos.map((arquivo) => (
        <li key={arquivo.id} className="overflow-hidden rounded-xl border border-borda">
          <div className={`flex items-center justify-center bg-produto ${grande ? "aspect-[4/3]" : "aspect-square"}`}>
            {arquivo.urlVer ? (
              // Link temporário do Storage: o otimizador de imagens não se aplica.
              // eslint-disable-next-line @next/next/no-img-element
              <img src={arquivo.urlVer} alt={arquivo.nome} className="h-full w-full object-contain" />
            ) : (
              <FileText aria-hidden="true" className="size-10 text-secundario" strokeWidth={1.4} />
            )}
          </div>
          <div className="flex items-center gap-2 px-3 py-2">
            <span className="min-w-0 flex-1">
              <span className="block truncate text-[13px] font-semibold">{arquivo.nome}</span>
              <span className="block text-[12px] text-secundario">{formatarTamanhoDoArquivo(arquivo.tamanhoBytes)}</span>
            </span>
            {arquivo.urlBaixar && (
              <a
                href={arquivo.urlBaixar}
                className="flex size-11 shrink-0 items-center justify-center rounded-full hover:bg-fundo"
              >
                <Download aria-hidden="true" className="size-4" strokeWidth={1.8} />
                <span className="sr-only">Baixar {arquivo.nome}</span>
              </a>
            )}
          </div>
        </li>
      ))}
    </ul>
  );
}

export function Conversa({ p, nomeDoCliente }: { p: PersonalizacaoDetalhada; nomeDoCliente: string }) {
  if (p.mensagens.length === 0) return null;
  return (
    <ul className="space-y-3">
      {p.mensagens.map((m) => (
        <li
          key={m.id}
          className={`rounded-xl px-4 py-3 text-[15px] ${m.autor === "LOJA" ? "bg-fundo" : "border border-borda"}`}
        >
          <p className="text-[12px] font-bold tracking-[0.12em] text-secundario uppercase">
            {m.autor === "LOJA" ? "Carta Viva" : nomeDoCliente} · {formatarData(m.criadoEm)}
          </p>
          <p className="mt-1 whitespace-pre-line">{m.texto}</p>
        </li>
      ))}
    </ul>
  );
}
