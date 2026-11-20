# cena/ligar

monta as ligações da cena: os axônios de ida e volta de cada agente e as ventosas.

Código movido sem reescrever de `cena/quadro` (v0.4.2). Cada função continua com o mesmo corpo; só mudou de onde vêm as dependências.

## Porta (`usa.ligar.criar(Est, d)` devolve)

- `montarLigacoes`

## Estado (Est)

- Campos reatribuídos (acessados como `Est.campo`): `eixoById`, `eixos`, `fixoAg`, `fixoMod`, `fixos`, `idAg`, `ligMapa`, `ligMapaTodo`, `nLig`, `s`, `sujo`, `sujoE`, `ventById`, `ventosas`
- Objetos compartilhados lidos de Est no início: nenhum

## Vem das irmãs (`d`, passado pela juntadora)

- `raioVent` (de `a própria juntadora (função dela, passada por nome)`)
- `modulosDe` (de `a própria juntadora (função dela, passada por nome)`)
- `alvoRel` (de `a própria juntadora (função dela, passada por nome)`)
- `canalUC` (de `cena/posicoes`)
- `caixaDe` (de `cena/posicoes`)
- `paraPalco` (de `cena/posicoes`)
- `contornoMaisPerto` (de `cena/posicoes`)
- `maisLonge` (de `cena/posicoes`)
- `medeEixo` (de `cena/eixos`)
- `refazEixo` (de `cena/eixos`)

## Guarda

Sem guarda: a porta é uma fábrica chamada uma vez por neurônio; as funções internas são chamadas em laço e a guarda mudaria o desenho (ver AGENTS.md, seção 7, v0.4.1).

## Como mexer

Abra só esta pasta, mude o que precisa, rode `bash ferramentas/montar-interface.sh`, `bash testes/conferir.sh` e `python3 testes/imagens.py`. Se mudar um campo de `Est` ou uma função da porta, suba `porta:` no `PARTE` e atualize as juntadoras.
