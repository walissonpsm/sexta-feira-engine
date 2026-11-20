# Changelog — Sexta-Feira Engine

## v0.5.0 — um axônio por módulo pedido, rotas de GPS e terminal axonal novo (20/11)

Pastas: todas

- **Um axônio de entrada para cada módulo que o agente pede** (`i-<agente>#<módulo>`; no máximo 4 por agente: os 4 primeiros pedidos válidos, sem repetir; sem pedidos, um só, para o módulo mais perto). Os axônios ficam PARADOS: o pedido não move nada (acabaram o plugar, o cone de crescimento e o desplugar); o pulso corre direto no axônio do módulo pedido, o terminal acende, o módulo leva o sinal ao neurônio central e o violeta (`o-<agente>`, um por agente) volta ao agente. Larguras: entrada 6,75·s, violeta 10,8·s; o pulso corre 20% mais devagar. `SF_CENA.pedir(agente, módulo)` devolve `false` para um módulo sem axônio dele.
- **Rotas de GPS.** Código novo `cena/rotas` (escolhe, para cada axônio, o lado e a pista 0 a 5 em volta do Núcleo que menos cruzam os outros; a ordem dos axônios de um agente, que não cruza dentro do corpo dele; e o ponto do vidro onde cada terminal pousa, com os do mesmo módulo lado a lado, vão de 26·s + 4 px) e `ligacoes/caminho` (o ajuste fino: ondulação suave, contorna esferas e neurônios como um galho, se afasta de quem corre junto, mantém o de fora fora e o de dentro dentro, alisa as quinas e chega de FRENTE ao vidro numa pista de pouso reta). `comum/curvas@2` ganhou `chegada` e `ponte`; `ligacoes/pistas@2` ganhou `esboco`.
- **Terminal axonal novo** (`ligacoes/ponta@2`, `terminal`): telodendros afilados, pés achatados no vidro e neurotransmissores; sem as bolinhas antigas. `cone` e `ventosa` continuam no código, mas nada mais os aciona (`ax.p` fica sempre em 1).
- **Desenho do tronco** (`ligacoes/tronco@2`): bainhas de mielina de vários comprimentos, o axônio incha de leve por onde o pulso passa, SEM contorno escuro nem sombra; os dendritos passam por cima e por baixo (metade dos cruzamentos de cada, fixa por cruzamento), sem separar "em cima" e "embaixo". Os neurônios menores do Núcleo ficam mais espalhados (`neuronio/minis`).
- **Medido (25 axônios, dados fictícios):** 80 a 90 cruzamentos e, no máximo, 12 larguras de linha de trechos que correm juntos, nas 4 telas medidas (1672×941, 1280×720, 844×390, 390×844); o teste automático cobre 3 delas (sem a 1280×720), com teto de 100 cruzamentos e de 15 larguras. **Cruzar não foi eliminado:** cada agente tem de chegar a módulos espalhados pelo vidro, então os axônios se cruzam ou passam do lado, e alguns poucos trechos correm juntos por pouco espaço.
- **Rápido de abrir, sem mudar o desenho.** A conta das rotas e do ajuste fino foi reescrita para ser a MESMA e custar bem menos: listas de números no lugar de objetos, listas de obstáculos e vizinhos por quadradinho de 4 px (volta à lista inteira depois do primeiro empurrão), o estado do passo 40 guardado por axônio (`ax.ck`), caixas e memória em `cena/rotas`, e o tronco de cada axônio guarda os caminhos que só dependem da linha (`ax.cT`), em vez de refazê-los a cada quadro. Resultado, medido no navegador sem placa de vídeo (melhor de 3, ±0,2 s): a cena abre em ~1,1 a 1,5 s na tela grande (meta 1,5 s) e ~0,8 a 0,9 s no celular deitado (meta 1 s). A geometria dos 25 axônios deu 0,00 px de diferença contra a versão direta nas 4 telas (até 6e-7 px só pela raiz quadrada no lugar de `Math.hypot`), e a tela com o tronco guardado saiu idêntica pixel a pixel (101 pontos do `imagens.py`).
- **Testes.** `navegador.py` foi de 19 para 33 (novos: um axônio por módulo e teto de 4, um só sem pedidos, o pedido corre no axônio do módulo e volta pelo violeta, chegada de frente sem quina, nenhum axônio passa de uma volta e meia, teto de cruzamentos e de trechos juntos, terminais lado a lado, módulos do Núcleo espalhados, a cena abre rápido, falha no ajuste fino desliga só o caminho, as curvas `chegada` e `ponte`). `test_dados_maliciosos_sao_ignorados` estava definido DUAS vezes (a 1ª nunca rodava): virou um só, juntando os dois. O `roteiro.py` agora pede o 1º módulo do agente e lê `i-<agente>#<módulo>`.
- **Referências regravadas, com motivo:** `testes/referencias/cena.json` (9 cenas, 101 pontos) e `roteiro.json` (o pedido corre direto: 0 a 1,5 s no axônio, o terminal acende, o violeta volta de 4,7 a 5,5 s, repouso às 6,15 s; no foco no meio do pedido, repouso em 450 ms) porque os axônios, as rotas e o ciclo são outros; `portas.json` porque subiram de porta `comum/curvas`, `ligacoes/pistas`, `ligacoes/ponta`, `ligacoes/tronco`, `cena/ligar` e `cena/quadro` (1 → 2) e nasceram `cena/rotas` e `ligacoes/caminho` (1). Partes: 40 (34 de código no `camadas.py`).
- **Não visto:** no PC real, no systemd, num celular de verdade e com placa de vídeo (tudo medido em Chromium sem GPU); a instabilidade rara do `imagens.py` (cerca de 1 em 100) segue sem causa achada.

