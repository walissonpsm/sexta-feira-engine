# dados/ficticios

**O que faz**: os dados de mentira que a tela mostra enquanto não há dados reais (`window.SF_DADOS`, `formato: 1`, `ficticio: true`), inclusive os `pedidos` (que módulos cada agente costuma pedir). Copiado como está para `interface/dados-ficticios.js`.
**Porta**: nenhuma (arquivo cru, carregado antes do `sf.js`). **Usa**: nada.
**Não mexer**: nunca ponha aqui valor, ticker, quantidade, preço ou segmento reais (o repositório é público); `ficticio: true` é obrigatório enquanto houver selo "DADOS FICTÍCIOS".
**Testar**: `python3 testes/navegador.py`.
