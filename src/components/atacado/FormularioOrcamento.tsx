"use client";

import { useState, useTransition, type FormEvent } from "react";

import { enviarOrcamento } from "@/app/atacado/acoes";
import { Aviso } from "@/components/formulario/Aviso";
import { Campo } from "@/components/formulario/Campo";
import { classesBotao } from "@/components/ui/Botao";
import type { TipoDePecaOrcamento } from "@/generated/prisma/enums";
import {
  AVISO_DE_DADOS,
  ordemDosTipos,
  QUANTIDADE_MAXIMA_DO_ORCAMENTO,
  rotulosDeTipoDePeca,
} from "@/lib/orcamento-regras";
import { mascararTelefone, UFS } from "@/lib/validacao-br";

type Props = {
  /** Preenche quando o cliente está logado. */
  inicial: { nome: string; email: string; telefone: string };
  hoje: string;
};

export function FormularioOrcamento({ inicial, hoje }: Props) {
  const [v, setV] = useState({
    nome: inicial.nome,
    empresa: "",
    email: inicial.email,
    telefone: mascararTelefone(inicial.telefone),
    cidade: "",
    uf: "",
    tipoDePeca: "" as TipoDePecaOrcamento | "",
    quantidade: "",
    prazoDesejado: "",
    mensagem: "",
    site: "",
  });
  const [erros, setErros] = useState<Record<string, string>>({});
  const [erroGeral, setErroGeral] = useState<string | null>(null);
  const [enviado, setEnviado] = useState<{ numero: number | null } | null>(null);
  const [enviando, iniciar] = useTransition();

  const mudar = (campo: keyof typeof v, valor: string) => setV((a) => ({ ...a, [campo]: valor }));

  function enviar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    setErroGeral(null);
    setErros({});
    iniciar(async () => {
      const r = await enviarOrcamento({
        ...v,
        empresa: v.empresa || undefined,
        tipoDePeca: v.tipoDePeca || undefined,
        quantidade: v.quantidade === "" ? undefined : Number(v.quantidade),
        prazoDesejado: v.prazoDesejado || undefined,
        mensagem: v.mensagem || undefined,
        site: v.site || undefined,
      });
      if (r.ok) setEnviado({ numero: r.numero });
      else {
        setErroGeral(r.erro);
        setErros(r.campos ?? {});
      }
    });
  }

  if (enviado) {
    return (
      <Aviso tipo="sucesso">
        Recebemos o seu pedido de orçamento
        {enviado.numero !== null && ` nº ${enviado.numero}`}. A gente responde pelo
        WhatsApp ou pelo e-mail que você informou.
      </Aviso>
    );
  }

  return (
    <form onSubmit={enviar} noValidate className="grid gap-5 sm:grid-cols-6">
      <div className="sm:col-span-3">
        <Campo name="nome" rotulo="Nome" autoComplete="name" value={v.nome} onChange={(e) => mudar("nome", e.target.value)} erro={erros.nome} />
      </div>
      <div className="sm:col-span-3">
        <Campo name="empresa" rotulo="Empresa, igreja ou grupo (opcional)" autoComplete="organization" value={v.empresa} onChange={(e) => mudar("empresa", e.target.value)} erro={erros.empresa} />
      </div>
      <div className="sm:col-span-3">
        <Campo name="email" type="email" inputMode="email" rotulo="E-mail" autoComplete="email" value={v.email} onChange={(e) => mudar("email", e.target.value)} erro={erros.email} />
      </div>
      <div className="sm:col-span-3">
        <Campo name="telefone" type="tel" inputMode="tel" rotulo="WhatsApp com DDD" autoComplete="tel-national" placeholder="(00) 00000-0000" value={v.telefone} onChange={(e) => mudar("telefone", mascararTelefone(e.target.value))} erro={erros.telefone} />
      </div>
      <div className="sm:col-span-4">
        <Campo name="cidade" rotulo="Cidade" autoComplete="address-level2" value={v.cidade} onChange={(e) => mudar("cidade", e.target.value)} erro={erros.cidade} />
      </div>
      <div className="sm:col-span-2">
        <label htmlFor="orcamento-uf" className="block text-[14px] font-semibold">Estado</label>
        <select
          id="orcamento-uf"
          value={v.uf}
          onChange={(e) => mudar("uf", e.target.value)}
          autoComplete="address-level1"
          aria-invalid={erros.uf ? true : undefined}
          className={`mt-2 h-12 w-full rounded-xl border bg-papel px-3 text-[16px] outline-none focus:border-tinta ${erros.uf ? "border-tinta" : "border-borda"}`}
        >
          <option value="">UF</option>
          {UFS.map((uf) => <option key={uf}>{uf}</option>)}
        </select>
        {erros.uf && <p className="mt-1.5 text-[13px] font-semibold">{erros.uf}</p>}
      </div>

      <fieldset className="sm:col-span-6">
        <legend className="text-[14px] font-semibold">Tipo de peça</legend>
        <div className="mt-2 flex flex-wrap gap-2">
          {ordemDosTipos.map((tipo) => (
            <label
              key={tipo}
              className={`flex min-h-11 cursor-pointer items-center rounded-full border px-4 text-[14px] font-semibold ${v.tipoDePeca === tipo ? "border-tinta bg-tinta text-papel" : "border-borda hover:border-tinta"}`}
            >
              <input type="radio" name="tipoDePeca" checked={v.tipoDePeca === tipo} onChange={() => mudar("tipoDePeca", tipo)} className="sr-only" />
              {rotulosDeTipoDePeca[tipo]}
            </label>
          ))}
        </div>
        {erros.tipoDePeca && <p className="mt-1.5 text-[13px] font-semibold">{erros.tipoDePeca}</p>}
      </fieldset>

      <div className="sm:col-span-3">
        <Campo name="quantidade" type="number" inputMode="numeric" min={1} max={QUANTIDADE_MAXIMA_DO_ORCAMENTO} rotulo="Quantidade aproximada de peças" value={v.quantidade} onChange={(e) => mudar("quantidade", e.target.value)} erro={erros.quantidade} />
      </div>
      <div className="sm:col-span-3">
        <Campo name="prazoDesejado" type="date" min={hoje} rotulo="Precisa até quando? (opcional)" value={v.prazoDesejado} onChange={(e) => mudar("prazoDesejado", e.target.value)} erro={erros.prazoDesejado} />
      </div>
      <div className="sm:col-span-6">
        <label htmlFor="orcamento-mensagem" className="block text-[14px] font-semibold">Conte o que você precisa (opcional)</label>
        <textarea
          id="orcamento-mensagem"
          rows={4}
          maxLength={2000}
          value={v.mensagem}
          onChange={(e) => mudar("mensagem", e.target.value)}
          placeholder="Ex.: 80 camisetas pretas para o encontro de jovens, tamanhos variados, logo na frente."
          className="mt-2 w-full rounded-xl border border-borda bg-papel px-4 py-3 text-[16px] outline-none focus:border-tinta"
        />
        {erros.mensagem && <p className="mt-1.5 text-[13px] font-semibold">{erros.mensagem}</p>}
      </div>

      {/* Campo escondido contra robôs: pessoas não veem nem preenchem. */}
      <div aria-hidden="true" className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
        <label htmlFor="orcamento-site">Não preencha este campo</label>
        <input id="orcamento-site" name="site" tabIndex={-1} autoComplete="off" value={v.site} onChange={(e) => mudar("site", e.target.value)} />
      </div>

      <div className="sm:col-span-6">
        {erroGeral && <div className="mb-4"><Aviso tipo="erro">{erroGeral}</Aviso></div>}
        <button type="submit" disabled={enviando} className={`${classesBotao("principal")} w-full sm:w-auto`}>
          {enviando ? "Enviando…" : "Pedir orçamento"}
        </button>
        <p className="mt-3 text-[13px] text-secundario">{AVISO_DE_DADOS}</p>
      </div>
    </form>
  );
}
