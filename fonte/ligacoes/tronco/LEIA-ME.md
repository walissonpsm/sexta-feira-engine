# ligacoes/tronco (juntadora)

**O que faz**: tudo do tronco do axônio que não é estado: `medir(s, ax)` (comprimento, normais, caixa, pontos lisos), `ponto(ax, u)`, `trechos(s, ax)` (as bainhas), `pintar(ctx, s, relogio, ax)` (fio, bainhas, nódulos acesos, pulso com rastro e a ponta: cone enquanto solta, ventosa quando assenta).
**Porta**: `{ medir, ponto, trechos, pintar }`. **Usa**: `comum/cores`, `comum/curvas`, `ligacoes/ponta`, `ligacoes/pulso` (é a juntadora da camada). O estado do axônio (`ax.p`, `ax.pulso`, `ax.nos`...) é de `cena/quadro`.
**Lê/escreve em `ax`**: lê `base, larg, a0, corRgb, pulsoCor, vent, p, tipo, fase`; `medir` escreve `cum, nx, ny, len, bb, pts`; `trechos` escreve `pitch, nNos`.
**Não mexer**: a ordem dos traços (escuro, cor, brilho) e as espessuras `QG`; o tronco é liso e parado (só a ponta se mexe).
**Testar**: `python3 testes/imagens.py`.
