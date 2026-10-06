# Pendências da Carta Viva Camisetas

Lista do que ficou para depois durante o desenvolvimento. Marque com `[x]` o que for resolvido e acrescente o que surgir.

## Obrigatório antes de publicar

### Banco de dados

- [ ] Criar um segundo projeto no Supabase, limpo, só para produção, e rodar as migrations nele. O projeto atual fica para desenvolvimento e testes.
- [ ] Garantir que os dados de teste não cheguem à produção: preço de R$ 1,00 e estoque de 10 unidades.

### E-mails

- [ ] Definir e registrar o domínio da loja.
- [ ] Configurar um serviço de envio próprio (SMTP), como o Resend, com o domínio da loja. Sem SMTP próprio, o Supabase só entrega e-mails para os membros da equipe do projeto e com um limite baixo por hora: clientes de verdade não recebem a confirmação de cadastro nem o link de nova senha.
- [ ] Editar os modelos de e-mail no Supabase (Authentication > Emails), que só são liberados com SMTP próprio:
  - Confirm signup: link `{{ .SiteURL }}/auth/confirmar?token_hash={{ .TokenHash }}&type=email`
  - Reset password: link `{{ .SiteURL }}/auth/confirmar?token_hash={{ .TokenHash }}&type=recovery&next=/redefinir-senha`
- [ ] Trocar os modelos para português, com o visual da loja.
- [ ] Depois de editar os modelos, testar a recuperação de senha abrindo o link em outro aparelho. Com o link padrão de hoje, ele só funciona no mesmo navegador em que a senha foi pedida.

### Endereços e variáveis

- [ ] No Supabase (Authentication > URL Configuration), trocar `http://localhost:3000` pelo endereço real do site em Site URL e Redirect URLs.
- [x] Confirmar que o repositório está conectado à Vercel. As prévias estão funcionando.
- [x] Cadastrar na Vercel (Settings > Environment Variables) as variáveis do `.env.local`.
- [ ] Antes de publicar, trocar na Vercel os valores de teste pelos de produção (banco de produção, Melhor Envio e Mercado Pago). A `DATABASE_URL` precisa estar certa antes do deploy: o build lê o banco para gerar a página inicial.
- [ ] A cada variável nova no `.env.example`, cadastrar também na Vercel.
- [ ] Cadastrar `CRON_SECRET` na Vercel (texto aleatório com 16 caracteres ou mais; o `.env.example` mostra como gerar). Sem ele, a tarefa diária responde 401 e não roda. Para testar no computador, colocar também no `.env.local`.
- [ ] Depois de publicar, conferir na Vercel (Settings > Cron Jobs) que a tarefa diária aparece e, no dia seguinte, ver no log a linha `[tarefa diária]` com o resumo. As tarefas agendadas só rodam na produção (`main`), não nas prévias.
- [ ] Na Vercel, cadastrar a `NEXT_PUBLIC_SUPABASE_URL` só com o endereço base (`https://<projeto>.supabase.co`), sem `/rest/v1/`.
- [ ] Configurar a região das funções na Vercel para São Paulo (`gru1`), perto do banco. Na região padrão (Estados Unidos), cada consulta fica mais lenta.

### Frete (Melhor Envio)

