# neuronio/minis

os neurônios menores dentro da esfera: monta cada um (anatomia em escala, posição, profundidade, caixa) a partir da anatomia do principal. A anatomia chega pela juntadora.

Código movido sem reescrever de `neuronio/celula` (v0.4.2). Cada função continua com o mesmo corpo; só mudou de onde vêm as dependências.

## Porta (`usa.minis.criar(Est, d)` devolve)

- `montarMinis`

## Estado (Est)

- Campos reatribuídos (acessados como `Est.campo`): `anatomy`
- Objetos compartilhados lidos de Est no início: `MINI_ESC`, `config`, `opc`

## Vem das irmãs (`d`, passado pela juntadora)

- `axonStartFim` (de `neuronio/anatomia`)
- `montarAnatomia` (de `neuronio/anatomia`)
- `caixaDe` (de `neuronio/anatomia`)
- `pontasTerminais` (de `neuronio/anatomia`)

## Guarda

Sem guarda: a porta é uma fábrica chamada uma vez por neurônio; as funções internas são chamadas em laço e a guarda mudaria o desenho (ver AGENTS.md, seção 7, v0.4.1).

## Como mexer

Abra só esta pasta, mude o que precisa, rode `bash ferramentas/montar-interface.sh`, `bash testes/conferir.sh` e `python3 testes/imagens.py`. Se mudar um campo de `E` ou uma função da porta, suba `porta:` no `PARTE` e atualize as juntadoras.

## Acrescentado na v0.5.0

- Os minineurônios dos módulos do Núcleo ficam em raios alternados em volta do anel (`rk = anel · (0,84 + 0,30 · frac(k · 0,618034))`), mais espalhados dentro do vidro. Quem usa arcos (`opc.arcos`) ou corredor (`opc.corredor`) continua igual; o Núcleo agora pede `arcos: [[-180, 180]]` e `corredor: -9999` (cena/quadro).

## Acrescentado na v0.4.2 (desenho animado dos menores: o disparo no soma, o sinal no axônio e nos telodendros, o brilho nos terminais)

- Funções: `pintarMinisVivo`
- Campos de Est lidos: `minis`; objetos de Est: `miniAPs`
- Vem das irmãs (d): `drawUnifiedSmoothPulse`
