# Sexta-Feira Engine

A parte visual da **Sexta-Feira** e o meio de comunicação entre o dono e ela. O engine não tem lógica, dados nem decisões próprias: mostra o que a Sexta-Feira publica e, no futuro, leva pedidos até ela (quem confere e aplica é o Núcleo). A única parte "inteligente" é o seu próprio atualizador.

## O neurônio (`interface/neuronio.html`)

Visualização interativa em HTML5 Canvas, sobre fundo preto, que representa a arquitetura do agente **Sexta-Feira** como um neurônio completo. Será a Sexta-Feira no centro do mapa.

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
chmod 700 ~/sexta-feira-segredos ~/sexta-feira-segredos/sexta-feira-engine ~/sexta-feira-segredos/sexta-feira-engine/github
ssh-keygen -t ed25519 -N "" -C "sexta-feira-engine deploy" -f ~/sexta-feira-segredos/sexta-feira-engine/github/id_ed25519
```

Depois cadastre o `id_ed25519.pub` em *Settings → Deploy keys* do repositório com "Allow write access". A Sexta-Feira só monta as subpastas `planilhas/`, `binance/` e `bitget/` dessa pasta: a `sexta-feira-engine/` fica fora de qualquer contêiner.

## Atualização

Baixe o novo `.bundle` para `~/Downloads`. O atualizador (`engine-atualizador.path` e `.timer`) confere, instala, testa e, se algo falhar, volta sozinho. Avisa pela área de trabalho e pelo journal (`journalctl --user -u engine-atualizador -e`).

À mão: `./atualizar-engine.sh`, `./atualizar-engine.sh --voltar vX.Y.Z`, `./atualizar-engine.sh --espelhar`.

Regras para agentes de código: `AGENTS.md`. Licença: AGPL-3.0.
