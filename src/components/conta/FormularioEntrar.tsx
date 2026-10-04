"use client";

import Link from "next/link";
import { useActionState } from "react";

import {
  entrar,
  reenviarConfirmacao,
  type EstadoFormulario,
} from "@/app/conta/acoes";
import { Aviso } from "@/components/formulario/Aviso";
import { Campo } from "@/components/formulario/Campo";
import { classesBotao } from "@/components/ui/Botao";

export function FormularioEntrar({ voltar }: { voltar: string }) {
  const [estado, acao, enviando] = useActionState<EstadoFormulario, FormData>(
    entrar,
    {},
  );
  const [reenvio, acaoReenviar, reenviando] = useActionState<
    EstadoFormulario,
    FormData
  >(reenviarConfirmacao, {});

  return (
    <div className="space-y-5">
      {estado.erro && <Aviso tipo="erro">{estado.erro}</Aviso>}

      {estado.reenviarConfirmacao && (
        <form action={acaoReenviar}>
          <input type="hidden" name="email" value={estado.valores?.email ?? ""} />
          {reenvio.sucesso ? (
            <Aviso tipo="sucesso">{reenvio.sucesso}</Aviso>
          ) : (
            <>
              {reenvio.erro && <Aviso tipo="erro">{reenvio.erro}</Aviso>}
              <button
                type="submit"
                disabled={reenviando}
                className="inline-flex min-h-11 items-center text-[14px] font-semibold underline underline-offset-4 hover:text-secundario"
              >
                {reenviando ? "Enviando…" : "Reenviar e-mail de confirmação"}
              </button>
            </>
          )}
        </form>
      )}

      <form action={acao} noValidate className="space-y-5">
        <input type="hidden" name="voltar" value={voltar} />
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
          autoComplete="current-password"
          required
          erro={estado.campos?.senha}
        />
        <div className="-mt-2 text-right">
          <Link
            href="/recuperar-senha"
            className="inline-flex min-h-11 items-center text-[14px] text-secundario underline underline-offset-4 hover:text-tinta"
          >
            Esqueci minha senha
          </Link>
        </div>
        <button
          type="submit"
          disabled={enviando}
          className={`${classesBotao("principal")} w-full`}
        >
          {enviando ? "Entrando…" : "Entrar"}
        </button>
      </form>

      <p className="border-t border-borda pt-5 text-center text-[15px] text-apoio">
        Ainda não tem conta?{" "}
        <Link
          href={`/cadastro${voltar !== "/conta" ? `?voltar=${encodeURIComponent(voltar)}` : ""}`}
          className="font-semibold text-tinta underline underline-offset-4"
        >
          Criar conta
        </Link>
      </p>
    </div>
  );
}
