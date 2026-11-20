# neuronio/axonio

o desenho parado do axônio: tronco encorpado, bainhas de mielina estriadas e nódulos de Ranvier (seção 5 do desenho aprovado), um por axônio. Recebe a tinta T.

Código movido sem reescrever de `neuronio/celula` (v0.4.2). Cada função continua com o mesmo corpo; só mudou de onde vêm as dependências.

## Porta (`usa.axonio.criar(Est, d)` devolve)

- `pintarAxonio`

## Estado (Est)

- Campos reatribuídos (acessados como `Est.campo`): nenhum
- Objetos compartilhados lidos de Est no início: `opc`

## Vem das irmãs (`d`, passado pela juntadora)

- `drawTaperedBranch` (de `neuronio/escala`)

## Guarda

Sem guarda: a porta é uma fábrica chamada uma vez por neurônio; as funções internas são chamadas em laço e a guarda mudaria o desenho (ver AGENTS.md, seção 7, v0.4.1).

## Como mexer

Abra só esta pasta, mude o que precisa, rode `bash ferramentas/montar-interface.sh`, `bash testes/conferir.sh` e `python3 testes/imagens.py`. Se mudar um campo de `E` ou uma função da porta, suba `porta:` no `PARTE` e atualize as juntadoras.
