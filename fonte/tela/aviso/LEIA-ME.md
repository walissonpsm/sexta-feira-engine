# tela/aviso

O aviso de falha contida: uma linha curta (`#aviso-falha`) quando qualquer parte, esfera ou axônio é desligado.

**Porta**: `{}` (não oferece nada; só escuta `usa.base.aoDesligar`). **Usa**: só `usa.base`. **Mexe no DOM** (`dom: sim`): cria o elemento só na falha, com `textContent`.
**Por que é parte própria (v0.4.3)**: com o `requer` vazio, ela sobe mesmo quando a cena ou a `tela/inicio` caem. Antes o aviso morava em `tela/inicio` e não cobria esse caso.
**Armadilhas**: o carregador repete para ela as falhas anteriores ao registro (`aoDesligar` reenvia), então a ordem de montagem não importa.
**Testar**: `python3 testes/camadas.py`, `python3 testes/navegador.py`.
