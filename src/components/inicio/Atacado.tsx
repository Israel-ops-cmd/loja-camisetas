import { Botao } from "@/components/ui/Botao";

export function Atacado() {
  return (
    <section
      id="atacado"
      aria-labelledby="titulo-atacado"
      className="secao scroll-mt-18"
    >
      <div className="mx-auto flex max-w-7xl flex-col items-start gap-8 rounded-[28px] bg-papel p-[clamp(28px,5vw,64px)] lg:flex-row lg:items-center lg:justify-between">
        <div className="max-w-2xl">
          <p className="sobretitulo text-secundario">Atacado</p>
          <h2 id="titulo-atacado" className="titulo-destaque mt-5">
            Comprando em quantidade?
          </h2>
          <p className="texto-destaque mt-6 text-apoio">
            Camisetas para empresas, igrejas, eventos e revenda, com preço menor
            por quantidade. Conte o que você precisa e a gente monta o
            orçamento.
          </p>
        </div>
        <Botao href="/atacado#orcamento" variante="secundario" className="shrink-0">
          Pedir orçamento
        </Botao>
      </div>
    </section>
  );
}
