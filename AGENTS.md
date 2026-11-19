# Sexta-Feira Engine — regras para agentes de código (Claude Code, Hermes e outros)

Este é o ÚNICO arquivo de regras deste repositório. O `CLAUDE.md` tem só a linha `@AGENTS.md`, que faz o Claude Code ler este arquivo:
não escreva regra no `CLAUDE.md` (um `CLAUDE.md` com texto próprio faz o Claude Code ignorar este arquivo; também não crie
`CLAUDE.local.md`). Escrito em português porque o Walisson trabalha em português. As regras de trabalho dele (duas confirmações, modelo
recomendado, descrever cada entrega, ler o `AGENTS.md` do GitHub antes de propor) são as mesmas do repositório `sexta-feira`; leia o
`AGENTS.md` de lá, seções 3 e 4.

## 1. O que é

O engine é a **parte visual da Sexta-Feira** e o **meio de comunicação** entre o Walisson e ela. Não tem lógica, dados nem decisões
próprias: mostra o que a Sexta-Feira publica e, no futuro, leva pedidos até ela (quem confere e aplica é o Núcleo, nunca o engine). A única
parte "inteligente" é o seu próprio atualizador (`atualizar-engine.sh`).

É independente da Sexta-Feira: instalador e atualizador próprios, sem Docker, sem Núcleo, sem agentes. Nomes na tela: FIIs, Ações e ETFs,
Cripto, Radar, Robô, Corretora, Segurança, Núcleo (os mesmos do repositório `sexta-feira`).

Arquivos: `fonte/<camada>/<parte>/` (a FONTE da tela, em pastas isoladas; cada parte tem `PARTE`, o código e o `LEIA-ME.md`; `fonte/MAPA.md` é gerado), `interface/` (o que vai para a tela: GERADA de `fonte/` por `ferramentas/montar-interface.sh`, nunca editada à mão: `index.html`, `tela.css`, `tela.js`, `cena.js`, `ligacoes.js`, `sf.js`, `cores.css`, `neuronio.js`, `dados-ficticios.js` e o `neuronio.html` do dono),
`instalar-engine.sh`, `atualizar-engine.sh`, `systemd/` (3 unidades do atualizador), `testes/conferir.sh` (a rodada de teste), `testes/atualizador.sh`,
`testes/empacotar.sh`, `testes/navegador.py` e `testes/imagens.py` (só na nuvem; este confere que a tela sai igual às `testes/referencias/cena.json`), `ferramentas/montar-interface.sh` (gera `interface/` e `fonte/MAPA.md`), `ferramentas/escopo.sh` (a linha `Pastas:` do CHANGELOG tem de bater com as partes que mudaram), `ferramentas/montar-publicar.sh` (monta `publicar/`) e `ferramentas/empacotar.sh` (só na nuvem).

## 2. Regra desta pasta: não editar

`~/sexta-feira-engine` é a **instalação** que roda de verdade, e o atualizador mexe nela sozinho.

- Não editar, não fazer commit, não apagar, não criar arquivo versionado aqui. O atualizador recusa uma versão nova se algum arquivo
  versionado estiver diferente do que ele instalou.
- Pode ler, rodar `testes/conferir.sh` e diagnosticar (`journalctl --user -u engine-atualizador -e`).
- Mudanças chegam por **bundle**: `sexta-feira-engine-vX.Y.Z.bundle` em `~/Downloads`.
- Pastas do usuário/estado, nunca no git: `estado/` (trava, `atualizador-falhou.txt`, `atualizador-ignorar.txt`, `espelho`) e `publicar/`.

## 3. Ciclo de vida de uma versão

Igual ao da Sexta-Feira (seção 3 do `AGENTS.md` de lá), em resumo:

