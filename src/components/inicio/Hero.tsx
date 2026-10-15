import Image from "next/image";

import { Botao } from "@/components/ui/Botao";

export function Hero() {
  return (
    <section className="largura grid items-center gap-x-10 gap-y-12 pt-12 pb-20 md:grid-cols-2 lg:gap-x-18 lg:pt-18 lg:pb-24">
      <div className="flex max-w-[520px] flex-col gap-7">
        <span className="sobretitulo text-secundario">Camisetas e personalizados</span>
        <h1 className="titulo-hero">Vista o que você quer dizer.</h1>
        <p className="max-w-[440px] text-[17px] text-apoio">
          Tem estampa nossa, tem camiseta lisa e, se você já tem uma ideia, a gente estampa a sua arte. Mandamos para
          todo o Brasil.
        </p>
        <div className="flex flex-wrap items-center gap-x-7 gap-y-3.5">
          <Botao href="/produtos">Ver as camisetas</Botao>
          <Botao href="/personalizacao" variante="texto">
            Personalizar
          </Botao>
        </div>
        <span className="font-titulo text-[17px] text-secundario italic">Estampado em Natal, RN</span>
      </div>

      <figure className="flex flex-col gap-3">
        <div className="relative aspect-[4/5] bg-areia">
          <Image
            src="/fotos/nao-temas-creia-casal.jpg"
            alt="Casal com a camiseta azul-marinho “Não temas, creia”, de frente e de costas"
            fill
            loading="eager"
            fetchPriority="high"
            sizes="(min-width: 1440px) 640px, (min-width: 768px) 45vw, 100vw"
            className="object-cover object-[50%_35%]"
          />
        </div>
        <figcaption className="text-[12px] tracking-[0.04em] text-secundario">
          Não temas, creia · Tradicional azul-marinho
        </figcaption>
      </figure>
    </section>
  );
}
