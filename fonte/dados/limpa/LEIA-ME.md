# dados/limpa

**O que faz**: o catálogo fixo (agentes, Núcleo, Corretora, módulos, com as cores padrão) e a **lista branca** `limpa(d)`: tudo que vem de `window.SF_DADOS` passa por aqui antes da tela ver. Só entram ids de agente e de módulo
do catálogo, estados fixos, textos curtos sem caracteres de controle, inteiros de 0 a 9999 e, em `pedidos`, até 12 módulos por agente, SEM repetir (repetir o mesmo módulo não gasta as vagas dos outros; só as 100 primeiras entradas são lidas). Valor, quantidade, preço e segmento nunca entram.
**Porta**: `{ limpa, AGENTES, NUCLEO, CORRETORA, MODULOS }`. **Usa**: nada.
**Não mexer**: o `hasOwnProperty` nos ids (barra `__proto__`) e a regra de nunca aceitar texto que vire HTML (a tela só usa `textContent`). Id novo de agente ou de módulo nasce aqui e no `cores.css`.
**Armadilhas**: o teste de navegador usa `window.SF_LIMPA` (gancho só com `SF_TESTE`). Dado real novo entra aqui, um bloco por vez, com teste de entrada maliciosa.
**Testar**: `python3 testes/navegador.py` (dados maliciosos) e `bash testes/conferir.sh`.
