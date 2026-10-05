import type { ReactNode } from "react";

/** Bloco branco com título pequeno, usado nas páginas de detalhe. */
export function Painel({ titulo, children }: { titulo: string; children: ReactNode }) {
  return (
    <section className="rounded-[20px] bg-papel p-6 sm:p-8">
      <h2 className="sobretitulo">{titulo}</h2>
      <div className="mt-4">{children}</div>
    </section>
  );
}
