"use client";

import { Trash2 } from "lucide-react";
import { useState, useTransition } from "react";

import { apagarArquivosEsquecidos, contarArquivosEsquecidos } from "@/app/admin/acoes";
import { Aviso } from "@/components/formulario/Aviso";

const botao =
  "inline-flex min-h-12 items-center justify-center gap-2 rounded-full border border-tinta px-5 text-[15px] font-semibold hover:bg-fundo disabled:opacity-50";

/** Manutenção: arquivos enviados ao site que não ficaram ligados a nada. */
export function LimpezaDeArquivos() {
  const [encontrados, setEncontrados] = useState<{ quantidade: number; tamanho: string } | null>(null);
  const [mensagem, setMensagem] = useState<{ tipo: "erro" | "sucesso" | "info"; texto: string } | null>(null);
  const [ocupado, iniciar] = useTransition();

  function procurar() {
    setMensagem(null);
    iniciar(async () => {
      const r = await contarArquivosEsquecidos();
      if (!r.ok) return setMensagem({ tipo: "erro", texto: r.erro });
      if (r.quantidade === 0) {
        setEncontrados(null);
        setMensagem({ tipo: "info", texto: "Nenhum arquivo esquecido. Está tudo em ordem." });
      } else setEncontrados({ quantidade: r.quantidade, tamanho: r.tamanho });
    });
  }

  function apagar() {
    iniciar(async () => {
      const r = await apagarArquivosEsquecidos();
      setEncontrados(null);
      setMensagem(r.ok ? { tipo: "sucesso", texto: r.mensagem } : { tipo: "erro", texto: r.erro });
    });
  }

  return (
    <div className="space-y-3">
      <p className="text-[15px] text-apoio">
        Fotos e artes que foram enviadas mas não ficaram ligadas a nenhum produto ou pedido (por exemplo, quando a internet
        caiu no meio). Ocupam espaço à toa. Vale conferir uma vez por mês.
      </p>
      {encontrados ? (
        <div role="alert" className="space-y-3 rounded-xl border border-tinta p-4">
          <p className="text-[15px] font-semibold">
            {encontrados.quantidade === 1 ? "1 arquivo esquecido" : `${encontrados.quantidade} arquivos esquecidos`} ({encontrados.tamanho}).
            Apagar? Não dá para desfazer, mas nenhum produto ou pedido usa esses arquivos.
          </p>
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={apagar} disabled={ocupado} className={botao}>
              <Trash2 aria-hidden="true" className="size-4" strokeWidth={1.8} />
              {ocupado ? "Apagando…" : "Sim, apagar"}
            </button>
            <button type="button" onClick={() => setEncontrados(null)} className="inline-flex min-h-11 items-center px-3 text-[14px] font-semibold underline underline-offset-4">
              Agora não
            </button>
          </div>
        </div>
      ) : (
        <button type="button" onClick={procurar} disabled={ocupado} className={botao}>
          {ocupado ? "Procurando…" : "Procurar arquivos esquecidos"}
        </button>
      )}
      {mensagem && <Aviso tipo={mensagem.tipo}>{mensagem.texto}</Aviso>}
    </div>
  );
}