1. **Nuvem** (sessão do Claude): pedido resumido; desenho no Opus e 1º "sim"; código no Sonnet e 2º "sim"; branch `claude/...` (nunca a pasta
   instalada); mexe-se só em `fonte/` (nunca em `interface/`: rode `bash ferramentas/montar-interface.sh`); `testes/conferir.sh`, os testes do atualizador e do empacotador e, se mudou a tela, `python3 testes/navegador.py` e `python3 testes/imagens.py` (a tela tem de bater com as referências, ou a versão grava referências novas e diz por quê); a linha `Pastas:` no topo do CHANGELOG (`ferramentas/escopo.sh`); **auditoria independente** (obrigatória quando muda código); documentos da
   versão (`VERSAO`, topo do `CHANGELOG.md`, seção 7 daqui); `ferramentas/empacotar.sh` cria a tag leve `vX.Y.Z` e o bundle (o clone da nuvem NÃO pode ser raso: `git rev-parse --is-shallow-repository` tem de dar `false`, senão o bundle sai sem os objetos antigos, o `verify` passa e o PC recusa na hora de buscar as tags; o empacotador recusa clone raso e refaz a conferência do atualizador, apagando o bundle se falhar). A sessão só
   empurra o branch `claude/...`, nunca `main` nem tags.
2. **PC** (atualizador, sozinho): `engine-atualizador.path` (muda `~/Downloads`) e `.timer` (1 h) chamam `atualizar-engine.sh --auto`. Uma
   instância por vez (`flock`). Escolhe o bundle mais novo que o instalado e que o de `atualizador-ignorar.txt`, espera o download parar de
   crescer, confere num clone descartável (`git bundle verify`, tag, `VERSAO` de dentro igual ao nome, sem link, submódulo ou caminho
   suspeito; bundle que não passa aqui NÃO entra em lista nenhuma), recusa se a pasta tiver arquivo versionado mexido à mão ou se a
   história não continuar do commit instalado (essas recusas vão, pela soma sha256, para `atualizador-falhou.txt`), avança só para
   frente (`merge --ff-only`), roda `testes/conferir.sh`, remonta `publicar/`, sincroniza as unidades e avisa na área de trabalho.
3. **Rollback automático**: se o teste, a `publicar/` ou o systemd falhar, `git reset --keep` para o commit anterior, `publicar/` refeita da
   versão anterior, soma em `atualizador-falhou.txt` (o automático nunca mais tenta AQUELE arquivo; bundle refeito tem soma nova).
4. **Espelho** (opcional): com a deploy key em `~/sexta-feira-segredos/sexta-feira-engine/github/id_ed25519` (subpasta só do engine dentro da pasta de segredos da Sexta-Feira; ela nunca é montada em contêiner e o engine só lê esse arquivo), depois de instalar o atualizador empurra
   `main` e as tags ao GitHub. Falha do espelho só avisa (não há rollback).
5. **À mão** (só com o "sim" do Walisson): `./atualizar-engine.sh` (bundle mais novo), `./atualizar-engine.sh /caminho.bundle`,
   `--voltar vX.Y.Z` (volta e grava `atualizador-ignorar.txt`; para reinstalar a versão recusada, apague esse arquivo e rode com o caminho do `.bundle`), `--espelhar`.

Quem mudar o atualizador atualiza esta seção no mesmo commit.

## 4. Privacidade (inegociável)

O repositório é **PÚBLICO**. Nele só entram código e design: nunca dados, tickers, quantidades, preços, valores, segmentos, `config.toml`,
`.env`, chaves, tokens ou URLs de serviços do dono. Mesmas regras da seção 5 da Sexta-Feira:

- Quantidades, preços e segmentos das planilhas **nunca** vão para a interface, o log ou qualquer aviso.
- A interface só nomeia o que a Sexta-Feira publicar para o mapa; nunca link, fonte, servidor, texto de IA, trecho de PDF, token ou chave.
- Todo texto vindo da Sexta-Feira entra na tela por `textContent`, nunca `innerHTML`.
- Nada é carregado da internet (sem CDN, fonte externa, `fetch` para fora). `testes/conferir.sh` reprova.
- Segredos nunca em conversa nem no git. Não leia nem repita o conteúdo da pasta de segredos. O engine só lê a chave `github/id_ed25519` da
  subpasta `~/sexta-feira-segredos/sexta-feira-engine/`; nunca toca em `planilhas/`, `binance/` nem `bitget/`.

