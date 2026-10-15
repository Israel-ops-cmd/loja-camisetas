# Pendências da Carta Viva

Lista do que ficou para depois durante o desenvolvimento. A ordem para pôr o site no ar está em `docs/publicacao.md`. Marque com `[x]` o que for resolvido e acrescente o que surgir.

## Obrigatório antes de publicar

### Banco de dados

- [x] Projeto de produção no Supabase criado na região São Paulo, com as migrations e o seed aplicados (10/10/2026). O projeto antigo fica para desenvolvimento e testes.
- [ ] **Dados de exemplo no banco de produção:** o seed criou lá os produtos de exemplo, com preço de teste (R$ 1,00) e 10 peças por variação. Trocar pelos produtos reais ou esconder pelo painel, e lançar o estoque real, antes de abrir a loja.
- [ ] **Migrations novas no banco de produção:** as que vierem depois da criação do projeto (a primeira é `20261010120000_frete_gratis`) precisam ser aplicadas lá com `npx prisma migrate deploy` e o `DIRECT_URL` de produção, antes do deploy que usa o código novo.

### E-mails

- [x] Domínio registrado: **`lojacartaviva.com.br`** (10/10/2026). O `cartavivacamisetas.com.br`, sugerido antes, não será usado.
- [ ] Ligar o domínio na Vercel (Settings > Domains e DNS no Registro.br) **só na publicação**, e preencher `SITE_URL=https://lojacartaviva.com.br` na Vercel. Sem `SITE_URL`, o site não é indexado pelo Google, de propósito.
- [x] Domínio verificado no Resend, na região São Paulo (10/10/2026).
- [ ] Preencher `EMAIL_REMETENTE="Carta Viva <pedidos@lojacartaviva.com.br>"` no `.env.local` e na Vercel. Sem ele, os e-mails da loja saem pelo remetente de teste do Resend.
- [ ] **Antes de publicar: deixar `EMAIL_DESTINO_TESTE` vazio na Vercel.** Preenchido, todos os e-mails dos clientes vão para esse endereço (modo de teste).
- [ ] Preencher na Vercel `RESEND_API_KEY`, `EMAIL_DA_LOJA` (e-mail que o pai do Israel lê, para os avisos de pedido pago, alertas, personalização e orçamento; pode ser `contato@lojacartaviva.com.br`), `EMAIL_RESPONDER_PARA` (opcional) e `SITE_URL` (`https://lojacartaviva.com.br`).
- [ ] Abrir no celular (Gmail e o app de e-mail do iPhone) os 13 tipos de e-mail recebidos no teste de 06/10/2026 e ajustar o que ficar ruim. Os modelos ficam em `src/lib/emails/modelos.ts`.
- [ ] Depois de publicar: colocar o logo como imagem no topo dos e-mails (hoje o nome da loja é escrito em texto; a imagem precisa de um endereço público, que só existe com o site no ar no domínio).
- [x] Prazo de guarda dos e-mails enviados: 12 meses, dito na política de privacidade e apagado pela tarefa diária (etapa 15).
- [x] Prazo de resposta do orçamento: até 2 dias úteis (`PRAZO_DE_RESPOSTA_DO_ORCAMENTO` em `src/lib/politicas.ts`), no e-mail de confirmação, na mensagem do formulário, na página de atacado, nos termos e nas perguntas frequentes.
- [x] SMTP do Supabase **de produção** configurado com o Resend, remetente `nao-responda@lojacartaviva.com.br` (10/10/2026). O projeto de desenvolvimento continua sem SMTP próprio (só entrega para a equipe do projeto).
- [x] Modelos de e-mail do Supabase de produção (Authentication > Emails) em português, com os links de `/auth/confirmar` (10/10/2026):
  - Confirm signup: link `{{ .SiteURL }}/auth/confirmar?token_hash={{ .TokenHash }}&type=email`
  - Reset password: link `{{ .SiteURL }}/auth/confirmar?token_hash={{ .TokenHash }}&type=recovery&next=/redefinir-senha`
- [ ] Depois de editar os modelos, testar a recuperação de senha abrindo o link em outro aparelho. Com o link padrão de hoje, ele só funciona no mesmo navegador em que a senha foi pedida.

### Endereços e variáveis

