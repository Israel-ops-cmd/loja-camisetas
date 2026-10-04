import type { Metadata } from "next";

import { CartaoConta } from "@/components/conta/CartaoConta";
import { FormularioNovaSenha } from "@/components/conta/FormulariosSenha";
import { Aviso } from "@/components/formulario/Aviso";
import { Botao } from "@/components/ui/Botao";
import { obterUsuario } from "@/lib/auth";

export const metadata: Metadata = {
  title: "Nova senha",
  robots: { index: false },
};

/** Aberta pelo link de recuperação, que deixa o cliente logado. */
export default async function PaginaRedefinirSenha() {
  const usuario = await obterUsuario();

  if (!usuario) {
    return (
      <CartaoConta titulo="Nova senha">
        <div className="space-y-5">
          <Aviso tipo="info">
            Para criar uma nova senha, abra o link que enviamos para o seu
            e-mail.
          </Aviso>
          <Botao href="/recuperar-senha" variante="secundario" className="w-full">
            Pedir um link
          </Botao>
        </div>
      </CartaoConta>
    );
  }

  return (
    <CartaoConta
      titulo="Nova senha"
      subtitulo={`Crie uma nova senha para ${usuario.email}.`}
    >
      <FormularioNovaSenha />
    </CartaoConta>
  );
}
