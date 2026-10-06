import Image from "next/image";

import { Botao } from "@/components/ui/Botao";

export function Hero() {
  return (
    <section className="secao bg-tinta text-papel">
      <div className="mx-auto grid max-w-7xl items-center gap-12 lg:grid-cols-[1.1fr_1fr]">
        <div>
          <p className="sobretitulo text-secundario-escuro">
            Carta Viva Camisetas
          </p>
          <h1 className="titulo-hero mt-5">Vista o que você quer dizer.</h1>
          <p className="texto-destaque mt-6 max-w-xl text-apoio-escuro">
            Camisetas lisas, estampas da casa e peças personalizadas com a sua
            arte. Para usar, presentear ou vestir a sua equipe.
          </p>
          <div className="mt-9 flex flex-col gap-3 sm:flex-row">
            <Botao href="/produtos">Ver produtos</Botao>
            <Botao href="/personalizacao" variante="contorno">
              Personalizar
            </Botao>
          </div>
        </div>

        <ComposicaoDeFotos />
      </div>
    </section>
  );
}

/** Duas fotos sobrepostas (docs/identidade-visual.md, "Composição do hero"). */
function ComposicaoDeFotos() {
  return (
    <div className="relative pb-[110px]">
      <div className="relative aspect-[6/5] w-[88%] overflow-hidden rounded-[28px] bg-painel">
        <Image
          src="/fotos/nao-temas-creia-casal.jpg"
          alt="Casal com a camiseta azul-marinho “Não temas, creia”: ela mostra a estampa pequena no peito e ele, de costas, a estampa grande com Marcos 5:36"
          fill
          loading="eager"
          fetchPriority="high"
          sizes="(min-width: 1280px) 520px, (min-width: 1024px) 40vw, 88vw"
          className="object-cover object-[50%_35%]"
        />
        <span className="absolute bottom-5 left-5 rounded-full bg-papel px-4 py-2 text-[11px] font-bold tracking-[0.16em] text-tinta uppercase">
          Estampa da casa
        </span>
      </div>

      <div className="absolute right-0 bottom-0 aspect-square w-[34%] overflow-hidden rounded-[24px] border-6 border-tinta bg-painel">
        <Image
          src="/fotos/jesus-my-best-friend.jpg"
          alt="Mulher com a camiseta preta “Jesus, my best friend”"
          fill
          sizes="(min-width: 1280px) 200px, (min-width: 1024px) 16vw, 34vw"
          className="object-cover object-[50%_52%]"
        />
      </div>
    </div>
  );
}