- [x] Supabase de produção (Authentication > URL Configuration): Site URL e Redirect URLs com `https://lojacartaviva.com.br` (10/10/2026).
- [x] Confirmar que o repositório está conectado à Vercel. As prévias estão funcionando.
- [x] Cadastrar na Vercel (Settings > Environment Variables) as variáveis do `.env.local`.
- [ ] Antes de publicar, trocar na Vercel os valores de teste pelos de produção (banco de produção, Melhor Envio e Mercado Pago). A `DATABASE_URL` precisa estar certa antes do deploy: o build lê o banco para gerar a página inicial.
- [ ] A cada variável nova no `.env.example`, cadastrar também na Vercel.
- [ ] Cadastrar `CRON_SECRET` na Vercel (texto aleatório com 16 caracteres ou mais; o `.env.example` mostra como gerar). Sem ele, a tarefa diária responde 401 e não roda. Para testar no computador, colocar também no `.env.local`.
- [ ] Depois de publicar, conferir na Vercel (Settings > Cron Jobs) que a tarefa diária aparece e, no dia seguinte, ver no log a linha `[tarefa diária]` com o resumo. As tarefas agendadas só rodam na produção (`main`), não nas prévias.
- [ ] Na Vercel, cadastrar a `NEXT_PUBLIC_SUPABASE_URL` só com o endereço base (`https://<projeto>.supabase.co`), sem `/rest/v1/`.
- [x] Região das funções na Vercel em São Paulo (`gru1`, no `vercel.json`), a mesma do banco (`sa-east-1`). Etapa 16. Conferir em Settings > Functions depois do primeiro deploy.

### Frete (Melhor Envio)

- [ ] Criar a conta real do Melhor Envio e trocar o token de sandbox pelo de produção (`MELHOR_ENVIO_AMBIENTE=producao`). O token de produção precisa das mesmas permissões do de sandbox (lista no `.env.example`): cálculo, carrinho, compra, geração, impressão, rastreio, cancelamento, leitura de pedidos e de usuário.
- [ ] Colocar saldo na carteira do Melhor Envio de produção: cada etiqueta comprada pelo painel é paga com esse saldo.
- [ ] Preencher os dados reais do remetente (`MELHOR_ENVIO_REMETENTE_*` no `.env.example`: nome, telefone, CPF ou CNPJ, endereço, número e bairro da loja) no `.env.local` e na Vercel. Sem eles, o painel mostra que faltam dados e não deixa comprar etiqueta. Nos testes foram usados dados fictícios, só no processo do teste.
- [ ] **Nota fiscal (NF-e):** a loja vai emitir NF-e. Hoje as etiquetas saem com declaração de conteúdo (`non_commercial: true` em `src/lib/etiquetas.ts`). Planejar, para quando houver CNPJ e emissor de notas: um campo para a chave da NF-e de cada pedido no painel, enviado ao Melhor Envio em `options.invoice.key` com `non_commercial: false`, e a etiqueta só liberada com a chave preenchida.
- [ ] Testar em produção (ou de novo no sandbox) a etiqueta chegando a "Pronta para imprimir", o PDF impresso e o código de rastreio preenchendo sozinho o campo de "Enviei o pedido". No sandbox, em 06/10/2026, a etiqueta ficou como "paga, sendo gerada" durante todo o teste; compra, toque duplo sem cobrar de novo, impressão (link), cancelamento com o saldo de volta e histórico funcionaram.
- [ ] Pedidos que não cabem num pacote só (o Melhor Envio calcula mais de um volume): o painel avisa e a etiqueta precisa ser feita direto no site do Melhor Envio (Correios não aceita vários volumes num envio só). Avaliar se vale tratar no painel quando houver pedidos grandes de atacado.
- [ ] Pesar uma peça embalada **de cada modelo** e medir o pacote (Modelos, `/admin/modelos`). Desde a `feat/modelos`, o pacote é do modelo, não do produto; todos os modelos começaram com a estimativa provisória de 300 g em 28 × 22 × 4 cm (o Infantil e a Oversized com certeza são diferentes). Canecas, caixinhas e bonés vão precisar das próprias medidas.
- [x] Frete grátis para todo o Brasil a partir de R$ 400,00 em produtos, já com o desconto de atacado (10/10/2026). O valor fica só em `FRETE_GRATIS_A_PARTIR_DE_EM_CENTAVOS` (`src/lib/frete-regras.ts`). A loja paga o valor da opção mais barata: ela sai de graça, e nas mais rápidas o cliente paga só a diferença. O pedido guarda a parte paga pela loja (`freteDescontoEmCentavos`) e a cobrança do Mercado Pago sai sem a linha de frete quando ele é zero. Vale também para os pedidos de personalização.
- [ ] Acompanhar o custo do frete grátis nas etiquetas (o painel mostra, em cada pedido, quanto a loja paga). Se pesar para entregas longas, avaliar limitar por região ou por transportadora.
- [ ] Se houver dias de manuseio ou produção, configurar no painel do Melhor Envio: o prazo mostrado no carrinho já usa os valores personalizados da conta.

