# ligacoes/ponta

**O que faz**: desenha a ponta do axônio: o cone de crescimento (`cone`: leque de filopódios e véu, enquanto a ponta anda), a ventosa (`ventosa`: sino curto e disco côncavo colado ao vidro, com aperto `sq` e anel `anel`) e a `luz`. Também dá as medidas da ventosa: `espVent(s)`, `raioVent(s, R)`, `altVent(s)`.
**Porta**: `{ luz(ctx,x,y,r,cor,a), ventosa(ctx,s,cx,cy,rIn,ang,cor,sq,anel,wTronco), cone(ctx,s,relogio,ax), espVent(s), raioVent(s,R), altVent(s) }`. **Usa**: `comum/cores`. Só desenha: o estado vem de quem chama (`cena/quadro`).
**Não mexer**: a ordem dos traços (contorno escuro, preenchimento, aro) e `ax.p` (0 solta, 1 assentada) vindo de fora; o cone lê `ax.pts`, `ax.corRgb`, `ax.larg`, `ax.p`, `ax.fase`.
**Armadilhas**: a guarda do carregador salva e restaura o canvas em cada chamada; a ventosa já faz o próprio `save/restore`.
**Testar**: `python3 testes/imagens.py` (cenas ciclo-*).
