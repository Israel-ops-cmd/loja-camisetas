-- Modelos de peça (Tradicional, Baby Look, Oversized, Oversized Premium,
-- Infantil), com cores, tamanhos, tabela de medidas e pacote do frete.
-- Os dados de lançamento entram aqui para chegar também ao banco de produção.
-- Variações existentes passam para o modelo Tradicional.

-- CreateTable
CREATE TABLE "modelos" (
    "id" UUID NOT NULL,
    "nome" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "ordem" INTEGER NOT NULL DEFAULT 0,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "pesoEmGramas" INTEGER NOT NULL DEFAULT 300,
    "larguraCm" INTEGER NOT NULL DEFAULT 22,
    "alturaCm" INTEGER NOT NULL DEFAULT 4,
    "comprimentoCm" INTEGER NOT NULL DEFAULT 28,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "modelos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "modelo_cores" (
    "modeloId" UUID NOT NULL,
    "corId" UUID NOT NULL,

    CONSTRAINT "modelo_cores_pkey" PRIMARY KEY ("modeloId","corId")
);

-- CreateTable
CREATE TABLE "medidas_dos_modelos" (
    "modeloId" UUID NOT NULL,
    "tamanhoId" UUID NOT NULL,
    "comprimentoMm" INTEGER NOT NULL,
    "larguraMm" INTEGER NOT NULL,
    "mangaMm" INTEGER NOT NULL,

    CONSTRAINT "medidas_dos_modelos_pkey" PRIMARY KEY ("modeloId","tamanhoId")
);

-- CreateIndex
CREATE UNIQUE INDEX "modelos_nome_key" ON "modelos"("nome");

-- CreateIndex
CREATE UNIQUE INDEX "modelos_slug_key" ON "modelos"("slug");

-- AddForeignKey
ALTER TABLE "modelo_cores" ADD CONSTRAINT "modelo_cores_modeloId_fkey" FOREIGN KEY ("modeloId") REFERENCES "modelos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "modelo_cores" ADD CONSTRAINT "modelo_cores_corId_fkey" FOREIGN KEY ("corId") REFERENCES "cores"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "medidas_dos_modelos" ADD CONSTRAINT "medidas_dos_modelos_modeloId_fkey" FOREIGN KEY ("modeloId") REFERENCES "modelos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "medidas_dos_modelos" ADD CONSTRAINT "medidas_dos_modelos_tamanhoId_fkey" FOREIGN KEY ("tamanhoId") REFERENCES "tamanhos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Mesmas regras de acesso das outras tabelas: só o servidor (Prisma) lê e grava.
ALTER TABLE "modelos" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "modelo_cores" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "medidas_dos_modelos" ENABLE ROW LEVEL SECURITY;

-- ---------------------------------------------------------------- Dados de lançamento

-- Pacote: estimativa provisória de hoje (300 g, 28 × 22 × 4 cm) em todos.
INSERT INTO "modelos" ("id", "nome", "slug", "ordem", "atualizadoEm") VALUES
  (gen_random_uuid(), 'Tradicional', 'tradicional', 1, CURRENT_TIMESTAMP),
  (gen_random_uuid(), 'Baby Look', 'baby-look', 2, CURRENT_TIMESTAMP),
  (gen_random_uuid(), 'Oversized', 'oversized', 3, CURRENT_TIMESTAMP),
  (gen_random_uuid(), 'Oversized Premium', 'oversized-premium', 4, CURRENT_TIMESTAMP),
  (gen_random_uuid(), 'Infantil', 'infantil', 5, CURRENT_TIMESTAMP);

-- Cores novas (hex aproximado, ajustável depois). As que já existem ficam como estão.
INSERT INTO "cores" ("id", "nome", "hex") VALUES
  (gen_random_uuid(), 'Preta', '#141414'),
  (gen_random_uuid(), 'Branca', '#FFFFFF'),
  (gen_random_uuid(), 'Off-white', '#EDE8DC'),
  (gen_random_uuid(), 'Azul-marinho', '#1F2A44'),
  (gen_random_uuid(), 'Areia', '#D6C4A1'),
  (gen_random_uuid(), 'Mescla', '#A7A9AC'),
  (gen_random_uuid(), 'Militar', '#4B5320'),
  (gen_random_uuid(), 'Marrom', '#5C4033'),
  (gen_random_uuid(), 'Chumbo', '#4A4C4E'),
  (gen_random_uuid(), 'Bege', '#CDBB9C'),
  (gen_random_uuid(), 'Verde', '#5F7257'),
  (gen_random_uuid(), 'Azul', '#557A95')
ON CONFLICT ("nome") DO NOTHING;

-- Tamanhos infantis antes dos adultos.
INSERT INTO "tamanhos" ("id", "nome", "ordem") VALUES
  (gen_random_uuid(), 'P', 11),
  (gen_random_uuid(), 'M', 12),
  (gen_random_uuid(), 'G', 13),
  (gen_random_uuid(), 'GG', 14)