### Pagamento (Mercado Pago)

- [ ] Criar a conta do Mercado Pago no CPF ou CNPJ do responsável pela loja.
- [x] Usar credenciais de teste no desenvolvimento: conta vendedora de teste da aplicação ("Ativar credenciais").
- [ ] Criar a aplicação (Checkout Pro) na conta do Mercado Pago do pai do Israel e trocar as credenciais de teste pelas de produção dele, no ambiente de produção e na Vercel (`MERCADO_PAGO_ACCESS_TOKEN` e `MERCADO_PAGO_WEBHOOK_SECRET`).
- [ ] Cadastrar no painel do Mercado Pago, na aplicação da conta que recebe os pagamentos (Webhooks > Configurar notificações, **modo produtivo**, evento "Pagamentos"), a URL definitiva do webhook: `https://<domínio>/api/mercado-pago/webhook`, e usar a assinatura secreta gerada lá. A cobrança não manda mais `notification_url`: os avisos vêm só da URL do painel.
- [x] Parcelamento confirmado: até 6x, com juros por conta do comprador (`MAXIMO_DE_PARCELAS` em `src/lib/pagamento.ts`).
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
- [x] E-mails do pedido para o cliente (etapa 14): pagamento aprovado, pedido enviado com rastreio, pedido cancelado (pela loja, por falta de pagamento, por estorno ou contestação) e lembrete de pagamento no dia seguinte (uma vez por pedido, pela tarefa diária). A loja recebe pedido pago e alertas.

### Atacado e orçamentos

- [x] Editar a tabela de desconto do atacado pelo painel (etapa 12, `/admin/atacado`): faixas, percentuais e ligar/desligar. Travas: até 5 faixas, de 1% a 50%, a partir de 2 peças, desconto maior para quantidade maior.
- [x] Aviso por e-mail para a loja quando chega um pedido de orçamento, e confirmação para quem pediu (etapa 14).
- [x] Prazo de guarda dos orçamentos: 12 meses, dito na política de privacidade (que também explica como pedir a exclusão) e apagado pela tarefa diária. O aviso do formulário tem link para a política (etapa 15).
- [ ] O limite de 3 orçamentos por hora usa o IP informado pela Vercel (`x-forwarded-for`). Conferir em produção que ele vem preenchido; no computador local, todos os envios contam como o mesmo IP.

### Personalização

- [x] Avisos por e-mail (etapa 14): para a loja quando chega um pedido de personalização ou um pedido de ajuste; para o cliente quando o pedido é recebido, quando a prévia fica pronta e quando o pedido é recusado.
- [ ] Revisar o texto da declaração de direito de uso da arte (`DECLARACAO_DE_DIREITOS` em `src/lib/personalizacao-regras.ts`) na revisão jurídica. Ele já aparece nos termos de uso (`/termos#personalizacao`), com link a partir do formulário de personalização (etapa 15).
- [ ] Testar se a loja consegue abrir arquivos `.cdr` (CorelDRAW), `.ai` (Illustrator) e `.psd` (Photoshop) enviados pelos clientes. Se não conseguir, tirar esses formatos de `FORMATOS_DE_ARTE` em `src/lib/personalizacao-regras.ts`.
- [x] Novas peças: os modelos **Baby Look, Oversized, Oversized Premium (estonada) e Infantil** (tamanhos 2 a 14) foram cadastrados com as cores de lançamento e a tabela de medidas (`feat/modelos`, 13/10/2026). A personalização passa a escolher o modelo na `feat/estoque-de-lisas`.
- [x] Prazo de produção da personalização conta da confirmação do pagamento, não da aprovação da prévia, porque a produção só começa com o pedido pago (10/10/2026): "de 1 a 5 dias úteis depois da confirmação do pagamento, conforme a quantidade".
- [ ] O pedido de personalização não confere o estoque das camisetas lisas: o cliente pode pedir mais peças do que há em estoque. A baixa acontece no pagamento, e se faltar peça o pedido fica Pago com alerta (opção C). Avaliar se o orçamento deve conferir o estoque antes de enviar a prévia.
- [x] Limpeza de arquivos esquecidos no Storage (pastas `personalizacao` e `produtos`): botão "Procurar arquivos esquecidos" em Manutenção, no início do painel (decisão: botão com a sessão do administrador, sem chave secreta do Supabase). Apaga só arquivos com mais de um dia que não estão ligados a nenhuma foto de produto nem a nenhum pedido de personalização.
- [x] Artes e prévias de personalizações canceladas ou recusadas: guardadas por 90 dias (política de privacidade). Depois disso entram no botão de Manutenção do painel, que mostra sozinho quantos arquivos estão para limpar (etapa 15).
- [ ] A remoção das artes vencidas depende de alguém tocar em "Sim, apagar" na Manutenção do painel: a tarefa diária não tem permissão para apagar arquivos do Storage (decisão da etapa 13b, sem chave secreta do Supabase). Se o painel ficar muito tempo sem ser aberto, a loja guarda as artes por mais tempo do que a política promete. Se isso virar problema, avaliar usar a Secret key só na tarefa diária.
- [ ] Pedidos guardados por 5 anos (política de privacidade): quando a loja tiver pedidos com mais de 5 anos, criar a limpeza (ou anonimização) deles. Hoje nada é apagado.

