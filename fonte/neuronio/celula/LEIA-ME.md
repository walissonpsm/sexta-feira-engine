# neuronio/celula (juntadora)

**O que faz**: o motor do neurônio: `criar(canvas, opções)` monta a célula (corpo, dendritos, axônio, terminais), os neurônios menores dos módulos, o vidro da esfera e a lupa, e devolve o objeto com `redimensionar`, `passo`, `desenhar`, `receber`, `lupa`... Cada canvas tem o seu neurônio, com estado próprio.
**Porta**: `{ criar }`. **Usa**: `comum/sorteio`, `comum/cores`. **Mexe no DOM** (`dom: sim`: canvases auxiliares e os ouvintes de roda/ponteiro da lupa).
**Nota**: ainda é um bloco só (~2.800 linhas) porque o estado (anatomia, vista, lupa, vidro, minis) é compartilhado; a v0.4.x tira daqui, uma pasta por vez: `dendritos`, `anatomia`, `pintura`, `sinais`, `minis`, `lupa`. O que já saiu está em `fonte/neuronio/*/`.
**NÃO mexer**: o desenho do neurônio (`neuronio.js`, do `neuronio.html` do dono) só muda com o dono pedindo; a ordem das chamadas de `usa.base.acaso()`.
**Testar**: `python3 testes/imagens.py`, `python3 testes/navegador.py`.
