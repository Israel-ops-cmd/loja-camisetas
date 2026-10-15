-- AlterTable
ALTER TABLE "pedidos" ADD COLUMN     "canceladoEm" TIMESTAMP(3),
ADD COLUMN     "entregueEm" TIMESTAMP(3),
ADD COLUMN     "enviadoEm" TIMESTAMP(3),
ADD COLUMN     "motivoCancelamento" TEXT,
ADD COLUMN     "pagamentoConferidoEm" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "pedido_historico" (
    "id" UUID NOT NULL,
    "texto" TEXT NOT NULL,
    "autor" TEXT,
    "pedidoId" UUID NOT NULL,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "pedido_historico_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "pedido_historico_pedidoId_idx" ON "pedido_historico"("pedidoId");

-- AddForeignKey
ALTER TABLE "pedido_historico" ADD CONSTRAINT "pedido_historico_pedidoId_fkey" FOREIGN KEY ("pedidoId") REFERENCES "pedidos"("id") ON DELETE CASCADE ON UPDATE CASCADE;


-- Como as outras tabelas: RLS ligado e sem regras, só o servidor (Prisma) acessa.
ALTER TABLE "pedido_historico" ENABLE ROW LEVEL SECURITY;
