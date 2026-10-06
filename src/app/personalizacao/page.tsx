import type { Metadata } from "next";

import { FormularioPersonalizacao } from "@/components/personalizacao/FormularioPersonalizacao";
import { IlustracaoCamiseta } from "@/components/personalizacao/IlustracaoCamiseta";
import { Botao } from "@/components/ui/Botao";
import { obterUsuario } from "@/lib/auth";
import { listarPecasPersonalizaveis } from "@/lib/personalizacao";

export const metadata: Metadata = {
  alternates: { canonical: "/personalizacao" },
  title: "Personalização",
  description:
    "Envie a sua estampa ou conte a ideia. A gente prepara a prévia, aprova com você e produz.",
};

function hojeEmSaoPaulo() {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "America/Sao_Paulo" }).format(new Date());
}

export default async function PaginaPersonalizacao() {
  const [usuario, pecas] = await Promise.all([obterUsuario(), listarPecasPersonalizaveis()]);

  return (
    <>
      <section className="secao bg-tinta text-papel">
        <div className="mx-auto max-w-7xl">
          <p className="sobretitulo text-secundario-escuro">Personalização</p>
          <h1 className="titulo-destaque mt-5">Sua arte, na sua camiseta.</h1>
          <p className="texto-destaque mt-6 max-w-2xl text-apoio-escuro">
            Envie a sua estampa ou conte a ideia. A gente prepara, aprova com você e
            produz. Ideal para igrejas, equipes, eventos e presentes.
          </p>
          <ol className="mt-10 grid gap-3 sm:grid-cols-3">
            {[
              ["01", "Escolha a peça"],
              ["02", "Envie a sua arte"],
              ["03", "Aprove e receba"],
            ].map(([numero, titulo]) => (
              <li key={numero} className="flex items-center gap-4 rounded-[20px] bg-painel px-6 py-5">
                <span className="font-titulo text-[28px] font-black text-secundario-escuro">{numero}</span>
                <span className="font-titulo text-[17px] font-bold uppercase">{titulo}</span>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <div className="secao">
        <div className="mx-auto max-w-7xl">
          {pecas.length === 0 ? (
            <div className="mx-auto max-w-xl rounded-[20px] bg-papel p-8 text-center">
              <p className="font-titulo text-[22px] font-bold uppercase">Em breve</p>
              <p className="mt-3 text-apoio">
                Ainda não há peças disponíveis para personalizar. Volte em alguns dias.
              </p>
            </div>
          ) : usuario ? (
            <FormularioPersonalizacao pecas={pecas} hoje={hojeEmSaoPaulo()} />
          ) : (
            <div className="grid gap-10 lg:grid-cols-[1fr_400px] lg:items-center">
              <div className="rounded-[20px] bg-papel p-8">
                <h2 className="font-titulo text-[22px] font-bold uppercase">Entre para pedir a sua</h2>
                <p className="mt-3 text-apoio">
                  O pedido de personalização fica na sua conta. É por lá que você vê a
                  prévia, aprova e paga.
                </p>
                <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                  <Botao href="/entrar?voltar=%2Fpersonalizacao">Entrar</Botao>
                  <Botao href="/cadastro" variante="secundario">
                    Criar conta
                  </Botao>
                </div>
              </div>
              <IlustracaoCamiseta posicoes={["FRENTE_PEITO", "COSTAS"]} />
            </div>
          )}
        </div>
      </div>
    </>
  );
}
