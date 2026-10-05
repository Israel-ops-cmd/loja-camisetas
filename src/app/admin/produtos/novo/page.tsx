import Link from "next/link";

import { FormularioProduto } from "@/components/admin/FormularioProduto";
import { Painel } from "@/components/ui/Painel";
import { exigirAdministrador } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export default async function PaginaNovoProduto() {
  await exigirAdministrador();
  const categorias = await prisma.categoria.findMany({ orderBy: { ordem: "asc" }, select: { id: true, nome: true } });

  return (
    <div className="secao">
      <div className="mx-auto max-w-3xl">
        <p className="sobretitulo text-secundario">
          <Link href="/admin/produtos" className="hover:text-tinta">Produtos</Link>
        </p>
        <h1 className="titulo-destaque mt-4">Produto novo</h1>
        <p className="mt-4 text-[16px] text-apoio">
          Primeiro os dados principais. Na próxima tela você escolhe cores e tamanhos e adiciona as fotos.
        </p>
        <div className="mt-8">
          <Painel titulo="Dados do produto">
            <FormularioProduto
              id={null}
              categorias={categorias}
              valores={{
                nome: "",
                slug: "",
                categoriaId: "",
                descricao: "",
                preco: "",
                ativo: false,
                destaque: false,
                pesoEmGramas: "300",
                larguraCm: "22",
                alturaCm: "4",
                comprimentoCm: "28",
              }}
            />
          </Painel>
        </div>
      </div>
    </div>
  );
}
