# neuronio/vidro

o vidro da esfera, com profundidade: as duas camadas pré-renderizadas (fundo e frente), a paralaxe do ponteiro, e como o vidro e a parte fixa entram na vista atual (com a lupa).

Código movido sem reescrever de `neuronio/celula` (v0.4.2). Cada função continua com o mesmo corpo; só mudou de onde vêm as dependências.

## Porta (`usa.vidro.criar(Est, d)` devolve)

- `construirVidro`
- `mesmaVista`
- `vidroDaVista`
- `vidroNaVista`
- `estaticoNaVista`
- `moverParalaxe`

## Estado (Est)

- Campos reatribuídos (acessados como `Est.campo`): `anatomy`, `detalhe`, `vidro`
- Objetos compartilhados lidos de Est no início: `VISTA_1`, `canvas`, `ctx`, `lupa`, `opc`, `par`, `runtime`, `vista`

## Vem das irmãs (`d`, passado pela juntadora)

- `zcDe` (de `neuronio/escala`)
- `novoBitmap` (de `neuronio/escala`)

## Guarda

Sem guarda: a porta é uma fábrica chamada uma vez por neurônio; as funções internas são chamadas em laço e a guarda mudaria o desenho (ver AGENTS.md, seção 7, v0.4.1).

## Como mexer

Abra só esta pasta, mude o que precisa, rode `bash ferramentas/montar-interface.sh`, `bash testes/conferir.sh` e `python3 testes/imagens.py`. Se mudar um campo de `E` ou uma função da porta, suba `porta:` no `PARTE` e atualize as juntadoras.
