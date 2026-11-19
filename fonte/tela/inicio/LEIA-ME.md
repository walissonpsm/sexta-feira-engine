# tela/inicio

**O que faz**: monta a tela: lê as cores do CSS, filtra os dados (`usa.limpa.limpa`), cria a cena (`usa.quadro.criar`), liga os botões da lupa, "← cena", a tecla Esc, o redimensionamento e o laço de animação (`requestAnimationFrame`).
Só mostra: não pede, não decide, não guarda dado; todo texto entra por `textContent`.
**Porta**: `{}` (esta parte roda ao subir). **Usa**: `dados/limpa`, `cena/quadro`. **Mexe no DOM** (`dom: sim`).
**Gancho de teste**: `window.SF_CENA` e `window.SF_LIMPA` só existem se `window.SF_TESTE` estiver definida antes dos scripts.
**Armadilhas**: o modo leve (`?leve=1` ou movimento reduzido) limita a 24 quadros por segundo aqui.
**Testar**: `python3 testes/navegador.py`, `python3 testes/imagens.py`.
