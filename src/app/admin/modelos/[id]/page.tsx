import Link from "next/link";
import { notFound } from "next/navigation";
import { z } from "zod";

import { CoresETamanhosDoModelo } from "@/components/admin/CoresETamanhosDoModelo";
import { FormularioModelo } from "@/components/admin/FormularioModelo";
import { Aviso } from "@/components/formulario/Aviso";
import { Painel } from "@/components/ui/Painel";
import { exigirAdministrador } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export default async function PaginaEditarModelo({ params, searchParams }: PageProps<"/admin/modelos/[id]">) {
  await exigirAdministrador();
  const { id } = await params;
  if (!z.uuid().safeParse(id).success) notFound();

  const [modelo, cores, tamanhos] = await Promise.all([
    prisma.modelo.findUnique({
      where: { id },
      include: { cores: { select: { corId: true } }, medidas: true },
    }),
    prisma.cor.findMany({ orderBy: { nome: "asc" }, select: { id: true, nome: true, hex: true } }),
    prisma.tamanho.findMany({ orderBy: { ordem: "asc" }, select: { id: true, nome: true } }),
  ]);
  if (!modelo) notFound();
  const { novo } = await searchParams;

  return (
    <div className="secao">
      <div className="mx-auto max-w-3xl">
        <p className="sobretitulo text-secundario">
          <Link href="/admin/modelos" className="hover:text-tinta">Modelos</Link>
        </p>
        <h1 className="titulo-destaque mt-4 break-words">{modelo.nome}</h1>

        <div className="mt-8 space-y-6">
          {novo === "1" && (
            <Aviso tipo="sucesso">Modelo criado. Agora escolha as cores e os tamanhos, com a tabela de medidas.</Aviso>
          )}

          <Painel titulo="Cores, tamanhos e medidas">
            <CoresETamanhosDoModelo
              modeloId={modelo.id}
              cores={cores}
              tamanhos={tamanhos}
              coresDoModelo={modelo.cores.map((c) => c.corId)}
              medidasDoModelo={modelo.medidas}
            />
          </Painel>

          <Painel titulo="Dados do modelo">
            <FormularioModelo
              id={modelo.id}
              valores={{
                nome: modelo.nome,
                ativo: modelo.ativo,
                pesoEmGramas: String(modelo.pesoEmGramas),
                larguraCm: String(modelo.larguraCm),
                alturaCm: String(modelo.alturaCm),
                comprimentoCm: String(modelo.comprimentoCm),
              }}
            />
          </Painel>
        </div>
      </div>
    </div>
  );
}
