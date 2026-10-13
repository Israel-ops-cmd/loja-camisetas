import { mmParaTexto } from "@/lib/produtos-regras";
import type { ProdutoDetalhe } from "@/lib/produto";

/** Tabela de medidas de cada modelo à venda, só com os tamanhos vendidos. */
export function TabelaDeMedidas({ modelos }: { modelos: ProdutoDetalhe["modelos"] }) {
  const comMedidas = modelos.filter((m) => m.medidas.length > 0);

  return (
    <div className="space-y-6 pb-5">
      {comMedidas.length === 0 ? (
        <p className="text-apoio">A tabela de medidas deste produto ainda não foi cadastrada. Fale com a gente para tirar dúvidas.</p>
      ) : (
        comMedidas.map((modelo) => (
          <div key={modelo.id} className="overflow-x-auto">
            <table className="w-full min-w-[280px] text-left text-[14px]">
              <caption className="pb-2 text-left font-semibold">{modelo.nome} (medidas em cm)</caption>
              <thead>
                <tr className="border-b border-borda text-secundario">
                  <th scope="col" className="py-2 pr-3 font-semibold">Tamanho</th>
                  <th scope="col" className="py-2 pr-3 font-semibold">Comprimento</th>
                  <th scope="col" className="py-2 pr-3 font-semibold">Largura</th>
                  <th scope="col" className="py-2 font-semibold">Manga</th>
                </tr>
              </thead>
              <tbody>
                {modelo.medidas.map((m) => (
                  <tr key={m.tamanho} className="border-b border-borda last:border-0">
                    <th scope="row" className="py-2 pr-3 font-bold">{m.tamanho}</th>
                    <td className="py-2 pr-3">{mmParaTexto(m.comprimentoMm)}</td>
                    <td className="py-2 pr-3">{mmParaTexto(m.larguraMm)}</td>
                    <td className="py-2">{mmParaTexto(m.mangaMm)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ))
      )}
      {comMedidas.length > 0 && (
        <p className="text-[13px] text-secundario">As medidas podem ter pequenas variações.</p>
      )}
    </div>
  );
}
