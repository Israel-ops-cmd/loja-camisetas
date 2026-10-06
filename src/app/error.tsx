"use client";

import Link from "next/link";
import { useEffect } from "react";

import { classesBotao } from "@/components/ui/Botao";
import { linkDoWhatsapp } from "@/lib/loja";

// Erro inesperado numa página: mensagem simples, tentar de novo e um caminho
// para falar com a loja. O cabeçalho e o rodapé continuam na tela.
export default function Erro({ error, retry }: { error: Error & { digest?: string }; retry: () => void }) {
  useEffect(() => {
    console.error("[erro na página]", error.digest ?? "", error);
  }, [error]);

  return (
    <div className="secao">
      <div className="mx-auto max-w-xl text-center">
        <p className="sobretitulo text-secundario">Ops</p>
        <h1 className="titulo-destaque mt-5">Algo deu errado.</h1>
        <p className="texto-destaque mt-6 text-apoio">
          Não conseguimos carregar esta página agora. Tente de novo em instantes. Se continuar, fale com a gente.
        </p>
        <div className="mt-10 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
          <button type="button" onClick={() => retry()} className={classesBotao("principal")}>
            Tentar de novo
          </button>
          <a
            href={linkDoWhatsapp("Olá! Tive um problema no site da Carta Viva.")}
            target="_blank"
            rel="noopener noreferrer"
            className={classesBotao("secundario")}
          >
            Falar no WhatsApp
          </a>
        </div>
        <Link href="/" className="mt-6 inline-flex min-h-11 items-center underline underline-offset-4">
          Voltar para o início
        </Link>
        {error.digest && <p className="mt-8 text-[12px] text-secundario">Código do erro: {error.digest}</p>}
      </div>
    </div>
  );
}
