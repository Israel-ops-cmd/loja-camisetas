-- Categoria da Coleção Carta Viva (as 8 estampas próprias da marca). O
-- importador do catálogo move as estampas da coleção para ela.
INSERT INTO "categorias" ("id", "nome", "slug", "ordem")
VALUES (gen_random_uuid(), 'Coleção Carta Viva', 'colecao-carta-viva', 0)
ON CONFLICT ("slug") DO NOTHING;
