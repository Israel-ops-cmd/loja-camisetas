// Dados de exemplo para desenvolvimento. Rode com `npm run db:seed`.
// Pode ser executado mais de uma vez: só cria o que ainda não existe.
//
// Preço de R$ 1,00 e estoque de 10 unidades são valores de teste,
// não os reais da loja. Saem do banco antes da publicação.

import { config } from "dotenv";
import { PrismaPg } from "@prisma/adapter-pg";

import { PrismaClient } from "../src/generated/prisma/client";

config({ path: ".env.local", quiet: true });

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DIRECT_URL }),
});

const PRECO_DE_TESTE_EM_CENTAVOS = 100;
const ESTOQUE_DE_TESTE = 10;

const categorias = [
  { slug: "basicas", nome: "Camisetas Básicas", ordem: 1 },
  { slug: "estampas-da-casa", nome: "Estampas da Casa", ordem: 2 },
  { slug: "personalizadas", nome: "Personalizadas", ordem: 3 },
  { slug: "atacado", nome: "Atacado", ordem: 4 },
];

// Cores aproximadas das fotos.
const cores = [
  { nome: "Azul-marinho", hex: "#1F2A44", codigo: "AZM" },
  { nome: "Branca", hex: "#FFFFFF", codigo: "BRA" },
  { nome: "Preta", hex: "#141414", codigo: "PRE" },
  { nome: "Off-white", hex: "#EDE8DC", codigo: "OFF" },
];

const tamanhos = ["P", "M", "G", "GG"];

// Tabela de desconto do atacado. PROVISÓRIA: confirmar com o pai do Israel
// antes de publicar (docs/pendencias.md). Depois de criada, a tabela é
// editada no banco (painel, etapa 12); o seed não sobrescreve valores existentes.
const FAIXAS_ATACADO_PROVISORIAS = [
  { minimoDePecas: 10, percentual: 5 },
  { minimoDePecas: 20, percentual: 10 },
  { minimoDePecas: 50, percentual: 15 },
];

const produtos = [
  {
    slug: "nao-temas-creia",
    codigo: "NTC",
    nome: "Não temas, creia",
    cor: "Azul-marinho",
    imagens: [
      {
        url: "/fotos/nao-temas-creia-casal.jpg",
        alt: "Casal com a camiseta azul-marinho “Não temas, creia”: frente e costas",
      },
      {
        url: "/fotos/nao-temas-creia-dobrada.jpg",
        alt: "Camiseta azul-marinho “Não temas, creia” dobrada, frente e costas lado a lado",
      },
    ],
  },
  {
    slug: "nao-me-envergonho-do-evangelho",
    codigo: "NME",
    nome: "Não me envergonho do evangelho",
    cor: "Branca",
    imagens: [
      {
        url: "/fotos/nao-me-envergonho-casal.jpg",
        alt: "Casal com a camiseta branca “Não me envergonho do evangelho”: frente com Romanos 1:16 e costas",
      },
    ],
  },
  {
    slug: "jesus-my-best-friend",
    codigo: "JMB",
    nome: "Jesus, my best friend",
    cor: "Preta",
    imagens: [
      {
        url: "/fotos/jesus-my-best-friend.jpg",
        alt: "Mulher com a camiseta preta “Jesus, my best friend”",
        enquadramento: "50% 45%",
      },
    ],
  },
  {
    slug: "o-justo-vive-pela-fe",
    codigo: "JVF",
    nome: "O justo vive pela fé",
    cor: "Off-white",
    imagens: [
      {
        url: "/fotos/o-justo-vive-pela-fe.jpg",
        alt: "Costas da camiseta off-white “O justo vive pela fé”, com a ilustração de uma Bíblia",
        enquadramento: "50% 42%",
      },
    ],
  },
];

// Camisetas lisas: categoria "Camisetas Básicas". Também são a peça base da
// personalização. Sem foto até haver fotos próprias.
const lisas = [
  {
    slug: "camiseta-lisa",
    codigo: "LIS",
    nome: "Camiseta lisa",
    cores: ["Branca", "Preta", "Azul-marinho", "Off-white"],
  },
];