## 5. Contrato com a Sexta-Feira

- A interface é publicada em `publicar/` e servida pelo servidor do mapa da Sexta-Feira em `127.0.0.1:8765/engine/` (mesma origem; v0.55.0
  da Sexta-Feira). Os dados virão do que o mapa já publica, e os pedidos do `POST /ajuste`, conferidos pelo Núcleo.
- `publicar/` NUNCA é recriada, só tem o conteúdo trocado (`ferramentas/montar-publicar.sh`): o serviço do mapa a monta somente leitura
  e perderia o diretório se ele fosse substituído.
- Nomes em `interface/`: `[a-z0-9_-]+.(html|js|css|woff2|svg|json)`, até 4 MB, sem subpasta e sem link. É o mesmo filtro do servidor.
- Dados: por enquanto só `dados-ficticios.js` (`window.SF_DADOS`, `formato: 1`, `ficticio: true`). Esse formato é o contrato dos dados reais, que entram um bloco por vez;
  a tela só aceita o que passa pela lista branca de `tela.js` (`limpa`): ids de agente e de módulo fixos, estados fixos, textos curtos, inteiros pequenos. Nunca valor, quantidade, preço ou segmento.
  A v0.3.0 usa só `pedidos` (que módulos cada agente costuma pedir; até 12 por agente); o resto do formato é o contrato dos blocos que vêm depois.
- Gancho de teste: `window.SF_CENA` (a cena) e `window.SF_LIMPA` (a lista branca) só existem se `window.SF_TESTE` estiver definida antes dos scripts. Os testes de navegador definem; a tela real nunca expõe nada.
- Mesma origem do mapa (decisão do dono em 18/11, aceita): antes de a engine ganhar o canal de pedidos (`POST /ajuste`), decidir se ela exige confirmação própria ou se o
  servidor da Sexta-Feira distingue a origem. Até lá o `conferir.sh` proíbe chamadas de rede na interface.

## 6. Planos

v0.2.0, v0.3.0 e v0.4.0 (entregues): a tela do mapa com dados fictícios; a cena viva (axônios com pulso e cone de crescimento, lupa e foco); e a fonte em pastas isoladas (a tela sai idêntica à da v0.3.0). Próximos, um de cada vez e cada um com os seus dois "sim":

1. **v0.4.x, terminar o isolamento** (declarado na v0.4.0 e não feito): fatiar `neuronio/celula` (dendritos, anatomia, pintura, sinais, minis, lupa) e `cena/quadro` (ciclo, foco, posições) em partes com porta, uma pasta por vez, com `python3 testes/imagens.py` verde a cada passo; teste com as camadas ligadas parte por parte, foto da porta, roteiro do ciclo e tempo por parte (aviso); congelar as portas (`Proxy`); achar a causa da instabilidade das cenas de celular do `imagens.py` (ver seção 7).
2. **v0.4.1, sorteio separado por parte** (muda uma única vez o arranjo dos galhos; exige regravar as referências do `imagens.py` e dizer isso na versão).
3. Depois: dados reais um bloco por vez (exige a Sexta-Feira publicar o bloco e decidir o caminho dos dados: o `conferir.sh` hoje proíbe `fetch`); canal de pedidos (botões, lista fixa, com a decisão da seção 5); conversa (só sugere, nunca executa); CPU, GPU e RAM como neurônios menores (exige o backend publicar essas medidas); painéis de avisos pela lupa; axônios Robô–Corretora; botão do modo leve; layout próprio para celular em retrato.

Nada na Sexta-Feira muda antes de o desenho da engine estar pronto (decisão do dono, 18/11).

## 7. Registro das últimas entregas (leia antes de mexer)

Só as 2 últimas versões ficam aqui. Formato: o que mudou · arquivos · não mexer · como testar · armadilhas.

