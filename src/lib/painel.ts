import "server-only";

import { revalidatePath } from "next/cache";

import { obterUsuario } from "@/lib/auth";

/**
 * Para Server Actions do painel: o layout de /admin não protege ações,
 * então cada uma confere aqui se quem chama é administrador.
 */
export async function administradorDaAcao() {
  const usuario = await obterUsuario();
  return usuario?.administrador ? usuario : null;
}

export const SEM_PERMISSAO = "Sua sessão de administrador expirou. Entre de novo na loja e tente outra vez.";

/**
 * Atualiza na hora as páginas do site que mostram produtos (elas também se
 * atualizam sozinhas a cada poucos minutos).
 */
export function atualizarPaginasDoCatalogo(...slugs: (string | null | undefined)[]) {
  revalidatePath("/");
  revalidatePath("/produtos");
  for (const slug of new Set(slugs)) {
    if (slug) revalidatePath(`/produtos/${slug}`);
  }
}
