# Changelog — Sexta-Feira Engine

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
