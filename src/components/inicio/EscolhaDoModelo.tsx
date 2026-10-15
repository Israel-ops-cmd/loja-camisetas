import Image from "next/image";
import Link from "next/link";

import { CabecalhoDaSecao } from "@/components/inicio/CabecalhoDaSecao";
import { AoRolar } from "@/components/ui/AoRolar";
import { listarModelosDaVitrine } from "@/lib/catalogo";
import { formatarPreco } from "@/lib/formatacao";

/** Um cartão por modelo, levando ao catálogo filtrado por ele. */
export async function EscolhaDoModelo() {
  const modelos = await listarModelosDaVitrine();
  if (modelos.length === 0) return null;

  return (
    <section aria-labelledby="titulo-modelos" className="largura pb-24 lg:pb-26">
      <AoRolar>
        <CabecalhoDaSecao id="titulo-modelos" titulo="Escolha o seu modelo" link={{ href: "/produtos", texto: "Ver todos" }} />
        <ul className="grid grid-cols-2 gap-5 lg:grid-cols-4">
          {modelos.map((modelo) => (
            <li key={modelo.slug}>
              <Link href={`/produtos?modelo=${modelo.slug}`} className="group flex flex-col gap-3.5">
                <span className="relative block aspect-[3/4] overflow-hidden bg-produto">
                  {modelo.foto && (
                    <Image
                      src={modelo.foto.url}
                      alt=""
                      fill
                      sizes="(min-width: 1024px) 25vw, 50vw"
                      className="object-cover transition duration-500 group-hover:scale-[1.02]"
                    />
                  )}
                </span>
                <span className="flex flex-wrap justify-between gap-x-3 text-[14px]">
                  <span className="font-semibold">{modelo.nome}</span>
                  <span className="text-secundario">a partir de {formatarPreco(modelo.precoEmCentavos)}</span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </AoRolar>
    </section>
  );
}
