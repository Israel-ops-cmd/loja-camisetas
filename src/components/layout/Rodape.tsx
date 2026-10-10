import Link from "next/link";

import { Logo } from "@/components/marca/Logo";
import { enderecoCompleto, identificacaoDaLoja, linkDoWhatsapp, LOJA, ou, whatsappLegivel } from "@/lib/loja";

// Contatos vêm de src/lib/loja.ts. O que ainda não foi definido aparece
// como marcador entre colchetes; o Instagram só aparece quando existir.
type Item = { rotulo: string; href?: string; externo?: boolean };

const colunas: { titulo: string; itens: Item[] }[] = [
  {
    titulo: "Atendimento",
    itens: [
      { rotulo: `WhatsApp ${whatsappLegivel()}`, href: linkDoWhatsapp(), externo: true },
      { rotulo: LOJA.email, href: `mailto:${LOJA.email}`, externo: true },
      { rotulo: `Horário: ${ou(LOJA.horario, "HORÁRIO")}` },
    ],
  },
  {
    titulo: "Políticas",
    itens: [
      { rotulo: "Trocas e devoluções", href: "/politica-de-troca" },
      { rotulo: "Privacidade", href: "/privacidade" },
      { rotulo: "Termos de uso", href: "/termos" },
      { rotulo: "Perguntas frequentes", href: "/perguntas-frequentes" },
    ],
  },
  {
    titulo: "Contato",
    itens: [
      { rotulo: "Fale com a gente", href: "/contato" },
      ...(LOJA.instagram ? [{ rotulo: "Instagram", href: LOJA.instagram, externo: true }] : []),
      { rotulo: LOJA.cidade },
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
            Camisetas e personalizados: estampas da casa, peças lisas e produtos
            com a sua arte.
          </p>
        </div>

        {colunas.map((coluna) => (
          <div key={coluna.titulo}>
            <h2 className="sobretitulo text-tinta">{coluna.titulo}</h2>
            <ul className="mt-4 space-y-1 text-[15px] text-apoio">
              {coluna.itens.map((item) => (
                <li key={item.rotulo}>
                  {item.href && item.externo ? (
                    <a
                      href={item.href}
                      target={item.href.startsWith("http") ? "_blank" : undefined}
                      rel="noopener noreferrer"
                      className="inline-flex min-h-11 items-center break-all transition hover:text-tinta"
                    >
                      {item.rotulo}
                    </a>
                  ) : item.href ? (
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
        © {new Date().getFullYear()} {identificacaoDaLoja()}
        <br />
        {enderecoCompleto()}
      </p>
    </footer>
  );
}
