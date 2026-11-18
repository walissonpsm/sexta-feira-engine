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

Arquivos: `interface/` (o que vai para a tela), `instalar-engine.sh`, `atualizar-engine.sh`, `systemd/` (3 unidades do atualizador),
`testes/conferir.sh` (a rodada de teste), `ferramentas/montar-publicar.sh` (monta `publicar/`) e `ferramentas/empacotar.sh` (só na nuvem).

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
   instalada); `testes/conferir.sh` e os testes do atualizador; **auditoria independente** (obrigatória quando muda código); documentos da
   versão (`VERSAO`, topo do `CHANGELOG.md`, seção 7 daqui); `ferramentas/empacotar.sh` cria a tag leve `vX.Y.Z` e o bundle. A sessão só
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

## 6. Planos

v0.2.0: a tela do mapa com dados fictícios (bordas como a moldura da Sexta-Feira, neurônio no centro, modo leve para a GPU); depois dados
reais um bloco por vez, canal de pedidos (botões, lista fixa) e conversa (só sugere, nunca executa); CPU, GPU e RAM como neurônios
menores (exige o backend publicar essas medidas).

## 7. Registro das últimas entregas (leia antes de mexer)

Só as 2 últimas versões ficam aqui. Formato: o que mudou · arquivos · não mexer · como testar · armadilhas.

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

### v0.1.0 — primeira versão (18/11)

- O que mudou: repositório criado com a interface mínima (`neuronio.html` igual ao arquivo do dono, `index.html` com link), instalador,
  atualizador (`--auto`, manual, caminho do bundle, `--voltar`, `--espelhar`), unidades do systemd, `testes/conferir.sh`, `ferramentas/`.
- Arquivos: tudo na raiz; `LICENSE` não muda.
- NÃO mexer: `CLAUDE.md` = `@AGENTS.md`; `examinar_bundle` é a mesma função no instalador e no atualizador (o `conferir.sh` compara);
  `publicar/` não é recriada; `interface/neuronio.html` é do dono (cores dele).
- Auditoria independente (feita nesta versão, agente separado): achou e foi corrigido (a) tag de versão recusada ficava no repositório e subia ao
  espelho (agora `recusar` apaga a tag); (b) `git reset --keep` sem guarda (agora `voltar_commit` avisa e para); (c) `StartLimitIntervalSec=0` no
  serviço e `TimeoutStartSec=15min` (o `.path` parava de vigiar depois de muitas mudanças em `~/Downloads`); (d) TOCTOU: soma, conferência
  e fetch agora usam uma cópia do bundle em `estado/`; (e) `notify-send --`; (f) `-i` do ssh com aspas; (g) `transfer.fsckObjects`; (h) link
  simbólico e dono também no modo manual; (i) versões sem zero à esquerda; (j) `publicar/` limpa também subpasta/link; (k) mais padrões de rede e segredo
  no `conferir.sh`; (l) testes sem asserções vazias. Não corrigido por decisão: recusa por "arquivo mexido à mão" ou "fora do main" também
  grava a soma (igual ao atualizador da Sexta-Feira; o manual com o caminho do bundle ignora a lista).
- Como testar: `bash testes/conferir.sh` e `bash testes/atualizador.sh` (instala e atualiza numa pasta temporária, sem systemd).
- Armadilhas: (1) sem `shellcheck` o conferir só confere a sintaxe. (2) O espelho liga sozinho quando a deploy key existe. (3) Nada visto
  em systemd real; no PC o primeiro disparo do `.path` mostra o que faltou.
