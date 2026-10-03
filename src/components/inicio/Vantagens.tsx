import { CreditCard, RefreshCw, ShieldCheck, Truck } from "lucide-react";

const vantagens = [
  { icone: Truck, texto: "Enviamos para todo o Brasil" },
  { icone: ShieldCheck, texto: "Compra segura" },
  { icone: CreditCard, texto: "Pix, cartão e boleto" },
  { icone: RefreshCw, texto: "Troca fácil" },
];

export function Vantagens() {
  return (
    <section aria-label="Vantagens" className="secao bg-tinta text-papel">
      <ul className="mx-auto grid max-w-7xl gap-8 sm:grid-cols-2 lg:grid-cols-4">
        {vantagens.map(({ icone: Icone, texto }) => (
          <li key={texto} className="flex items-center gap-4">
            <Icone
              aria-hidden="true"
              className="size-8 shrink-0"
              strokeWidth={1.5}
            />
            <span className="texto-menu">{texto}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
