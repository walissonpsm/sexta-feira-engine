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

Arquivos: `interface/` (o que vai para a tela: `index.html`, `tela.css`, `tela.js`, `cores.css`, `neuronio.js`, `dados-ficticios.js` e o `neuronio.html` do dono),
`instalar-engine.sh`, `atualizar-engine.sh`, `systemd/` (3 unidades do atualizador), `testes/conferir.sh` (a rodada de teste), `testes/atualizador.sh`,
`testes/empacotar.sh`, `testes/navegador.py` (só na nuvem), `ferramentas/montar-publicar.sh` (monta `publicar/`) e `ferramentas/empacotar.sh` (só na nuvem).

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
   instalada); `testes/conferir.sh`, os testes do atualizador e do empacotador e, se mudou a tela, `python3 testes/navegador.py`; **auditoria independente** (obrigatória quando muda código); documentos da
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
  a tela só aceita o que passa pela lista branca de `tela.js` (`limpa`): ids de agente fixos, estados fixos, textos curtos, inteiros pequenos. Nunca valor, quantidade, preço ou segmento.
- Mesma origem do mapa (decisão do dono em 18/11, aceita): antes de a engine ganhar o canal de pedidos (`POST /ajuste`), decidir se ela exige confirmação própria ou se o
  servidor da Sexta-Feira distingue a origem. Até lá o `conferir.sh` proíbe chamadas de rede na interface.

## 6. Planos

v0.2.0 (entregue): a tela do mapa com dados fictícios. Próximos, um de cada vez e cada um com os seus dois "sim": dados reais um bloco por vez (exige a
Sexta-Feira publicar o bloco e decidir o caminho dos dados: o `conferir.sh` hoje proíbe `fetch`); canal de pedidos (botões, lista fixa, com a decisão da seção 5);
conversa (só sugere, nunca executa); CPU, GPU e RAM como neurônios menores (exige o backend publicar essas medidas). Nada na Sexta-Feira muda antes de o desenho
da engine estar pronto (decisão do dono, 18/11).

## 7. Registro das últimas entregas (leia antes de mexer)

Só as 2 últimas versões ficam aqui. Formato: o que mudou · arquivos · não mexer · como testar · armadilhas.

### v0.2.0 — a tela do mapa, com dados fictícios (18/11)

- O que mudou: `interface/index.html` virou a tela (neurônio da Sexta-Feira no centro, seis agentes como neurônios menores, Corretora como satélite parado ao lado do Robô,
  moldura em volta com as medidas do mapa, 1672×941 escalado inteiro). Tudo fictício, com selo "DADOS FICTÍCIOS". `neuronio.js` é o motor do `neuronio.html` em forma de
  fábrica (`Neuronio.criar(canvas, opções)`); `cores.css` guarda só as cores (o dono edita; os neurônios leem as mesmas variáveis); modo leve (`?leve=1`, botão, movimento reduzido).
  `ferramentas/empacotar.sh` recusa clone raso e refaz a conferência do atualizador (o bundle da Sexta-Feira v0.55.0 saiu incompleto por isso).
- Arquivos: `interface/{index.html,tela.css,tela.js,cores.css,neuronio.js,dados-ficticios.js}`, `testes/{conferir.sh,empacotar.sh,navegador.py}`, `ferramentas/empacotar.sh`,
  `README.md`, `AGENTS.md`, `CHANGELOG.md`, `VERSAO`.
- NÃO mexer: `interface/neuronio.html` é do dono (laboratório de cores); `tela.js` só usa `textContent` e lista branca (`limpa`); o `conferir.sh` proíbe rede, `innerHTML` e
  `eval` na tela (só o `neuronio.html` fica fora da regra do HTML dinâmico); o selo "DADOS FICTÍCIOS" mora no `index.html` e só sai quando houver dados reais (aí a regra do
  `conferir.sh` muda junto); `VERSAO_ENGINE` em `tela.js` = `VERSAO`; `publicar/` nunca é recriada; o desenho do neurônio (`neuronio.js`, gerado do `neuronio.html`) não se edita à mão sem o dono.
