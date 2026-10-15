# Identidade visual da Carta Viva

Identidade aprovada pelo Israel. Vale para todas as telas da loja. Desde o redesign de 16/10/2026, cores, tipografia, componentes e estrutura seguem `docs/redesign/redesign.md` e os protótipos da mesma pasta; este documento resume o que está no site e guarda o logo, as fotos e as regras de conteúdo.

## Conceito

"Carta Viva": a peça como mensagem. A loja vende camisetas e personalizados (canecas, caixinhas e bonés também estão nos planos), por isso o nome é só "Carta Viva". O logo é um envelope cuja aba forma o "V", fechado com um lacre. O lacre é o único ponto de cor da marca.

**Posicionamento (15/10/2026):** a camiseta é o carro-forte, e a loja vende para todos os públicos. As estampas cristãs são uma das linhas (a Coleção Carta Viva, que deu origem ao nome); outras estampas, de outros temas, entram com o tempo. O título da página inicial é "Vista o que você quer dizer." Os textos são verdadeiros e conversados, como quem atende no balcão: nada de promessa que a loja não cumpre nem frase de efeito vazia.

O clima é minimalista, leve e editorial: muito espaço em branco, fundo papel, linhas finas no lugar de caixas, cantos retos (no máximo 2 px), títulos em serifa e as fotos como protagonistas. O preto fica para o botão principal e o rodapé.

## Logo

Marca (envelope com lacre) à esquerda e o nome à direita, em uma linha: `CARTA VIVA`. (Até outubro de 2026 havia uma segunda linha, `CAMISETAS`, retirada quando a loja passou a vender outros produtos.)

```svg
<svg width="44" height="44" viewBox="0 0 44 44" fill="none" xmlns="http://www.w3.org/2000/svg">
  <rect x="4" y="9" width="36" height="26" rx="3" stroke="currentColor" stroke-width="1.8"/>
  <path d="M5 12 L22 26 L39 12" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/>
  <circle cx="22" cy="27" r="4" fill="#C8102E"/>
</svg>
```

- O traço usa `currentColor`: Tinta sobre fundo claro, claro sobre o rodapé. O lacre é sempre vermelho.
- `CARTA VIVA`: Manrope 600, 14px, espaçamento entre letras de 0,32em.
- Componentes `Marca` e `Logo` em `src/components/marca/Logo.tsx`; a marca também é o favicon.

## Cores

Ficam só no tema (`src/app/globals.css`); os componentes usam os nomes do tema.

| Nome no tema | Hex | Uso |
|---|---|---|
| `fundo` (Papel) | `#F5F2EC` | Fundo geral |
| `areia` | `#ECE6DB` | Faixa de aviso, seções de destaque e topo das páginas institucionais |
| `produto` | `#E2DED6` | Atrás das fotos de produto |
| `borda` | `#DDD6CA` | Divisórias e bordas |
| `opcao` | `#CFC7BA` | Botões de modelo e tamanho não escolhidos |
| `tinta` | `#1C1B19` | Texto, botão principal, rodapé |
| `papel` | `#FFFFFF` | Texto sobre a Tinta e opção escolhida |
| `apoio` | `#4A4640` | Parágrafos |
| `secundario` | `#6B665E` | Legendas, rótulos, "a partir de" |
| `lacre` | `#C8102E` | Só detalhes pequenos: o lacre do logo e o ponto do prazo de despacho |
| `apoio-escuro` / `secundario-escuro` | `#E9E4DA` / `#B9B2A6` | Texto sobre o rodapé |

Regras:

- O vermelho nunca vai em botão nem em fundo.
- Não use o vermelho para erro de formulário sem um ícone ou texto junto, para não confundir com a marca.
- Texto sempre com contraste mínimo de 4,5:1.
- Sem modo escuro automático.

## Tipografia

Carregadas com `next/font/google` em `src/app/layout.tsx`.

- **Cormorant Garamond** (400 e 500, com itálico): títulos, nome do produto, nome no cartão de produto e referências bíblicas (em itálico). Utilitários `titulo-hero`, `titulo-destaque` e `titulo-listagem`.
- **Manrope** (400 a 700): textos, menus, botões e preços. Utilitários `sobretitulo`, `rotulo` (MODELO, COR, TAMANHO) e `texto-menu` (botões).

## Componentes

