# cena/eixos

a vida de cada axônio da cena: medir, pintar, refazer o caminho e o passo do tempo (pulso, nódulos, o terminal que acende).

Desde a v0.5.0 o terminal fica onde está: depois do pulso o axônio espera 0,9 s (`preso`) e volta ao `repouso`, sem desplugar. O movimento de plugar (`ax.p`, `ax.pAlvo`, `ax.mdur`, o cone de crescimento) sobrou como código que não roda mais.

## Porta (`usa.eixos.criar(Est, d)` devolve)

- `medeEixo`
- `caminhoI`
- `pintaEixo`
- `refazEixo`
- `visEixo`
- `passoEixo`

## Estado (Est)

- Campos reatribuídos (acessados como `Est.campo`): `ctxP`, `foco`, `relogio`, `s`
- Objetos compartilhados lidos de Est no início: nenhum

## Vem das irmãs (`d`, passado pela juntadora)

- `raioVent` (da própria juntadora)
- `chegou` (de `cena/ciclo`)

## Guarda

Sem guarda: a porta é uma fábrica chamada uma vez por neurônio; as funções internas são chamadas em laço e a guarda mudaria o desenho (ver AGENTS.md, seção 7, v0.4.1).

## Como mexer

Abra só esta pasta, mude o que precisa, rode `bash ferramentas/montar-interface.sh`, `bash testes/conferir.sh` e `python3 testes/imagens.py`. Se mudar um campo de `Est` ou uma função da porta, suba `porta:` no `PARTE` e atualize as juntadoras.