- Como testar: `bash testes/conferir.sh`, `bash testes/atualizador.sh`, `bash testes/empacotar.sh` (sobre o último commit) e, na nuvem, `python3 testes/navegador.py`.
- Auditoria independente (agente separado): sem defeito grave. Achou e foi corrigido: (a) o canvas do Núcleo cobria os nomes e roubava o clique de Ações e ETFs e Cripto (o `mix-blend-mode` passou para a caixa `.nr`, o centro ficou com `pointer-events: none`, e há teste que clica no nome de cada agente); (b) `empacotar.sh` não apagava o bundle se o clone ou a `VERSAO` da tag falhasse (agora usa `recusa`); (c) a tag anterior era "a maior diferente" e agora é a logo abaixo (`sort -V`); (d) `location[[:space:]]*=` reprovava `===` (agora `=([^=]|$)`); (e) o foco do teclado se perdia ao abrir o detalhe (volta para o botão "voltar" e depois para o agente) e o `role="application"` virou `region`; (f) o satélite da Corretora saiu de dentro da caixa do Núcleo. Não corrigido por decisão: as regras 3 e 3b do `conferir.sh` são `grep` e podem ser burladas (`'inner'+'HTML'`); a barreira real é a CSP `connect-src 'self'` do servidor da Sexta-Feira.
- Armadilhas: (1) os neurônios pequenos não animam no modo leve (só o brilho do pulso); (2) as telas cuja proporção não é 16:9 ganham faixas pretas (a tela é escalada inteira);
  (3) `mix-blend-mode: screen` nos canvases deixa os neurônios se sobreporem sem cobrir o vizinho; (4) o teste do modo leve conta chamadas de `drawImage`, não quadros por segundo reais;
  (5) o `testes/atualizador.sh` troca `VERSAO` e `VERSAO_ENGINE` juntos (`poe_versao`); quem criar versões de teste à mão faz o mesmo, senão o `conferir.sh` reprova; (6) o `conferir.sh` não é barreira completa contra código malicioso (só pega o óbvio); (7) nada visto no PC real nem no systemd.

### v0.1.1 — a chave do espelho na pasta de segredos (18/11)

- O que mudou: o padrão de `SEGREDOS_DIR` passou de `~/sexta-feira-engine-segredos` para `~/sexta-feira-segredos/sexta-feira-engine` (a chave
  continua em `github/id_ed25519`). O instalador avisa (sem mudar nada) se a pasta `github` não estiver em 700 ou a chave em 600. Textos,
  README e este arquivo atualizados. O teste do atualizador passou a usar versões `7.0.x` (não depende mais da versão do repositório) e
  ganhou casos da chave (espelho liga sozinho, `core.sshCommand`, avisos de permissão).
- Arquivos: `atualizar-engine.sh`, `instalar-engine.sh`, `testes/atualizador.sh`, `README.md`, `AGENTS.md`, `CHANGELOG.md`, `VERSAO`.
- NÃO mexer: a pasta `sexta-feira-segredos/` é da Sexta-Feira (o atualizador dela só cria `binance/` e `bitget/` e o `docker-compose.yml` monta
  `planilhas/`, `binance/` e `bitget/`): o engine só usa a subpasta `sexta-feira-engine/`. Quem mexer no `docker-compose.yml` da Sexta-Feira nunca
  deve montar a pasta inteira.
- Auditoria independente (agente separado): sem defeito grave. Corrigido: o teste agora usa de verdade o caminho padrão (SEGREDOS_DIR não é exportado),
  o caso do instalador usa um espelho próprio, `ligar_espelho` recusa também pasta em link simbólico e o README não manda mudar a permissão da
  pasta-mãe `~/sexta-feira-segredos` (é da Sexta-Feira).
- Como testar: `bash testes/conferir.sh` e `bash testes/atualizador.sh`.
- Armadilhas: (1) a v0.1.0 nunca foi instalada no PC, então não há migração do caminho antigo. (2) Se `~/sexta-feira-segredos` não existir, o
  espelho só fica desligado (o instalador avisa).