## v0.4.4 — sorteio separado por pedaço da anatomia (20/11)

Pastas: todas

- **O arranjo dos galhos mudou, uma única vez, de propósito.** Em `neuronio/anatomia` o corpo (contorno, espículas, anel, núcleo), cada tronco de dendrito e cada dendrito de contato passaram a ter o PRÓPRIO sorteio (`rngDe(nome)`: semente do neurônio misturada com o hash do nome do pedaço). Antes todos bebiam do mesmo sorteio: mexer no contorno mudava todos os galhos. Agora cada pedaço só depende da semente e de si mesmo. O estilo, as cores, os eixos dos axônios e o tamanho são os mesmos; só os galhos caem em outros lugares (imagens antes/depois entregues).
- **Referências regravadas, com motivo:** `testes/referencias/cena.json` (9 cenas, 101 pontos) e `testes/referencias/roteiro.json`, porque a anatomia sorteia diferente. No `roteiro.json` mudam só os TEMPOS (um passo `pousando-ida` novo em 350 ms; o fim do ciclo vem cerca de 1 s antes, 6250→5300 ms): o ponto de contato nos galhos mudou, então o pulso percorre outro trajeto; os estados dos passos são os mesmos. Depois de regravar, `imagens.py` dá 101 pontos idênticos e o `roteiro.py` passa. `portas.json` NÃO mudou (nenhuma porta, `requer` ou aridade mudou).
- **Sorteio separado também nos testes por parte:** com `SF_TESTE`, o carregador dá a cada parte o próprio `usa.base.acaso` (semente = nome da parte), então uma parte não gasta sorteios de outra. Novo `SF.porta(nome)` (só com `SF_TESTE`) e `anatomia()` na celula (só geometria, sem dado) para os testes.
- **Teste novo** (`navegador.py`, `test_sorteio_separado_por_pedaco_da_anatomia`, 19 testes agora): mesma semente dá a mesma anatomia; outra semente dá outro corpo; gastar sorteios do contorno muda o contorno mas NÃO muda os dendritos; um dendrito de contato extra não mexe nos troncos. Prova vermelha: com o tronco ligado de volta ao sorteio do contorno o teste reprova.
- **Instabilidade rara do `imagens.py`: causa NÃO achada.** Investigação com tempo limitado: 20 rodadas de `ciclo-cripto-2x` sem nenhuma repetição (a taxa antiga era cerca de 1 em 100, então 20 rodadas não provam nada). A nova tentativa (até 4) e o resumo das cenas repetidas continuam.
- **Decisão: NÃO voltar a guarda nas funções internas.** Ela mudaria o orçamento de tempo real da lupa e o desenho; a falha já é contida na entrada da porta, por esfera, por axônio e por órgão.

## v0.4.3 — provas por parte (20/11)

Pastas: todas

