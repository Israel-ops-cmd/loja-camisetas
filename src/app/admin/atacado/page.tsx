import { EditorDeAtacado } from "@/components/admin/EditorDeAtacado";
import { Painel } from "@/components/ui/Painel";
import { exigirAdministrador } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/** Só para o exemplo em reais da prévia. */
const PRECO_DE_EXEMPLO = 4990;

export default async function PaginaAdminAtacado() {
  await exigirAdministrador();
  const faixas = await prisma.faixaAtacado.findMany({
    orderBy: { minimoDePecas: "asc" },
    select: { minimoDePecas: true, percentual: true, ativo: true },
  });

  return (
    <div className="secao">
      <div className="mx-auto max-w-3xl">
        <h1 className="titulo-destaque">Atacado</h1>
        <p className="mt-4 text-[16px] text-apoio">
          Desconto automático por quantidade, no carrinho da loja. Pedidos já feitos não mudam quando você altera a
          tabela. Pedidos grandes e sob medida continuam chegando em Orçamentos.
        </p>
        <div className="mt-8">
          <Painel titulo="Tabela de desconto">
            <EditorDeAtacado
              ligado={faixas.length > 0 && faixas.every((f) => f.ativo)}
              faixas={faixas}
              precoDeExemplo={PRECO_DE_EXEMPLO}
            />
          </Painel>
        </div>
      </div>
    </div>
  );
}