- [ ] Criar a conta real do Melhor Envio e trocar o token de sandbox pelo de produção (`MELHOR_ENVIO_AMBIENTE=producao`). O token de produção precisa das mesmas permissões do de sandbox (lista no `.env.example`): cálculo, carrinho, compra, geração, impressão, rastreio, cancelamento, leitura de pedidos e de usuário.
- [ ] Colocar saldo na carteira do Melhor Envio de produção: cada etiqueta comprada pelo painel é paga com esse saldo.
- [ ] Preencher os dados reais do remetente (`MELHOR_ENVIO_REMETENTE_*` no `.env.example`: nome, telefone, CPF ou CNPJ, endereço, número e bairro da loja) no `.env.local` e na Vercel. Sem eles, o painel mostra que faltam dados e não deixa comprar etiqueta. Nos testes foram usados dados fictícios, só no processo do teste.
- [ ] **Nota fiscal:** as etiquetas saem com declaração de conteúdo (`non_commercial: true` em `src/lib/etiquetas.ts`), que serve para quem vende sem nota. Confirmar com o pai do Israel se a loja emite NF-e (CNPJ). Se emitir, a etiqueta precisa da chave da nota de cada pedido, e isso tem que ser acrescentado ao painel.
- [ ] Testar em produção (ou de novo no sandbox) a etiqueta chegando a "Pronta para imprimir", o PDF impresso e o código de rastreio preenchendo sozinho o campo de "Enviei o pedido". No sandbox, em 06/10/2026, a etiqueta ficou como "paga, sendo gerada" durante todo o teste; compra, toque duplo sem cobrar de novo, impressão (link), cancelamento com o saldo de volta e histórico funcionaram.
- [ ] Pedidos que não cabem num pacote só (o Melhor Envio calcula mais de um volume): o painel avisa e a etiqueta precisa ser feita direto no site do Melhor Envio (Correios não aceita vários volumes num envio só). Avaliar se vale tratar no painel quando houver pedidos grandes de atacado.
- [ ] Pesar uma camiseta embalada e medir o pacote. Hoje o sistema usa uma estimativa provisória de 300 g em 28 × 22 × 4 cm, gravada como padrão em cada produto.
- [ ] Decidir se haverá frete grátis e com qual regra. Hoje não há.
- [ ] Se houver dias de manuseio ou produção, configurar no painel do Melhor Envio: o prazo mostrado no carrinho já usa os valores personalizados da conta.

### Pagamento (Mercado Pago)

- [ ] Criar a conta do Mercado Pago no CPF ou CNPJ do responsável pela loja.
- [x] Usar credenciais de teste no desenvolvimento: conta vendedora de teste da aplicação ("Ativar credenciais").
- [ ] Criar a aplicação (Checkout Pro) na conta do Mercado Pago do pai do Israel e trocar as credenciais de teste pelas de produção dele, no ambiente de produção e na Vercel (`MERCADO_PAGO_ACCESS_TOKEN` e `MERCADO_PAGO_WEBHOOK_SECRET`).
- [ ] Cadastrar no painel do Mercado Pago, na aplicação da conta que recebe os pagamentos (Webhooks > Configurar notificações, **modo produtivo**, evento "Pagamentos"), a URL definitiva do webhook: `https://<domínio>/api/mercado-pago/webhook`, e usar a assinatura secreta gerada lá. A cobrança não manda mais `notification_url`: os avisos vêm só da URL do painel.
- [ ] Confirmar com o pai do Israel o número máximo de parcelas. Hoje: até 6x, com juros por conta do comprador (`MAXIMO_DE_PARCELAS` em `src/lib/pagamento.ts`).
- [x] Testar o pagamento de ponta a ponta no ambiente de teste, com a conta compradora de teste: pedido #1002 pago pelo Checkout Pro (Visa de teste, titular APRO), cobrança de R$ 13,68 com frete, pedido marcado como Pago e estoque baixado uma única vez. Quem confirmou o pagamento foi a página de retorno; o webhook está no item abaixo.
- [ ] **Webhook com assinatura válida — validar em produção.** No ambiente de teste, nenhum aviso de pagamento real passou na conferência de assinatura. Decisão (opção 2): manter a conferência como está, aceitar a página de retorno como confirmação nos testes e validar o webhook no pagamento real de valor baixo em produção (item abaixo). O que foi testado:
  - Aviso simulado pelo painel da aplicação do Israel (modo de teste, payment.updated, data.id 123456): assinatura **aceita** com a chave do painel. O webhook agora responde 200 para pagamento inexistente, então a simulação aparece como sucesso.
  - Pagamentos reais da conta vendedora de teste (`live_mode: true`): avisam pela URL do **modo produtivo**, não pela do modo de teste.
  - Assinatura **recusada** em todos os avisos reais: com `notification_url` na cobrança (formatos `type`/`data.id` e `topic`/`id`), e pela URL do painel no modo produtivo, tanto com a chave da aplicação do Israel quanto com a da aplicação da conta vendedora de teste. Ou seja, no ambiente de teste não foi possível descobrir com que chave os avisos reais são assinados.
  - Se em produção a assinatura também for recusada: abrir caso com o suporte do Mercado Pago com estes dados, ou decidir aceitar avisos sem assinatura válida (o webhook nunca usa o conteúdo do aviso: sempre consulta o pagamento na API com o token da loja).
  - Hoje o `.env.local` está com a assinatura secreta da aplicação da conta vendedora de teste. Na Vercel, conferir qual está cadastrada.
