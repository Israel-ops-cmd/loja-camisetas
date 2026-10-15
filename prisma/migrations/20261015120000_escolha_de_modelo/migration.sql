-- Escolha de modelo: preço de cada modelo dentro do produto, preços de
-- referência por modelo, foto por modelo e o nome do modelo no item do pedido.

-- AlterTable
ALTER TABLE "itens_pedido" ADD COLUMN     "nomeModelo" TEXT;

-- AlterTable
ALTER TABLE "modelos" ADD COLUMN     "precoReferenciaEstampadaEmCentavos" INTEGER,
ADD COLUMN     "precoReferenciaLisaEmCentavos" INTEGER;

-- AlterTable
ALTER TABLE "produto_imagens" ADD COLUMN     "modeloId" UUID;

-- CreateTable
CREATE TABLE "precos_dos_modelos" (
    "produtoId" UUID NOT NULL,
    "modeloId" UUID NOT NULL,
    "precoEmCentavos" INTEGER NOT NULL,

    CONSTRAINT "precos_dos_modelos_pkey" PRIMARY KEY ("produtoId","modeloId")
);

-- AddForeignKey
ALTER TABLE "precos_dos_modelos" ADD CONSTRAINT "precos_dos_modelos_produtoId_fkey" FOREIGN KEY ("produtoId") REFERENCES "produtos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "precos_dos_modelos" ADD CONSTRAINT "precos_dos_modelos_modeloId_fkey" FOREIGN KEY ("modeloId") REFERENCES "modelos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "produto_imagens" ADD CONSTRAINT "produto_imagens_modeloId_fkey" FOREIGN KEY ("modeloId") REFERENCES "modelos"("id") ON DELETE SET NULL ON UPDATE CASCADE;


-- Mesmas regras de acesso das outras tabelas: só o servidor (Prisma) lê e grava.
ALTER TABLE "precos_dos_modelos" ENABLE ROW LEVEL SECURITY;

-- Preços de referência do catálogo de lançamento (docs/catalogo-lancamento.md).
-- Baby Look e Infantil não têm camiseta lisa.
UPDATE "modelos" SET "precoReferenciaEstampadaEmCentavos" = 4990, "precoReferenciaLisaEmCentavos" = 2990 WHERE "slug" = 'tradicional';
UPDATE "modelos" SET "precoReferenciaEstampadaEmCentavos" = 4990 WHERE "slug" = 'baby-look';
UPDATE "modelos" SET "precoReferenciaEstampadaEmCentavos" = 6990, "precoReferenciaLisaEmCentavos" = 4490 WHERE "slug" = 'oversized';
UPDATE "modelos" SET "precoReferenciaEstampadaEmCentavos" = 8990, "precoReferenciaLisaEmCentavos" = 5990 WHERE "slug" = 'oversized-premium';
UPDATE "modelos" SET "precoReferenciaEstampadaEmCentavos" = 4490 WHERE "slug" = 'infantil';
