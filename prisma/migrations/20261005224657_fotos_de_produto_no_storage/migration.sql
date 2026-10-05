-- AlterTable
ALTER TABLE "produto_imagens" ADD COLUMN     "caminhoNoStorage" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "produto_imagens_caminhoNoStorage_key" ON "produto_imagens"("caminhoNoStorage");

-- Supabase Storage: pasta PÚBLICA para as fotos dos produtos (qualquer pessoa
-- vê a foto pelo link; só o administrador envia e apaga). Separada da pasta
-- privada "personalizacao". Até 10 MB, só JPG, PNG e WebP.
DO $$
BEGIN
  IF to_regclass('storage.buckets') IS NOT NULL THEN
    INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
    VALUES ('produtos', 'produtos', true, 10485760, ARRAY['image/jpeg', 'image/png', 'image/webp'])
    ON CONFLICT (id) DO UPDATE SET
      public = true,
      file_size_limit = 10485760,
      allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp'];

    CREATE POLICY "produtos_enviar" ON storage.objects
      FOR INSERT TO authenticated
      WITH CHECK (
        bucket_id = 'produtos'
        AND ((SELECT auth.jwt()) -> 'app_metadata' ->> 'papel') = 'admin'
      );

    CREATE POLICY "produtos_apagar" ON storage.objects
      FOR DELETE TO authenticated
      USING (
        bucket_id = 'produtos'
        AND ((SELECT auth.jwt()) -> 'app_metadata' ->> 'papel') = 'admin'
      );
  END IF;
END $$;
