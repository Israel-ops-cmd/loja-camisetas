import Link from "next/link";

import { Logo } from "@/components/marca/Logo";
import { enderecoCompleto, identificacaoDaLoja, linkDoWhatsapp, LOJA, ou, whatsappLegivel } from "@/lib/loja";
import { menuPrincipal } from "@/lib/navegacao";

// Contatos vêm de src/lib/loja.ts. O que ainda não foi definido aparece
// como marcador entre colchetes; o Instagram só aparece quando existir.
type Item = { rotulo: string; href?: string; externo?: boolean };

const colunas: { titulo: string; itens: Item[] }[] = [
  {
    titulo: "Loja",
    itens: menuPrincipal.map(({ rotulo, href }) => ({ rotulo, href })),
  },
  {
    titulo: "Ajuda",
    itens: [
      { rotulo: "Perguntas frequentes", href: "/perguntas-frequentes" },
      { rotulo: "Trocas e devoluções", href: "/politica-de-troca" },
      { rotulo: "Privacidade", href: "/privacidade" },
      { rotulo: "Termos de uso", href: "/termos" },
      { rotulo: "Fale com a gente", href: "/contato" },
    ],
  },
  {
    titulo: "Contato",
    itens: [
      { rotulo: `WhatsApp ${whatsappLegivel()}`, href: linkDoWhatsapp(), externo: true },
      { rotulo: LOJA.email, href: `mailto:${LOJA.email}`, externo: true },
      ...(LOJA.instagram ? [{ rotulo: "Instagram", href: LOJA.instagram, externo: true }] : []),
      { rotulo: ou(LOJA.horario, "HORÁRIO") },
    ],
  },
];

/** Rodapé escuro: a Tinta fica para o botão principal e o rodapé. */
export function Rodape() {
  return (
    <footer className="bg-tinta text-apoio-escuro">
      <div className="mx-auto grid max-w-[1440px] gap-10 px-[clamp(20px,5vw,72px)] pt-18 pb-12 text-[14px] sm:grid-cols-2 lg:grid-cols-4">
        <div className="flex flex-col gap-3.5">
          <Logo escuro />
          <span className="text-secundario-escuro">{LOJA.cidade}</span>
        </div>

        {colunas.map((coluna) => (
          <div key={coluna.titulo}>
            <h2 className="text-[11px] tracking-[0.28em] text-secundario-escuro uppercase">{coluna.titulo}</h2>
            <ul className="mt-2.5">
              {coluna.itens.map((item) => (
                <li key={item.rotulo}>
                  {item.href && item.externo ? (
                    <a
                      href={item.href}
                      target={item.href.startsWith("http") ? "_blank" : undefined}
                      rel="noopener noreferrer"
                      className="inline-flex min-h-11 items-center break-all transition hover:opacity-70"
                    >
                      {item.rotulo}
                    </a>
                  ) : item.href ? (
                    <Link href={item.href} className="inline-flex min-h-11 items-center transition hover:opacity-70">
                      {item.rotulo}
                    </Link>
                  ) : (
                    <span className="inline-flex min-h-11 items-center text-secundario-escuro">{item.rotulo}</span>
                  )}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <p className="mx-auto max-w-[1440px] border-t border-linha-escura px-[clamp(20px,5vw,72px)] py-5 text-[12px] text-secundario-escuro">
        © {new Date().getFullYear()} {identificacaoDaLoja()} · {enderecoCompleto()}
      </p>
    </footer>
  );
}