### Modelos e estoque de peças lisas

Plano aprovado em 13/10/2026: a peça lisa (modelo + cor + tamanho) é o estoque principal, usado por todas as artes e pela personalização; cada arte pode ter peças prontas. Três branches, nesta ordem, antes do redesign:

- [x] `feat/modelos`: modelos (Tradicional, Baby Look, Oversized, Oversized Premium, Infantil) com cores, tamanhos, tabela de medidas e pacote do frete; tela Modelos no painel; variações com modelo (as existentes viraram Tradicional); tabela de medidas na página do produto.
- [x] `feat/estoque-de-lisas`: estoque de lisas e peças prontas por arte; venda usa primeiro a pronta, senão baixa a lisa e marca "a estampar"; disponibilidade = prontas + lisas, conferida em conjunto no carrinho; personalização escolhe o modelo e baixa das lisas; lista de produção no painel; despacho em até 4 dias úteis quando houver peça a estampar; peça estampada de pedido cancelado volta como pronta da arte.
- [x] `feat/escolha-de-modelo`: o cliente escolhe modelo, depois cor e tamanho, na página do produto; preço por modelo dentro de cada produto, sugerido pelos preços de referência de cada modelo (Tradicional e Baby Look R$ 49,90, Oversized R$ 69,90, Oversized Premium R$ 89,90, Infantil R$ 44,90; lisas Tradicional R$ 29,90, Oversized R$ 44,90, Oversized Premium R$ 59,90), editáveis em Modelos; foto por modelo; filtro por modelo no catálogo. O preço padrão do produto ficou só como reserva.
- [x] **Importador do catálogo de lançamento (`feat/importar-catalogo`, `npm run catalogo:importar`).** Um script que cadastra, a partir de `docs/catalogo-lancamento.md`, as **12 estampas do lançamento** e as **8 da Coleção Carta Viva**: nome, descrição, referência, modelos, cores e preço por modelo, **sem estoque de peças prontas**. As 12 do lançamento entram sem foto. As 8 da coleção usam as imagens de `public/fotos/colecao-carta-viva/` (`<estampa>-<modelo>-<frente|costas>.jpg`): em cada modelo, a frente primeiro e depois as costas, valendo para todas as cores do modelo, até serem trocadas pelas fotos reais. Precisa rodar no banco de teste e no de produção e não pode duplicar nada se rodar duas vezes. Os produtos de exemplo do seed ficam escondidos (desligar "Mostrar na loja"). Decisões de 13/10/2026: "Não temas, creia", "Não me envergonho do evangelho" e "O justo vive pela fé" reaproveitam os produtos de exemplo (mesmo endereço, mantêm as fotos de montagem); as 12 do lançamento sem foto entram escondidas; a "Camiseta lisa" continua visível e ganha Tradicional, Oversized e Oversized Premium com o preço de lisa; tudo em "Estampas da Casa"; referência num campo novo do produto. Cada modelo recebe só as cores do catálogo que ele tem (ex.: "Jesus é o caminho" no Oversized Premium só em Bege). Rodar em produção: ver `docs/publicacao.md`.
- [ ] Confirmar a referência de "Não temas, creia": o catálogo traz Marcos 5:36 "a confirmar". Corrigir pelo painel (campo Referência) se for outra.
- [ ] Fotos das 9 estampas do lançamento que entraram escondidas (Jesus é o caminho, Tudo posso, Nada é impossível, Ele é a nossa paz, Confia, entrega, descansa, Mais de Deus, A verdade vos libertará, Luz do mundo, Fé maior que o medo). Ao adicionar a foto pelo painel, ligar "Mostrar na loja".
- [ ] Trocar as ilustrações da Coleção Carta Viva pelas fotos das peças reais, assim que forem estampadas. Em 16/10/2026 entraram fotos reais no Oversized (frente de Selado, De: Deus / Para: você, Escrito no coração, Logo e Lacre; costas da Carta Viva) e no Oversized Premium (frente do Amém, cor Bege). Para trocar, salve o arquivo com o mesmo nome em `public/fotos/colecao-carta-viva/`. Foto de uma cor só: acrescente a cor no fim do nome (ex.: `carta-viva-oversized-costas-preta.jpg`) e rode `npm run catalogo:importar -- --aplicar`; ela entra marcada com a cor e o modelo.
- [ ] **Estoque de teste nas 3 estampas reaproveitadas:** "Não temas, creia", "Não me envergonho do evangelho" e "O justo vive pela fé" ainda têm as 10 peças prontas de teste do seed (Tradicional), também no banco de produção. Corrigir a contagem em Estoque > Peças prontas (o importador não mexe em estoque), ou zerar todo o estoque de teste de uma vez com `npm run estoque:zerar-teste` (ver `docs/publicacao.md`).
- [x] Regra provisória "cadastrar variações só no Tradicional": não vale mais, a loja mostra a escolha de modelo (`feat/escolha-de-modelo`).
- [ ] **Lançar o estoque real antes de publicar**, em Estoque (`/admin/estoque`): na aba **Peças lisas**, as camisetas sem estampa de cada modelo, cor e tamanho; na aba **Peças prontas**, as já estampadas de cada arte (opcional: sem pronta, a arte vende usando a lisa e entra em Produção). A migration passou o estoque de teste da "Camiseta lisa" para as peças lisas do Tradicional; as artes ficaram com as 10 peças de teste como prontas.
- [ ] Conferir as cores novas (hex aproximado, criado pela migration): Areia, Mescla, Militar, Marrom, Chumbo, Bege, Verde e Azul. Hoje o painel não edita a cor de uma cor já criada: me mande os tons certos (ou uma foto do tecido) para ajustar.
- [ ] Os nomes das cores seguem os já usados na loja: "Preta", "Branca", "Off-white" e "Azul-marinho" (o "marinho" da lista). Renomear depois, se preferir.

