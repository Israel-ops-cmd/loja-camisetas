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
  referencia: string;
  preco: string;
  ativo: boolean;
  destaque: boolean;
};

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
      referencia: v.referencia || undefined,
      preco: v.preco,
      ativo: v.ativo,
      destaque: v.destaque,
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
        rotulo="Preço padrão de uma peça (R$)"
        inputMode="decimal"
        value={v.preco}
        onChange={(e) => mudar("preco", e.target.value)}
        erro={erros.preco}
        ajuda="Ex.: 49,90. Vale só para o modelo que não tiver preço próprio (o preço de cada modelo fica em Cores e tamanhos, abaixo)."
        required
      />

      <Campo
        name="referencia"
        rotulo="Referência (opcional)"
        value={v.referencia}
        onChange={(e) => mudar("referencia", e.target.value)}
        erro={erros.referencia}
        ajuda="Versículo da estampa, ex.: Romanos 1:16. Aparece abaixo do nome, na página do produto."
        maxLength={100}
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

      <details className="group rounded-xl border border-borda" open={!!erros.slug}>
        <summary className="flex min-h-14 cursor-pointer items-center px-4 text-[16px] font-semibold">
          Mais opções: endereço da página
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
        </div>
      </details>

      {resultado && <Aviso tipo={resultado.tipo}>{resultado.texto}</Aviso>}
      <button type="submit" disabled={salvando} className={`${classesBotao("secundario")} w-full sm:w-auto`}>
        {salvando ? "Salvando…" : id ? "Salvar dados do produto" : "Criar produto e continuar"}
      </button>
    </form>
  );
}
