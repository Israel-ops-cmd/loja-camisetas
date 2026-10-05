"use client";

import { useState, useTransition, type FormEvent } from "react";

import { salvarProduto, type DadosDoProduto } from "@/app/admin/produtos/acoes";
import { Aviso } from "@/components/formulario/Aviso";
import { Campo } from "@/components/formulario/Campo";
import { classesBotao } from "@/components/ui/Botao";
import { paraSlug } from "@/lib/formatacao";

export type ValoresDoProduto = {
  nome: string;
  slug: string;
  categoriaId: string;
  descricao: string;
  preco: string;
  ativo: boolean;
  destaque: boolean;
  pesoEmGramas: string;
  larguraCm: string;
  alturaCm: string;
  comprimentoCm: string;
};

const numero = (texto: string) => (texto.trim() === "" ? Number.NaN : Number(texto.replace(",", ".")));

function Chave({
  marcado,
  aoMudar,
  titulo,
  ajuda,
}: {
  marcado: boolean;
  aoMudar: (v: boolean) => void;
  titulo: string;
  ajuda: string;
}) {
  return (
    <label className="flex min-h-14 cursor-pointer items-start gap-4 rounded-xl border border-borda px-4 py-3 hover:border-tinta">
      <input
        type="checkbox"
        checked={marcado}
        onChange={(e) => aoMudar(e.target.checked)}
        className="mt-0.5 size-6 shrink-0 accent-tinta"
      />
      <span>
        <span className="block text-[16px] font-semibold">{titulo}</span>
        <span className="block text-[14px] text-secundario">{ajuda}</span>
      </span>
    </label>
  );
}