### Novos tipos de produto

- [ ] **Canecas, caixinhas e bonés: depois do lançamento** (decisão de 10/10/2026). O cadastro, o carrinho e a página de produto hoje supõem cor e tamanho (camiseta). Plano aprovado, em duas fases:
  - **Fase 1, vender prontos:** tamanho "Único" (e, se precisar, cor "Padrão"), com a escolha escondida e já selecionada na página do produto quando só houver ele; categorias novas (Canecas, Caixinhas, Bonés) nos filtros e nos cartões da página inicial; frete com as medidas de cada produto; tabela de medidas só para os tipos com tamanho; hero e descrições passam a citar os produtos novos.
  - **Fase 2, personalizar:** a personalização hoje é desenhada para camiseta (posições frente, peito e costas, `PosicaoEstampa`, e a ilustração da camiseta). Caneca e boné pedem posições próprias (por exemplo, lados e volta inteira na caneca; frente e lateral no boné). É a parte maior.
  - Perguntas para o Israel responder antes de começar:
    1. Canecas, caixinhas e bonés vão ser vendidos prontos, personalizados ou dos dois jeitos?
    2. O desconto de atacado soma todos os produtos juntos (como hoje) ou cada tipo conta separado?
    3. As categorias continuam fixas no código, ou o pai do Israel deve poder criar categorias pelo painel?

### Conteúdo da loja

Desde a etapa 12, produtos, preços, cores, tamanhos, descrições e fotos são cadastrados pelo painel (`/admin/produtos`). Os dados de exemplo são trocados à mão por ali antes de publicar (decisão: sem botão de apagar dados de exemplo; produtos e variações nunca são apagados, só escondidos).

