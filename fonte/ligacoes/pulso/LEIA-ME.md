# ligacoes/pulso

**O que faz**: `pulso(ctx, x, y, raio, cor, alfa)` desenha um ponto do pulso do tronco (gradiente radial: branco no centro, cor clara no meio e a cor sumindo na borda). O tronco o chama 11 vezes por quadro (cabeça e rastro) e uma vez por nódulo aceso.
**Porta**: `{ pulso }`. **Usa**: `comum/cores`. Só desenha.
**Não mexer**: as três paradas do gradiente (0, 0.45, 1) e os alfas (0.92 e 0.65): são o que o dono aprovou na v09.
**Testar**: `python3 testes/imagens.py`.
