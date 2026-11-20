# cena/eixos

a vida de cada axônio da cena: medir, pintar, refazer o caminho e o passo do tempo (cone de crescimento, pulso).

Código movido sem reescrever de `cena/quadro` (v0.4.2). Cada função continua com o mesmo corpo; só mudou de onde vêm as dependências.

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

- `raioVent` (de `a própria juntadora (função dela, passada por nome)`)
- `irPara` (de `a própria juntadora (função dela, passada por nome)`)
- `chegou` (de `cena/ciclo`)

## Guarda

Sem guarda: a porta é uma fábrica chamada uma vez por neurônio; as funções internas são chamadas em laço e a guarda mudaria o desenho (ver AGENTS.md, seção 7, v0.4.1).

## Como mexer

Abra só esta pasta, mude o que precisa, rode `bash ferramentas/montar-interface.sh`, `bash testes/conferir.sh` e `python3 testes/imagens.py`. Se mudar um campo de `Est` ou uma função da porta, suba `porta:` no `PARTE` e atualize as juntadoras.
