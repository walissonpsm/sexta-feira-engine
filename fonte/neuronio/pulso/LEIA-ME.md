# neuronio/pulso

o pulso redondo e suave (drawUnifiedSmoothPulse): o brilho de um sinal num ponto, com o tamanho corrigido pela lupa. Usado pelos pulsos dos dendritos, do axônio e dos terminais.

Código movido sem reescrever de `neuronio/celula` (v0.4.2). Cada função continua com o mesmo corpo; só mudou de onde vêm as dependências.

## Porta (`usa.pulso.criar(Est, d)` devolve)

- `drawUnifiedSmoothPulse`

## Estado (Est)

- Campos reatribuídos (acessados como `Est.campo`): `pulsoZ`
- Objetos compartilhados lidos de Est no início: `ctx`

## Vem das irmãs (`d`, passado pela juntadora)

nenhuma

## Guarda

Sem guarda: a porta é uma fábrica chamada uma vez por neurônio; as funções internas são chamadas em laço e a guarda mudaria o desenho (ver AGENTS.md, seção 7, v0.4.1).

## Como mexer

Abra só esta pasta, mude o que precisa, rode `bash ferramentas/montar-interface.sh`, `bash testes/conferir.sh` e `python3 testes/imagens.py`. Se mudar um campo de `E` ou uma função da porta, suba `porta:` no `PARTE` e atualize as juntadoras.
