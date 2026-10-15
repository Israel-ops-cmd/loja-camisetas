import { Botao } from "@/components/ui/Botao";
import { listarFaixasDeAtacado } from "@/lib/atacado";
import { descreverFaixa } from "@/lib/atacado-regras";

/** Atacado numa linha: título, tabela de desconto (a do painel) e orçamento. */
export async function Atacado() {
  const faixas = await listarFaixasDeAtacado();

  return (
    <section id="atacado" aria-labelledby="titulo-atacado" className="largura scroll-mt-20 pb-28">
      <div className="grid items-center gap-x-12 gap-y-7 border-y border-borda py-11 lg:grid-cols-[1fr_auto_1fr]">
        <h2 id="titulo-atacado" className="font-titulo text-[32px] leading-[1.15]">
          Comprando em quantidade?
        </h2>
        {faixas.length > 0 && (
          <dl className="grid auto-cols-fr grid-flow-col gap-3 text-center">
            {faixas.map((faixa, i) => (
              <div key={faixa.minimoDePecas}>
                <dt className="text-[12px] text-secundario">
                  {descreverFaixa(faixa, faixas[i + 1]).replace("peças ou mais", "ou mais")}
                </dt>
                <dd className="mt-1 font-titulo text-[30px]">{faixa.percentual}%</dd>
              </div>
            ))}
          </dl>
        )}
        <div className="flex flex-col gap-2.5">
          <p className="text-[14px] text-apoio">
            O desconto vale para qualquer estampa e modelo, somando a sacola. Para pedidos grandes, pedimos um
            orçamento.
          </p>
          <Botao href="/atacado#orcamento" variante="texto" className="self-start">
            Pedir orçamento
          </Botao>
        </div>
      </div>
    </section>
  );
}
