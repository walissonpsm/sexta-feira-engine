# neuronio/dendritos

**O que faz**: desenha ramos: `poligonoAfilado(ctx, pts, nivel)` (dendrito até ponta aguda), `ramoEncorpado(ctx, pts, nivel)` (telodendro que se funde ao bulbo), `trilhaSuave(ctx, pts, inicio)` (curva por pontos médios), `bordasRamo(pts)` ({L, R}), `desviar(pts, f)` (linha por dentro do ramo) e `mitocondrias(ctx, pts, ate, rnd, cor, u)`. Os pontos são `{x, y, w}` (w = largura).
**Porta**: `{ poligonoAfilado, ramoEncorpado, trilhaSuave, bordasRamo, desviar, mitocondrias }`. **Usa**: nada. Só desenha; `nivel` (0 longe, 1 de perto: bordas curvas) vem de quem chama.
**Não mexer**: `rnd` das mitocôndrias é o sorteio da célula (a ordem das chamadas define onde elas ficam); o `fill()` é feito aqui dentro (a cor vem do `fillStyle` do contexto).
**Testar**: `python3 testes/imagens.py`.
**Sem guarda (`guarda: nao`) de propósito**: estas funções rodam milhares de vezes por quadro dentro do "assado" da lupa, que tem orçamento de tempo REAL (10 ms por quadro, `avancarAssado`); o salvar/restaurar da guarda deixa cada chamada mais lenta, muda quantas camadas ficam prontas por quadro e a imagem do teste muda. Quando o orçamento deixar de depender do relógio real, a guarda pode ligar.
