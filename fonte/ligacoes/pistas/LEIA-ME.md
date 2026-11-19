# ligacoes/pistas

**O que faz**: `caminho(N, rv, ax)` devolve a linha do axônio agente→Núcleo (`ax.head`, arco por fora do vidro num raio por agente, e a chegada de frente no ponto do módulo), já reamostrada por `curva`. Só geometria.
**Porta**: `{ caminho }`. **Usa**: `comum/curvas`. `N` = `{cx, cy, R}` do Núcleo; `rv` = raio do centro da ventosa (de `ponta.raioVent`).
**Lê de `ax`**: `head, rA, thL, dC, drop, p, passo`. **Não mexer**: as constantes 0.30/0.40/1.3/0.55/10/14 e o expoente 1.6 (o desenho aprovado).
**Testar**: `python3 testes/imagens.py` (cenas ciclo-*).