- [ ] Preços reais de cada produto.
- [ ] Cores e tamanhos disponíveis de cada produto. O estoque é lançado em Estoque (`/admin/estoque`), nas abas Peças lisas e Peças prontas, com "Chegaram peças", "Corrigir contagem" e "Estampar peças" (ver "Lançar o estoque real" acima).
- [ ] Descrição de cada produto, pelo painel. Sem descrição, a página do produto não mostra o bloco; `npm run conferir-marcadores` lista os produtos à venda sem descrição ou sem foto.
- [ ] Esconder pelo painel (desligar "Mostrar na loja") os produtos de exemplo que não forem vendidos de verdade.
- [x] Tabela de medidas por modelo (comprimento, largura e manga), cadastrada em Modelos e mostrada na página do produto só com os tamanhos vendidos, com o aviso "As medidas podem ter pequenas variações" (`feat/modelos`).
- [ ] Produtos reais da categoria "Camisetas Básicas". Hoje ela tem só a "Camiseta lisa" de exemplo (seed: branca, preta, azul-marinho e off-white, P a GG, preço de teste R$ 1,00), que também é a peça base da personalização.
- [x] Tabela de desconto do atacado confirmada (10/10/2026): 10 a 19 peças, 5%; 20 a 49, 10%; 50 ou mais, 15% (total de peças do carrinho, produtos misturados). Editável pelo painel em Atacado (`/admin/atacado`).
- [x] Dados da loja num lugar só (`src/lib/loja.ts`), usados no rodapé, no contato e nas políticas: cidade (Natal/RN), WhatsApp ((84) 98713-7644), endereço (Avenida Interventor Mário Câmara, 2038, Dix-Sept Rosado), horário (todos os dias, das 8h às 18h) e e-mail de atendimento (`contato@lojacartaviva.com.br`).
- [x] Marca: a loja passou a se chamar **Carta Viva** (antes "Carta Viva Camisetas"), porque também vai vender canecas, caixinhas e bonés (10/10/2026). Logo só com `CARTA VIVA`; nome trocado nos títulos, SEO, e-mails, rodapé, políticas, termos e `docs/identidade-visual.md`.
- [ ] **CNPJ e razão social (obrigatório antes de publicar).** A empresa ainda vai ser aberta. O decreto do comércio eletrônico (Decreto 7.962/2013) exige que o site identifique quem vende: nome, CNPJ, endereço e contato. Hoje aparecem `[RAZÃO SOCIAL]` e `[CNPJ]` no rodapé, na privacidade e nos termos.
- [x] Endereço da loja preenchido (exigido pelo mesmo decreto).
- [x] CEP da loja: 59054-600 (10/10/2026).
- [x] Caixa `contato@lojacartaviva.com.br` criada e funcionando (10/10/2026). É o e-mail de atendimento mostrado no rodapé, no contato e nas políticas.
- [x] Horário de atendimento: todos os dias, das 8h às 18h.
- [ ] Criar o Instagram e colocar o endereço em `src/lib/loja.ts`. Enquanto estiver vazio, ele não aparece no site.
- [x] `ATUALIZACAO_DAS_POLITICAS` em `src/lib/loja.ts`: 15 de outubro de 2026. Se a publicação for em outro dia, ou se as políticas mudarem na revisão jurídica, trocar a data.
- [x] Perguntas frequentes em `/perguntas-frequentes` (a página inicial mostra 5, com link). As respostas usam os números do código e a tabela de atacado do banco.
- [x] Prazos confirmados (10/10/2026), em `src/lib/politicas.ts`: despacho em até 2 dias úteis depois da confirmação do pagamento, para peças em estoque; produção da personalização de 1 a 5 dias úteis depois da confirmação do pagamento, conforme a quantidade. Aparecem nos termos, nas perguntas frequentes e nos e-mails de pagamento aprovado e de prévia pronta.
- [x] Política de troca e devolução em `/politica-de-troca` (rascunho): arrependimento em 7 dias, troca de tamanho ou cor, defeito em 90 dias, personalizadas, como pedir e como o dinheiro volta.
- [x] Troca confirmada (10/10/2026): tamanho ou cor em até **7 dias** depois do recebimento, peça sem uso, sem lavar e com etiqueta. A loja paga o frete só da primeira troca e só se for por erro da loja ou por defeito; nos outros casos, o cliente paga. Personalizadas sem troca por tamanho, cor ou mudança de ideia, só por defeito. O arrependimento de 7 dias continua em seção separada.
- [ ] Revisão jurídica: **quem paga o frete da devolução no arrependimento** de 7 dias. Hoje a política diz que a loja paga (o entendimento mais comum do Código de Defesa do Consumidor).
- [x] Arrependimento de 7 dias nas peças personalizadas (15/10/2026): a política diz que vale também para elas, a leitura mais segura do art. 49 do CDC. Se a revisão jurídica concluir que não vale, mudar o texto em `/politica-de-troca#personalizadas`.
- [x] Política de privacidade em `/privacidade` (rascunho, LGPD) e termos de uso em `/termos`, com links no cadastro, no checkout, no formulário de orçamento e no de personalização. Página de contato em `/contato`, só com os canais.
- [ ] **Revisão por advogado ou contador antes de publicar:** política de troca, política de privacidade e termos de uso. Pontos de atenção: arrependimento nas peças personalizadas, frete da devolução no arrependimento, prazo de 90 dias para defeito (bem durável), prazo de 15 dias para responder pedidos da LGPD, bases legais e a declaração de direito de uso da arte. Se a política mudar, a tarefa diária e `src/lib/politicas.ts` mudam junto.
- [ ] Se um dia o site usar ferramenta de análise de visitas ou de anúncios, atualizar a parte de cookies da política de privacidade antes.
- [ ] Antes de publicar, rodar `npm run conferir-marcadores` e resolver tudo o que ele listar: marcadores no código, dados da loja vazios e produtos à venda sem foto ou sem descrição. Ele sai com erro enquanto faltar algo.

