# ligacoes/pistas

**O que faz**: o caminho do axônio do agente até o vidro do Núcleo. Só geometria.
- `esboco(N, rv, ax, pl, s)` (desde a v0.5.0, porta 2): os pontos do esboço (sem suavizar). Sai do agente na direção em que o axônio sai (`ax.head`), desce por uma `ponte` de Hermite até uma pista em volta do Núcleo (raio = `rv + 100·s` mais `pl.lane` degraus de `22·s + 4` px, tanto menos quanto mais perto o terminal está de frente), corre pelo arco da pista e chega por uma `chegada` de Hermite que termina numa reta curta de frente para o vidro. Terminal quase de frente: uma `chegada` só. `pl = { dir: lado (+1 ou -1), lane: qual pista }`.
- `caminho(N, rv, ax)`: a linha pronta (reamostrada por `curva`). Com `ax.plano` e `ax.sc` (todo axônio de entrada dos módulos, desde a v0.5.0) é o `esboco`; sem eles é o desenho antigo (arco por fora do vidro num raio por agente e a chegada com gancho), que ainda serve ao que não tem plano.

**Porta**: `{ caminho, esboco }`. **Usa**: `comum/curvas@2`. `N` = `{cx, cy, R}` do Núcleo; `rv` = raio do centro da ventosa (de `ponta.raioVent`).
**Lê de `ax`**: `head, rA, thL, dC, drop, p, passo, plano, sc`. Quem escolhe lado e pista (`ax.plano`) é `cena/rotas`; o ajuste fino é de `ligacoes/caminho`.
**Não mexer**: no desenho antigo, as constantes 0.30/0.40/1.3/0.55/10/14 e o expoente 1.6; no esboço, a divisão da ponte e da chegada (`phi`, `psi`, `hq`, o 1.2 e o 1.1) e o limite `phi + psi + 0.05` que decide entre uma curva só ou ponte + pista + chegada: foi ajustado nas 4 telas de teste.
**Armadilhas**: o esboço só dá certo quando `ax.head` tem 3 pontos e a saída está fora do vidro; a pista de fora tem de ter o raio maior (a altura da pista decide quem passa por cima de quem).
**Testar**: `python3 testes/navegador.py -k chegam_de_frente -k uma_volta -k correm_um_em_cima` e `python3 testes/imagens.py`.
