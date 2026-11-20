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
        // neuronio/minis (v0.4.2): os neurônios menores dentro da esfera: monta cada um (anatomia em escala, posição, profundidade, caixa) a partir da anatomia do principal. A anatomia chega pela juntadora.
        const P_minis = usa.minis.criar(Est, { axonStartFim: P_anatomia.axonStartFim, montarAnatomia: P_anatomia.montarAnatomia, caixaDe: P_anatomia.caixaDe, pontasTerminais: P_anatomia.pontasTerminais });
        const montarMinis = P_minis.montarMinis;
        // neuronio/escala (v0.4.2): o tamanho e o detalhe: o degrau de detalhe da lupa (nivel), 1 px em unidades do desenho (un), o zoom máximo, o contraste da lupa (zcDe), o giro da célula, o bitmap novo e os dois ramos que dependem do degrau (polígono afilado e ramo encorpado).
        const P_escala = usa.escala.criar(Est, {});
        const agora = P_escala.agora, zcDe = P_escala.zcDe, nivel = P_escala.nivel, un = P_escala.un, zMax = P_escala.zMax, giroCelula = P_escala.giroCelula, novoBitmap = P_escala.novoBitmap, drawSharpDendritePolygon = P_escala.drawSharpDendritePolygon, drawTaperedBranch = P_escala.drawTaperedBranch;
        // neuronio/tinta (v0.4.2): as cores e os brilhos derivados de uma célula (o topo do desenho aprovado): cor clara, cor funda, transparências e brilhos, o degrau de detalhe e o contraste da lupa. Quem pinta recebe o objeto T e lê daqui.
        const P_tinta = usa.tinta.criar(Est, { zcDe: P_escala.zcDe, nivel: P_escala.nivel, un: P_escala.un });
        const tintaFixa = P_tinta.tintaFixa;
        // neuronio/dendritos (v0.4.2): o desenho parado dos dendritos afilados e das espinhas sinápticas (seção 2 do desenho aprovado). Recebe a tinta T.
        const P_dendritos = usa.dendritos.criar(Est, { drawSharpDendritePolygon: P_escala.drawSharpDendritePolygon });
        const pintarDendritos = P_dendritos.pintarDendritos;
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









        // As camadas, do fundo para a frente (o principal fica no meio)
        function camadasOrdenadas() {
          const camadas = Est.minis.map(function (m) { return { z: m.z, m: m }; });
          camadas.push({ z: 0, m: null });
          camadas.sort(function (p, q) { return p.z - q.z; });
          return camadas;
        }
        // O retângulo (px do bitmap) que a camada ocupa nesta vista; null se ela está toda fora (não é pintada)
        function retCamada(c, v, W, H) {
          if (!c.m) return { x: 0, y: 0, w: W, h: H };
          const cx = c.m.caixa, pad = 16, d = runtime.dpr, a = d * v.z * vista.k, bx = d * (v.z * vista.tx + v.ox), by = d * (v.z * vista.ty + v.oy);
          const X0 = Math.max(0, Math.floor(bx + a * (cx.x0 - pad))), Y0 = Math.max(0, Math.floor(by + a * (cx.y0 - pad)));
          const X1 = Math.min(W, Math.ceil(bx + a * (cx.x1 + pad))), Y1 = Math.min(H, Math.ceil(by + a * (cx.y1 + pad)));
          return X1 > X0 && Y1 > Y0 ? { x: X0, y: Y0, w: X1 - X0, h: Y1 - Y0 } : null;
        }
        // Pinta uma camada (um neurônio) na vista v: só no retângulo dela, com a luz, a névoa, a sombra e o brilho da profundidade
        function pintarCamada(c, v, octx, tmp, tctx) {
          const R = retCamada(c, v, tmp.width, tmp.height);
          if (!R) return;
          const d = runtime.dpr;
          tctx.setTransform(1, 0, 0, 1, 0, 0);
          tctx.globalCompositeOperation = 'source-over';
          tctx.clearRect(R.x, R.y, R.w, R.h);
          tctx.save();
          tctx.beginPath(); tctx.rect(R.x, R.y, R.w, R.h); tctx.clip();
          tctx.setTransform(d * v.z, 0, 0, d * v.z, d * v.ox, d * v.oy);
          tctx.translate(vista.tx, vista.ty);
          tctx.scale(vista.k, vista.k);
          Est.detZ = v.z;
          if (c.m) {
            Est.detLocal = c.m.s;
            tctx.transform(c.m.M[0], c.m.M[1], c.m.M[2], c.m.M[3], c.m.M[4], c.m.M[5]);
            pintarCelula(tctx, c.m.A, c.m.rgb);
            pintarBotoesFixos(tctx, c.m.A, c.m.rgb);
            lustreSoma(tctx, c.m.A);
          } else {
            Est.detLocal = 1;
            tctx.save(); giroCelula(tctx, Est.anatomy);
            pintarCelula(tctx, Est.anatomy);
            tctx.restore();
            lustreSoma(tctx, Est.anatomy);
          }
          tctx.restore();
          iluminarCamada(tctx, R, c.z, v);
          comporCamada(octx, tmp, c.z, c.m ? c.m.dA : 1, R, v);
          Est.detZ = 1; Est.detLocal = 1;
        }
        function iniciarAssado(v) {
          const off = novoBitmap();
          if (!Est.tmpCamada || Est.tmpCamada.width !== off.width || Est.tmpCamada.height !== off.height) Est.tmpCamada = novoBitmap();
          return { v: { z: v.z, ox: v.ox, oy: v.oy }, off: off, octx: off.getContext('2d'), tmp: Est.tmpCamada, tctx: Est.tmpCamada.getContext('2d'),
            camadas: camadasOrdenadas(), i: 0, feito: false };
        }
        // Pinta camadas até gastar 'ms' milissegundos (ao menos uma); devolve true quando o bitmap ficou pronto
        function avancarAssado(job, ms) {
          const t0 = agora();
          while (job.i < job.camadas.length) {
            pintarCamada(job.camadas[job.i], job.v, job.octx, job.tmp, job.tctx);
            job.i++;
            if (agora() - t0 > ms) return false;
          }
          if (!job.feito) {
            if (recortaNaEsfera()) {
              job.octx.setTransform(1, 0, 0, 1, 0, 0);
              job.octx.globalCompositeOperation = 'destination-in';
              job.octx.drawImage(montarMascara(job.off.width, job.off.height, job.v), 0, 0);
              job.octx.globalCompositeOperation = 'source-over';
            }
            job.feito = true;
          }
          return true;
        }

        // Pré-renderiza a estrutura celular estática (a vista normal, sem lupa) de uma vez
        function bakeStaticLayer() {
          const job = iniciarAssado(VISTA_1);
          avancarAssado(job, Infinity);
          Est.anatomy.offscreenCanvas = job.off;
          Est.detalhe = null; Est.refino = null;
          lupa.z = 1; lupa.ox = 0; lupa.oy = 0; lupa.mudou = false; lupa.anim = null;
          if (lupa.ouvinte) lupa.ouvinte(1);
        }



        // Volume do corpo celular: sombra na borda, brilho especular (a mesma luz do vidro) e luz refletida embaixo
        function lustreSoma(octx, A) {
          const r0 = A.somaRadius, x = A.somaX, y = A.somaY, lado = r0 * 2.7, q = zcDe(Est.detZ);   // de perto, o brilho não lava o contraste
          octx.save();
          const gi = A === Est.anatomy ? opc.giro0 : 0;           // o contorno do corpo gira com a célula; a luz não
          if (gi) { octx.translate(x, y); octx.rotate(gi); octx.translate(-x, -y); }
          octx.beginPath();
          A.somaOutline.forEach(function (pt, i) { if (i === 0) octx.moveTo(pt.x, pt.y); else octx.lineTo(pt.x, pt.y); });
          octx.closePath();
          octx.clip();
          if (gi) { octx.translate(x, y); octx.rotate(-gi); octx.translate(-x, -y); }
          let g = octx.createRadialGradient(x, y, r0 * 0.40, x, y, r0 * 1.10);
          g.addColorStop(0, 'rgba(8, 0, 26, 0)');
          g.addColorStop(0.68, 'rgba(8, 0, 26, 0.12)');
          g.addColorStop(1, 'rgba(8, 0, 26, 0.55)');
          octx.fillStyle = g; octx.fillRect(x - lado / 2, y - lado / 2, lado, lado);
          g = octx.createRadialGradient(x + r0 * 0.46, y + r0 * 0.52, 0, x + r0 * 0.46, y + r0 * 0.52, r0 * 0.6);
          g.addColorStop(0, 'rgba(190, 150, 255, ' + (0.26 * (1 - 0.4 * q)).toFixed(3) + ')');
          g.addColorStop(1, 'rgba(190, 150, 255, 0)');
          octx.fillStyle = g; octx.fillRect(x - lado / 2, y - lado / 2, lado, lado);
          g = octx.createRadialGradient(x - r0 * 0.34, y - r0 * 0.38, 0, x - r0 * 0.34, y - r0 * 0.38, r0 * 0.62);
          g.addColorStop(0, 'rgba(255, 255, 255, ' + (0.66 * (1 - 0.55 * q)).toFixed(3) + ')');
          g.addColorStop(0.35, 'rgba(236, 226, 255, ' + (0.22 * (1 - 0.55 * q)).toFixed(3) + ')');
          g.addColorStop(1, 'rgba(255, 255, 255, 0)');
          octx.fillStyle = g; octx.fillRect(x - lado / 2, y - lado / 2, lado, lado);
          octx.restore();
        }

        // Luz única vinda do canto superior esquerdo sobre tudo o que a camada pintou, e névoa para o que está ao fundo (de perto, menos)
        function iluminarCamada(tctx, R, z, v) {
          const d = runtime.dpr, q = zcDe(v.z);
          const Rr = vista.Rpx * d * v.z, cx = d * (v.z * vista.cx + v.ox), cy = d * (v.z * vista.cy + v.oy);
          tctx.setTransform(1, 0, 0, 1, 0, 0);
          tctx.globalCompositeOperation = 'source-atop';
          const lg = tctx.createLinearGradient(cx - Rr * 0.75, cy - Rr * 0.85, cx + Rr * 0.75, cy + Rr * 0.85);
          lg.addColorStop(0, 'rgba(255, 255, 255, ' + (0.22 * (1 - 0.6 * q)).toFixed(3) + ')');
          lg.addColorStop(0.45, 'rgba(255, 255, 255, 0)');
          lg.addColorStop(1, 'rgba(0, 0, 16, ' + (0.08 * (1 - q)).toFixed(3) + ')');
          tctx.fillStyle = lg;
          tctx.fillRect(R.x, R.y, R.w, R.h);
          if (z < 0 && q < 1) {
            tctx.fillStyle = 'rgba(26, 22, 78, ' + (0.14 * -z * (1 - q)).toFixed(3) + ')';
            tctx.fillRect(R.x, R.y, R.w, R.h);
          }
          tctx.globalCompositeOperation = 'source-over';
        }

        // A camada (só o retângulo R) reduzida f vezes num canvas auxiliar: ampliada de volta, vira um desfoque barato
        // (o filtro blur() do canvas custa 70 a 100 ms por camada em alguns navegadores; este caminho custa poucos ms)
        function reduzido(tmp, R, f) {
          const w = Math.max(1, Math.round(R.w / f)), h = Math.max(1, Math.round(R.h / f));
          if (!Est.auxCv) Est.auxCv = document.createElement('canvas');
          if (Est.auxCv.width < w || Est.auxCv.height < h) { Est.auxCv.width = Math.max(Est.auxCv.width, w); Est.auxCv.height = Math.max(Est.auxCv.height, h); }
          const a = Est.auxCv.getContext('2d');
          a.setTransform(1, 0, 0, 1, 0, 0);
          a.globalCompositeOperation = 'source-over';
          a.clearRect(0, 0, w, h);
          a.imageSmoothingEnabled = true; a.imageSmoothingQuality = 'high';
          a.drawImage(tmp, R.x, R.y, R.w, R.h, 0, 0, w, h);
          return { cv: Est.auxCv, w: w, h: h };
        }

        function comporCamada(octx, tmp, z, dA, R, v) {
          const dpr = runtime.dpr, zn = (z + 1) / 2, q = zcDe(v.z), sz = Math.sqrt(v.z);
          const desfoque = Math.max(0, -z - 0.3) * 0.8 * (1 - q);   // só o que está bem ao fundo perde foco (de perto, nada perde)
          const pinta = function (src) {
            octx.imageSmoothingEnabled = true; octx.imageSmoothingQuality = 'high';
            if (src) octx.drawImage(src.cv, 0, 0, src.w, src.h, R.x, R.y, R.w, R.h);
            else octx.drawImage(tmp, R.x, R.y, R.w, R.h, R.x, R.y, R.w, R.h);
          };
          octx.save();
          octx.setTransform(1, 0, 0, 1, 0, 0);
          // sombra no fundo do vidro: quem está perto do fundo projeta curta e escura, quem está na frente projeta longa e difusa;
          // de perto a sombra some aos poucos (ela custa caro e tira contraste; a profundidade já vem do tamanho)
          if (q < 0.5) {
            const sb = Math.pow(v.z, 0.25);
            octx.shadowColor = 'rgba(6, 3, 22, ' + ((0.62 - 0.30 * zn) * (1 - 2 * q)).toFixed(3) + ')';
            octx.shadowBlur = (8 + 16 * zn) * dpr * sb;
            octx.shadowOffsetX = (5 + 14 * zn) * dpr * sb;
            octx.shadowOffsetY = (7 + 18 * zn) * dpr * sb;
          }
          octx.globalAlpha = Math.min(1, dA + (1 - dA) * q);          // de perto, quem está ao fundo também fica opaco
          pinta(desfoque * dpr > 0.5 ? reduzido(tmp, R, 2) : null);
          octx.restore();
          const brilho = function (alfa, f) {
            octx.save();
            octx.setTransform(1, 0, 0, 1, 0, 0);
            octx.globalCompositeOperation = 'lighter';
            octx.globalAlpha = alfa;
            pinta(f ? reduzido(tmp, R, f) : null);
            octx.restore();
          };
          if (z >= 0) brilho((z === 0 ? 0.22 : 0.10) * (1 - 0.4 * q));   // o Núcleo e quem está na frente ganham um halo leve de luz
          if (z < 0) brilho(0.30 * -z * (1 - 0.5 * q));                  // quem está ao fundo não pode sumir: um brilho próprio o realça
          if (z > 0.3) brilho(0.34 * z * (1 - 0.5 * q), Math.max(2, Math.min(16, Math.round(5 * dpr * sz / 1.6))));   // perto de quem olha: brilho suave
        }

        // ---------------------------------------------------------------------------------- o vidro da esfera, com profundidade
        // Duas camadas pré-renderizadas: o fundo do vidro (a parede de trás, com névoa e poeira distante) e a frente (a casca, com reflexos e
        // borda de Fresnel). Elas se deslocam em sentidos opostos com o ponteiro, e o neurônio fica parado entre as duas.

        function construirVidro() {
          if (opc.modo === 'ligacoes') { Est.vidro = null; return; }
          const R = vista.Rpx, dpr = runtime.dpr, m = Math.ceil(R * 0.05) + 14, S = Math.round((R + m) * 2 * dpr);
          const rnd = createSeededRandom(77123);
          const novo = function () { const c = document.createElement('canvas'); c.width = S; c.height = S; const x = c.getContext('2d'); x.scale(dpr, dpr); x.translate(R + m, R + m); return { cv: c, c: x }; };
          const poeira = function (c, n, rmin, rmax, amin, amax, alcance) {
            for (let i = 0; i < n; i++) {
              const ang = rnd() * Math.PI * 2, dist = Math.sqrt(rnd()) * alcance * R, rr = (rmin + rnd() * (rmax - rmin)) * R / 410, al = amin + rnd() * (amax - amin);
              const x = Math.cos(ang) * dist, y = Math.sin(ang) * dist, g = c.createRadialGradient(x, y, 0, x, y, rr);
              g.addColorStop(0, 'rgba(225, 230, 255, ' + al.toFixed(3) + ')');
              g.addColorStop(0.5, 'rgba(190, 200, 255, ' + (al * 0.45).toFixed(3) + ')');
              g.addColorStop(1, 'rgba(190, 200, 255, 0)');
              c.fillStyle = g; c.beginPath(); c.arc(x, y, rr, 0, Math.PI * 2); c.fill();
            }
          };
          // ---- o fundo: a parede de trás
          const F = novo(), f = F.c;
          f.save();
          f.beginPath(); f.arc(0, 0, R * 0.975, 0, Math.PI * 2); f.clip();
          let g = f.createRadialGradient(-R * 0.10, -R * 0.14, 0, -R * 0.10, -R * 0.14, R * 1.05);   // névoa: mais clara no meio, escurecendo para a borda
          g.addColorStop(0, 'rgba(150, 152, 238, 0.17)');
          g.addColorStop(0.45, 'rgba(96, 86, 192, 0.12)');
          g.addColorStop(0.80, 'rgba(46, 38, 112, 0.075)');
          g.addColorStop(1, 'rgba(18, 12, 44, 0.03)');
          f.fillStyle = g; f.fillRect(-R, -R, R * 2, R * 2);
          g = f.createRadialGradient(0, 0, R * 0.55, 0, 0, R * 0.98);                                  // vinheta: a borda afunda
          g.addColorStop(0, 'rgba(0, 0, 10, 0)');
          g.addColorStop(1, 'rgba(0, 0, 10, 0.55)');
          f.fillStyle = g; f.fillRect(-R, -R, R * 2, R * 2);
          f.save();                                                                                    // brilho refletido no fundo, embaixo
          f.translate(R * 0.04, R * 0.80); f.scale(1, 0.22);
          g = f.createRadialGradient(0, 0, 0, 0, 0, R * 0.52);
          g.addColorStop(0, 'rgba(176, 180, 255, 0.20)');
          g.addColorStop(1, 'rgba(176, 180, 255, 0)');
          f.fillStyle = g; f.beginPath(); f.arc(0, 0, R * 0.52, 0, Math.PI * 2); f.fill();
          f.restore();
          poeira(f, 34, 1.4, 4.6, 0.05, 0.13, 0.9);                                                    // poeira distante
          f.restore();
          f.lineWidth = Math.max(1, R * 0.010);                                                          // a borda da parede de trás, deslocada pela refração
          g = f.createLinearGradient(-R * 0.7, -R * 0.7, R * 0.7, R * 0.7);
          g.addColorStop(0, 'rgba(200, 205, 255, 0.04)');
          g.addColorStop(1, 'rgba(215, 220, 255, 0.24)');
          f.strokeStyle = g;
          f.beginPath(); f.arc(R * 0.018, R * 0.024, R * 0.945, 0, Math.PI * 2); f.stroke();
          // ---- a frente: a casca de vidro
          const T = novo(), t = T.c;
          g = t.createRadialGradient(0, 0, 0, 0, 0, R);                                                // borda de Fresnel: o vidro brilha onde é visto de lado
          g.addColorStop(0, 'rgba(170, 180, 255, 0)');
          g.addColorStop(0.78, 'rgba(170, 180, 255, 0)');
          g.addColorStop(0.90, 'rgba(176, 186, 255, 0.05)');
          g.addColorStop(0.965, 'rgba(215, 222, 255, 0.14)');
          g.addColorStop(0.995, 'rgba(240, 244, 255, 0.28)');
          g.addColorStop(1, 'rgba(240, 244, 255, 0)');
          t.fillStyle = g; t.beginPath(); t.arc(0, 0, R, 0, Math.PI * 2); t.fill();
          t.lineWidth = Math.max(1.2, R * 0.012);                                                      // as duas paredes
          t.strokeStyle = 'rgba(255, 255, 255, 0.20)';
          t.beginPath(); t.arc(0, 0, R - t.lineWidth / 2, 0, Math.PI * 2); t.stroke();
          t.lineWidth = Math.max(0.6, R * 0.005);
          t.strokeStyle = 'rgba(255, 255, 255, 0.08)';
          t.beginPath(); t.arc(0, 0, R * 0.955, 0, Math.PI * 2); t.stroke();
          t.lineCap = 'round';                                                                         // reflexo principal (a janela de luz)
          t.lineWidth = Math.max(3, R * 0.052); t.strokeStyle = 'rgba(255, 255, 255, 0.06)';
          t.beginPath(); t.arc(0, 0, R * 0.885, Math.PI * 1.10, Math.PI * 1.42); t.stroke();
          t.lineWidth = Math.max(1.6, R * 0.024); t.strokeStyle = 'rgba(255, 255, 255, 0.24)';
          t.beginPath(); t.arc(0, 0, R * 0.885, Math.PI * 1.13, Math.PI * 1.39); t.stroke();
          t.save();
          t.translate(-R * 0.40, -R * 0.55); t.rotate(-0.62); t.scale(1, 0.38);
          g = t.createRadialGradient(0, 0, 0, 0, 0, R * 0.20);
          g.addColorStop(0, 'rgba(255, 255, 255, 0.34)');
          g.addColorStop(0.6, 'rgba(255, 255, 255, 0.12)');
          g.addColorStop(1, 'rgba(255, 255, 255, 0)');
          t.fillStyle = g; t.beginPath(); t.arc(0, 0, R * 0.20, 0, Math.PI * 2); t.fill();
          t.restore();
          t.lineWidth = Math.max(1.4, R * 0.020);                                                      // reflexo de volta, embaixo à direita
          t.strokeStyle = 'rgba(210, 220, 255, 0.15)';
          t.beginPath(); t.arc(0, 0, R * 0.90, Math.PI * 0.08, Math.PI * 0.30); t.stroke();
          g = t.createRadialGradient(R * 0.54, R * 0.66, 0, R * 0.54, R * 0.66, R * 0.045);
          g.addColorStop(0, 'rgba(255, 255, 255, 0.32)');
          g.addColorStop(1, 'rgba(255, 255, 255, 0)');
          t.fillStyle = g; t.beginPath(); t.arc(R * 0.54, R * 0.66, R * 0.045, 0, Math.PI * 2); t.fill();
          t.save(); t.beginPath(); t.arc(0, 0, R * 0.99, 0, Math.PI * 2); t.clip();
          poeira(t, 9, 7, 17, 0.025, 0.065, 0.85);                                                     // poeira perto de quem olha, fora de foco
          t.restore();
          Est.vidro = { fundo: F.cv, frente: T.cv, m: m };
        }

        function mesmaVista(a, b) { return a.z === b.z && a.ox === b.ox && a.oy === b.oy; }
        // O vidro já na vista de uma lupa (feito uma vez quando a lupa para; depois cada quadro só copia, sem reamostrar)
        function vidroDaVista(v) {
          if (!Est.vidro) return null;
          const d = runtime.dpr, S = Est.vidro.fundo.width;
          const X = d * (v.z * (vista.cx - vista.Rpx - Est.vidro.m) + v.ox), Y = d * (v.z * (vista.cy - vista.Rpx - Est.vidro.m) + v.oy);
          const faz = function (fonte) {
            const c = novoBitmap(), x = c.getContext('2d');
            x.imageSmoothingQuality = 'high';
            x.drawImage(fonte, X, Y, S * v.z, S * v.z);
            return c;
          };
          return { fundo: faz(Est.vidro.fundo), frente: faz(Est.vidro.frente) };
        }
        // De perto, o vidro fica mais discreto (o reflexo e a névoa tiram contraste)
        function vidroNaVista(qual) {
          if (!Est.vidro) return;
          const d = runtime.dpr, q = zcDe(lupa.z), desloc = qual === 'fundo' ? -0.9 : 1.0, amp = Math.min(8, Math.max(2.4, vista.Rpx * 0.045));      // o vidro desliza menos nas esferas pequenas
          const px = desloc * amp * par.x, py = desloc * amp * par.y, B = vista.cx - vista.Rpx - Est.vidro.m, C = vista.cy - vista.Rpx - Est.vidro.m;
          ctx.save();
          ctx.setTransform(1, 0, 0, 1, 0, 0);
          ctx.globalAlpha = qual === 'fundo' ? 1 - 0.45 * q : 1 - 0.6 * q;
          if (lupa.z === 1) {
            ctx.drawImage(Est.vidro[qual], Math.round((B + px) * d), Math.round((C + py) * d));
          } else if (Est.detalhe && Est.detalhe.vidro && mesmaVista(Est.detalhe.v, lupa)) {
            ctx.drawImage(Est.detalhe.vidro[qual], Math.round(px * d), Math.round(py * d));
          } else {
            const S = Est.vidro[qual].width * lupa.z;
            ctx.drawImage(Est.vidro[qual], d * (lupa.z * B + lupa.ox + px), d * (lupa.z * C + lupa.oy + py), S, S);
          }
          ctx.restore();
        }
        // A parte fixa na vista atual: o bitmap refeito para a lupa onde ele cobre, e a vista normal ampliada no resto (até o refino chegar)
        function estaticoNaVista() {
          const base = Est.anatomy.offscreenCanvas;
          if (!base) return;
          const d = runtime.dpr;
          const desenha = function (fonte, v0) {
            const s = lupa.z / v0.z, tx = d * (lupa.ox - s * v0.ox), ty = d * (lupa.oy - s * v0.oy);
            ctx.save();
            if (Math.abs(s - 1) < 1e-9) ctx.setTransform(1, 0, 0, 1, Math.round(tx), Math.round(ty));
            else { ctx.setTransform(s, 0, 0, s, tx, ty); ctx.imageSmoothingQuality = 'medium'; }
            ctx.drawImage(fonte, 0, 0);
            ctx.restore();
          };
          if (lupa.z <= 1.0001 || !Est.detalhe) { desenha(base, VISTA_1); return; }
          const v0 = Est.detalhe.v, s = lupa.z / v0.z, rx = d * (lupa.ox - s * v0.ox), ry = d * (lupa.oy - s * v0.oy);
          const rw = Est.detalhe.cv.width * s, rh = Est.detalhe.cv.height * s, W = canvas.width, H = canvas.height;
          if (!(rx <= 0.5 && ry <= 0.5 && rx + rw >= W - 0.5 && ry + rh >= H - 0.5)) {
            ctx.save();
            ctx.setTransform(1, 0, 0, 1, 0, 0);
            ctx.beginPath(); ctx.rect(0, 0, W, H); ctx.rect(rx, ry, rw, rh); ctx.clip('evenodd');
            desenha(base, VISTA_1);
            ctx.restore();
          }
          desenha(Est.detalhe.cv, v0);
        }

        // ---------------------------------------------------------------------------------- a lupa: ampliar, mover, animar e refinar
        function prenderLupa() {
          const z = lupa.z, W = runtime.width, H = runtime.height;
          lupa.ox = Math.min(0, Math.max(W - W * z, lupa.ox));
          lupa.oy = Math.min(0, Math.max(H - H * z, lupa.oy));
        }
        function marcarLupa() {
          lupa.mudou = true; lupa.ultimo = agora(); Est.refino = null;
          if (lupa.ouvinte) lupa.ouvinte(lupa.z);
        }
        function ampliarEm(f, fx, fy) {             // amplia por f mantendo parado o ponto (fx, fy) do canvas
          const z0 = lupa.z, z1 = Math.max(1, Math.min(zMax(), z0 * f));
          if (z1 === z0) return;
          lupa.ox = fx - z1 * (fx - lupa.ox) / z0;
          lupa.oy = fy - z1 * (fy - lupa.oy) / z0;
          lupa.z = z1;
          prenderLupa(); marcarLupa();
        }
        function moverLupa(dx, dy) {
          if (lupa.z <= 1) return;
          const ox = lupa.ox, oy = lupa.oy;
          lupa.ox += dx; lupa.oy += dy; prenderLupa();
          if (lupa.ox !== ox || lupa.oy !== oy) marcarLupa();
        }
        function animarLupa(zAlvo, fx, fy) {
          lupa.anim = { z0: lupa.z, z1: Math.max(1, Math.min(zMax(), zAlvo)), fx: fx, fy: fy, t0: agora(), dur: 280 };
        }
        function passoAnimLupa() {
          const a = lupa.anim;
          if (!a) return;
          const u = Math.min(1, (agora() - a.t0) / a.dur), e = u < 0.5 ? 2 * u * u : 1 - Math.pow(-2 * u + 2, 2) / 2;
          ampliarEm(a.z0 * Math.pow(a.z1 / a.z0, e) / lupa.z, a.fx, a.fy);
          if (u >= 1) lupa.anim = null;
        }
        function alternarLupa(x, y) { if (lupa.z < 2.2) animarLupa(Math.min(zMax(), 3.2), x, y); else animarLupa(1, x, y); }
        // Quando a lupa para (170 ms sem mexer), a parte fixa é refeita para ela, uma fatia de ~10 ms por quadro
        function cuidarRefino() {
          if (lupa.mudou && !lupa.anim && agora() - lupa.ultimo > 170) {
            lupa.mudou = false;
            if (lupa.z > 1.001) Est.refino = iniciarAssado(lupa); else { Est.refino = null; Est.detalhe = null; }
          }
          if (Est.refino && avancarAssado(Est.refino, 10)) {
            Est.detalhe = { cv: Est.refino.off, v: Est.refino.v, vidro: vidroDaVista(Est.refino.v) };
            Est.refino = null;
          }
        }
        // Os gestos: pinça (dois dedos), roda do mouse, arrastar quando ampliado e dois toques (ou clique duplo) para ir e voltar
        function ligarLupa() {
          if (typeof window === 'undefined') return;
          if (opc.lupa) { canvas.style.pointerEvents = 'auto'; canvas.style.touchAction = 'none'; canvas.style.cursor = 'zoom-in'; }
          const toques = new Map();
          let tapT = 0, tapX = 0, tapY = 0, andou = 0, semDuplo = 0;
          const local = function (e) {
            const r = canvas.getBoundingClientRect();
            return { x: (e.clientX - r.left) * runtime.width / Math.max(1, r.width), y: (e.clientY - r.top) * runtime.height / Math.max(1, r.height) };
          };
          canvas.addEventListener('wheel', function (e) {
            if (!opc.lupa) return;
            e.preventDefault();
            const p = local(e), dy = e.deltaMode === 1 ? e.deltaY * 16 : e.deltaMode === 2 ? e.deltaY * 400 : e.deltaY;
            lupa.anim = null;
            ampliarEm(Math.exp(-Math.max(-120, Math.min(120, dy)) * 0.0022), p.x, p.y);
          }, { passive: false });
          canvas.addEventListener('pointerdown', function (e) {
            if (!opc.lupa || e.button > 0) return;
            try { canvas.setPointerCapture(e.pointerId); } catch (x) { /* sem captura: segue sem ela */ }
            toques.set(e.pointerId, local(e));
            if (toques.size === 1) andou = 0;
            lupa.anim = null;
            canvas.style.cursor = lupa.z > 1 ? 'grabbing' : 'zoom-in';
          });
          canvas.addEventListener('pointermove', function (e) {
            if (!opc.lupa || !toques.has(e.pointerId)) return;
            const ids = Array.from(toques.keys()), antes = ids.map(function (k) { return toques.get(k); });
            const p = local(e), a = toques.get(e.pointerId);
            andou += Math.hypot(p.x - a.x, p.y - a.y);
            toques.set(e.pointerId, p);
            if (ids.length >= 2) {
              const P0 = antes[0], Q0 = antes[1], P1 = toques.get(ids[0]), Q1 = toques.get(ids[1]);
              const d0 = Math.hypot(P0.x - Q0.x, P0.y - Q0.y), d1 = Math.hypot(P1.x - Q1.x, P1.y - Q1.y);
              const m0x = (P0.x + Q0.x) / 2, m0y = (P0.y + Q0.y) / 2;
              if (d0 > 4) ampliarEm(d1 / d0, m0x, m0y);
              moverLupa((P1.x + Q1.x) / 2 - m0x, (P1.y + Q1.y) / 2 - m0y);
            } else {
              moverLupa(p.x - a.x, p.y - a.y);
            }
          });
          const soltar = function (e) {
            if (!opc.lupa || !toques.has(e.pointerId)) return;
            const p = local(e);
            toques.delete(e.pointerId);
            canvas.style.cursor = lupa.z > 1 ? 'grab' : 'zoom-in';
            if (e.type !== 'pointerup' || toques.size || andou > 10 || e.pointerType === 'mouse') return;
            const t = agora();
            if (t - tapT < 320 && Math.hypot(p.x - tapX, p.y - tapY) < 40) { tapT = 0; semDuplo = t; alternarLupa(p.x, p.y); }
            else { tapT = t; tapX = p.x; tapY = p.y; }
          };
          canvas.addEventListener('pointerup', soltar);
          canvas.addEventListener('pointercancel', soltar);
          canvas.addEventListener('dblclick', function (e) {
            if (!opc.lupa || agora() - semDuplo < 600) return;
            const p = local(e);
            alternarLupa(p.x, p.y);
          });
        }

        function moverParalaxe() {
          if (opc.leve) { par.x = 0; par.y = 0; return; }
          const t = usa.base.agora() / 1000;
          const ax = par.tx + Math.sin(t * 0.31) * 0.40, ay = par.ty + Math.cos(t * 0.23) * 0.30;   // o vidro respira mesmo parado
          par.x += (ax - par.x) * 0.07;
          par.y += (ay - par.y) * 0.07;
        }


        // 1. Halo atmosférico suave ao redor do Soma
        function pintarHalo(octx, A, T) {
          var r = T.r, g = T.g, b = T.b, bodyAlpha = T.bodyAlpha, glowFactor = T.glowFactor, q = T.q;
          if (glowFactor > 0.02 && !A.semCorpo) {
            const halo = octx.createRadialGradient(
              A.somaX, A.somaY, A.somaRadius * 0.35,
              A.somaX, A.somaY, A.somaRadius * 3.35
            );
            halo.addColorStop(0, `rgba(${r}, ${g}, ${b}, ${0.28 * glowFactor * bodyAlpha * (1 - 0.65 * q)})`);
            halo.addColorStop(0.55, `rgba(${r}, ${g}, ${b}, ${0.09 * glowFactor * bodyAlpha * (1 - 0.65 * q)})`);
            halo.addColorStop(1, `rgba(${r}, ${g}, ${b}, 0)`);
            octx.fillStyle = halo;
            octx.beginPath();
            octx.arc(A.somaX, A.somaY, A.somaRadius * 3.35, 0, Math.PI * 2);
            octx.fill();
          }
        }


        // 3. SOMA COM PAREDE CELULAR 3D
        function pintarSoma(octx, A, T) {
          var r = T.r, g = T.g, b = T.b, lightR = T.lightR, lightG = T.lightG, lightB = T.lightB, deepR = T.deepR, deepG = T.deepG, deepB = T.deepB, bodyAlpha = T.bodyAlpha, nv = T.nv, u = T.u;
          octx.save();
          octx.beginPath();
          A.somaOutline.forEach((pt, idx) => {
            if (idx === 0) octx.moveTo(pt.x, pt.y);
            else octx.lineTo(pt.x, pt.y);
          });
          octx.closePath();

          const somaGrad = octx.createRadialGradient(
            A.somaX - A.somaRadius * 0.28,
            A.somaY - A.somaRadius * 0.28,
            A.somaRadius * 0.08,
            A.somaX,
            A.somaY,
            A.somaRadius * 1.5
          );
          somaGrad.addColorStop(0, `rgba(${lightR}, ${lightG}, ${lightB}, ${0.76 * bodyAlpha})`);
          somaGrad.addColorStop(0.50, `rgba(${r}, ${g}, ${b}, ${0.66 * bodyAlpha})`);
          somaGrad.addColorStop(0.85, `rgba(${deepR}, ${deepG}, ${deepB}, ${0.52 * bodyAlpha})`);
          somaGrad.addColorStop(1, `rgba(${lightR}, ${lightG}, ${lightB}, ${0.44 * bodyAlpha})`);

          octx.fillStyle = somaGrad;
          octx.fill();

          octx.save();
          octx.clip();

          A.cytoplasmRidges.forEach((ridge) => {
            octx.beginPath();
            octx.moveTo(ridge.x1, ridge.y1);
            octx.quadraticCurveTo(ridge.cx, ridge.cy, ridge.x2, ridge.y2);
            octx.lineWidth = ridge.width;
            octx.strokeStyle = ridge.isHighlight
              ? `rgba(${lightR}, ${lightG}, ${lightB}, ${0.38 * bodyAlpha})`
              : `rgba(${deepR}, ${deepG}, ${deepB}, ${0.56 * bodyAlpha})`;
            octx.stroke();
          });

          A.membraneGranules.forEach((gr) => {
            octx.fillStyle = `rgba(${deepR}, ${deepG}, ${deepB}, ${0.56 * bodyAlpha})`;
            octx.beginPath();
            octx.arc(gr.x + 0.85 * A.scale, gr.y + 0.95 * A.scale, gr.r, 0, Math.PI * 2);
            octx.fill();

            octx.fillStyle = `rgba(${lightR}, ${lightG}, ${lightB}, ${0.36 * bodyAlpha})`;
            octx.beginPath();
            octx.arc(gr.x - 0.65 * A.scale, gr.y - 0.65 * A.scale, gr.r * 0.72, 0, Math.PI * 2);
            octx.fill();
          });
          if (nv >= 2) {                                                      // de perto: corpúsculos de Nissl e o complexo de Golgi
            const rs = createSeededRandom(((A.semente || 1) + 7331) >>> 0), nucR0 = A.somaRadius * 0.34;
            for (let i = 0; i < 90; i++) {
              const ang = rs() * Math.PI * 2, dist = A.somaRadius * (0.46 + rs() * 0.42), rr = 0.45 + rs() * 0.75;
              octx.fillStyle = i % 3 === 0 ? `rgba(${lightR}, ${lightG}, ${lightB}, 0.55)` : `rgba(${deepR}, ${deepG}, ${deepB}, 0.70)`;
              octx.beginPath(); octx.arc(A.somaX + Math.cos(ang) * dist, A.somaY + Math.sin(ang) * dist, rr, 0, Math.PI * 2); octx.fill();
            }
            octx.strokeStyle = `rgba(${lightR}, ${lightG}, ${lightB}, 0.5)`;
            octx.lineWidth = 0.7 * u;
            for (let k = 0; k < 4; k++) {
              octx.beginPath(); octx.arc(A.somaX, A.somaY, nucR0 * (1.38 + k * 0.17), Math.PI * 0.72 + k * 0.05, Math.PI * 1.22 - k * 0.04); octx.stroke();
            }
          }
          octx.restore();

          if (nv >= 1) {                                                      // de perto: a membrana do corpo celular, nítida
            octx.beginPath(); trilhaSuave(octx, A.somaOutline.length ? A.somaOutline.concat([A.somaOutline[0]]) : [], true); octx.closePath();
            octx.strokeStyle = `rgba(${lightR}, ${lightG}, ${lightB}, 0.85)`;
            octx.lineWidth = 1.1 * u;
            octx.stroke();
          } else {
            octx.strokeStyle = `rgba(${lightR}, ${lightG}, ${lightB}, ${Math.min(0.95, bodyAlpha * 0.94)})`;
            octx.lineWidth = Math.max(1.1, 1.65 * A.scale);
            octx.stroke();
          }

          A.membraneSpicules.forEach((sp) => {
            octx.save();
            octx.translate(sp.x, sp.y);
            octx.rotate(sp.ang);
            octx.beginPath();
            octx.moveTo(-1, -sp.w * 0.5);
            octx.quadraticCurveTo(sp.h * 0.7, -sp.w * 0.3, sp.h, 0);
            octx.quadraticCurveTo(sp.h * 0.7, sp.w * 0.3, -1, sp.w * 0.5);
            octx.closePath();
            octx.fillStyle = `rgba(${lightR}, ${lightG}, ${lightB}, ${0.58 * bodyAlpha})`;
            octx.fill();
            octx.restore();
          });
          octx.restore();
        }

        // 4. NÚCLEO ESFÉRICO TEXTURIZADO (Calibrado em brilhoNucleo = 21%)
        function pintarNucleo(octx, A, T) {
          var r = T.r, g = T.g, b = T.b, lightR = T.lightR, lightG = T.lightG, lightB = T.lightB, deepR = T.deepR, deepG = T.deepG, deepB = T.deepB, bodyAlpha = T.bodyAlpha, nucFactor = T.nucFactor, nv = T.nv, u = T.u;
          octx.save();
          const nucR = A.somaRadius * 0.34;
          if (nucFactor > 0.01 && !A.semCorpo) {
            const nucHalo = octx.createRadialGradient(
              A.somaX, A.somaY, nucR * 0.25,
              A.somaX, A.somaY, nucR * 2.5
            );
            nucHalo.addColorStop(0, `rgba(255, 255, 255, ${0.80 * nucFactor})`);
            nucHalo.addColorStop(0.45, `rgba(${lightR}, ${lightG}, ${lightB}, ${0.52 * nucFactor})`);
            nucHalo.addColorStop(1, `rgba(${r}, ${g}, ${b}, 0)`);
            octx.fillStyle = nucHalo;
            octx.beginPath();
            octx.arc(A.somaX, A.somaY, nucR * 2.5, 0, Math.PI * 2);
            octx.fill();
          }

          const coreGrad = octx.createRadialGradient(
            A.somaX - nucR * 0.22,
            A.somaY - nucR * 0.22,
            1,
            A.somaX,
            A.somaY,
            nucR
          );
          coreGrad.addColorStop(0, `rgba(248, 244, 255, ${0.44 + 0.56 * nucFactor})`);
          coreGrad.addColorStop(0.72, `rgba(${lightR}, ${lightG}, ${lightB}, ${0.46 + 0.48 * nucFactor})`);
          coreGrad.addColorStop(1, `rgba(${r}, ${g}, ${b}, ${0.65 * bodyAlpha})`);

          octx.fillStyle = coreGrad;
          octx.beginPath();
          octx.arc(A.somaX, A.somaY, nucR, 0, Math.PI * 2);
          octx.fill();

          octx.save();
          octx.clip();
          A.nucleusChromatin.forEach((ch) => {
            octx.fillStyle = ch.bright
              ? `rgba(255, 255, 255, ${0.18 + 0.26 * nucFactor})`
              : `rgba(${deepR}, ${deepG}, ${deepB}, 0.28)`;
            octx.beginPath();
            octx.arc(ch.x, ch.y, ch.r, 0, Math.PI * 2);
            octx.fill();
          });
          if (nv >= 2) {                                                      // de perto: a cromatina fina e o nucléolo
            const rn = createSeededRandom(((A.semente || 1) + 911) >>> 0);
            for (let i = 0; i < 70; i++) {
              const ang = rn() * Math.PI * 2, dist = Math.sqrt(rn()) * nucR * 0.9, rr = 0.3 + rn() * 0.45;
              octx.fillStyle = i % 2 ? `rgba(${deepR}, ${deepG}, ${deepB}, 0.35)` : 'rgba(255, 255, 255, 0.28)';
              octx.beginPath(); octx.arc(A.somaX + Math.cos(ang) * dist, A.somaY + Math.sin(ang) * dist, rr, 0, Math.PI * 2); octx.fill();
            }
            const nx = A.somaX + nucR * 0.22, ny = A.somaY - nucR * 0.18, nr = nucR * 0.30;
            const ng = octx.createRadialGradient(nx - nr * 0.3, ny - nr * 0.3, 0, nx, ny, nr);
            ng.addColorStop(0, 'rgba(255, 255, 255, 0.9)');
            ng.addColorStop(0.5, `rgba(${lightR}, ${lightG}, ${lightB}, 0.75)`);
            ng.addColorStop(1, `rgba(${deepR}, ${deepG}, ${deepB}, 0.8)`);
            octx.fillStyle = ng;
            octx.beginPath(); octx.arc(nx, ny, nr, 0, Math.PI * 2); octx.fill();
            octx.strokeStyle = `rgba(${deepR}, ${deepG}, ${deepB}, 0.8)`;
            octx.lineWidth = 0.6 * u;
            octx.stroke();
            if (nv >= 3) {
              for (let i = 0; i < 12; i++) {
                const ang = rn() * Math.PI * 2, dist = Math.sqrt(rn()) * nr * 0.75, rr = 0.25 + rn() * 0.3;
                octx.fillStyle = 'rgba(255, 255, 255, 0.8)';
                octx.beginPath(); octx.arc(nx + Math.cos(ang) * dist, ny + Math.sin(ang) * dist, rr, 0, Math.PI * 2); octx.fill();
              }
            }
          }
          octx.restore();

          if (nv >= 1) { octx.beginPath(); octx.arc(A.somaX, A.somaY, nucR, 0, Math.PI * 2); }   // de perto: o contorno do núcleo
          octx.strokeStyle = `rgba(255, 255, 255, ${0.30 + 0.45 * nucFactor})`;
          octx.lineWidth = nv >= 1 ? 0.9 * u : Math.max(0.85, 1.15 * A.scale);
          octx.stroke();
          if (nv >= 2) {                                                      // o envelope nuclear duplo e os poros
            octx.strokeStyle = 'rgba(255, 255, 255, 0.35)';
            octx.lineWidth = 0.6 * u;
            octx.beginPath(); octx.arc(A.somaX, A.somaY, nucR * 0.93, 0, Math.PI * 2); octx.stroke();
            for (let i = 0; i < 22; i++) {
              const ang = (i / 22) * Math.PI * 2 + 0.13, x = A.somaX + Math.cos(ang) * nucR * 0.965, y = A.somaY + Math.sin(ang) * nucR * 0.965;
              octx.fillStyle = `rgba(${deepR}, ${deepG}, ${deepB}, 0.95)`;
              octx.beginPath(); octx.arc(x, y, 0.55, 0, Math.PI * 2); octx.fill();
              octx.strokeStyle = 'rgba(255, 255, 255, 0.7)';
              octx.lineWidth = 0.3 * u;
              octx.stroke();
            }
          }
          octx.restore();
        }

        // 5. AXÔNIO ENCORPADO & 6 SEGMENTOS ESTRIADOS DE BAINHA DE MIELINA (um por axônio)
        function pintarAxonio(octx, A, E, T) {
          var r = T.r, g = T.g, b = T.b, lightR = T.lightR, lightG = T.lightG, lightB = T.lightB, deepR = T.deepR, deepG = T.deepG, deepB = T.deepB, bodyAlpha = T.bodyAlpha, dendriteAlpha = T.dendriteAlpha, nv = T.nv, u = T.u;
          octx.save();
          octx.fillStyle = `rgba(${r}, ${g}, ${b}, ${dendriteAlpha * 0.92})`;
          drawTaperedBranch(octx, E.axonPath);

          octx.strokeStyle = `rgba(${lightR}, ${lightG}, ${lightB}, ${Math.max(0.55, bodyAlpha * 0.95)})`;
          octx.lineWidth = Math.max(1.2, 1.6 * A.scale);
          octx.beginPath();
          E.axonPath.forEach((p, idx) => {
            if (idx === 0) octx.moveTo(p.x, p.y);
            else octx.lineTo(p.x, p.y);
          });
          octx.stroke();
          if (nv >= 2) {                                                      // de perto: os microtúbulos do axônio (aparecem entre as bainhas)
            octx.strokeStyle = `rgba(${lightR}, ${lightG}, ${lightB}, 0.32)`;
            octx.lineWidth = 0.5 * u;
            [-0.22, 0.22].forEach(function (f) { octx.beginPath(); trilhaSuave(octx, desviar(E.axonPath, f), true); octx.stroke(); });
          }

          E.myelinSheaths.forEach((seg, mIdx) => {
            octx.save();
            octx.translate(seg.pMid.x, seg.pMid.y);
            octx.rotate(seg.angle);

            const w = seg.length;
            const h = seg.thickness;
            const rad = h * 0.45;

            // bainha como um cilindro: borda clara, corpo escuro e uma faixa de luz no alto
            const mGrad = octx.createLinearGradient(0, -h / 2, 0, h / 2);
            mGrad.addColorStop(0, `rgba(${lightR}, ${lightG}, ${lightB}, ${0.78 * bodyAlpha})`);
            mGrad.addColorStop(0.22, `rgba(${r}, ${g}, ${b}, ${0.52 * bodyAlpha})`);
            mGrad.addColorStop(0.55, `rgba(${deepR}, ${deepG}, ${deepB}, ${0.50 * bodyAlpha})`);
            mGrad.addColorStop(0.85, `rgba(${r}, ${g}, ${b}, ${0.50 * bodyAlpha})`);
            mGrad.addColorStop(1, `rgba(${lightR}, ${lightG}, ${lightB}, ${0.72 * bodyAlpha})`);

            octx.beginPath();
            if (typeof octx.roundRect === 'function') {
              octx.roundRect(-w / 2, -h / 2, w, h, rad);
            } else {
              octx.rect(-w / 2, -h / 2, w, h);
            }
            octx.fillStyle = mGrad;
            octx.fill();

            octx.save();
            octx.clip();
            // as lamelas de mielina: camadas finas ao longo do comprimento
            const nl = nv >= 3 ? 4 : 2;                                       // de muito perto: mais lamelas, mais finas
            octx.lineWidth = nv >= 1 ? (nv >= 3 ? 0.5 : 0.7) * u : Math.max(0.6, 0.8 * A.scale);
            for (let li = -nl; li <= nl; li++) {
              octx.strokeStyle = `rgba(${lightR}, ${lightG}, ${lightB}, ${li === 0 ? 0.20 * bodyAlpha : 0.34 * bodyAlpha})`;
              octx.beginPath();
              octx.moveTo(-w * 0.47, li * h * 0.34 / nl + (mIdx % 2) * 0.8);
              octx.quadraticCurveTo(0, li * h * 0.42 / nl, w * 0.47, li * h * 0.34 / nl - (mIdx % 2) * 0.8);
              octx.stroke();
            }
            // brilho especular no alto da bainha
            const sp = octx.createLinearGradient(-w / 2, 0, w / 2, 0);
            sp.addColorStop(0, 'rgba(255, 255, 255, 0)');
            sp.addColorStop(0.18, `rgba(255, 255, 255, ${0.34 * bodyAlpha})`);
            sp.addColorStop(0.82, `rgba(255, 255, 255, ${0.34 * bodyAlpha})`);
            sp.addColorStop(1, 'rgba(255, 255, 255, 0)');
            octx.fillStyle = sp;
            octx.fillRect(-w / 2, -h * 0.40, w, h * 0.12);
            octx.restore();

            // contorno nítido e os anéis das extremidades (paranós)
            octx.strokeStyle = `rgba(${lightR}, ${lightG}, ${lightB}, ${0.95 * bodyAlpha})`;
            octx.lineWidth = Math.max(1.0, 1.4 * A.scale);
            octx.beginPath();
            if (typeof octx.roundRect === 'function') {
              octx.roundRect(-w / 2, -h / 2, w, h, rad);
            } else {
              octx.rect(-w / 2, -h / 2, w, h);
            }
            octx.stroke();
            octx.strokeStyle = `rgba(255, 255, 255, ${0.55 * bodyAlpha})`;
            octx.lineWidth = Math.max(0.8, 1.0 * A.scale);
            [-1, 1].forEach(function (sd) {
              octx.beginPath();
              octx.ellipse(sd * (w / 2 - h * 0.16), 0, h * 0.10, h * 0.40, 0, 0, Math.PI * 2);
              octx.stroke();
            });
            octx.restore();
          });
          if (nv >= 2 && opc.modo !== 'ligacoes') {                                                      // nos nódulos de Ranvier: os canais de sódio
            octx.fillStyle = 'rgba(255, 255, 255, 0.85)';
            E.ranvierNodes.forEach(function (nd) {
              for (let k = -2; k <= 2; k++) { octx.beginPath(); octx.arc(nd.x, nd.y + k * 1.5, 0.45, 0, Math.PI * 2); octx.fill(); }
            });
          }
          octx.restore();
        }

        // 6. RAMOS DOS TELODENDROS UNIFORMES (Padrão aprovado) (um por axônio)
        function pintarTerminais(octx, A, E, T) {
          var r = T.r, g = T.g, b = T.b, lightR = T.lightR, lightG = T.lightG, lightB = T.lightB, dendriteAlpha = T.dendriteAlpha, nv = T.nv, u = T.u;
          octx.save();
          E.terminalBranches.forEach((br) => {
            const mult = br.depth === 1 ? 1.0 : 0.84;
            octx.fillStyle = `rgba(${r}, ${g}, ${b}, ${dendriteAlpha * 0.94 * mult})`;
            drawTaperedBranch(octx, br.pts);

            octx.strokeStyle = `rgba(${lightR}, ${lightG}, ${lightB}, ${Math.min(0.95, dendriteAlpha * 0.88 * mult)})`;
            octx.lineWidth = Math.max(0.8, (br.depth === 1 ? 1.35 : 0.95) * A.scale);
            octx.beginPath();
            br.pts.forEach((p, idx) => {
              if (idx === 0) octx.moveTo(p.x, p.y);
              else octx.lineTo(p.x, p.y);
            });
            octx.stroke();
            if (nv >= 1 && br.pts.length > 3) {                               // de perto: as bordas dos ramos terminais
              const bb = bordasRamo(br.pts);
              octx.strokeStyle = `rgba(${lightR}, ${lightG}, ${lightB}, 0.6)`;
              octx.lineWidth = 0.8 * u;
              octx.beginPath(); trilhaSuave(octx, bb.L, true); octx.stroke();
              octx.beginPath(); trilhaSuave(octx, bb.R, true); octx.stroke();
            }
          });
          octx.restore();
        }

        // Desenha uma célula (halo, dendritos, soma, núcleo, axônio, telodendros) no espaço do neurônio: o desenho aprovado
        function pintarCelula(octx, A, rgb) {
          const T = tintaFixa(rgb);
          pintarHalo(octx, A, T);                // 1
          pintarDendritos(octx, A, T);           // 2
          pintarSoma(octx, A, T);                // 3
          pintarNucleo(octx, A, T);              // 4
          // (com mais de um axônio, o laço desenha cada um com as mesmas peças: axônio, bainhas, nódulos e terminais)
          [A].concat(A.extras || []).forEach(function (E) {
          if (E.rgb) {                                                        // ligações: cada axônio na sua cor
            T.r = E.rgb[0]; T.g = E.rgb[1]; T.b = E.rgb[2];
            T.lightR = Math.min(255, T.r + 90); T.lightG = Math.min(255, T.g + 90); T.lightB = Math.min(255, T.b + 90);
            T.deepR = Math.round(T.r * 0.26); T.deepG = Math.round(T.g * 0.26); T.deepB = Math.round(T.b * 0.26);
          }
          pintarAxonio(octx, A, E, T);           // 5
          pintarTerminais(octx, A, E, T);        // 6
          });
        }

        // Os bulbos dos neurônios menores ficam na camada fixa (sem vesículas); o brilho do disparo é desenhado por cima
        function pintarBotoesFixos(octx, A, rgb) {
          const [r, g, b] = rgb || config.rgb;
          const lr = Math.min(255, r + 95), lg = Math.min(255, g + 95), lb = Math.min(255, b + 95);
          const dr = Math.round(r * 0.28), dg = Math.round(g * 0.28), db = Math.round(b * 0.28);
          const dAlpha = Math.max(0.08, config.opacidadeDendritos / 100);
          A.terminalBoutons.forEach(function (bt) {
            octx.save();
            octx.translate(bt.x, bt.y);
            octx.rotate(bt.tipAngle);
            const bw = bt.bThick, bh = bt.bWidth, nh = bt.neckW * 0.5;
            octx.beginPath();
            octx.moveTo(-bw * 0.92, -nh);
            octx.bezierCurveTo(-bw * 0.42, -nh * 1.12, -bw * 0.14, -bh * 0.54, bw * 0.36, -bh * 0.50);
            octx.bezierCurveTo(bw * 0.62, -bh * 0.46, bw * 0.64, bh * 0.46, bw * 0.36, bh * 0.50);
            octx.bezierCurveTo(-bw * 0.14, bh * 0.54, -bw * 0.42, nh * 1.12, -bw * 0.92, nh);
            octx.closePath();
            const cg = octx.createLinearGradient(-bw * 0.85, 0, bw * 0.60, 0);
            cg.addColorStop(0, `rgba(${r}, ${g}, ${b}, 0)`);
            cg.addColorStop(0.28, `rgba(${r}, ${g}, ${b}, ${dAlpha * 0.94})`);
            cg.addColorStop(0.68, `rgba(${dr}, ${dg}, ${db}, 0.88)`);
            cg.addColorStop(1, `rgba(${lr}, ${lg}, ${lb}, 0.80)`);
            octx.fillStyle = cg;
            octx.fill();
            octx.strokeStyle = `rgba(${lr}, ${lg}, ${lb}, 0.6)`;
            octx.lineWidth = 1.0 * A.scale;
            octx.stroke();
            if (nivel() >= 2) {                                               // de perto: as vesículas dentro do bulbo
              bt.vesicles.forEach(function (v) {
                octx.fillStyle = `rgba(${lr}, ${lg}, ${lb}, 0.25)`;
                octx.beginPath(); octx.arc(v.homeX, v.homeY, v.radius, 0, Math.PI * 2); octx.fill();
                octx.strokeStyle = `rgba(${lr}, ${lg}, ${lb}, 0.8)`;
                octx.lineWidth = 0.6;
                octx.stroke();
              });
            }
            octx.restore();
          });
        }







        // Renderizador unificado de pulso luminoso suave
        function drawUnifiedSmoothPulse(x, y, radius, lightR, lightG, lightB, r, g, b, glowFactor, alphaScale) {
          const a = alphaScale !== undefined ? alphaScale : 1;
          radius *= Est.pulsoZ;                                                   // de perto o brilho do pulso não cresce na mesma proporção
          const pGrad = ctx.createRadialGradient(x, y, 0.5, x, y, radius);
          pGrad.addColorStop(0, `rgba(255, 255, 255, ${0.92 * glowFactor * a})`);
          pGrad.addColorStop(0.45, `rgba(${lightR}, ${lightG}, ${lightB}, ${0.65 * glowFactor * a})`);
          pGrad.addColorStop(1, `rgba(${r}, ${g}, ${b}, 0)`);
          ctx.fillStyle = pGrad;
          ctx.beginPath();
          ctx.arc(x, y, radius, 0, Math.PI * 2);
          ctx.fill();
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

          let [r, g, b] = config.rgb;
          let lightR = Math.min(255, r + 95);
          let lightG = Math.min(255, g + 95);
          let lightB = Math.min(255, b + 95);
          let deepR = Math.round(r * 0.28);
          let deepG = Math.round(g * 0.28);
          let deepB = Math.round(b * 0.28);
          // cada axônio das ligações tem a sua cor: quem desenha o que é dele chama usaCor(cor); sem cor vale a da célula
          const usaCor = function (c) {
            c = c || config.rgb; r = c[0]; g = c[1]; b = c[2];
            lightR = Math.min(255, r + 95); lightG = Math.min(255, g + 95); lightB = Math.min(255, b + 95);
            deepR = Math.round(r * 0.28); deepG = Math.round(g * 0.28); deepB = Math.round(b * 0.28);
          };
          const glowFactor = Math.max(0.15, config.brilhoGeral / 100);
          const dendriteAlpha = Math.max(0.08, config.opacidadeDendritos / 100);

          // 1. Névoa de Dispersão translúcida
          if (config.enableMist && zcL < 0.98) {
            mistClouds.forEach((m) => {
              usaCor(m.rgb);
              const mGrad = ctx.createRadialGradient(m.x, m.y, 1, m.x, m.y, m.radius);
              mGrad.addColorStop(0, `rgba(${lightR}, ${lightG}, ${lightB}, ${0.24 * m.life * (1 - zcL)})`);
              mGrad.addColorStop(0.55, `rgba(${r}, ${g}, ${b}, ${0.12 * m.life * (1 - zcL)})`);
              mGrad.addColorStop(1, `rgba(${r}, ${g}, ${b}, 0)`);
              ctx.fillStyle = mGrad;
              ctx.beginPath();
              ctx.arc(m.x, m.y, m.radius, 0, Math.PI * 2);
              ctx.fill();
            });
          }

          ctx.globalCompositeOperation = 'lighter';

          // 1b. Os neurônios menores: o disparo no soma, o sinal no axônio e nos telodendros, o brilho nos terminais
          Est.minis.forEach(function (m) {
            const cm = (m.ativoT > 0 && m.ativo) || m.rgb;
            const mr = cm[0], mg = cm[1], mb = cm[2], ml = Math.min(255, mr + 95), mgl = Math.min(255, mg + 95), mbl = Math.min(255, mb + 95);
            if (m.excita > 0.02) {
              drawUnifiedSmoothPulse(m.soma.x, m.soma.y, 48 * m.s * (1.6 + m.excita * 0.6), ml, mgl, mbl, mr, mg, mb, glowFactor, 0.55 * m.excita * m.dA);
            }
            if (m.flash > 0.02) {
              m.botoes.forEach(function (p) {
                drawUnifiedSmoothPulse(p.x, p.y, 6.5 * m.ds, ml, mgl, mbl, mr, mg, mb, glowFactor, m.flash * 0.9 * m.dA);
              });
            }
          });
          miniAPs.forEach(function (ap) {
            const m = ap.m;
            if (ap.t < 0) return;
            const cm = ap.rgb || m.rgb;
            const mr = cm[0], mg = cm[1], mb = cm[2], ml = Math.min(255, mr + 95), mgl = Math.min(255, mg + 95), mbl = Math.min(255, mb + 95);
            if (ap.t <= 1.0) {
              const pts = m.eixo, head = ap.t * (pts.length - 1);
              for (let k = 10; k >= 0; k--) {
                const si = head - k * 1.1;
                if (si < 0) continue;
                const i0 = Math.floor(si), i1 = Math.min(pts.length - 1, i0 + 1), fr = si - i0;
                const ratio = 1 - k / 11;
                drawUnifiedSmoothPulse(pts[i0].x + (pts[i1].x - pts[i0].x) * fr, pts[i0].y + (pts[i1].y - pts[i0].y) * fr,
                  (2.8 + ratio * 3.7) * 0.6 * m.ds, ml, mgl, mbl, mr, mg, mb, glowFactor, ratio * 0.85 * m.dA);
              }
            } else {
              const subT = Math.min(1, (ap.t - 1.0) / 0.35);
              m.ramos.forEach(function (pts) {
                if (pts.length < 2) return;
                for (let k = 8; k >= 0; k--) {
                  const st = Math.max(0, subT - k * 0.032), si = st * (pts.length - 1);
                  const i0 = Math.floor(si), i1 = Math.min(pts.length - 1, i0 + 1), fr = si - i0;
                  const ratio = 1 - k / 9;
                  drawUnifiedSmoothPulse(pts[i0].x + (pts[i1].x - pts[i0].x) * fr, pts[i0].y + (pts[i1].y - pts[i0].y) * fr,
                    (2.5 + ratio * 3.6) * 0.5 * m.ds, ml, mgl, mbl, mr, mg, mb, glowFactor, ratio * 0.8 * m.dA);
                }
              });
            }
          });

          usaCor();
          // 2. Excitação dinâmica suave no Soma
          if (runtime.somaExcitation > 0.02) {
            const exRad = Est.anatomy.somaRadius * (1.25 + runtime.somaExcitation * 0.45);
            const exGrad = ctx.createRadialGradient(
              Est.anatomy.somaX, Est.anatomy.somaY, Est.anatomy.somaRadius * 0.2,
              Est.anatomy.somaX, Est.anatomy.somaY, exRad
            );
            const sc = runtime.somaRgb;
            exGrad.addColorStop(0, sc ? `rgba(${Math.min(255, sc[0] + 95)}, ${Math.min(255, sc[1] + 95)}, ${Math.min(255, sc[2] + 95)}, ${0.34 * runtime.somaExcitation * glowFactor * (1 - 0.5 * zcL)})` : `rgba(${lightR}, ${lightG}, ${lightB}, ${0.34 * runtime.somaExcitation * glowFactor * (1 - 0.5 * zcL)})`);
            exGrad.addColorStop(1, sc ? `rgba(${sc[0]}, ${sc[1]}, ${sc[2]}, 0)` : `rgba(${r}, ${g}, ${b}, 0)`);
            ctx.fillStyle = exGrad;
            ctx.beginPath();
            ctx.arc(Est.anatomy.somaX, Est.anatomy.somaY, exRad, 0, Math.PI * 2);
            ctx.fill();
          }

          // 3. Pulsos de entrada nos dendritos
          incomingSignals.forEach((sig) => {
            const pts = sig.pts;
            if (!pts || pts.length < 2) return;
            const idxFloat = sig.progress * (pts.length - 1);
            const i0 = Math.max(0, Math.floor(idxFloat));
            const i1 = Math.min(pts.length - 1, i0 + 1);
            const frac = idxFloat - i0;
            const x = pts[i0].x + (pts[i1].x - pts[i0].x) * frac;
            const y = pts[i0].y + (pts[i1].y - pts[i0].y) * frac;

            if (sig.rgb) drawUnifiedSmoothPulse(x, y, 6.5 * Est.anatomy.scale, Math.min(255, sig.rgb[0] + 95), Math.min(255, sig.rgb[1] + 95), Math.min(255, sig.rgb[2] + 95), sig.rgb[0], sig.rgb[1], sig.rgb[2], glowFactor, 1);
            else drawUnifiedSmoothPulse(x, y, 6.5 * Est.anatomy.scale, lightR, lightG, lightB, r, g, b, glowFactor, 1);
          });

          // 4. Nódulos de Ranvier
          Est.anatomy.nosTodos.forEach((node) => {
            usaCor(node.rgb);
            if (node.flash > 0.02) {
              const nRad = 7.2 * Est.anatomy.scale * (0.7 + node.flash * 0.45);
              const foraN = fadeFora(node.x, node.y);
              if (foraN > 0.01) drawUnifiedSmoothPulse(node.x, node.y, nRad, lightR, lightG, lightB, r, g, b, glowFactor, node.flash * 0.85 * foraN);
            }
          });

          // 5. Potenciais de ação percorrendo o axônio e entrando nos telodendros até os bulbos
          actionPotentials.forEach((ap) => {
            usaCor(ap.rgb || ap.eixo.rgb);
            const eixoPts = ap.eixo.axonPath;
            if (ap.t <= 1.0 && eixoPts.length > 1) {
              const headPos = Math.max(0, ap.t) * (eixoPts.length - 1);
              const trailSteps = 10;

              for (let s = trailSteps; s >= 0; s--) {
                const sampleIdx = headPos - s * 1.1;
                if (sampleIdx < 0) continue;
                const i0 = Math.floor(sampleIdx);
                const i1 = Math.min(eixoPts.length - 1, i0 + 1);
                const frac = sampleIdx - i0;
                const x = eixoPts[i0].x + (eixoPts[i1].x - eixoPts[i0].x) * frac;
                const y = eixoPts[i0].y + (eixoPts[i1].y - eixoPts[i0].y) * frac;

                const ratio = 1 - s / (trailSteps + 1);
                const rad = (2.8 + ratio * 3.7) * Est.anatomy.scale;
                const fora = fadeFora(x, y);
                if (fora > 0.01) drawUnifiedSmoothPulse(x, y, rad, lightR, lightG, lightB, r, g, b, glowFactor, ratio * 0.85 * fora);
              }
            } else {
              const subT = Math.min(1, (ap.t - 1.0) / 0.35);
              const trailSteps = 8;
              ap.boutons.forEach((bouton) => {
                const pts = bouton.branchPts;
                if (!pts || pts.length < 2) return;
                for (let s = trailSteps; s >= 0; s--) {
                  const st = Math.max(0, subT - s * 0.032);
                  const idxFloat = st * (pts.length - 1);
                  const i0 = Math.floor(idxFloat);
                  const i1 = Math.min(pts.length - 1, i0 + 1);
                  const frac = idxFloat - i0;
                  const x = pts[i0].x + (pts[i1].x - pts[i0].x) * frac;
                  const y = pts[i0].y + (pts[i1].y - pts[i0].y) * frac;

                  const ratio = 1 - s / (trailSteps + 1);
                  const tRad = (2.5 + ratio * 3.6) * Est.anatomy.scale;
                  drawUnifiedSmoothPulse(x, y, tRad, lightR, lightG, lightB, r, g, b, glowFactor, ratio * 0.88);
                }
              });
            }
          });

          ctx.globalCompositeOperation = 'source-over';

          // 6. Bulbos Pré-Sinápticos Unificados em Sino Contínuo + Vesículas + Bolsas de Exocitose
          const boutonsMain = Est.anatomy.terminalBoutons;
          const detalheFino = lupa.z >= 1.5;                                  // os pontinhos das vesículas e os sulcos só aparecem com a lupa
          Est.anatomy.boutonsTodos.forEach((bouton) => {
            usaCor(bouton.rgb);
            const leveB = !detalheFino && boutonsMain.indexOf(bouton) < 0;   // nos terminais dos axônios extras, a 1x, só o essencial
            ctx.save();
            ctx.translate(bouton.x, bouton.y);
            ctx.rotate(bouton.tipAngle);

            const bw = bouton.bThick;
            const bh = bouton.bWidth;
            const neckHalf = bouton.neckW * 0.5;

            ctx.beginPath();
            ctx.moveTo(-bw * 0.92, -neckHalf);
            ctx.bezierCurveTo(-bw * 0.42, -neckHalf * 1.12, -bw * 0.14, -bh * 0.54, bw * 0.36, -bh * 0.50);
            ctx.bezierCurveTo(bw * 0.62, -bh * 0.46, bw * 0.64, bh * 0.46, bw * 0.36, bh * 0.50);
            ctx.bezierCurveTo(-bw * 0.14, bh * 0.54, -bw * 0.42, neckHalf * 1.12, -bw * 0.92, neckHalf);
            ctx.closePath();

            const cupGrad = ctx.createLinearGradient(-bw * 0.85, 0, bw * 0.60, 0);
            cupGrad.addColorStop(0, `rgba(${r}, ${g}, ${b}, 0)`);
            cupGrad.addColorStop(0.28, `rgba(${r}, ${g}, ${b}, ${dendriteAlpha * 0.94})`);
            cupGrad.addColorStop(0.68, `rgba(${deepR}, ${deepG}, ${deepB}, 0.88)`);
            cupGrad.addColorStop(1, `rgba(${r}, ${g}, ${b}, ${0.72 + bouton.flash * 0.25})`);

            ctx.fillStyle = cupGrad;
            ctx.fill();

            ctx.save();
            ctx.clip();

            if (!leveB) bouton.grooves.forEach((gr, idx) => {
              const gy = gr.yNorm * bh;
              ctx.strokeStyle = idx % 2 === 0
                ? `rgba(${lightR}, ${lightG}, ${lightB}, 0.22)`
                : `rgba(${deepR}, ${deepG}, ${deepB}, 0.48)`;
              ctx.lineWidth = 0.9 * Est.anatomy.scale;
              ctx.beginPath();
              ctx.moveTo(-bw * 0.75, gy * 0.25);
              ctx.quadraticCurveTo(0, gy * (0.95 + gr.curve), bw * 0.52, gy * 0.85);
              ctx.stroke();
            });

            const energyGrad = ctx.createLinearGradient(-bw * 0.85, 0, bw * 0.52, 0);
            energyGrad.addColorStop(0, `rgba(${lightR}, ${lightG}, ${lightB}, ${0.55 + bouton.flash * 0.40})`);
            energyGrad.addColorStop(1, `rgba(${lightR}, ${lightG}, ${lightB}, ${0.35 + bouton.flash * 0.55})`);
            ctx.strokeStyle = energyGrad;
            ctx.lineWidth = (1.4 + bouton.flash * 1.0) * Est.anatomy.scale;
            ctx.beginPath();
            ctx.moveTo(-bw * 0.85, 0);
            ctx.quadraticCurveTo(-bw * 0.15, -bh * 0.06, bw * 0.46, -bh * 0.24);
            ctx.moveTo(-bw * 0.45, 0);
            ctx.quadraticCurveTo(0, bh * 0.04, bw * 0.46, bh * 0.24);
            ctx.stroke();

            if (config.enableVesicles) {
              bouton.vesicles.forEach((v) => {
                const twinkle = 0.72 + 0.28 * Math.sin(runtime.time * 3.8 + v.phase);
                const isFusing = v.fusionProgress > 0;
                const vAlpha = isFusing
                  ? Math.max(0.25, (1 - v.fusionProgress) * 0.95)
                  : Math.min(1, twinkle * (0.80 + bouton.flash * 0.20));

                const drawX = isFusing ? bw * 0.42 : v.localX;
                const drawY = v.localY;
                const drawR = v.radius;

                ctx.fillStyle = `rgba(${lightR}, ${lightG}, ${lightB}, ${0.26 * vAlpha})`;
                ctx.beginPath();
                ctx.arc(drawX, drawY, drawR, 0, Math.PI * 2);
                ctx.fill();

                ctx.strokeStyle = `rgba(${lightR}, ${lightG}, ${lightB}, ${0.75 * vAlpha})`;
                ctx.lineWidth = 0.75 * Est.anatomy.scale;
                ctx.stroke();

                const dotR = drawR * 0.26;
                ctx.fillStyle = `rgba(${lightR}, ${lightG}, ${lightB}, ${vAlpha})`;
                for (let d = 0; d < (leveB ? 0 : 4); d++) {
                  const da = v.phase + (d * Math.PI) / 2;
                  ctx.beginPath();
                  ctx.arc(
                    drawX + Math.cos(da) * drawR * 0.42,
                    drawY + Math.sin(da) * drawR * 0.42,
                    dotR,
                    0,
                    Math.PI * 2
                  );
                  ctx.fill();
                }
              });
            }

            const pocketYList = [-bh * 0.26, 0, bh * 0.26];
            const pocketRad = 2.2 * Est.anatomy.scale;
            pocketYList.forEach((py, pi) => {
              const pGlow = bouton.pocketExcite[pi] || 0;
              ctx.fillStyle = '#000000';
              ctx.beginPath();
              ctx.arc(bw * 0.54, py, pocketRad, Math.PI * 0.5, Math.PI * 1.5);
              ctx.fill();

              ctx.strokeStyle = `rgba(${lightR}, ${lightG}, ${lightB}, ${0.58 + pGlow * 0.42})`;
              ctx.lineWidth = (0.95 + pGlow * 0.55) * Est.anatomy.scale;
              ctx.beginPath();
              ctx.arc(bw * 0.54, py, pocketRad, Math.PI * 0.52, Math.PI * 1.48);
              ctx.stroke();
            });

            ctx.restore();

            // Contorno apenas nas paredes externas do sino (sem linha fechando o pescoço)
            ctx.strokeStyle = `rgba(${lightR}, ${lightG}, ${lightB}, 0.54)`;
            ctx.lineWidth = 1.0 * Est.anatomy.scale;
            ctx.beginPath();
            ctx.moveTo(-bw * 0.92, -neckHalf);
            ctx.bezierCurveTo(-bw * 0.42, -neckHalf * 1.12, -bw * 0.14, -bh * 0.54, bw * 0.36, -bh * 0.50);
            ctx.bezierCurveTo(bw * 0.62, -bh * 0.46, bw * 0.64, bh * 0.46, bw * 0.36, bh * 0.50);
            ctx.bezierCurveTo(-bw * 0.14, bh * 0.54, -bw * 0.42, neckHalf * 1.12, -bw * 0.92, neckHalf);
            ctx.stroke();

            ctx.restore();
          });

          // 7. Neurotransmissores esféricos liberados na fenda sináptica
          ctx.globalCompositeOperation = 'lighter';
          releasedNeurotransmitters.forEach((nt) => {
            usaCor(nt.rgb);
            if (nt.progress < 0) return;

            if (nt.isCentralBeam) {
              ctx.strokeStyle = `rgba(${lightR}, ${lightG}, ${lightB}, 0.28)`;
              ctx.lineWidth = 0.85 * Est.anatomy.scale;
              ctx.beginPath();
              ctx.moveTo(nt.startX, nt.startY);
              ctx.lineTo(nt.targetX, nt.targetY);
              ctx.stroke();
            }

            const ntGrad = ctx.createRadialGradient(nt.x, nt.y, 0.2, nt.x, nt.y, nt.size * 2.4);
            ntGrad.addColorStop(0, 'rgba(255, 255, 255, 0.96)');
            ntGrad.addColorStop(0.45, `rgba(${lightR}, ${lightG}, ${lightB}, 0.85)`);
            ntGrad.addColorStop(1, `rgba(${r}, ${g}, ${b}, 0)`);
            ctx.fillStyle = ntGrad;
            ctx.beginPath();
            ctx.arc(nt.x, nt.y, nt.size * 2.4, 0, Math.PI * 2);
            ctx.fill();

            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            ctx.arc(nt.x, nt.y, nt.size * 0.72, 0, Math.PI * 2);
            ctx.fill();
          });

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
