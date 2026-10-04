@AGENTS.md

# Carta Viva Camisetas

E-commerce construído do zero para a Carta Viva Camisetas (CV Camisetas), a loja do pai do Israel. O repositório se chama `loja-camisetas`.

A loja vende camisetas lisas e camisetas com estampas próprias, e também atende personalização (o cliente envia a arte) e atacado (preço menor por quantidade).

## Identidade visual

A identidade aprovada está em `docs/identidade-visual.md`: logo, cores, tipografia, componentes, estrutura da página inicial e textos. Leia esse arquivo antes de criar ou alterar qualquer tela, e siga-o.

Responda sempre em português do Brasil.

## Stack

- Next.js 16 (App Router, pasta `src/`) com TypeScript
- Tailwind CSS 4
- PostgreSQL no Supabase, acessado com Prisma
- Supabase Auth para conta do cliente e login do administrador
- Mercado Pago para pagamento (Pix, cartão e boleto)
- Melhor Envio para cálculo de frete e etiquetas
- Hospedagem na Vercel

Antes de escrever código de Next.js, leia o guia correspondente em `node_modules/next/dist/docs/`, como pede o `AGENTS.md`.

## Fluxo de Git

Este fluxo é obrigatório.

- `main` é produção. A Vercel publica o site a cada push nela.
- `dev` é a branch de desenvolvimento. Ela e a `main` são permanentes.
- Nunca faça commit direto em `main` ou em `dev`.
- Cada funcionalidade nasce de `dev` em uma branch própria, `feat/nome-da-funcionalidade`.
- Ao terminar, faça push da branch e abra um pull request para `dev`.
- Depois do merge, apague a branch (remota e local) e atualize a `dev` com `git pull`.
- Publicar é fazer merge de `dev` em `main`. Só faça isso quando o Israel pedir.
- Mensagens de commit em português, no padrão `tipo: descrição` (`feat`, `fix`, `chore`, `docs`, `refactor`).

Início de cada funcionalidade:

```powershell
git checkout dev
git pull
git checkout -b feat/nome-da-funcionalidade
```

## Ambiente

- Windows com PowerShell. Use comandos compatíveis com PowerShell.
- O caminho do projeto tem espaço (`C:\Users\Daniel Secundo\...`), então coloque caminhos entre aspas.
- Comandos: `npm run dev`, `npm run build`, `npm run lint`.
- Antes de abrir um pull request, rode `npm run lint` e `npm run build` e corrija os erros.

## Regras do projeto

- Segredos ficam em `.env.local`, que nunca entra no Git. Mantenha um `.env.example` atualizado, só com os nomes das variáveis.
- Dados de cartão nunca passam pelo nosso servidor: o pagamento acontece no ambiente do Mercado Pago.
- O estoque é controlado por variação (modelo + cor + tamanho).
- A baixa de estoque só acontece quando o webhook do Mercado Pago confirma o pagamento.
- Preços são guardados em centavos, como número inteiro.
- Textos da interface em português do Brasil.
- Mobile primeiro: a maioria dos clientes compra pelo celular.

## Etapas

Uma branch por etapa, nesta ordem. Marque com `[x]` ao concluir o merge em `dev`.

- [x] 1. `feat/setup-base`: Prisma, conexão com o Supabase, variáveis de ambiente, estrutura de pastas, tema com a identidade visual, cabeçalho, rodapé e página inicial
- [x] 2. `feat/modelagem-banco`: tabelas de produtos, variações, estoque, clientes e pedidos, com dados de exemplo
- [x] 3. `feat/catalogo`: página inicial e listagem de produtos com filtros
- [x] 4. `feat/pagina-produto`: fotos, escolha de cor e tamanho, disponibilidade em estoque
- [x] 5. `feat/carrinho`: adicionar, remover e alterar quantidades
- [x] 6. `feat/frete`: cálculo por CEP via Melhor Envio
- [ ] 7. `feat/autenticacao`: conta do cliente e login do administrador
- [ ] 8. `feat/checkout`: endereço, resumo e criação do pedido
- [ ] 9. `feat/pagamento`: Mercado Pago, confirmação por webhook e baixa de estoque
- [ ] 10. `feat/personalizacao`: formulário em que o cliente escolhe a peça, envia a arte e os dados do pedido; o pedido chega ao painel para aprovação da prévia. Sem editor de estampa na tela nesta versão
- [ ] 11. `feat/atacado`: desconto progressivo por quantidade e formulário de orçamento
- [ ] 12. `feat/admin-produtos`: painel para cadastrar produtos e controlar estoque
- [ ] 13. `feat/admin-pedidos`: lista de pedidos, pedidos de personalização e orçamentos, status e etiqueta de envio
- [ ] 14. `feat/emails`: confirmação de pedido e aviso de envio
- [ ] 15. `feat/paginas-institucionais`: política de troca, privacidade, contato e perguntas frequentes
- [ ] 16. `feat/seo-e-ajustes`: SEO, desempenho e domínio próprio

A identidade visual já entra na etapa 1: o tema do Tailwind, o cabeçalho, o rodapé e a página inicial seguem `docs/identidade-visual.md`. Cores e fontes ficam centralizadas no tema, nunca soltas nos componentes.
