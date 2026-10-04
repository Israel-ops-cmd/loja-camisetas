import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { CartaoConta } from "@/components/conta/CartaoConta";
import { FormularioEntrar } from "@/components/conta/FormularioEntrar";
import { Aviso } from "@/components/formulario/Aviso";
import { caminhoSeguro, obterUsuario } from "@/lib/auth";

export const metadata: Metadata = {
  title: "Entrar",
  robots: { index: false },
};

const avisos: Record<string, { tipo: "sucesso" | "info"; texto: string }> = {
  "email-confirmado": {
    tipo: "sucesso",
    texto: "E-mail confirmado! Entre com seu e-mail e senha.",
  },
  "link-expirado": {
    tipo: "info",
    texto:
      "Esse link expirou ou já foi usado. Entre com seu e-mail e senha; se a conta ainda não estiver confirmada, você pode pedir um novo link.",
  },
};

export default async function PaginaEntrar({
  searchParams,
}: PageProps<"/entrar">) {
  const parametros = await searchParams;
  const voltar = caminhoSeguro(parametros.voltar);

  if (await obterUsuario()) redirect(voltar);

  const aviso =
    typeof parametros.aviso === "string" ? avisos[parametros.aviso] : undefined;

  return (
    <CartaoConta titulo="Entrar" subtitulo="Acompanhe seus pedidos e compre mais rápido.">
      {aviso && (
        <div className="mb-5">
          <Aviso tipo={aviso.tipo}>{aviso.texto}</Aviso>
        </div>
      )}
      <FormularioEntrar voltar={voltar} />
    </CartaoConta>
  );
}
