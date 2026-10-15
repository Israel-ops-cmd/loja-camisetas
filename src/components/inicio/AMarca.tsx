import Image from "next/image";

import { AoRolar } from "@/components/ui/AoRolar";

/** "Uma carta que se veste": faixa areia com foto e o texto da marca. */
export function AMarca() {
  return (
    <section aria-labelledby="titulo-marca" className="bg-areia">
      <AoRolar className="largura grid items-center gap-x-10 gap-y-12 py-20 md:grid-cols-2 lg:gap-x-20 lg:py-26">
        <div className="relative aspect-[3/2]">
          <Image
            src="/fotos/nao-temas-creia-dobrada.jpg"
            alt="Camiseta “Não temas, creia” dobrada, mostrando a frente e as costas"
            fill
            sizes="(min-width: 768px) 45vw, 100vw"
            className="object-cover"
          />
        </div>
        <div className="flex max-w-[480px] flex-col gap-5.5">
          <span className="sobretitulo text-secundario">A marca</span>
          <h2 id="titulo-marca" className="titulo-destaque">
            Uma carta que se veste.
          </h2>
          <p className="text-apoio">
            Nosso nome vem de 2 Coríntios 3:3, que descreve as pessoas como cartas escritas não com tinta, mas pelo
            Espírito do Deus vivo. Dessa ideia nasceu a primeira coleção, e dela vem o que guia a marca até hoje: cada
            camiseta carrega uma mensagem.
          </p>
          <p className="text-apoio">
            Hoje criamos estampas para públicos e propósitos diferentes, sempre com o mesmo cuidado: design limpo,
            produção própria em Natal e conferência de cada peça antes do envio.
          </p>
        </div>
      </AoRolar>
    </section>
  );
}
