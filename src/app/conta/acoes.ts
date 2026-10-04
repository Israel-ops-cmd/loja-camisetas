"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";

import { caminhoSeguro, garantirCliente } from "@/lib/auth";
import { traduzirErroDeAuth } from "@/lib/erros-auth";
import { criarClienteSupabase } from "@/lib/supabase/servidor";

// Server Actions são endpoints públicos: toda entrada é validada aqui.

export type EstadoFormulario = {
  erro?: string;
  /** Erros por campo, para mostrar abaixo de cada um. */
  campos?: Record<string, string>;
  /** Valores para preencher o formulário de novo (nunca a senha). */
  valores?: Record<string, string>;
  /** Mensagem de sucesso (ex.: e-mail enviado). */
  sucesso?: string;
  /** Mostra a opção de reenviar a confirmação. */
  reenviarConfirmacao?: boolean;
};

const SENHA_MINIMA = 8;

const email = z
  .string()
  .trim()
  .toLowerCase()
  .min(1, "Informe seu e-mail.")
  .max(254, "E-mail longo demais.")
  .pipe(z.email("Confira o e-mail."));

const senha = z
  .string()
  .min(SENHA_MINIMA, `A senha precisa ter pelo menos ${SENHA_MINIMA} caracteres.`)
  .max(72, "A senha pode ter no máximo 72 caracteres.");

function texto(formData: FormData, campo: string) {
  const valor = formData.get(campo);
  return typeof valor === "string" ? valor : "";
}

function errosPorCampo(erro: z.ZodError) {
  const campos: Record<string, string> = {};
  for (const problema of erro.issues) {
    const campo = String(problema.path[0] ?? "");
    campos[campo] ??= problema.message;
  }
  return campos;
}

/** Endereço do site para os links dos e-mails (precisa estar nas Redirect URLs do Supabase). */
async function origemDoSite() {
  const cabecalhos = await headers();
  const origem = cabecalhos.get("origin");
  if (origem) return origem;
  const host = cabecalhos.get("host");
  const protocolo = cabecalhos.get("x-forwarded-proto") ?? "https";
  return `${protocolo}://${host}`;
}

// ---------------------------------------------------------------- Cadastro

const esquemaCadastro = z
  .object({
    nome: z
      .string()
      .trim()
      .min(2, "Informe seu nome.")
      .max(100, "Nome longo demais."),
    email,
    senha,
    confirmacao: z.string(),
  })
  .refine((dados) => dados.senha === dados.confirmacao, {
    message: "As senhas não são iguais.",
    path: ["confirmacao"],
  });

export async function cadastrar(
  _anterior: EstadoFormulario,
  formData: FormData,
): Promise<EstadoFormulario> {
  const valores = { nome: texto(formData, "nome"), email: texto(formData, "email") };
  const validacao = esquemaCadastro.safeParse({
    ...valores,
    senha: texto(formData, "senha"),
    confirmacao: texto(formData, "confirmacao"),
  });
  if (!validacao.success) {
    return { campos: errosPorCampo(validacao.error), valores };
  }

  const supabase = await criarClienteSupabase();
  const { error } = await supabase.auth.signUp({
    email: validacao.data.email,
    password: validacao.data.senha,
    options: {
      data: { nome: validacao.data.nome },
      emailRedirectTo: `${await origemDoSite()}/auth/callback?next=/conta`,
    },
  });

  if (error) return { erro: traduzirErroDeAuth(error), valores };

  // Se o e-mail já tiver conta, o Supabase responde igual (sem erro) para não
  // revelar quem é cliente. A mensagem também é a mesma.
  return {
    sucesso: `Enviamos um link de confirmação para ${validacao.data.email}. Abra o e-mail e toque no link para ativar a conta.`,
  };
}

// ---------------------------------------------------------------- Entrar

const esquemaEntrar = z.object({
  email,
  senha: z.string().min(1, "Informe sua senha.").max(72),
});

export async function entrar(
  _anterior: EstadoFormulario,
  formData: FormData,
): Promise<EstadoFormulario> {
  const valores = { email: texto(formData, "email") };
  const validacao = esquemaEntrar.safeParse({
    email: valores.email,
    senha: texto(formData, "senha"),
  });
  if (!validacao.success) {
    return { campos: errosPorCampo(validacao.error), valores };
  }

  const supabase = await criarClienteSupabase();
  const { data, error } = await supabase.auth.signInWithPassword({
    email: validacao.data.email,
    password: validacao.data.senha,
  });

  if (error) {
    return {
      erro: traduzirErroDeAuth(error),
      valores,
      reenviarConfirmacao: error.code === "email_not_confirmed",
    };
  }

  await garantirCliente(data.user);
  redirect(caminhoSeguro(texto(formData, "voltar")));
}

export async function reenviarConfirmacao(
  _anterior: EstadoFormulario,
  formData: FormData,
): Promise<EstadoFormulario> {
  const validacao = email.safeParse(texto(formData, "email"));
  if (!validacao.success) return { erro: "Confira o e-mail." };

  const supabase = await criarClienteSupabase();
  const { error } = await supabase.auth.resend({
    type: "signup",
    email: validacao.data,
    options: {
      emailRedirectTo: `${await origemDoSite()}/auth/callback?next=/conta`,
    },
  });
  if (error) return { erro: traduzirErroDeAuth(error) };

  return { sucesso: "Enviamos um novo link de confirmação." };
}

// ---------------------------------------------------------------- Sair

export async function sair() {
  const supabase = await criarClienteSupabase();
  await supabase.auth.signOut();
  redirect("/");
}

// ---------------------------------------------------------------- Senha

export async function recuperarSenha(
  _anterior: EstadoFormulario,
  formData: FormData,
): Promise<EstadoFormulario> {
  const valores = { email: texto(formData, "email") };
  const validacao = email.safeParse(valores.email);
  if (!validacao.success) {
    return { campos: { email: validacao.error.issues[0].message }, valores };
  }

  const supabase = await criarClienteSupabase();
  const { error } = await supabase.auth.resetPasswordForEmail(validacao.data, {
    redirectTo: `${await origemDoSite()}/auth/callback?next=/redefinir-senha`,
  });

  // Limite de envio é o único erro mostrado. Os outros caem na mensagem
  // padrão, que não revela se o e-mail tem conta.
  if (
    error?.code === "over_email_send_rate_limit" ||
    error?.code === "over_request_rate_limit"
  ) {
    return { erro: traduzirErroDeAuth(error), valores };
  }
  if (error) console.error("[auth] recuperar senha:", error.code, error.message);

  return {
    sucesso:
      "Se houver uma conta com esse e-mail, enviamos um link para criar uma nova senha. Abra o link neste mesmo navegador.",
  };
}

const esquemaNovaSenha = z
  .object({ senha, confirmacao: z.string() })
  .refine((dados) => dados.senha === dados.confirmacao, {
    message: "As senhas não são iguais.",
    path: ["confirmacao"],
  });

export async function redefinirSenha(
  _anterior: EstadoFormulario,
  formData: FormData,
): Promise<EstadoFormulario> {
  const validacao = esquemaNovaSenha.safeParse({
    senha: texto(formData, "senha"),
    confirmacao: texto(formData, "confirmacao"),
  });
  if (!validacao.success) return { campos: errosPorCampo(validacao.error) };

  const supabase = await criarClienteSupabase();
  const { error } = await supabase.auth.updateUser({
    password: validacao.data.senha,
  });
  if (error) return { erro: traduzirErroDeAuth(error) };

  redirect("/conta?senha=alterada");
}
