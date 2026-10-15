import Link from "next/link";

/** Título à esquerda, link à direita, separados do resto por uma linha fina. */
export function CabecalhoDaSecao({
  id,
  titulo,
  sobretitulo,
  link,
}: {
  id: string;
  titulo: string;
  sobretitulo?: string;
  link?: { href: string; texto: string };
}) {
  return (
    <div className="mb-8 flex flex-wrap items-baseline justify-between gap-3 border-t border-borda pt-7">
      <div className="flex flex-col gap-1.5">
        {sobretitulo && <span className="sobretitulo text-secundario">{sobretitulo}</span>}
        <h2 id={id} className="titulo-listagem">
          {titulo}
        </h2>
      </div>
      {link && (
        <Link href={link.href} className="border-b border-tinta text-[13px] tracking-[0.08em] hover:opacity-70">
          {link.texto}
        </Link>
      )}
    </div>
  );
}
