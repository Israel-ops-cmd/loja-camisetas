-- CreateEnum
CREATE TYPE "status_orcamento" AS ENUM ('NOVO', 'EM_CONTATO', 'FECHADO', 'SEM_RETORNO');

-- CreateEnum
CREATE TYPE "tipo_de_peca_orcamento" AS ENUM ('LISA', 'ESTAMPA_DA_CASA', 'PERSONALIZADA', 'NAO_SEI');

-- AlterTable
ALTER TABLE "pedidos" ADD COLUMN     "descontoPercentual" INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "faixas_atacado" (
    "id" UUID NOT NULL,
    "minimoDePecas" INTEGER NOT NULL,
    "percentual" INTEGER NOT NULL,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "faixas_atacado_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "orcamentos" (
    "id" UUID NOT NULL,
    "numero" SERIAL NOT NULL,
    "status" "status_orcamento" NOT NULL DEFAULT 'NOVO',
    "nome" TEXT NOT NULL,
    "empresa" TEXT,
    "email" TEXT NOT NULL,
    "telefone" TEXT NOT NULL,
    "cidade" TEXT NOT NULL,
    "uf" CHAR(2) NOT NULL,
    "tipoDePeca" "tipo_de_peca_orcamento" NOT NULL,
    "quantidade" INTEGER NOT NULL,
    "prazoDesejado" DATE,
    "mensagem" TEXT,
    "anotacoes" TEXT,
    "ipHash" TEXT,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "orcamentos_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "faixas_atacado_minimoDePecas_key" ON "faixas_atacado"("minimoDePecas");

-- CreateIndex
CREATE UNIQUE INDEX "orcamentos_numero_key" ON "orcamentos"("numero");

-- CreateIndex
CREATE INDEX "orcamentos_status_idx" ON "orcamentos"("status");

-- CreateIndex
CREATE INDEX "orcamentos_ipHash_criadoEm_idx" ON "orcamentos"("ipHash", "criadoEm");

-- RLS ligado e sem políticas: bloqueia a API de dados do Supabase.
ALTER TABLE "faixas_atacado" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "orcamentos" ENABLE ROW LEVEL SECURITY;
