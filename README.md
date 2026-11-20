# Sexta-Feira Engine

A parte visual da **Sexta-Feira** e o meio de comunicação entre o dono e ela. O engine não tem lógica, dados nem decisões próprias: mostra o que a Sexta-Feira publica e, no futuro, leva pedidos até ela (quem confere e aplica é o Núcleo). A única parte "inteligente" é o seu próprio atualizador.

## A tela (`interface/index.html`)

Abra `http://127.0.0.1:8765/engine/` (servida pelo mapa da Sexta-Feira). No centro, o neurônio da Sexta-Feira (o Núcleo) com os módulos dentro; em volta, os seis agentes como neurônios menores, cada um com **um axônio de entrada para cada módulo que ele pede** (até quatro; um só, para o módulo mais perto, se não houver pedidos) e um axônio violeta de volta; a Corretora fica parada ao lado do Robô. Os axônios são curvas suaves que contornam o que encontram e chegam de frente ao terminal, no vidro do Núcleo. De tempos em tempos um agente faz um pedido de mentira: o pulso corre direto no axônio do módulo pedido (nada se solta nem se move), o terminal acende, o módulo leva o sinal ao centro e o Núcleo responde pelo violeta. Toque no nome de uma esfera (ou gire a roda do mouse sobre ela) para ampliar; os botões −, + e 1:1, "← cena" e `Esc` ajustam e voltam.

**Nesta versão tudo é fictício** (selo "DADOS FICTÍCIOS"): a tela só mostra `dados-ficticios.js`. Os dados reais entram depois, um bloco por vez, no mesmo formato.

- **Suas cores**: edite só `fonte/cores/cores/cores.css` e rode `bash ferramentas/montar-interface.sh` (copia para `interface/cores.css`) (variáveis `--cor-...`); a borda e o neurônio de cada agente e cada módulo seguem a variável dele.
- **Modo leve** para poupar a GPU: `?leve=1` no endereço, ou automático se o sistema pede movimento reduzido.
- **A fonte (v0.4.0 em diante)**: a tela é gerada de `fonte/<camada>/<parte>/` (cada parte com `PARTE`, o código, `LEIA-ME.md`); `interface/` é o resultado e **não se edita à mão**. Para mudar uma parte: abra só a pasta dela (e o `LEIA-ME.md`), rode `bash ferramentas/montar-interface.sh` e confira com `bash testes/conferir.sh`. O mapa de quem usa quem está em `fonte/MAPA.md`.
- Arquivos gerados em `interface/`: `index.html` (estrutura), `tela.css` (layout), `tela.js` (monta a tela, só com `textContent`), `cena.js` (a cena e o ciclo do pedido), `ligacoes.js` (a ponta e o pulso dos axônios), `neuronio.js` (o motor de desenho do neurônio), `sf.js` (o carregador das partes), `dados-ficticios.js`.

## O laboratório do neurônio (`interface/neuronio.html`)

Visualização interativa em HTML5 Canvas, sobre fundo preto, que representa a arquitetura do agente **Sexta-Feira** como um neurônio completo. É o laboratório de cores do dono e não muda; ele é independente da tela (o motor da tela, `neuronio.js`, nasceu dele, mas hoje é mantido à parte).

- **Dendritos afilados** com espinhas sinápticas e propagação de sinais de entrada.
- **Soma multipolar** com textura citoplasmática e núcleo pulsante.
- **Axônio saltatório** com segmentos de bainha de mielina e nódulos de Ranvier.
- **Terminais pré-sinápticos** com vesículas, exocitose e dispersão de neurotransmissores.
- **Controles em tempo real**:
  - modos de carga de uso (*Ocioso*, *Normal* e *Pico*);
  - alternância individual de camadas e comportamentos;
  - troca rápida de identidade cromática por agente ou seletor RGB personalizado;
  - cópia da configuração em JSON.

Não depende de nada externo: abre direto em qualquer navegador moderno.

## Instalação (uma vez)

1. Baixe `sexta-feira-engine-vX.Y.Z.bundle` e `instalar-engine.sh` para `~/Downloads`.
2. Rode `bash ~/Downloads/instalar-engine.sh`.
3. Pronto: a pasta fica em `~/sexta-feira-engine` e o atualizador liga sozinho no systemd do usuário.

Espelho opcional no GitHub: coloque a chave em `~/sexta-feira-segredos/sexta-feira-engine/github/id_ed25519` (deploy key com escrita) antes de instalar, ou depois e rode `~/sexta-feira-engine/atualizar-engine.sh --espelhar`. Como criar a chave:

```bash
mkdir -p ~/sexta-feira-segredos/sexta-feira-engine/github
chmod 700 ~/sexta-feira-segredos/sexta-feira-engine ~/sexta-feira-segredos/sexta-feira-engine/github
ssh-keygen -t ed25519 -N "" -C "sexta-feira-engine deploy" -f ~/sexta-feira-segredos/sexta-feira-engine/github/id_ed25519
```

Depois cadastre o `id_ed25519.pub` em *Settings → Deploy keys* do repositório com "Allow write access". A pasta `~/sexta-feira-segredos` é da Sexta-Feira (o engine não muda as permissões dela). A Sexta-Feira só monta as subpastas `planilhas/`, `binance/` e `bitget/` dessa pasta: a `sexta-feira-engine/` fica fora de qualquer contêiner.

## Atualização

Baixe o novo `.bundle` para `~/Downloads`. O atualizador (`engine-atualizador.path` e `.timer`) confere, instala, testa e, se algo falhar, volta sozinho. Avisa pela área de trabalho e pelo journal (`journalctl --user -u engine-atualizador -e`).

À mão: `./atualizar-engine.sh`, `./atualizar-engine.sh --voltar vX.Y.Z`, `./atualizar-engine.sh --espelhar`.

Regras para agentes de código: `AGENTS.md`. Licença: AGPL-3.0.
