# comum/curvas

**O que faz**: geometria de caminhos: `curva(pontos, passo)` (Catmull-Rom centrípeta reamostrada em passos iguais, em px), `polar(cx, cy, raio, ângulo)`, `volta(ângulo)` (leva a -π..π) e `suave(u)` (3u²−2u³ limitado a 0..1).
**Porta**: `{ curva, polar, volta, suave }`. **Usa**: nada. Sem guarda.
**Não mexer**: o passo da amostragem interna (`Math.ceil(... / 2)`): ele define os vértices de todos os troncos.
**Armadilhas**: afeta tudo que usa trajetos; declarar `Pastas: comum/curvas`.
**Testar**: `python3 testes/imagens.py`.
