import "server-only";

import { notFound, redirect } from "next/navigation";
import { cache } from "react";

import { prisma } from "@/lib/prisma";
import { criarClienteSupabase } from "@/lib/supabase/servidor";

export type Usuario = {
  id: string;
  email: string;
  nome: string;
  administrador: boolean;
};

/**
 * Usuário logado, ou `null`. Usa `getClaims()`, que confere a assinatura da
 * sessão (nunca `getSession()`, que só lê o cookie sem conferir).
 * `cache` evita conferir duas vezes na mesma requisição.
 */
export const obterUsuario = cache(async (): Promise<Usuario | null> => {
  const supabase = await criarClienteSupabase();
  const { data, error } = await supabase.auth.getClaims();
  if (error || !data?.claims) return null;

  const claims = data.claims;
  const email = typeof claims.email === "string" ? claims.email : "";
  const nome = claims.user_metadata?.nome;

  return {
    id: claims.sub,
    email,
    nome: typeof nome === "string" && nome ? nome : email.split("@")[0],
    // app_metadata só pode ser alterado pelo servidor (npm run admin:promover).
    administrador: claims.app_metadata?.papel === "admin",
  };
});

/** Para páginas que exigem login: manda para /entrar e volta depois. */
export async function exigirUsuario(voltarPara: string) {
  const usuario = await obterUsuario();
  if (!usuario) {
    redirect(`/entrar?voltar=${encodeURIComponent(voltarPara)}`);
  }
  return usuario;
}

/** Para o painel. Quem não é administrador vê 404, sem saber que a área existe. */
export async function exigirAdministrador() {
  const usuario = await obterUsuario();
  if (!usuario?.administrador) notFound();
  return usuario;
}

/**
 * Garante o registro em `clientes` ligado à conta do Supabase.
 * Chamado ao confirmar o e-mail e a cada login.
 */
export async function garantirCliente(usuario: {
  id: string;
  email?: string;
  user_metadata?: { nome?: unknown };
}) {
  if (!usuario.email) return;
  const nome =
    typeof usuario.user_metadata?.nome === "string" &&
    usuario.user_metadata.nome.trim()
      ? usuario.user_metadata.nome.trim()
      : usuario.email.split("@")[0];

  await prisma.cliente.upsert({
    where: { id: usuario.id },
    update: { email: usuario.email },
    create: { id: usuario.id, email: usuario.email, nome },
  });
}

/** Aceita só caminhos internos ("/conta"), nunca "//site.com" ou URLs externas. */
export function caminhoSeguro(valor: unknown, padrao = "/conta") {
  if (
    typeof valor !== "string" ||
    !valor.startsWith("/") ||
    valor.startsWith("//") ||
    valor.startsWith("/\\")
  ) {
    return padrao;
  }
  return valor;
}
