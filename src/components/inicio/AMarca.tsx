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
            O nome vem de 2 Coríntios 3:3: somos cartas escritas não com tinta, mas com o Espírito do Deus vivo. Cada
            camiseta leva uma mensagem curta, com letra limpa e espaço para respirar.
          </p>
          <p className="text-apoio">Estampamos depois do pedido, aqui em Natal, e conferimos cada peça antes de enviar.</p>
        </div>
      </AoRolar>
    </section>
  );
}
