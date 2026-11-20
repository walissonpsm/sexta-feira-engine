# cena/quadro (juntadora)

**O que faz**: a cena: cria as esferas (cada uma é um `celula.criar` próprio), guarda o ESTADO da cena (`Est`), liga as partes `cena/{posicoes,ciclo,foco,eixos,ligar}` e roda o quadro (passo e desenho de cada esfera e de cada axônio, dentro de `usa.base.seguro`: falha contida).
**Porta**: `{ criar }` (`criar(elemento, config)` devolve a cena: `ajustar`, `quadro`, `focar`, `sair`, `esferas`, `ligacoes`, `pedir`, `lupa`, `aoMudar`...).
**Usa**: `neuronio/celula`, `comum/{sorteio,cores,curvas}`, `ligacoes/{ponta,pulso,tronco,pistas}` e `cena/{posicoes,ciclo,foco,eixos,ligar}`. **Mexe no DOM** (`dom: sim`: cria os canvases e os botões de nome).
**Nota (v0.4.2)**: o que sobrou aqui é a criação das esferas, o desenho da parede (`pintaFixo`, `passoPar`), o quadro e os nomes sob as esferas; o resto foi para as pastas irmãs sem reescrever. Funções usadas por duas partes que dependeriam uma da outra (`irPara`, `modulosDe`, `alvoRel`, `raioVent`) ficam aqui e são passadas em `d` (evita ciclo entre as partes).
**Armadilhas**: o contador `ciclo` cancela retornos de pedidos velhos depois de uma troca de foco; a ordem das chamadas de `usa.base.acaso()` define o desenho (não reordenar).
**Testar**: `python3 testes/imagens.py`, `python3 testes/navegador.py`.

## O estado (`Est`)

Objeto único. Campos: o palco e a vista (`W`, `H`, `s`, `MG`, `T`, `TF`, `dprP`, `ctxP`, `ctxF`, `caixaPar`, `caixaFix`, `bbAnt`, `sujo`, `sujoE`, `relogio`, `leve`); as esferas (`esf`, `ordem`, `VIOLETA`, `idAg`); as ligações (`eixos`, `eixoById`, `ventosas`, `ventById`, `nLig`, `ligMapa`, `ligMapaTodo`, `nomeMod`, `fixos`, `fixoAg`, `fixoMod`, `ramos`, `eixosAntes`); o ciclo (`ciclo`, `fila`, `tempo`, `proximo`, `ocupado`, `pedidoDe`, `automatico`); e o foco (`foco`, `ouvinte`). Campos reatribuídos são lidos e escritos como `Est.campo`.
**Falha contida**: cada esfera (`esfera:<id>`) e cada axônio (`eixo:<id>`) roda dentro de `usa.base.seguro`; se der erro, só ele é desligado e `tela/inicio` mostra uma linha curta (`#aviso-falha`, só por `textContent`). Nos testes o erro sobe (modo estrito); o teste da falha contida liga `SF_TESTE = { estrito: false }`.
**Como mexer numa parte**: igual ao da `neuronio/celula`.
