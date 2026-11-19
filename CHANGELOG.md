# Changelog — Sexta-Feira Engine

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
