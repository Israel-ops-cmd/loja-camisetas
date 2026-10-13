import Link from "next/link";

import { ContadorCarrinho } from "@/components/carrinho/ContadorCarrinho";
import { IconeConta, IconeSacola } from "@/components/layout/Icones";
import { Logo } from "@/components/marca/Logo";
import { menuPrincipal } from "@/lib/navegacao";

import { MenuCelular } from "./MenuCelular";

const estiloIcone = "inline-flex size-11 items-center justify-center transition hover:opacity-70";

/** Menu à esquerda, logo no centro, conta e sacola à direita. */
export function Cabecalho() {
  return (
    <header className="sticky top-0 z-40 border-b border-borda bg-fundo">
      <div className="mx-auto grid h-16 max-w-[1440px] grid-cols-[1fr_auto_1fr] items-center gap-4 px-3 sm:px-[clamp(20px,5vw,72px)] lg:h-[76px]">
        <div className="flex items-center">
          <MenuCelular />
          <nav aria-label="Menu principal" className="hidden lg:block">
            <ul className="flex flex-wrap items-center gap-x-7 gap-y-1 text-[13px] tracking-[0.04em]">
              {menuPrincipal.map((item) => (
                <li key={item.href}>
                  <Link href={item.href} className="inline-flex min-h-11 items-center transition hover:opacity-70">
                    {item.rotulo}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>

        <Link href="/" aria-label="Carta Viva: página inicial">
          <Logo />
        </Link>

        <div className="flex items-center justify-end">
          <Link href="/conta" aria-label="Minha conta" className={`hidden sm:inline-flex ${estiloIcone}`}>
            <IconeConta />
          </Link>
          <Link href="/carrinho" className={`relative ${estiloIcone}`}>
            <IconeSacola />
            <span className="sr-only">Sacola</span>
            <ContadorCarrinho />
          </Link>
        </div>
      </div>
    </header>
  );
}
