# Redesign da Carta Viva

Aprovado pelo Israel em 16/10/2026. Muda só o visual: nenhuma funcionalidade, regra de negócio, rota ou dado muda. Os protótipos estão nesta pasta (`Redesign-Inicio.dc.html`, `Redesign-Produto.dc.html`, `Redesign-Celular.dc.html`). As imagens deles apontam para endereços `/_blob/...` do protótipo: no site, use as fotos que já existem.

Este documento substitui as partes de cor, tipografia e componentes de `docs/identidade-visual.md`. O logo (envelope com lacre) continua o mesmo, mais fino.

## Princípios

- Minimalista: muito espaço em branco, menos elementos por tela, as fotos como protagonistas.
- Linhas finas no lugar de caixas e bordas grossas. Cantos retos (no máximo 2 px).
- O vermelho do lacre aparece só em detalhes pequenos (o lacre do logo, o ponto do prazo de despacho). Nunca em botões ou fundos.
- Sem blocos pretos pesados no meio da página. O preto fica para o botão principal e o rodapé.

## Cores

| Nome | Hex | Uso |
| --- | --- | --- |
| Papel | `#F5F2EC` | Fundo geral |
| Areia | `#ECE6DB` | Faixa de aviso e seções de destaque |
| Fundo da foto | `#E2DED6` | Atrás das fotos de produto |
| Linha | `#DDD6CA` | Divisórias e bordas |
| Borda de opção | `#CFC7BA` | Botões de modelo e tamanho não escolhidos |
| Tinta | `#1C1B19` | Texto, botão principal, rodapé |
| Texto de apoio | `#4A4640` | Parágrafos |
| Texto secundário | `#6B665E` | Legendas, rótulos, preços "a partir de" |
| Lacre | `#C8102E` | Só detalhes pequenos |
| Rodapé, texto | `#E9E4DA` e `#B9B2A6` | Sobre a Tinta |

## Tipografia

- **Cormorant Garamond** (400 e 500, com itálico): títulos, nome do produto, nome no cartão de produto, referências bíblicas (em itálico).
  - Título do hero: 500, `clamp(48px, 5.6vw, 84px)`, altura de linha 1,02.
  - Título de seção: 500, 36 a 44 px.
  - Nome do produto na página: 500, 52 px (38 px no celular).
  - Nome no cartão: 20 a 22 px.
- **Manrope** (400 a 700): textos, menus, botões e preços.
  - Corpo: 16 px, altura de linha 1,6.
  - Rótulos e sobretítulos: 11 a 12 px, 600, maiúsculas, espaçamento de 0,2 a 0,32em.
  - Botões: 13 px, 600, maiúsculas, espaçamento de 0,14 a 0,16em.
- Archivo sai do site.

## Componentes

- **Botão principal:** fundo Tinta, texto branco, sem cantos arredondados, `padding: 16px 34px`.
- **Botão secundário:** só texto com sublinhado de 1 px.
- **Opção de modelo:** caixa com borda de 1 px, nome e preço do modelo. Escolhida: borda Tinta de 1,5 px e fundo branco.
- **Tamanho:** quadrados de 48 px de altura, mesma regra de escolha.
- **Cor:** círculos de 44 px de área de toque, com anel Tinta quando escolhida e o nome da cor ao lado do rótulo.
- **Cartão de produto:** foto quadrada sobre Fundo da foto, nome em Cormorant, referência bíblica, "a partir de R$ X", bolinhas de cor (até 4 e "+N").
- **Seções:** separadas por uma linha fina no topo, com título à esquerda e link "Ver todos" à direita.
- **Informações do produto:** em sanfona (`details`) com linhas finas: Descrição, Medidas do modelo escolhido, Envio e troca.
- **Ícones:** traço de 1,3 a 1,5 px, sem preenchimento.

## Estrutura

**Página inicial:** faixa de aviso (frete grátis acima de R$ 400) · cabeçalho com menu à esquerda, logo no centro e ícones à direita · hero (texto e foto grande) · "Escolha o seu modelo" (4 cartões com preço "a partir de") · Coleção Carta Viva (4 produtos) · "Uma carta que se veste" (faixa areia com foto e texto da marca) · Personalização (passos 01-02-03 e a foto real do casal) · Atacado numa linha (tabela 5%/10%/15% e link de orçamento) · Vantagens (4 itens) · Perguntas frequentes · rodapé escuro.

**Página do produto:** trilha · fotos à esquerda (costas grande, frente e foto vestida) · à direita: coleção, nome, referência, preço, modelo, cor, tamanho, quantidade, botão "Adicionar à sacola", prazo de despacho, sanfonas · "Da mesma coleção".

**Celular:** fotos em carrossel no topo, modelos em linha rolável, e uma barra fixa embaixo com modelo, tamanho, preço e o botão "Adicionar à sacola".

## Interações novas (só visuais)

- No cartão de produto, a foto troca da frente para as costas ao passar o mouse.
- Elementos aparecem com um fade curto ao rolar (respeitando `prefers-reduced-motion`).
- Barra fixa de compra na página do produto, só no celular.
- O ícone de busca do protótipo só entra se a busca já existir; se não existir, fica fora.

## O que não muda

Carrinho, frete, frete grátis, checkout, pagamento, estoque de lisas e prontas, escolha de modelo, personalização, atacado, conta, painel e e-mails continuam funcionando igual. O painel do administrador fica para uma segunda etapa (só cores e fontes novas, sem mudar telas).
