import Image from "next/image";

import { formatarPreco } from "@/lib/formatacao";

export type ProdutoCartaoProps = {
  nome: string;
  /** Em centavos. `null` enquanto o preço não foi definido. */
  precoEmCentavos: number | null;
  /** Cores disponíveis, em hexadecimal. */
  cores: { nome: string; hex: string }[];
  foto?: {
    src: string;
    alt: string;
    /** Classe `object-[x_y]` para enquadrar a estampa no recorte quadrado. */
    posicao?: string;
  };
  etiqueta?: string;
};

export function ProdutoCartao({
  nome,
  precoEmCentavos,
  cores,
  foto,
  etiqueta,
}: ProdutoCartaoProps) {
  return (
    <article>
      <div className="relative flex aspect-square items-center justify-center overflow-hidden rounded-xl bg-produto">
        {foto ? (
          <Image
            src={foto.src}
            alt={foto.alt}
            fill
            sizes="(min-width: 1280px) 300px, (min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"
            className={`object-cover ${foto.posicao ?? ""}`}
          />
        ) : (
          <span className="text-[12px] font-semibold tracking-[0.2em] text-secundario">
            [FOTO]
          </span>
        )}
        {etiqueta && (
          <span className="absolute top-3 left-3 rounded-full bg-tinta px-3 py-1 text-[11px] font-bold tracking-[0.16em] text-papel">
            {etiqueta}
          </span>
        )}
      </div>
      <h3 className="mt-4 text-[13px] font-semibold tracking-[0.12em] uppercase">
        {nome}
      </h3>
      <p className="mt-1 font-titulo text-[20px] font-extrabold">
        {precoEmCentavos === null ? "[PREÇO]" : formatarPreco(precoEmCentavos)}
      </p>
      {cores.length > 0 ? (
        <ul aria-label="Cores disponíveis" className="mt-3 flex gap-2">
          {cores.map((cor) => (
            <li
              key={cor.hex}
              title={cor.nome}
              className="size-[18px] rounded border border-borda"
              style={{ backgroundColor: cor.hex }}
            >
              <span className="sr-only">{cor.nome}</span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-3 text-[13px] text-secundario">[CORES]</p>
      )}
    </article>
  );
}
