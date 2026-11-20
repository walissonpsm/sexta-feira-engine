# neuronio/lupa

a interação da lupa: zoom, arrasto, animação, prender nos limites, o refino da parte fixa em fatias e os ouvintes do ponteiro (roda, arrasto, pinça, duplo toque).

Código movido sem reescrever de `neuronio/celula` (v0.4.2). Cada função continua com o mesmo corpo; só mudou de onde vêm as dependências.

## Porta (`usa.lupa.criar(Est, d)` devolve)

- `prenderLupa`
- `marcarLupa`
- `ampliarEm`
- `moverLupa`
- `animarLupa`
- `passoAnimLupa`
- `alternarLupa`
- `cuidarRefino`
- `ligarLupa`

## Estado (Est)

- Campos reatribuídos (acessados como `Est.campo`): `detalhe`, `refino`
- Objetos compartilhados lidos de Est no início: `canvas`, `lupa`, `opc`, `runtime`

## Vem das irmãs (`d`, passado pela juntadora)

- `agora` (de `neuronio/escala`)
- `zMax` (de `neuronio/escala`)
- `iniciarAssado` (de `neuronio/camada`)
- `avancarAssado` (de `neuronio/camada`)
- `vidroDaVista` (de `neuronio/vidro`)

## Guarda

Sem guarda: a porta é uma fábrica chamada uma vez por neurônio; as funções internas são chamadas em laço e a guarda mudaria o desenho (ver AGENTS.md, seção 7, v0.4.1).

## Como mexer

Abra só esta pasta, mude o que precisa, rode `bash ferramentas/montar-interface.sh`, `bash testes/conferir.sh` e `python3 testes/imagens.py`. Se mudar um campo de `E` ou uma função da porta, suba `porta:` no `PARTE` e atualize as juntadoras.