### v0.4.0 — a fonte em pastas isoladas (19/11)

- O que mudou: a tela é GERADA de `fonte/<camada>/<parte>/` por `ferramentas/montar-interface.sh` (só bash). `interface/` passa a ser saída (o `conferir.sh` reprova se ela diferir da montagem). Camadas: `base` < `comum` < `neuronio`, `ligacoes`, `dados` < `cena` < `tela` (mais `cores`, `laboratorio`); parte só usa camada abaixo (a juntadora é a única que usa irmãs); `PARTE` = manifesto (`nome`, `tipo`, `arquivo`, `saida`, `porta`, `compativel-desde`, `requer x@N`, `guarda`, `dom`, `juntadora`).
  O carregador `SF` (`fonte/base/carregador`, `interface/sf.js`) entrega a cada parte só o que ela pediu (`usa`), congela as portas e, nas partes `guarda: sim`, salva/restaura o canvas e desliga só a parte que falhar (nos testes o erro é relançado). Sorteio/relógio/canvas vêm de `usa.base` (`acaso`, `agora`, `canvas`).
  Partes: `base/carregador`, `comum/{sorteio,cores,curvas}`, `dados/{limpa,ficticios}`, `ligacoes/{ponta,pulso}`, `neuronio/celula` e `cena/quadro` (juntadoras, ainda inteiras), `tela/{inicio,pagina,estilo}`, `cores/cores`, `laboratorio/neuronio`.
  `testes/imagens.py` (nuvem): 9 cenas, 101 pontos, hash de cada canvas + captura; referências da v0.3.0 em `testes/referencias/cena.json`; a tela saiu idêntica. `ferramentas/escopo.sh` + linha `Pastas:` do CHANGELOG; o empacotador roda os dois.
- Arquivos: `fonte/**`, `ferramentas/{montar-interface.sh,escopo.sh,empacotar.sh}`, `testes/{imagens.py,referencias/cena.json,conferir.sh,atualizador.sh}`, `interface/*` (gerados; `sf.js` e `ligacoes.js` novos), `README.md`, `AGENTS.md`, `CHANGELOG.md`, `VERSAO`.
- NÃO mexer: `interface/` à mão; `fonte/MAPA.md` (gerado); `neuronio.html` (do dono; vive em `fonte/laboratorio/neuronio`); a ordem das chamadas de `usa.base.acaso()` (define o desenho: só a v0.4.1 muda); `ciclo` em `cena/quadro`; `VERSAO_ENGINE` sai do `VERSAO` pelo montador; `publicar/` nunca é recriada; `window.SF_CENA`/`SF_LIMPA` só com `SF_TESTE` (`tela/inicio`). Mudar `base`, `comum` ou `cores` AFETA TODAS: `Pastas: todas` e teste de imagem inteiro.
- Como testar: `bash testes/conferir.sh`, `bash testes/atualizador.sh`, `bash testes/empacotar.sh` e, na nuvem, `python3 testes/navegador.py` e `python3 testes/imagens.py` (`--cena X` para uma só).
- Declarado e NÃO feito (fica para a v0.4.x): fatiar `neuronio/celula` e `cena/quadro`; teste com camadas ligadas por parte, foto da porta, roteiro do ciclo e tempo por parte; congelar portas com `Proxy`; sorteio separado por parte (v0.4.1).
- Armadilhas: (1) as cenas de celular (retrato, paisagem; dpr 3) do `imagens.py` são instáveis até na v0.3.0 (cerca de 1 rodada em 3 muda o hash do canvas do Núcleo; aparece a ~200 ms simulados, perto do refino da lupa com orçamento em tempo real; causa não confirmada), então têm até 6 tentativas; (2) o `performance.now` do navegador de teste não é preso pelo relógio falso; (3) `poe_versao` do `testes/atualizador.sh` remonta a `interface/`: versão de teste muda `fonte/tela/pagina/index.html`, não `interface/`; (4) as regras do `conferir.sh` sobre partes são `grep` (podem ser burladas); (5) nada visto no PC real nem no systemd; o `imagens.py` vale para o Chromium da nuvem.

