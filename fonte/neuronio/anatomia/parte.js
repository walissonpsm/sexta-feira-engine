/* Sexta-Feira Engine v0.4.2: neuronio/anatomia. a geometria do neurônio: onde fica cada ramo, o axônio, as bainhas, os terminais, as árvores das ligações e a vista (escala e centro) da esfera. Não desenha.
 * Código movido sem reescrever de neuronio/celula: o estado vem de Est (a tabela dos campos está no LEIA-ME.md da juntadora e deste) e as funções
 * das irmãs chegam em d, passadas pela juntadora. Só desenha/calcula o que está na lista da porta. */
function (usa) {
  'use strict';

  function criar(Est, d) {
    var createSeededRandom = usa.sorteio.criar, hexToRgb = usa.cores.hexParaRgb;
    var DH = Est.DH, DW = Est.DW, EIXO_BASE = Est.EIXO_BASE, MINI_EIXO = Est.MINI_EIXO, PAREDE = Est.PAREDE, config = Est.config, opc = Est.opc, runtime = Est.runtime, vista = Est.vista;
// As ligações entre as esferas: cada uma é um axônio (caminho já no espaço do palco, em px) com bainhas, nódulos e uma
        // pequena árvore de terminais que termina tocando um dendrito. Mão única: o sinal só corre do começo para o fim do caminho.
        const arvoresCache = new Map();

// comprimento do axônio do menor em relação ao do principal
        function axonStartFim() { return DW * 0.25 + 48 * 1.44 + EIXO_BASE * MINI_EIXO; }

// Monta a anatomia completa de um neurônio (o desenho aprovado) a partir de uma semente; não desenha nada
        function montarAnatomia(semente, fimAxonio, principal, extrasMini) {
          const rng = createSeededRandom(semente);
          const somaX = DW * 0.25;
          const somaY = DH * 0.52;
          const scale = 1;

          const somaRadius = 48 * scale;

          // 1. SOMA MULTIPOLAR COM PAREDE CELULAR 3D (Padrão bloqueado)
          const primaryAngles = [-2.74, -2.16, -1.58, -0.98, -0.50, 0.50, 0.98, 1.58, 2.16];
          const somaOutline = [];
          const outlineSteps = 144;

          for (let i = 0; i < outlineSteps; i++) {
            const ang = (Math.PI * 2 * i) / outlineSteps;
            let pull = 0;

            for (let t = 0; t < primaryAngles.length; t++) {
              const diff = Math.atan2(Math.sin(ang - primaryAngles[t]), Math.cos(ang - primaryAngles[t]));
              pull += Math.exp(-(diff * diff) / 0.044) * 0.45;
            }

            const hillockDiff = Math.atan2(Math.sin(ang), Math.cos(ang));
            pull += Math.exp(-(hillockDiff * hillockDiff) / 0.065) * 0.74;

            const ruffle = Math.sin(ang * 15) * 0.02 + Math.cos(ang * 26 + 0.7) * 0.014 + (rng() - 0.5) * 0.016;
            const r = somaRadius * (0.86 + pull + ruffle);

            somaOutline.push({
              x: somaX + Math.cos(ang) * r,
              y: somaY + Math.sin(ang) * r,
              ang,
              r
            });
          }

          const membraneSpicules = [];
          for (let i = 0; i < somaOutline.length; i += 3) {
            if (rng() < 0.56) {
              const pt = somaOutline[i];
              membraneSpicules.push({
                x: pt.x,
                y: pt.y,
                ang: pt.ang + (rng() - 0.5) * 0.20,
                h: (2.3 + rng() * 3.3) * scale,
                w: (2.1 + rng() * 1.9) * scale
              });
            }
          }

          const cytoplasmRidges = [];
          for (let i = 0; i < 42; i++) {
            const ang = (Math.PI * 2 * i) / 42 + (rng() - 0.5) * 0.14;
            const rIn = somaRadius * (0.36 + rng() * 0.20);
            const rOut = somaRadius * (0.78 + rng() * 0.35);
            const ctrlAng = ang + (rng() - 0.5) * 0.28;
            const rMid = (rIn + rOut) * 0.52;
            cytoplasmRidges.push({
              x1: somaX + Math.cos(ang) * rIn,
              y1: somaY + Math.sin(ang) * rIn,
              cx: somaX + Math.cos(ctrlAng) * rMid,
              cy: somaY + Math.sin(ctrlAng) * rMid,
              x2: somaX + Math.cos(ang + (rng() - 0.5) * 0.14) * rOut,
              y2: somaY + Math.sin(ang + (rng() - 0.5) * 0.14) * rOut,
              isHighlight: rng() > 0.42,
              width: (0.85 + rng() * 1.6) * scale
            });
          }

          const membraneGranules = [];
          for (let i = 0; i < 50; i++) {
            const ang = (Math.PI * 2 * i) / 50 + rng() * 0.35;
            const dist = somaRadius * (0.34 + rng() * 0.65);
            membraneGranules.push({
              x: somaX + Math.cos(ang) * dist,
              y: somaY + Math.sin(ang) * dist,
              r: (1.5 + rng() * 2.6) * scale
            });
          }

          const nucleusChromatin = [];
          const nucR = somaRadius * 0.34;
          for (let n = 0; n < 24; n++) {
            const na = rng() * Math.PI * 2;
            const nd = rng() * nucR * 0.78;
            nucleusChromatin.push({
              x: somaX + Math.cos(na) * nd,
              y: somaY + Math.sin(na) * nd,
              r: (1.0 + rng() * 1.8) * scale,
              bright: n % 2 === 0
            });
          }

          // 2. DENDRITOS AFILADOS COM PONTAS AGUDAS (Padrão bloqueado)
          const branchFactor = Math.max(0.15, config.ramificacaoDendritos / 100);
          const dendriteBranches = [];
          const dendriteTips = [];
          const synapticSpines = [];

          function growDendrite(startX, startY, angle, length, startWidth, level, maxLevel, pai, idxPai, reto) {
            const segCount = Math.max(12, Math.round(length / (4.3 * scale)));
            const pts = [{ x: startX, y: startY, w: startWidth }];
            const entrada = { pts, tipX: startX, tipY: startY, level, pai: pai || null, idxPai: idxPai || 0 };

            let curX = startX;
            let curY = startY;
            let curAng = angle;
            const stepLen = length / segCount;
            const curlFreq = 0.24 + rng() * 0.26;
            const curlAmp = (0.075 + rng() * 0.065) * (rng() > 0.5 ? 1 : -1);

            for (let s = 1; s <= segCount; s++) {
              const progress = s / segCount;
              curAng += (Math.sin(s * curlFreq + level) * curlAmp + (rng() - 0.5) * 0.055) * (reto || 1);
              curX += Math.cos(curAng) * stepLen;
              curY += Math.sin(curAng) * stepLen;

              const w = startWidth * Math.pow(1 - progress, 1.38);
              pts.push({ x: curX, y: curY, w: Math.max(0.02, w) });

              if (s > 2 && s < segCount - 1 && rng() < 0.44 * branchFactor) {
                const side = rng() > 0.5 ? 1 : -1;
                const spineAng = curAng + side * (1.06 + rng() * 0.42);
                const spineLen = (3.3 + rng() * 4.4) * scale;
                synapticSpines.push({
                  x1: curX,
                  y1: curY,
                  x2: curX + Math.cos(spineAng) * spineLen,
                  y2: curY + Math.sin(spineAng) * spineLen,
                  hasReceptor: rng() < 0.45
                });
              }

              if (level < maxLevel && s >= Math.floor(segCount * 0.28) && s <= Math.floor(segCount * 0.84)) {
                const splitChance = level === 1 ? 0.29 : 0.19;
                if (rng() < splitChance * branchFactor) {
                  const forkSide = s % 2 === 0 ? 1 : -1;
                  const forkAng = curAng + forkSide * (0.40 + rng() * 0.28);
                  const childLen = length * (1 - progress * 0.38) * (0.65 + rng() * 0.16);
                  const childW = Math.max(0.8 * scale, w * 0.78);
                  growDendrite(curX, curY, forkAng, childLen, childW, level + 1, maxLevel, entrada, s);
                }
              }
            }

            dendriteBranches.push({ pts, level });
            entrada.tipX = curX; entrada.tipY = curY;
            dendriteTips.push(entrada);
          }

          const maxDepth = branchFactor > 0.65 ? 3 : branchFactor > 0.3 ? 2 : 1;
          primaryAngles.forEach((ang) => {
            const sx = somaX + Math.cos(ang) * (somaRadius * 1.02);
            const sy = somaY + Math.sin(ang) * (somaRadius * 1.02);
            const trunkLen = (148 + rng() * 50) * scale * (0.65 + branchFactor * 0.45);
            const trunkWidth = (7.4 + rng() * 1.8) * scale;
            growDendrite(sx, sy, ang, trunkLen, trunkWidth, 1, maxDepth);
          });

          // dendritos de contato (opcionais, só no principal): um ramo fino e curto, sorteado depois dos primários (os primários não mudam),
          // para onde uma ligação precisa tocar um dendrito e a folga entre os primários não tem nenhum
          if ((principal && opc.dendritosExtra) || extrasMini) {
            (principal ? opc.dendritosExtra : extrasMini).forEach(function (x) {
              const n0 = dendriteTips.length, b0 = dendriteBranches.length;
              growDendrite(somaX + Math.cos(x.ang) * somaRadius * 1.02, somaY + Math.sin(x.ang) * somaRadius * 1.02, x.ang, x.comp * scale, x.larg * scale, 1, x.nivel || 1, null, 0, 0.18);
              for (let q = n0; q < dendriteTips.length; q++) dendriteTips[q].extra = true;
              for (let q = b0; q < dendriteBranches.length; q++) dendriteBranches[q].extra = true;
            });
          }

          // 3. AXÔNIO SALTATÓRIO COM BAINHA DE MIELINA & NÓDULOS DE RANVIER
          const eixo = montarAxonio(somaX, somaY, somaRadius, scale, fimAxonio || DW * 0.62);
          const axonPath = eixo.axonPath;
          const myelinSheaths = eixo.myelinSheaths;
          const ranvierNodes = eixo.ranvierNodes;

          // 4. TELODENDROS ENCORPADOS & BULBOS PRÉ-SINÁPTICOS EM SINO CONTÍNUO (Peça aprovada)
          const terminalRoot = axonPath[axonPath.length - 1];
          const terminalBranches = [];
          const terminalBoutons = [];
          const terminalRng = createSeededRandom((semente + 55219 - 94127) >>> 0);
          const primaryTermAngles = [-0.94, -0.65, -0.37, -0.11, 0.14, 0.40, 0.68, 0.95];

          function growTelodendria(startX, startY, angle, length, startW, depth) {
            const steps = Math.max(12, Math.round(length / (5.8 * scale)));
            const pts = [{ x: startX, y: startY, w: startW }];

            let cx = startX;
            let cy = startY;
            let curAng = angle;
            const stepLen = length / steps;
            const waveFreq = 0.26 + terminalRng() * 0.22;
            const waveAmp = (0.055 + terminalRng() * 0.045) * (terminalRng() > 0.5 ? 1 : -1);

            for (let s = 1; s <= steps; s++) {
              const p = s / steps;
              curAng += Math.sin(s * waveFreq + depth) * waveAmp + (terminalRng() - 0.5) * 0.03;
              cx += Math.cos(curAng) * stepLen;
              cy += Math.sin(curAng) * stepLen;

              const w = startW * (1 - p * 0.26);
              pts.push({ x: cx, y: cy, w: Math.max(3.6 * scale, w) });

              if (config.enableSubBranches && depth === 1 && s === Math.floor(steps * 0.54)) {
                const side = terminalRng() > 0.5 ? 1 : -1;
                const subAng = curAng + side * (0.34 + terminalRng() * 0.16);
                const subLen = length * 0.56;
                growTelodendria(cx, cy, subAng, subLen, w * 0.86, 2);
              }
            }

            terminalBranches.push({ pts, depth });

            const prevPt = pts[Math.max(0, pts.length - 3)];
            const tipAngle = Math.atan2(cy - prevPt.y, cx - prevPt.x);
            const neckW = Math.max(3.6 * scale, startW * 0.74);
            const bWidth = (depth === 1 ? 21.0 : 16.5) * scale;
            const bThick = (depth === 1 ? 15.2 : 12.0) * scale;

            const vesicles = [];
            const vCount = depth === 1 ? 6 : 4;
            for (let v = 0; v < vCount; v++) {
              const isDocked = v < 3;
              const slotY = (-0.28 + (v / Math.max(1, vCount - 1)) * 0.56) * bWidth;
              const homeX = isDocked ? bThick * 0.34 : (-0.15 + terminalRng() * 0.34) * bThick;
              vesicles.push({
                localX: homeX,
                localY: slotY,
                homeX,
                homeY: slotY,
                vx: (terminalRng() - 0.5) * 1.4,
                vy: (terminalRng() - 0.5) * 1.4,
                radius: (2.1 + terminalRng() * 0.55) * scale,
                phase: terminalRng() * Math.PI * 2,
                docked: isDocked,
                fusionProgress: 0,
                pocketIndex: v % 3
              });
            }

            terminalBoutons.push({
              branchPts: pts,
              x: cx,
              y: cy,
              tipAngle,
              neckW,
              bWidth,
              bThick,
              depth,
              vesicles,
              flash: 0,
              pocketExcite: [0, 0, 0],
              grooves: Array.from({ length: 6 }, (_, gi) => ({
                yNorm: -0.35 + (gi / 5) * 0.70,
                curve: (terminalRng() - 0.5) * 0.20
              }))
            });
          }

          primaryTermAngles.forEach((ang, idx) => {
            const len = (116 + (idx % 3) * 18) * scale;
            growTelodendria(terminalRoot.x, terminalRoot.y, ang, len, 7.2 * scale, 1);
          });

          return {
            somaX,
            somaY,
            somaRadius,
            scale,
            somaOutline,
            membraneSpicules,
            cytoplasmRidges,
            membraneGranules,
            nucleusChromatin,
            dendriteBranches,
            dendriteTips,
            synapticSpines,
            axonPath,
            myelinSheaths,
            ranvierNodes,
            terminalBranches,
            terminalBoutons,
            axonEscala: eixo.axonEscala,
            semente: semente,
            offscreenCanvas: null
          };
        }

// Axônio com bainha de mielina e nódulos de Ranvier. No comprimento original o resultado é idêntico ao desenho aprovado;
        // mais longo (o tronco que sai da esfera), a onda, a espessura e o tamanho das bainhas ficam iguais e só aumentam em número.
        function montarAxonio(somaX, somaY, somaRadius, scale, axonEndX) {
          const axonStartX = somaX + somaRadius * 1.44;
          const axonStartY = somaY;
          const axonLen = Math.max(120, axonEndX - axonStartX);
          const rel = axonLen / EIXO_BASE;
          const axonSteps = Math.max(24, Math.round(72 * rel));

          const axonPath = [];
          for (let i = 0; i <= axonSteps; i++) {
            const t = i / axonSteps;
            const x = axonStartX + t * axonLen;
            const tb = t * rel;
            const y = axonStartY + Math.sin(tb * Math.PI * 1.65) * (15 * scale);
            const w = (7.8 - Math.min(1, tb) * 0.8) * scale;
            axonPath.push({ x, y, t, w });
          }

          const myelinSheaths = [];
          const ranvierNodes = [];
          const numSheaths = Math.max(3, Math.round(6 * (rel - 0.1) / 0.9));
          const gapRatio = 0.028 / rel;
          const usableSpan = 1 - 0.10 / rel;
          const startOffset = 0.04 / rel;
          const segSpan = (usableSpan - gapRatio * (numSheaths - 1)) / numSheaths;

          for (let m = 0; m < numSheaths; m++) {
            const t0 = startOffset + m * (segSpan + gapRatio);
            const t1 = t0 + segSpan;
            const idx0 = Math.floor(t0 * axonSteps);
            const idx1 = Math.min(axonSteps, Math.ceil(t1 * axonSteps));
            const pStart = axonPath[idx0];
            const pEnd = axonPath[idx1];
            const pMid = axonPath[Math.floor((idx0 + idx1) / 2)];

            myelinSheaths.push({
              pStart,
              pMid,
              pEnd,
              angle: Math.atan2(pEnd.y - pStart.y, pEnd.x - pStart.x),
              length: Math.hypot(pEnd.x - pStart.x, pEnd.y - pStart.y),
              thickness: (15.0 + (m % 2) * 1.4) * scale
            });

            if (m < numSheaths - 1) {
              const tGap = t1 + gapRatio * 0.5;
              const gapIdx = Math.min(axonSteps, Math.round(tGap * axonSteps));
              ranvierNodes.push({
                x: axonPath[gapIdx].x,
                y: axonPath[gapIdx].y,
                t: tGap,
                flash: 0
              });
            }
          }
          return { axonPath, myelinSheaths, ranvierNodes, axonEscala: 1 / rel };
        }

function arvoreDe(semente) {
          if (!arvoresCache.has(semente)) {
            const B = montarAnatomia(semente), pts = pontasTerminais(B), raiz = B.axonPath[B.axonPath.length - 1];
            let cx = 0, cy = 0;
            pts.forEach(function (p) { cx += p.x; cy += p.y; });
            cx /= pts.length; cy /= pts.length;
            let fx = -Infinity; pts.forEach(function (p) { fx = Math.max(fx, p.x - cx); });
            arvoresCache.set(semente, { B: B, cx: cx, cy: cy, rx: raiz.x - cx, ry: raiz.y - cy, fx: fx });
          }
          return arvoresCache.get(semente);
        }

function anatomiaLigacoes() {
          const A = { somaX: 0, somaY: 0, somaRadius: 0, scale: opc.escLig || 1, somaOutline: [], membraneSpicules: [], cytoplasmRidges: [], membraneGranules: [], nucleusChromatin: [],
            dendriteBranches: [], dendriteTips: [], synapticSpines: [], axonPath: [], myelinSheaths: [], ranvierNodes: [], terminalBranches: [], terminalBoutons: [],
            offscreenCanvas: null, semCorpo: true, semente: opc.semente, axonEscala: 1 };
          A.extras = opc.ligacoes.map(montarLigacao).filter(Boolean);
          return A;
        }

function montarLigacao(L, i) {
          const P = L && L.caminho, T = L && L.arvore;
          if (!P || P.length < 8) return null;
          const esc = L.esc || 1, n = P.length, rgb = /^#[0-9a-fA-F]{6}$/.test(L.cor) ? hexToRgb(L.cor) : config.rgb;
          // a árvore: o desenho dos terminais de uma semente, em escala f, girado para a direção de chegada, com o centro das pontas em (x, y)
          // (sem árvore, T = null: o axônio termina no caminho e quem desenha o terminal é a cena, uma ventosa)
          const arv = T ? arvoreDe(T.semente >>> 0) : null, f = T ? T.f : 1, fl = f * (T ? (T.lat || 1) : 1), ca = T ? Math.cos(T.ang) : 1, sa = T ? Math.sin(T.ang) : 0;
          const tr = function (p) { const dx = f * (p.x - arv.cx), dy = fl * (p.y - arv.cy); return { x: T.x + ca * dx - sa * dy, y: T.y + sa * dx + ca * dy }; };
          const B = T ? montarAnatomia(T.semente >>> 0) : { terminalBranches: [], terminalBoutons: [], axonPath: [] }, feitos = new Set();
          B.terminalBranches.forEach(function (br) {
            if (feitos.has(br.pts)) return;
            feitos.add(br.pts);
            br.pts.forEach(function (p) { const q = tr(p); p.x = q.x; p.y = q.y; p.w *= f; });
          });
          B.terminalBoutons.forEach(function (bt) {
            if (!feitos.has(bt.branchPts)) { feitos.add(bt.branchPts); bt.branchPts.forEach(function (p) { const q = tr(p); p.x = q.x; p.y = q.y; p.w *= f; }); }
            const q = tr({ x: bt.x, y: bt.y });
            bt.x = q.x; bt.y = q.y; bt.neckW *= f; bt.bWidth *= f; bt.bThick *= f; bt.rgb = rgb;
            bt.vesicles.forEach(function (v) { v.localX *= f; v.localY *= f; v.homeX *= f; v.homeY *= f; v.vx *= f; v.vy *= f; v.radius *= f; });
            const pb = bt.branchPts, pv = pb[Math.max(0, pb.length - 3)], pl = pb[pb.length - 1];
            bt.tipAngle = Math.atan2(pl.y - pv.y, pl.x - pv.x);
          });
          const raizNova = T ? tr(B.axonPath[B.axonPath.length - 1]) : null;
          let len = 0;
          const axonPath = P.map(function (p, j) {
            if (j) len += Math.hypot(p.x - P[j - 1].x, p.y - P[j - 1].y);
            return { x: p.x, y: p.y, t: j / (n - 1), w: 0, s: len };
          });
          if (raizNova) { axonPath[n - 1].x = raizNova.x; axonPath[n - 1].y = raizNova.y; }      // o axônio termina exatamente na raiz da árvore
          axonPath.forEach(function (p) { p.w = (7.8 - Math.min(1, p.s / (EIXO_BASE * esc)) * 0.8) * esc; });
          const rel = len / (EIXO_BASE * esc);
          const bn = bainhasNos(axonPath, rel, n - 1, esc, (i % 3) - 1, (L.livre || 0) / esc);
          bn.ranvierNodes.forEach(function (nd) { nd.rgb = rgb; });
          return { id: L.id, axonPath: axonPath, myelinSheaths: bn.myelinSheaths, ranvierNodes: bn.ranvierNodes, axonEscala: 1 / rel,
            terminalBranches: B.terminalBranches, terminalBoutons: B.terminalBoutons, scale: esc, indice: i, rgb: rgb };
        }

// Onde fica a raiz da árvore para um centro de pontas (x, y), direção de chegada ang e escala f (a cena precisa saber antes de traçar o caminho)
        function raizDaArvore(semente, x, y, ang, f, lat) {
          const a = arvoreDe(semente >>> 0), ca = Math.cos(ang), sa = Math.sin(ang), dx = f * a.rx, dy = f * (lat || 1) * a.ry;
          return { x: x + ca * dx - sa * dy, y: y + sa * dx + ca * dy, fwd: f * a.fx };
        }

// A caixa (no espaço do desenho) que um menor ocupa: ramos, axônio, terminais, espinhas e o halo do soma
        function caixaDe(B, leva, S, hr) {
          let x0 = S.x - hr, y0 = S.y - hr, x1 = S.x + hr, y1 = S.y + hr;
          const poe = function (p) { const q = leva(p); if (q.x < x0) x0 = q.x; if (q.y < y0) y0 = q.y; if (q.x > x1) x1 = q.x; if (q.y > y1) y1 = q.y; };
          B.dendriteBranches.forEach(function (br) { br.pts.forEach(poe); });
          B.terminalBranches.forEach(function (br) { br.pts.forEach(poe); });
          B.axonPath.forEach(poe); B.somaOutline.forEach(poe);
          B.synapticSpines.forEach(function (sp) { poe({ x: sp.x2, y: sp.y2 }); });
          B.terminalBoutons.forEach(function (bt) { poe({ x: bt.x, y: bt.y }); });
          return { x0: x0, y0: y0, x1: x1, y1: y1 };
        }

// Só o tronco do axônio do principal atravessa a parede: ele segue até a borda do canvas, rumo às outras esferas.
        // Os terminais dele ficam nas outras esferas e por isso não são desenhados aqui.
        function estenderTronco() {
          const borda = (runtime.width - vista.tx) / vista.k - 6;
          const ramos = Est.anatomy.terminalBranches, boutons = Est.anatomy.terminalBoutons;
          const velho = Est.anatomy.axonPath[Est.anatomy.axonPath.length - 1];
          // o quanto os terminais do Núcleo se espalham para a direita (com os bulbos), para que caibam no canvas
          let ext = 0;
          ramos.forEach(function (br) { br.pts.forEach(function (q) { ext = Math.max(ext, q.x - velho.x); }); });
          boutons.forEach(function (bt) { ext = Math.max(ext, bt.x - velho.x + (bt.bWidth || 0)); });
          const eixo = montarAxonio(Est.anatomy.somaX, Est.anatomy.somaY, Est.anatomy.somaRadius, Est.anatomy.scale, Math.max(DW * 0.62, borda - ext - 6));
          const novo = eixo.axonPath[eixo.axonPath.length - 1], dx = novo.x - velho.x, dy = novo.y - velho.y;
          const feitos = new Set();
          ramos.forEach(function (br) { if (!feitos.has(br.pts)) { feitos.add(br.pts); br.pts.forEach(function (q) { q.x += dx; q.y += dy; }); } });
          boutons.forEach(function (bt) {
            if (!feitos.has(bt.branchPts)) { feitos.add(bt.branchPts); bt.branchPts.forEach(function (q) { q.x += dx; q.y += dy; }); }
            bt.x += dx; bt.y += dy;
          });
          Est.anatomy.axonPath = eixo.axonPath;
          Est.anatomy.myelinSheaths = eixo.myelinSheaths;
          Est.anatomy.ranvierNodes = eixo.ranvierNodes;
          Est.anatomy.axonEscala = eixo.axonEscala;
          Est.anatomy.terminalBranches = ramos;        // os terminais do Núcleo ficam fora da esfera, no fim do tronco
          Est.anatomy.terminalBoutons = boutons;
        }

// As bainhas de mielina e os nódulos de Ranvier de um axônio já traçado (a mesma regra do montarAxonio; delta muda o número de
        // bainhas para que os axônios do feixe não tenham os nódulos alinhados)
        function bainhasNos(axonPath, rel, axonSteps, scale, delta, livre) {
          const myelinSheaths = [], ranvierNodes = [];
          const numSheaths = Math.max(3, Math.round(6 * (rel - 0.1) / 0.9) + (delta || 0));
          const gapRatio = 0.028 / rel;
          const startOffset = Math.max(0.04 / rel, (livre || 0) / (rel * EIXO_BASE));     // livre: o começo do axônio fica sem bainha (segmento inicial)
          const usableSpan = 1 - 0.10 / rel - (startOffset - 0.04 / rel);
          const segSpan = (usableSpan - gapRatio * (numSheaths - 1)) / numSheaths;
          for (let m = 0; m < numSheaths; m++) {
            const t0 = startOffset + m * (segSpan + gapRatio);
            const t1 = t0 + segSpan;
            const idx0 = Math.floor(t0 * axonSteps);
            const idx1 = Math.min(axonSteps, Math.ceil(t1 * axonSteps));
            const pStart = axonPath[idx0], pEnd = axonPath[idx1], pMid = axonPath[Math.floor((idx0 + idx1) / 2)];
            myelinSheaths.push({
              pStart, pMid, pEnd,
              angle: Math.atan2(pEnd.y - pStart.y, pEnd.x - pStart.x),
              length: Math.hypot(pEnd.x - pStart.x, pEnd.y - pStart.y),
              thickness: (15.0 + (m % 2) * 1.4) * scale
            });
            if (m < numSheaths - 1) {
              const tGap = t1 + gapRatio * 0.5;
              const gapIdx = Math.min(axonSteps, Math.round(tGap * axonSteps));
              ranvierNodes.push({ x: axonPath[gapIdx].x, y: axonPath[gapIdx].y, t: tGap, flash: 0 });
            }
          }
          return { myelinSheaths, ranvierNodes };
        }

// Os axônios do Núcleo (opc.axonios): saem do soma em leque curto, correm juntos e paralelos pelo corredor, atravessam a parede e
        // abrem em leque rumo às esferas dos agentes (uma ponta para cada). O principal (o do desenho aprovado) é um deles; os outros
        // levam terminais próprios (outra semente). Cada um é um objeto com as mesmas peças do principal (anatomy.extras).
        function montarFeixe() {
          const A = Est.anatomy, n = opc.axonios, k = vista.k, esc = A.scale;
          const somaX = A.somaX, somaY = A.somaY;
          const meio = (n - 1) / 2, iMain = Math.floor(meio);
          const x0 = somaX + A.somaRadius * 1.44;                                   // de onde parte o axônio original (fase da onda)
          const xBorda = (runtime.width - vista.tx) / k - 6;
          const xParede = (vista.cx + vista.Rpx * PAREDE - vista.tx) / k;
          const xAbre = xParede - opc.abre;                                         // onde o leque começa a abrir (antes da parede)
          const xFeixe = somaX + 330 * esc;                                         // daí em diante correm juntos, em paralelo
          const sp = 24 * esc;                                                      // distância entre os axônios no feixe
          const dyE = opc.leque / k;                                                // distância entre as pontas, no desenho
          const sm = function (u) { u = Math.max(0, Math.min(1, u)); return u * u * (3 - 2 * u); };
          const onda = function (x) { return Math.sin((x - x0) / EIXO_BASE * Math.PI * 1.65) * 15 * esc; };
          const raioSoma = function (ang) {
            const m = A.somaOutline.length, f = (((ang % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI)) / (2 * Math.PI) * m;
            const i0 = Math.floor(f) % m, i1 = (i0 + 1) % m, fr = f - Math.floor(f);
            return A.somaOutline[i0].r * (1 - fr) + A.somaOutline[i1].r * fr;
          };
          const extras = [];
          for (let i = 0; i < n; i++) {
            const q = i - meio;
            const th = q * 0.22, rs = raioSoma(th) - 6 * esc;
            const sx = somaX + Math.cos(th) * rs, sy = somaY + Math.sin(th) * rs;
            const fy = somaY + q * sp, yE = somaY + q * dyE;
            // os terminais deste axônio: no principal, os que já existem; nos outros, um conjunto novo
            let ramos, boutons, raiz;
            if (i === iMain) { ramos = A.terminalBranches; boutons = A.terminalBoutons; raiz = A.axonPath[A.axonPath.length - 1]; }
            else { const B = montarAnatomia((opc.semente + 104729 * (i + 1)) >>> 0); ramos = B.terminalBranches; boutons = B.terminalBoutons; raiz = B.axonPath[B.axonPath.length - 1]; }
            const rx = raiz.x, ry = raiz.y;
            let ext = 0;
            ramos.forEach(function (br) { br.pts.forEach(function (p) { ext = Math.max(ext, p.x - rx); }); });
            boutons.forEach(function (bt) { ext = Math.max(ext, bt.x - rx + (bt.bWidth || 0)); });
            const xE = xBorda - ext - 6 - (i % 2 ? opc.degrau / k : 0);
            const len = xE - sx, rel = len / EIXO_BASE, steps = Math.max(24, Math.round(72 * rel));
            const axonPath = [];
            for (let s2 = 0; s2 <= steps; s2++) {
              const t = s2 / steps, x = sx + t * len;
              const y = sy + (fy - sy) * sm((x - sx) / (xFeixe - sx)) + (yE - fy) * sm((x - xAbre) / (xE - xAbre)) + onda(x) - onda(sx);
              axonPath.push({ x, y, t, w: (7.8 - Math.min(1, (x - sx) / EIXO_BASE) * 0.8) * esc });
            }
            const bn = bainhasNos(axonPath, rel, steps, esc, (i % 3) - 1, 120 * esc);
            const fim = axonPath[axonPath.length - 1], dx = fim.x - rx, dy = fim.y - ry, feitos = new Set();
            ramos.forEach(function (br) { if (!feitos.has(br.pts)) { feitos.add(br.pts); br.pts.forEach(function (p) { p.x += dx; p.y += dy; }); } });
            boutons.forEach(function (bt) {
              if (!feitos.has(bt.branchPts)) { feitos.add(bt.branchPts); bt.branchPts.forEach(function (p) { p.x += dx; p.y += dy; }); }
              bt.x += dx; bt.y += dy;
            });
            const E = { axonPath: axonPath, myelinSheaths: bn.myelinSheaths, ranvierNodes: bn.ranvierNodes, axonEscala: 1 / rel, terminalBranches: ramos, terminalBoutons: boutons, scale: esc, indice: i };
            if (i === iMain) {
              A.axonPath = E.axonPath; A.myelinSheaths = E.myelinSheaths; A.ranvierNodes = E.ranvierNodes; A.axonEscala = E.axonEscala;
              A.terminalBranches = ramos; A.terminalBoutons = boutons;
            } else extras.push(E);
          }
          A.extras = extras;
        }

// Esfera de vidro: o menor círculo que contém o neurônio inteiro (soma, dendritos, axônio e terminais). Os pontos mais distantes,
        // em geral as pontas dos terminais do axônio, encostam na parede. Aproximação de Bădoiu-Clarkson (sem dependência).
        function pontasTerminais(A) {
          return A.terminalBoutons.map(function (b) { return { x: b.x + Math.cos(b.tipAngle) * (b.bThick || 0) * 0.6, y: b.y + Math.sin(b.tipAngle) * (b.bThick || 0) * 0.6 }; });
        }

function calcularVista() {
          if (opc.modo === 'ligacoes') {          // as ligações vivem no espaço do palco (1 unidade = 1 px do canvas)
            const X = opc.vistaExt;           // no foco de uma esfera, a cena inteira entra na vista dela (escala e deslocamento)
            vista.k = X ? X.k : 1; vista.tx = X ? X.tx : 0; vista.ty = X ? X.ty : 0; vista.cx = runtime.width / 2; vista.cy = runtime.height / 2;
            vista.Rpx = Math.max(runtime.width, runtime.height); vista.Rd = vista.Rpx; vista.RdTodos = vista.Rd; vista.recorte2D = null; vista.terminais = 0; vista.toques = 0;
            return;
          }
          const term = (opc.saida || opc.semEixo) ? [] : pontasTerminais(Est.anatomy);
          const pts = term.slice();
          Est.anatomy.dendriteTips.forEach(function (d) { pts.push({ x: d.tipX, y: d.tipY }); });
          Est.anatomy.somaOutline.forEach(function (p) { pts.push({ x: p.x, y: p.y }); });
          Est.minis.forEach(function (m) { m.pontos.forEach(function (p) { pts.push(p); }); });
          // o centro da esfera é o corpo celular (soma); o raio vai até a ponta mais distante
          const cx = Est.anatomy.somaX, cy = Est.anatomy.somaY;
          let Rd = 0;
          pts.forEach(function (p) { Rd = Math.max(Rd, Math.hypot(p.x - cx, p.y - cy)); });
          Rd = Est.minis.length ? Rd * 1.03 : Rd + 3;
          const Rpx = Math.max(10, Math.min(runtime.width, runtime.height) / 2 - (opc.margem || 3));
          vista.RdTodos = Rd;
          Rd = Math.min(Rd, opc.raioMax);
          vista.k = Rpx / Rd;
          vista.recorte2D = null;
          vista.cx = opc.saida ? Rpx + 3 : runtime.width / 2; vista.cy = runtime.height / 2; vista.Rpx = Rpx; vista.Rd = Rd;
          vista.tx = vista.cx - cx * vista.k; vista.ty = vista.cy - cy * vista.k;
          vista.terminais = term.length;
          vista.toques = term.filter(function (p) { return Math.hypot(p.x - cx, p.y - cy) > Rd * 0.93; }).length;
        }

    return { axonStartFim: axonStartFim, montarAnatomia: montarAnatomia, montarAxonio: montarAxonio, arvoreDe: arvoreDe, anatomiaLigacoes: anatomiaLigacoes, montarLigacao: montarLigacao, raizDaArvore: raizDaArvore, caixaDe: caixaDe, estenderTronco: estenderTronco, bainhasNos: bainhasNos, montarFeixe: montarFeixe, pontasTerminais: pontasTerminais, calcularVista: calcularVista };
  }

  return { criar: criar };
}
