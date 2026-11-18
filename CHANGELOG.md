# Changelog — Sexta-Feira Engine

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
