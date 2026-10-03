import Link from "next/link";
import { ShoppingBag, User } from "lucide-react";

import { Logo } from "@/components/marca/Logo";
import { menuPrincipal } from "@/lib/navegacao";

import { MenuCelular } from "./MenuCelular";

const estiloIcone =
  "inline-flex size-11 items-center justify-center rounded-full transition hover:bg-fundo";

export function Cabecalho() {
  return (
    <header className="sticky top-0 z-40 border-b border-borda bg-papel">
      <div className="mx-auto flex h-18 max-w-7xl items-center justify-between gap-4 px-[clamp(20px,5vw,80px)]">
        <div className="flex items-center gap-1">
          <MenuCelular />
          <Link href="/" aria-label="Carta Viva Camisetas, página inicial">
            <Logo />
          </Link>
        </div>

        <nav aria-label="Menu principal" className="hidden lg:block">
          <ul className="flex items-center gap-8">
            {menuPrincipal.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className="texto-menu py-3 transition hover:text-secundario"
                >
                  {item.rotulo}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="flex items-center">
          <Link href="/conta" aria-label="Minha conta" className={estiloIcone}>
            <User className="size-[22px]" strokeWidth={1.6} />
          </Link>
          <Link href="/carrinho" aria-label="Carrinho" className={estiloIcone}>
            <ShoppingBag className="size-[22px]" strokeWidth={1.6} />
          </Link>
        </div>
      </div>
    </header>
  );
}