- [ ] **Rede de segurança para o webhook** (obrigatória antes de publicar): mesmo que um aviso do Mercado Pago se perca ou seja recusado, nenhum pedido pago pode ficar parado como "Aguardando pagamento". As três partes usam a mesma conferência que já existe (`conferirPagamentosDoPedido` em `src/lib/pagamento.ts`), que lê o pagamento na API e é segura de repetir:
  - [x] Página do pedido: confere o pagamento na API sempre que o cliente abre um pedido pendente, no máximo uma vez por minuto por pedido (`conferirPagamentoSeLiberado`); na volta do Mercado Pago confere sempre. Etapa 13a.
  - [x] Painel do administrador: botão "Conferir pagamento no Mercado Pago" em cada pedido pendente. Etapa 13a.
  - [x] Tarefa agendada (Vercel Cron, `vercel.json`) que confere no Mercado Pago os pedidos pendentes que abriram a cobrança. Roda uma vez por dia (07h de Brasília, com variação de até uma hora no plano gratuito), na rota `/api/tarefas/diaria` (`src/lib/tarefas.ts`). Para conferir com mais frequência, é preciso o plano pago da Vercel ou um agendador externo. Etapa 13b.
- [ ] Testar com cartão real os meios que não passaram no ambiente de teste. O Mastercard de teste `5031 4332 1540 6351` foi recusado no checkout do Mercado Pago com "A transação não aceita este meio de pagamento", logo ao digitar o número. A cobrança não exclui nenhum meio, e o Mastercard de crédito está ativo na conta vendedora de teste, então tudo indica uma limitação do ambiente de teste. Confirmar com um Mastercard real no pagamento de valor baixo antes de publicar.
- [ ] Testar no ambiente de teste os casos de cartão recusado (titular `OTHE`) e pendente (`CONT`), e um Pix ou boleto pago depois (depende do webhook).
- [ ] Antes de publicar, fazer um pagamento real de valor baixo em produção e estornar, para conferir webhook, baixa de estoque e devolução. **Pagar e fechar a aba sem voltar à loja**: o pedido precisa virar "Pago" pelo webhook (no log: `[webhook] pagamento … processado`). Esse é o teste que valida a assinatura.

### Pedidos

- [x] Definir o que acontece quando o pagamento é confirmado e o estoque já acabou: o pedido fica PAGO com alerta para o administrador decidir entre produzir ou estornar (opção C). O estoque fica negativo, indicando quantas peças faltam.
- [x] Cancelamento automático de pedidos não pagos, na mesma tarefa diária: cancela quando o prazo de 3 dias termina; se houver pagamento pendente no Mercado Pago (boleto gerado ou em análise), espera mais 5 dias pela compensação. Pedido com valor divergente nunca é cancelado sozinho. O cliente vê o motivo e o link de pagamento é encerrado. Etapa 13b.
- [x] Marcar pedidos como "Enviado" pelo painel (etapa 13a, com código de rastreio). A correção de contagem do estoque desconta as peças de pedidos "Pago" e "Em separação", que ainda estão na prateleira esperando envio (`STATUS_ESPERANDO_ENVIO` em `src/lib/estoque-regras.ts`). Enquanto não der para marcar o envio, todo pedido pago conta como peça na prateleira, e a contagem fica errada depois que as peças saírem.
- [x] Mostrar no painel os alertas dos pedidos (pago sem estoque, valor divergente, pagamento aprovado em pedido cancelado) e permitir estornar pelo painel (etapa 13a).
- [ ] **Estorno pelo painel — validar em produção.** No ambiente de teste ele não funciona: em 06/10/2026, o pedido #1001 (pagamento 182731820180, R$ 13,68, Visa de teste, aprovado e com o dinheiro já liberado) teve o estorno recusado três vezes com `HTTP 401`, "Unauthorized use of live credentials" (código 7). O token é o de produção (`APP_USR`) da conta vendedora de teste, a mesma que recebeu o pagamento; ele cria cobranças e lê pagamentos normalmente, mas o Mercado Pago recusa o mesmo token no estorno. Tudo indica uma limitação das credenciais de usuário de teste (a nossa chamada segue a documentação), mas isso só se confirma em produção. Não é saldo nem a chave de idempotência (a recusa acontece antes, na autorização, e o pagamento continua sem nenhum estorno). O que fazer:
  - No pagamento real de valor baixo em produção (item acima), estornar **pelo painel da loja** (`/admin/pedidos`, "Estornar e cancelar") e conferir: pedido Cancelado, estoque devolvido, histórico com o estorno, cliente vê o motivo e o dinheiro volta.
  - Se em produção também vier 401 ou 403, conferir se as credenciais de produção da aplicação na conta do pai do Israel estão ativadas e se o token tem permissão de estorno. Enquanto isso, o estorno pode ser feito pelo site ou app do Mercado Pago, seguido de "Conferir pagamento" no pedido.
  - O teste do caminho "estorno feito no Mercado Pago, aplicado pela loja" pode ser feito já no ambiente de teste: entrar no Mercado Pago com a conta vendedora de teste, devolver o pagamento do pedido #1001 e tocar em "Conferir pagamento" na página do pedido no painel.
