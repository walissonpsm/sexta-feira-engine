# cena/ligar

Monta as ligações da cena (v0.5.0): o axônio violeta de volta de cada agente (Núcleo → agente) e um axônio de entrada **parado** para cada módulo que o agente pede (agente → Núcleo): `i-<agente>#<módulo>`, no máximo 4 por agente (os 4 primeiros da lista de pedidos, sem repetir; sem pedidos, um só, para o módulo mais perto). Cada axônio de entrada sai do corpo do agente num ponto um pouco diferente (`mkHead`), corre na sua pista e termina, com o seu terminal axonal, no vidro do Núcleo junto do módulo. Largura: 10,8·s (violeta) e 6,75·s (entrada); o pulso corre a 1200·s px/s.

Passos de `montarLigacoes`: (1) os receptores dos módulos (`Est.fixoMod`: o ponto do vidro de cada módulo); (2) para cada agente: o giro do agente, o canal, o violeta e os axônios de entrada com um plano provisório; (3) `escolherRotas` (`cena/rotas`: lado, pista, ordem e ponto de pouso de cada axônio de entrada, e o caminho refeito); (4) a grade dos trechos de dendrito (`Est.grade`: metade dos cruzamentos de dendrito passa por cima do axônio); (5) os obstáculos de cada axônio (as outras esferas e os neurônios menores do Núcleo) e a primeira medição; (6) três rodadas em que cada axônio se afasta de quem corre junto dele (grade de vizinhos `VG`, chave numérica).

## Porta (`usa.ligar.criar(Est, d)` devolve)

- `montarLigacoes`

## Estado (Est)

- Campos reatribuídos (acessados como `Est.campo`): `eixoById`, `eixos`, `fixoAg`, `fixoMod`, `fixos`, `grade`, `idAg`, `ligMapa`, `ligMapaTodo`, `nLig`, `s`, `sujo`, `sujoE`, `ventById`, `ventosas`
- Objetos compartilhados lidos de Est no início: `esf`, `cfg`, `UC`, `VIOLETA`

## Vem das irmãs (`d`, passado pela juntadora)

- `raioVent`, `modulosDe`, `alvoRel` (da própria juntadora; `modulosDe` dá os módulos com axônio de cada agente)
- `canalUC`, `caixaDe`, `paraPalco`, `contornoMaisPerto`, `maisLonge` (de `cena/posicoes`)
- `medeEixo`, `refazEixo` (de `cena/eixos`)
- `escolherRotas` (de `cena/rotas`)

## Guarda

Sem guarda: a porta é uma fábrica chamada uma vez por montagem; as funções internas rodam em laço e a guarda mudaria o tempo (ver AGENTS.md, seção 7, v0.4.1).

## Não mexer

A ordem de criação (violeta primeiro, depois as entradas na ordem de `modulosDe`): o `id` de cada axônio (`i-<agente>#<módulo>`) é o que o ciclo, o foco, os testes e a lista de ligações usam. As larguras, as 3 rodadas e as constantes de `VG` (`cel`, `folga`) e de `G` (`cel`) foram ajustadas nas 4 telas de teste.

## Como mexer

Abra só esta pasta, mude o que precisa, rode `bash ferramentas/montar-interface.sh`, `bash testes/conferir.sh` e `python3 testes/imagens.py`. Se mudar um campo de `Est` ou uma função da porta, suba `porta:` no `PARTE` e atualize as juntadoras.
