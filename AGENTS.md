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
`testes/empacotar.sh`, `testes/navegador.py`, `testes/camadas.py` (uma parte quebrada de cada vez), `testes/roteiro.py` (o ciclo de um pedido) e `testes/imagens.py` (só na nuvem; este confere que a tela sai igual às `testes/referencias/cena.json`), `ferramentas/montar-interface.sh` (gera `interface/` e `fonte/MAPA.md`), `ferramentas/escopo.sh` (a linha `Pastas:` do CHANGELOG tem de bater com as partes que mudaram), `ferramentas/montar-publicar.sh` (monta `publicar/`) e `ferramentas/empacotar.sh` (só na nuvem).

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
   instalada); mexe-se só em `fonte/` (nunca em `interface/`: rode `bash ferramentas/montar-interface.sh`); `testes/conferir.sh`, os testes do atualizador e do empacotador e, se mudou a tela, `python3 testes/navegador.py`, `python3 testes/camadas.py`, `python3 testes/roteiro.py` e `python3 testes/imagens.py` (a tela tem de bater com as referências, ou a versão grava referências novas e diz por quê); a linha `Pastas:` no topo do CHANGELOG (`ferramentas/escopo.sh`); **auditoria independente** (obrigatória quando muda código); documentos da
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
  Desde a v0.5.0 cada módulo de `pedidos` vira UM axônio de entrada parado (`i-<agente>#<módulo>`), no máximo 4 por agente (os 4 primeiros válidos, sem repetir; sem pedidos, um só, para o módulo mais perto),
  mais o violeta de volta (`o-<agente>`): quem decide quantos axônios o agente tem é a lista `pedidos`, nunca a tela.
- Gancho de teste: `window.SF_CENA` (a cena) e `window.SF_LIMPA` (a lista branca) só existem se `window.SF_TESTE` estiver definida antes dos scripts. Os testes de navegador definem; a tela real nunca expõe nada.
- Mesma origem do mapa (decisão do dono em 18/11, aceita): antes de a engine ganhar o canal de pedidos (`POST /ajuste`), decidir se ela exige confirmação própria ou se o
  servidor da Sexta-Feira distingue a origem. Até lá o `conferir.sh` proíbe chamadas de rede na interface.

## 6. Planos

v0.2.0 a v0.5.0 (entregues): a tela do mapa com dados fictícios; a cena viva (axônios com pulso e cone de crescimento, lupa e foco); a fonte em pastas isoladas (v0.4.0 a v0.4.2: `neuronio/celula` e `cena/quadro` viraram juntadoras finas, com as partes em pastas próprias; a tela sai idêntica à da v0.3.0, a não ser a regravação da cena `paisagem` da v0.4.2, explicada no CHANGELOG), as provas por parte (v0.4.3: parte quebrada de cada vez, roteiro do ciclo, tempo por parte, falha contida por órgão) o sorteio separado por pedaço da anatomia (v0.4.4; referências regravadas uma vez) e os axônios por módulo pedido, com rotas de GPS, terminal axonal novo e a cena abrindo em ~1,5 s (v0.5.0; referências regravadas, ver seção 7). Próximos, um de cada vez e cada um com os seus dois "sim":

1. Depois (um de cada vez; a instabilidade rara do `imagens.py` segue sem causa, ver seção 7): dados reais um bloco por vez (exige a Sexta-Feira publicar o bloco e decidir o caminho dos dados: o `conferir.sh` hoje proíbe `fetch`); canal de pedidos (botões, lista fixa, com a decisão da seção 5); conversa (só sugere, nunca executa); CPU, GPU e RAM como neurônios menores (exige o backend publicar essas medidas); painéis de avisos pela lupa; axônios Robô–Corretora; botão do modo leve; layout próprio para celular em retrato.

Pendências declaradas da v0.5.0 (nenhuma decidida): (a) ficam ~80 a 90 cruzamentos e alguns poucos trechos que correm juntos por pouco espaço (cada agente chega a módulos espalhados pelo vidro); (b) o código sem uso do plugar continua (`ponta.cone` e `ponta.ventosa`, os campos `ax.p`, `pAlvo`, `mdur`, `dDe`, `mt` e `alvoRel`): tirar numa versão própria, com a foto da porta; (c) nada foi visto no PC real, no systemd, num celular de verdade nem com placa de vídeo.

