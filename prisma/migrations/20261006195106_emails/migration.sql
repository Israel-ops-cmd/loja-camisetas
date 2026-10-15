-- CreateEnum
CREATE TYPE "tipo_email" AS ENUM ('PAGAMENTO_APROVADO', 'PEDIDO_ENVIADO', 'PEDIDO_CANCELADO', 'LEMBRETE_PAGAMENTO', 'PREVIA_PRONTA', 'PERSONALIZACAO_RECUSADA', 'PERSONALIZACAO_RECEBIDA', 'ORCAMENTO_RECEBIDO', 'LOJA_PEDIDO_PAGO', 'LOJA_ALERTA', 'LOJA_NOVA_PERSONALIZACAO', 'LOJA_AJUSTE_SOLICITADO', 'LOJA_NOVO_ORCAMENTO');

-- CreateEnum
CREATE TYPE "status_email" AS ENUM ('PENDENTE', 'ENVIADO', 'FALHOU');

-- CreateTable
CREATE TABLE "emails" (
    "id" UUID NOT NULL,
    "tipo" "tipo_email" NOT NULL,
    "chave" TEXT NOT NULL,
    "destinatario" TEXT NOT NULL,
    "assunto" TEXT NOT NULL,
    "html" TEXT NOT NULL,
    "texto" TEXT NOT NULL,
    "status" "status_email" NOT NULL DEFAULT 'PENDENTE',
    "tentativas" INTEGER NOT NULL DEFAULT 0,
    "erro" TEXT,
    "idNoServico" TEXT,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "enviadoEm" TIMESTAMP(3),

    CONSTRAINT "emails_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "emails_chave_key" ON "emails"("chave");

-- CreateIndex
CREATE INDEX "emails_status_criadoEm_idx" ON "emails"("status", "criadoEm");


-- Como as outras tabelas: RLS ligado e sem regras, só o servidor (Prisma) acessa.
ALTER TABLE "emails" ENABLE ROW LEVEL SECURITY;
