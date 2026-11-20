# neuronio/camada

a camada fixa (pré-desenhada): a ordem das camadas (principal e menores), pintar uma camada com luz, névoa e sombra, o assado em fatias com orçamento de tempo, o lustre do soma, iluminar, reduzir e compor.

Código movido sem reescrever de `neuronio/celula` (v0.4.2). Cada função continua com o mesmo corpo; só mudou de onde vêm as dependências.

## Porta (`usa.camada.criar(Est, d)` devolve)

- `camadasOrdenadas`
- `retCamada`
- `pintarCamada`
- `iniciarAssado`
- `avancarAssado`
- `bakeStaticLayer`
- `lustreSoma`
- `iluminarCamada`
- `reduzido`
- `comporCamada`

## Estado (Est)

- Campos reatribuídos (acessados como `Est.campo`): `anatomy`, `auxCv`, `detLocal`, `detZ`, `detalhe`, `minis`, `refino`, `tmpCamada`
- Objetos compartilhados lidos de Est no início: `VISTA_1`, `lupa`, `opc`, `runtime`, `vista`

## Vem das irmãs (`d`, passado pela juntadora)

- `recortaNaEsfera` (de `neuronio/recorte`)
- `montarMascara` (de `neuronio/recorte`)
- `agora` (de `neuronio/escala`)
- `zcDe` (de `neuronio/escala`)
- `giroCelula` (de `neuronio/escala`)
- `novoBitmap` (de `neuronio/escala`)
- `pintarBotoesFixos` (de `neuronio/terminais`)
- `pintarCelula` (de `a própria juntadora (função dela, passada por nome)`)

## Guarda

Sem guarda: a porta é uma fábrica chamada uma vez por neurônio; as funções internas são chamadas em laço e a guarda mudaria o desenho (ver AGENTS.md, seção 7, v0.4.1).

## Como mexer

Abra só esta pasta, mude o que precisa, rode `bash ferramentas/montar-interface.sh`, `bash testes/conferir.sh` e `python3 testes/imagens.py`. Se mudar um campo de `E` ou uma função da porta, suba `porta:` no `PARTE` e atualize as juntadoras.