- [x] Apagar os dados de teste do pedido #1001 (pago no sandbox em 06/10/2026, com estoque baixado). Feito em 06/10/2026: pedido, itens, histórico e baixa de venda apagados, peça devolvida ao estoque e numeração de volta ao #1001. O pagamento continua aprovado na conta vendedora de teste do Mercado Pago, sem pedido ligado.
- [ ] Estorno parcial (devolver só parte do valor, por exemplo uma peça em falta). Hoje o painel só faz o estorno total.
- [ ] Estorno de pedido já enviado devolve as peças ao estoque automaticamente (mesma rotina dos estornos do Mercado Pago). Se as peças não voltarem para a loja, é preciso corrigir a contagem no Estoque; a tela de estorno avisa isso.
- [x] Etiqueta de envio pelo Melhor Envio (etapa 13b): gerar, comprar com o saldo da carteira (preço mostrado antes de confirmar), imprimir, atualizar e cancelar pela página do pedido no painel. Itens de configuração e teste em "Frete (Melhor Envio)".
- [ ] E-mail de confirmação do pedido para o cliente (etapa 14). Hoje ele vê o pedido só na página do pedido e em "Minha conta".

### Atacado e orçamentos

- [x] Editar a tabela de desconto do atacado pelo painel (etapa 12, `/admin/atacado`): faixas, percentuais e ligar/desligar. Travas: até 5 faixas, de 1% a 50%, a partir de 2 peças, desconto maior para quantidade maior.
- [ ] Aviso por e-mail para a loja quando chega um pedido de orçamento (etapa 14). Hoje a loja precisa abrir o painel (o início mostra quantos orçamentos novos há).
- [ ] Na política de privacidade (etapa 15), dizer por quanto tempo os dados dos orçamentos ficam guardados e como pedir a exclusão. O formulário avisa: "Usamos seus dados só para responder a este orçamento".
- [ ] O limite de 3 orçamentos por hora usa o IP informado pela Vercel (`x-forwarded-for`). Conferir em produção que ele vem preenchido; no computador local, todos os envios contam como o mesmo IP.

### Personalização

