-- CreateEnum
CREATE TYPE "status_personalizacao" AS ENUM ('RECEBIDA', 'PREVIA_ENVIADA', 'AJUSTE_SOLICITADO', 'APROVADA', 'CONVERTIDA', 'CANCELADA');

-- CreateEnum
CREATE TYPE "posicao_estampa" AS ENUM ('FRENTE_PEITO', 'FRENTE_GRANDE', 'COSTAS');

-- CreateEnum
CREATE TYPE "tipo_arquivo_personalizacao" AS ENUM ('ARTE', 'PREVIA');

-- CreateEnum
CREATE TYPE "autor_mensagem" AS ENUM ('CLIENTE', 'LOJA');

-- CreateTable
CREATE TABLE "personalizacoes" (
    "id" UUID NOT NULL,
    "numero" SERIAL NOT NULL,
    "status" "status_personalizacao" NOT NULL DEFAULT 'RECEBIDA',
    "clienteId" UUID NOT NULL,
    "produtoId" UUID NOT NULL,
    "corId" UUID NOT NULL,
    "posicoes" "posicao_estampa"[],
    "descricao" TEXT,
    "prazoDesejado" DATE,
    "precoUnitarioEmCentavos" INTEGER,
    "pedidoId" UUID,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "personalizacoes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "personalizacao_itens" (
    "id" UUID NOT NULL,
    "quantidade" INTEGER NOT NULL,
    "personalizacaoId" UUID NOT NULL,
    "tamanhoId" UUID NOT NULL,

    CONSTRAINT "personalizacao_itens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "personalizacao_arquivos" (
    "id" UUID NOT NULL,
    "tipo" "tipo_arquivo_personalizacao" NOT NULL,
    "caminho" TEXT NOT NULL,
    "nomeOriginal" TEXT NOT NULL,
    "tamanhoBytes" INTEGER NOT NULL,
    "personalizacaoId" UUID NOT NULL,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "personalizacao_arquivos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "personalizacao_mensagens" (
    "id" UUID NOT NULL,
    "autor" "autor_mensagem" NOT NULL,
    "texto" TEXT NOT NULL,
    "personalizacaoId" UUID NOT NULL,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "personalizacao_mensagens_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "personalizacoes_numero_key" ON "personalizacoes"("numero");

-- CreateIndex
CREATE UNIQUE INDEX "personalizacoes_pedidoId_key" ON "personalizacoes"("pedidoId");

-- CreateIndex
CREATE INDEX "personalizacoes_clienteId_idx" ON "personalizacoes"("clienteId");

-- CreateIndex
CREATE INDEX "personalizacoes_status_idx" ON "personalizacoes"("status");

-- CreateIndex
CREATE UNIQUE INDEX "personalizacao_itens_personalizacaoId_tamanhoId_key" ON "personalizacao_itens"("personalizacaoId", "tamanhoId");

-- CreateIndex
CREATE UNIQUE INDEX "personalizacao_arquivos_caminho_key" ON "personalizacao_arquivos"("caminho");

-- CreateIndex
CREATE INDEX "personalizacao_arquivos_personalizacaoId_idx" ON "personalizacao_arquivos"("personalizacaoId");

-- CreateIndex
CREATE INDEX "personalizacao_mensagens_personalizacaoId_idx" ON "personalizacao_mensagens"("personalizacaoId");

-- AddForeignKey
ALTER TABLE "personalizacoes" ADD CONSTRAINT "personalizacoes_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "clientes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "personalizacoes" ADD CONSTRAINT "personalizacoes_produtoId_fkey" FOREIGN KEY ("produtoId") REFERENCES "produtos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "personalizacoes" ADD CONSTRAINT "personalizacoes_corId_fkey" FOREIGN KEY ("corId") REFERENCES "cores"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "personalizacoes" ADD CONSTRAINT "personalizacoes_pedidoId_fkey" FOREIGN KEY ("pedidoId") REFERENCES "pedidos"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "personalizacao_itens" ADD CONSTRAINT "personalizacao_itens_personalizacaoId_fkey" FOREIGN KEY ("personalizacaoId") REFERENCES "personalizacoes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "personalizacao_itens" ADD CONSTRAINT "personalizacao_itens_tamanhoId_fkey" FOREIGN KEY ("tamanhoId") REFERENCES "tamanhos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "personalizacao_arquivos" ADD CONSTRAINT "personalizacao_arquivos_personalizacaoId_fkey" FOREIGN KEY ("personalizacaoId") REFERENCES "personalizacoes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "personalizacao_mensagens" ADD CONSTRAINT "personalizacao_mensagens_personalizacaoId_fkey" FOREIGN KEY ("personalizacaoId") REFERENCES "personalizacoes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- RLS ligado e sem políticas: bloqueia a API de dados do Supabase.
-- O Prisma conecta como "postgres", que ignora RLS.
ALTER TABLE "personalizacoes" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "personalizacao_itens" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "personalizacao_arquivos" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "personalizacao_mensagens" ENABLE ROW LEVEL SECURITY;

-- Supabase Storage: pasta privada para artes e prévias (até 20 MB por arquivo).
-- Organização: "<id do cliente>/artes/..." e "<id do cliente>/previas/<id da personalização>/...".
-- Cliente: envia só para a própria pasta de artes e lê só a própria pasta
-- (onde também ficam as prévias dele). Administrador: envia e lê tudo.
-- Só roda onde o Storage existe (não existe no banco temporário do migrate dev).
DO $$
BEGIN
  IF to_regclass('storage.buckets') IS NOT NULL THEN
    INSERT INTO storage.buckets (id, name, public, file_size_limit)
    VALUES ('personalizacao', 'personalizacao', false, 20971520)
    ON CONFLICT (id) DO UPDATE SET public = false, file_size_limit = 20971520;

    CREATE POLICY "personalizacao_enviar" ON storage.objects
      FOR INSERT TO authenticated
      WITH CHECK (
        bucket_id = 'personalizacao' AND (
          ((storage.foldername(name))[1] = (SELECT auth.uid())::text AND (storage.foldername(name))[2] = 'artes')
          OR ((SELECT auth.jwt()) -> 'app_metadata' ->> 'papel') = 'admin'
        )
      );

    CREATE POLICY "personalizacao_ler" ON storage.objects
      FOR SELECT TO authenticated
      USING (
        bucket_id = 'personalizacao' AND (
          (storage.foldername(name))[1] = (SELECT auth.uid())::text
          OR ((SELECT auth.jwt()) -> 'app_metadata' ->> 'papel') = 'admin'
        )
      );
  END IF;
END $$;
