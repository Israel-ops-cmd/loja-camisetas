import { formatarPreco } from "@/lib/formatacao";

export type ProdutoCartaoProps = {
  nome: string;
  /** Em centavos. `null` enquanto o preço não foi definido. */
  precoEmCentavos: number | null;
  /** Cores disponíveis, em hexadecimal. */
  cores: { nome: string; hex: string }[];
  etiqueta?: string;
};

export function ProdutoCartao({
  nome,
  precoEmCentavos,
  cores,
  etiqueta,
}: ProdutoCartaoProps) {
  return (
    <article>
      <div className="relative flex aspect-[4/5] items-center justify-center rounded-xl bg-produto">
        {etiqueta && (
          <span className="absolute top-3 left-3 rounded-full bg-tinta px-3 py-1 text-[11px] font-bold tracking-[0.16em] text-papel">
            {etiqueta}
          </span>
        )}
        <span className="text-[12px] font-semibold tracking-[0.2em] text-secundario">
          [FOTO]
        </span>
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