### Fotos

- [x] Fotos para os cartões de categoria "Básicas" e "Atacado": os cartões de categoria saíram da página inicial no redesign (16/10/2026).
- [x] Foto do cartão "Personalizadas" e da seção de personalização da página inicial: trabalho real da loja (`personalizacao-pilates-casal.jpg`), sem depoimento e sem nome do cliente.
- [ ] Pelo menos uma foto da peça real em cada página de produto. As fotos atuais são montagens digitais da estampa sobre modelos.
- [ ] Fotos da "Camiseta lisa" (uma por cor), pelo painel. Produto sem foto mostra um ícone de camiseta no lugar.
- [ ] Testar o envio de fotos pelo celular do pai do Israel. O painel aceita JPG, PNG e WebP até 10 MB. Fotos HEIC (formato do iPhone) são recusadas com uma mensagem; o Safari costuma converter para JPG ao escolher a foto, mas isso precisa ser confirmado no aparelho dele.
- [ ] As fotos de exemplo ficam em `public/fotos`, não no Storage. Ao removê-las pelo painel, sai só o registro; apagar os arquivos de `public/fotos` que não forem mais usados.

### Acesso e segurança

- [x] Criar a conta do Israel e promovê-la a administrador.
- [ ] Criar a conta do pai do Israel em `/cadastro`, confirmar o e-mail e promovê-la a administrador com `npm run admin:promover -- email`. Sem SMTP próprio, o e-mail de confirmação só chega se ele for membro da equipe do projeto no Supabase.
- [ ] Promover os administradores no projeto de produção do Supabase (já criado): criar as contas do Israel e do pai em `/cadastro` e rodar `npm run admin:promover -- email` com o `DIRECT_URL` de produção.
- [ ] O site não usa a Secret key do Supabase: a promoção de administrador usa a conexão direta com o banco. Se um dia for preciso usá-la, ela fica só no `.env.local` e na Vercel, em variável sem o prefixo `NEXT_PUBLIC_`.
- [x] Vulnerabilidades altas do `npm audit` analisadas (15/10/2026): as 4 vêm do Prisma CLI (`deepmerge-ts` na leitura da configuração e `mysql2`, que o site não usa: o banco é Postgres). Ficam só na máquina de quem roda os comandos, não no site publicado. O `npm audit fix --force` voltaria o Prisma para a versão 6 e quebraria o projeto; atualizar quando sair uma versão nova do Prisma 7.

### Visual

