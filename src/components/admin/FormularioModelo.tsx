"use client";

import { useState, useTransition, type FormEvent } from "react";

import { salvarModelo, type DadosDoModelo } from "@/app/admin/modelos/acoes";
import { Aviso } from "@/components/formulario/Aviso";
import { Campo } from "@/components/formulario/Campo";
import { classesBotao } from "@/components/ui/Botao";

export type ValoresDoModelo = {
  nome: string;
  ativo: boolean;
  pesoEmGramas: string;
  larguraCm: string;
  alturaCm: string;
  comprimentoCm: string;
};

const numero = (texto: string) => (texto.trim() === "" ? Number.NaN : Number(texto.replace(",", ".")));

export function FormularioModelo({ id, valores: iniciais }: { id: string | null; valores: ValoresDoModelo }) {
  const [v, setV] = useState(iniciais);
  const [erros, setErros] = useState<Record<string, string>>({});
  const [resultado, setResultado] = useState<{ tipo: "erro" | "sucesso"; texto: string } | null>(null);
  const [salvando, iniciar] = useTransition();
  const mudar = <K extends keyof ValoresDoModelo>(campo: K, valor: ValoresDoModelo[K]) => {
    setV((atual) => ({ ...atual, [campo]: valor }));
    setResultado(null);
  };

  function salvar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    setResultado(null);
    const dados: DadosDoModelo = {
      nome: v.nome,
      ativo: v.ativo,
      pesoEmGramas: numero(v.pesoEmGramas),
      larguraCm: numero(v.larguraCm),
      alturaCm: numero(v.alturaCm),
      comprimentoCm: numero(v.comprimentoCm),
    };
    iniciar(async () => {
      const r = await salvarModelo(id, dados);
      if (!r) return; // modelo novo: a ação já levou para a página de edição
      if (r.ok) {
        setErros({});
        setResultado({ tipo: "sucesso", texto: r.mensagem ?? "Salvo." });
      } else {
        setErros(r.campos ?? {});
        setResultado({ tipo: "erro", texto: r.erro });
      }
    });
  }

  return (
    <form onSubmit={salvar} noValidate className="space-y-6">
      <Campo
        name="nome"
        rotulo="Nome do modelo"
        value={v.nome}
        onChange={(e) => mudar("nome", e.target.value)}
        erro={erros.nome}
        ajuda="Como aparece na loja. Ex.: Baby Look"
        maxLength={60}
        required
      />

      <label className="flex min-h-14 cursor-pointer items-start gap-4 rounded-xl border border-borda px-4 py-3 hover:border-tinta">
        <input
          type="checkbox"
          checked={v.ativo}
          onChange={(e) => mudar("ativo", e.target.checked)}
          className="mt-0.5 size-6 shrink-0 accent-tinta"
        />
        <span>
          <span className="block text-[16px] font-semibold">Modelo em uso</span>
          <span className="block text-[14px] text-secundario">
            {v.ativo
              ? "Aparece no cadastro dos produtos."
              : "Desligado: não aparece no cadastro de produtos novos. O que já está à venda continua."}
          </span>
        </span>
      </label>

      <fieldset className="space-y-3">
        <legend className="text-[16px] font-semibold">Pacote para o frete</legend>
        <p className="text-[14px] text-apoio">
          Peso e tamanho do pacote de <strong>uma</strong> peça embalada deste modelo. Servem para calcular o frete.
        </p>
        <div className="grid grid-cols-2 gap-4">
          <Campo
            name="pesoEmGramas"
            rotulo="Peso (gramas)"
            inputMode="numeric"
            value={v.pesoEmGramas}
            onChange={(e) => mudar("pesoEmGramas", e.target.value)}
            erro={erros.pesoEmGramas}
          />
          <Campo
            name="larguraCm"
            rotulo="Largura (cm)"
            inputMode="numeric"
            value={v.larguraCm}
            onChange={(e) => mudar("larguraCm", e.target.value)}
            erro={erros.larguraCm}
          />
          <Campo
            name="comprimentoCm"
            rotulo="Comprimento (cm)"
            inputMode="numeric"
            value={v.comprimentoCm}
            onChange={(e) => mudar("comprimentoCm", e.target.value)}
            erro={erros.comprimentoCm}
          />
          <Campo
            name="alturaCm"
            rotulo="Altura (cm)"
            inputMode="numeric"
            value={v.alturaCm}
            onChange={(e) => mudar("alturaCm", e.target.value)}
            erro={erros.alturaCm}
          />
        </div>
      </fieldset>

      {resultado && <Aviso tipo={resultado.tipo}>{resultado.texto}</Aviso>}
      <button type="submit" disabled={salvando} className={`${classesBotao("secundario")} w-full sm:w-auto`}>
        {salvando ? "Salvando…" : id ? "Salvar dados do modelo" : "Criar modelo e continuar"}
      </button>
    </form>
  );
}
