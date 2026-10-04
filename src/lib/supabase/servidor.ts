import "server-only";

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

import { configuracaoSupabase } from "@/lib/supabase/config";

/** Cliente do Supabase para Server Components, Server Actions e Route Handlers. */
export async function criarClienteSupabase() {
  const { url, chave } = configuracaoSupabase();
  const loja = await cookies();

  return createServerClient(url, chave, {
    cookies: {
      getAll() {
        return loja.getAll();
      },
      setAll(cookiesParaGravar) {
        try {
          for (const { name, value, options } of cookiesParaGravar) {
            loja.set(name, value, options);
          }
        } catch {
          // Server Components não podem gravar cookies. Tudo bem: o proxy
          // (src/proxy.ts) renova a sessão antes de a página renderizar.
        }
      },
    },
  });
}
