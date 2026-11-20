# neuronio/escala

o tamanho e o detalhe: o degrau de detalhe da lupa (nivel), 1 px em unidades do desenho (un), o zoom máximo, o contraste da lupa (zcDe), o giro da célula, o bitmap novo e os dois ramos que dependem do degrau (polígono afilado e ramo encorpado).

Código movido sem reescrever de `neuronio/celula` (v0.4.2). Cada função continua com o mesmo corpo; só mudou de onde vêm as dependências.

## Porta (`usa.escala.criar(Est, d)` devolve)

- `agora`
- `zcDe`
- `nivel`
- `un`
- `zMax`
- `giroCelula`
- `novoBitmap`
- `drawSharpDendritePolygon`
- `drawTaperedBranch`

## Estado (Est)

- Campos reatribuídos (acessados como `Est.campo`): `detLocal`, `detZ`
- Objetos compartilhados lidos de Est no início: `opc`, `runtime`, `vista`

## Vem das irmãs (`d`, passado pela juntadora)

nenhuma

## Guarda

Sem guarda: a porta é uma fábrica chamada uma vez por neurônio; as funções internas são chamadas em laço e a guarda mudaria o desenho (ver AGENTS.md, seção 7, v0.4.1).

## Como mexer

Abra só esta pasta, mude o que precisa, rode `bash ferramentas/montar-interface.sh`, `bash testes/conferir.sh` e `python3 testes/imagens.py`. Se mudar um campo de `E` ou uma função da porta, suba `porta:` no `PARTE` e atualize as juntadoras.
