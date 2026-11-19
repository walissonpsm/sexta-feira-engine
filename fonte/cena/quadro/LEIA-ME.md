# cena/quadro (juntadora)

**O que faz**: a cena inteira (por enquanto): posições do Núcleo, dos seis agentes e da Corretora, as ligações (um par de axônios por agente), o ciclo do pedido, o foco/lupa e o quadro. Cada esfera é um `celula.criar` próprio.
**Porta**: `{ criar }` (`criar(elemento, config)` devolve a cena: `ajustar`, `quadro`, `focar`, `sair`, `esferas`, `ligacoes`, `pedir`, `lupa`, `aoMudar`...).
**Usa**: `neuronio/celula`, `comum/sorteio`, `comum/cores`, `comum/curvas`. **Mexe no DOM** (`dom: sim`: cria os canvases e os botões de nome).
**Nota**: esta parte ainda reúne várias coisas que a v0.4.x separa por pasta (ver o `AGENTS.md`, seção 6). O que já saiu daqui está em `fonte/ligacoes/` e `fonte/comum/`.
**Armadilhas**: o contador `ciclo` cancela retornos de pedidos velhos depois de uma troca de foco; a ordem das chamadas de `usa.base.acaso()` define o desenho (não reordenar).
**Testar**: `python3 testes/imagens.py`, `python3 testes/navegador.py`.
