import Image from "next/image";

import { AoRolar } from "@/components/ui/AoRolar";
import { Botao } from "@/components/ui/Botao";

const passos = [
  "Escolha o modelo, a cor e os tamanhos",
  "Envie a sua arte ou conte a ideia",
  "Aprove a prévia e receba em casa",
];

export function Personalizacao() {
  return (
    <section id="personalizacao" aria-labelledby="titulo-personalizacao" className="scroll-mt-20">
      <AoRolar className="largura grid items-center gap-x-20 gap-y-12 py-24 lg:grid-cols-2 lg:py-28">
        <div className="flex max-w-[520px] flex-col gap-5.5">
          <span className="sobretitulo text-secundario">Personalizadas</span>
          <h2 id="titulo-personalizacao" className="titulo-destaque">
            Sua arte, na sua camiseta.
          </h2>
          <p className="text-apoio">
            Para a igreja, o estúdio, a família ou o evento. Você envia a arte, a gente prepara a prévia e só produz
            depois da sua aprovação.
          </p>
          <ol className="mt-2 border-t border-borda">
            {passos.map((passo, i) => (
              <li key={passo} className="flex gap-5 border-b border-borda py-4">
                <span className="w-7 font-titulo text-[20px] text-secundario">{String(i + 1).padStart(2, "0")}</span>
                <span>{passo}</span>
              </li>
            ))}
          </ol>
          <Botao href="/personalizacao" className="self-start">
            Começar personalização
          </Botao>
        </div>
        <figure className="flex flex-col gap-3">
          <div className="relative aspect-[4/5]">
            <Image
              src="/fotos/personalizacao-pilates-casal.jpg"
              alt="Casal na praia vestindo camisetas cinza personalizadas com a arte de um estúdio de pilates"
              fill
              sizes="(min-width: 1024px) 45vw, 100vw"
              className="object-cover object-[50%_30%]"
            />
          </div>
          <figcaption className="text-[12px] tracking-[0.04em] text-secundario">
            Feita pela Carta Viva para um estúdio de pilates
          </figcaption>
        </figure>
      </AoRolar>
    </section>
  );
}