async function main() {
  for (const categoria of categorias) {
    await prisma.categoria.upsert({
      where: { slug: categoria.slug },
      update: {},
      create: categoria,
    });
  }

  for (const { nome, hex } of cores) {
    await prisma.cor.upsert({ where: { nome }, update: {}, create: { nome, hex } });
  }

  for (const [ordem, nome] of tamanhos.entries()) {
    await prisma.tamanho.upsert({
      where: { nome },
      update: {},
      create: { nome, ordem: ordem + 1 },
    });
  }

  const estampas = await prisma.categoria.findUniqueOrThrow({
    where: { slug: "estampas-da-casa" },
  });

  for (const dados of produtos) {
    const cor = await prisma.cor.findUniqueOrThrow({ where: { nome: dados.cor } });
    const codigoCor = cores.find((c) => c.nome === dados.cor)!.codigo;

    const produto = await prisma.produto.upsert({
      where: { slug: dados.slug },
      update: {},
      create: {
        slug: dados.slug,
        nome: dados.nome,
        precoBaseEmCentavos: PRECO_DE_TESTE_EM_CENTAVOS,
        destaque: true,
        categoriaId: estampas.id,
        imagens: {
          create: dados.imagens.map((imagem, ordem) => ({
            ...imagem,
            ordem,
            corId: cor.id,
          })),
        },
      },
    });

    // Mantém o enquadramento em dia também nas imagens criadas por seeds anteriores.
    for (const imagem of dados.imagens) {
      await prisma.produtoImagem.updateMany({
        where: { produtoId: produto.id, url: imagem.url },
        data: { enquadramento: "enquadramento" in imagem ? imagem.enquadramento : null },
      });
    }

    for (const nomeTamanho of tamanhos) {
      const tamanho = await prisma.tamanho.findUniqueOrThrow({
        where: { nome: nomeTamanho },
      });
      const chave = {
        produtoId: produto.id,
        corId: cor.id,
        tamanhoId: tamanho.id,
      };

      const existente = await prisma.variacao.findUnique({
        where: { produtoId_corId_tamanhoId: chave },
      });
      if (existente) continue;

      // Estoque inicial entra junto com o registro no histórico.
      await prisma.variacao.create({
        data: {
          ...chave,
          sku: `CV-${dados.codigo}-${codigoCor}-${nomeTamanho}`,
          estoque: ESTOQUE_DE_TESTE,
          movimentacoes: {
            create: {
              quantidade: ESTOQUE_DE_TESTE,
              motivo: "ENTRADA",
              observacao: "Estoque inicial de teste (seed)",
            },
          },
        },
      });
    }
  }

  const basicas = await prisma.categoria.findUniqueOrThrow({
    where: { slug: "basicas" },
  });

  for (const dados of lisas) {
    const produto = await prisma.produto.upsert({
      where: { slug: dados.slug },
      update: {},
      create: {
        slug: dados.slug,
        nome: dados.nome,
        precoBaseEmCentavos: PRECO_DE_TESTE_EM_CENTAVOS,
        categoriaId: basicas.id,
      },
    });

    for (const nomeDaCor of dados.cores) {
      const cor = await prisma.cor.findUniqueOrThrow({ where: { nome: nomeDaCor } });
      const codigoCor = cores.find((c) => c.nome === nomeDaCor)!.codigo;

      for (const nomeTamanho of tamanhos) {
        const tamanho = await prisma.tamanho.findUniqueOrThrow({
          where: { nome: nomeTamanho },
        });
        const chave = { produtoId: produto.id, corId: cor.id, tamanhoId: tamanho.id };
        const existente = await prisma.variacao.findUnique({
          where: { produtoId_corId_tamanhoId: chave },
        });
        if (existente) continue;

        await prisma.variacao.create({
          data: {
            ...chave,
            sku: `CV-${dados.codigo}-${codigoCor}-${nomeTamanho}`,
            estoque: ESTOQUE_DE_TESTE,
            movimentacoes: {
              create: {
                quantidade: ESTOQUE_DE_TESTE,
                motivo: "ENTRADA",
                observacao: "Estoque inicial de teste (seed)",
              },
            },
          },
        });
      }
    }
  }

  for (const faixa of FAIXAS_ATACADO_PROVISORIAS) {
    await prisma.faixaAtacado.upsert({
      where: { minimoDePecas: faixa.minimoDePecas },
      update: {},
      create: faixa,
    });
  }

  const [nCategorias, nProdutos, nVariacoes, nImagens] = await Promise.all([
    prisma.categoria.count(),
    prisma.produto.count(),
    prisma.variacao.count(),
    prisma.produtoImagem.count(),
  ]);
  console.log(
    `Seed concluído: ${nCategorias} categorias, ${nProdutos} produtos, ${nVariacoes} variações, ${nImagens} imagens.`,
  );
}

main()
  .catch((erro) => {
    console.error(erro);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
