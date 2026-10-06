"use client";

import Link from "next/link";
import { useState, useTransition, type FormEvent, type ReactNode } from "react";

import { buscarEnderecoPorCep } from "@/app/checkout/acoes";
import { Aviso } from "@/components/formulario/Aviso";
import { Campo } from "@/components/formulario/Campo";
import { classesBotao } from "@/components/ui/Botao";
import type { DadosDoPedido, ResultadoDoPedido } from "@/lib/criar-pedido";
import { formatarPreco } from "@/lib/formatacao";
import type { CotacaoDoCarrinho } from "@/lib/frete";
import {
  apenasDigitos,
  cpfValido,
  mascararCep,
  mascararCpf,
  mascararTelefone,
  telefoneValido,
  UFS,
} from "@/lib/validacao-br";

type EnderecoSalvo = {
  id: string;
  destinatario: string;
  cep: string;
  logradouro: string;
  numero: string;
  complemento: string | null;
  bairro: string;
  cidade: string;
  uf: string;
};

type Props = {
  chave: string;
  comprador: { nome: string; email: string; cpf: string; telefone: string };
  enderecos: EnderecoSalvo[];
  itens: {
    variacaoId: string;
    nome: string;
    detalhe: string;
    quantidade: number;
    subtotalEmCentavos: number;
  }[];
  subtotalEmCentavos: number;
  cotacaoInicial: CotacaoDoCarrinho | null;
  servicoPreferido: number | null;
  /** Desconto de atacado só para exibir; o servidor recalcula ao criar o pedido. */
  desconto?: { percentual: number; emCentavos: number };
  /** Server Action que cota o frete para um CEP (carrinho ou personalização). */
  cotar: (cep: string) => Promise<CotacaoDoCarrinho | { ok: false; cep: string; erro: string }>;
  /** Server Action que cria o pedido; em caso de sucesso, redireciona. */
  finalizar: (dados: DadosDoPedido) => Promise<ResultadoDoPedido>;
  /** Para onde o cliente volta para revisar o que está comprando. */
  voltar: { href: string; rotulo: string };
};

const NOVO = "novo";

function prazo(minimo: number, maximo: number) {
  if (minimo === maximo) return maximo === 1 ? "1 dia útil" : `${maximo} dias úteis`;
  return `${minimo} a ${maximo} dias úteis`;
}

function servicoInicial(cotacao: CotacaoDoCarrinho | null, preferido: number | null) {
  if (!cotacao?.ok) return null;
  return (
    cotacao.opcoes.find((o) => o.servicoId === preferido)?.servicoId ??
    cotacao.escolhida.servicoId
  );
}