- **A tela sai idêntica à da v0.4.2** (101 pontos do `testes/imagens.py`); nenhuma referência de imagem foi regravada.
- **Uma parte quebrada de cada vez** (`testes/camadas.py`): `SF_TESTE = { quebrar: '<parte>' }` faz a parte falhar ao montar; o teste quebra cada uma das 32 partes de código (as outras 6 de `fonte/` são html, css e dados, sem montagem) e confere que caem exatamente ela e quem depende dela (pelo `requer`), que o aviso aparece e que não sobra erro solto. Para isso o aviso virou a parte `tela/aviso` (sem dependências): antes, se a cena ou a `tela/inicio` caíssem, ficava tela preta sem aviso.
- **Roteiro do ciclo** (`testes/roteiro.py`, `testes/referencias/roteiro.json`): um pedido inteiro e um pedido com troca de foco no meio, passo a passo (estado dos dois axônios, brilho, ramos fora do repouso), com o tempo de cada passo.
- **Tempo por parte** (`SF_TESTE = { medir: true }`, `SF.tempos()`): só informa; o `camadas.py` imprime as 12 funções que mais gastam.
- **Falha contida por órgão**: dentro de cada esfera, cada órgão do desenho (halo, dendritos, soma, núcleo, axônio, terminais, névoa, minis, excitação, pulsos, nódulos, potenciais, bulbos, neurotransmissores) roda em `usa.base.seguro`; se der erro, só ele para naquela esfera e o contexto volta ao estado de antes. A guarda nas funções internas continua NÃO existindo (mudou o desenho na v0.4.1).
- A foto da porta agora compara também o `compativel-desde`.
- **Instabilidade do `imagens.py`: uma causa achada e corrigida.** Os quadros caem em múltiplos de 16 ms e o relógio falso parte de 2 a 5 ms conforme a carga; um "rodar 1500" de duração fixa terminava antes ou depois do quadro de 1504, que então rodava antes ou depois do passo seguinte (o pedido): o axônio ficava um quadro (4% do crescimento) atrás e a imagem mudava por alguns pontos. Agora os passos andam até instantes absolutos do relógio (também no `roteiro.py`). **Sobra uma instabilidade rara (cerca de 1 rodada em 100 numa rodada sem carga, só o canvas da parede em `ciclo-cripto-2x`/t01; com a máquina ocupada apareceu mais, até 2 cenas em 9) cuja causa NÃO foi achada** (a auditoria sugeriu que o alvo devia usar o `performance.now` normalizado; a sonda mostrou que o `t` do `requestAnimationFrame` é o relógio cru, então o alvo no relógio cru está certo); a nova tentativa (até 4 rodadas) continua, e agora o resumo final lista as cenas que precisaram dela.
- O `ferramentas/empacotar.sh` também roda o roteiro e o `camadas.py` antes de criar o bundle.
- Fica para as próximas (declarado, não feito): sorteio separado por parte (v0.4.4); a causa da instabilidade que sobrou; guarda em funções internas (só se não mudar o desenho). Nada visto no PC real nem no systemd.

## v0.4.2 — o isolamento terminado: celula e quadro em partes, falha contida e foto da porta (20/11)

Pastas: todas

- **A tela sai idêntica à da v0.4.1** (101 pontos do `testes/imagens.py`, pixel a pixel), com uma exceção explicada abaixo: a referência da cena `paisagem` foi regravada.
- `neuronio/celula` (2.711 linhas) e `cena/quadro` viraram juntadoras finas (519 e ~240 linhas): o estado de cada uma fica num objeto só (`Est`) e as partes recebem `Est` e as funções irmãs. Partes novas: `comum/ramos`, `neuronio/{recorte,anatomia,sinais,minis,escala,tinta,dendritos,corpo,axonio,terminais,camada,vidro,lupa,pulso}` e `cena/{posicoes,ciclo,foco,eixos,ligar}` (37 partes no total). Código movido sem reescrever. Por isso `Pastas: todas` (nasceu `comum/ramos`).
- **Falha contida**: cada esfera e cada axônio da cena roda em `usa.base.seguro`; se der erro, só ele é desligado e a tela mostra uma linha curta (`#aviso-falha`, `textContent`, nasce só na falha; mostra quantas e a última). No teste o erro continua subindo; `SF_TESTE = { estrito: false }` liga a contenção. Dois testes novos no `navegador.py` (esfera com defeito; falha ao montar a cena).
- **Foto da porta**: `SF.portas()` comparada com `testes/referencias/portas.json`; mudar a aridade de `criar` ou as dependências sem subir `porta:` reprova (teste novo; regravar com `SF_GRAVAR_PORTAS=1`).
- Correções de estabilidade do teste de imagem: o `ajusta()` de `tela/inicio` ignora "resize" sem mudança real (o resize espúrio mudava a imagem; por isso **a referência da cena `paisagem` foi regravada**, só ela); o `imagens.py` normaliza o `performance.now`; nova tentativa controlada de até 4 rodadas por cena, com aviso. **A instabilidade residual (cerca de 1% das rodadas em `ciclo-cripto-2x`, e as cenas de celular) NÃO teve a causa achada.**
- Desvios do desenho aprovado: `lustreSoma` aparece em `neuronio/camada`, `neuronio/escala` e `neuronio/pulso`; `cena/quadro` deixou de pedir `ligacoes/pulso` (não usava); `irPara`, `modulosDe`, `alvoRel` e `raioVent` ficam na juntadora da cena para cortar um ciclo entre partes.
- Auditoria independente (agente separado): nenhum achado grave; corrigidos o aviso que não cobria falha ao montar a cena (agora é registrado antes), o aviso que mostrava só a última falha e o `requer` sobrando; anotado no LEIA-ME do carregador que `seguro` não restaura o canvas. Não feito: `compativelDesde` fora da foto da porta; resumo final do `imagens.py` com as tentativas repetidas.
- Fica para as próximas (declarado, não feito): provas por parte, roteiro do ciclo e tempo por parte (v0.4.3); sorteio separado por parte (v0.4.4); congelar portas com `Proxy` (tirado do plano: as portas já saem congeladas). Nada visto no PC real nem no systemd.

