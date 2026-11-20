# MAPA das partes (gerado por ferramentas/montar-interface.sh: não edite)

Camadas (só se usa o que está embaixo): base < comum < neuronio, ligacoes, dados < cena < tela. 'juntadora' é a única parte da camada que pode usar as irmãs.

| parte | tipo | porta | compatível desde | requer | usado por | arquivo gerado |
|---|---|---|---|---|---|---|
| base/carregador | js-cru | 1 | 1 | - | - | sf.js |
| cena/foco | js | 1 | 1 | - | cena/quadro  | cena.js |
| comum/cores | js | 1 | 1 | - | ligacoes/pulso ligacoes/ponta cena/ciclo neuronio/minis neuronio/anatomia cena/ligar ligacoes/tronco neuronio/celula cena/quadro  | sf.js |
| comum/curvas | js | 2 | 1 | - | ligacoes/pistas ligacoes/caminho cena/posicoes cena/ligar cena/rotas ligacoes/tronco cena/quadro  | sf.js |
| comum/ramos | js | 1 | 1 | - | neuronio/escala neuronio/terminais neuronio/dendritos neuronio/corpo neuronio/axonio neuronio/celula  | sf.js |
| comum/sorteio | js | 1 | 1 | - | neuronio/vidro neuronio/terminais neuronio/minis neuronio/dendritos neuronio/corpo neuronio/axonio neuronio/anatomia cena/ligar neuronio/celula cena/quadro  | sf.js |
| cores/cores | css | 1 | 1 | - | - | cores.css |
| dados/ficticios | js-cru | 1 | 1 | - | - | dados-ficticios.js |
| dados/limpa | js | 1 | 1 | - | tela/inicio  | tela.js |
| laboratorio/neuronio | html | 1 | 1 | - | - | neuronio.html |
| neuronio/camada | js | 1 | 1 | - | neuronio/celula  | neuronio.js |
| neuronio/lupa | js | 1 | 1 | - | neuronio/celula  | neuronio.js |
| neuronio/pulso | js | 1 | 1 | - | neuronio/celula  | neuronio.js |
| neuronio/recorte | js | 1 | 1 | - | neuronio/celula  | neuronio.js |
| neuronio/sinais | js | 1 | 1 | - | neuronio/celula  | neuronio.js |
| neuronio/tinta | js | 1 | 1 | - | neuronio/celula  | neuronio.js |
| tela/aviso | js | 1 | 1 | - | - | tela.js |
| tela/estilo | css | 1 | 1 | - | - | tela.css |
| tela/pagina | html | 1 | 1 | - | - | index.html |
| ligacoes/pulso | js | 1 | 1 | comum/cores@1 | ligacoes/tronco  | ligacoes.js |
| ligacoes/ponta | js | 2 | 1 | comum/cores@1 | ligacoes/tronco cena/quadro  | ligacoes.js |
| cena/ciclo | js | 1 | 1 | comum/cores@1 | cena/quadro  | cena.js |
| ligacoes/pistas | js | 2 | 1 | comum/curvas@2 | cena/rotas cena/eixos cena/quadro  | ligacoes.js |
| ligacoes/caminho | js | 1 | 1 | comum/curvas@2 | ligacoes/tronco  | ligacoes.js |
| cena/posicoes | js | 1 | 1 | comum/curvas@1 | cena/quadro  | cena.js |
| neuronio/escala | js | 1 | 1 | comum/ramos@1 | neuronio/celula  | neuronio.js |
| neuronio/vidro | js | 1 | 1 | comum/sorteio@1 | neuronio/celula  | neuronio.js |
| neuronio/terminais | js | 1 | 1 | comum/ramos@1 comum/sorteio@1 | neuronio/celula  | neuronio.js |
| neuronio/minis | js | 1 | 1 | comum/sorteio@1 comum/cores@1 | neuronio/celula  | neuronio.js |
| neuronio/dendritos | js | 1 | 1 | comum/ramos@1 comum/sorteio@1 | neuronio/celula  | neuronio.js |
| neuronio/corpo | js | 1 | 1 | comum/ramos@1 comum/sorteio@1 | neuronio/celula  | neuronio.js |
| neuronio/axonio | js | 1 | 1 | comum/ramos@1 comum/sorteio@1 | neuronio/celula  | neuronio.js |
| neuronio/anatomia | js | 1 | 1 | comum/sorteio@1 comum/cores@1 | neuronio/celula  | neuronio.js |
| cena/ligar | js | 2 | 1 | comum/cores@1 comum/sorteio@1 comum/curvas@2 | cena/quadro  | cena.js |
| cena/rotas | js | 1 | 1 | comum/curvas@2 ligacoes/pistas@2 | cena/quadro  | cena.js |
| ligacoes/tronco (juntadora) | js | 2 | 1 | comum/cores@1 comum/curvas@2 ligacoes/caminho@1 ligacoes/ponta@2 ligacoes/pulso@1 | cena/eixos cena/quadro  | ligacoes.js |
| neuronio/celula (juntadora) | js | 1 | 1 | comum/sorteio@1 comum/cores@1 comum/ramos@1 neuronio/recorte@1 neuronio/anatomia@1 neuronio/sinais@1 neuronio/minis@1 neuronio/escala@1 neuronio/tinta@1 neuronio/dendritos@1 neuronio/corpo@1 neuronio/axonio@1 neuronio/terminais@1 neuronio/camada@1 neuronio/vidro@1 neuronio/lupa@1 neuronio/pulso@1 | cena/quadro  | neuronio.js |
| cena/eixos | js | 1 | 1 | ligacoes/tronco@1 ligacoes/pistas@1 | cena/quadro  | cena.js |
| cena/quadro (juntadora) | js | 2 | 1 | neuronio/celula@1 comum/sorteio@1 comum/cores@1 comum/curvas@2 ligacoes/ponta@2 ligacoes/tronco@2 ligacoes/pistas@2 cena/posicoes@1 cena/ciclo@1 cena/foco@1 cena/eixos@1 cena/ligar@2 cena/rotas@1 | tela/inicio  | cena.js |
| tela/inicio | js | 1 | 1 | dados/limpa@1 cena/quadro@1 | - | tela.js |
