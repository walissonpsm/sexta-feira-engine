# comum/cores

**O que faz**: conversões de cor: `hexParaRgb`, `rgbDe`, `ehCor` (valida `#RRGGBB`) e os tons das ligações (`clar` clareia, `esc` escurece, `rgba` monta o texto de cor com alfa limitado a 0..1).
**Porta**: `{ hexParaRgb, ehCor, rgbDe, clar, esc, rgba }`. **Usa**: nada. Sem guarda (funções puras chamadas por ponto).
**Não mexer**: o arredondamento de `esc` e o `toFixed(3)` de `rgba` (mudam a cor de todos os traços por 1 nível e a imagem de referência muda).
**Armadilhas**: afeta todas as partes de desenho; declarar `Pastas: comum/cores`.
**Testar**: `python3 testes/imagens.py`.
