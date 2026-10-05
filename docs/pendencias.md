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
- [ ] Na Vercel, cadastrar a `NEXT_PUBLIC_SUPABASE_URL` só com o endereço base (`https://<projeto>.supabase.co`), sem `/rest/v1/`.
- [ ] Configurar a região das funções na Vercel para São Paulo (`gru1`), perto do banco. Na região padrão (Estados Unidos), cada consulta fica mais lenta.

### Frete (Melhor Envio)

- [ ] Criar a conta real do Melhor Envio e trocar o token de sandbox pelo de produção (`MELHOR_ENVIO_AMBIENTE=producao`).
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
  - [ ] Página do pedido: conferir o pagamento na API sempre que o cliente abrir um pedido pendente, e não só na volta do Mercado Pago (hoje só confere com `?retorno=`). Limitar a uma conferência por pedido a cada minuto, para não chamar a API a cada recarga. Entra na etapa 13 (`feat/admin-pedidos`).
  - [ ] Painel do administrador: botão "Conferir pagamento" em cada pedido pendente. Entra na etapa 13 (`feat/admin-pedidos`).
  - [ ] Tarefa agendada (Vercel Cron) que confere os pedidos pendentes dentro do prazo de pagamento. Pode ser a mesma tarefa que cancela os pedidos não pagos depois de 3 dias (item em "Pedidos"). No plano gratuito da Vercel, tarefas agendadas rodam no máximo uma vez por dia; para conferir com mais frequência, é preciso o plano pago ou um agendador externo. Entra na etapa 13 (`feat/admin-pedidos`).
- [ ] Testar com cartão real os meios que não passaram no ambiente de teste. O Mastercard de teste `5031 4332 1540 6351` foi recusado no checkout do Mercado Pago com "A transação não aceita este meio de pagamento", logo ao digitar o número. A cobrança não exclui nenhum meio, e o Mastercard de crédito está ativo na conta vendedora de teste, então tudo indica uma limitação do ambiente de teste. Confirmar com um Mastercard real no pagamento de valor baixo antes de publicar.
- [ ] Testar no ambiente de teste os casos de cartão recusado (titular `OTHE`) e pendente (`CONT`), e um Pix ou boleto pago depois (depende do webhook).
- [ ] Antes de publicar, fazer um pagamento real de valor baixo em produção e estornar, para conferir webhook, baixa de estoque e devolução. **Pagar e fechar a aba sem voltar à loja**: o pedido precisa virar "Pago" pelo webhook (no log: `[webhook] pagamento … processado`). Esse é o teste que valida a assinatura.

### Pedidos

- [x] Definir o que acontece quando o pagamento é confirmado e o estoque já acabou: o pedido fica PAGO com alerta para o administrador decidir entre produzir ou estornar (opção C). O estoque fica negativo, indicando quantas peças faltam.
- [ ] Cancelamento automático de pedidos não pagos depois de 3 dias, com uma tarefa agendada (Vercel Cron). Hoje a cobrança vence em 3 dias e o pedido mostra que o prazo terminou, mas continua como "Aguardando pagamento".
- [ ] Mostrar no painel os alertas dos pedidos (pago sem estoque, valor divergente, pagamento aprovado em pedido cancelado) e permitir estornar pelo painel (etapa 13).
- [ ] E-mail de confirmação do pedido para o cliente (etapa 14). Hoje ele vê o pedido só na página do pedido e em "Minha conta".

### Personalização

- [ ] Avisos por e-mail (etapa 14): para a loja quando chega um pedido de personalização ou um pedido de ajuste; para o cliente quando a prévia é enviada. Hoje ninguém é avisado: a loja precisa abrir o painel (o início do painel mostra quantos pedidos esperam prévia) e o cliente precisa abrir "Minha conta".
- [ ] Revisar o texto da declaração de direito de uso da arte (`DECLARACAO_DE_DIREITOS` em `src/lib/personalizacao-regras.ts`) e ligá-lo aos termos de uso quando as páginas institucionais existirem (etapa 15). Hoje o site grava a data e a hora em que o cliente confirmou a declaração.
- [ ] Confirmar com o pai do Israel se ele consegue abrir arquivos `.cdr` (CorelDRAW), `.ai` (Illustrator) e `.psd` (Photoshop). Se não conseguir, tirar esses formatos de `FORMATOS_DE_ARTE` em `src/lib/personalizacao-regras.ts`.
- [ ] Confirmar com o pai do Israel quais outras peças podem ser personalizadas (baby look, infantil etc.). Elas entram pelo painel na etapa 12, como produtos da categoria "Camisetas Básicas", que é de onde a personalização tira as peças.
- [ ] O pedido de personalização não confere o estoque das camisetas lisas: o cliente pode pedir mais peças do que há em estoque. A baixa acontece no pagamento, e se faltar peça o pedido fica Pago com alerta (opção C). Avaliar se o orçamento deve conferir o estoque antes de enviar a prévia.
- [ ] Limpeza de arquivos abandonados no Storage (pasta privada `personalizacao`): artes enviadas em formulários que não foram concluídos, e arquivos de pedidos cancelados. Só o administrador pode apagar (regra do Storage); fazer junto com as tarefas agendadas da etapa 13 ou por um botão no painel.

