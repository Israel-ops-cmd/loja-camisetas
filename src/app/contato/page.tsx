import type { Metadata } from "next";
import Link from "next/link";
import { Clock, Mail, MapPin, MessageCircle } from "lucide-react";

import { linkDoWhatsapp, LOJA, ou, whatsappLegivel } from "@/lib/loja";

export const metadata: Metadata = {
  alternates: { canonical: "/contato" },
  title: "Contato",
  description: `Fale com a ${LOJA.nome} pelo WhatsApp ou por e-mail.`,
};

export default function PaginaContato() {
  return (
    <>
      <section className="secao bg-tinta text-papel">
        <div className="mx-auto max-w-3xl">
          <p className="sobretitulo text-secundario-escuro">Contato</p>
          <h1 className="titulo-destaque mt-5">Fale com a gente</h1>
          <p className="texto-destaque mt-6 text-apoio-escuro">
            Dúvidas sobre tamanho, pedido, troca ou personalização? O jeito mais rápido é o WhatsApp.
          </p>
        </div>
      </section>

      <div className="secao">
        <div className="mx-auto max-w-3xl space-y-6">
          <section className="rounded-[20px] bg-papel p-6 sm:p-8">
            <a
              href={linkDoWhatsapp("Olá! Vim pelo site da Carta Viva.")}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-14 w-full items-center justify-center gap-3 rounded-full bg-lacre px-8 text-[17px] font-bold text-papel transition hover:brightness-110 sm:w-auto"
            >
              <MessageCircle aria-hidden="true" className="size-6" strokeWidth={1.8} />
              WhatsApp {whatsappLegivel()}
            </a>

            <ul className="mt-8 space-y-5 text-[16px]">
              <li className="flex items-start gap-3">
                <Mail aria-hidden="true" className="mt-0.5 size-5 shrink-0" strokeWidth={1.6} />
                <span>
                  <span className="block text-[13px] text-secundario">E-mail</span>
                  <a href={`mailto:${LOJA.email}`} className="font-semibold break-all underline underline-offset-4">
                    {LOJA.email}
                  </a>
                </span>
              </li>
              <li className="flex items-start gap-3">
                <Clock aria-hidden="true" className="mt-0.5 size-5 shrink-0" strokeWidth={1.6} />
                <span>
                  <span className="block text-[13px] text-secundario">Horário de atendimento</span>
                  <span className="font-semibold">{ou(LOJA.horario, "HORÁRIO")}</span>
                </span>
              </li>
              <li className="flex items-start gap-3">
                <MapPin aria-hidden="true" className="mt-0.5 size-5 shrink-0" strokeWidth={1.6} />
                <span>
                  <span className="block text-[13px] text-secundario">Onde estamos</span>
                  <span className="font-semibold">{LOJA.cidade}</span>
                  <span className="block text-[14px] text-apoio">Loja on-line: enviamos para todo o Brasil.</span>
                </span>
              </li>
              {LOJA.instagram && (
                <li className="flex items-start gap-3">
                  <span aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-center font-bold">@</span>
                  <span>
                    <span className="block text-[13px] text-secundario">Instagram</span>
                    <a href={LOJA.instagram} target="_blank" rel="noopener noreferrer" className="font-semibold underline underline-offset-4">
                      {LOJA.instagram.replace(/^https?:\/\/(www\.)?instagram\.com\//, "@").replace(/\/$/, "")}
                    </a>
                  </span>
                </li>
              )}
            </ul>
          </section>

          <section className="rounded-[20px] bg-papel p-6 sm:p-8">
            <h2 className="sobretitulo">Atalhos</h2>
            <ul className="mt-4 grid gap-2 sm:grid-cols-2">
              {[
                { href: "/atacado#orcamento", rotulo: "Pedir orçamento de atacado" },
                { href: "/personalizacao", rotulo: "Personalizar com a sua arte" },
                { href: "/politica-de-troca", rotulo: "Trocas e devoluções" },
                { href: "/perguntas-frequentes", rotulo: "Perguntas frequentes" },
              ].map((a) => (
                <li key={a.href}>
                  <Link
                    href={a.href}
                    className="flex min-h-12 items-center rounded-xl border border-borda px-4 font-semibold hover:border-tinta"
                  >
                    {a.rotulo}
                  </Link>
                </li>
              ))}
            </ul>
            <p className="mt-6 text-[14px] text-apoio">
              Já fez um pedido? Tenha o número em mãos (ele está no e-mail de confirmação e em{" "}
              <Link href="/conta" className="font-semibold underline underline-offset-4">Minha conta</Link>): fica mais rápido
              ajudar.
            </p>
          </section>
        </div>
      </div>
    </>
  );
}
