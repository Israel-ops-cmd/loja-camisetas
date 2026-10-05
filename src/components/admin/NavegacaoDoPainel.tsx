"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const SECOES = [
  { href: "/admin", rotulo: "Início" },
  { href: "/admin/produtos", rotulo: "Produtos" },
  { href: "/admin/personalizacoes", rotulo: "Personalizações" },
  { href: "/admin/orcamentos", rotulo: "Orçamentos" },
];

/** Atalhos do painel, roláveis de lado no celular. */
export function NavegacaoDoPainel() {
  const caminho = usePathname();
  return (
    <nav aria-label="Seções do painel" className="border-b border-borda bg-papel">
      <ul className="mx-auto flex max-w-5xl gap-2 overflow-x-auto px-4 py-3 sm:px-6">
        {SECOES.map((s) => {
          const atual = s.href === "/admin" ? caminho === "/admin" : caminho.startsWith(s.href);
          return (
            <li key={s.href} className="shrink-0">
              <Link
                href={s.href}
                aria-current={atual ? "page" : undefined}
                className={`flex min-h-11 items-center rounded-full px-5 text-[15px] font-semibold ${atual ? "bg-tinta text-papel" : "hover:bg-fundo"}`}
              >
                {s.rotulo}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
