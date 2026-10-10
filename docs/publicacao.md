# Roteiro de publicação da Carta Viva

Passos para pôr o site no ar em **https://lojacartaviva.com.br**, na ordem. Cada item remete ao detalhe em `docs/pendencias.md`. Marque com `[x]` ao concluir. Publicar (merge de `dev` em `main`) só quando o Israel pedir.

## 1. Antes de tudo: conteúdo e decisões

- [ ] `npm run conferir-marcadores` sem nada pendente. Ele lista:
  - marcadores no código: tabela de medidas, fotos das categorias, regra do arrependimento nas personalizadas;
  - dados da loja vazios em `src/lib/loja.ts`: razão social, CNPJ e data das políticas;
  - produtos à venda sem foto ou sem descrição.
- [ ] CNPJ aberto. Razão social e CNPJ em `src/lib/loja.ts` (obrigatórios: Decreto 7.962/2013). Endereço e CEP já estão preenchidos.
- [x] O pai do Israel confirmou (10/10/2026):
  - troca em 7 dias, com o frete pago pela loja só na primeira troca e só por erro da loja ou defeito;
  - tabela de atacado (5%, 10%, 15%);
  - até 6x com juros do comprador;
  - despacho em até 2 dias úteis; produção da personalização de 1 a 5 dias úteis depois da confirmação do pagamento;
  - resposta do orçamento em até 2 dias úteis;
  - atendimento todos os dias, das 8h às 18h.
- [ ] Redesign visual aprovado em protótipo e implementado na `feat/redesign` (sem mudar funcionalidades).
- [ ] Revisão por advogado ou contador da política de troca, da privacidade e dos termos.
- [ ] Produtos de exemplo trocados pelos reais no painel (preços, fotos, descrições e estoque), e os que não serão vendidos escondidos. **Vale também para o banco de produção, onde o seed já criou os produtos de exemplo.**
- [ ] Pacote real pesado e medido (peso e medidas de cada produto no painel).

## 2. Contas de produção

- [x] **Domínio** registrado: `lojacartaviva.com.br` (10/10/2026).
- [ ] **Mercado Pago:** conta do pai do Israel, aplicação Checkout Pro com credenciais de produção.
- [ ] **Melhor Envio:** conta real, token de produção com as mesmas permissões do sandbox (lista no `.env.example`) e saldo na carteira.
- [x] **Resend:** domínio verificado, região São Paulo (10/10/2026). Remetente da loja: `Carta Viva <pedidos@lojacartaviva.com.br>` (`EMAIL_REMETENTE`).
- [x] **Caixa `contato@lojacartaviva.com.br`** criada (10/10/2026). É o e-mail de atendimento mostrado no site; serve também para `EMAIL_DA_LOJA`.

## 3. Banco de produção (Supabase)

- [x] Projeto de produção criado na região São Paulo (`sa-east-1`) (10/10/2026). O antigo fica para testes.
- [x] Migrations aplicadas (incluem as pastas do Storage e as regras de acesso).
- [ ] Migrations novas desde a criação do projeto (a partir de `20261010120000_frete_gratis`) aplicadas com `npx prisma migrate deploy` e o `DIRECT_URL` de produção, antes do deploy.
- [x] Seed aplicado: categorias, cores, tamanhos, tabela de atacado **e os produtos de exemplo** (preço de teste R$ 1,00, 10 peças por variação). Trocar ou esconder pelo painel antes de abrir a loja.
- [x] Authentication > URL Configuration: Site URL e Redirect URLs com `https://lojacartaviva.com.br`.
- [x] Authentication > SMTP: Resend, remetente `nao-responda@lojacartaviva.com.br`. Modelos de confirmação e de nova senha em português, com os links de `/auth/confirmar`.
- [ ] Criar as contas do Israel e do pai em `/cadastro` e promover com `npm run admin:promover -- email`, usando o `DIRECT_URL` de produção.

## 4. Vercel

- [ ] Variáveis de ambiente de **produção**: todas as do `.env.example`, com os valores de produção. Atenção:
  - `SITE_URL=https://lojacartaviva.com.br`. Sem ela, o Google não indexa o site (de propósito) e os links dos e-mails da tarefa diária usam o endereço da requisição.
  - `EMAIL_REMETENTE="Carta Viva <pedidos@lojacartaviva.com.br>"`.
  - `EMAIL_DESTINO_TESTE` **vazia**. Preenchida, todos os e-mails de clientes vão para um endereço só.
  - `MELHOR_ENVIO_AMBIENTE=producao`.
  - `NEXT_PUBLIC_SUPABASE_URL` do projeto de produção, só com o endereço base, sem `/rest/v1/`.
  - `CRON_SECRET` novo (não reaproveitar o de teste).
  - `DATABASE_URL` e `DIRECT_URL` do projeto de produção, corretas antes do deploy: o build lê o banco.
- [ ] Domínio `lojacartaviva.com.br` adicionado ao projeto (Settings > Domains) e DNS apontado no Registro.br, como a Vercel indicar. **Só na publicação.**
- [ ] Região das funções: o `vercel.json` já pede São Paulo (`gru1`). Conferir em Settings > Functions depois do deploy.

## 5. Mercado Pago

- [ ] Webhooks > Configurar notificações, **modo produtivo**, evento "Pagamentos": URL `https://lojacartaviva.com.br/api/mercado-pago/webhook`. A assinatura secreta gerada vai em `MERCADO_PAGO_WEBHOOK_SECRET`.

## 6. Publicar

- [ ] Merge de `dev` em `main`, só quando o Israel pedir. A Vercel publica sozinha.

## 7. Depois de publicar

- [ ] O site abre em `https://lojacartaviva.com.br`, com cadeado (HTTPS).
- [ ] `https://lojacartaviva.com.br/robots.txt` libera o site e aponta o sitemap; `https://lojacartaviva.com.br/sitemap.xml` lista os produtos com o domínio certo.
- [ ] Cadastro: o e-mail de confirmação chega (SMTP do Supabase) e o link funciona, inclusive aberto em outro aparelho. Testar também "Esqueci minha senha".
- [ ] **Compra real de valor baixo**, paga e com a aba fechada sem voltar à loja: o pedido tem que virar "Pago" pelo webhook (no log: `[webhook] pagamento … processado`). Conferir:
  - estoque baixado;
  - e-mails de confirmação (cliente e loja), saindo de `pedidos@lojacartaviva.com.br`;
  - etiqueta comprada pelo painel, com o código de rastreio preenchendo o "Enviei o pedido";
  - **estorno pelo painel** ("Estornar e cancelar"), com o dinheiro devolvido, o pedido cancelado, o estoque devolvido e o e-mail ao cliente.
- [ ] Settings > Cron Jobs mostra a tarefa diária; no dia seguinte, o log tem a linha `[tarefa diária]`.
- [ ] Link de produto mandado no WhatsApp mostra a foto e o nome.
- [ ] PageSpeed Insights (pagespeed.web.dev) no celular, nas páginas inicial, listagem e produto. Nas medições locais de 06/10/2026, o desempenho variou de 77 a 96 conforme a rodada; o número que vale é o de produção.
- [ ] Google Search Console: verificar o domínio (registro DNS) e enviar o `sitemap.xml`.
- [ ] Testar no celular de verdade a compra completa e o painel (o pai do Israel cadastrando um produto e lançando estoque).