export function FormularioProduto({
  id,
  valores: iniciais,
  categorias,
}: {
  /** Nulo para produto novo. */
  id: string | null;
  valores: ValoresDoProduto;
  categorias: { id: string; nome: string }[];
}) {
  const [v, setV] = useState(iniciais);
  const [erros, setErros] = useState<Record<string, string>>({});
  const [resultado, setResultado] = useState<{ tipo: "erro" | "sucesso"; texto: string } | null>(null);
  const [salvando, iniciar] = useTransition();
  const mudar = <K extends keyof ValoresDoProduto>(campo: K, valor: ValoresDoProduto[K]) => {
    setV((atual) => ({ ...atual, [campo]: valor }));
    setResultado(null);
  };

  function salvar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    setResultado(null);
    const dados: DadosDoProduto = {
      nome: v.nome,
      slug: v.slug || undefined,
      categoriaId: v.categoriaId,
      descricao: v.descricao || undefined,
      preco: v.preco,
      ativo: v.ativo,
      destaque: v.destaque,
      pesoEmGramas: numero(v.pesoEmGramas),
      larguraCm: numero(v.larguraCm),
      alturaCm: numero(v.alturaCm),
      comprimentoCm: numero(v.comprimentoCm),
    };
    iniciar(async () => {
      const r = await salvarProduto(id, dados);
      if (!r) return; // produto novo: a ação já levou para a página de edição
      if (r.ok) {
        setErros({});
        setResultado({ tipo: "sucesso", texto: r.mensagem ?? "Salvo." });
      } else {
        setErros(r.campos ?? {});
        setResultado({ tipo: "erro", texto: r.erro });
      }
    });
  }

  const enderecoPrevisto = paraSlug(v.slug || v.nome);
  const medidasComErro = ["pesoEmGramas", "larguraCm", "alturaCm", "comprimentoCm"].some((c) => erros[c]);

  return (
    <form onSubmit={salvar} noValidate className="space-y-6">
      <Campo
        name="nome"
        rotulo="Nome do produto"
        value={v.nome}
        onChange={(e) => mudar("nome", e.target.value)}
        erro={erros.nome}
        ajuda="Como aparece na loja. Ex.: Camiseta Não Temas, Creia"
        maxLength={120}
        required
      />

      <fieldset>
        <legend className="text-[14px] font-semibold">Categoria</legend>
        <div className="mt-2 grid gap-2 sm:grid-cols-2">
          {categorias.map((c) => (
            <label
              key={c.id}
              className={`flex min-h-12 cursor-pointer items-center rounded-xl border px-4 text-[16px] font-semibold ${v.categoriaId === c.id ? "border-tinta bg-tinta text-papel" : "border-borda hover:border-tinta"}`}
            >
              <input
                type="radio"
                name="categoriaId"
                checked={v.categoriaId === c.id}
                onChange={() => mudar("categoriaId", c.id)}
                className="sr-only"
              />
              {c.nome}
            </label>
          ))}
        </div>
        {erros.categoriaId && <p className="mt-1.5 text-[13px] font-semibold">{erros.categoriaId}</p>}
      </fieldset>

      <Campo
        name="preco"
        rotulo="Preço de uma peça (R$)"
        inputMode="decimal"
        value={v.preco}
        onChange={(e) => mudar("preco", e.target.value)}
        erro={erros.preco}
        ajuda="Ex.: 49,90. Vale para todas as cores e tamanhos, a não ser que você mude algum abaixo."
        required
      />

      <div>
        <label htmlFor="campo-descricao" className="block text-[14px] font-semibold">
          Descrição
        </label>
        <textarea
          id="campo-descricao"
          rows={5}
          maxLength={5000}
          value={v.descricao}
          onChange={(e) => mudar("descricao", e.target.value)}
          aria-describedby="campo-descricao-ajuda"
          className="mt-2 w-full rounded-xl border border-borda bg-papel px-4 py-3 text-[16px] outline-none focus:border-tinta"
        />
        <p id="campo-descricao-ajuda" className="mt-1.5 text-[13px] text-secundario">
          {erros.descricao ?? "Tecido, estampa, caimento. Deixe uma linha em branco para começar outro parágrafo."}
        </p>
      </div>

      <div className="space-y-2">
        <Chave
          marcado={v.ativo}
          aoMudar={(x) => mudar("ativo", x)}
          titulo="Mostrar na loja"
          ajuda={
            v.ativo
              ? "Os clientes veem e podem comprar este produto."
              : "Escondido: só você vê. Ligue quando as fotos e os tamanhos estiverem prontos."
          }
        />
        <Chave
          marcado={v.destaque}
          aoMudar={(x) => mudar("destaque", x)}
          titulo="Destaque na página inicial"
          ajuda="Aparece entre os destaques da primeira página (os 4 mais novos marcados)."
        />
      </div>

      <details className="group rounded-xl border border-borda" open={medidasComErro || !!erros.slug}>
        <summary className="flex min-h-14 cursor-pointer items-center px-4 text-[16px] font-semibold">
          Mais opções: endereço da página e medidas para o frete
        </summary>
        <div className="space-y-5 border-t border-borda p-4">
          <Campo
            name="slug"
            rotulo="Endereço da página (opcional)"
            value={v.slug}
            onChange={(e) => mudar("slug", e.target.value)}
            erro={erros.slug}
            ajuda={
              enderecoPrevisto
                ? `A página fica em /produtos/${enderecoPrevisto}. Deixe em branco para criar a partir do nome.`
                : "Deixe em branco para criar a partir do nome."
            }
            autoCapitalize="none"
            maxLength={120}
          />
          <p className="text-[14px] text-apoio">
            Peso e tamanho do pacote de <strong>uma</strong> peça embalada. Servem para calcular o frete.
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
        </div>
      </details>

      {resultado && <Aviso tipo={resultado.tipo}>{resultado.texto}</Aviso>}
      <button type="submit" disabled={salvando} className={`${classesBotao("secundario")} w-full sm:w-auto`}>
        {salvando ? "Salvando…" : id ? "Salvar dados do produto" : "Criar produto e continuar"}
      </button>
    </form>
  );
}
