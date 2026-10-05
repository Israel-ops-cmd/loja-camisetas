-- Só o administrador apaga arquivos da pasta "personalizacao" (limpeza de
-- testes, de envios abandonados e de pedidos cancelados). O Supabase não
-- permite apagar direto pela tabela: precisa ser pela API do Storage.
DO $$
BEGIN
  IF to_regclass('storage.buckets') IS NOT NULL THEN
    CREATE POLICY "personalizacao_apagar" ON storage.objects
      FOR DELETE TO authenticated
      USING (
        bucket_id = 'personalizacao'
        AND ((SELECT auth.jwt()) -> 'app_metadata' ->> 'papel') = 'admin'
      );
  END IF;
END $$;
