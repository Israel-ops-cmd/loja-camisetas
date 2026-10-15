import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { CartaoConta } from "@/components/conta/CartaoConta";
import { FormularioCadastro } from "@/components/conta/FormularioCadastro";
import { obterUsuario } from "@/lib/auth";

export const metadata: Metadata = {
  title: "Criar conta",
  robots: { index: false },
};

export default async function PaginaCadastro() {
  if (await obterUsuario()) redirect("/conta");

  return (
    <CartaoConta
      titulo="Criar conta"
      subtitulo="Leva menos de um minuto. Depois é só confirmar pelo e-mail."
    >
      <FormularioCadastro />
    </CartaoConta>
  );
}
