"use client";

import Link from "next/link";
import { useActionState } from "react";

import { cadastrar, type EstadoFormulario } from "@/app/conta/acoes";
import { Aviso } from "@/components/formulario/Aviso";
import { Campo } from "@/components/formulario/Campo";
import { classesBotao } from "@/components/ui/Botao";

export function FormularioCadastro() {
  const [estado, acao, enviando] = useActionState<EstadoFormulario, FormData>(
    cadastrar,
    {},
  );

  if (estado.sucesso) {
    return (
      <div className="space-y-5">
        <Aviso tipo="sucesso">{estado.sucesso}</Aviso>
        <p className="text-[15px] text-apoio">
          Não chegou? Confira a caixa de spam. Se o link expirar, tente entrar
          e peça um novo.
        </p>
        <Link
          href="/entrar"
          className={`${classesBotao("secundario")} w-full`}
        >
          Ir para o login
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {estado.erro && <Aviso tipo="erro">{estado.erro}</Aviso>}

      <form action={acao} noValidate className="space-y-5">
        <Campo
          name="nome"
          rotulo="Nome"
          autoComplete="name"
          required
          defaultValue={estado.valores?.nome}
          erro={estado.campos?.nome}
        />
        <Campo
          name="email"
          type="email"
          rotulo="E-mail"
          autoComplete="email"
          inputMode="email"
          required
          defaultValue={estado.valores?.email}
          erro={estado.campos?.email}
        />
        <Campo
          name="senha"
          type="password"
          rotulo="Senha"
          autoComplete="new-password"
          required
          minLength={8}
          ajuda="Pelo menos 8 caracteres."
          erro={estado.campos?.senha}
        />
        <Campo
          name="confirmacao"
          type="password"
          rotulo="Confirme a senha"
          autoComplete="new-password"
          required
          erro={estado.campos?.confirmacao}
        />

        <p className="text-[13px] text-secundario">
          Ao criar a conta, você concorda com os{" "}
          <Link href="/termos" target="_blank" className="underline underline-offset-4">
            termos de uso
          </Link>{" "}
          e com a{" "}
          <Link href="/privacidade" target="_blank" className="underline underline-offset-4">
            política de privacidade
          </Link>{" "}
          da Carta Viva.
        </p>

        <button
          type="submit"
          disabled={enviando}
          className={`${classesBotao("principal")} w-full`}
        >
          {enviando ? "Criando conta…" : "Criar conta"}
        </button>
      </form>

      <p className="border-t border-borda pt-5 text-center text-[15px] text-apoio">
        Já tem conta?{" "}
        <Link
          href="/entrar"
          className="font-semibold text-tinta underline underline-offset-4"
        >
          Entrar
        </Link>
      </p>
    </div>
  );
}