- [ ] Avisos por e-mail (etapa 14): para a loja quando chega um pedido de personalização ou um pedido de ajuste; para o cliente quando a prévia é enviada. Hoje ninguém é avisado: a loja precisa abrir o painel (o início do painel mostra quantos pedidos esperam prévia) e o cliente precisa abrir "Minha conta".
- [ ] Revisar o texto da declaração de direito de uso da arte (`DECLARACAO_DE_DIREITOS` em `src/lib/personalizacao-regras.ts`) e ligá-lo aos termos de uso quando as páginas institucionais existirem (etapa 15). Hoje o site grava a data e a hora em que o cliente confirmou a declaração.
- [ ] Confirmar com o pai do Israel se ele consegue abrir arquivos `.cdr` (CorelDRAW), `.ai` (Illustrator) e `.psd` (Photoshop). Se não conseguir, tirar esses formatos de `FORMATOS_DE_ARTE` em `src/lib/personalizacao-regras.ts`.
- [ ] Confirmar com o pai do Israel quais outras peças podem ser personalizadas (baby look, infantil etc.). Depois da confirmação, basta cadastrá-las em Produtos (`/admin/produtos`) na categoria "Camisetas Básicas", que é de onde a personalização tira as peças.
- [ ] O pedido de personalização não confere o estoque das camisetas lisas: o cliente pode pedir mais peças do que há em estoque. A baixa acontece no pagamento, e se faltar peça o pedido fica Pago com alerta (opção C). Avaliar se o orçamento deve conferir o estoque antes de enviar a prévia.
- [x] Limpeza de arquivos esquecidos no Storage (pastas `personalizacao` e `produtos`): botão "Procurar arquivos esquecidos" em Manutenção, no início do painel (decisão: botão com a sessão do administrador, sem chave secreta do Supabase). Apaga só arquivos com mais de um dia que não estão ligados a nenhuma foto de produto nem a nenhum pedido de personalização.
- [ ] Artes e prévias de pedidos de personalização cancelados ou recusados continuam guardadas. Definir na política de privacidade (etapa 15) por quanto tempo guardar e então incluir na limpeza.

### Conteúdo da loja

Desde a etapa 12, produtos, preços, cores, tamanhos, descrições e fotos são cadastrados pelo painel (`/admin/produtos`). Os dados de exemplo são trocados à mão por ali antes de publicar (decisão: sem botão de apagar dados de exemplo; produtos e variações nunca são apagados, só escondidos).

- [ ] Preços reais de cada produto.
- [ ] Cores e tamanhos disponíveis de cada produto, com o estoque real. Combinação nova criada pelo painel começa com estoque 0; o estoque real é lançado em Estoque (`/admin/estoque`), com "Chegaram peças" ou "Corrigir contagem". Hoje todas as variações de exemplo estão com 10 peças.
- [ ] Descrição de cada produto. Hoje a página mostra o marcador `[DESCRIÇÃO DO PRODUTO]`.
- [ ] Esconder pelo painel (desligar "Mostrar na loja") os produtos de exemplo que não forem vendidos de verdade.
- [ ] Tabela de medidas por tamanho. Hoje a página mostra o marcador `[TABELA DE MEDIDAS]`.
- [ ] Produtos reais da categoria "Camisetas Básicas". Hoje ela tem só a "Camiseta lisa" de exemplo (seed: branca, preta, azul-marinho e off-white, P a GG, preço de teste R$ 1,00), que também é a peça base da personalização.
- [ ] **Confirmar com o pai do Israel a tabela de desconto do atacado.** Hoje está a tabela PROVISÓRIA: 10 a 19 peças, 5%; 20 a 49, 10%; 50 ou mais, 15% (total de peças do carrinho, produtos misturados). Os valores ficam na tabela `faixas_atacado` do banco (criada pelo seed em `prisma/seed.ts`, `FAIXAS_ATACADO_PROVISORIAS`) e são editáveis pelo painel em Atacado (`/admin/atacado`).
- [ ] CNPJ, cidade, WhatsApp, e-mail, horário de atendimento e Instagram para o rodapé.
- [ ] Respostas das perguntas frequentes, prazos de produção e entrega.
- [ ] Política de troca e devolução.
- [ ] Página de política de privacidade. Depois de criada, ligar o texto do cadastro a ela.
- [ ] Conferir que não sobrou nenhum marcador entre colchetes (`[PREÇO]`, `[FOTO]`, `[RESPOSTA]` etc.) nem link para página inexistente (`/personalizacao`, `/atacado`, `/politica-de-troca`, `/privacidade`).

### Fotos

- [ ] Fotos para os cartões de categoria "Básicas", "Personalizadas" e "Atacado".
- [ ] Pelo menos uma foto da peça real em cada página de produto. As fotos atuais são montagens digitais da estampa sobre modelos.
- [ ] Fotos da "Camiseta lisa" (uma por cor). Hoje a página dela mostra o marcador `[FOTO]`.
- [ ] Testar o envio de fotos pelo celular do pai do Israel. O painel aceita JPG, PNG e WebP até 10 MB. Fotos HEIC (formato do iPhone) são recusadas com uma mensagem; o Safari costuma converter para JPG ao escolher a foto, mas isso precisa ser confirmado no aparelho dele.
- [ ] As fotos de exemplo ficam em `public/fotos`, não no Storage. Ao removê-las pelo painel, sai só o registro; apagar os arquivos de `public/fotos` que não forem mais usados.

