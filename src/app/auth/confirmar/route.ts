import type { EmailOtpType } from "@supabase/supabase-js";
import { NextResponse, type NextRequest } from "next/server";

import { caminhoSeguro, garantirCliente } from "@/lib/auth";
import { criarClienteSupabase } from "@/lib/supabase/servidor";

const TIPOS: EmailOtpType[] = ["signup", "email", "recovery", "email_change"];

/**
 * Destino dos links com `token_hash` (funciona em qualquer navegador).
 * Ainda NÃO está em uso: o Supabase só libera a edição dos modelos de e-mail
 * com SMTP próprio. Quando liberar, troque nos modelos:
 *   Confirm signup:  {{ .SiteURL }}/auth/confirmar?token_hash={{ .TokenHash }}&type=email
 *   Reset password:  {{ .SiteURL }}/auth/confirmar?token_hash={{ .TokenHash }}&type=recovery&next=/redefinir-senha
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const tokenHash = searchParams.get("token_hash");
  const tipo = searchParams.get("type") as EmailOtpType | null;
  const ehRecuperacao = tipo === "recovery";
  const proximo = caminhoSeguro(
    searchParams.get("next"),
    ehRecuperacao ? "/redefinir-senha" : "/conta",
  );

  const ir = (caminho: string) => NextResponse.redirect(`${origin}${caminho}`);

  if (tokenHash && tipo && TIPOS.includes(tipo)) {
    const supabase = await criarClienteSupabase();
    const { data, error } = await supabase.auth.verifyOtp({
      type: tipo,
      token_hash: tokenHash,
    });
    if (!error && data.user) {
      await garantirCliente(data.user);
      return ir(proximo === "/conta" ? "/conta?boas-vindas=1" : proximo);
    }
    console.error("[auth] verificação falhou:", error?.code, error?.message);
  }

  return ir(
    ehRecuperacao
      ? "/recuperar-senha?aviso=link-expirado"
      : "/entrar?aviso=link-expirado",
  );
}
