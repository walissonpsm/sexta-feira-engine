# MAPA das partes (gerado por ferramentas/montar-interface.sh: não edite)

Camadas (só se usa o que está embaixo): base < comum < neuronio, ligacoes, dados < cena < tela. 'juntadora' é a única parte da camada que pode usar as irmãs.

| parte | tipo | porta | compatível desde | requer | usado por | arquivo gerado |
|---|---|---|---|---|---|---|
| base/carregador | js-cru | 1 | 1 | - | - | sf.js |
| comum/cores | js | 1 | 1 | - | ligacoes/pulso ligacoes/ponta neuronio/minis neuronio/anatomia ligacoes/tronco neuronio/celula cena/quadro  | sf.js |
| comum/curvas | js | 1 | 1 | - | ligacoes/pistas ligacoes/tronco cena/quadro  | sf.js |
| comum/ramos | js | 1 | 1 | - | neuronio/escala neuronio/terminais neuronio/dendritos neuronio/corpo neuronio/axonio neuronio/celula  | sf.js |
| comum/sorteio | js | 1 | 1 | - | neuronio/terminais neuronio/minis neuronio/dendritos neuronio/corpo neuronio/axonio neuronio/anatomia neuronio/celula cena/quadro  | sf.js |
| cores/cores | css | 1 | 1 | - | - | cores.css |
| dados/ficticios | js-cru | 1 | 1 | - | - | dados-ficticios.js |
| dados/limpa | js | 1 | 1 | - | tela/inicio  | tela.js |
| laboratorio/neuronio | html | 1 | 1 | - | - | neuronio.html |
| neuronio/recorte | js | 1 | 1 | - | neuronio/celula  | neuronio.js |
| neuronio/sinais | js | 1 | 1 | - | neuronio/celula  | neuronio.js |
| neuronio/tinta | js | 1 | 1 | - | neuronio/celula  | neuronio.js |
| tela/estilo | css | 1 | 1 | - | - | tela.css |
| tela/pagina | html | 1 | 1 | - | - | index.html |
| ligacoes/pulso | js | 1 | 1 | comum/cores@1 | ligacoes/tronco cena/quadro  | ligacoes.js |
| ligacoes/ponta | js | 1 | 1 | comum/cores@1 | ligacoes/tronco cena/quadro  | ligacoes.js |
| ligacoes/pistas | js | 1 | 1 | comum/curvas@1 | cena/quadro  | ligacoes.js |
| neuronio/escala | js | 1 | 1 | comum/ramos@1 | neuronio/celula  | neuronio.js |
| neuronio/terminais | js | 1 | 1 | comum/ramos@1 comum/sorteio@1 | neuronio/celula  | neuronio.js |
| neuronio/minis | js | 1 | 1 | comum/sorteio@1 comum/cores@1 | neuronio/celula  | neuronio.js |
| neuronio/dendritos | js | 1 | 1 | comum/ramos@1 comum/sorteio@1 | neuronio/celula  | neuronio.js |
| neuronio/corpo | js | 1 | 1 | comum/ramos@1 comum/sorteio@1 | neuronio/celula  | neuronio.js |
| neuronio/axonio | js | 1 | 1 | comum/ramos@1 comum/sorteio@1 | neuronio/celula  | neuronio.js |
| neuronio/anatomia | js | 1 | 1 | comum/sorteio@1 comum/cores@1 | neuronio/celula  | neuronio.js |
| ligacoes/tronco (juntadora) | js | 1 | 1 | comum/cores@1 comum/curvas@1 ligacoes/ponta@1 ligacoes/pulso@1 | cena/quadro  | ligacoes.js |
| neuronio/celula (juntadora) | js | 1 | 1 | comum/sorteio@1 comum/cores@1 comum/ramos@1 neuronio/recorte@1 neuronio/anatomia@1 neuronio/sinais@1 neuronio/minis@1 neuronio/escala@1 neuronio/tinta@1 neuronio/dendritos@1 neuronio/corpo@1 neuronio/axonio@1 neuronio/terminais@1 | cena/quadro  | neuronio.js |
| cena/quadro (juntadora) | js | 1 | 1 | neuronio/celula@1 comum/sorteio@1 comum/cores@1 comum/curvas@1 ligacoes/ponta@1 ligacoes/pulso@1 ligacoes/tronco@1 ligacoes/pistas@1 | tela/inicio  | cena.js |
| tela/inicio | js | 1 | 1 | dados/limpa@1 cena/quadro@1 | - | tela.js |
