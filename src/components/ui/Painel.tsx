import type { ReactNode } from "react";

/** Bloco com linha fina no topo e título pequeno, usado nas páginas de detalhe. */
export function Painel({ titulo, children }: { titulo: string; children: ReactNode }) {
  return (
    <section className="border-t border-borda pt-6 sm:pt-8">
      <h2 className="sobretitulo">{titulo}</h2>
      <div className="mt-4">{children}</div>
    </section>
  );
}