## v0.4.1 — o tronco, as pistas e os dendritos em pastas próprias (19/11)

Pastas: cena/quadro, ligacoes/pistas, ligacoes/tronco, neuronio/celula, neuronio/dendritos

- Só fatiamento: **a tela sai idêntica à da v0.4.0** (101 pontos do `testes/imagens.py`, pixel a pixel). Nenhum comportamento muda.
- `ligacoes/tronco` (juntadora da camada): medir a linha do axônio, achar pontos e trechos nela e desenhar fio, bainhas, nódulos, pulso e ponta. `ligacoes/pistas`: o caminho do axônio do agente até o vidro do Núcleo. Os dois saem de `cena/quadro`, que fica com o estado e o ciclo (pontes de uma linha no lugar das funções).
- `neuronio/dendritos`: polígonos afilados, bordas, linha por dentro do ramo, trilha suave e mitocôndrias, que saíram de `neuronio/celula`. **Sem guarda de propósito**: o "assado" da lupa tem orçamento de tempo real e a guarda muda quanto fica pronto por quadro (explicado no `LEIA-ME.md` da parte).
- Fica para as próximas: o resto de `neuronio/celula` (anatomia, pintura, sinais, minis, lupa) e de `cena/quadro` (ciclo, foco, posições); testes por parte; congelar portas; o sorteio separado por parte passa a ser a v0.4.2.

## v0.4.0 — a fonte em pastas isoladas (19/11)

Pastas: todas

