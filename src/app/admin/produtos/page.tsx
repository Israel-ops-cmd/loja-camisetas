import Image from "next/image";
import Link from "next/link";
import { ImageOff, Plus } from "lucide-react";

import { classesBotao } from "@/components/ui/Botao";
import { exigirAdministrador } from "@/lib/auth";
import { formatarPreco } from "@/lib/formatacao";
import { prisma } from "@/lib/prisma";

export default async function PaginaAdminProdutos() {
  await exigirAdministrador();

  const produtos = await prisma.produto.findMany({
    orderBy: [{ ativo: "desc" }, { criadoEm: "desc" }],
    select: {
      id: true,
      nome: true,
      ativo: true,
      destaque: true,
      precoBaseEmCentavos: true,
      categoria: { select: { nome: true } },
      imagens: { orderBy: { ordem: "asc" }, take: 1, select: { url: true, enquadramento: true } },
      variacoes: { where: { ativo: true }, select: { estoque: true } },
    },
  });

  return (
    <div className="secao">
      <div className="mx-auto max-w-5xl">
        <h1 className="titulo-destaque">Produtos</h1>
        <Link href="/admin/produtos/novo" className={`${classesBotao("principal")} mt-6 w-full gap-2 sm:w-auto`}>
          <Plus aria-hidden="true" className="size-5" strokeWidth={2} />
          Cadastrar produto novo
        </Link>

        {produtos.length === 0 ? (
          <p className="mt-10 text-apoio">Nenhum produto cadastrado ainda.</p>
        ) : (
          <ul className="mt-8 divide-y divide-borda rounded-[20px] bg-papel">
            {produtos.map((p) => {
              const foto = p.imagens[0];
              const pecas = p.variacoes.reduce((soma, v) => soma + Math.max(v.estoque, 0), 0);
              const avisos = [
                !foto && "sem fotos",
                p.variacoes.length === 0 && "sem tamanhos à venda",
                p.variacoes.length > 0 && pecas === 0 && "sem estoque",
              ].filter(Boolean);
              return (
                <li key={p.id}>
                  <Link href={`/admin/produtos/${p.id}`} className="flex min-h-20 items-center gap-4 px-4 py-3 hover:bg-fundo sm:px-6">
                    <span className="relative size-16 shrink-0 overflow-hidden rounded-xl bg-produto">
                      {foto ? (
                        <Image
                          src={foto.url}
                          alt=""
                          fill
                          sizes="64px"
                          className="object-cover"
                          style={foto.enquadramento ? { objectPosition: foto.enquadramento } : undefined}
                        />
                      ) : (
                        <ImageOff aria-hidden="true" className="absolute inset-0 m-auto size-6 text-secundario" strokeWidth={1.5} />
                      )}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block font-semibold">{p.nome}</span>
                      <span className="block text-[14px] text-secundario">
                        {p.categoria.nome} · {formatarPreco(p.precoBaseEmCentavos)}
                        {p.destaque && " · destaque"}
                      </span>
                      {avisos.length > 0 && (
                        <span className="block text-[14px] font-semibold">Atenção: {avisos.join(", ")}</span>
                      )}
                    </span>
                    <span
                      className={`shrink-0 rounded-full px-3 py-1 text-[12px] font-bold tracking-[0.12em] uppercase ${p.ativo ? "bg-tinta text-papel" : "border border-borda text-secundario"}`}
                    >
                      {p.ativo ? "Na loja" : "Escondido"}
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
