"use client";

import { useSyncExternalStore } from "react";

import {
  contarPecas,
  lerCookieDoCarrinho,
  NOME_COOKIE_CARRINHO,
} from "@/lib/carrinho-cookie";

const EVENTO = "carrinho:atualizado";

/** Chame depois de alterar o carrinho para atualizar o contador. */
export function avisarCarrinhoAtualizado() {
  window.dispatchEvent(new Event(EVENTO));
}

function inscrever(aoMudar: () => void) {
  window.addEventListener(EVENTO, aoMudar);
  // Outra aba pode ter mudado o carrinho.
  window.addEventListener("focus", aoMudar);
  return () => {
    window.removeEventListener(EVENTO, aoMudar);
    window.removeEventListener("focus", aoMudar);
  };
}

function lerQuantidade() {
  const cookie = document.cookie
    .split("; ")
    .find((parte) => parte.startsWith(`${NOME_COOKIE_CARRINHO}=`));
  const valor = cookie?.slice(NOME_COOKIE_CARRINHO.length + 1);
  return contarPecas(lerCookieDoCarrinho(valor));
}

/**
 * Lido no navegador para que as páginas continuem estáticas
 * (ler cookies no servidor tornaria todas dinâmicas).
 */
export function ContadorCarrinho() {
  const quantidade = useSyncExternalStore(inscrever, lerQuantidade, () => 0);

  if (quantidade === 0) return null;

  return (
    <span className="absolute top-1 right-0.5 flex min-w-5 items-center justify-center rounded-full bg-lacre px-1 text-[11px] leading-5 font-bold text-papel">
      {quantidade > 99 ? "99+" : quantidade}
      <span className="sr-only">
        {quantidade === 1 ? " peça" : " peças"} no carrinho
      </span>
    </span>
  );
}