export function FormularioCheckout({
  chave,
  comprador,
  enderecos,
  itens,
  subtotalEmCentavos,
  desconto,
  cotacaoInicial,
  servicoPreferido,
  cotar: cotarNoServidor,
  finalizar,
  voltar,
}: Props) {
  const [enderecoId, setEnderecoId] = useState(enderecos[0]?.id ?? NOVO);
  const [novo, setNovo] = useState({
    destinatario: comprador.nome,
    cep: "",
    logradouro: "",
    numero: "",
    complemento: "",
    bairro: "",
    cidade: "",
    uf: "",
    salvar: true,
  });
  const [cotacao, setCotacao] = useState(cotacaoInicial);
  const [servicoId, setServicoId] = useState(
    servicoInicial(cotacaoInicial, servicoPreferido),
  );
  const [cotando, setCotando] = useState(false);
  const [buscandoCep, setBuscandoCep] = useState(false);
  const [avisoCep, setAvisoCep] = useState<string | null>(null);
  const [cpf, setCpf] = useState(mascararCpf(comprador.cpf));
  const [telefone, setTelefone] = useState(mascararTelefone(comprador.telefone));
  const [erros, setErros] = useState<Record<string, string>>({});
  const [erroGeral, setErroGeral] = useState<string | null>(null);
  const [revisarCarrinho, setRevisarCarrinho] = useState(false);
  const [enviando, iniciarEnvio] = useTransition();

  async function cotar(cep: string) {
    setCotando(true);
    setCotacao(null);
    setServicoId(null);
    const resultado = await cotarNoServidor(cep);
    setCotacao(resultado.ok ? resultado : { ok: false, cep, erro: resultado.erro });
    setServicoId(servicoInicial(resultado.ok ? resultado : null, servicoPreferido));
    setCotando(false);
  }

  function escolherEndereco(id: string) {
    setEnderecoId(id);
    setErroGeral(null);
    const salvo = enderecos.find((e) => e.id === id);
    if (salvo) {
      void cotar(salvo.cep);
    } else {
      const cep = apenasDigitos(novo.cep);
      if (cep.length === 8) void cotar(cep);
      else {
        setCotacao(null);
        setServicoId(null);
      }
    }
  }

  async function mudarCep(valor: string) {
    const mascarado = mascararCep(valor);
    setNovo((atual) => ({ ...atual, cep: mascarado }));
    setAvisoCep(null);
    const cep = apenasDigitos(mascarado);
    if (cep.length !== 8) {
      setCotacao(null);
      setServicoId(null);
      return;
    }

    setBuscandoCep(true);
    const resposta = await buscarEnderecoPorCep(cep);
    setBuscandoCep(false);
    if (resposta.ok) {
      const { logradouro, bairro, cidade, uf } = resposta.endereco;
      setNovo((atual) => ({
        ...atual,
        logradouro: logradouro || atual.logradouro,
        bairro: bairro || atual.bairro,
        cidade,
        uf,
      }));
    } else {
      setAvisoCep(resposta.erro);
    }
    await cotar(cep);
  }

  function mudarNovo(campo: keyof typeof novo, valor: string | boolean) {
    setNovo((atual) => ({ ...atual, [campo]: valor }));
  }

  function enviar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    setErroGeral(null);
    setRevisarCarrinho(false);

    // Conferência rápida no navegador. A que vale é a do servidor.
    const locais: Record<string, string> = {};
    if (!cpfValido(cpf)) locais.cpf = "CPF inválido. Confira os números.";
    if (!telefoneValido(telefone)) locais.telefone = "Telefone inválido. Use DDD + número.";
    if (!servicoId) locais.servicoId = "Escolha a entrega.";
    setErros(locais);
    if (Object.keys(locais).length > 0) {
      setErroGeral("Confira os campos destacados.");
      return;
    }

    const dados: DadosDoPedido = {
      chave,
      servicoId: servicoId!,
      cpf,
      telefone,
      ...(enderecoId === NOVO
        ? {
            novoEndereco: {
              ...novo,
              uf: novo.uf as (typeof UFS)[number],
              complemento: novo.complemento || undefined,
            },
          }
        : { enderecoId }),
    };

    iniciarEnvio(async () => {
      // Em caso de sucesso, a ação leva para a página do pedido.
      const resultado = await finalizar(dados);
      if (!resultado) return;
      setErroGeral(resultado.erro);
      setErros(resultado.campos ?? {});
      setRevisarCarrinho(!!resultado.revisarCarrinho);
      if (resultado.recotarFrete) {
        const cep =
          enderecoId === NOVO
            ? apenasDigitos(novo.cep)
            : enderecos.find((e) => e.id === enderecoId)?.cep;
        if (cep) void cotar(cep);
      }
    });
  }

  const frete =
    cotacao?.ok && servicoId
      ? cotacao.opcoes.find((o) => o.servicoId === servicoId)
      : undefined;
  const total =
    subtotalEmCentavos - (desconto?.emCentavos ?? 0) + (frete?.precoEmCentavos ?? 0);
  const erroNovo = (campo: string) => erros[`novoEndereco.${campo}`];

  return (
    <form
      onSubmit={enviar}
      noValidate
      className="mt-12 grid gap-8 lg:grid-cols-[1fr_380px] lg:items-start"
    >
      <div className="space-y-6">
        {/* 1. Endereço */}
        <Bloco numero="1" titulo="Endereço de entrega">
          <fieldset>
            <legend className="sr-only">Endereço de entrega</legend>
            <div className="space-y-2">
              {enderecos.map((endereco) => (
                <Opcao
                  key={endereco.id}
                  nome="endereco"
                  marcada={enderecoId === endereco.id}
                  aoMarcar={() => escolherEndereco(endereco.id)}
                >
                  <span className="block font-semibold">{endereco.destinatario}</span>
                  <span className="block text-[14px] text-apoio">
                    {endereco.logradouro}, {endereco.numero}
                    {endereco.complemento && ` · ${endereco.complemento}`}
                    <br />
                    {endereco.bairro} · {endereco.cidade}/{endereco.uf} ·{" "}
                    {mascararCep(endereco.cep)}
                  </span>
                </Opcao>
              ))}
              {enderecos.length > 0 && (
                <Opcao
                  nome="endereco"
                  marcada={enderecoId === NOVO}
                  aoMarcar={() => escolherEndereco(NOVO)}
                >
                  <span className="font-semibold">Entregar em outro endereço</span>
                </Opcao>
              )}
            </div>
          </fieldset>

          {enderecoId === NOVO && (
            <div className="mt-5 grid gap-4 sm:grid-cols-6">
              <div className="sm:col-span-3">
                <Campo
                  name="cep"
                  rotulo="CEP"
                  inputMode="numeric"
                  autoComplete="postal-code"
                  placeholder="00000-000"
                  value={novo.cep}
                  onChange={(e) => void mudarCep(e.target.value)}
                  erro={erroNovo("cep") ?? avisoCep ?? undefined}
                  ajuda={buscandoCep ? "Buscando endereço…" : undefined}
                />
              </div>
              <div className="flex items-end pb-3 sm:col-span-3">
                <a
                  href="https://buscacepinter.correios.com.br/app/endereco/index.php"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[13px] text-secundario underline underline-offset-4 hover:text-tinta"
                >
                  Não sei meu CEP
                </a>
              </div>
              <div className="sm:col-span-6">
                <Campo
                  name="logradouro"
                  rotulo="Rua"
                  autoComplete="address-line1"
                  value={novo.logradouro}
                  onChange={(e) => mudarNovo("logradouro", e.target.value)}
                  erro={erroNovo("logradouro")}
                />
              </div>
              <div className="sm:col-span-2">
                <Campo
                  name="numero"
                  rotulo="Número"
                  autoComplete="address-line2"
                  value={novo.numero}
                  onChange={(e) => mudarNovo("numero", e.target.value)}
                  erro={erroNovo("numero")}
                />
              </div>
              <div className="sm:col-span-4">
                <Campo
                  name="complemento"
                  rotulo="Complemento (opcional)"
                  value={novo.complemento}
                  onChange={(e) => mudarNovo("complemento", e.target.value)}
                  erro={erroNovo("complemento")}
                />
              </div>
              <div className="sm:col-span-6">
                <Campo
                  name="bairro"
                  rotulo="Bairro"
                  value={novo.bairro}
                  onChange={(e) => mudarNovo("bairro", e.target.value)}
                  erro={erroNovo("bairro")}
                />
              </div>
              <div className="sm:col-span-4">
                <Campo
                  name="cidade"
                  rotulo="Cidade"
                  autoComplete="address-level2"
                  value={novo.cidade}
                  onChange={(e) => mudarNovo("cidade", e.target.value)}
                  erro={erroNovo("cidade")}
                />
              </div>
              <div className="sm:col-span-2">
                <label htmlFor="campo-uf" className="block text-[14px] font-semibold">
                  Estado
                </label>
                <select
                  id="campo-uf"
                  value={novo.uf}
                  onChange={(e) => mudarNovo("uf", e.target.value)}
                  autoComplete="address-level1"
                  aria-invalid={erroNovo("uf") ? true : undefined}
                  className={`mt-2 h-12 w-full rounded-xl border bg-papel px-3 text-[16px] outline-none focus:border-tinta ${erroNovo("uf") ? "border-tinta" : "border-borda"}`}
                >
                  <option value="">UF</option>
                  {UFS.map((uf) => (
                    <option key={uf}>{uf}</option>
                  ))}
                </select>
                {erroNovo("uf") && (
                  <p className="mt-1.5 text-[13px] font-semibold">{erroNovo("uf")}</p>
                )}
              </div>
              <div className="sm:col-span-6">
                <Campo
                  name="destinatario"
                  rotulo="Quem vai receber"
                  autoComplete="name"
                  value={novo.destinatario}
                  onChange={(e) => mudarNovo("destinatario", e.target.value)}
                  erro={erroNovo("destinatario")}
                />
              </div>
              <label className="flex min-h-11 items-center gap-3 text-[15px] sm:col-span-6">
                <input
                  type="checkbox"
                  checked={novo.salvar}
                  onChange={(e) => mudarNovo("salvar", e.target.checked)}
                  className="size-5 accent-tinta"
                />
                Salvar este endereço para as próximas compras
              </label>
            </div>
          )}
        </Bloco>

        {/* 2. Entrega */}
        <Bloco numero="2" titulo="Entrega">
          {cotando && <p className="text-apoio">Calculando o frete…</p>}
          {!cotando && !cotacao && (
            <p className="text-apoio">Informe o CEP para ver as opções de entrega.</p>
          )}
          {!cotando && cotacao && !cotacao.ok && <Aviso tipo="erro">{cotacao.erro}</Aviso>}
          {!cotando && cotacao?.ok && (
            <fieldset>
              <legend className="sr-only">Opções de entrega</legend>
              <div className="space-y-2">
                {cotacao.opcoes.map((opcao) => (
                  <Opcao
                    key={opcao.servicoId}
                    nome="frete"
                    marcada={servicoId === opcao.servicoId}
                    aoMarcar={() => setServicoId(opcao.servicoId)}
                  >
                    <span className="flex items-center justify-between gap-3">
                      <span>
                        <span className="block font-semibold">
                          {opcao.servico}
                          {opcao.transportadora && (
                            <span className="font-normal text-secundario">
                              {" "}
                              · {opcao.transportadora}
                            </span>
                          )}
                        </span>
                        <span className="block text-[14px] text-apoio">
                          {prazo(opcao.prazoMinimoDias, opcao.prazoMaximoDias)}
                        </span>
                      </span>
                      <span className="font-bold">{formatarPreco(opcao.precoEmCentavos)}</span>
                    </span>
                  </Opcao>
                ))}
              </div>
            </fieldset>
          )}
          {erros.servicoId && (
            <p className="mt-2 text-[13px] font-semibold">{erros.servicoId}</p>
          )}
        </Bloco>

        {/* 3. Dados */}
        <Bloco numero="3" titulo="Seus dados">
          <p className="text-[15px] text-apoio">
            {comprador.nome} · {comprador.email}
          </p>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <Campo
              name="cpf"
              rotulo="CPF"
              inputMode="numeric"
              placeholder="000.000.000-00"
              value={cpf}
              onChange={(e) => setCpf(mascararCpf(e.target.value))}
              erro={erros.cpf}
              ajuda="Para a nota fiscal e a etiqueta de envio."
            />
            <Campo
              name="telefone"
              rotulo="Celular com DDD"
              type="tel"
              inputMode="tel"
              autoComplete="tel-national"
              placeholder="(00) 00000-0000"
              value={telefone}
              onChange={(e) => setTelefone(mascararTelefone(e.target.value))}
              erro={erros.telefone}
              ajuda="A transportadora usa para combinar a entrega."
            />
          </div>
        </Bloco>
      </div>

      {/* Resumo */}
      <section
        aria-labelledby="titulo-resumo"
        className="rounded-[20px] bg-papel p-6 lg:sticky lg:top-24"
      >
        <h2 id="titulo-resumo" className="sobretitulo">
          Resumo
        </h2>
        <ul className="mt-5 space-y-3 border-b border-borda pb-5">
          {itens.map((item) => (
            <li key={item.variacaoId} className="flex justify-between gap-3 text-[14px]">
              <span>
                <span className="font-semibold">
                  {item.quantidade}× {item.nome}
                </span>
                <span className="block text-secundario">{item.detalhe}</span>
              </span>
              <span className="shrink-0">{formatarPreco(item.subtotalEmCentavos)}</span>
            </li>
          ))}
        </ul>
        <dl className="mt-5 space-y-3 text-[15px]">
          <div className="flex justify-between gap-4">
            <dt className="text-apoio">Subtotal</dt>
            <dd>{formatarPreco(subtotalEmCentavos)}</dd>
          </div>
          {desconto && desconto.emCentavos > 0 && (
            <div className="flex justify-between gap-4">
              <dt className="text-apoio">Desconto de atacado ({desconto.percentual}%)</dt>
              <dd>−{formatarPreco(desconto.emCentavos)}</dd>
            </div>
          )}
          <div className="flex justify-between gap-4">
            <dt className="text-apoio">Frete</dt>
            <dd className={frete ? "" : "text-secundario"}>
              {frete ? formatarPreco(frete.precoEmCentavos) : "Escolha a entrega"}
            </dd>
          </div>
          <div className="flex items-baseline justify-between gap-4 border-t border-borda pt-4">
            <dt className="font-semibold">Total</dt>
            <dd className="font-titulo text-[26px] font-extrabold">{formatarPreco(total)}</dd>
          </div>
        </dl>

        {erroGeral && (
          <div className="mt-5">
            <Aviso tipo="erro">
              {erroGeral}
              {revisarCarrinho && (
                <>
                  {" "}
                  <Link href={voltar.href} className="underline underline-offset-4">
                    {voltar.rotulo}
                  </Link>
                </>
              )}
            </Aviso>
          </div>
        )}

        <button
          type="submit"
          disabled={enviando || cotando || !frete}
          className={`${classesBotao("principal")} mt-6 w-full`}
        >
          {enviando ? "Finalizando…" : "Finalizar pedido"}
        </button>
        <p className="mt-3 text-center text-[13px] text-secundario">
          O estoque é reservado quando o pagamento for confirmado.
        </p>
        <p className="mt-2 text-center text-[13px] text-secundario">
          Ao finalizar, você concorda com os{" "}
          <Link href="/termos" target="_blank" className="underline underline-offset-4">termos de uso</Link> e com a{" "}
          <Link href="/politica-de-troca" target="_blank" className="underline underline-offset-4">política de trocas</Link>.
        </p>
        <Link
          href={voltar.href}
          className="mt-2 flex min-h-11 items-center justify-center text-[14px] underline underline-offset-4 hover:text-secundario"
        >
          {voltar.rotulo}
        </Link>
      </section>
    </form>
  );
}

function Bloco({
  numero,
  titulo,
  children,
}: {
  numero: string;
  titulo: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-[20px] bg-papel p-6 sm:p-8">
      <h2 className="flex items-center gap-3 font-titulo text-[20px] font-bold uppercase">
        <span className="flex size-8 items-center justify-center rounded-full bg-tinta text-[14px] text-papel">
          {numero}
        </span>
        {titulo}
      </h2>
      <div className="mt-5">{children}</div>
    </section>
  );
}

function Opcao({
  nome,
  marcada,
  aoMarcar,
  children,
}: {
  nome: string;
  marcada: boolean;
  aoMarcar: () => void;
  children: ReactNode;
}) {
  return (
    <label
      className={`flex min-h-14 cursor-pointer items-start gap-3 rounded-xl border px-4 py-3 transition ${marcada ? "border-tinta" : "border-borda hover:border-secundario"}`}
    >
      <input
        type="radio"
        name={nome}
        checked={marcada}
        onChange={aoMarcar}
        className="mt-1 size-4 shrink-0 accent-tinta"
      />
      <span className="flex-1">{children}</span>
    </label>
  );
}
