# cena/ciclo

o ciclo de um pedido: quem pede, o pulso que vai e volta, a fila de tarefas e o recomeço do ciclo quando a vista muda.

Código movido sem reescrever de `neuronio/celula` (v0.4.2). Cada função continua com o mesmo corpo; só mudou de onde vêm as dependências.

## Porta (`usa.ciclo.criar(Est, d)` devolve)

- `agendar`
- `disparar`
- `pedir`
- `chegou`
- `sortear`
- `reiniciaCiclo`

## Estado (Est)

- Campos reatribuídos (acessados como `Est.campo`): `automatico`, `ciclo`, `eixoById`, `eixos`, `fila`, `fixoAg`, `fixoMod`, `ligMapa`, `ocupado`, `pedidoDe`, `sujo`, `tempo`, `ventById`, `ventosas`
- Objetos compartilhados lidos de Est no início: nenhum

## Vem das irmãs (`d`, passado pela juntadora)

- `irPara` (de `a própria juntadora (função dela, passada por nome)`)
- `modulosDe` (de `a própria juntadora (função dela, passada por nome)`)
- `alvoRel` (de `a própria juntadora (função dela, passada por nome)`)

## Guarda

Sem guarda: a porta é uma fábrica chamada uma vez por neurônio; as funções internas são chamadas em laço e a guarda mudaria o desenho (ver AGENTS.md, seção 7, v0.4.1).

## Como mexer

Abra só esta pasta, mude o que precisa, rode `bash ferramentas/montar-interface.sh`, `bash testes/conferir.sh` e `python3 testes/imagens.py`. Se mudar um campo de `E` ou uma função da porta, suba `porta:` no `PARTE` e atualize as juntadoras.