- **A tela agora nasce de `fonte/<camada>/<parte>/`** (camadas: `base`, `comum`, `neuronio`, `ligacoes`, `dados`, `cena`, `tela`, mais `cores` e `laboratorio`). Cada parte tem `PARTE` (manifesto: porta, versão e o que usa), `parte.js` (ou o arquivo dela), `LEIA-ME.md` e, quando houver, a pasta `teste/`. Quem mexe numa parte não precisa abrir as outras: só a porta dela (o que ela devolve) e o `LEIA-ME.md`.
- **`ferramentas/montar-interface.sh`** (só bash) gera os arquivos planos de `interface/` (`sf.js`, `neuronio.js`, `ligacoes.js`, `cena.js`, `tela.js`, `dados-ficticios.js`, `tela.css`, `index.html`, `cores.css`, `neuronio.html`) e o `fonte/MAPA.md` (quem usa quem, porta e versão de cada parte). Atualizador, `publicar/` e servidor não mudam. **`interface/` é gerada: não se edita à mão** (o `testes/conferir.sh` reprova se ela diferir da montagem).
- **O carregador `SF`** (`fonte/base/carregador`): cada parte é uma função que recebe só o que declarou (`usa`); as portas saem congeladas; parte "com guarda" salva e restaura o canvas a cada chamada da porta e, se a construção falhar, é desligada sozinha (a tela segue sem ela, com aviso no console); os métodos do objeto que a porta devolve (o quadro, o passo) ainda não têm guarda; nos testes o erro é relançado. Sorteio, relógio e canvas vêm de `usa.base` (nenhuma parte de lógica toca em `window`, `Math.random` ou `performance`: o `conferir.sh` confere).
- Regras do montador: parte só usa camadas abaixo da dela (a juntadora da camada é a única que usa as irmãs); porta com versão (`compativel-desde` ≤ versão pedida ≤ `porta`); ciclo de dependência é recusado.
- **Partes já separadas**: `base/carregador`, `comum/{sorteio,cores,curvas}`, `dados/{limpa,ficticios}`, `ligacoes/{ponta,pulso}`, `tela/{inicio,pagina,estilo}`, `cores/cores`, `laboratorio/neuronio`. O motor do neurônio (`neuronio/celula`) e a cena (`cena/quadro`) entram inteiros como juntadoras, a serem fatiados nas próximas versões (o estado deles é compartilhado: ver o `LEIA-ME.md` de cada um).
- **Teste de identidade** `testes/imagens.py` (só na nuvem): 9 cenas, 101 pontos, hash de cada canvas e da captura inteira, relógio e sorteio presos; as referências (`testes/referencias/cena.json`) foram tiradas da v0.3.0. **A tela sai igual, pixel a pixel, à v0.3.0.** As cenas de celular (dpr 3) são instáveis até na v0.3.0 original (cerca de uma rodada em três muda o hash do canvas do Núcleo; causa ainda não achada), então só reprovam se nenhuma de 6 tentativas bater.
- **`ferramentas/escopo.sh`**: a linha `Pastas:` acima tem de bater com as partes de `fonte/` que mudaram desde a tag anterior (mudar `base`, `comum` ou `cores` exige "todas"); o `ferramentas/empacotar.sh` roda o escopo e o teste de imagem antes de criar o bundle.
- `testes/conferir.sh` ganhou a conferência da fonte (montagem igual, partes sem acesso direto a janela, relógio ou sorteio, LEIA-ME em cada parte); `testes/atualizador.sh` passou a remontar a `interface/` ao trocar de versão.
- Fica para as próximas (declarado, não feito): sorteio separado por parte (v0.4.1, muda uma vez o arranjo dos galhos); teste com as camadas ligadas parte por parte, foto da porta e tempo por parte; congelar as portas com `Proxy`; fatiar `neuronio/celula` e `cena/quadro`.

## v0.3.0 — a cena viva: axônios que se mexem, com pulso e cone de crescimento (19/11)

- A tela passa a ser a **cena** das prévias v01 a v11 aprovadas pelo dono: o Núcleo no centro e os seis agentes ao redor, cada um com um par de axônios de mão única (violeta do Núcleo para o agente; da cor do agente para o Núcleo) que terminam em ventosas na parede de vidro (a sinapse). A Corretora fica parada ao lado do Robô. Axônio só leva e dendrito só recebe.
- **O ciclo do pedido**: o axônio do agente repousa apontando para o módulo que ele mais pede; ao pedir, a ventosa se solta e vira um **cone de crescimento** (filopódios e véu) que vai até o módulo, assenta de frente no vidro, o pulso da cor do agente corre pelo tronco e acende o módulo, o módulo responde, o neurônio central dispara e um pulso violeta com a cor do pedido volta ao agente. O tronco é liso e parado; só a ponta se mexe.
- Lupa e foco: tocar no nome de uma esfera a amplia; botões −, + e 1:1, "← cena" e a tecla Esc.
- Novos arquivos: `interface/cena.js` (a cena e o ciclo) e `neuronio.js` ampliado (neurônios menores dentro da esfera, receptores, lupa). Sai da tela a moldura da v0.2.0 (estado geral, tarefas, avisos, registro, destaque, ficha do agente) e o botão do modo leve (o modo leve continua por `?leve=1` e pelo "movimento reduzido" do aparelho).
- `dados-ficticios.js` ganha `pedidos` (que módulos cada agente costuma pedir) e `tela.js` o filtra na lista branca (`limpa`): só ids fixos de agente e de módulo, até 12 por agente. Sem `pedidos` válidos, cada agente pede qualquer módulo (a cena não quebra).
- Gancho de teste: `window.SF_CENA` e `window.SF_LIMPA` só existem se `window.SF_TESTE` estiver definida antes dos scripts (os testes de navegador definem; a tela real nunca expõe nada).
- `cores.css` ganha as nove cores dos módulos (`--cor-mod-*`). O `neuronio.html` do dono não mudou.
- `testes/navegador.py` reescrito para a cena: sem erro e sem rede, selo de dados fictícios, foco por nome e lupa, ciclo completo (cada agente pede e recebe), esferas sem sobreposição, texto malicioso nos dados ignorado, modo leve mais leve, celular em retrato e paisagem.
- Dados, privacidade e rede: sem alteração (só dados fictícios, tudo por `textContent`, nenhuma requisição).

