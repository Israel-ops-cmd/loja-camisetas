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

export function ProdutoCartao({ produto, sizes }: ProdutoCartaoProps) {
  const { foto } = produto;

  return (
    <article className="group relative">
      <div className="relative flex aspect-square items-center justify-center overflow-hidden rounded-xl bg-produto">
        {foto ? (
          <Image
            src={foto.url}
            alt={foto.alt}
            fill
            sizes={sizes}
            className={`object-cover transition duration-500 group-hover:scale-[1.03] ${produto.esgotado ? "opacity-60" : ""}`}
            style={
              foto.enquadramento
                ? { objectPosition: foto.enquadramento }
                : undefined
            }
          />
        ) : (
          <Shirt aria-hidden="true" className="size-16 text-secundario/40" strokeWidth={1} />
        )}
        {produto.esgotado && (
          <span className="absolute top-3 left-3 rounded-full bg-tinta px-3 py-1 text-[11px] font-bold tracking-[0.16em] text-papel uppercase">
            Esgotado
          </span>
        )}
      </div>

      <h3 className="mt-4 text-[13px] font-semibold tracking-[0.12em] uppercase">
        {/* O link cobre o cartão inteiro, mas o texto lido é só o nome. */}
        <Link
          href={`/produtos/${produto.slug}`}
          className="after:absolute after:inset-0 after:rounded-xl focus-visible:outline-none focus-visible:after:outline-2 focus-visible:after:outline-offset-4 focus-visible:after:outline-lacre"
        >
          {produto.nome}
        </Link>
      </h3>
      <p className="mt-1 font-titulo text-[20px] font-extrabold">
        {produto.precoVaria && (
          <span className="mr-1 font-sans text-[13px] font-semibold text-secundario">
            A partir de
          </span>
        )}
        {formatarPreco(produto.precoEmCentavos)}
      </p>
      {produto.cores.length > 0 && (
        <ul aria-label="Cores disponíveis" className="mt-3 flex gap-2">
          {produto.cores.map((cor) => (
            <li
              key={cor.nome}
              title={cor.nome}
              className="size-[18px] rounded border border-borda"
              style={{ backgroundColor: cor.hex }}
            >
              <span className="sr-only">{cor.nome}</span>
            </li>
          ))}
        </ul>
      )}
    </article>
  );
}