### v0.3.0 — a cena viva: axônios com pulso e cone de crescimento (19/11)

- O que mudou: a tela passa a ser a cena das prévias v01 a v11 aprovadas pelo dono. Núcleo no centro (com os módulos dentro), seis agentes ao redor, cada um com um par de axônios de mão
  única (`o-<id>` violeta, Núcleo para o agente; `i-<id>` da cor do agente, agente para o Núcleo), a Corretora parada ao lado do Robô. Ciclo do pedido: o axônio `i-` repousa apontando para o módulo mais
  pedido (o 1º da lista `pedidos` do agente); ao pedir, a ventosa se solta e vira um cone de crescimento (filopódios e véu) que leva a ponta até o módulo, assenta de frente no vidro, o pulso
  corre pelo tronco (liso e parado), o módulo excita, o neurônio central dispara e o pulso violeta, com a cor do pedido, volta ao agente; depois a ponta volta ao repouso. Lupa e foco por nome, botões
  −, + e 1:1, "← cena", `Esc`. Saíram a moldura da v0.2.0 e o botão do modo leve (`?leve=1` e "movimento reduzido" continuam).
- Arquivos: `interface/{cena.js (novo), neuronio.js (ampliado), tela.js, tela.css, index.html, cores.css (+9 `--cor-mod-*`), dados-ficticios.js (+`pedidos`)}`, `testes/{navegador.py,conferir.sh}`,
  `README.md`, `AGENTS.md`, `CHANGELOG.md`, `VERSAO`.
- NÃO mexer: `interface/neuronio.html` é do dono (independente da tela desde esta versão: o `neuronio.js` não é mais "gerado" dele); `tela.js` só usa `textContent` e lista branca (`limpa`, que agora filtra
  `pedidos` por ids fixos de agente e de módulo, até 12 por agente, com `hasOwnProperty`); `VERSAO_ENGINE` em `tela.js` = `VERSAO`; o selo "DADOS FICTÍCIOS" só sai com dados reais; `publicar/` nunca é recriada;
  `window.SF_CENA` e `window.SF_LIMPA` só existem com `window.SF_TESTE` (os testes dependem deles); `cena.js` conta um `ciclo` que `reiniciaCiclo` incrementa: callbacks de um pedido velho não agem depois de uma troca de foco ou redimensionamento.
- Como testar: `bash testes/conferir.sh`, `bash testes/atualizador.sh`, `bash testes/empacotar.sh` e, na nuvem, `python3 testes/navegador.py` (14 testes; o fps só é informado).
- Auditoria independente (agente separado): sem defeito grave nem médio. Achados leves e o que foi feito: (a) a regra do `eval` do `conferir.sh` não pegava `eval(` no começo da linha (agora `(^|[^A-Za-z_.])eval`); (b) o retorno de um
  pedido no ar podia agir depois de uma troca de foco ou redimensionamento (contador `ciclo` em `cena.js`); (c) o teste de dados maliciosos não provava o filtro de `pedidos` (agora confere `SF_LIMPA(...).pedidos` exato e `__proto__`);
  (d) o texto do plano da v0.4.0 citava "esta sessão" (agora resumido aqui, seção 6). Não corrigido por decisão: não há teste de redimensionar com foco nem de aba escondida (conferido à mão pelo auditor, sem defeito); o modo leve é medido por
  contagem de `drawImage`, que é só uma estimativa.
- Armadilhas: (1) o ciclo automático pode deixar um pedido no ar: testes que contam pedidos devem chamar `automatico(false)` antes do primeiro pedido (o `abre(auto=False)` do `navegador.py` faz isso); (2) o modo leve agora reduz menos (cerca de 3 vezes menos
  `drawImage`, não 3x folgado); (3) nada visto no PC real nem no systemd; (4) a v11 foi vista só em Chromium sem placa de vídeo (uns 58 fps em 1×, uns 29 em 2×).