## v0.2.0 — a tela do mapa, com dados fictícios (18/11)

- `interface/index.html` deixa de ser só um link: é a tela da Sexta-Feira, com o neurônio da Sexta-Feira (o Núcleo) no centro, os seis agentes (FIIs, Ações e ETFs, Cripto, Radar, Robô, Segurança) como neurônios menores ligados a ele, a Corretora como módulo satélite parado ao lado do Robô e a moldura em volta (topo, agentes, tarefas, avisos, logs, destaque, sistema e rodapé), com as mesmas medidas do mapa da Sexta-Feira (desenhada em 1672×941 e escalada inteira).
- **Tudo é fictício**: `dados-ficticios.js` (`ficticio: true`) e um selo "DADOS FICTÍCIOS" sempre à vista. O formato (`formato: 1`) é o contrato dos dados reais, que entram um bloco por vez em versões futuras.
- `neuronio.js`: o motor de desenho do `neuronio.html` do dono (que continua igual) virou uma fábrica, `Neuronio.criar(canvas, opções)`, um neurônio por canvas.
- `cores.css`: só variáveis de cor (as do dono e as da moldura). É o arquivo que o dono edita; os neurônios leem as mesmas variáveis.
- **Modo leve** (`?leve=1`, botão no rodapé ou movimento reduzido do sistema): no máximo 24 quadros por segundo, resolução 1x, sem névoa, vesículas nem sub-ramos e neurônios pequenos parados. A escolha fica no navegador. Com a aba escondida nada é desenhado.
- Todos os textos entram por `textContent` e passam por uma lista branca (ids de agente fixos, estados fixos, textos curtos). Nenhuma requisição de rede; configurações e pedidos aparecem desligados ("em breve").
- `testes/conferir.sh` ganhou regras para a tela: sem `innerHTML`/`eval`/`setTimeout` com texto (o `neuronio.html` do dono fica fora desta), `<script>` e `<link>` só locais, selo e `ficticio: true` presentes, `VERSAO_ENGINE` igual à `VERSAO`; o endereço do espaço de nomes do SVG deixou de contar como endereço externo.
- `testes/navegador.py` (só na nuvem, precisa de playwright e Chromium): abre a tela, sem erro nem requisição externa, caixas visíveis em 1920×1080 e 1366×768, modo leve desenha bem menos, texto malicioso vira texto, detalhe do agente abre e fecha.
- `ferramentas/empacotar.sh` agora recusa clone raso e confere o bundle como o PC confere (o mesmo fetch das tags num repositório vazio, objetos completos, versão anterior como ancestral); se falhar, apaga o bundle. `testes/empacotar.sh` testa isso.

## v0.1.1 — a chave do espelho na pasta de segredos (18/11)

- A deploy key do espelho passa a ficar em `~/sexta-feira-segredos/sexta-feira-engine/github/id_ed25519` (subpasta só do engine; a Sexta-Feira nunca a monta em contêiner).
- O instalador avisa se a pasta `github` não estiver em modo 700 ou a chave em 600.
- Textos, README e `AGENTS.md` atualizados; testes do espelho com chave.

## v0.1.0 — primeira versão (18/11)

- A interface (front end) da Sexta-Feira ganha repositório próprio, com instalador e atualizador independentes da Sexta-Feira (sem Docker, sem Núcleo, sem agentes).
- `interface/neuronio.html`: o neurônio completo (Canvas, sem dependências) que será a Sexta-Feira no centro do mapa. Igual ao arquivo enviado pelo dono.
- `interface/index.html`: página mínima com link para o neurônio (a futura tela principal vem na v0.2.0).
- `instalar-engine.sh`: instalação inicial a partir do bundle em `~/Downloads`; monta `publicar/` e liga o atualizador no systemd do usuário.
- `atualizar-engine.sh`: atualizador (`--auto`, manual, caminho do `.bundle`, `--voltar`, `--espelhar`) com conferência do bundle, só avança, teste, rollback e aviso na área de trabalho.
- `testes/conferir.sh`: a rodada de teste do engine (versão, arquivos da interface, nada de rede, nada de segredo, shell e unidades).
- `ferramentas/empacotar.sh`: cria a tag e o bundle (só na nuvem).
- `AGENTS.md` e `CLAUDE.md` (uma linha, `@AGENTS.md`): regras para agentes de código.
- Nada serve a interface ainda: a rota `/engine/` do servidor do mapa entra na Sexta-Feira v0.55.0.
