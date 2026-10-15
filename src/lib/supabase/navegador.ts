import { createBrowserClient } from "@supabase/ssr";

import { configuracaoSupabase } from "@/lib/supabase/config";

/** Cliente do Supabase no navegador. Hoje usado só para enviar arquivos ao Storage. */
export function criarClienteSupabaseNoNavegador() {
  const { url, chave } = configuracaoSupabase();
  return createBrowserClient(url, chave);
}
