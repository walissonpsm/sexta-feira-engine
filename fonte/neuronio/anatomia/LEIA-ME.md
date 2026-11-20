# neuronio/anatomia

a geometria do neurônio: onde fica cada ramo, o axônio, as bainhas, os terminais, as árvores das ligações e a vista (escala e centro) da esfera. Não desenha.

Código movido sem reescrever de `neuronio/celula` (v0.4.2). Cada função continua com o mesmo corpo; só mudou de onde vêm as dependências.

## Porta (`usa.anatomia.criar(Est, d)` devolve)

- `axonStartFim`
- `montarAnatomia`
- `montarAxonio`
- `arvoreDe`
- `anatomiaLigacoes`
- `montarLigacao`
- `raizDaArvore`
- `caixaDe`
- `estenderTronco`
- `bainhasNos`
- `montarFeixe`
- `pontasTerminais`
- `calcularVista`

## Estado (Est)

- Campos reatribuídos (acessados como `Est.campo`): `anatomy`, `minis`
- Objetos compartilhados lidos de Est no início: `DH`, `DW`, `EIXO_BASE`, `MINI_EIXO`, `PAREDE`, `config`, `opc`, `runtime`, `vista`

## Vem das irmãs (`d`, passado pela juntadora)

nenhuma

## Guarda

Sem guarda: a porta é uma fábrica chamada uma vez por neurônio; as funções internas são chamadas em laço e a guarda mudaria o desenho (ver AGENTS.md, seção 7, v0.4.1).

## Como mexer

Abra só esta pasta, mude o que precisa, rode `bash ferramentas/montar-interface.sh`, `bash testes/conferir.sh` e `python3 testes/imagens.py`. Se mudar um campo de `E` ou uma função da porta, suba `porta:` no `PARTE` e atualize as juntadoras.
