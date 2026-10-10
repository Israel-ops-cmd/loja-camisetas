"use client";

import { CircleAlert, Truck } from "lucide-react";
import { useState, useTransition, type FormEvent } from "react";

import { calcularFrete, escolherFrete, limparFrete } from "@/app/carrinho/acoes";
import { PrecoDaOpcao } from "@/components/frete/FreteGratis";
import type { CotacaoDoCarrinho } from "@/lib/frete";

function mascararCep(valor: string) {
  const digitos = valor.replace(/\D/g, "").slice(0, 8);
  return digitos.length > 5
    ? `${digitos.slice(0, 5)}-${digitos.slice(5)}`
    : digitos;
}

function prazo(minimo: number, maximo: number) {
  if (minimo === maximo) {
    return maximo === 1 ? "1 dia útil" : `${maximo} dias úteis`;
  }
  return `${minimo} a ${maximo} dias úteis`;
}

export function CalculoFrete({
  cotacao,
}: {
  cotacao: CotacaoDoCarrinho | null;
}) {
  const [cep, setCep] = useState(cotacao ? mascararCep(cotacao.cep) : "");
  const [erro, setErro] = useState<string | null>(null);
  const [pendente, iniciar] = useTransition();

  function enviar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    setErro(null);
    iniciar(async () => {
      const resposta = await calcularFrete(cep);
      if (!resposta.ok) setErro(resposta.erro);
    });
  }

  if (cotacao?.ok) {
    const { endereco, opcoes, escolhida } = cotacao;
    return (
      <div className={pendente ? "opacity-60 transition" : "transition"}>
        <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
          <p className="text-[14px] text-apoio">
            Entrega para{" "}
            <strong className="text-tinta">
              {endereco
                ? `${endereco.cidade}/${endereco.uf}`
                : mascararCep(cotacao.cep)}
            </strong>
            {endereco && ` · ${mascararCep(cotacao.cep)}`}
          </p>
          <button
            type="button"
            onClick={() => iniciar(() => limparFrete())}
            className="inline-flex min-h-11 items-center text-[14px] font-semibold underline underline-offset-4 hover:text-secundario"
          >
            Trocar CEP
          </button>
        </div>

        <fieldset className="mt-2">
          <legend className="sr-only">Opções de entrega</legend>
          <div className="space-y-2">
            {opcoes.map((opcao) => {
              const ativa = opcao.servicoId === escolhida.servicoId;
              return (
                <label
                  key={opcao.servicoId}
                  className={`flex min-h-14 cursor-pointer items-center gap-3 rounded-xl border px-4 py-3 transition ${ativa ? "border-tinta" : "border-borda hover:border-secundario"}`}
                >
                  <input
                    type="radio"
                    name="frete"
                    value={opcao.servicoId}
                    checked={ativa}
                    disabled={pendente}
                    onChange={() =>
                      iniciar(async () => {
                        const resposta = await escolherFrete(opcao.servicoId);
                        if (!resposta.ok) setErro(resposta.erro);
                      })
                    }
                    className="size-4 accent-tinta"
                  />
                  <span className="flex-1">
                    <span className="block text-[14px] font-semibold">
                      {opcao.servico}
                      {opcao.transportadora && (
                        <span className="font-normal text-secundario">
                          {" "}
                          · {opcao.transportadora}
                        </span>
                      )}
                    </span>
                    <span className="block text-[13px] text-apoio">
                      {prazo(opcao.prazoMinimoDias, opcao.prazoMaximoDias)}
                    </span>
                  </span>
                  <span className="text-[15px]">
                    <PrecoDaOpcao opcao={opcao} />
                  </span>
                </label>
              );
            })}
          </div>
        </fieldset>
        {erro && <Erro mensagem={erro} />}
      </div>
    );
  }

  return (
    <form onSubmit={enviar} noValidate>
      <label htmlFor="cep" className="flex items-center gap-2 text-[14px] font-semibold">
        <Truck aria-hidden="true" className="size-5" strokeWidth={1.6} />
        Calcular frete
      </label>
      <div className="mt-2 flex gap-2">
        <input
          id="cep"
          name="cep"
          inputMode="numeric"
          autoComplete="postal-code"
          placeholder="00000-000"
          value={cep}
          onChange={(evento) => setCep(mascararCep(evento.target.value))}
          aria-invalid={!!(erro ?? (cotacao && !cotacao.ok))}
          aria-describedby="cep-ajuda"
          className="h-12 min-w-0 flex-1 rounded-full border border-borda bg-papel px-5 text-[15px] outline-none focus:border-tinta"
        />
        <button
          type="submit"
          disabled={pendente}
          className="h-12 shrink-0 rounded-full bg-tinta px-5 text-[13px] font-bold tracking-[0.16em] text-papel uppercase transition hover:bg-painel disabled:opacity-50"
        >
          {pendente ? "Calculando…" : "Calcular"}
        </button>
      </div>
      <p id="cep-ajuda" className="mt-2 text-[13px]">
        <a
          href="https://buscacepinter.correios.com.br/app/endereco/index.php"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex min-h-11 items-center text-secundario underline underline-offset-4 hover:text-tinta"
        >
          Não sei meu CEP
        </a>
      </p>
      {(erro ?? (cotacao && !cotacao.ok ? cotacao.erro : null)) && (
        <Erro mensagem={erro ?? (cotacao && !cotacao.ok ? cotacao.erro : "")} />
      )}
    </form>
  );
}

function Erro({ mensagem }: { mensagem: string }) {
  return (
    <p role="alert" className="mt-2 flex items-start gap-2 text-[14px] font-semibold">
      <CircleAlert
        aria-hidden="true"
        className="mt-0.5 size-4 shrink-0"
        strokeWidth={1.6}
      />
      {mensagem}
    </p>
  );
}