- [x] **Redesign visual do site** (`feat/redesign`, protótipos aprovados em 16/10/2026, `docs/redesign/`): tema, cabeçalho, rodapé, página inicial, página do produto (com barra fixa de compra no celular) e catálogo; "sacola" no lugar de "carrinho" nos textos; categoria "Coleção Carta Viva". `docs/identidade-visual.md` atualizado.
- [x] Acabamento das telas da loja (`feat/acabamento-lancamento`, 15/10/2026): sacola, checkout, conta, pedido, personalização, atacado, contato e páginas institucionais trocaram os cartões brancos por linhas finas e os cantos arredondados por cantos retos.
- [ ] **Redesign, segunda etapa:** as telas do painel do administrador (hoje só herdaram as cores e as fontes novas). Não impede a publicação.
- [x] Imagem de compartilhamento (`src/app/opengraph-image.tsx`) com as cores do redesign e o texto do hero (15/10/2026). Usa a Manrope; para o título em Cormorant Garamond, como no site, é preciso baixar o arquivo TTF da fonte para `assets/fontes`.

### Publicação

- [ ] **Nome na fatura do cartão (depois do redesign, antes de publicar).** Na criação da cobrança do Mercado Pago (Checkout Pro, `criarCobranca` em `src/lib/mercado-pago.ts`), o `statement_descriptor` é "CARTAVIVA", para o cliente reconhecer a compra. O campo já é enviado desde a etapa de pagamento (04/10/2026). A documentação do Mercado Pago aceita até **13 caracteres** ("CARTAVIVA" tem 9). Falta conferir numa compra real com cartão como o nome aparece na fatura (o banco emissor pode acrescentar um prefixo do Mercado Pago) e ajustar se precisar.
- [ ] Testar uma compra completa de ponta a ponta: cadastro, carrinho, frete, pagamento, e-mail e baixa de estoque.
- [ ] Testar no celular, de verdade, os fluxos que só foram testados pelo servidor: escolha de cor, tamanho e quantidade, carrinho, cálculo de frete, cadastro e login.
- [ ] Ver o pai do Israel cadastrar um produto completo pelo celular (dados, cores e tamanhos, fotos), lançar o estoque dele ("Chegaram peças" e "Corrigir contagem") e ajustar textos e botões do painel conforme as dúvidas dele.
- [ ] Fazer o merge de `dev` em `main` (seguir `docs/publicacao.md`).
- [ ] Depois de publicar: medir no PageSpeed Insights (celular) as páginas inicial, listagem e produto. Localmente (06/10/2026) o desempenho variou de 77 a 96 entre rodadas, porque o Lighthouse roda no mesmo computador do servidor; o número que vale é o de produção. O que mais pesa hoje é o JavaScript das páginas interativas (escolha de cor, tamanho e quantidade) num celular lento.
- [ ] Depois de publicar: mandar um link de produto e o da página inicial no WhatsApp e conferir a prévia (foto, título e descrição). A imagem do produto sai em JPEG (~110 KB) para o WhatsApp mostrar; a das outras páginas é gerada com a marca.
- [ ] Depois de publicar: verificar o domínio no Google Search Console e enviar o `sitemap.xml`.

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
- [ ] Produção: desfazer "Estampadas" marcado por engano. Hoje não tem volta pelo painel (só afeta para onde a peça volta se o pedido for cancelado: pronta da arte em vez de lisa).
- [ ] Produção: feriados nacionais no cálculo do prazo de despacho.
- [ ] Painel de produtos: reduzir as fotos no navegador antes de enviar. Hoje vão no tamanho original (até 10 MB); o site já mostra versões otimizadas, mas o original ocupa espaço no Storage (1 GB no plano gratuito do Supabase).
- [ ] Painel de produtos: arrastar para reordenar fotos (hoje são botões "Subir" e "Descer") e editar ou esconder cores e tamanhos já criados (hoje só dá para criar).
- [ ] Estoque: lançar a chegada de um lote com vários tamanhos numa tela só. Hoje é um tamanho por vez.
- [x] Limpeza de fotos órfãs na pasta `produtos` do Storage: mesmo botão de Manutenção do painel (etapa 13b).
- [ ] Avaliar se o texto do hero e do menu deve dizer que a loja é de camisetas cristãs.
- [ ] Depoimentos de clientes, quando houver avaliações reais.

## Limpeza

- [x] Apagar a pasta `public/hero`, substituída por `public/fotos`. Feito na etapa 1.
- [x] Apagados os arquivos do modelo inicial do Next (`src/app/favicon.ico` e os SVGs de exemplo em `public/`). Etapa 16.
- [ ] Apagar a pasta `Claude outputs` da raiz do projeto.
- [ ] Instalar o GitHub CLI (`winget install GitHub.cli`) para o Claude Code abrir os PRs sozinho.