- **Botões** (`src/components/ui/Botao.tsx`): `principal` (fundo Tinta, texto branco, cantos retos), `secundario` (contorno fino de Tinta), `texto` (só texto com sublinhado de 1 px) e `contorno` (sobre fundo escuro).
- **Opções de modelo e tamanho:** borda de 1 px (`opcao`); escolhida, borda Tinta de 1,5 px e fundo branco. **Cor:** círculos com área de toque de 44 px e anel Tinta quando escolhida.
- **Cartão de produto:** foto quadrada sobre `produto` (troca para a segunda foto, as costas, ao passar o mouse), nome em Cormorant, referência, "a partir de R$ X" e até 4 bolinhas de cor com "+N".
- **Seções:** separadas por uma linha fina no topo, com título à esquerda e link à direita (`CabecalhoDaSecao`). Largura máxima de 1440 px (utilitário `largura`).
- **Informações do produto:** em sanfona com linhas finas: Descrição, Medidas do modelo escolhido, Envio e troca.
- **Ícones:** traço fino (1,3 a 1,5 px), sem preenchimento. Nunca emoji.
- **Área de toque:** mínimo de 44 px em botões e ícones.
- **Movimento:** fade curto ao rolar (`AoRolar`), desligado com "reduzir movimento" no aparelho.

## Estrutura

**Página inicial:** faixa areia (frete grátis acima de R$ 400) · cabeçalho com menu à esquerda (Coleção Carta Viva, Estampas, Lisas, Personalizar, Atacado), logo no centro e conta e sacola à direita · hero · "Escolha o seu modelo" · Coleção Carta Viva (4 estampas, destaques primeiro) · "Uma carta que se veste" · Personalização · Atacado numa linha (tabela do painel) · Vantagens · Perguntas frequentes · rodapé escuro.

**Página do produto:** trilha · fotos (a primeira grande e as outras em grade) · categoria, nome, referência, preço e condições · modelo, cor, tamanho, quantidade, "Adicionar à sacola" e prazo de despacho · sanfonas · "Da mesma coleção".

**Celular:** menu em botão, fotos do produto em carrossel, modelos em linha rolável e barra fixa embaixo com modelo, tamanho, preço e o botão "Adicionar à sacola".

A loja chama o carrinho de **sacola** nos textos; o endereço continua `/carrinho`.

## Fotos disponíveis

As fotos ficam em `public/fotos/`. As da Coleção Carta Viva ficam em `public/fotos/colecao-carta-viva/` e são cadastradas pelo importador do catálogo.

| Arquivo | O que mostra | Proporção |
|---|---|---|
| `nao-temas-creia-casal.jpg` | Casal com a camiseta azul-marinho "Não temas, creia": frente (estampa pequena no peito) e costas (estampa grande) | 6:5, horizontal |
| `nao-temas-creia-dobrada.jpg` | A mesma camiseta dobrada sobre madeira, frente e costas lado a lado | 3:2, horizontal |
| `personalizacao-pilates-casal.jpg` | Trabalho real de personalização: casal na praia com camisetas cinza com a arte de um estúdio de pilates | 4:5, vertical |
| `nao-me-envergonho-casal.jpg` | Casal com a camiseta branca "Não me envergonho do evangelho": frente (Romanos 1:16) e costas (estampa grande) | quase quadrada |
| `jesus-my-best-friend.jpg` | Mulher com a camiseta preta "Jesus, my best friend", de frente | 3:4, vertical |
| `o-justo-vive-pela-fe.jpg` | Costas da camiseta clara "O justo vive pela fé" | 3:4, vertical |

Onde cada foto entra na página inicial:

- **Hero:** `nao-temas-creia-casal.jpg`, em 4:5 com `object-position: 50% 35%` e a legenda "Não temas, creia · Tradicional azul-marinho".
- **"Escolha o seu modelo":** uma foto de cada modelo, vinda das fotos da Coleção Carta Viva (as costas, de preferência).
- **Coleção Carta Viva:** a primeira foto de cada estampa; ao passar o mouse, a segunda.
- **"Uma carta que se veste":** `nao-temas-creia-dobrada.jpg`, em 3:2.
- **Personalização:** `personalizacao-pilates-casal.jpg`, em 4:5 com `object-position: 50% 30%` e a legenda "Feita pela Carta Viva para um estúdio de pilates". Texto alternativo: "Casal na praia vestindo camisetas cinza personalizadas com a arte de um estúdio de pilates". Sem depoimento e sem nome do cliente.

## Conteúdo ainda não fornecido

Estes dados dependem do Israel e do pai dele. Enquanto não chegarem, use marcadores visíveis entre colchetes, como `[PREÇO]`, e nunca invente valores:

- Fotos de produtos
- CNPJ e razão social
- Revisão jurídica das políticas

Não crie depoimentos de clientes. Uma seção de avaliações só entra quando houver avaliações reais.
