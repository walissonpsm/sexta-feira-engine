/* Sexta-Feira Engine: o motor do neurônio (v0.3.0).
 * Vem do neuronio.html do dono (desenho aprovado: soma, dendritos, axônio, terminais), transformado em fábrica: cada canvas tem o seu
 * neurônio, com estado próprio. Só desenha; não lê dado, não usa rede, não mexe em nada fora do canvas que recebe.
 *
 *   var n = Neuronio.criar(canvas, { cor: '#8B3DFF', semente: 94127, leve: false });
 *   n.redimensionar(largura, altura);   // em pixels CSS; refaz o desenho estático
 *   n.passo(segundos); n.desenhar();     // um quadro (a tela chama, a 60 ou 24 por segundo)
 *   n.iniciar(); n.disparar(); n.pausar(true|false); n.setCor('#RRGGBB'); n.setLeve(true|false);
 *
 * Opções da esfera: rede: N (até 9) neurônios menores dentro da esfera, com o MESMO desenho, cada um com os terminais do axônio
 * na ponta de um dendrito primário do principal; saida: true faz só o tronco do axônio do principal atravessar a parede da esfera
 * (rumo às outras esferas): a esfera fica à esquerda do canvas e o resto da largura é a passagem do tronco, que some aos poucos.
 */
