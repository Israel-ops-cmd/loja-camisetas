import { Botao } from "@/components/ui/Botao";

const passos = [
  { numero: "01", titulo: "Escolha a peça" },
  { numero: "02", titulo: "Envie a sua arte" },
  { numero: "03", titulo: "Aprove e receba" },
];

export function Personalizacao() {
  return (
    <section
      id="personalizacao"
      aria-labelledby="titulo-personalizacao"
      className="secao scroll-mt-18 bg-tinta text-papel"
    >
      <div className="mx-auto grid max-w-7xl items-center gap-12 lg:grid-cols-2">
        <div>
          <p className="sobretitulo text-secundario-escuro">Personalização</p>
          <h2 id="titulo-personalizacao" className="titulo-destaque mt-5">
            Sua arte, na sua camiseta.
          </h2>
          <p className="texto-destaque mt-6 max-w-lg text-apoio-escuro">
            Envie a sua estampa ou conte a ideia. A gente prepara, aprova com
            você e produz.
          </p>
          <Botao href="/personalizacao" className="mt-9">
            Quero personalizar
          </Botao>
        </div>

        <ol className="grid gap-4">
          {passos.map((passo) => (
            <li
              key={passo.numero}
              className="flex items-center gap-6 rounded-[20px] bg-painel px-7 py-6"
            >
              <span className="font-titulo text-[34px] font-black text-secundario-escuro">
                {passo.numero}
              </span>
              <span className="font-titulo text-[20px] font-bold uppercase">
                {passo.titulo}
              </span>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
