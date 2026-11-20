# cena/rotas

Escolhe as rotas dos axônios de entrada (v0.5.0): para cada um, o **lado** (+1 ou -1) e a **pista** (0 a 5, o raio em que corre em volta do Núcleo) que menos cruzam os outros; a **ordem** dos axônios de um mesmo agente (a que não cruza dentro do corpo dele); e o **ponto do vidro** onde cada terminal pousa. Os terminais de um mesmo módulo ficam lado a lado no vidro (vão de `26·s + 4` px, em ângulo `(26·s + 4) / rv`), na ordem de quem chega: os que vêm dos ângulos menores pousam do lado dos menores; entre os que vêm do mesmo lado, a pista de dentro pousa primeiro. Nunca dois no mesmo ponto.

Como funciona (`escolher(lista)`): (1) lado inicial = o caminho mais curto; (2) `espalha()` põe os terminais; (3) quatro rodadas: cada axônio tenta os dois lados e as 6 pistas e fica com a de menor custo (`100·cruzamentos + 4·proximidade(máx. 15) + 2,5·pista + 25 se for pelo lado longo + 0,12·comprimento do esboço`; mais de 3,5 rad em volta do Núcleo nem se tenta), os axônios do mesmo agente tentam trocar de lugar, e `espalha()` de novo; (4) `refazEixo` em cada um. Os violetas (`tipo` 'o') só entram como obstáculo.

**Como é rápida** (v0.5.0; o resultado é IDÊNTICO ao da conta direta, 0,00 px nas 4 telas): cada linha tem a sua caixa (`bb`) e um número (`uid`); `cruz` e `perto` descartam logo as linhas cujas caixas não se tocam e só comparam os trechos que podem encostar; o esboço de cada estado (`id|lado|pista|ordem|ponto de pouso`) e o custo de cada par de linhas ficam guardados (a conta é pura: mesma entrada, mesma saída); e `custoDe` para assim que a soma passa do melhor custo até então (a soma só cresce).

Código novo da v0.5.0 (a conta saiu do protótipo aprovado nas prévias v013 a v024).

## Porta (`usa.rotas.criar(Est, d)` devolve)

- `escolher(lista)`

## Estado (Est)

- Lê: `esf` (o Núcleo), `s` (a escala), `fixoMod` (o ângulo `ang` do ponto de cada módulo).
- Escreve em cada axônio de entrada: `plano`, `dC`, `dPara`, `dRep`, `head`, `c` (a ordem), `esb` (só durante a conta; no fim volta a `null`), `esbL`.

## Vem das irmãs (`d`, passado pela juntadora)

- `raioVent` (da própria juntadora)
- `refazEixo` (de `cena/eixos`)

## Usa

`comum/curvas@2` (`volta`) e `ligacoes/pistas@2` (`esboco`: o esboço do caminho para um `plano`).

## Guarda

Sem guarda: é uma fábrica chamada uma vez por montagem; as contas rodam em laço e a guarda mudaria o tempo.

## Não mexer

O custo (os pesos acima) e as 4 rodadas: foram ajustados nas 4 telas de teste (cruzamentos entre 80 e 100, nenhuma volta de mais de ~200°). Os testes `test_teto_de_cruzamentos...`, `test_nenhum_axonio_passa_de_uma_volta...` e `test_terminais_do_mesmo_modulo...` (em `testes/navegador.py`) reprovam se mudar para pior. O vão do terminal (`26·s + 4`) tem de bater com a largura que `ligacoes/ponta.terminal` ocupa.

## Armadilhas

(1) É conta pesada (pares de axônios × pontos): qualquer coisa nova aqui deve ser medida (`-k abre_rapido`). (2) Depende da ordem em que `cena/ligar` cria os axônios (a lista) só para desempatar: o desempate final é pelo `id`. (3) As memórias (`esbMemo`, `parMemo`) valem só dentro de UMA chamada de `escolher` (nascem e morrem nela): nunca as ponha em `Est` nem fora da função.
