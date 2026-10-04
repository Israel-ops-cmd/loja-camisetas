import type { InputHTMLAttributes } from "react";

type CampoProps = InputHTMLAttributes<HTMLInputElement> & {
  name: string;
  rotulo: string;
  erro?: string;
  ajuda?: string;
};

export function Campo({ name, rotulo, erro, ajuda, id, ...props }: CampoProps) {
  const idCampo = id ?? `campo-${name}`;
  const idDescricao = `${idCampo}-descricao`;

  return (
    <div>
      <label htmlFor={idCampo} className="block text-[14px] font-semibold">
        {rotulo}
      </label>
      <input
        id={idCampo}
        name={name}
        aria-invalid={erro ? true : undefined}
        aria-describedby={erro || ajuda ? idDescricao : undefined}
        className={`mt-2 h-12 w-full rounded-xl border bg-papel px-4 text-[16px] outline-none transition focus:border-tinta ${erro ? "border-tinta" : "border-borda"}`}
        {...props}
      />
      {(erro || ajuda) && (
        <p
          id={idDescricao}
          className={`mt-1.5 text-[13px] ${erro ? "font-semibold text-tinta" : "text-secundario"}`}
        >
          {erro ?? ajuda}
        </p>
      )}
    </div>
  );
}