function (usa) {
  'use strict';

  var createSeededRandom = usa.sorteio.criar, hexToRgb = usa.cores.hexParaRgb;

  function criar(canvas, opcoes) {
    const opc = Object.assign({ cor: '#8B3DFF', semente: 94127, leve: false, rede: 0, saida: false, raioMax: Infinity, cores: null, anel: 0, lupa: false, axonios: 1, leque: 100, degrau: 0, abre: 200, miniEsc: 0.54, miniEixo: 0.25, giro: 0.9, sobra: 0.7, alcance: 0.8, semEixo: false, quieto: false, giro0: 0, dprMax: 3, margem: 3, dendritosExtra: null, arcos: null, corredor: 42, ligacoes: null, escLig: 1, aoChegar: null }, opcoes || {});
    opc.semente = opc.semente >>> 0;
    opc.rede = Math.max(0, Math.min(9, Math.floor(Number(opc.rede) || 0)));
    opc.saida = !!opc.saida;
    opc.axonios = Math.max(1, Math.min(8, Math.round(opc.axonios) || 1));
    opc.semEixo = !!opc.semEixo; opc.quieto = !!opc.quieto; opc.giro0 = Number(opc.giro0) || 0;
    opc.modo = Array.isArray(opc.ligacoes) ? 'ligacoes' : '';       // 'ligacoes': a camada só dos axônios que ligam as esferas (sem corpo, sem vidro)
    const ctx = canvas.getContext('2d');
    const DW = 1360, DH = 760;          // o neurônio é montado neste espaço e depois escalado para caber na esfera
    const vista = { k: 1, tx: 0, ty: 0, cx: 0, cy: 0, Rpx: 1, Rd: 1, toques: 0, terminais: 0 };
    // A lupa: a vista pode ser ampliada (z) e deslocada (ox, oy, em px do canvas). Quando ela para, a parte fixa é refeita naquela
    // ampliação (resolução e detalhes novos), em fatias por quadro, sem travar a animação.
    const lupa = { z: 1, ox: 0, oy: 0, mudou: false, ultimo: 0, anim: null, ouvinte: null };
    const VISTA_1 = { z: 1, ox: 0, oy: 0 };

        const config = {
          agente: 'Sexta-Feira',
          corHex: '#8B3DFF',
          rgb: [139, 61, 255],
          brilhoNucleo: 21,
          transparenciaCorpo: 45,
          opacidadeDendritos: 84,
          brilhoGeral: 72,
          ramificacaoDendritos: 82,
          velocidadePulsos: 40,
          frequenciaDisparos: 72,
          enableVesicles: true,
          enableMist: true,
          enableSubBranches: true
        };

        const runtime = {
          width: 1280,
          height: 720,
          dpr: 1,
          paused: false,
          showLabels: true,
          sidebarOpen: true,
          time: 0,
          lastFrameTime: 0,
          spawnAccumulator: 0,
          somaExcitation: 0,
          somaRgb: null
        };


        const incomingSignals = [];
        const actionPotentials = [];
        const mistClouds = [];
        const releasedNeurotransmitters = [];
        const MINI_ESC = opc.miniEsc;      // tamanho do menor em relação ao principal
        const MINI_EIXO = opc.miniEixo;        const miniAPs = [];                 // sinais correndo pelo axônio de cada neurônio menor
        const EIXO_BASE = DW * 0.62 - (DW * 0.25 + 48 * 1.44);   // comprimento do axônio no desenho original

        // O ESTADO do neurônio, num objeto só (v0.4.2): as partes recebem Est e leem/escrevem aqui. Cada campo está na tabela do LEIA-ME.md.
        const Est = {
          canvas: canvas,
          opc: opc,
          ctx: ctx,
          DW: DW,
          DH: DH,
          vista: vista,
          lupa: lupa,
          VISTA_1: VISTA_1,
          config: config,
          runtime: runtime,
          incomingSignals: incomingSignals,
          actionPotentials: actionPotentials,
          mistClouds: mistClouds,
          releasedNeurotransmitters: releasedNeurotransmitters,
          MINI_ESC: MINI_ESC,
          MINI_EIXO: MINI_EIXO,
          miniAPs: miniAPs,
          EIXO_BASE: EIXO_BASE,
          detalhe: null,
          refino: null,
          detZ: 1,
          detLocal: 1,
          pulsoZ: 1,
          tmpCamada: null,
          anatomy: {
            somaX: 0,
            somaY: 0,
            somaRadius: 48,
            scale: 1,
            somaOutline: [],
            membraneSpicules: [],
            cytoplasmRidges: [],
            membraneGranules: [],
            nucleusChromatin: [],
            dendriteBranches: [],
            dendriteTips: [],
            synapticSpines: [],
            axonPath: [],
            myelinSheaths: [],
            ranvierNodes: [],
            terminalBranches: [],
            terminalBoutons: [],
            offscreenCanvas: null
          },
          minis: [],  // os neurônios menores dentro da esfera (o mesmo desenho, em escala)
          auxCv: null,
          vidro: null,
          par: { x: 0, y: 0, tx: 0, ty: 0 },
          PAREDE: 0.955  // raio da parede interna do vidro (a mesma do traço da casca em construirVidro)
        };
        // neuronio/recorte (v0.4.2): a máscara da esfera e o corredor por onde o tronco do axônio sai dela (só geometria de recorte, sem desenho próprio).
        const P_recorte = usa.recorte.criar(Est, {});
        const recortaNaEsfera = P_recorte.recortaNaEsfera, recorte2D = P_recorte.recorte2D, montarMascara = P_recorte.montarMascara, fadeFora = P_recorte.fadeFora;
        // neuronio/anatomia (v0.4.2): a geometria do neurônio: onde fica cada ramo, o axônio, as bainhas, os terminais, as árvores das ligações e a vista (escala e centro) da esfera. Não desenha.
        const P_anatomia = usa.anatomia.criar(Est, {});
        const axonStartFim = P_anatomia.axonStartFim, montarAnatomia = P_anatomia.montarAnatomia, anatomiaLigacoes = P_anatomia.anatomiaLigacoes, raizDaArvore = P_anatomia.raizDaArvore, caixaDe = P_anatomia.caixaDe, estenderTronco = P_anatomia.estenderTronco, montarFeixe = P_anatomia.montarFeixe, pontasTerminais = P_anatomia.pontasTerminais, calcularVista = P_anatomia.calcularVista;
        // neuronio/sinais (v0.4.2): o comportamento dos sinais: quando nasce cada pulso de dendrito e potencial de ação, como a liberação de neurotransmissores e o disparo dos menores andam a cada passo. Só calcula, não desenha.
        const P_sinais = usa.sinais.criar(Est, {});
        const spawnDendriteSignal = P_sinais.spawnDendriteSignal, triggerActionPotential = P_sinais.triggerActionPotential, dispararMini = P_sinais.dispararMini, stepSimulation = P_sinais.stepSimulation;
        // neuronio/pulso (v0.4.2): o pulso redondo e suave (drawUnifiedSmoothPulse): o brilho de um sinal num ponto, com o tamanho corrigido pela lupa. Usado pelos pulsos dos dendritos, do axônio e dos terminais.
        const P_pulso = usa.pulso.criar(Est, {});
        const drawUnifiedSmoothPulse = P_pulso.drawUnifiedSmoothPulse;
        // neuronio/minis (v0.4.2): os neurônios menores dentro da esfera: monta cada um (anatomia em escala, posição, profundidade, caixa) a partir da anatomia do principal. A anatomia chega pela juntadora.
        const P_minis = usa.minis.criar(Est, { axonStartFim: P_anatomia.axonStartFim, montarAnatomia: P_anatomia.montarAnatomia, caixaDe: P_anatomia.caixaDe, pontasTerminais: P_anatomia.pontasTerminais, drawUnifiedSmoothPulse: P_pulso.drawUnifiedSmoothPulse });
        const montarMinis = P_minis.montarMinis, pintarMinisVivo = P_minis.pintarMinisVivo;
        // neuronio/escala (v0.4.2): o tamanho e o detalhe: o degrau de detalhe da lupa (nivel), 1 px em unidades do desenho (un), o zoom máximo, o contraste da lupa (zcDe), o giro da célula, o bitmap novo e os dois ramos que dependem do degrau (polígono afilado e ramo encorpado).
        const P_escala = usa.escala.criar(Est, {});
        const agora = P_escala.agora, zcDe = P_escala.zcDe, nivel = P_escala.nivel, un = P_escala.un, zMax = P_escala.zMax, giroCelula = P_escala.giroCelula, novoBitmap = P_escala.novoBitmap, drawSharpDendritePolygon = P_escala.drawSharpDendritePolygon, drawTaperedBranch = P_escala.drawTaperedBranch;
        // neuronio/tinta (v0.4.2): as cores e os brilhos derivados de uma célula (o topo do desenho aprovado): cor clara, cor funda, transparências e brilhos, o degrau de detalhe e o contraste da lupa. Quem pinta recebe o objeto T e lê daqui.
        const P_tinta = usa.tinta.criar(Est, { zcDe: P_escala.zcDe, nivel: P_escala.nivel, un: P_escala.un });
        const tintaFixa = P_tinta.tintaFixa, tintaViva = P_tinta.tintaViva;
        // neuronio/dendritos (v0.4.2): o desenho parado dos dendritos afilados e das espinhas sinápticas (seção 2 do desenho aprovado). Recebe a tinta T.
        const P_dendritos = usa.dendritos.criar(Est, { drawSharpDendritePolygon: P_escala.drawSharpDendritePolygon, drawUnifiedSmoothPulse: P_pulso.drawUnifiedSmoothPulse });
        const pintarDendritos = P_dendritos.pintarDendritos, pintarPulsosEntrada = P_dendritos.pintarPulsosEntrada;
        // neuronio/corpo (v0.4.2): o desenho parado do corpo da célula: halo atmosférico, soma com parede 3D e núcleo texturizado (seções 1, 3 e 4 do desenho aprovado). Recebe a tinta T.
        const P_corpo = usa.corpo.criar(Est, {  });
        const pintarHalo = P_corpo.pintarHalo, pintarSoma = P_corpo.pintarSoma, pintarNucleo = P_corpo.pintarNucleo, pintarExcitacaoSoma = P_corpo.pintarExcitacaoSoma;
        // neuronio/axonio (v0.4.2): o desenho parado do axônio: tronco encorpado, bainhas de mielina estriadas e nódulos de Ranvier (seção 5 do desenho aprovado), um por axônio. Recebe a tinta T.
        const P_axonio = usa.axonio.criar(Est, { drawTaperedBranch: P_escala.drawTaperedBranch, fadeFora: P_recorte.fadeFora, drawUnifiedSmoothPulse: P_pulso.drawUnifiedSmoothPulse });
        const pintarAxonio = P_axonio.pintarAxonio, pintarNodulos = P_axonio.pintarNodulos, pintarPotenciais = P_axonio.pintarPotenciais;
        // neuronio/terminais (v0.4.2): o desenho parado dos terminais: ramos dos telodendros uniformes (seção 6 do desenho aprovado, um por axônio) e os botões fixos dos neurônios menores. Recebe a tinta T.
        const P_terminais = usa.terminais.criar(Est, { nivel: P_escala.nivel, drawTaperedBranch: P_escala.drawTaperedBranch });
        const pintarTerminais = P_terminais.pintarTerminais, pintarBotoesFixos = P_terminais.pintarBotoesFixos, pintarNevoa = P_terminais.pintarNevoa, pintarBulbos = P_terminais.pintarBulbos, pintarNeurotransmissores = P_terminais.pintarNeurotransmissores;
        // neuronio/camada (v0.4.2): a camada fixa (pré-desenhada): a ordem das camadas (principal e menores), pintar uma camada com luz, névoa e sombra, o assado em fatias com orçamento de tempo, o lustre do soma, iluminar, reduzir e compor.
        const P_camada = usa.camada.criar(Est, { recortaNaEsfera: P_recorte.recortaNaEsfera, montarMascara: P_recorte.montarMascara, agora: P_escala.agora, zcDe: P_escala.zcDe, giroCelula: P_escala.giroCelula, novoBitmap: P_escala.novoBitmap, pintarBotoesFixos: P_terminais.pintarBotoesFixos, pintarCelula: pintarCelula });
        const iniciarAssado = P_camada.iniciarAssado, avancarAssado = P_camada.avancarAssado, bakeStaticLayer = P_camada.bakeStaticLayer;
        // neuronio/vidro (v0.4.2): o vidro da esfera, com profundidade: as duas camadas pré-renderizadas (fundo e frente), a paralaxe do ponteiro, e como o vidro e a parte fixa entram na vista atual (com a lupa).
        const P_vidro = usa.vidro.criar(Est, { zcDe: P_escala.zcDe, novoBitmap: P_escala.novoBitmap });
        const construirVidro = P_vidro.construirVidro, vidroDaVista = P_vidro.vidroDaVista, vidroNaVista = P_vidro.vidroNaVista, estaticoNaVista = P_vidro.estaticoNaVista, moverParalaxe = P_vidro.moverParalaxe;
        // neuronio/lupa (v0.4.2): a interação da lupa: zoom, arrasto, animação, prender nos limites, o refino da parte fixa em fatias e os ouvintes do ponteiro (roda, arrasto, pinça, duplo toque).
        const P_lupa = usa.lupa.criar(Est, { agora: P_escala.agora, zMax: P_escala.zMax, iniciarAssado: P_camada.iniciarAssado, avancarAssado: P_camada.avancarAssado, vidroDaVista: P_vidro.vidroDaVista });
        const prenderLupa = P_lupa.prenderLupa, marcarLupa = P_lupa.marcarLupa, animarLupa = P_lupa.animarLupa, passoAnimLupa = P_lupa.passoAnimLupa, cuidarRefino = P_lupa.cuidarRefino, ligarLupa = P_lupa.ligarLupa;
        // FIM DOS BLOCOS DAS PARTES
        const par = Est.par, PAREDE = Est.PAREDE;


        const dendritos = usa.ramos;
        const trilhaSuave = dendritos.trilhaSuave, bordasRamo = dendritos.bordasRamo, desviar = dendritos.desviar, mitocondrias = dendritos.mitocondrias;




        // Constrói o que a esfera mostra: o neurônio principal (soma no centro) e, com a opção rede, os menores em volta
        function buildCompleteNeuron() {
          Est.anatomy = opc.modo === 'ligacoes' ? anatomiaLigacoes() : montarAnatomia(opc.semente, undefined, true);
          if (opc.semEixo) { Est.anatomy.axonPath = []; Est.anatomy.myelinSheaths = []; Est.anatomy.ranvierNodes = []; Est.anatomy.terminalBranches = []; Est.anatomy.terminalBoutons = []; }
          actionPotentials.length = 0; incomingSignals.length = 0; mistClouds.length = 0; releasedNeurotransmitters.length = 0;
          miniAPs.length = 0;
          Est.minis = opc.rede > 0 ? montarMinis() : [];
          calcularVista();
          if (opc.saida) { if (opc.axonios > 1) montarFeixe(); else estenderTronco(); }
          Est.anatomy.nosTodos = [Est.anatomy].concat(Est.anatomy.extras || []).reduce(function (a, E) { return a.concat(E.ranvierNodes); }, []);
          Est.anatomy.boutonsTodos = [Est.anatomy].concat(Est.anatomy.extras || []).reduce(function (a, E) { return a.concat(E.terminalBoutons); }, []);
          construirVidro();
          bakeStaticLayer();
        }

















        // ---------------------------------------------------------------------------------- o vidro da esfera, com profundidade
        // Duas camadas pré-renderizadas: o fundo do vidro (a parede de trás, com névoa e poeira distante) e a frente (a casca, com reflexos e
        // borda de Fresnel). Elas se deslocam em sentidos opostos com o ponteiro, e o neurônio fica parado entre as duas.












        // Desenha uma célula (halo, dendritos, soma, núcleo, axônio, telodendros) no espaço do neurônio: o desenho aprovado
        // falha contida por órgão (v0.4.3): cada órgão do desenho roda em usa.base.seguro; se der erro, só ele para (nesta esfera) e o contexto volta à transformação, ao modo de composição
        // e à opacidade de antes dele (um clip ou um save aberto pelo órgão não dá para desfazer: fica até o restore do quadro). Sem erro, nada muda no desenho.
        const idE = String(opc.id || 'esfera');
        function orgao(c, nome, fn) {
          const t = c.getTransform(), op = c.globalCompositeOperation, al = c.globalAlpha;
          let ok = false;
          usa.base.seguro(idE + ':' + nome, function () { fn(); ok = true; });
          if (!ok) { c.setTransform(t); c.globalCompositeOperation = op; c.globalAlpha = al; }
        }
        function pintarCelula(octx, A, rgb) {
          const T = tintaFixa(rgb);
          orgao(octx, 'halo', function () { pintarHalo(octx, A, T); });                // 1
          orgao(octx, 'dendritos', function () { pintarDendritos(octx, A, T); });           // 2
          orgao(octx, 'soma', function () { pintarSoma(octx, A, T); });                // 3
          orgao(octx, 'nucleo', function () { pintarNucleo(octx, A, T); });              // 4
          // (com mais de um axônio, o laço desenha cada um com as mesmas peças: axônio, bainhas, nódulos e terminais)
          [A].concat(A.extras || []).forEach(function (E) {
          if (E.rgb) {                                                        // ligações: cada axônio na sua cor
            T.r = E.rgb[0]; T.g = E.rgb[1]; T.b = E.rgb[2];
            T.lightR = Math.min(255, T.r + 90); T.lightG = Math.min(255, T.g + 90); T.lightB = Math.min(255, T.b + 90);
            T.deepR = Math.round(T.r * 0.26); T.deepG = Math.round(T.g * 0.26); T.deepB = Math.round(T.b * 0.26);
          }
          orgao(octx, 'axonio', function () { pintarAxonio(octx, A, E, T); });           // 5
          orgao(octx, 'terminais', function () { pintarTerminais(octx, A, E, T); });        // 6
          });
        }


















        // Renderização completa do neurônio montado
        function drawFrame() {
          if (!ctx || !canvas) return;
          passoAnimLupa();
          cuidarRefino();

          ctx.save();
          ctx.scale(runtime.dpr, runtime.dpr);

          ctx.clearRect(0, 0, runtime.width, runtime.height);
          moverParalaxe();
          vidroNaVista('fundo');

          // Camada anatômica estática pré-renderizada (já na vista da esfera; com a lupa, a que foi refeita para ela)
          estaticoNaVista();
          // o que é vivo (pulsos, vesículas, neurotransmissores) é desenhado no espaço do neurônio e entra na mesma vista e na mesma lupa
          ctx.transform(lupa.z, 0, 0, lupa.z, lupa.ox, lupa.oy);
          Est.pulsoZ = Math.pow(lupa.z, -0.45);
          const zcL = zcDe(lupa.z);
          if (recortaNaEsfera()) ctx.clip(recorte2D());
          ctx.translate(vista.tx, vista.ty);
          ctx.scale(vista.k, vista.k);
          giroCelula(ctx, Est.anatomy);

          const T = tintaViva(zcL);
          orgao(ctx, 'nevoa', function () { pintarNevoa(T); });                        // 1

          ctx.globalCompositeOperation = 'lighter';

          orgao(ctx, 'minis', function () { pintarMinisVivo(T); });                    // 1b
          T.usaCor();
          orgao(ctx, 'excitacao', function () { pintarExcitacaoSoma(T); });                // 2
          orgao(ctx, 'pulsos', function () { pintarPulsosEntrada(T); });                // 3
          orgao(ctx, 'nodulos', function () { pintarNodulos(T); });                      // 4
          orgao(ctx, 'potenciais', function () { pintarPotenciais(T); });                   // 5

          ctx.globalCompositeOperation = 'source-over';

          orgao(ctx, 'bulbos', function () { pintarBulbos(T); });                       // 6

          ctx.globalCompositeOperation = 'lighter';

          orgao(ctx, 'neurotransmissores', function () { pintarNeurotransmissores(T); });           // 7

          ctx.globalCompositeOperation = 'source-over';

          ctx.restore();
          vidroNaVista('frente');
        }


    function aplicarCor(hex) {
      config.corHex = String(hex).toUpperCase();
      config.rgb = hexToRgb(config.corHex);
    }

    function aplicarLeve(ligado) {
      opc.leve = !!ligado;
      config.enableMist = !opc.leve;
      config.enableVesicles = !opc.leve;
      config.enableSubBranches = !opc.leve;
    }

    function redimensionar(largura, altura) {
      runtime.width = Math.max(40, Math.round(largura));
      runtime.height = Math.max(40, Math.round(altura));
      runtime.dpr = opc.leve ? 1 : Math.min(window.devicePixelRatio || 1, opc.dprMax || 3);
      canvas.width = Math.round(runtime.width * runtime.dpr);
      canvas.height = Math.round(runtime.height * runtime.dpr);
      buildCompleteNeuron();
      drawFrame();
    }

    if (typeof document !== 'undefined') {
      document.addEventListener('pointermove', function (e) {
        if (opc.leve) return;
        const L = Math.max(1, window.innerWidth / 2), H2 = Math.max(1, window.innerHeight / 2);
        par.tx = Math.max(-1, Math.min(1, (e.clientX - L) / L)) * 0.8;
        par.ty = Math.max(-1, Math.min(1, (e.clientY - H2) / H2)) * 0.8;
      }, { passive: true });
    }
    aplicarCor(opc.cor);
    aplicarLeve(opc.leve);
    ligarLupa();
    runtime.showLabels = false;

    return {
      redimensionar: redimensionar,
      passo: function (dt) { if (!runtime.paused) stepSimulation(Math.min(0.05, Math.max(0.001, dt))); },
      desenhar: drawFrame,
      esfera: function () {
        let contato = 0, dentro = 0, fora = 0;
        Est.minis.forEach(function (m) {
          contato = Math.max(contato, Math.hypot(m.contato.x - m.alvo.tipX, m.contato.y - m.alvo.tipY) * vista.k);
          m.pontos.forEach(function (p) { if (Math.hypot(p.x - Est.anatomy.somaX, p.y - Est.anatomy.somaY) <= vista.Rd) dentro++; else fora++; });
        });
        let folga = Infinity;
        for (let i = 0; i < Est.minis.length; i++) for (let j = i + 1; j < Est.minis.length; j++) {
          const A1 = Est.minis[i], B1 = Est.minis[j];
          folga = Math.min(folga, Math.hypot(A1.soma.x - B1.soma.x, A1.soma.y - B1.soma.y) / (A1.rho + B1.rho));
        }
        return { raio: vista.Rpx, terminais: vista.terminais, toques: vista.toques, minis: Est.minis.length, contato: contato, folga: folga,
          profundidades: Est.minis.map(function (m) { return +m.z.toFixed(2); }), pontosDentro: dentro, pontosFora: fora, escondidos: +(fora / Math.max(1, fora + dentro)).toFixed(3), saida: opc.saida, centro: [vista.cx, vista.cy], RdTodos: vista.RdTodos, Rd: vista.Rd, k: vista.k,
          raiosPrimarios: Est.minis.map(function (m) { return Math.round(Math.hypot(m.alvo.tipX - Est.anatomy.somaX, m.alvo.tipY - Est.anatomy.somaY)); }),
          raiosSomas: Est.minis.map(function (m) { return Math.round(Math.hypot(m.soma.x - Est.anatomy.somaX, m.soma.y - Est.anatomy.somaY)); }),
          rhos: Est.minis.map(function (m) { return Math.round(m.rho); }),
          somas: Est.minis.map(function (m) { return [vista.tx + m.soma.x * vista.k, vista.ty + m.soma.y * vista.k]; }),
          axonios: opc.axonios, pontas: [Est.anatomy].concat(Est.anatomy.extras || []).filter(function (E) { return E.axonPath.length; }).map(function (E) { const p = E.axonPath[E.axonPath.length - 1]; return [Math.round(vista.tx + p.x * vista.k), Math.round(vista.ty + p.y * vista.k)]; }),
          pontaTronco: (function () { const p = Est.anatomy.axonPath[Est.anatomy.axonPath.length - 1]; return p ? [vista.tx + p.x * vista.k, vista.ty + p.y * vista.k] : null; })() };
      },
      // a lupa: ampliar e voltar (botões), ir direto a um ponto (testes), o estado e um aviso a cada mudança
      lupa: {
        ampliar: function (f) {
          const fx = lupa.z > 1.001 ? runtime.width / 2 : vista.cx, fy = lupa.z > 1.001 ? runtime.height / 2 : vista.cy;
          animarLupa(lupa.z * f, fx, fy);
        },
        zerar: function () { animarLupa(1, runtime.width / 2, runtime.height / 2); },
        ir: function (z, x, y) {
          lupa.anim = null;
          lupa.z = Math.max(1, Math.min(zMax(), z));
          lupa.ox = runtime.width / 2 - lupa.z * x; lupa.oy = runtime.height / 2 - lupa.z * y;
          prenderLupa(); marcarLupa();
        },
        estado: function () { return { z: lupa.z, ox: lupa.ox, oy: lupa.oy, zmax: zMax(), pronto: !Est.refino && !lupa.mudou && !lupa.anim, temDetalhe: !!Est.detalhe }; },
        aoMudar: function (fn) { lupa.ouvinte = typeof fn === 'function' ? fn : null; if (lupa.ouvinte) lupa.ouvinte(lupa.z); }
      },
      iniciar: function () {
        if (opc.modo === 'ligacoes') return;
        if (Est.minis.length) {
          if (!opc.quieto) for (let i = 0; i < 3; i++) miniAPs.push({ m: Est.minis[(i * 3) % Est.minis.length], t: -i * 0.45 });
        } else if (!opc.quieto) {
          for (let i = 0; i < 6; i++) spawnDendriteSignal();
        }
        triggerActionPotential();
        { const L = [Est.anatomy].concat(Est.anatomy.extras || []); for (let i = 1; i < L.length; i++) actionPotentials.push({ t: -0.28 * i, visitedNodes: new Set(), eixo: L[i], boutons: L[i].terminalBoutons, released: false }); }
      },
      disparar: triggerActionPotential,
      // a cena manda: um pulso por uma ligação (pelo id), o corpo piscando na cor de quem fala, o sinal chegando a um dendrito
      dispararEixo: function (id, hex) {
        const E = (Est.anatomy.extras || []).filter(function (x) { return x.id === id; })[0];
        if (!E) return false;
        actionPotentials.push({ t: 0, visitedNodes: new Set(), eixo: E, boutons: E.terminalBoutons, released: false, rgb: /^#[0-9a-fA-F]{6}$/.test(hex) ? hexToRgb(hex) : null });
        return true;
      },
      excitar: function (hex) {
        runtime.somaExcitation = 1.0;
        runtime.somaRgb = /^#[0-9a-fA-F]{6}$/.test(hex) ? hexToRgb(hex) : null;
      },
      // o sinal entra pelo dendrito mais perto de (x, y) (px do canvas), corre até o corpo e o corpo pisca na cor de quem falou
      receber: function (x, y, hex) {
        let melhor = null, d2 = Infinity;
        const rot = function (p) {
          if (!opc.giro0) return p;
          const c = Math.cos(opc.giro0), s = Math.sin(opc.giro0), dx = p.x - Est.anatomy.somaX, dy = p.y - Est.anatomy.somaY;
          return { x: Est.anatomy.somaX + dx * c - dy * s, y: Est.anatomy.somaY + dx * s + dy * c };
        };
        Est.anatomy.dendriteTips.forEach(function (e) {
          e.pts.forEach(function (p, j) {
            const q = rot(p), dx = vista.tx + q.x * vista.k - x, dy = vista.ty + q.y * vista.k - y, d = dx * dx + dy * dy;
            if (d < d2) { d2 = d; melhor = { e: e, j: j }; }
          });
        });
        if (!melhor) { runtime.somaExcitation = 1.0; runtime.somaRgb = /^#[0-9a-fA-F]{6}$/.test(hex) ? hexToRgb(hex) : null; return; }
        incomingSignals.push({ pts: melhor.e.pts, progress: melhor.j / Math.max(1, melhor.e.pts.length - 1), speed: 0.56 + usa.base.acaso() * 0.34, entrada: melhor.e,
          rgb: /^#[0-9a-fA-F]{6}$/.test(hex) ? hexToRgb(hex) : null });
      },
      // a geometria da célula no canvas (px): o corpo, o raio da esfera e os pontos de cada ramo de dendrito (para as ligações tocarem um)
      geometria: function () {
        const rot = function (p) {
          if (!opc.giro0) return p;
          const c = Math.cos(opc.giro0), s = Math.sin(opc.giro0), dx = p.x - Est.anatomy.somaX, dy = p.y - Est.anatomy.somaY;
          return { x: Est.anatomy.somaX + dx * c - dy * s, y: Est.anatomy.somaY + dx * s + dy * c };
        };
        const px = function (p) { const q = rot(p); return [vista.tx + q.x * vista.k, vista.ty + q.y * vista.k, (p.w || 0) * vista.k]; };
        const sm = px({ x: Est.anatomy.somaX, y: Est.anatomy.somaY });
        return { cx: vista.cx, cy: vista.cy, R: vista.Rpx, k: vista.k, soma: [sm[0], sm[1]], rSoma: Est.anatomy.somaRadius * vista.k,
          dendritos: Est.anatomy.dendriteBranches.map(function (br) {
            const L = br.pts.length, out = [];
            br.pts.forEach(function (p, j) { if (j % 2 === 0 || j === L - 1) out.push(px(p)); });
            return { nivel: br.level, pts: out };
          }),
          contornoSoma: Est.anatomy.somaOutline.filter(function (p, j) { return j % 4 === 0; }).map(function (p) { return px(p); }) };
      },
      // as cabeças dos pulsos que estão correndo pelos axônios das ligações, com um rastro curto (px do canvas), para a cena pintar a cor de quem pediu por cima
      cabecas: function () {
        const out = [];
        actionPotentials.forEach(function (ap) {
          const P = ap.eixo.axonPath;
          if (!ap.rgb || ap.t <= 0 || ap.t > 1 || !P || P.length < 2) return;
          const pts = [];
          for (let k = 0; k < 6; k++) {
            const si = ap.t * (P.length - 1) - k * 1.4;
            if (si < 0) break;
            const i0 = Math.floor(si), i1 = Math.min(P.length - 1, i0 + 1), fr = si - i0;
            pts.push({ x: P[i0].x + (P[i1].x - P[i0].x) * fr, y: P[i0].y + (P[i1].y - P[i0].y) * fr });
          }
          out.push({ id: ap.eixo.id, rgb: ap.rgb, pts: pts });
        });
        return out;
      },
      arvoreRaiz: raizDaArvore,
      // os neurônios menores (os módulos), no canvas (px): o corpo, a cor e o ponto de dendrito que chega mais perto da parede da esfera
      minisGeometria: function () {
        const rot = function (p) {
          if (!opc.giro0) return p;
          const c = Math.cos(opc.giro0), s = Math.sin(opc.giro0), dx = p.x - Est.anatomy.somaX, dy = p.y - Est.anatomy.somaY;
          return { x: Est.anatomy.somaX + dx * c - dy * s, y: Est.anatomy.somaY + dx * s + dy * c };
        };
        const px = function (p) { const q = rot(p); return [vista.tx + q.x * vista.k, vista.ty + q.y * vista.k]; };
        return Est.minis.map(function (m, i) {
          const a = m.M[0], b = m.M[1], c = m.M[2], d = m.M[3], e = m.M[4], f = m.M[5];
          let melhor = null, dm = -1;
          m.A.dendriteBranches.forEach(function (br) {
            if (br.extra) return;
            br.pts.forEach(function (p) {
              const w = { x: a * p.x + c * p.y + e, y: b * p.x + d * p.y + f }, r = Math.hypot(w.x - Est.anatomy.somaX, w.y - Est.anatomy.somaY);
              if (r > dm) { dm = r; melhor = w; }
            });
          });
          return { idx: i, rgb: m.rgb, soma: px(m.soma), parede: px(melhor || m.soma) };
        });
      },
      excitarMini: function (i, hex) {
        const m = Est.minis[i]; if (!m) return false;
        m.excita = 1; m.ativo = /^#[0-9a-fA-F]{6}$/.test(hex) ? hexToRgb(hex) : null; m.ativoT = m.ativo ? 2.4 : 0;
        return true;
      },
      dispararMini: function (i, hex, cb) {
        const m = Est.minis[i]; if (!m) return false;
        dispararMini(m, /^#[0-9a-fA-F]{6}$/.test(hex) ? hexToRgb(hex) : null, cb);
        return true;
      },
      anatomia: function () { return Est.anatomy; },                         // só geometria (sem dados); o teste do sorteio por pedaço compara os dendritos
      setGiro: function (g) { opc.giro0 = g; buildCompleteNeuron(); drawFrame(); },
      // o foco numa esfera: só as ligações dela, na vista dela (X = {k, tx, ty}); sem X volta tudo ao normal
      focoLigacoes: function (lista, X) {
        opc.ligacoes = Array.isArray(lista) ? lista : []; opc.vistaExt = X || null;
        lupa.z = 1; lupa.ox = 0; lupa.oy = 0; lupa.mudou = false; lupa.anim = null; Est.refino = null; Est.detalhe = null;
        redimensionar(runtime.width, runtime.height);
      },
      // a lupa da esfera em foco manda; as ligações a seguem (o refino refaz o desenho nítido quando para)
      lupaEspelho: function (z, ox, oy) {
        if (lupa.z === z && lupa.ox === ox && lupa.oy === oy) return;
        lupa.z = z; lupa.ox = ox; lupa.oy = oy; lupa.mudou = true; lupa.ultimo = agora(); Est.refino = null;
      },
      setLigacoes: function (lista, esc, semRefazer) { opc.ligacoes = Array.isArray(lista) ? lista : []; opc.vistaExt = null; if (esc) opc.escLig = esc; if (semRefazer) return; buildCompleteNeuron(); drawFrame(); },
      lupaLigar: function (ligada) {
        opc.lupa = !!ligada;
        canvas.style.pointerEvents = opc.lupa ? 'auto' : 'none';
        canvas.style.touchAction = opc.lupa ? 'none' : '';
        canvas.style.cursor = opc.lupa ? 'zoom-in' : '';
        if (!opc.lupa) { lupa.anim = null; lupa.z = 1; lupa.ox = 0; lupa.oy = 0; lupa.mudou = false; Est.refino = null; Est.detalhe = null; if (lupa.ouvinte) lupa.ouvinte(1); }
      },
      pausar: function (p) { runtime.paused = !!p; },
      setCor: function (hex) { aplicarCor(hex); buildCompleteNeuron(); drawFrame(); },
      setLeve: function (ligado) { aplicarLeve(ligado); redimensionar(runtime.width, runtime.height); }
    };
  }

  return { criar: criar };
}
