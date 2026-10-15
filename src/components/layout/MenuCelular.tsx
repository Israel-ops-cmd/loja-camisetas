"use client";

import Link from "next/link";
import { useState } from "react";

import { IconeFechar, IconeMenu } from "@/components/layout/Icones";
import { menuPrincipal } from "@/lib/navegacao";

const itens = [...menuPrincipal, { rotulo: "Minha conta", href: "/conta" }];

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
        className="inline-flex size-11 items-center justify-center transition hover:opacity-70"
      >
        {aberto ? <IconeFechar /> : <IconeMenu />}
      </button>

      <nav
        id="menu-celular"
        aria-label="Menu principal"
        hidden={!aberto}
        className="absolute inset-x-0 top-full border-b border-borda bg-fundo px-5 pb-4"
      >
        <ul>
          {itens.map((item) => (
            <li key={item.href} className="border-t border-borda first:border-t-0">
              <Link
                href={item.href}
                onClick={() => setAberto(false)}
                className="flex min-h-13 items-center text-[15px]"
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
