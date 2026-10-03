import Link from "next/link";

import { Logo } from "@/components/marca/Logo";

// Dados de contato e páginas de políticas ainda não fornecidos:
// os marcadores entre colchetes são trocados quando chegarem.
const colunas = [
  {
    titulo: "Atendimento",
    itens: [
      { rotulo: "WhatsApp: [WHATSAPP]" },
      { rotulo: "E-mail: [E-MAIL]" },
      { rotulo: "Horário: [HORÁRIO]" },
    ],
  },
  {
    titulo: "Políticas",
    itens: [
      { rotulo: "Trocas e devoluções", href: "/politica-de-troca" },
      { rotulo: "Privacidade", href: "/privacidade" },
      { rotulo: "Perguntas frequentes", href: "/#perguntas-frequentes" },
    ],
  },
  {
    titulo: "Contato",
    itens: [
      { rotulo: "Instagram: [INSTAGRAM]" },
      { rotulo: "[CIDADE]" },
    ],
  },
];

export function Rodape() {
  return (
    <footer className="secao border-t border-borda bg-fundo">
      <div className="mx-auto grid max-w-7xl gap-10 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <Logo />
          <p className="mt-5 max-w-xs text-[15px] text-apoio">
            Camisetas lisas, estampas da casa e peças personalizadas com a sua
            arte.
          </p>
        </div>

        {colunas.map((coluna) => (
          <div key={coluna.titulo}>
            <h2 className="sobretitulo text-tinta">{coluna.titulo}</h2>
            <ul className="mt-4 space-y-1 text-[15px] text-apoio">
              {coluna.itens.map((item) => (
                <li key={item.rotulo}>
                  {"href" in item && item.href ? (
                    <Link
                      href={item.href}
                      className="inline-flex min-h-11 items-center transition hover:text-tinta"
                    >
                      {item.rotulo}
                    </Link>
                  ) : (
                    <span className="inline-flex min-h-11 items-center">
                      {item.rotulo}
                    </span>
                  )}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <p className="mx-auto mt-12 max-w-7xl border-t border-borda pt-6 text-[13px] text-secundario">
        © {new Date().getFullYear()} Carta Viva Camisetas · CNPJ [CNPJ]
      </p>
    </footer>
  );
}
