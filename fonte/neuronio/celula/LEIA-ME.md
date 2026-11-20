# neuronio/celula (juntadora)

**O que faz**: o motor do neurônio: `criar(canvas, opções)` monta a célula (corpo, dendritos, axônio, terminais), os neurônios menores dos módulos, o vidro da esfera e a lupa, e devolve o objeto com `redimensionar`, `passo`, `desenhar`, `receber`, `lupa`... Cada canvas tem o seu neurônio, com estado próprio.
**Porta**: `{ criar }`. **Usa**: `comum/sorteio`, `comum/cores`, `comum/ramos` e as partes `neuronio/{recorte,anatomia,sinais,minis,escala,tinta,dendritos,corpo,axonio,terminais,camada,vidro,lupa,pulso}`. **Mexe no DOM** (`dom: sim`: canvases auxiliares e os ouvintes de roda/ponteiro da lupa).
**Nota (v0.4.2)**: agora é só a juntadora (~520 linhas): guarda o ESTADO do neurônio num objeto só (`Est`), cria uma instância de cada parte de `fonte/neuronio/*/` (`const P_<parte> = usa.<parte>.criar(Est, {...})`, na ordem das dependências) e orquestra `pintarCelula` e `drawFrame`, que chamam os órgãos na ordem original (a ordem muda o desenho). O código dos órgãos foi movido sem reescrever.
**NÃO mexer**: o desenho do neurônio (`neuronio.js`, do `neuronio.html` do dono) só muda com o dono pedindo; a ordem das chamadas de `usa.base.acaso()`.
**Testar**: `python3 testes/imagens.py`, `python3 testes/navegador.py`.

## O estado (`Est`)

Objeto único criado em `criar`; cada parte recebe `Est` e `d` (as funções irmãs que a juntadora liga). Regra: campos que mudam de valor (reatribuídos) são lidos e escritos como `Est.campo`; objetos que só são alterados por dentro (`config`, `runtime`, `anatomy`, as listas) são lidos de `Est` uma vez, no início da parte.
Grupos: o canvas e o contexto (`canvas`, `opc`, `ctx`, `DW`, `DH`); a vista e a lupa (`vista`, `lupa`, `VISTA_1`, `detalhe`, `refino`, `detZ`, `detLocal`, `pulsoZ`, `tmpCamada`); a configuração e o tempo de execução (`config`, `runtime`); os sinais vivos (`incomingSignals`, `actionPotentials`, `mistClouds`, `releasedNeurotransmitters`); os minis (`MINI_ESC`, `MINI_EIXO`, `miniAPs`, `EIXO_BASE`); e a anatomia (`anatomy`, com o corpo, os dendritos, o axônio e os terminais). A tabela por parte está no LEIA-ME de cada pasta (seção "Estado").
**Como mexer numa parte**: abra só a pasta dela, mude, rode `bash ferramentas/montar-interface.sh`, `bash testes/conferir.sh` e `python3 testes/imagens.py`; se mudar a porta ou os campos de `Est`, suba `porta:` no `PARTE`, atualize esta juntadora e grave a foto (`SF_GRAVAR_PORTAS=1 python3 testes/navegador.py`).