Nada na Sexta-Feira muda antes de o desenho da engine estar pronto (decisão do dono, 18/11).

## 7. Registro das últimas entregas (leia antes de mexer)

Só as 2 últimas versões ficam aqui (a estrutura geral da fonte está resumida na v0.4.2: como mexer numa parte, camadas, `PARTE`). Formato: o que mudou · arquivos · não mexer · como testar · armadilhas.

### v0.4.4 — sorteio separado por pedaço da anatomia (20/11)

- O que mudou: em `neuronio/anatomia` o contorno do corpo (`rngDe('contorno')`), cada tronco (`dendrito:<i>`) e cada contato (`contato:<j>`) têm o próprio sorteio (`rngDe(nome)` = semente do neurônio xor hash do nome); `growDendrite` recebe o `rd` do pedaço. O carregador, com `SF_TESTE`, dá a cada parte o próprio `usa.base.acaso` (`baseDe(nome)`) e expõe `SF.porta(nome)`; a celula expõe `anatomia()` (só geometria). Os galhos caem em outros lugares UMA vez; o resto da tela é igual. Referências regravadas: `cena.json` e `roteiro.json` (motivo acima); `portas.json` não mudou.
- Arquivos: `fonte/{neuronio/anatomia,base/carregador,neuronio/celula}/*`, `interface/*` e `fonte/MAPA.md` (gerados), `testes/{navegador.py,referencias/{cena.json,roteiro.json}}`, `VERSAO`, `CHANGELOG.md`, `README.md`, este arquivo. `Pastas: todas` (mudou `base`).
- NÃO mexer: o `terminalRng` (sorteio dos terminais) ficou como era; a ORDEM dos pedaços e dos nomes em `rngDe` (mudar um nome muda os galhos dele e reprova as referências); `anatomia()` nunca devolve quantidade, preço ou dado; `SF.porta` só existe com `SF_TESTE`.
- Como testar: `bash testes/conferir.sh`, `bash testes/atualizador.sh`, `bash testes/empacotar.sh`, `python3 testes/navegador.py` (19 testes), `python3 testes/camadas.py`, `python3 testes/roteiro.py`, `python3 testes/imagens.py`. Para regravar de novo (sempre com o motivo na versão): `python3 testes/imagens.py --gravar`, `SF_GRAVAR_ROTEIRO=1 python3 testes/roteiro.py`.
- Instabilidade que sobrou no `imagens.py` (cerca de 1 em 100, canvas da parede em t01 de `ciclo-cripto-2x`): causa NÃO achada; 20 rodadas seguidas não a reproduziram. Contida pela nova tentativa (até 4).
- Decisão registrada: guarda nas funções internas NÃO volta (mudaria o desenho e o tempo da lupa).
- Armadilhas: (1) mudar o nome de um pedaço em `rngDe` ou a ordem de criação dos dendritos de contato muda os galhos; (2) o teste de separação precisa de `redimensionar` antes de ler a anatomia (ela só é montada aí); (3) nada visto no PC real nem no systemd.

### v0.5.0 — um axônio por módulo pedido, rotas de GPS e terminal axonal novo (20/11)

