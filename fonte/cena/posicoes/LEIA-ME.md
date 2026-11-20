# cena/posicoes

as posições e os tamanhos da cena: o desenho em unidades da cena (UC), a posição de cada esfera, o canal de ligação, medir para o palco, e as caixas e contornos que as ligações usam.

Código movido sem reescrever de `cena/quadro` (v0.4.2). Cada função continua com o mesmo corpo; só mudou de onde vêm as dependências.

## Porta (`usa.posicoes.criar(Est, d)` devolve)

- `posicoes`
- `canalUC`
- `medir`
- `caixaDe`
- `pos`
- `paraPalco`
- `contornoMaisPerto`
- `maisLonge`

## Estado (Est)

- Campos reatribuídos (acessados como `Est.campo`): `H`, `MG`, `W`, `s`
- Objetos compartilhados lidos de Est no início: `cfg`, `esf`

## Vem das irmãs (`d`, passado pela juntadora)

nenhuma

## Guarda

Sem guarda: a porta é uma fábrica chamada uma vez por neurônio; as funções internas são chamadas em laço e a guarda mudaria o desenho (ver AGENTS.md, seção 7, v0.4.1).

## Como mexer

Abra só esta pasta, mude o que precisa, rode `bash ferramentas/montar-interface.sh`, `bash testes/conferir.sh` e `python3 testes/imagens.py`. Se mudar um campo de `Est` ou uma função da porta, suba `porta:` no `PARTE` e atualize as juntadoras.
