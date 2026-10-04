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
- [ ] Confirmar que o repositório está conectado à Vercel.
- [ ] Cadastrar na Vercel (Settings > Environment Variables) todas as variáveis do `.env.local`, com os valores de produção. A `DATABASE_URL` precisa estar lá antes do primeiro deploy: o build lê o banco para gerar a página inicial.
- [ ] Na Vercel, cadastrar a `NEXT_PUBLIC_SUPABASE_URL` só com o endereço base (`https://<projeto>.supabase.co`), sem `/rest/v1/`.
- [ ] Configurar a região das funções na Vercel para São Paulo (`gru1`), perto do banco. Na região padrão (Estados Unidos), cada consulta fica mais lenta.

### Frete (Melhor Envio)

- [ ] Criar a conta real do Melhor Envio e trocar o token de sandbox pelo de produção (`MELHOR_ENVIO_AMBIENTE=producao`).
- [ ] Pesar uma camiseta embalada e medir o pacote. Hoje o sistema usa uma estimativa provisória de 300 g em 28 × 22 × 4 cm, gravada como padrão em cada produto.
- [ ] Decidir se haverá frete grátis e com qual regra. Hoje não há.
- [ ] Se houver dias de manuseio ou produção, configurar no painel do Melhor Envio: o prazo mostrado no carrinho já usa os valores personalizados da conta.

### Pagamento (Mercado Pago)

- [ ] Criar a conta do Mercado Pago no CPF ou CNPJ do responsável pela loja.
- [ ] Usar credenciais de teste no desenvolvimento e trocar pelas de produção antes de publicar.

### Pedidos

- [ ] Definir o que acontece quando o pagamento é confirmado e o estoque já acabou (etapa 9). Como o estoque só baixa no pagamento, dois clientes podem criar pedido para a mesma última unidade.
- [ ] Prazo para cancelar automaticamente pedidos que ficarem sem pagamento (etapa 9).
- [ ] E-mail de confirmação do pedido para o cliente (etapa 14). Hoje ele vê o pedido só na página do pedido e em "Minha conta".

### Conteúdo da loja

- [ ] Preços reais de cada produto.
- [ ] Cores e tamanhos disponíveis de cada produto, com o estoque real.
- [ ] Descrição de cada produto. Hoje a página mostra o marcador `[DESCRIÇÃO DO PRODUTO]`.
- [ ] Tabela de medidas por tamanho. Hoje a página mostra o marcador `[TABELA DE MEDIDAS]`.
- [ ] Produtos da categoria "Camisetas Básicas". Hoje ela está vazia e mostra "Nenhum produto encontrado".
- [ ] Tabela de descontos do atacado.
- [ ] CNPJ, cidade, WhatsApp, e-mail, horário de atendimento e Instagram para o rodapé.
- [ ] Respostas das perguntas frequentes, prazos de produção e entrega.
- [ ] Política de troca e devolução.
- [ ] Página de política de privacidade. Depois de criada, ligar o texto do cadastro a ela.
- [ ] Conferir que não sobrou nenhum marcador entre colchetes (`[PREÇO]`, `[FOTO]`, `[RESPOSTA]` etc.) nem link para página inexistente (`/personalizacao`, `/atacado`, `/politica-de-troca`, `/privacidade`).

### Fotos

- [ ] Fotos para os cartões de categoria "Básicas", "Personalizadas" e "Atacado".
- [ ] Pelo menos uma foto da peça real em cada página de produto. As fotos atuais são montagens digitais da estampa sobre modelos.

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
- [ ] Editor de estampa na tela para a personalização (hoje é formulário com envio de arte).
- [ ] Avaliar se o texto do hero e do menu deve dizer que a loja é de camisetas cristãs.
- [ ] Depoimentos de clientes, quando houver avaliações reais.

## Limpeza

- [x] Apagar a pasta `public/hero`, substituída por `public/fotos`. Feito na etapa 1.
- [ ] Apagar os arquivos do modelo inicial do Next: `src/app/favicon.ico` (o ícone da loja é o `src/app/icon.svg`) e os SVGs de exemplo em `public/` (`file.svg`, `globe.svg`, `next.svg`, `vercel.svg`, `window.svg`).
- [ ] Apagar a pasta `Claude outputs` da raiz do projeto.
- [ ] Instalar o GitHub CLI (`winget install GitHub.cli`) para o Claude Code abrir os PRs sozinho.
