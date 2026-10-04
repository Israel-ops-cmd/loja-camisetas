import type { ReactNode } from "react";

/** Moldura das telas de conta (entrar, cadastro, senha). */
export function CartaoConta({
  titulo,
  subtitulo,
  children,
}: {
  titulo: string;
  subtitulo?: string;
  children: ReactNode;
}) {
  return (
    <div className="secao">
      <div className="mx-auto max-w-md">
        <h1 className="titulo-listagem">{titulo}</h1>
        {subtitulo && (
          <p className="mt-4 text-center text-apoio">{subtitulo}</p>
        )}
        <div className="mt-10 rounded-[20px] bg-papel p-6 sm:p-8">
          {children}
        </div>
      </div>
    </div>
  );
}
