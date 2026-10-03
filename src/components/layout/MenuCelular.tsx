"use client";

import Link from "next/link";
import { Menu, X } from "lucide-react";
import { useState } from "react";

import { menuPrincipal } from "@/lib/navegacao";

export function MenuCelular() {
  const [aberto, setAberto] = useState(false);

  return (
    <div className="lg:hidden">
      <button
        type="button"
        aria-label={aberto ? "Fechar menu" : "Abrir menu"}
        aria-expanded={aberto}
        aria-controls="menu-celular"
        onClick={() => setAberto(!aberto)}
        className="-ml-2.5 inline-flex size-11 items-center justify-center rounded-full transition hover:bg-fundo"
      >
        {aberto ? (
          <X className="size-6" strokeWidth={1.6} />
        ) : (
          <Menu className="size-6" strokeWidth={1.6} />
        )}
      </button>

      <nav
        id="menu-celular"
        aria-label="Menu principal"
        hidden={!aberto}
        className="absolute inset-x-0 top-full border-b border-borda bg-papel px-[clamp(20px,5vw,80px)] pb-4"
      >
        <ul>
          {menuPrincipal.map((item) => (
            <li key={item.href} className="border-t border-borda first:border-t-0">
              <Link
                href={item.href}
                onClick={() => setAberto(false)}
                className="texto-menu flex min-h-13 items-center"
              >
                {item.rotulo}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
}
