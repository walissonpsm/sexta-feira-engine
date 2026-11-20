# neuronio/recorte

a máscara da esfera e o corredor por onde o tronco do axônio sai dela (só geometria de recorte, sem desenho próprio).

Código movido sem reescrever de `neuronio/celula` (v0.4.2). Cada função continua com o mesmo corpo; só mudou de onde vêm as dependências.

## Porta (`usa.recorte.criar(Est, d)` devolve)

- `alcanceFora`
- `recortaNaEsfera`
- `corredorTronco`
- `corredorPolis`
- `caminhoCorredor`
- `recorte2D`
- `caminhoRecorte`
- `montarMascara`
- `fadeFora`

## Estado (Est)

- Campos reatribuídos (acessados como `Est.campo`): `anatomy`
- Objetos compartilhados lidos de Est no início: `PAREDE`, `VISTA_1`, `opc`, `runtime`, `vista`

## Vem das irmãs (`d`, passado pela juntadora)

nenhuma

## Guarda

Sem guarda: a porta é uma fábrica chamada uma vez por neurônio; as funções internas são chamadas em laço e a guarda mudaria o desenho (ver AGENTS.md, seção 7, v0.4.1).

## Como mexer

Abra só esta pasta, mude o que precisa, rode `bash ferramentas/montar-interface.sh`, `bash testes/conferir.sh` e `python3 testes/imagens.py`. Se mudar um campo de `E` ou uma função da porta, suba `porta:` no `PARTE` e atualize as juntadoras.
