// Chaves públicas do Supabase (podem ir para o navegador). A segurança dos
// dados vem do RLS e de o servidor conferir a sessão, não do sigilo da chave.
export function configuracaoSupabase() {
  const endereco = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const chave = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!endereco || !chave) {
    throw new Error(
      "Supabase não configurado: defina NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY.",
    );
  }

  // Só o endereço base (https://<projeto>.supabase.co). É comum copiar do
  // painel a URL da API de dados, com "/rest/v1/" no fim, o que quebra o login.
  return { url: new URL(endereco).origin, chave };
}
