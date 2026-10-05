-- O Storage só apaga arquivos que o usuário também consegue ler pela API
-- (o link público não conta). Sem esta regra, "remover" não apaga nada.
DO $$
BEGIN
  IF to_regclass('storage.buckets') IS NOT NULL THEN
    CREATE POLICY "produtos_ler_admin" ON storage.objects
      FOR SELECT TO authenticated
      USING (
        bucket_id = 'produtos'
        AND ((SELECT auth.jwt()) -> 'app_metadata' ->> 'papel') = 'admin'
      );
  END IF;
END $$;
