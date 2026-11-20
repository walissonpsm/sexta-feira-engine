# cena/foco

o foco numa esfera: ela ocupa o palco e ganha a lupa; a vista das camadas da parede e a volta à vista geral.

Código movido sem reescrever de `cena/quadro` (v0.4.2). Cada função continua com o mesmo corpo; só mudou de onde vêm as dependências.

## Porta (`usa.foco.criar(Est, d)` devolve)

- `focar`
- `sair`
- `vistaTotal`

## Estado (Est)

- Campos reatribuídos (acessados como `Est.campo`): `H`, `MG`, `T`, `TF`, `W`, `bbAnt`, `ctxP`, `dprP`, `foco`, `ligMapa`, `ligMapaTodo`, `ouvinte`, `sujo`
- Objetos compartilhados lidos de Est no início: nenhum

## Vem das irmãs (`d`, passado pela juntadora)

- `caixaDe` (de `cena/posicoes`)
- `pos` (de `cena/posicoes`)
- `reiniciaCiclo` (de `cena/ciclo`)

## Guarda

Sem guarda: a porta é uma fábrica chamada uma vez por neurônio; as funções internas são chamadas em laço e a guarda mudaria o desenho (ver AGENTS.md, seção 7, v0.4.1).

## Como mexer

Abra só esta pasta, mude o que precisa, rode `bash ferramentas/montar-interface.sh`, `bash testes/conferir.sh` e `python3 testes/imagens.py`. Se mudar um campo de `Est` ou uma função da porta, suba `porta:` no `PARTE` e atualize as juntadoras.
