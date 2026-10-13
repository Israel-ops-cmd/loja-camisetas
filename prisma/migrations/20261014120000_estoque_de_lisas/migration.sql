-- Estoque de peças lisas por modelo + cor + tamanho. Nas artes, o estoque da
-- variação passa a ser o de peças prontas; o estoque das camisetas lisas
-- (categoria Camisetas Básicas) passa para as peças lisas.

-- AlterEnum
ALTER TYPE "motivo_movimentacao" ADD VALUE IF NOT EXISTS 'ESTAMPA';

-- CreateTable
CREATE TABLE "pecas_lisas" (
    "id" UUID NOT NULL,
    "modeloId" UUID NOT NULL,
    "corId" UUID NOT NULL,
    "tamanhoId" UUID NOT NULL,
    "estoque" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "pecas_lisas_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "pecas_lisas_modeloId_corId_tamanhoId_key" ON "pecas_lisas"("modeloId", "corId", "tamanhoId");

-- AddForeignKey
ALTER TABLE "pecas_lisas" ADD CONSTRAINT "pecas_lisas_modeloId_fkey" FOREIGN KEY ("modeloId") REFERENCES "modelos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "pecas_lisas" ADD CONSTRAINT "pecas_lisas_corId_fkey" FOREIGN KEY ("corId") REFERENCES "cores"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "pecas_lisas" ADD CONSTRAINT "pecas_lisas_tamanhoId_fkey" FOREIGN KEY ("tamanhoId") REFERENCES "tamanhos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Mesmas regras de acesso das outras tabelas: só o servidor (Prisma) lê e grava.
ALTER TABLE "pecas_lisas" ENABLE ROW LEVEL SECURITY;

-- Uma peça lisa para cada cor e tamanho de cada modelo, e para cada
-- combinação já usada em alguma variação.
INSERT INTO "pecas_lisas" ("id", "modeloId", "corId", "tamanhoId")
SELECT gen_random_uuid(), mc."modeloId", mc."corId", md."tamanhoId"
FROM "modelo_cores" mc
JOIN "medidas_dos_modelos" md ON md."modeloId" = mc."modeloId"
ON CONFLICT DO NOTHING;
INSERT INTO "pecas_lisas" ("id", "modeloId", "corId", "tamanhoId")
SELECT gen_random_uuid(), v."modeloId", v."corId", v."tamanhoId"
FROM (SELECT DISTINCT "modeloId", "corId", "tamanhoId" FROM "variacoes") v
ON CONFLICT DO NOTHING;

-- AddForeignKey
ALTER TABLE "variacoes" ADD CONSTRAINT "variacoes_modeloId_corId_tamanhoId_fkey" FOREIGN KEY ("modeloId", "corId", "tamanhoId") REFERENCES "pecas_lisas"("modeloId", "corId", "tamanhoId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- ---------------------------------------------------------------- Histórico

ALTER TABLE "movimentacoes_estoque" ADD COLUMN "pecaLisaId" UUID,
ALTER COLUMN "variacaoId" DROP NOT NULL;
ALTER TABLE "movimentacoes_estoque" ADD CONSTRAINT "movimentacoes_estoque_pecaLisaId_fkey" FOREIGN KEY ("pecaLisaId") REFERENCES "pecas_lisas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
-- Cada linha é de uma peça pronta (variação) ou de uma peça lisa, nunca das duas.
ALTER TABLE "movimentacoes_estoque" ADD CONSTRAINT "movimentacoes_estoque_uma_peca" CHECK (num_nonnulls("variacaoId", "pecaLisaId") = 1);

CREATE INDEX "movimentacoes_estoque_pecaLisaId_idx" ON "movimentacoes_estoque"("pecaLisaId");
CREATE UNIQUE INDEX "movimentacoes_estoque_pedidoId_pecaLisaId_motivo_key" ON "movimentacoes_estoque"("pedidoId", "pecaLisaId", "motivo");

-- ---------------------------------------------------------------- Camisetas lisas

-- O estoque das variações da categoria Camisetas Básicas passa para as peças
-- lisas, com o registro no histórico dos dois lados.
CREATE TABLE "_lisas_vindas" AS
SELECT v."id" AS "variacaoId", v."estoque", p."id" AS "pecaLisaId"
FROM "variacoes" v
JOIN "produtos" pr ON pr."id" = v."produtoId"
JOIN "categorias" c ON c."id" = pr."categoriaId"
JOIN "pecas_lisas" p ON p."modeloId" = v."modeloId" AND p."corId" = v."corId" AND p."tamanhoId" = v."tamanhoId"
WHERE c."slug" = 'basicas' AND v."estoque" <> 0;

INSERT INTO "movimentacoes_estoque" ("id", "quantidade", "motivo", "observacao", "variacaoId")
SELECT gen_random_uuid(), -"estoque", 'AJUSTE', 'Passou para o estoque de peças lisas', "variacaoId" FROM "_lisas_vindas";

INSERT INTO "movimentacoes_estoque" ("id", "quantidade", "motivo", "observacao", "pecaLisaId")
SELECT gen_random_uuid(), SUM("estoque"), 'ENTRADA', 'Estoque que estava na camiseta lisa', "pecaLisaId"
FROM "_lisas_vindas" GROUP BY "pecaLisaId";

UPDATE "pecas_lisas" p SET "estoque" = p."estoque" + s."total"
FROM (SELECT "pecaLisaId", SUM("estoque") AS "total" FROM "_lisas_vindas" GROUP BY "pecaLisaId") s
WHERE s."pecaLisaId" = p."id";

UPDATE "variacoes" SET "estoque" = 0 WHERE "id" IN (SELECT "variacaoId" FROM "_lisas_vindas");
DROP TABLE "_lisas_vindas";

-- ---------------------------------------------------------------- Itens de pedido

ALTER TABLE "itens_pedido" ADD COLUMN "estampadoEm" TIMESTAMP(3),
ADD COLUMN "estampar" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "quantidadeDaLisa" INTEGER NOT NULL DEFAULT 0;

-- Pedidos já pagos de camiseta lisa e de personalização: a peça saiu do
-- estoque que agora é o de lisas. As personalizações já enviadas contam como
-- estampadas.
UPDATE "itens_pedido" i SET
  "quantidadeDaLisa" = i."quantidade",
  "estampar" = (pe."id" IS NOT NULL),
  "estampadoEm" = CASE WHEN pe."id" IS NOT NULL THEN pd."enviadoEm" END
FROM "pedidos" pd
LEFT JOIN "personalizacoes" pe ON pe."pedidoId" = pd."id"
WHERE pd."id" = i."pedidoId"
  AND EXISTS (SELECT 1 FROM "movimentacoes_estoque" m WHERE m."pedidoId" = pd."id" AND m."motivo" = 'VENDA')
  AND (
    pe."id" IS NOT NULL
    OR EXISTS (
      SELECT 1 FROM "variacoes" v
      JOIN "produtos" pr ON pr."id" = v."produtoId"
      JOIN "categorias" c ON c."id" = pr."categoriaId"
      WHERE v."id" = i."variacaoId" AND c."slug" = 'basicas'
    )
  );

-- ---------------------------------------------------------------- Personalização

-- As personalizações existentes são do modelo Tradicional.
ALTER TABLE "personalizacoes" ADD COLUMN "modeloId" UUID;
UPDATE "personalizacoes" SET "modeloId" = (SELECT "id" FROM "modelos" WHERE "slug" = 'tradicional');
ALTER TABLE "personalizacoes" ALTER COLUMN "modeloId" SET NOT NULL;
ALTER TABLE "personalizacoes" ADD CONSTRAINT "personalizacoes_modeloId_fkey" FOREIGN KEY ("modeloId") REFERENCES "modelos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
