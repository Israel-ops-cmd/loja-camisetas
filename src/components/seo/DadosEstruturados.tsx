import { isValidElement, type ReactNode } from "react";

/**
 * Dados estruturados (JSON-LD, schema.org) para o Google. O "<" é escapado
 * para nenhum texto vindo do banco fechar a tag de script.
 */
export function DadosEstruturados({ dados }: { dados: Record<string, unknown> }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(dados).replace(/</g, "\\u003c") }}
    />
  );
}

/** Texto puro de um trecho de JSX simples (textos, fragmentos e links). */
export function textoDe(no: ReactNode): string {
  if (no === null || no === undefined || typeof no === "boolean") return "";
  if (typeof no === "string" || typeof no === "number") return String(no);
  if (Array.isArray(no)) return no.map(textoDe).join("");
  if (isValidElement<{ children?: ReactNode }>(no)) return textoDe(no.props.children);
  return "";
}
