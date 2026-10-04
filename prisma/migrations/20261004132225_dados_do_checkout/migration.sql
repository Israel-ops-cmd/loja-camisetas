-- AlterTable
ALTER TABLE "pedidos" ADD COLUMN     "chaveIdempotencia" UUID,
ADD COLUMN     "compradorCpf" TEXT NOT NULL,
ADD COLUMN     "compradorEmail" TEXT NOT NULL,
ADD COLUMN     "compradorNome" TEXT NOT NULL,
ADD COLUMN     "compradorTelefone" TEXT NOT NULL,
ADD COLUMN     "fretePrazoMinimoDias" INTEGER,
ADD COLUMN     "freteServicoId" INTEGER,
ADD COLUMN     "freteTransportadora" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "pedidos_chaveIdempotencia_key" ON "pedidos"("chaveIdempotencia");
