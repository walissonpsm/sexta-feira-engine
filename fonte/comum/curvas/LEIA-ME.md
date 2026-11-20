# comum/curvas

**O que faz**: geometria de caminhos: `curva(pontos, passo)` (Catmull-Rom centrípeta reamostrada em passos iguais, em px), `polar(cx, cy, raio, ângulo)`, `volta(ângulo)` (leva a -π..π) e `suave(u)` (3u²−2u³ limitado a 0..1).
**Desde a v0.5.0** (porta 2) tem também as duas curvas "em volta de um centro" que o axônio usa em volta do Núcleo:
- `chegada(cx, cy, A, tA, E, m, hq)`: de A (direção unitária `tA`) até o terminal E no vidro. O raio desce sem voltar (Hermite cúbica, Fritsch-Carlson) e o ângulo avança sem recuar (Hermite de grau 5, que termina com a curva já reta); os últimos `hq` px são uma reta de frente para o centro (a pista de pouso). Devolve `m` pontos (sem A, o último é E).
- `ponte(cx, cy, A, tA, B, tB, m)`: de A (direção `tA`) até B (direção `tB`), raio e ângulo de Hermite que não voltam. Serve para a descida da saída do agente até a pista. Devolve `m` pontos (sem A, o último é B).

**Porta**: `{ curva, polar, volta, suave, chegada, ponte }`. **Usa**: nada. Sem guarda. `compativel-desde: 1` (quem pede `@1` continua funcionando; quem usa `chegada`/`ponte` pede `@2`).
**Não mexer**: o passo da amostragem interna de `curva` (`Math.ceil(... / 2)`): ele define os vértices de todos os troncos; as 64 amostras e os limites de Fritsch-Carlson de `chegada`/`ponte` (3x, 1,1x, 2,5x, 0,45): são o que faz a curva não mergulhar, não recuar e não dar quina.
**Armadilhas**: (1) `chegada` e `ponte` supõem que `tA`/`tB` são unitárias e que a direção pedida anda no mesmo sentido do ângulo até o ponto final; se a direção pedida vai contra, a inclinação é zerada (a curva sai deitada, sem quina, mas sem seguir a direção). (2) Afetam tudo que usa trajetos; declarar `Pastas: comum/curvas`.
**Testar**: `python3 testes/navegador.py -k curvas_` (as propriedades das duas curvas, num teste de navegador porque as funções só existem na página) e `python3 testes/imagens.py`.
