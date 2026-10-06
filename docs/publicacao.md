# Roteiro de publicação da Carta Viva Camisetas

Passos para pôr o site no ar, na ordem. Cada item remete ao detalhe em `docs/pendencias.md`. Marque com `[x]` ao concluir. Publicar (merge de `dev` em `main`) só quando o Israel pedir.

## 1. Antes de tudo: conteúdo e decisões

- [ ] `npm run conferir-marcadores` sem nada pendente. Ele lista:
  - marcadores no código: prazos de despacho e de produção, tabela de medidas, fotos das categorias, regra do arrependimento nas personalizadas;
  - dados da loja vazios em `src/lib/loja.ts`: razão social, CNPJ, endereço, horário e data das políticas;
  - produtos à venda sem foto ou sem descrição.
- [ ] CNPJ aberto. Razão social, CNPJ e endereço em `src/lib/loja.ts` (obrigatórios: Decreto 7.962/2013).
- [ ] O pai do Israel confirmou:
  - prazo de troca e frete da troca;
  - tabela de atacado;
  - número de parcelas;
  - prazos de despacho e de produção;
  - horário de atendimento.
- [ ] Revisão por advogado ou contador da política de troca, da privacidade e dos termos.
- [ ] Produtos de exemplo trocados pelos reais no painel (preços, fotos, descrições e estoque), e os que não serão vendidos escondidos.
- [ ] Pacote real pesado e medido (peso e medidas de cada produto no painel).

## 2. Contas de produção

- [ ] **Domínio** registrado (sugestão: `cartavivacamisetas.com.br`, livre em 06/10/2026, no Registro.br).
- [ ] **Mercado Pago:** conta do pai do Israel, aplicação Checkout Pro com credenciais de produção.
- [ ] **Melhor Envio:** conta real, token de produção com as mesmas permissões do sandbox (lista no `.env.example`) e saldo na carteira.
- [ ] **Resend:** domínio verificado (registros DNS) e remetente definido (ex.: `pedidos@cartavivacamisetas.com.br`).
- [ ] **E-mail da loja** para atendimento e para os avisos (`EMAIL_DA_LOJA`). Trocar também o e-mail provisório em `src/lib/loja.ts`.

## 3. Banco de produção (Supabase)

- [ ] Criar um projeto novo, **na região São Paulo** (`sa-east-1`), só para produção. O atual fica para testes.
- [ ] Aplicar as migrations com o `DIRECT_URL` de produção: `npx prisma migrate deploy`. Elas criam também as pastas do Storage (`personalizacao` e `produtos`) e as regras de acesso.
- [ ] Rodar o seed (`npm run db:seed`): categorias, cores, tamanhos e a tabela de atacado. Ele também cria os produtos de exemplo, que depois são trocados ou escondidos pelo painel. **Conferir o estoque de exemplo (10 por variação) e o preço de teste (R$ 1,00) antes de abrir a loja.**
- [ ] Authentication > URL Configuration: Site URL e Redirect URLs com o domínio definitivo.
- [ ] Authentication > SMTP: Resend com o domínio. Depois, os modelos de e-mail em português, com os links de `/auth/confirmar` (detalhe em `docs/pendencias.md`, "E-mails").
- [ ] Criar as contas do Israel e do pai em `/cadastro` e promover com `npm run admin:promover -- email`, usando o `DIRECT_URL` de produção.

## 4. Vercel

- [ ] Variáveis de ambiente de **produção**: todas as do `.env.example`, com os valores de produção. Atenção:
  - `SITE_URL` com o domínio (`https://...`). Sem ela, o Google não indexa o site (de propósito) e os links dos e-mails da tarefa diária usam o endereço da requisição.
  - `EMAIL_DESTINO_TESTE` **vazia**. Preenchida, todos os e-mails de clientes vão para um endereço só.
  - `MELHOR_ENVIO_AMBIENTE=producao`.
  - `NEXT_PUBLIC_SUPABASE_URL` só com o endereço base, sem `/rest/v1/`.
  - `CRON_SECRET` novo (não reaproveitar o de teste).
  - `DATABASE_URL` correta antes do deploy: o build lê o banco.
- [ ] Domínio adicionado ao projeto (Settings > Domains) e DNS apontado no Registro.br, como a Vercel indicar.
- [ ] Região das funções: o `vercel.json` já pede São Paulo (`gru1`). Conferir em Settings > Functions depois do deploy.

## 5. Mercado Pago

- [ ] Webhooks > Configurar notificações, **modo produtivo**, evento "Pagamentos": URL `https://<domínio>/api/mercado-pago/webhook`. A assinatura secreta gerada vai em `MERCADO_PAGO_WEBHOOK_SECRET`.

## 6. Publicar

- [ ] Merge de `dev` em `main`, só quando o Israel pedir. A Vercel publica sozinha.

## 7. Depois de publicar

- [ ] O site abre no domínio, com cadeado (HTTPS).
- [ ] `https://<domínio>/robots.txt` libera o site e aponta o sitemap; `https://<domínio>/sitemap.xml` lista os produtos com o domínio certo.
- [ ] Cadastro: o e-mail de confirmação chega (SMTP do Supabase) e o link funciona, inclusive aberto em outro aparelho.
- [ ] **Compra real de valor baixo**, paga e com a aba fechada sem voltar à loja: o pedido tem que virar "Pago" pelo webhook (no log: `[webhook] pagamento … processado`). Conferir:
  - estoque baixado;
  - e-mails de confirmação (cliente e loja);
  - etiqueta comprada pelo painel, com o código de rastreio preenchendo o "Enviei o pedido";
  - **estorno pelo painel** ("Estornar e cancelar"), com o dinheiro devolvido, o pedido cancelado, o estoque devolvido e o e-mail ao cliente.
- [ ] Settings > Cron Jobs mostra a tarefa diária; no dia seguinte, o log tem a linha `[tarefa diária]`.
- [ ] Link de produto mandado no WhatsApp mostra a foto e o nome.
- [ ] PageSpeed Insights (pagespeed.web.dev) no celular, nas páginas inicial, listagem e produto. Nas medições locais de 06/10/2026, o desempenho variou de 77 a 96 conforme a rodada; o número que vale é o de produção.
- [ ] Google Search Console: verificar o domínio (registro DNS) e enviar o `sitemap.xml`.
- [ ] Testar no celular de verdade a compra completa e o painel (o pai do Israel cadastrando um produto e lançando estoque).
