"use server";

import { redirect } from "next/navigation";
import { z } from "zod";

import { Prisma } from "@/generated/prisma/client";
import { obterUsuario } from "@/lib/auth";
import { gravarItensDoCarrinho, obterCarrinho } from "@/lib/carrinho";
import { buscarCep, normalizarCep, type EnderecoDoCep } from "@/lib/cep";
import { cotarFreteDoCarrinho, type CotacaoDoCarrinho } from "@/lib/frete";
import { prisma } from "@/lib/prisma";
import {
  apenasDigitos,
  cpfValido,
  telefoneValido,
  UFS,
} from "@/lib/validacao-br";

// Server Actions são endpoints públicos. Nada do que vem do navegador é
// confiado: carrinho, estoque, preços e frete são recalculados aqui.

export async function buscarEnderecoPorCep(
  cep: unknown,
): Promise<{ ok: true; endereco: EnderecoDoCep } | { ok: false; erro: string }> {
  const cepNormalizado = normalizarCep(cep);
  if (!cepNormalizado) return { ok: false, erro: "Digite um CEP com 8 números." };

  try {
    const endereco = await buscarCep(cepNormalizado);
    if (!endereco) return { ok: false, erro: "Esse CEP não existe. Confira o número." };
    return { ok: true, endereco };
  } catch {
    return {
      ok: false,
      erro: "Não conseguimos buscar o CEP agora. Preencha o endereço à mão.",
    };
  }
}

export async function cotarFreteDoCheckout(
  cep: unknown,
): Promise<CotacaoDoCarrinho | { ok: false; cep: string; erro: string }> {
  const cepNormalizado = normalizarCep(cep);
  if (!cepNormalizado) {
    return { ok: false, cep: "", erro: "Digite um CEP com 8 números." };
  }
  const carrinho = await obterCarrinho();
  return cotarFreteDoCarrinho(carrinho, cepNormalizado, null);
}

// ---------------------------------------------------------------- Finalizar

const texto = (maximo: number, mensagem: string) =>
  z.string().trim().min(1, mensagem).max(maximo, "Texto longo demais.");

const esquemaNovoEndereco = z.object({
  destinatario: texto(100, "Informe quem vai receber."),
  cep: z.string().refine((v) => normalizarCep(v) !== null, "Digite um CEP com 8 números."),
  logradouro: texto(200, "Informe a rua."),
  numero: texto(20, "Informe o número (ou S/N)."),
  complemento: z.string().trim().max(100, "Texto longo demais.").optional(),
  bairro: texto(100, "Informe o bairro."),
  cidade: texto(100, "Informe a cidade."),
  uf: z.enum(UFS, "Escolha o estado."),
  salvar: z.boolean(),
});

const esquemaPedido = z.object({
  chave: z.uuid(),
  enderecoId: z.uuid().optional(),
  novoEndereco: esquemaNovoEndereco.optional(),
  servicoId: z.number().int().positive("Escolha a entrega."),
  cpf: z.string().refine(cpfValido, "CPF inválido. Confira os números."),
  telefone: z.string().refine(telefoneValido, "Telefone inválido. Use DDD + número."),
});

export type DadosDoPedido = z.input<typeof esquemaPedido>;

export type ResultadoDoPedido = {
  erro: string;
  campos?: Record<string, string>;
  /** O carrinho mudou (estoque, item indisponível): o cliente precisa revisar. */
  revisarCarrinho?: boolean;
  /** O frete mudou: as opções devem ser recotadas. */
  recotarFrete?: boolean;
};

function errosPorCampo(erro: z.ZodError) {
  const campos: Record<string, string> = {};
  for (const problema of erro.issues) {
    const campo = problema.path.join(".");
    campos[campo] ??= problema.message;
  }
  return campos;
}

