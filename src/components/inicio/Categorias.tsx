import Link from "next/link";

// Fotos das categorias ainda não fornecidas: o cartão mostra um marcador.
const categorias = [
  { linha: "Camisetas", nome: "Básicas", href: "/#produtos" },
  { linha: "Estampas", nome: "Da Casa", href: "/#produtos" },
  { linha: "Com a sua arte", nome: "Personalizadas", href: "/#personalizacao" },
  { linha: "Em quantidade", nome: "Atacado", href: "/#atacado" },
];

export function Categorias() {
  return (
    <section aria-labelledby="titulo-categorias" className="secao">
      <div className="mx-auto max-w-7xl">
        <h2 id="titulo-categorias" className="titulo-listagem">
          Categorias
        </h2>
        <ul className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {categorias.map((categoria) => (
            <li key={categoria.nome}>
              <Link
                href={categoria.href}
                className="group relative flex min-h-[380px] flex-col justify-end overflow-hidden rounded-[20px] bg-painel p-7 text-papel"
              >
                <span className="absolute top-6 left-7 text-[12px] font-semibold tracking-[0.2em] text-secundario-escuro">
                  [FOTO]
                </span>
                <span
                  aria-hidden="true"
                  className="absolute inset-0 bg-gradient-to-t from-tinta/90 via-tinta/20 to-transparent"
                />
                <span className="relative text-[14px] text-apoio-escuro">
                  {categoria.linha}
                </span>
                <span className="relative mt-1 font-titulo text-[34px] leading-none font-extrabold uppercase transition group-hover:translate-x-1">
                  {categoria.nome}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
