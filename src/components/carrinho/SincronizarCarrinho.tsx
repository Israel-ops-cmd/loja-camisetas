"use client";

import { useEffect } from "react";

import { sincronizarCarrinho } from "@/app/carrinho/acoes";
import { avisarCarrinhoAtualizado } from "@/components/carrinho/ContadorCarrinho";

/**
 * Cookies não podem ser gravados durante a renderização no servidor.
 * Quando a página corrige o carrinho, este componente grava a correção.
 */
export function SincronizarCarrinho() {
  useEffect(() => {
    sincronizarCarrinho().then(avisarCarrinhoAtualizado);
  }, []);

  return null;
}
