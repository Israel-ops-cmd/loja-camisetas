import type { AuthError } from "@supabase/supabase-js";

// Códigos: https://supabase.com/docs/guides/auth/debugging/error-codes
const mensagens: Record<string, string> = {
  invalid_credentials: "E-mail ou senha incorretos.",
  email_not_confirmed:
    "Confirme seu e-mail antes de entrar. Procure o link na sua caixa de entrada (e no spam).",
  user_already_exists: "Já existe uma conta com esse e-mail.",
  email_exists: "Já existe uma conta com esse e-mail.",
  weak_password: "Senha fraca. Use pelo menos 8 caracteres, misturando letras e números.",
  same_password: "A nova senha precisa ser diferente da atual.",
  over_email_send_rate_limit:
    "Muitos e-mails enviados em pouco tempo. Aguarde alguns minutos e tente de novo.",
  over_request_rate_limit:
    "Muitas tentativas em pouco tempo. Aguarde alguns minutos e tente de novo.",
  email_address_not_authorized:
    "Não conseguimos enviar o e-mail agora. Tente de novo mais tarde ou fale com a gente.",
  signup_disabled: "Cadastros estão temporariamente fechados.",
  email_address_invalid: "Não conseguimos usar esse e-mail. Confira o endereço.",
  otp_expired: "Esse link expirou ou já foi usado. Peça um novo.",
  session_not_found: "Sua sessão expirou. Entre de novo.",
};

const SESSAO_AUSENTE =
  "Sua sessão expirou. Abra de novo o link do e-mail ou peça um novo.";

export function traduzirErroDeAuth(erro: AuthError | null | undefined) {
  if (!erro) return "Algo deu errado. Tente de novo.";
  if (erro.code && mensagens[erro.code]) return mensagens[erro.code];
  // Esse erro vem sem código, só com o nome da classe.
  if (erro.name === "AuthSessionMissingError") return SESSAO_AUSENTE;
  console.error("[auth] erro não traduzido:", erro.code, erro.message);
  return "Algo deu errado. Tente de novo em instantes.";
}
