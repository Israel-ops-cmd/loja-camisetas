-- CreateEnum
CREATE TYPE "motivo_movimentacao" AS ENUM ('ENTRADA', 'VENDA', 'AJUSTE', 'CANCELAMENTO');

-- CreateEnum
CREATE TYPE "status_pedido" AS ENUM ('AGUARDANDO_PAGAMENTO', 'PAGO', 'EM_SEPARACAO', 'ENVIADO', 'ENTREGUE', 'CANCELADO');

-- CreateTable
CREATE TABLE "categorias" (
    "id" UUID NOT NULL,
    "nome" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "ordem" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "categorias_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "produtos" (
    "id" UUID NOT NULL,
    "nome" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "descricao" TEXT,
    "precoBaseEmCentavos" INTEGER NOT NULL,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "destaque" BOOLEAN NOT NULL DEFAULT false,
    "categoriaId" UUID NOT NULL,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "produtos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cores" (
    "id" UUID NOT NULL,
    "nome" TEXT NOT NULL,
    "hex" TEXT NOT NULL,

    CONSTRAINT "cores_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tamanhos" (
    "id" UUID NOT NULL,
    "nome" TEXT NOT NULL,
    "ordem" INTEGER NOT NULL,

    CONSTRAINT "tamanhos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "variacoes" (
    "id" UUID NOT NULL,
    "sku" TEXT NOT NULL,
    "estoque" INTEGER NOT NULL DEFAULT 0,
    "precoEmCentavos" INTEGER,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "produtoId" UUID NOT NULL,
    "corId" UUID NOT NULL,
    "tamanhoId" UUID NOT NULL,

    CONSTRAINT "variacoes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "produto_imagens" (
    "id" UUID NOT NULL,
    "url" TEXT NOT NULL,
    "alt" TEXT NOT NULL,
    "ordem" INTEGER NOT NULL DEFAULT 0,
    "produtoId" UUID NOT NULL,
    "corId" UUID,

    CONSTRAINT "produto_imagens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "movimentacoes_estoque" (
    "id" UUID NOT NULL,
    "quantidade" INTEGER NOT NULL,
    "motivo" "motivo_movimentacao" NOT NULL,
    "observacao" TEXT,
    "variacaoId" UUID NOT NULL,
    "pedidoId" UUID,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "movimentacoes_estoque_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "clientes" (
    "id" UUID NOT NULL,
    "nome" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "telefone" TEXT,
    "cpf" TEXT,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "clientes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "enderecos" (
    "id" UUID NOT NULL,
    "destinatario" TEXT NOT NULL,
    "cep" TEXT NOT NULL,
    "logradouro" TEXT NOT NULL,
    "numero" TEXT NOT NULL,
    "complemento" TEXT,
    "bairro" TEXT NOT NULL,
    "cidade" TEXT NOT NULL,
    "uf" CHAR(2) NOT NULL,
    "principal" BOOLEAN NOT NULL DEFAULT false,
    "clienteId" UUID NOT NULL,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "enderecos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pedidos" (
    "id" UUID NOT NULL,
    "numero" SERIAL NOT NULL,
    "status" "status_pedido" NOT NULL DEFAULT 'AGUARDANDO_PAGAMENTO',
    "clienteId" UUID NOT NULL,
    "subtotalEmCentavos" INTEGER NOT NULL,
    "freteEmCentavos" INTEGER NOT NULL,
    "descontoEmCentavos" INTEGER NOT NULL DEFAULT 0,
    "totalEmCentavos" INTEGER NOT NULL,
    "entregaDestinatario" TEXT NOT NULL,
    "entregaCep" TEXT NOT NULL,
    "entregaLogradouro" TEXT NOT NULL,
    "entregaNumero" TEXT NOT NULL,
    "entregaComplemento" TEXT,
    "entregaBairro" TEXT NOT NULL,
    "entregaCidade" TEXT NOT NULL,
    "entregaUf" CHAR(2) NOT NULL,
    "freteServico" TEXT,
    "fretePrazoDias" INTEGER,
    "melhorEnvioEtiquetaId" TEXT,
    "codigoRastreio" TEXT,
    "mercadoPagoPreferenciaId" TEXT,
    "mercadoPagoPagamentoId" TEXT,
    "metodoPagamento" TEXT,
    "pagoEm" TIMESTAMP(3),
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pedidos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "itens_pedido" (
    "id" UUID NOT NULL,
    "quantidade" INTEGER NOT NULL,
    "precoUnitarioEmCentavos" INTEGER NOT NULL,
    "nomeProduto" TEXT NOT NULL,
    "nomeCor" TEXT NOT NULL,
    "nomeTamanho" TEXT NOT NULL,
    "sku" TEXT NOT NULL,
    "pedidoId" UUID NOT NULL,
    "variacaoId" UUID NOT NULL,

    CONSTRAINT "itens_pedido_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "categorias_slug_key" ON "categorias"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "produtos_slug_key" ON "produtos"("slug");

-- CreateIndex
CREATE INDEX "produtos_categoriaId_idx" ON "produtos"("categoriaId");

-- CreateIndex
CREATE UNIQUE INDEX "cores_nome_key" ON "cores"("nome");

-- CreateIndex
CREATE UNIQUE INDEX "tamanhos_nome_key" ON "tamanhos"("nome");

-- CreateIndex
CREATE UNIQUE INDEX "variacoes_sku_key" ON "variacoes"("sku");

-- CreateIndex
CREATE UNIQUE INDEX "variacoes_produtoId_corId_tamanhoId_key" ON "variacoes"("produtoId", "corId", "tamanhoId");

-- CreateIndex
CREATE INDEX "produto_imagens_produtoId_idx" ON "produto_imagens"("produtoId");

-- CreateIndex
CREATE INDEX "movimentacoes_estoque_variacaoId_idx" ON "movimentacoes_estoque"("variacaoId");

-- CreateIndex
CREATE UNIQUE INDEX "movimentacoes_estoque_pedidoId_variacaoId_motivo_key" ON "movimentacoes_estoque"("pedidoId", "variacaoId", "motivo");

-- CreateIndex
CREATE UNIQUE INDEX "clientes_email_key" ON "clientes"("email");

-- CreateIndex
CREATE INDEX "enderecos_clienteId_idx" ON "enderecos"("clienteId");

-- CreateIndex
CREATE UNIQUE INDEX "pedidos_numero_key" ON "pedidos"("numero");

-- CreateIndex
CREATE UNIQUE INDEX "pedidos_mercadoPagoPagamentoId_key" ON "pedidos"("mercadoPagoPagamentoId");

-- CreateIndex
CREATE INDEX "pedidos_clienteId_idx" ON "pedidos"("clienteId");

-- CreateIndex
CREATE INDEX "pedidos_status_idx" ON "pedidos"("status");

-- CreateIndex
CREATE INDEX "itens_pedido_pedidoId_idx" ON "itens_pedido"("pedidoId");

-- AddForeignKey
ALTER TABLE "produtos" ADD CONSTRAINT "produtos_categoriaId_fkey" FOREIGN KEY ("categoriaId") REFERENCES "categorias"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "variacoes" ADD CONSTRAINT "variacoes_produtoId_fkey" FOREIGN KEY ("produtoId") REFERENCES "produtos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "variacoes" ADD CONSTRAINT "variacoes_corId_fkey" FOREIGN KEY ("corId") REFERENCES "cores"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "variacoes" ADD CONSTRAINT "variacoes_tamanhoId_fkey" FOREIGN KEY ("tamanhoId") REFERENCES "tamanhos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "produto_imagens" ADD CONSTRAINT "produto_imagens_produtoId_fkey" FOREIGN KEY ("produtoId") REFERENCES "produtos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "produto_imagens" ADD CONSTRAINT "produto_imagens_corId_fkey" FOREIGN KEY ("corId") REFERENCES "cores"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "movimentacoes_estoque" ADD CONSTRAINT "movimentacoes_estoque_variacaoId_fkey" FOREIGN KEY ("variacaoId") REFERENCES "variacoes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "movimentacoes_estoque" ADD CONSTRAINT "movimentacoes_estoque_pedidoId_fkey" FOREIGN KEY ("pedidoId") REFERENCES "pedidos"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "enderecos" ADD CONSTRAINT "enderecos_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "clientes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pedidos" ADD CONSTRAINT "pedidos_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "clientes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "itens_pedido" ADD CONSTRAINT "itens_pedido_pedidoId_fkey" FOREIGN KEY ("pedidoId") REFERENCES "pedidos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "itens_pedido" ADD CONSTRAINT "itens_pedido_variacaoId_fkey" FOREIGN KEY ("variacaoId") REFERENCES "variacoes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Números de pedido começam em 1001 (#1001, #1002...).
ALTER SEQUENCE "pedidos_numero_seq" RESTART WITH 1001;

-- Supabase: as tabelas do schema "public" ficam expostas pela API de dados
-- (chave anônima). RLS ligado e sem políticas bloqueia esse acesso. O Prisma
-- conecta como "postgres", que ignora RLS, então a aplicação não é afetada.
ALTER TABLE "categorias" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "produtos" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "cores" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "tamanhos" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "variacoes" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "produto_imagens" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "movimentacoes_estoque" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "clientes" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "enderecos" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "pedidos" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "itens_pedido" ENABLE ROW LEVEL SECURITY;

-- A tabela de controle do Prisma também fica em "public". Ela não existe no
-- banco temporário (shadow) usado pelo "migrate dev", daí a verificação.
DO $$
BEGIN
  IF to_regclass('"_prisma_migrations"') IS NOT NULL THEN
    ALTER TABLE "_prisma_migrations" ENABLE ROW LEVEL SECURITY;
  END IF;
END $$;
