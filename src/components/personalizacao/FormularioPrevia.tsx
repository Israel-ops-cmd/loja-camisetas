"use client";

import { useState, useTransition, type FormEvent } from "react";

import {
  cancelarPersonalizacao,
  enviarPrevia,
  prepararEnvioDePrevia,
} from "@/app/admin/personalizacoes/acoes";
import { Aviso } from "@/components/formulario/Aviso";
import { Campo } from "@/components/formulario/Campo";
import {
  EnvioDeArquivos,
  type ArquivoEnviado,
} from "@/components/personalizacao/EnvioDeArquivos";
import { classesBotao } from "@/components/ui/Botao";
import { FORMATOS_DE_PREVIA, MAXIMO_DE_ARQUIVOS } from "@/lib/personalizacao-regras";

/** Painel: envia a prévia com o preço por peça. Reenviar troca o preço e soma imagens. */
export function FormularioPrevia({
  numero,
  precoAtual,
}: {
  numero: number;
  /** Preço já enviado antes (ex.: "49,90"), para facilitar o reenvio. */
  precoAtual: string;
}) {
  const [arquivos, setArquivos] = useState<ArquivoEnviado[]>([]);
  const [preco, setPreco] = useState(precoAtual);
  const [mensagem, setMensagem] = useState("");
  const [enviandoArquivo, setEnviandoArquivo] = useState(false);
  const [resultado, setResultado] = useState<{ tipo: "erro" | "sucesso"; texto: string } | null>(null);
  const [pendente, iniciar] = useTransition();

  function enviar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    setResultado(null);
    iniciar(async () => {
      const r = await enviarPrevia(numero, {
        preco,
        mensagem: mensagem || undefined,
        arquivos: arquivos.map(({ caminho, nome }) => ({ caminho, nome })),
      });
      if (r.ok) {
        setArquivos([]);
        setMensagem("");
        setResultado({ tipo: "sucesso", texto: "Prévia enviada ao cliente." });
      } else {
        setResultado({ tipo: "erro", texto: r.erro });
      }
    });
  }

  return (
    <form onSubmit={enviar} noValidate className="space-y-5">
      <EnvioDeArquivos
        preparar={(arquivo) => prepararEnvioDePrevia(numero, arquivo)}
        formatos={FORMATOS_DE_PREVIA}
        maximo={MAXIMO_DE_ARQUIVOS}
        arquivos={arquivos}
        aoMudar={setArquivos}
        aoEnviar={setEnviandoArquivo}
        rotulo="Imagens da prévia"
        ajuda="PNG ou JPG, até 20 MB cada. O cliente vê essas imagens na conta dele."
      />
      <div className="max-w-xs">
        <Campo
          name="preco"
          rotulo="Preço por peça (R$)"
          inputMode="decimal"
          placeholder="49,90"
          value={preco}
          onChange={(e) => setPreco(e.target.value)}
          ajuda="Sem frete. O total é preço × quantidade."
        />
      </div>
      <div>
        <label htmlFor="mensagem" className="block text-[14px] font-semibold">
          Recado para o cliente (opcional)
        </label>
        <textarea
          id="mensagem"
          value={mensagem}
          onChange={(e) => setMensagem(e.target.value)}
          rows={3}
          maxLength={2000}
          className="mt-2 w-full rounded-xl border border-borda bg-papel px-4 py-3 text-[16px] outline-none focus:border-tinta"
        />
      </div>
      {resultado && <Aviso tipo={resultado.tipo}>{resultado.texto}</Aviso>}
      <button
        type="submit"
        disabled={pendente || enviandoArquivo}
        className={classesBotao("principal")}
      >
        {pendente ? "Enviando…" : "Enviar prévia ao cliente"}
      </button>
    </form>
  );
}

export function BotaoCancelarPersonalizacao({ numero }: { numero: number }) {
  const [confirmando, setConfirmando] = useState(false);
  const [motivo, setMotivo] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [pendente, iniciar] = useTransition();

  if (!confirmando) {
    return (
      <button
        type="button"
        onClick={() => setConfirmando(true)}
        className="inline-flex min-h-11 items-center text-[14px] underline underline-offset-4 hover:text-secundario"
      >
        Cancelar este pedido de personalização
      </button>
    );
  }

  return (
    <div className="space-y-3 rounded-xl border border-borda p-4">
      <label htmlFor="motivo" className="block text-[14px] font-semibold">
        Motivo (o cliente vê esta mensagem)
      </label>
      <textarea
        id="motivo"
        value={motivo}
        onChange={(e) => setMotivo(e.target.value)}
        rows={2}
        maxLength={2000}
        className="w-full rounded-xl border border-borda bg-papel px-4 py-3 text-[16px] outline-none focus:border-tinta"
      />
      {erro && <Aviso tipo="erro">{erro}</Aviso>}
      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          disabled={pendente}
          onClick={() =>
            iniciar(async () => {
              const r = await cancelarPersonalizacao(numero, motivo || undefined);
              if (!r.ok) setErro(r.erro);
            })
          }
          className={classesBotao("secundario")}
        >
          {pendente ? "Cancelando…" : "Confirmar cancelamento"}
        </button>
        <button
          type="button"
          onClick={() => setConfirmando(false)}
          className="inline-flex min-h-11 items-center px-3 text-[14px] underline underline-offset-4"
        >
          Voltar
        </button>
      </div>
    </div>
  );
}
