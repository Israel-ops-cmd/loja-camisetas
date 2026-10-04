import { CircleAlert, CircleCheck, Info } from "lucide-react";
import type { ReactNode } from "react";

const icones = { erro: CircleAlert, sucesso: CircleCheck, info: Info };

/** Mensagem com ícone. O erro não usa vermelho: o Lacre é a cor da marca. */
export function Aviso({
  tipo,
  children,
}: {
  tipo: keyof typeof icones;
  children: ReactNode;
}) {
  const Icone = icones[tipo];
  return (
    <div
      role={tipo === "erro" ? "alert" : "status"}
      className={`flex items-start gap-3 rounded-xl border px-4 py-3 text-[15px] ${tipo === "erro" ? "border-tinta bg-papel font-semibold" : "border-borda bg-papel"}`}
    >
      <Icone
        aria-hidden="true"
        className="mt-0.5 size-5 shrink-0"
        strokeWidth={1.6}
      />
      <div>{children}</div>
    </div>
  );
}
