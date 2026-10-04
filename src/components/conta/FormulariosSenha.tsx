"use client";

import Link from "next/link";
import { useActionState } from "react";

import {
  recuperarSenha,
  redefinirSenha,
  type EstadoFormulario,
} from "@/app/conta/acoes";
import { Aviso } from "@/components/formulario/Aviso";
import { Campo } from "@/components/formulario/Campo";
import { classesBotao } from "@/components/ui/Botao";

export function FormularioRecuperarSenha() {
  const [estado, acao, enviando] = useActionState<EstadoFormulario, FormData>(
    recuperarSenha,
    {},
  );

  if (estado.sucesso) {
    return (
      <div className="space-y-5">
        <Aviso tipo="sucesso">{estado.sucesso}</Aviso>
        <Link href="/entrar" className={`${classesBotao("secundario")} w-full`}>
          Voltar para o login
        </Link>
      </div>
    );
  }

  return (
    <form action={acao} noValidate className="space-y-5">
      {estado.erro && <Aviso tipo="erro">{estado.erro}</Aviso>}
      <Campo
        name="email"
        type="email"
        rotulo="E-mail da conta"
        autoComplete="email"
        inputMode="email"
        required
        defaultValue={estado.valores?.email}
        erro={estado.campos?.email}
      />
      <button
        type="submit"
        disabled={enviando}
        className={`${classesBotao("principal")} w-full`}
      >
        {enviando ? "Enviando…" : "Enviar link"}
      </button>
    </form>
  );
}

export function FormularioNovaSenha() {
  const [estado, acao, enviando] = useActionState<EstadoFormulario, FormData>(
    redefinirSenha,
    {},
  );

  return (
    <form action={acao} noValidate className="space-y-5">
      {estado.erro && <Aviso tipo="erro">{estado.erro}</Aviso>}
      <Campo
        name="senha"
        type="password"
        rotulo="Nova senha"
        autoComplete="new-password"
        required
        minLength={8}
        ajuda="Pelo menos 8 caracteres."
        erro={estado.campos?.senha}
      />
      <Campo
        name="confirmacao"
        type="password"
        rotulo="Confirme a nova senha"
        autoComplete="new-password"
        required
        erro={estado.campos?.confirmacao}
      />
      <button
        type="submit"
        disabled={enviando}
        className={`${classesBotao("principal")} w-full`}
      >
        {enviando ? "Salvando…" : "Salvar nova senha"}
      </button>
    </form>
  );
}
