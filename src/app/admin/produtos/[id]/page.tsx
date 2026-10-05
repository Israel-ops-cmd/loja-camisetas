import Link from "next/link";
import { notFound } from "next/navigation";
import { Check, Circle, ExternalLink } from "lucide-react";
import { z } from "zod";

import { FormularioProduto } from "@/components/admin/FormularioProduto";
import { FotosDoProduto } from "@/components/admin/FotosDoProduto";
import { GradeDeVariacoes } from "@/components/admin/GradeDeVariacoes";
import { Aviso } from "@/components/formulario/Aviso";
import { Painel } from "@/components/ui/Painel";
import { exigirAdministrador } from "@/lib/auth";
import { centavosParaTexto } from "@/lib/formatacao";
import { prisma } from "@/lib/prisma";

export default async function PaginaEditarProduto({ params, searchParams }: PageProps<"/admin/produtos/[id]">) {
  await exigirAdministrador();
  const { id } = await params;
  if (!z.uuid().safeParse(id).success) notFound();

  const [produto, categorias, cores, tamanhos] = await Promise.all([
    prisma.produto.findUnique({
      where: { id },
      include: {
        imagens: { orderBy: [{ ordem: "asc" }, { id: "asc" }] },
        variacoes: { select: { corId: true, tamanhoId: true, ativo: true, precoEmCentavos: true, estoque: true } },
      },
    }),
    prisma.categoria.findMany({ orderBy: { ordem: "asc" }, select: { id: true, nome: true } }),
    prisma.cor.findMany({ orderBy: { nome: "asc" }, select: { id: true, nome: true, hex: true } }),
    prisma.tamanho.findMany({ orderBy: { ordem: "asc" }, select: { id: true, nome: true } }),
  ]);
  if (!produto) notFound();
  const { novo } = await searchParams;

  const aVenda = produto.variacoes.filter((v) => v.ativo);
  const passos = [
    { feito: produto.imagens.length > 0, texto: "Ter pelo menos uma foto" },
    { feito: aVenda.length > 0, texto: "Ter cores e tamanhos à venda" },
    { feito: aVenda.some((v) => v.estoque > 0), texto: "Ter estoque em algum tamanho" },
    { feito: produto.ativo, texto: "Ligar “Mostrar na loja”" },
  ];

  return (
    <div className="secao">
      <div className="mx-auto max-w-3xl">
        <p className="sobretitulo text-secundario">
          <Link href="/admin/produtos" className="hover:text-tinta">Produtos</Link>
        </p>
        <h1 className="titulo-destaque mt-4 break-words">{produto.nome}</h1>
        {produto.ativo && (
          <Link
            href={`/produtos/${produto.slug}`}
            target="_blank"
            className="mt-4 inline-flex min-h-11 items-center gap-2 text-[15px] font-semibold underline underline-offset-4"
          >
            Ver na loja
            <ExternalLink aria-hidden="true" className="size-4" strokeWidth={1.8} />
          </Link>
        )}

        <div className="mt-8 space-y-6">
          {novo === "1" && (
            <Aviso tipo="sucesso">
              Produto criado. Agora escolha as cores e os tamanhos e adicione as fotos, mais abaixo.
            </Aviso>
          )}

          <section className="rounded-[20px] bg-papel p-6 sm:p-8">
            <h2 className="sobretitulo">Para aparecer na loja</h2>
            <ul className="mt-4 space-y-2">
              {passos.map((p) => (
                <li key={p.texto} className={`flex items-center gap-3 text-[16px] ${p.feito ? "" : "font-semibold"}`}>
                  {p.feito ? (
                    <Check aria-hidden="true" className="size-5 shrink-0" strokeWidth={2.5} />
                  ) : (
                    <Circle aria-hidden="true" className="size-5 shrink-0 text-secundario" strokeWidth={1.8} />
                  )}
                  {p.texto}
                  <span className="sr-only">{p.feito ? "(feito)" : "(falta)"}</span>
                </li>
              ))}
            </ul>
          </section>

          <Painel titulo="Dados do produto">
            <FormularioProduto
              id={produto.id}
              categorias={categorias}
              valores={{
                nome: produto.nome,
                slug: produto.slug,
                categoriaId: produto.categoriaId,
                descricao: produto.descricao ?? "",
                preco: centavosParaTexto(produto.precoBaseEmCentavos),
                ativo: produto.ativo,
                destaque: produto.destaque,
                pesoEmGramas: String(produto.pesoEmGramas),
                larguraCm: String(produto.larguraCm),
                alturaCm: String(produto.alturaCm),
                comprimentoCm: String(produto.comprimentoCm),
              }}
            />
          </Painel>

          <Painel titulo="Cores e tamanhos">
            <GradeDeVariacoes
              produtoId={produto.id}
              precoBase={produto.precoBaseEmCentavos}
              cores={cores}
              tamanhos={tamanhos}
              variacoes={produto.variacoes}
            />
          </Painel>

          <Painel titulo="Fotos">
            <FotosDoProduto
              produtoId={produto.id}
              cores={cores}
              fotos={produto.imagens.map((f) => ({
                id: f.id,
                url: f.url,
                alt: f.alt,
                corId: f.corId,
                enquadramento: f.enquadramento,
              }))}
            />
          </Painel>
        </div>
      </div>
    </div>
  );
}
