"use client";

import { useEffect, useRef, type ReactNode } from "react";

/**
 * Fade curto quando o conteúdo entra na tela (classe `aparece`, em
 * globals.css). Sem JavaScript ou com "reduzir movimento", aparece direto.
 */
export function AoRolar({ children, className = "" }: { children: ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const elemento = ref.current;
    if (!elemento || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    // Já visível ao carregar: não esconde.
    if (elemento.getBoundingClientRect().top < window.innerHeight) return;
    elemento.setAttribute("data-escondido", "");
    const observador = new IntersectionObserver(
      ([entrada]) => {
        if (entrada.isIntersecting) {
          elemento.removeAttribute("data-escondido");
          observador.disconnect();
        }
      },
      { rootMargin: "0px 0px -10% 0px" },
    );
    observador.observe(elemento);
    return () => observador.disconnect();
  }, []);

  return (
    <div ref={ref} className={`aparece ${className}`}>
      {children}
    </div>
  );
}
