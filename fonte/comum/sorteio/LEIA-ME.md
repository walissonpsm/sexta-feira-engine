# comum/sorteio

**O que faz**: `criar(semente)` devolve um sorteio com semente (o mesmo do `neuronio.html` do dono: sequência congruencial, números de 0 a 1) e `hash(texto)` devolve o hash FNV de um texto.
**Porta**: `{ criar, hash }`. **Usa**: nada. Sem guarda (funções puras, chamadas muitas vezes).
**Não mexer**: a conta do `criar` (muda o arranjo de todos os galhos); quem sorteia sem semente usa `usa.base.acaso()`, nunca `Math.random`.
**Armadilhas**: mudar esta parte afeta todas (comum): a versão tem de declarar `Pastas: comum/sorteio` e o teste de imagem completo.
**Testar**: `python3 testes/imagens.py`.
