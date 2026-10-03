# Identidade visual da Carta Viva Camisetas

Identidade aprovada pelo Israel. Vale para todas as telas da loja.

## Conceito

"Carta Viva": a camiseta como mensagem. O logo é um envelope cuja aba forma o "V", fechado com um lacre. O lacre é o único ponto de cor da marca.

O clima é direto e contrastado: preto, branco e cinza claro, títulos pesados em maiúsculas, botões em formato de pílula e cantos bem arredondados.

## Logo

Marca (envelope com lacre) à esquerda e o nome à direita, em duas linhas: `CARTA VIVA` e, abaixo, `CAMISETAS`.

```svg
<svg width="44" height="44" viewBox="0 0 44 44" fill="none" xmlns="http://www.w3.org/2000/svg">
  <rect x="4" y="9" width="36" height="26" rx="4" stroke="currentColor" stroke-width="2.5"/>
  <path d="M5 12 L22 26 L39 12" stroke="currentColor" stroke-width="2.5" stroke-linejoin="round"/>
  <circle cx="22" cy="27" r="4.5" fill="#C8102E"/>
</svg>
```

- O traço usa `currentColor`: preto sobre fundo claro, branco sobre fundo escuro. O lacre é sempre vermelho.
- `CARTA VIVA`: Archivo 800, espaçamento entre letras de 0,2em.
- `CAMISETAS`: Manrope 600, tamanho menor, espaçamento de 0,42em, na cor de texto secundário.
- Crie um componente `Logo` e use a marca também como favicon.

## Cores

| Nome | Hex | Uso |
|---|---|---|
| Tinta | `#141414` | Texto principal, fundos escuros, botão secundário |
| Papel | `#FFFFFF` | Cabeçalho, cartões, texto sobre fundo escuro |
| Fundo | `#F1F1EF` | Fundo geral da página |
| Cinza do produto | `#E2E2DF` | Fundo da foto de produto |
| Borda | `#DEDEDB` | Linhas e divisórias |
| Lacre | `#C8102E` | Botão principal, lacre do logo, destaques pontuais |
| Painel escuro | `#232323` | Cartões sobre fundo Tinta |
| Texto secundário claro | `#5A5A5A` | Legendas sobre fundo claro |
| Texto de apoio claro | `#3F3F3F` | Parágrafos de apoio sobre fundo claro |
| Texto secundário escuro | `#B8B8B8` | Legendas sobre fundo escuro |
| Texto de apoio escuro | `#D6D6D6` | Parágrafos sobre fundo escuro |

Regras:

- O vermelho Lacre aparece pouco: um botão principal por seção, no máximo.
- Não use o vermelho para erro de formulário sem um ícone ou texto junto, para não confundir com a marca.
- Texto sempre com contraste mínimo de 4,5:1.
- Sem modo escuro automático. As seções escuras fazem parte do layout.

## Tipografia

Carregue as duas fontes com `next/font/google`.

- **Archivo** (500, 700, 800, 900): títulos.
  - Título do hero: 900, maiúsculas, `clamp(44px, 6vw, 88px)`, altura de linha 0,98.
  - Título de seção de destaque: 900, maiúsculas, `clamp(34px, 4.4vw, 60px)`.
  - Título de seção de listagem: 500, maiúsculas, `clamp(26px, 3vw, 36px)`, espaçamento de 0,22em, centralizado.
  - Preço: 800, 20px.
- **Manrope** (400, 500, 600, 700): textos, menus e botões.
  - Corpo: 16px, altura de linha 1,5. Parágrafo de destaque: 18px.
  - Menu e botões: 13px, 600 ou 700, maiúsculas, espaçamento de 0,16em a 0,2em.
  - Sobretítulo (rótulo acima do título): 12px, 700, maiúsculas, espaçamento de 0,3em.

## Componentes

- **Botão principal:** fundo Lacre, texto branco, pílula (`border-radius: 999px`), `padding: 16px 36px`.
- **Botão secundário:** fundo Tinta e texto branco; sobre fundo escuro, contorno branco de 1,5px e fundo transparente.
- **Cartão de categoria:** fundo escuro, cantos de 20px, altura mínima de 380px, foto cobrindo o cartão com escurecimento na base e o rótulo embaixo em duas linhas (linha fina de 14px e nome em Archivo 800 de 34px).
- **Cartão de produto:** foto sobre Cinza do produto com cantos de 12px, etiqueta preta no canto superior, nome em maiúsculas de 13px, preço em Archivo e quadradinhos de cor de 18px com cantos de 4px.
- **Painéis:** cantos de 20px a 28px.
- **Ícones:** de traço fino (1,5 a 1,8px), sem preenchimento. Nunca emoji.
- **Área de toque:** mínimo de 44px em botões e ícones.
- **Espaçamento das seções:** `padding` vertical de 72px a 88px e lateral de `clamp(20px, 5vw, 80px)`.

## Estrutura da página inicial

De cima para baixo:

1. **Faixa de aviso** (fundo Tinta, texto branco de 12px): "ENVIAMOS PARA TODO O BRASIL · PIX, CARTÃO E BOLETO".
2. **Cabeçalho** (fundo Papel, borda inferior): logo, menu (Início, Produtos, Personalização, Atacado) e ícones de conta e carrinho.
3. **Hero** (fundo Tinta): sobretítulo "CARTA VIVA CAMISETAS", título "Vista o que você quer dizer.", parágrafo "Camisetas lisas, estampas da casa e peças personalizadas com a sua arte. Para usar, presentear ou vestir a sua equipe.", botões "VER PRODUTOS" (principal) e "PERSONALIZAR" (contorno). À direita, uma composição de duas fotos sobrepostas, descrita em "Composição do hero" abaixo.
4. **Categorias** (4 cartões): Camisetas Básicas, Estampas da Casa, Personalizadas (com a sua arte), Atacado (em quantidade).
5. **Produtos Carta Viva:** grade de produtos e botão "VER TODOS".
6. **Personalização** (fundo Tinta): título "Sua arte, na sua camiseta.", texto "Envie a sua estampa ou conte a ideia. A gente prepara, aprova com você e produz.", três passos (01 Escolha a peça, 02 Envie a sua arte, 03 Aprove e receba) e botão "QUERO PERSONALIZAR".
7. **Atacado** (painel branco): título "Comprando em quantidade?", texto sobre empresas, igrejas, eventos e revenda, e botão "PEDIR ORÇAMENTO".
8. **Vantagens** (fundo Tinta, 4 ícones): Enviamos para todo o Brasil, Compra segura, Pix, cartão e boleto, Troca fácil.
9. **Perguntas frequentes** (fundo Papel): lista em sanfona.
10. **Rodapé** (fundo Fundo): marca, Atendimento, Políticas e Contato.

No celular, as grades viram uma coluna, o menu vira um botão de menu e o hero empilha o texto acima da imagem.

## Fotos disponíveis

As fotos ficam em `public/fotos/`. A pasta `public/hero/` é de uma versão anterior e pode ser apagada.

| Arquivo | O que mostra | Proporção |
|---|---|---|
| `nao-temas-creia-casal.jpg` | Casal com a camiseta azul-marinho "Não temas, creia": frente (estampa pequena no peito) e costas (estampa grande) | 6:5, horizontal |
| `nao-temas-creia-dobrada.jpg` | A mesma camiseta dobrada sobre madeira, frente e costas lado a lado | 3:2, horizontal |
| `nao-me-envergonho-casal.jpg` | Casal com a camiseta branca "Não me envergonho do evangelho": frente (Romanos 1:16) e costas (estampa grande) | quase quadrada |
| `jesus-my-best-friend.jpg` | Mulher com a camiseta preta "Jesus, my best friend", de frente | 3:4, vertical |
| `o-justo-vive-pela-fe.jpg` | Costas da camiseta clara "O justo vive pela fé" | 3:4, vertical |

Onde cada foto entra na página inicial:

- **Hero:** `nao-temas-creia-casal.jpg` (principal) e `jesus-my-best-friend.jpg` (secundária).
- **Cartão de categoria "Estampas da casa":** `nao-me-envergonho-casal.jpg` como fundo, com `object-position: 88% 40%` para enquadrar a estampa das costas, e um degradê escuro só na base, atrás do rótulo.
- **Grade de produtos:** uma foto por produto, em recorte quadrado: `nao-temas-creia-casal.jpg`, `nao-me-envergonho-casal.jpg`, `jesus-my-best-friend.jpg` (`object-position: 50% 45%`) e `o-justo-vive-pela-fe.jpg` (`object-position: 50% 42%`). A foto ocupa o cartão inteiro, sem margem interna, com a etiqueta preta sobre o canto superior esquerdo.
- **Seção Personalização:** `nao-temas-creia-dobrada.jpg` ao lado do título, em cartão 3:2 com cantos de 20px. Ela mostra as duas posições de estampa: pequena no peito e grande nas costas.

Os cartões de categoria "Básicas", "Personalizadas" e "Atacado" continuam com o marcador `[FOTO DA CATEGORIA]` até haver fotos próprias.

## Composição do hero

O lado direito do hero mostra duas fotos sobrepostas.

- **Foto principal:** `nao-temas-creia-casal.jpg`. Cartão com 88% da largura da coluna, proporção 6:5, cantos de 28px, `object-fit: cover` com `object-position: 50% 35%`. No canto inferior esquerdo, uma etiqueta branca em pílula com o texto "ESTAMPA DA CASA" (11px, 700, maiúsculas).
- **Foto secundária:** `jesus-my-best-friend.jpg`. Cartão quadrado com 34% da largura, cantos de 24px e borda de 6px na cor Tinta, no canto inferior direito. Ele fica quase todo abaixo da foto principal (a coluna tem 110px de espaço embaixo) e só encosta no canto dela, para não cobrir a estampa das costas. `object-position: 50% 52%` para enquadrar a estampa.
- **Imagens:** carregadas com `next/image`, com `priority` na principal e texto alternativo descritivo.
- **Sem caixa "SUA ARTE AQUI" sobre as fotos:** as camisetas já têm estampa. A caixa de seleção com alças fica reservada para a página de personalização, sobre a imagem de uma camiseta lisa.

## Conteúdo ainda não fornecido

Estes dados dependem do Israel e do pai dele. Enquanto não chegarem, use marcadores visíveis entre colchetes, como `[PREÇO]`, e nunca invente valores:

- Fotos de produtos e de categorias
- Preços e tabela de descontos do atacado
- CNPJ, cidade, WhatsApp, e-mail e Instagram
- Respostas das perguntas frequentes, prazos e política de troca

Não crie depoimentos de clientes. Uma seção de avaliações só entra quando houver avaliações reais.