### Conteúdo da loja

- [ ] Preços reais de cada produto.
- [ ] Cores e tamanhos disponíveis de cada produto, com o estoque real.
- [ ] Descrição de cada produto. Hoje a página mostra o marcador `[DESCRIÇÃO DO PRODUTO]`.
- [ ] Tabela de medidas por tamanho. Hoje a página mostra o marcador `[TABELA DE MEDIDAS]`.
- [ ] Produtos reais da categoria "Camisetas Básicas". Hoje ela tem só a "Camiseta lisa" de exemplo (seed: branca, preta, azul-marinho e off-white, P a GG, preço de teste R$ 1,00), que também é a peça base da personalização.
- [ ] Tabela de descontos do atacado.
- [ ] CNPJ, cidade, WhatsApp, e-mail, horário de atendimento e Instagram para o rodapé.
- [ ] Respostas das perguntas frequentes, prazos de produção e entrega.
- [ ] Política de troca e devolução.
- [ ] Página de política de privacidade. Depois de criada, ligar o texto do cadastro a ela.
- [ ] Conferir que não sobrou nenhum marcador entre colchetes (`[PREÇO]`, `[FOTO]`, `[RESPOSTA]` etc.) nem link para página inexistente (`/personalizacao`, `/atacado`, `/politica-de-troca`, `/privacidade`).

### Fotos

- [ ] Fotos para os cartões de categoria "Básicas", "Personalizadas" e "Atacado".
- [ ] Pelo menos uma foto da peça real em cada página de produto. As fotos atuais são montagens digitais da estampa sobre modelos.
- [ ] Fotos da "Camiseta lisa" (uma por cor). Hoje a página dela mostra o marcador `[FOTO]`.

### Acesso e segurança

- [x] Criar a conta do Israel e promovê-la a administrador.
- [ ] Criar a conta do pai do Israel em `/cadastro`, confirmar o e-mail e promovê-la a administrador com `npm run admin:promover -- email`. Sem SMTP próprio, o e-mail de confirmação só chega se ele for membro da equipe do projeto no Supabase.
- [ ] Repetir a promoção dos administradores no projeto de produção do Supabase, quando ele for criado.
- [ ] O site não usa a Secret key do Supabase: a promoção de administrador usa a conexão direta com o banco. Se um dia for preciso usá-la, ela fica só no `.env.local` e na Vercel, em variável sem o prefixo `NEXT_PUBLIC_`.
- [ ] Analisar as vulnerabilidades de severidade alta apontadas pelo `npm audit`.

### Publicação

- [ ] Testar uma compra completa de ponta a ponta: cadastro, carrinho, frete, pagamento, e-mail e baixa de estoque.
- [ ] Testar no celular, de verdade, os fluxos que só foram testados pelo servidor: escolha de cor, tamanho e quantidade, carrinho, cálculo de frete, cadastro e login.
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
- [ ] Avaliar se o texto do hero e do menu deve dizer que a loja é de camisetas cristãs.
- [ ] Depoimentos de clientes, quando houver avaliações reais.

## Limpeza

- [x] Apagar a pasta `public/hero`, substituída por `public/fotos`. Feito na etapa 1.
- [ ] Apagar os arquivos do modelo inicial do Next: `src/app/favicon.ico` (o ícone da loja é o `src/app/icon.svg`) e os SVGs de exemplo em `public/` (`file.svg`, `globe.svg`, `next.svg`, `vercel.svg`, `window.svg`).
- [ ] Apagar a pasta `Claude outputs` da raiz do projeto.
- [ ] Instalar o GitHub CLI (`winget install GitHub.cli`) para o Claude Code abrir os PRs sozinho.
