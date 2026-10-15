import type { Metadata } from "next";

import { CartaoConta } from "@/components/conta/CartaoConta";
import { FormularioRecuperarSenha } from "@/components/conta/FormulariosSenha";
import { Aviso } from "@/components/formulario/Aviso";

export const metadata: Metadata = {
  title: "Recuperar senha",
  robots: { index: false },
};

const avisos: Record<string, string> = {
  "link-expirado": "Esse link expirou ou já foi usado. Peça um novo abaixo.",
  // Limitação do link padrão do Supabase (fluxo PKCE). Some quando os
  // modelos de e-mail usarem /auth/confirmar.
  "outro-navegador":
    "O link precisa ser aberto no mesmo navegador em que você pediu a nova senha. Peça um novo link abaixo e abra o e-mail neste aparelho.",
};

export default async function PaginaRecuperarSenha({
  searchParams,
}: PageProps<"/recuperar-senha">) {
  const { aviso } = await searchParams;
  const texto = typeof aviso === "string" ? avisos[aviso] : undefined;

  return (
    <CartaoConta
      titulo="Recuperar senha"
      subtitulo="Informe o e-mail da sua conta e enviamos um link para criar uma nova senha."
    >
      {texto && (
        <div className="mb-5">
          <Aviso tipo="info">{texto}</Aviso>
        </div>
      )}
      <FormularioRecuperarSenha />
    </CartaoConta>
  );
}