ON CONFLICT ("nome") DO UPDATE SET "ordem" = EXCLUDED."ordem";
INSERT INTO "tamanhos" ("id", "nome", "ordem") VALUES
  (gen_random_uuid(), '2', 1),
  (gen_random_uuid(), '4', 2),
  (gen_random_uuid(), '6', 3),
  (gen_random_uuid(), '8', 4),
  (gen_random_uuid(), '10', 5),
  (gen_random_uuid(), '12', 6),
  (gen_random_uuid(), '14', 7)
ON CONFLICT ("nome") DO NOTHING;

INSERT INTO "modelo_cores" ("modeloId", "corId")
SELECT m."id", c."id"
FROM (VALUES
  ('tradicional', 'Preta'), ('tradicional', 'Branca'), ('tradicional', 'Off-white'), ('tradicional', 'Areia'),
  ('tradicional', 'Azul-marinho'), ('tradicional', 'Mescla'), ('tradicional', 'Militar'),
  ('baby-look', 'Preta'), ('baby-look', 'Branca'), ('baby-look', 'Off-white'), ('baby-look', 'Areia'),
  ('baby-look', 'Azul-marinho'), ('baby-look', 'Mescla'),
  ('oversized', 'Preta'), ('oversized', 'Branca'), ('oversized', 'Off-white'), ('oversized', 'Marrom'),
  ('oversized', 'Azul-marinho'), ('oversized', 'Militar'),
  ('oversized-premium', 'Chumbo'), ('oversized-premium', 'Bege'), ('oversized-premium', 'Verde'), ('oversized-premium', 'Azul'),
  ('infantil', 'Preta'), ('infantil', 'Branca'), ('infantil', 'Off-white'), ('infantil', 'Areia'), ('infantil', 'Azul-marinho')
) AS v("modelo", "cor")
JOIN "modelos" m ON m."slug" = v."modelo"
JOIN "cores" c ON c."nome" = v."cor";

-- Comprimento, largura e manga, em milímetros.
INSERT INTO "medidas_dos_modelos" ("modeloId", "tamanhoId", "comprimentoMm", "larguraMm", "mangaMm")
SELECT m."id", t."id", v."comprimento", v."largura", v."manga"
FROM (VALUES
  ('tradicional', 'P', 650, 500, 160), ('tradicional', 'M', 680, 520, 180),
  ('tradicional', 'G', 700, 560, 180), ('tradicional', 'GG', 720, 580, 190),
  ('baby-look', 'P', 600, 460, 130), ('baby-look', 'M', 620, 490, 140),
  ('baby-look', 'G', 640, 520, 150), ('baby-look', 'GG', 660, 530, 160),
  ('oversized', 'P', 710, 520, 240), ('oversized', 'M', 730, 550, 250),
  ('oversized', 'G', 750, 580, 260), ('oversized', 'GG', 770, 610, 270),
  ('oversized-premium', 'P', 710, 520, 240), ('oversized-premium', 'M', 730, 550, 250),
  ('oversized-premium', 'G', 750, 580, 260), ('oversized-premium', 'GG', 770, 610, 270),
  ('infantil', '2', 430, 320, 110), ('infantil', '4', 460, 340, 115),
  ('infantil', '6', 490, 360, 120), ('infantil', '8', 520, 380, 125),
  ('infantil', '10', 550, 400, 130), ('infantil', '12', 580, 420, 135),
  ('infantil', '14', 610, 440, 140)
) AS v("modelo", "tamanho", "comprimento", "largura", "manga")
JOIN "modelos" m ON m."slug" = v."modelo"
JOIN "tamanhos" t ON t."nome" = v."tamanho";

-- ---------------------------------------------------------------- Variações

-- Todas as variações existentes são do modelo Tradicional.
ALTER TABLE "variacoes" ADD COLUMN "modeloId" UUID;
UPDATE "variacoes" SET "modeloId" = (SELECT "id" FROM "modelos" WHERE "slug" = 'tradicional');
ALTER TABLE "variacoes" ALTER COLUMN "modeloId" SET NOT NULL;

-- Se alguma cor ou tamanho já vendido não estava na lista do Tradicional,
-- entra nele para a variação continuar coerente (sem medida, a tabela não o mostra).
INSERT INTO "modelo_cores" ("modeloId", "corId")
SELECT DISTINCT v."modeloId", v."corId" FROM "variacoes" v
ON CONFLICT DO NOTHING;

DROP INDEX "variacoes_produtoId_corId_tamanhoId_key";
CREATE UNIQUE INDEX "variacoes_produtoId_modeloId_corId_tamanhoId_key" ON "variacoes"("produtoId", "modeloId", "corId", "tamanhoId");
CREATE INDEX "variacoes_modeloId_idx" ON "variacoes"("modeloId");
ALTER TABLE "variacoes" ADD CONSTRAINT "variacoes_modeloId_fkey" FOREIGN KEY ("modeloId") REFERENCES "modelos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- O pacote do frete passa a ser do modelo.
ALTER TABLE "produtos" DROP COLUMN "alturaCm",
DROP COLUMN "comprimentoCm",
DROP COLUMN "larguraCm",
DROP COLUMN "pesoEmGramas";
