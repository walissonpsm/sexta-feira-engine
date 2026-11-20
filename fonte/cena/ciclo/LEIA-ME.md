# cena/ciclo

o ciclo de um pedido: quem pede, o pulso que vai e volta, a fila de tarefas e o recomeço do ciclo quando a vista muda.

Desde a v0.5.0 (a porta continua `criar`; o que mudou é o comportamento): `pedir(id, módulo)` põe o pulso direto no axônio parado `i-<id>#<módulo>` (sem plugar nem cone de crescimento); o módulo tem de ser um dos que o agente tem axônio (senão devolve `false`) e sem módulo dito sorteia entre eles (`modulosDe`). `sortear` escolhe entre os agentes livres que têm a volta violeta (`o-<id>`). `reiniciaCiclo` não refaz o caminho dos axônios (eles são parados).

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

- `modulosDe` (da própria juntadora: os módulos com axônio de cada agente)

## Guarda

Sem guarda: a porta é uma fábrica chamada uma vez por neurônio; as funções internas são chamadas em laço e a guarda mudaria o desenho (ver AGENTS.md, seção 7, v0.4.1).

## Como mexer

Abra só esta pasta, mude o que precisa, rode `bash ferramentas/montar-interface.sh`, `bash testes/conferir.sh` e `python3 testes/imagens.py`. Se mudar um campo de `Est` ou uma função da porta, suba `porta:` no `PARTE` e atualize as juntadoras.