### Acesso e segurança

- [x] Criar a conta do Israel e promovê-la a administrador.
- [ ] Criar a conta do pai do Israel em `/cadastro`, confirmar o e-mail e promovê-la a administrador com `npm run admin:promover -- email`. Sem SMTP próprio, o e-mail de confirmação só chega se ele for membro da equipe do projeto no Supabase.
- [ ] Repetir a promoção dos administradores no projeto de produção do Supabase, quando ele for criado.
- [ ] O site não usa a Secret key do Supabase: a promoção de administrador usa a conexão direta com o banco. Se um dia for preciso usá-la, ela fica só no `.env.local` e na Vercel, em variável sem o prefixo `NEXT_PUBLIC_`.
- [ ] Analisar as vulnerabilidades de severidade alta apontadas pelo `npm audit`.

### Publicação

- [ ] Testar uma compra completa de ponta a ponta: cadastro, carrinho, frete, pagamento, e-mail e baixa de estoque.
- [ ] Testar no celular, de verdade, os fluxos que só foram testados pelo servidor: escolha de cor, tamanho e quantidade, carrinho, cálculo de frete, cadastro e login.
- [ ] Ver o pai do Israel cadastrar um produto completo pelo celular (dados, cores e tamanhos, fotos), lançar o estoque dele ("Chegaram peças" e "Corrigir contagem") e ajustar textos e botões do painel conforme as dúvidas dele.
- [ ] Fazer o merge de `dev` em `main`.

## Melhorias para depois

- [ ] Login com o Google.
- [ ] Calcular frete também na página do produto.
- [ ] Cor e tamanho na URL da página de produto (`?cor=preta&tamanho=M`), para compartilhar o link já com a escolha feita.
- [ ] Paginação na listagem de produtos, quando houver mais de 24.
- [ ] Guardar o carrinho na conta do cliente, para continuar a compra em outro aparelho. Hoje ele fica num cookie do navegador.
- [ ] Editar e apagar endereços salvos em "Minha conta". Hoje eles só são criados no checkout.
- [ ] Compra sem conta (só com e-mail). Hoje o login é obrigatório para comprar.
- [ ] Personalização: deixar o cliente enviar novos arquivos junto com o pedido de ajuste. Hoje o ajuste é só texto.
- [ ] Personalização: o cliente cancelar o próprio pedido de personalização antes de aprovar. Hoje só o administrador cancela.
- [ ] Editor de estampa na tela para a personalização (hoje é formulário com envio de arte).
- [ ] Painel de produtos: reduzir as fotos no navegador antes de enviar. Hoje vão no tamanho original (até 10 MB); o site já mostra versões otimizadas, mas o original ocupa espaço no Storage (1 GB no plano gratuito do Supabase).
- [ ] Painel de produtos: arrastar para reordenar fotos (hoje são botões "Subir" e "Descer") e editar ou esconder cores e tamanhos já criados (hoje só dá para criar).
- [ ] Estoque: lançar a chegada de um lote com vários tamanhos numa tela só. Hoje é um tamanho por vez.
- [x] Limpeza de fotos órfãs na pasta `produtos` do Storage: mesmo botão de Manutenção do painel (etapa 13b).
- [ ] Avaliar se o texto do hero e do menu deve dizer que a loja é de camisetas cristãs.
- [ ] Depoimentos de clientes, quando houver avaliações reais.

## Limpeza

- [x] Apagar a pasta `public/hero`, substituída por `public/fotos`. Feito na etapa 1.
- [ ] Apagar os arquivos do modelo inicial do Next: `src/app/favicon.ico` (o ícone da loja é o `src/app/icon.svg`) e os SVGs de exemplo em `public/` (`file.svg`, `globe.svg`, `next.svg`, `vercel.svg`, `window.svg`).
- [ ] Apagar a pasta `Claude outputs` da raiz do projeto.
- [ ] Instalar o GitHub CLI (`winget install GitHub.cli`) para o Claude Code abrir os PRs sozinho.
