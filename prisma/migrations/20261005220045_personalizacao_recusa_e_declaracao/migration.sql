-- AlterEnum
ALTER TYPE "status_personalizacao" ADD VALUE 'RECUSADA';

-- AlterTable
ALTER TABLE "personalizacoes" ADD COLUMN     "declaracaoDireitosEm" TIMESTAMP(3),
ADD COLUMN     "motivoRecusa" TEXT;
