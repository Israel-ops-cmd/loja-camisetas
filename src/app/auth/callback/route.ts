import { NextResponse, type NextRequest } from "next/server";

import { caminhoSeguro, garantirCliente } from "@/lib/auth";
import { criarClienteSupabase } from "@/lib/supabase/servidor";

/**
 * Destino do link PADRÃO dos e-mails do Supabase (fluxo PKCE).
 * O Supabase confirma o e-mail e volta para cá com `?code=`. O código só pode
 * ser trocado por uma sessão no MESMO navegador em que o cadastro ou o pedido
 * de senha foi feito. Quando os modelos de e-mail puderem ser editados, use
 * /auth/confirmar (token_hash), que funciona em qualquer navegador.
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const proximo = caminhoSeguro(searchParams.get("next"));
  const ehRecuperacao = proximo === "/redefinir-senha";

  const ir = (caminho: string) => NextResponse.redirect(`${origin}${caminho}`);

  // Link expirado ou já usado: o Supabase devolve o erro na URL.
  if (searchParams.get("error")) {
    return ir(
      ehRecuperacao
        ? "/recuperar-senha?aviso=link-expirado"
        : "/entrar?aviso=link-expirado",
    );
  }

  const codigo = searchParams.get("code");
  if (codigo) {
    const supabase = await criarClienteSupabase();
    const { data, error } = await supabase.auth.exchangeCodeForSession(codigo);
    if (!error && data.user) {
      await garantirCliente(data.user);
      return ir(proximo === "/conta" ? "/conta?boas-vindas=1" : proximo);
    }
    console.error("[auth] troca do código falhou:", error?.code, error?.message);
  }

  // Sem sessão: link aberto em outro navegador. No cadastro, o e-mail já foi
  // confirmado pelo Supabase antes de chegar aqui, então basta entrar.
  return ir(
    ehRecuperacao
      ? "/recuperar-senha?aviso=outro-navegador"
      : "/entrar?aviso=email-confirmado",
  );
}