export async function finalizarPedido(
  dados: unknown,
): Promise<ResultadoDoPedido> {
  const usuario = await obterUsuario();
  if (!usuario) {
    return { erro: "Sua sessão expirou. Entre de novo para finalizar." };
  }

  const validacao = esquemaPedido.safeParse(dados);
  if (!validacao.success) {
    return {
      erro: "Confira os campos destacados.",
      campos: errosPorCampo(validacao.error),
    };
  }
  const pedidoValidado = validacao.data;

  // Clique duplo ou reenvio: devolve o pedido já criado com essa chave.
  const existente = await prisma.pedido.findUnique({
    where: { chaveIdempotencia: pedidoValidado.chave },
    select: { numero: true, clienteId: true },
  });
  if (existente) {
    if (existente.clienteId !== usuario.id) {
      return { erro: "Não foi possível finalizar. Recarregue a página." };
    }
    redirect(`/pedidos/${existente.numero}?novo=1`);
  }

  // Carrinho conferido de novo no banco.
  const carrinho = await obterCarrinho();
  if (carrinho.itens.length === 0) {
    return { erro: "Seu carrinho está vazio.", revisarCarrinho: true };
  }
  if (carrinho.precisaSincronizar || carrinho.itens.some((i) => i.esgotado)) {
    return {
      erro: "Algum item do carrinho mudou de estoque ou saiu da loja. Revise o carrinho antes de finalizar.",
      revisarCarrinho: true,
    };
  }

  // Endereço: um salvo (precisa ser do próprio cliente) ou um novo.
  let endereco: z.infer<typeof esquemaNovoEndereco>;
  if (pedidoValidado.enderecoId) {
    const salvo = await prisma.endereco.findFirst({
      where: { id: pedidoValidado.enderecoId, clienteId: usuario.id },
    });
    if (!salvo) return { erro: "Escolha um endereço de entrega." };
    endereco = {
      destinatario: salvo.destinatario,
      cep: salvo.cep,
      logradouro: salvo.logradouro,
      numero: salvo.numero,
      complemento: salvo.complemento ?? undefined,
      bairro: salvo.bairro,
      cidade: salvo.cidade,
      uf: salvo.uf as (typeof UFS)[number],
      salvar: false,
    };
  } else if (pedidoValidado.novoEndereco) {
    endereco = pedidoValidado.novoEndereco;
  } else {
    return { erro: "Escolha um endereço de entrega." };
  }
  const cep = normalizarCep(endereco.cep)!;

  // Frete recotado aqui: o preço nunca vem do navegador.
  const cotacao = await cotarFreteDoCarrinho(carrinho, cep, pedidoValidado.servicoId);
  if (!cotacao.ok) return { erro: cotacao.erro, recotarFrete: true };
  if (cotacao.escolhida.servicoId !== pedidoValidado.servicoId) {
    return {
      erro: "A opção de entrega escolhida não está mais disponível para esse CEP. Escolha outra.",
      recotarFrete: true,
    };
  }
  const frete = cotacao.escolhida;

  const cpf = apenasDigitos(pedidoValidado.cpf);
  const telefone = apenasDigitos(pedidoValidado.telefone);

  let numero: number;
  try {
    numero = await prisma.$transaction(async (tx) => {
      const cliente = await tx.cliente.upsert({
        where: { id: usuario.id },
        update: { cpf, telefone },
        create: {
          id: usuario.id,
          nome: usuario.nome,
          email: usuario.email,
          cpf,
          telefone,
        },
        select: { nome: true, email: true, _count: { select: { enderecos: true } } },
      });

      if (endereco.salvar) {
        await tx.endereco.create({
          data: {
            clienteId: usuario.id,
            destinatario: endereco.destinatario,
            cep,
            logradouro: endereco.logradouro,
            numero: endereco.numero,
            complemento: endereco.complemento || null,
            bairro: endereco.bairro,
            cidade: endereco.cidade,
            uf: endereco.uf,
            principal: cliente._count.enderecos === 0,
          },
        });
      }

      const pedido = await tx.pedido.create({
        data: {
          clienteId: usuario.id,
          chaveIdempotencia: pedidoValidado.chave,
          compradorNome: cliente.nome,
          compradorEmail: cliente.email,
          compradorCpf: cpf,
          compradorTelefone: telefone,
          subtotalEmCentavos: carrinho.subtotalEmCentavos,
          freteEmCentavos: frete.precoEmCentavos,
          totalEmCentavos: carrinho.subtotalEmCentavos + frete.precoEmCentavos,
          entregaDestinatario: endereco.destinatario,
          entregaCep: cep,
          entregaLogradouro: endereco.logradouro,
          entregaNumero: endereco.numero,
          entregaComplemento: endereco.complemento || null,
          entregaBairro: endereco.bairro,
          entregaCidade: endereco.cidade,
          entregaUf: endereco.uf,
          freteServicoId: frete.servicoId,
          freteServico: frete.servico,
          freteTransportadora: frete.transportadora || null,
          fretePrazoMinimoDias: frete.prazoMinimoDias,
          fretePrazoDias: frete.prazoMaximoDias,
          itens: {
            create: carrinho.itens.map((item) => ({
              variacaoId: item.variacaoId,
              quantidade: item.quantidade,
              precoUnitarioEmCentavos: item.precoUnitarioEmCentavos,
              nomeProduto: item.produto.nome,
              nomeCor: item.cor.nome,
              nomeTamanho: item.tamanho,
              sku: item.sku,
            })),
          },
        },
        select: { numero: true },
      });

      return pedido.numero;
    });
  } catch (erro) {
    // Dois envios simultâneos com a mesma chave: o segundo cai aqui.
    if (
      erro instanceof Prisma.PrismaClientKnownRequestError &&
      erro.code === "P2002"
    ) {
      const criado = await prisma.pedido.findUnique({
        where: { chaveIdempotencia: pedidoValidado.chave },
        select: { numero: true, clienteId: true },
      });
      if (criado?.clienteId === usuario.id) {
        redirect(`/pedidos/${criado.numero}?novo=1`);
      }
    }
    console.error("[checkout] erro ao criar o pedido:", erro);
    return { erro: "Não conseguimos criar o pedido agora. Tente de novo em instantes." };
  }

  // Os itens agora estão no pedido. O estoque só baixa quando o pagamento
  // for confirmado pelo Mercado Pago (etapa 9).
  await gravarItensDoCarrinho([]);
  redirect(`/pedidos/${numero}?novo=1`);
}
