import "server-only";

import { z } from "zod";

import { Prisma } from "@/generated/prisma/client";
import type { Usuario } from "@/lib/auth";
import { normalizarCep } from "@/lib/cep";
import { cotarFrete } from "@/lib/frete";
import type { PacoteDoItem } from "@/lib/melhor-envio";
import { totaisComDesconto } from "@/lib/atacado-regras";
import { prisma } from "@/lib/prisma";
import { apenasDigitos, cpfValido, telefoneValido, UFS } from "@/lib/validacao-br";

// Criação do pedido a partir de qualquer origem (carrinho ou personalização
// aprovada). Endereço, frete e totais são sempre recalculados aqui: nada do
// que vem do navegador é usado como preço.

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

export const esquemaDadosDoPedido = z.object({
  chave: z.uuid(),
  enderecoId: z.uuid().optional(),
  novoEndereco: esquemaNovoEndereco.optional(),
  servicoId: z.number().int().positive("Escolha a entrega."),
  cpf: z.string().refine(cpfValido, "CPF inválido. Confira os números."),
  telefone: z.string().refine(telefoneValido, "Telefone inválido. Use DDD + número."),
});

export type DadosDoPedido = z.input<typeof esquemaDadosDoPedido>;

export type ResultadoDoPedido = {
  erro: string;
  campos?: Record<string, string>;
  /** O carrinho mudou (estoque, item indisponível): o cliente precisa revisar. */
  revisarCarrinho?: boolean;
  /** O frete mudou: as opções devem ser recotadas. */
  recotarFrete?: boolean;
};

export function errosPorCampo(erro: z.ZodError) {
  const campos: Record<string, string> = {};
  for (const problema of erro.issues) {
    const campo = problema.path.join(".");
    campos[campo] ??= problema.message;
  }
  return campos;
}

/** Valida os dados enviados pelo navegador. */
export function validarDadosDoPedido(
  dados: unknown,
): { ok: true; dados: z.infer<typeof esquemaDadosDoPedido> } | { ok: false; resultado: ResultadoDoPedido } {
  const validacao = esquemaDadosDoPedido.safeParse(dados);
  if (!validacao.success) {
    return {
      ok: false,
      resultado: { erro: "Confira os campos destacados.", campos: errosPorCampo(validacao.error) },
    };
  }
  return { ok: true, dados: validacao.data };
}

/** Pedido já criado com essa chave (clique duplo ou reenvio). */
export async function pedidoDaChave(chave: string) {
  return prisma.pedido.findUnique({
    where: { chaveIdempotencia: chave },
    select: { numero: true, clienteId: true },
  });
}

export type ItemParaPedido = {
  variacaoId: string;
  quantidade: number;
  precoUnitarioEmCentavos: number;
  nomeProduto: string;
  nomeCor: string;
  nomeTamanho: string;
  sku: string;
};

export class ErroAoCriarPedido extends Error {}

/**
 * Cria o pedido (AGUARDANDO_PAGAMENTO). Devolve o número do pedido ou o erro
 * para mostrar ao cliente. `aoCriar` roda dentro da mesma transação: se ele
 * lançar `ErroAoCriarPedido`, nada é gravado e a mensagem volta ao cliente.
 */
export async function criarPedidoComEntrega({
  usuario,
  dados,
  itens,
  pacotes,
  aoCriar,
  descontoPercentual = 0,
}: {
  usuario: Usuario;
  dados: z.infer<typeof esquemaDadosDoPedido>;
  itens: ItemParaPedido[];
  pacotes: PacoteDoItem[];
  aoCriar?: (tx: Prisma.TransactionClient, pedidoId: string) => Promise<void>;
  /** Desconto de atacado (percentual inteiro), aplicado no preço de cada peça. */
  descontoPercentual?: number;
}): Promise<{ ok: true; numero: number } | ({ ok: false } & ResultadoDoPedido)> {
  // Endereço: um salvo (precisa ser do próprio cliente) ou um novo.
  let endereco: z.infer<typeof esquemaNovoEndereco>;
  if (dados.enderecoId) {
    const salvo = await prisma.endereco.findFirst({
      where: { id: dados.enderecoId, clienteId: usuario.id },
    });
    if (!salvo) return { ok: false, erro: "Escolha um endereço de entrega." };
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
  } else if (dados.novoEndereco) {
    endereco = dados.novoEndereco;
  } else {
    return { ok: false, erro: "Escolha um endereço de entrega." };
  }
  const cep = normalizarCep(endereco.cep)!;

  // Frete recotado aqui: o preço nunca vem do navegador.
  const cotacao = await cotarFrete(pacotes, cep, dados.servicoId);
  if (!cotacao.ok) return { ok: false, erro: cotacao.erro, recotarFrete: true };
  if (cotacao.escolhida.servicoId !== dados.servicoId) {
    return {
      ok: false,
      erro: "A opção de entrega escolhida não está mais disponível para esse CEP. Escolha outra.",
      recotarFrete: true,
    };
  }
  const frete = cotacao.escolhida;

  const cpf = apenasDigitos(dados.cpf);
  const telefone = apenasDigitos(dados.telefone);
  // Itens guardam o preço cheio; o desconto fica no pedido (percentual e valor).
  const { subtotal, desconto, totalDosItens } = totaisComDesconto(
    itens.map((i) => ({ precoEmCentavos: i.precoUnitarioEmCentavos, quantidade: i.quantidade })),
    descontoPercentual,
  );

  try {
    const numero = await prisma.$transaction(async (tx) => {
      const cliente = await tx.cliente.upsert({
        where: { id: usuario.id },
        update: { cpf, telefone },
        create: { id: usuario.id, nome: usuario.nome, email: usuario.email, cpf, telefone },
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
          chaveIdempotencia: dados.chave,
          compradorNome: cliente.nome,
          compradorEmail: cliente.email,
          compradorCpf: cpf,
          compradorTelefone: telefone,
          subtotalEmCentavos: subtotal,
          descontoEmCentavos: desconto,
          descontoPercentual,
          freteEmCentavos: frete.precoEmCentavos,
          totalEmCentavos: totalDosItens + frete.precoEmCentavos,
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
          itens: { create: itens },
        },
        select: { id: true, numero: true },
      });

      await aoCriar?.(tx, pedido.id);
      return pedido.numero;
    });
    return { ok: true, numero };
  } catch (erro) {
    if (erro instanceof ErroAoCriarPedido) return { ok: false, erro: erro.message };
    // Dois envios simultâneos com a mesma chave: o segundo cai aqui.
    if (erro instanceof Prisma.PrismaClientKnownRequestError && erro.code === "P2002") {
      const criado = await pedidoDaChave(dados.chave);
      if (criado?.clienteId === usuario.id) return { ok: true, numero: criado.numero };
    }
    console.error("[pedido] erro ao criar o pedido:", erro);
    return { ok: false, erro: "Não conseguimos criar o pedido agora. Tente de novo em instantes." };
  }
}
