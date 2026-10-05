"use server";

import { refresh, revalidatePath } from "next/cache";
import { z } from "zod";

import { LIMITES_DA_TABELA } from "@/lib/atacado-regras";
import { administradorDaAcao, SEM_PERMISSAO } from "@/lib/painel";
import { prisma } from "@/lib/prisma";

// Tabela de desconto do atacado. É salva inteira de uma vez; pedidos já
// criados não mudam (cada um guarda o percentual que valeu na hora).

const { minimoDePecas: M, percentual: P } = LIMITES_DA_TABELA;

const esquema = z.object({
  ligado: z.boolean(),
  faixas: z
    .array(
      z.object({
        minimoDePecas: z
          .number("Digite a quantidade de peças em números.")
          .int("Digite a quantidade de peças sem vírgula.")
          .min(M.minimo, `A quantidade mínima de uma faixa é ${M.minimo} peças.`)
          .max(M.maximo, `Quantidade alta demais. Confira se digitou certo.`),
        percentual: z
          .number("Digite o desconto em números.")
          .int("Digite o desconto sem vírgula (ex.: 5, 10, 15).")
          .min(P.minimo, `O desconto precisa ser de pelo menos ${P.minimo}%.`)
          .max(P.maximo, `O desconto pode ser no máximo ${P.maximo}%.`),
      }),
    )
    .max(LIMITES_DA_TABELA.faixas, `Use no máximo ${LIMITES_DA_TABELA.faixas} faixas.`),
});

export async function salvarTabelaDeAtacado(
  dados: unknown,
): Promise<{ ok: true; mensagem: string } | { ok: false; erro: string; linha?: number }> {
  if (!(await administradorDaAcao())) return { ok: false, erro: SEM_PERMISSAO };
  const validacao = esquema.safeParse(dados);
  if (!validacao.success) {
    const problema = validacao.error.issues[0];
    const linha = problema.path[0] === "faixas" && typeof problema.path[1] === "number" ? problema.path[1] : undefined;
    const texto = problema.message;
    return {
      ok: false,
      erro: linha === undefined ? texto : `Faixa ${linha + 1}: ${texto[0].toLowerCase()}${texto.slice(1)}`,
      linha,
    };
  }
  const { ligado } = validacao.data;
  const faixas = [...validacao.data.faixas].sort((a, b) => a.minimoDePecas - b.minimoDePecas);

  if (ligado && faixas.length === 0) {
    return { ok: false, erro: "Para ligar o desconto, adicione pelo menos uma faixa. Ou desligue o desconto." };
  }
  for (let i = 1; i < faixas.length; i++) {
    const [anterior, atual] = [faixas[i - 1], faixas[i]];
    if (atual.minimoDePecas === anterior.minimoDePecas) {
      return { ok: false, erro: `Há duas faixas começando em ${atual.minimoDePecas} peças. Mude ou remova uma delas.` };
    }
    if (atual.percentual <= anterior.percentual) {
      return {
        ok: false,
        erro: `Quem compra mais precisa ganhar mais desconto: a faixa de ${atual.minimoDePecas} peças está com ${atual.percentual}%, e a de ${anterior.minimoDePecas} peças com ${anterior.percentual}%.`,
      };
    }
  }

  await prisma.$transaction([
    prisma.faixaAtacado.deleteMany({}),
    prisma.faixaAtacado.createMany({ data: faixas.map((f) => ({ ...f, ativo: ligado })) }),
  ]);

  // O aviso "a partir de N peças" nas páginas de produto vem da tabela.
  revalidatePath("/produtos/[slug]", "page");
  revalidatePath("/atacado");
  refresh();
  return {
    ok: true,
    mensagem: ligado
      ? "Tabela salva. O carrinho já usa os novos descontos. Pedidos já feitos não mudam."
      : "Tabela salva com o desconto desligado. Ninguém recebe desconto de atacado até você ligar de novo.",
  };
}
