# neuronio/dendritos

o desenho parado dos dendritos afilados e das espinhas sinápticas (seção 2 do desenho aprovado). Recebe a tinta T.

Código movido sem reescrever de `neuronio/celula` (v0.4.2). Cada função continua com o mesmo corpo; só mudou de onde vêm as dependências.

## Porta (`usa.dendritos.criar(Est, d)` devolve)

- `pintarDendritos`

## Estado (Est)

- Campos reatribuídos (acessados como `Est.campo`): nenhum
- Objetos compartilhados lidos de Est no início: nenhum

## Vem das irmãs (`d`, passado pela juntadora)

- `drawSharpDendritePolygon` (de `neuronio/escala`)

## Guarda

Sem guarda: a porta é uma fábrica chamada uma vez por neurônio; as funções internas são chamadas em laço e a guarda mudaria o desenho (ver AGENTS.md, seção 7, v0.4.1).

## Como mexer

Abra só esta pasta, mude o que precisa, rode `bash ferramentas/montar-interface.sh`, `bash testes/conferir.sh` e `python3 testes/imagens.py`. Se mudar um campo de `E` ou uma função da porta, suba `porta:` no `PARTE` e atualize as juntadoras.

## Acrescentado na v0.4.2 (desenho animado dos dendritos: os pulsos de entrada)

- Funções: `pintarPulsosEntrada`
- Campos de Est lidos: `anatomy`; objetos de Est: `incomingSignals`
- Vem das irmãs (d): `drawUnifiedSmoothPulse`
