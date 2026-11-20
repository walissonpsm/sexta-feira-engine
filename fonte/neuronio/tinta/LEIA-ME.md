# neuronio/tinta

as cores e os brilhos derivados de uma célula (o topo do desenho aprovado): cor clara, cor funda, transparências e brilhos, o degrau de detalhe e o contraste da lupa. Quem pinta recebe o objeto T e lê daqui.

Código movido sem reescrever de `neuronio/celula` (v0.4.2). Cada função continua com o mesmo corpo; só mudou de onde vêm as dependências.

## Porta (`usa.tinta.criar(Est, d)` devolve)

- `tintaFixa`

## Estado (Est)

- Campos reatribuídos (acessados como `Est.campo`): `detZ`
- Objetos compartilhados lidos de Est no início: `config`

## Vem das irmãs (`d`, passado pela juntadora)

- `zcDe` (de `neuronio/escala`)
- `nivel` (de `neuronio/escala`)
- `un` (de `neuronio/escala`)

## Guarda

Sem guarda: a porta é uma fábrica chamada uma vez por neurônio; as funções internas são chamadas em laço e a guarda mudaria o desenho (ver AGENTS.md, seção 7, v0.4.1).

## Como mexer

Abra só esta pasta, mude o que precisa, rode `bash ferramentas/montar-interface.sh`, `bash testes/conferir.sh` e `python3 testes/imagens.py`. Se mudar um campo de `E` ou uma função da porta, suba `porta:` no `PARTE` e atualize as juntadoras.

## Acrescentado na v0.4.2 (tinta do desenho animado)

- Funções: `tintaViva`
- Campos de Est lidos: nenhum; objetos de Est: `config`
- Vem das irmãs (d): nenhuma
