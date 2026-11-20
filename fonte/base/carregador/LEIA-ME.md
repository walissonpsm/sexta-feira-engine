# base/carregador (SF)

**O que faz**: registra as partes (`SF.parte(manifesto, fábrica)`, escrito pelo montador a partir do `PARTE` e do `parte.js`), resolve na ordem das dependências e entrega a
cada parte só as portas que ela declarou (`usa.<parte>`, congeladas) mais `usa.base`. Contém as falhas: parte que dá erro é desligada e a tela segue.

**Porta (`usa.base`)**: `versao`, `teste`, `acaso()`, `agora()`, `canvas(l, a)`, `confere(cond, msg)`, `seguro(nome, fn)`, `aoDesligar(cb)`.
Fora daqui, ninguém lê `Math.random`, `Date`, `performance` nem `window.SF_TESTE` (o `conferir.sh` reprova).

**Guarda** (partes com `guarda: sim`): cada função da porta que recebe um contexto 2D como 1º argumento faz `save()` antes e `restore()` depois (o que a parte muda no canvas
não vaza); se der erro, só aquela parte é desligada (`console.error` com a pilha, e a tela mostra "parte desligada"). No teste (`SF_TESTE`), o erro sobe e reprova.

**Usa**: nada (é a base). **Não mexer**: a ordem de `acaso()` (a sequência do sorteio é parte do desenho: mudar a ordem de quem sorteia muda a imagem) e o `Object.freeze` das portas.
`@VERSAO@` é trocado pelo montador (arquivo `VERSAO`).

**Armadilhas**: (1) a guarda só deve embrulhar portas grossas (uma chamada por objeto por quadro), nunca funções finas chamadas por ponto: essas ficam em `comum/` (sem guarda).
(2) Objetos devolvidos por uma porta não são embrulhados: quem os recebe pode mudá-los (o isolamento de estado entre partes ainda é por regra, não por proteção; a v0.4.1 deve fechar isso no teste).
(3) `SF.portas()` e `SF.desligadas()` só existem com `SF_TESTE`.

**Como testar**: `bash testes/conferir.sh` (estrutura, dependências, globais proibidos) e `python3 testes/imagens.py` (a tela tem de sair idêntica).

**Limites da falha contida**: `seguro` NÃO salva/restaura o canvas (só a guarda das portas faz isso); quem usar `seguro` num desenho que mude `ctxP` deve fazer o próprio save/restore (a `neuronio/celula` faz, no `orgao`). O aviso na tela é a parte `tela/aviso` (v0.4.3), que não depende de nenhuma outra e por isso avisa também quando a cena ou a `tela/inicio` caem.
**Só nos testes (`SF_TESTE` objeto)**: `{ estrito: false }` contém as falhas em vez de relançar; `{ quebrar: '<parte>' }` faz aquela parte falhar ao montar (o `testes/camadas.py` usa, uma parte por vez); `{ medir: true }` cronometra as funções das portas e, um nível abaixo, os métodos do objeto devolvido (`SF.tempos()`; só informa, nunca reprova; muda o tempo real, por isso nunca no `imagens.py`).
