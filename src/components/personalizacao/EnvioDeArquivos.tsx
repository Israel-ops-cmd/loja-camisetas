"use client";

import { FileImage, FileText, LoaderCircle, Paperclip, X } from "lucide-react";
import { useId, useRef, useState } from "react";

import {
  extensaoDoArquivo,
  formatarTamanhoDoArquivo,
  PASTA_DO_STORAGE,
  TAMANHO_MAXIMO_BYTES,
  temMiniatura,
} from "@/lib/personalizacao-regras";
import { criarClienteSupabaseNoNavegador } from "@/lib/supabase/navegador";

export type ArquivoEnviado = { caminho: string; nome: string; tamanho: number };

type Props = {
  /** Server Action que devolve o link temporário de envio. */
  preparar: (
    arquivo: { nome: string; tamanho: number },
  ) => Promise<{ ok: true; caminho: string; token: string } | { ok: false; erro: string }>;
  formatos: readonly string[];
  maximo: number;
  arquivos: ArquivoEnviado[];
  aoMudar: (arquivos: ArquivoEnviado[]) => void;
  rotulo: string;
  ajuda: string;
  erro?: string;
  /** Avisa o formulário enquanto há envio em andamento. */
  aoEnviar?: (enviando: boolean) => void;
  /** Pasta do Storage (padrão: a privada da personalização). */
  pasta?: string;
  tamanhoMaximo?: number;
  textoDoBotao?: string;
};

/**
 * O arquivo vai do navegador direto para o Supabase Storage, por um link
 * temporário criado no servidor. Assim ele não passa pelo servidor da loja
 * (que tem limite de tamanho por requisição).
 */
export function EnvioDeArquivos({
  preparar,
  formatos,
  maximo,
  arquivos,
  aoMudar,
  rotulo,
  ajuda,
  erro,
  aoEnviar,
  pasta = PASTA_DO_STORAGE,
  tamanhoMaximo = TAMANHO_MAXIMO_BYTES,
  textoDoBotao,
}: Props) {
  const id = useId();
  const entrada = useRef<HTMLInputElement>(null);
  const [enviando, setEnviando] = useState<string[]>([]);
  const [falhas, setFalhas] = useState<string[]>([]);
  const restantes = maximo - arquivos.length - enviando.length;

  async function escolher(lista: FileList | null) {
    if (!lista) return;
    const escolhidos = [...lista].slice(0, Math.max(restantes, 0));
    setFalhas([]);
    if (escolhidos.length === 0) return;

    const novosErros: string[] = [];
    const enviados: ArquivoEnviado[] = [];
    setEnviando(escolhidos.map((a) => a.name));
    aoEnviar?.(true);

    for (const arquivo of escolhidos) {
      if (!formatos.includes(extensaoDoArquivo(arquivo.name))) {
        novosErros.push(
          `${arquivo.name}: formato não aceito. Use ${formatos
            .filter((f) => f !== "jpeg")
            .map((f) => f.toUpperCase())
            .join(", ")}.`,
        );
        continue;
      }
      if (arquivo.size > tamanhoMaximo) {
        novosErros.push(`${arquivo.name}: passa de ${formatarTamanhoDoArquivo(tamanhoMaximo)}.`);
        continue;
      }
      const envio = await preparar({ nome: arquivo.name, tamanho: arquivo.size });
      if (!envio.ok) {
        novosErros.push(`${arquivo.name}: ${envio.erro}`);
        continue;
      }
      const { error } = await criarClienteSupabaseNoNavegador()
        .storage.from(pasta)
        .uploadToSignedUrl(envio.caminho, envio.token, arquivo, {
          contentType: arquivo.type || "application/octet-stream",
        });
      if (error) {
        novosErros.push(`${arquivo.name}: o envio falhou. Tente de novo.`);
        continue;
      }
      enviados.push({ caminho: envio.caminho, nome: arquivo.name, tamanho: arquivo.size });
    }

    aoMudar([...arquivos, ...enviados]);
    setEnviando([]);
    setFalhas(novosErros);
    aoEnviar?.(false);
    if (entrada.current) entrada.current.value = "";
  }

  return (
    <div>
      <p id={`${id}-rotulo`} className="text-[14px] font-semibold">
        {rotulo}
      </p>
      <p className="mt-1 text-[13px] text-secundario">{ajuda}</p>

      {(arquivos.length > 0 || enviando.length > 0) && (
        <ul className="mt-3 space-y-2">
          {arquivos.map((arquivo) => {
            const Icone = temMiniatura(arquivo.nome) ? FileImage : FileText;
            return (
              <li
                key={arquivo.caminho}
                className="flex items-center gap-3 rounded-xl border border-borda bg-papel px-4 py-2"
              >
                <Icone aria-hidden="true" className="size-5 shrink-0" strokeWidth={1.6} />
                <span className="min-w-0 flex-1 truncate text-[14px]">{arquivo.nome}</span>
                <span className="text-[13px] text-secundario">
                  {formatarTamanhoDoArquivo(arquivo.tamanho)}
                </span>
                <button
                  type="button"
                  onClick={() => aoMudar(arquivos.filter((a) => a.caminho !== arquivo.caminho))}
                  className="-mr-2 flex size-11 items-center justify-center rounded-full hover:bg-fundo"
                >
                  <X aria-hidden="true" className="size-4" strokeWidth={1.8} />
                  <span className="sr-only">Remover {arquivo.nome}</span>
                </button>
              </li>
            );
          })}
          {enviando.map((nome) => (
            <li
              key={nome}
              className="flex items-center gap-3 rounded-xl border border-dashed border-borda px-4 py-3 text-[14px] text-secundario"
            >
              <LoaderCircle aria-hidden="true" className="size-5 shrink-0 animate-spin" strokeWidth={1.6} />
              Enviando {nome}…
            </li>
          ))}
        </ul>
      )}

      {restantes > 0 && (
        <>
          <input
            ref={entrada}
            id={id}
            type="file"
            multiple={restantes > 1}
            accept={formatos.map((f) => `.${f}`).join(",")}
            onChange={(e) => void escolher(e.target.files)}
            className="sr-only"
            aria-labelledby={`${id}-rotulo`}
          />
          <label
            htmlFor={id}
            className="mt-3 inline-flex min-h-12 cursor-pointer items-center gap-2 rounded-full border border-tinta px-6 text-[14px] font-semibold transition hover:bg-tinta hover:text-papel"
          >
            <Paperclip aria-hidden="true" className="size-4" strokeWidth={1.8} />
            {textoDoBotao ?? (arquivos.length === 0 ? "Escolher arquivo" : "Adicionar outro arquivo")}
          </label>
        </>
      )}

      {(falhas.length > 0 || erro) && (
        <ul role="alert" className="mt-2 space-y-1 text-[13px] font-semibold">
          {erro && <li>{erro}</li>}
          {falhas.map((f) => (
            <li key={f}>{f}</li>
          ))}
        </ul>
      )}
    </div>
  );
}
