import Image from "next/image";
import { Shirt } from "lucide-react";
import Link from "next/link";

import type { ProdutoResumo } from "@/lib/catalogo";
import { formatarPreco } from "@/lib/formatacao";

type ProdutoCartaoProps = {
  produto: ProdutoResumo;
  /** Larguras para o `sizes` da foto, conforme a grade onde o cartão está. */
  sizes: string;
};

/** Até 4 bolinhas de cor; o resto vira "+N". */
const CORES_NO_CARTAO = 4;

/**
 * Foto quadrada (troca para as costas ao passar o mouse), nome, referência,
 * "a partir de" e as cores.
 */
export function ProdutoCartao({ produto, sizes }: ProdutoCartaoProps) {
  const { foto, fotoVerso } = produto;
  const sobram = produto.cores.length - CORES_NO_CARTAO;

  return (
    <article className="group relative flex flex-col">
      <div className="relative flex aspect-square items-center justify-center overflow-hidden bg-produto">
        {foto ? (
          <>
            <Image
              src={foto.url}
              alt={foto.alt}
              fill
              sizes={sizes}
              className={`object-cover transition duration-500 ${fotoVerso ? "group-hover:opacity-0" : ""} ${produto.esgotado ? "opacity-60" : ""}`}
              style={foto.enquadramento ? { objectPosition: foto.enquadramento } : undefined}
            />
            {fotoVerso && (
              <Image
                src={fotoVerso.url}
                alt=""
                fill
                sizes={sizes}
                className="object-cover opacity-0 transition duration-500 group-hover:opacity-100"
                style={fotoVerso.enquadramento ? { objectPosition: fotoVerso.enquadramento } : undefined}
              />
            )}
          </>
        ) : (
          <Shirt aria-hidden="true" className="size-16 text-secundario/40" strokeWidth={1} />
        )}
        {produto.esgotado && (
          <span className="absolute top-3 left-3 bg-tinta px-3 py-1 text-[11px] font-semibold tracking-[0.16em] text-papel uppercase">
            Esgotado
          </span>
        )}
      </div>

      <h3 className="mt-3.5 font-titulo text-[22px] leading-[1.2]">
        {/* O link cobre o cartão inteiro, mas o texto lido é só o nome. */}
        <Link
          href={`/produtos/${produto.slug}`}
          className="after:absolute after:inset-0 focus-visible:outline-none focus-visible:after:outline-2 focus-visible:after:outline-offset-4 focus-visible:after:outline-tinta"
        >
          {produto.nome}
        </Link>
      </h3>
      {produto.referencia && <p className="text-[13px] text-secundario">{produto.referencia}</p>}
      <p className="mt-1 text-[14px]">
        {produto.precoVaria && "a partir de "}
        {formatarPreco(produto.precoEmCentavos)}
      </p>
      {produto.cores.length > 0 && (
        <ul aria-label={`${produto.cores.length === 1 ? "1 cor" : `${produto.cores.length} cores`}`} className="mt-2.5 flex items-center gap-1.5">
          {produto.cores.slice(0, CORES_NO_CARTAO).map((cor) => (
            <li
              key={cor.nome}
              title={cor.nome}
              className="size-3 rounded-full border border-opcao"
              style={{ backgroundColor: cor.hex }}
            >
              <span className="sr-only">{cor.nome}</span>
            </li>
          ))}
          {sobram > 0 && (
            <li className="text-[12px] leading-3 text-secundario">
              +{sobram}
              <span className="sr-only"> {sobram === 1 ? "cor" : "cores"}</span>
            </li>
          )}
        </ul>
      )}
    </article>
  );
}