- O que mudou: (1) cada agente ganha UM axônio de entrada PARADO por módulo que pede (`i-<agente>#<módulo>`, no máximo 4; sem pedidos, 1 para o módulo mais perto) e o violeta de volta (`o-<agente>`); o pedido só dispara o pulso no axônio do módulo (sem plugar, sem cone, sem desplugar; `ax.p` fica em 1); `SF_CENA.pedir(agente, módulo)` devolve `false` se o módulo não tem axônio do agente. (2) Rotas de GPS: `cena/rotas` (novo: lado, pista 0 a 5, ordem e ponto de pouso; terminais do mesmo módulo lado a lado, vão `26·s + 4` px) e `ligacoes/caminho` (novo, com guarda: ajuste fino de 200 passos e chegada de frente ao vidro); `comum/curvas@2` (`chegada`, `ponte`), `ligacoes/pistas@2` (`esboco`). (3) `ligacoes/ponta@2` (`terminal`: telodendros, pés achatados, neurotransmissores) e `ligacoes/tronco@2` (bainhas variadas, inchaço do pulso, sem contorno escuro, dendritos por cima e por baixo, caminhos guardados por axônio em `ax.cT`). (4) `neuronio/minis` mais espalhados. (5) Velocidade: a cena abre em ≤ 1,5 s na tela grande e ≤ 1 s no celular deitado (melhor de 3, Chromium sem GPU) sem mudar o desenho: a geometria dá 0,00 px contra a versão direta e a tela com o tronco guardado é idêntica pixel a pixel.
- Arquivos: `fonte/{cena/ciclo,cena/eixos,cena/foco,cena/ligar,cena/quadro,cena/rotas,comum/curvas,ligacoes/caminho,ligacoes/pistas,ligacoes/ponta,ligacoes/tronco,neuronio/minis}/*`, `interface/*` e `fonte/MAPA.md` (gerados), `testes/{navegador.py,roteiro.py,referencias/{cena.json,portas.json,roteiro.json}}`, `VERSAO`, `CHANGELOG.md`, `README.md`, este arquivo. `Pastas: todas` (mudou `comum`).
- NÃO mexer: o `id` `i-<agente>#<módulo>` (ciclo, foco, testes e lista de ligações dependem dele) e a ordem de criação em `cena/ligar` (violeta primeiro, depois as entradas na ordem de `modulosDe`); a chave numérica da grade de vizinhos `(gx + 4096) * 8192 + gy + 4096` (igual em `cena/ligar` e `ligacoes/caminho`); os pesos do custo e as 4 rodadas de `cena/rotas`; as 200 iterações e a janela 40..188 de `ligacoes/caminho` (o passo 40 é o do guardado `ax.ck`); o vão do terminal `26·s + 4` (tem de bater com o que `ponta.terminal` ocupa); a ordem dos traços do tronco e as espessuras `QG`; `ax.cT` só nasce em `pintaEixo` e só morre em `medeEixo`.
- Como testar: `bash testes/conferir.sh`, `bash testes/atualizador.sh`, `bash testes/empacotar.sh` (só passa com a `VERSAO` commitada e a tag da versão ainda inexistente), `python3 testes/navegador.py` (33 testes, ~3 min), `python3 testes/camadas.py` (34 partes), `python3 testes/roteiro.py`, `python3 testes/imagens.py`. Regravar (sempre com o motivo na versão): `python3 testes/imagens.py --gravar`, `SF_GRAVAR_ROTEIRO=1 python3 testes/roteiro.py`, `SF_GRAVAR_PORTAS=1` (no teste da foto da porta).
- Armadilhas: (1) `ax.ck` (ajuste fino) e `ax.cT` (tronco) são guardados por axônio: quem mudar `ax.base`, `ax.obst` ou `ax.pts` sem trocar a lista tem de apagá-los (os axônios nascem de novo a cada montagem, então o guardado nunca atravessa uma montagem). (2) O tempo de abertura (`test_a_cena_abre_rapido...`: melhor de 3, limites 1,5 s e 1,0 s) varia ±0,2 s numa máquina ocupada; se reprovar por pouco, rode de novo antes de mexer. (3) O `roteiro.py` pede sempre o 1º módulo do agente (não depende do sorteio) e a referência vale para o Chromium da nuvem. (4) Cruzamentos: 80 a 90 por tela (teto do teste: 100) e até 12 larguras de linha de trechos que correm juntos (teto: 15); não são defeito novo, e baixar o teto sem mexer em `cena/rotas` reprova. (5) O `test_dados_maliciosos_sao_ignorados` estava definido duas vezes na v0.4.4 (a 1ª nunca rodava): na v0.5.0 é um só. (6) Nada visto no PC real, no systemd, num celular de verdade nem com placa de vídeo; a instabilidade rara do `imagens.py` (cerca de 1 em 100) segue sem causa achada.
