/* Sexta-Feira Engine: o motor do neurônio (v0.2.0).
 * Vem do neuronio.html do dono (desenho aprovado: soma, dendritos, axônio, terminais), transformado em fábrica: cada canvas tem o seu
 * neurônio, com estado próprio. Só desenha; não lê dado, não usa rede, não mexe em nada fora do canvas que recebe.
 *
 *   var n = Neuronio.criar(canvas, { cor: '#8B3DFF', semente: 94127, leve: false });
 *   n.redimensionar(largura, altura);   // em pixels CSS; refaz o desenho estático
 *   n.passo(segundos); n.desenhar();     // um quadro (a tela chama, a 60 ou 24 por segundo)
 *   n.iniciar(); n.disparar(); n.pausar(true|false); n.setCor('#RRGGBB'); n.setLeve(true|false);
 */
(function () {
  'use strict';

        function createSeededRandom(seed) {
          let s = seed >>> 0;
          return function () {
            s = (s * 1664525 + 1013904223) >>> 0;
            return s / 4294967296;
          };
        }

        function hexToRgb(hex) {
          const clean = hex.replace('#', '');
          const full = clean.length === 3 ? clean.split('').map(c => c + c).join('') : clean;
          const intVal = parseInt(full, 16);
          return [(intVal >> 16) & 255, (intVal >> 8) & 255, intVal & 255];
        }


  function criar(canvas, opcoes) {
    const opc = Object.assign({ cor: '#8B3DFF', semente: 94127, leve: false }, opcoes || {});
    opc.semente = opc.semente >>> 0;
    const ctx = canvas.getContext('2d');

        const config = {
          agente: 'Sexta-Feira',
          corHex: '#8B3DFF',
          rgb: [139, 61, 255],
          brilhoNucleo: 21,
          transparenciaCorpo: 45,
          opacidadeDendritos: 56,
          brilhoGeral: 56,
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
          somaExcitation: 0
        };

        let anatomy = {
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
        };

        const incomingSignals = [];
        const actionPotentials = [];
        const mistClouds = [];
        const releasedNeurotransmitters = [];


        // Polígono afilado até ponta aguda (para dendritos)
        function drawSharpDendritePolygon(targetCtx, points) {
          if (!points || points.length < 2) return;
          const leftSide = [];
          const rightSide = [];

          for (let i = 0; i < points.length; i++) {
            const p = points[i];
            const prev = points[Math.max(0, i - 1)];
            const next = points[Math.min(points.length - 1, i + 1)];
            const dx = next.x - prev.x;
            const dy = next.y - prev.y;
            const len = Math.hypot(dx, dy) || 1;
            const nx = -dy / len;
            const ny = dx / len;
            const halfWidth = p.w * 0.5;

            leftSide.push({ x: p.x + nx * halfWidth, y: p.y + ny * halfWidth });
            rightSide.push({ x: p.x - nx * halfWidth, y: p.y - ny * halfWidth });
          }

          targetCtx.beginPath();
          targetCtx.moveTo(leftSide[0].x, leftSide[0].y);
          for (let i = 1; i < leftSide.length; i++) {
            targetCtx.lineTo(leftSide[i].x, leftSide[i].y);
          }
          const tip = points[points.length - 1];
          targetCtx.lineTo(tip.x, tip.y);

          for (let i = rightSide.length - 1; i >= 0; i--) {
            targetCtx.lineTo(rightSide[i].x, rightSide[i].y);
          }
          targetCtx.closePath();
          targetCtx.fill();
        }

        // Polígono encorpado e contínuo (para telodendros que se fundem aos bulbos terminais)
        function drawTaperedBranch(targetCtx, points) {
          if (!points || points.length < 2) return;
          const left = [];
          const right = [];

          for (let i = 0; i < points.length; i++) {
            const p = points[i];
            const prev = points[Math.max(0, i - 1)];
            const next = points[Math.min(points.length - 1, i + 1)];
            const dx = next.x - prev.x;
            const dy = next.y - prev.y;
            const len = Math.hypot(dx, dy) || 1;
            const nx = -dy / len;
            const ny = dx / len;
            const hw = p.w * 0.5;

            left.push({ x: p.x + nx * hw, y: p.y + ny * hw });
            right.push({ x: p.x - nx * hw, y: p.y - ny * hw });
          }

          targetCtx.beginPath();
          targetCtx.moveTo(left[0].x, left[0].y);
          for (let i = 1; i < left.length; i++) targetCtx.lineTo(left[i].x, left[i].y);
          for (let i = right.length - 1; i >= 0; i--) targetCtx.lineTo(right[i].x, right[i].y);
          targetCtx.closePath();
          targetCtx.fill();
        }

        // Constrói o neurônio completo unindo todas as peças validadas
        function buildCompleteNeuron() {
          const rng = createSeededRandom(opc.semente);
          const somaX = runtime.width * 0.25;
          const somaY = runtime.height * 0.52;
          const scale = Math.max(0.1, Math.min(runtime.width / 1360, runtime.height / 760));

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

          function growDendrite(startX, startY, angle, length, startWidth, level, maxLevel) {
            const segCount = Math.max(12, Math.round(length / (4.3 * scale)));
            const pts = [{ x: startX, y: startY, w: startWidth }];

            let curX = startX;
            let curY = startY;
            let curAng = angle;
            const stepLen = length / segCount;
            const curlFreq = 0.24 + rng() * 0.26;
            const curlAmp = (0.075 + rng() * 0.065) * (rng() > 0.5 ? 1 : -1);

            for (let s = 1; s <= segCount; s++) {
              const progress = s / segCount;
              curAng += Math.sin(s * curlFreq + level) * curlAmp + (rng() - 0.5) * 0.055;
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
                  growDendrite(curX, curY, forkAng, childLen, childW, level + 1, maxLevel);
                }
              }
            }

            dendriteBranches.push({ pts, level });
            dendriteTips.push({ pts, tipX: curX, tipY: curY });
          }

          const maxDepth = branchFactor > 0.65 ? 3 : branchFactor > 0.3 ? 2 : 1;
          primaryAngles.forEach((ang) => {
            const sx = somaX + Math.cos(ang) * (somaRadius * 1.02);
            const sy = somaY + Math.sin(ang) * (somaRadius * 1.02);
            const trunkLen = (148 + rng() * 50) * scale * (0.65 + branchFactor * 0.45);
            const trunkWidth = (7.4 + rng() * 1.8) * scale;
            growDendrite(sx, sy, ang, trunkLen, trunkWidth, 1, maxDepth);
          });

          // 3. AXÔNIO SALTATÓRIO COM BAINHA DE MIELINA & NÓDULOS DE RANVIER
          const axonStartX = somaX + somaRadius * 1.44;
          const axonStartY = somaY;
          const axonEndX = runtime.width * 0.62;
          const axonLen = Math.max(120, axonEndX - axonStartX);

          const axonPath = [];
          const axonSteps = 72;
          for (let i = 0; i <= axonSteps; i++) {
            const t = i / axonSteps;
            const x = axonStartX + t * axonLen;
            const y = axonStartY + Math.sin(t * Math.PI * 1.65) * (15 * scale);
            const w = (7.8 - t * 0.8) * scale;
            axonPath.push({ x, y, t, w });
          }

          const myelinSheaths = [];
          const ranvierNodes = [];
          const numSheaths = 6;
          const gapRatio = 0.028;
          const usableSpan = 0.90;
          const startOffset = 0.04;
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

          // 4. TELODENDROS ENCORPADOS & BULBOS PRÉ-SINÁPTICOS EM SINO CONTÍNUO (Peça aprovada)
          const terminalRoot = axonPath[axonPath.length - 1];
          const terminalBranches = [];
          const terminalBoutons = [];
          const terminalRng = createSeededRandom((opc.semente + 55219 - 94127) >>> 0);
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

          anatomy = {
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
            offscreenCanvas: null
          };

          bakeStaticLayer();
        }

        // Pré-renderiza a estrutura celular estática em offscreen canvas
        function bakeStaticLayer() {
          const off = document.createElement('canvas');
          off.width = Math.max(1, Math.round(runtime.width * runtime.dpr));
          off.height = Math.max(1, Math.round(runtime.height * runtime.dpr));
          const octx = off.getContext('2d');
          octx.scale(runtime.dpr, runtime.dpr);

          const [r, g, b] = config.rgb;
          const lightR = Math.min(255, r + 90);
          const lightG = Math.min(255, g + 90);
          const lightB = Math.min(255, b + 90);
          const deepR = Math.round(r * 0.26);
          const deepG = Math.round(g * 0.26);
          const deepB = Math.round(b * 0.26);

          const bodyAlpha = Math.max(0.10, 1 - (config.transparenciaCorpo / 100) * 0.82);
          const dendriteAlpha = Math.max(0.08, config.opacidadeDendritos / 100);
          const glowFactor = config.brilhoGeral / 100;
          const nucFactor = config.brilhoNucleo / 100;

          // 1. Halo atmosférico suave ao redor do Soma
          if (glowFactor > 0.02) {
            const halo = octx.createRadialGradient(
              anatomy.somaX, anatomy.somaY, anatomy.somaRadius * 0.35,
              anatomy.somaX, anatomy.somaY, anatomy.somaRadius * 3.35
            );
            halo.addColorStop(0, `rgba(${r}, ${g}, ${b}, ${0.28 * glowFactor * bodyAlpha})`);
            halo.addColorStop(0.55, `rgba(${r}, ${g}, ${b}, ${0.09 * glowFactor * bodyAlpha})`);
            halo.addColorStop(1, `rgba(${r}, ${g}, ${b}, 0)`);
            octx.fillStyle = halo;
            octx.beginPath();
            octx.arc(anatomy.somaX, anatomy.somaY, anatomy.somaRadius * 3.35, 0, Math.PI * 2);
            octx.fill();
          }

          // 2. DENDRITOS AFILADOS E ESPINHAS SINÁPTICAS
          octx.save();
          anatomy.dendriteBranches.forEach((branch) => {
            const levelMult = branch.level === 1 ? 1.0 : branch.level === 2 ? 0.85 : 0.72;
            const alpha = dendriteAlpha * levelMult;

            octx.fillStyle = `rgba(${r}, ${g}, ${b}, ${alpha * 0.96})`;
            drawSharpDendritePolygon(octx, branch.pts);

            if (branch.level <= 2 && branch.pts.length > 3) {
              octx.strokeStyle = `rgba(${lightR}, ${lightG}, ${lightB}, ${alpha * (0.36 + 0.26 * glowFactor)})`;
              octx.lineWidth = Math.max(0.5, (branch.level === 1 ? 1.2 : 0.65) * anatomy.scale);
              octx.beginPath();
              octx.moveTo(branch.pts[0].x, branch.pts[0].y);
              const endLimit = Math.floor(branch.pts.length * 0.85);
              for (let i = 1; i < endLimit; i++) {
                octx.lineTo(branch.pts[i].x, branch.pts[i].y);
              }
              octx.stroke();
            }
          });

          octx.strokeStyle = `rgba(${lightR}, ${lightG}, ${lightB}, ${dendriteAlpha * 0.68})`;
          octx.lineWidth = Math.max(0.5, 0.75 * anatomy.scale);
          octx.beginPath();
          anatomy.synapticSpines.forEach((sp) => {
            octx.moveTo(sp.x1, sp.y1);
            octx.lineTo(sp.x2, sp.y2);
          });
          octx.stroke();

          octx.fillStyle = `rgba(255, 255, 255, ${dendriteAlpha * 0.78})`;
          anatomy.synapticSpines.forEach((sp) => {
            if (sp.hasReceptor) {
              octx.beginPath();
              octx.arc(sp.x2, sp.y2, 0.95 * anatomy.scale, 0, Math.PI * 2);
              octx.fill();
            }
          });
          octx.restore();

          // 3. SOMA COM PAREDE CELULAR 3D
          octx.save();
          octx.beginPath();
          anatomy.somaOutline.forEach((pt, idx) => {
            if (idx === 0) octx.moveTo(pt.x, pt.y);
            else octx.lineTo(pt.x, pt.y);
          });
          octx.closePath();

          const somaGrad = octx.createRadialGradient(
            anatomy.somaX - anatomy.somaRadius * 0.28,
            anatomy.somaY - anatomy.somaRadius * 0.28,
            anatomy.somaRadius * 0.08,
            anatomy.somaX,
            anatomy.somaY,
            anatomy.somaRadius * 1.5
          );
          somaGrad.addColorStop(0, `rgba(${lightR}, ${lightG}, ${lightB}, ${0.76 * bodyAlpha})`);
          somaGrad.addColorStop(0.50, `rgba(${r}, ${g}, ${b}, ${0.66 * bodyAlpha})`);
          somaGrad.addColorStop(0.85, `rgba(${deepR}, ${deepG}, ${deepB}, ${0.52 * bodyAlpha})`);
          somaGrad.addColorStop(1, `rgba(${lightR}, ${lightG}, ${lightB}, ${0.44 * bodyAlpha})`);

          octx.fillStyle = somaGrad;
          octx.fill();

          octx.save();
          octx.clip();

          anatomy.cytoplasmRidges.forEach((ridge) => {
            octx.beginPath();
            octx.moveTo(ridge.x1, ridge.y1);
            octx.quadraticCurveTo(ridge.cx, ridge.cy, ridge.x2, ridge.y2);
            octx.lineWidth = ridge.width;
            octx.strokeStyle = ridge.isHighlight
              ? `rgba(${lightR}, ${lightG}, ${lightB}, ${0.38 * bodyAlpha})`
              : `rgba(${deepR}, ${deepG}, ${deepB}, ${0.56 * bodyAlpha})`;
            octx.stroke();
          });

          anatomy.membraneGranules.forEach((gr) => {
            octx.fillStyle = `rgba(${deepR}, ${deepG}, ${deepB}, ${0.56 * bodyAlpha})`;
            octx.beginPath();
            octx.arc(gr.x + 0.85 * anatomy.scale, gr.y + 0.95 * anatomy.scale, gr.r, 0, Math.PI * 2);
            octx.fill();

            octx.fillStyle = `rgba(${lightR}, ${lightG}, ${lightB}, ${0.36 * bodyAlpha})`;
            octx.beginPath();
            octx.arc(gr.x - 0.65 * anatomy.scale, gr.y - 0.65 * anatomy.scale, gr.r * 0.72, 0, Math.PI * 2);
            octx.fill();
          });
          octx.restore();

          octx.strokeStyle = `rgba(${lightR}, ${lightG}, ${lightB}, ${Math.min(0.95, bodyAlpha * 0.94)})`;
          octx.lineWidth = Math.max(1.1, 1.65 * anatomy.scale);
          octx.stroke();

          anatomy.membraneSpicules.forEach((sp) => {
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

          // 4. NÚCLEO ESFÉRICO TEXTURIZADO (Calibrado em brilhoNucleo = 21%)
          octx.save();
          const nucR = anatomy.somaRadius * 0.34;
          if (nucFactor > 0.01) {
            const nucHalo = octx.createRadialGradient(
              anatomy.somaX, anatomy.somaY, nucR * 0.25,
              anatomy.somaX, anatomy.somaY, nucR * 2.5
            );
            nucHalo.addColorStop(0, `rgba(255, 255, 255, ${0.80 * nucFactor})`);
            nucHalo.addColorStop(0.45, `rgba(${lightR}, ${lightG}, ${lightB}, ${0.52 * nucFactor})`);
            nucHalo.addColorStop(1, `rgba(${r}, ${g}, ${b}, 0)`);
            octx.fillStyle = nucHalo;
            octx.beginPath();
            octx.arc(anatomy.somaX, anatomy.somaY, nucR * 2.5, 0, Math.PI * 2);
            octx.fill();
          }

          const coreGrad = octx.createRadialGradient(
            anatomy.somaX - nucR * 0.22,
            anatomy.somaY - nucR * 0.22,
            1,
            anatomy.somaX,
            anatomy.somaY,
            nucR
          );
          coreGrad.addColorStop(0, `rgba(248, 244, 255, ${0.44 + 0.56 * nucFactor})`);
          coreGrad.addColorStop(0.72, `rgba(${lightR}, ${lightG}, ${lightB}, ${0.46 + 0.48 * nucFactor})`);
          coreGrad.addColorStop(1, `rgba(${r}, ${g}, ${b}, ${0.65 * bodyAlpha})`);

          octx.fillStyle = coreGrad;
          octx.beginPath();
          octx.arc(anatomy.somaX, anatomy.somaY, nucR, 0, Math.PI * 2);
          octx.fill();

          octx.save();
          octx.clip();
          anatomy.nucleusChromatin.forEach((ch) => {
            octx.fillStyle = ch.bright
              ? `rgba(255, 255, 255, ${0.18 + 0.26 * nucFactor})`
              : `rgba(${deepR}, ${deepG}, ${deepB}, 0.28)`;
            octx.beginPath();
            octx.arc(ch.x, ch.y, ch.r, 0, Math.PI * 2);
            octx.fill();
          });
          octx.restore();

          octx.strokeStyle = `rgba(255, 255, 255, ${0.30 + 0.45 * nucFactor})`;
          octx.lineWidth = Math.max(0.85, 1.15 * anatomy.scale);
          octx.stroke();
          octx.restore();

          // 5. AXÔNIO ENCORPADO & 6 SEGMENTOS ESTRIADOS DE BAINHA DE MIELINA
          octx.save();
          octx.fillStyle = `rgba(${r}, ${g}, ${b}, ${dendriteAlpha * 0.92})`;
          drawTaperedBranch(octx, anatomy.axonPath);

          octx.strokeStyle = `rgba(${lightR}, ${lightG}, ${lightB}, ${Math.max(0.30, bodyAlpha * 0.72)})`;
          octx.lineWidth = Math.max(1.1, 1.4 * anatomy.scale);
          octx.beginPath();
          anatomy.axonPath.forEach((p, idx) => {
            if (idx === 0) octx.moveTo(p.x, p.y);
            else octx.lineTo(p.x, p.y);
          });
          octx.stroke();

          anatomy.myelinSheaths.forEach((seg, mIdx) => {
            octx.save();
            octx.translate(seg.pMid.x, seg.pMid.y);
            octx.rotate(seg.angle);

            const w = seg.length;
            const h = seg.thickness;
            const rad = h * 0.45;

            const mGrad = octx.createLinearGradient(0, -h / 2, 0, h / 2);
            mGrad.addColorStop(0, `rgba(${lightR}, ${lightG}, ${lightB}, ${0.46 * bodyAlpha})`);
            mGrad.addColorStop(0.5, `rgba(${deepR}, ${deepG}, ${deepB}, ${0.24 * bodyAlpha})`);
            mGrad.addColorStop(1, `rgba(${lightR}, ${lightG}, ${lightB}, ${0.44 * bodyAlpha})`);

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
            octx.strokeStyle = `rgba(${lightR}, ${lightG}, ${lightB}, ${0.26 * bodyAlpha})`;
            octx.lineWidth = 0.85 * anatomy.scale;
            octx.beginPath();
            octx.moveTo(-w * 0.42, -h * 0.16 + (mIdx % 2) * 1.5);
            octx.quadraticCurveTo(0, h * 0.24, w * 0.42, -h * 0.14);
            octx.stroke();
            octx.restore();

            octx.strokeStyle = `rgba(${lightR}, ${lightG}, ${lightB}, ${0.68 * bodyAlpha})`;
            octx.lineWidth = Math.max(0.95, 1.3 * anatomy.scale);
            octx.stroke();
            octx.restore();
          });
          octx.restore();

          // 6. RAMOS DOS TELODENDROS UNIFORMES (Padrão aprovado)
          octx.save();
          anatomy.terminalBranches.forEach((br) => {
            const mult = br.depth === 1 ? 1.0 : 0.84;
            octx.fillStyle = `rgba(${r}, ${g}, ${b}, ${dendriteAlpha * 0.94 * mult})`;
            drawTaperedBranch(octx, br.pts);

            octx.strokeStyle = `rgba(${lightR}, ${lightG}, ${lightB}, ${dendriteAlpha * 0.48 * mult})`;
            octx.lineWidth = Math.max(0.7, (br.depth === 1 ? 1.15 : 0.8) * anatomy.scale);
            octx.beginPath();
            br.pts.forEach((p, idx) => {
              if (idx === 0) octx.moveTo(p.x, p.y);
              else octx.lineTo(p.x, p.y);
            });
            octx.stroke();
          });
          octx.restore();

          anatomy.offscreenCanvas = off;
        }

        // Dispara sinal receptivo ao longo de um dendrito até o soma
        function spawnDendriteSignal() {
          if (!anatomy.dendriteTips.length) return;
          const idx = Math.floor(Math.random() * anatomy.dendriteTips.length);
          const branch = anatomy.dendriteTips[idx];
          incomingSignals.push({
            pts: branch.pts,
            progress: 1.0,
            speed: 0.56 + Math.random() * 0.34
          });
        }

        // Dispara potencial de ação pelo axônio saltatório até os bulbos sinápticos
        function triggerActionPotential() {
          runtime.somaExcitation = 1.0;
          const chosenBoutons = anatomy.terminalBoutons.filter((_, idx) => Math.random() < 0.65 || idx % 2 === 0);
          actionPotentials.push({
            t: 0,
            visitedNodes: new Set(),
            boutons: chosenBoutons.length ? chosenBoutons : anatomy.terminalBoutons,
            released: false
          });
        }

        // Exocitose biológica nos bulbos terminais unificados
        function emitSynapticRelease(bouton) {
          bouton.flash = 1.0;

          let fusedCount = 0;
          bouton.vesicles.forEach((v) => {
            if (v.docked && v.fusionProgress <= 0 && fusedCount < 2) {
              v.fusionProgress = 0.01;
              bouton.pocketExcite[v.pocketIndex] = 1.0;
              fusedCount++;
            }
          });

          if (config.enableMist) {
            const dist = (8 + Math.random() * 5) * anatomy.scale;
            mistClouds.push({
              x: bouton.x + Math.cos(bouton.tipAngle) * dist,
              y: bouton.y + Math.sin(bouton.tipAngle) * dist,
              vx: Math.cos(bouton.tipAngle) * (2.8 + Math.random() * 3.0) * anatomy.scale,
              vy: Math.sin(bouton.tipAngle) * (2.8 + Math.random() * 3.0) * anatomy.scale,
              radius: (6.5 + Math.random() * 4.5) * anatomy.scale,
              growRate: (6.5 + Math.random() * 4.0) * anatomy.scale,
              life: 1.0
            });
          }

          const cosA = Math.cos(bouton.tipAngle);
          const sinA = Math.sin(bouton.tipAngle);
          const perpX = -sinA;
          const perpY = cosA;
          const cleftSpan = bouton.bThick * 1.45;
          const pocketOffsets = [-0.26, 0, 0.26];

          for (let k = 0; k < 10; k++) {
            const pIdx = k % 3;
            const pocketY = pocketOffsets[pIdx] * bouton.bWidth + ((Math.random() - 0.5) * 2.0 * anatomy.scale);
            const startX = bouton.x + cosA * (bouton.bThick * 0.50) + perpX * pocketY;
            const startY = bouton.y + sinA * (bouton.bThick * 0.50) + perpY * pocketY;
            const targetX = startX + cosA * cleftSpan + perpX * ((Math.random() - 0.5) * 4.2 * anatomy.scale);
            const targetY = startY + sinA * cleftSpan + perpY * ((Math.random() - 0.5) * 4.2 * anatomy.scale);

            releasedNeurotransmitters.push({
              startX,
              startY,
              targetX,
              targetY,
              x: startX,
              y: startY,
              progress: -Math.random() * 0.22,
              speed: 1.50 + Math.random() * 0.60,
              jitter: 5.5 * anatomy.scale,
              size: (1.25 + Math.random() * 0.55) * anatomy.scale,
              isCentralBeam: k === 3 || k === 6
            });
          }
        }

        // Atualiza física da rede neural completa
        function stepSimulation(dt) {
          runtime.time += dt;
          const speedFactor = 0.35 + (config.velocidadePulsos / 100) * 1.45;
          const freqFactor = config.frequenciaDisparos / 100;

          if (freqFactor > 0.01) {
            const interval = Math.max(0.22, 1.85 - freqFactor * 1.50);
            runtime.spawnAccumulator += dt;
            if (runtime.spawnAccumulator >= interval) {
              runtime.spawnAccumulator = 0;
              spawnDendriteSignal();
              if (Math.random() < 0.45 + freqFactor * 0.45) {
                triggerActionPotential();
              }
            }
          }

          runtime.somaExcitation = Math.max(0, runtime.somaExcitation - dt * 1.4);

          // 1. Sinais nos dendritos (de fora para dentro até o soma)
          for (let i = incomingSignals.length - 1; i >= 0; i--) {
            const sig = incomingSignals[i];
            sig.progress -= sig.speed * speedFactor * dt * 1.25;
            if (sig.progress <= 0) {
              incomingSignals.splice(i, 1);
              runtime.somaExcitation = Math.min(1.0, runtime.somaExcitation + 0.35);
              if (Math.random() < 0.35) {
                triggerActionPotential();
              }
            }
          }

          // 2. Ciclo de vesículas e bolsas nos bulbos terminais
          anatomy.terminalBoutons.forEach((b) => {
            b.flash = Math.max(0, b.flash - dt * 1.9);
            for (let pi = 0; pi < 3; pi++) {
              b.pocketExcite[pi] = Math.max(0, b.pocketExcite[pi] - dt * 1.8);
            }
            b.vesicles.forEach((v) => {
              if (v.fusionProgress > 0) {
                v.fusionProgress += dt * 1.45;
                if (v.fusionProgress >= 1.0) {
                  v.fusionProgress = 0;
                  v.localX = v.homeX - b.bThick * 0.14;
                }
              } else {
                v.localX += (v.homeX - v.localX) * dt * 1.8 + v.vx * dt * 0.35;
                v.localY += (v.homeY - v.localY) * dt * 1.8 + v.vy * dt * 0.35;
                const maxX = b.bThick * 0.36;
                const minX = -b.bThick * 0.28;
                const maxY = b.bWidth * 0.32;
                if (v.localX > maxX || v.localX < minX) v.vx *= -1;
                if (Math.abs(v.localY) > maxY) v.vy *= -1;
              }
            });
          });

          // 3. Potenciais de ação ao longo do axônio -> telodendros -> bulbos terminais
          for (let i = actionPotentials.length - 1; i >= 0; i--) {
            const ap = actionPotentials[i];
            ap.t += speedFactor * dt * 0.85;

            anatomy.ranvierNodes.forEach((node, idx) => {
              if (!ap.visitedNodes.has(idx) && Math.abs(ap.t - node.t) < 0.045) {
                ap.visitedNodes.add(idx);
                node.flash = 1.0;
              }
            });

            if (ap.t >= 1.35) {
              ap.boutons.forEach((bouton) => emitSynapticRelease(bouton));
              actionPotentials.splice(i, 1);
            }
          }

          anatomy.ranvierNodes.forEach((n) => {
            n.flash = Math.max(0, n.flash - dt * 2.8);
          });

          // 4. Névoa de dispersão translúcida
          for (let i = mistClouds.length - 1; i >= 0; i--) {
            const m = mistClouds[i];
            m.x += m.vx * dt;
            m.y += m.vy * dt;
            m.radius += m.growRate * dt;
            m.life -= dt * 1.45;
            if (m.life <= 0) mistClouds.splice(i, 1);
          }

          // 5. Neurotransmissores na fenda sináptica
          for (let i = releasedNeurotransmitters.length - 1; i >= 0; i--) {
            const nt = releasedNeurotransmitters[i];
            nt.progress += nt.speed * dt;
            if (nt.progress < 0) continue;

            const clamped = Math.min(1, nt.progress);
            const jx = (Math.random() - 0.5) * nt.jitter * dt;
            const jy = (Math.random() - 0.5) * nt.jitter * dt;
            nt.x = nt.startX + (nt.targetX - nt.startX) * clamped + jx;
            nt.y = nt.startY + (nt.targetY - nt.startY) * clamped + jy;

            if (nt.progress >= 1.0) {
              releasedNeurotransmitters.splice(i, 1);
            }
          }
        }

        // Renderizador unificado de pulso luminoso suave
        function drawUnifiedSmoothPulse(x, y, radius, lightR, lightG, lightB, r, g, b, glowFactor, alphaScale) {
          const a = alphaScale !== undefined ? alphaScale : 1;
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

          ctx.save();
          ctx.scale(runtime.dpr, runtime.dpr);

          // Fundo preto absoluto (#000000)
          ctx.fillStyle = '#000000';
          ctx.fillRect(0, 0, runtime.width, runtime.height);

          // Camada anatômica estática pré-renderizada
          if (anatomy.offscreenCanvas) {
            ctx.drawImage(anatomy.offscreenCanvas, 0, 0, runtime.width, runtime.height);
          }

          const [r, g, b] = config.rgb;
          const lightR = Math.min(255, r + 95);
          const lightG = Math.min(255, g + 95);
          const lightB = Math.min(255, b + 95);
          const deepR = Math.round(r * 0.28);
          const deepG = Math.round(g * 0.28);
          const deepB = Math.round(b * 0.28);
          const glowFactor = Math.max(0.15, config.brilhoGeral / 100);
          const dendriteAlpha = Math.max(0.08, config.opacidadeDendritos / 100);

          // 1. Névoa de Dispersão translúcida
          if (config.enableMist) {
            mistClouds.forEach((m) => {
              const mGrad = ctx.createRadialGradient(m.x, m.y, 1, m.x, m.y, m.radius);
              mGrad.addColorStop(0, `rgba(${lightR}, ${lightG}, ${lightB}, ${0.24 * m.life})`);
              mGrad.addColorStop(0.55, `rgba(${r}, ${g}, ${b}, ${0.12 * m.life})`);
              mGrad.addColorStop(1, `rgba(${r}, ${g}, ${b}, 0)`);
              ctx.fillStyle = mGrad;
              ctx.beginPath();
              ctx.arc(m.x, m.y, m.radius, 0, Math.PI * 2);
              ctx.fill();
            });
          }

          ctx.globalCompositeOperation = 'lighter';

          // 2. Excitação dinâmica suave no Soma
          if (runtime.somaExcitation > 0.02) {
            const exRad = anatomy.somaRadius * (1.25 + runtime.somaExcitation * 0.45);
            const exGrad = ctx.createRadialGradient(
              anatomy.somaX, anatomy.somaY, anatomy.somaRadius * 0.2,
              anatomy.somaX, anatomy.somaY, exRad
            );
            exGrad.addColorStop(0, `rgba(${lightR}, ${lightG}, ${lightB}, ${0.34 * runtime.somaExcitation * glowFactor})`);
            exGrad.addColorStop(1, `rgba(${r}, ${g}, ${b}, 0)`);
            ctx.fillStyle = exGrad;
            ctx.beginPath();
            ctx.arc(anatomy.somaX, anatomy.somaY, exRad, 0, Math.PI * 2);
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

            drawUnifiedSmoothPulse(x, y, 6.5 * anatomy.scale, lightR, lightG, lightB, r, g, b, glowFactor, 1);
          });

          // 4. Nódulos de Ranvier
          anatomy.ranvierNodes.forEach((node) => {
            if (node.flash > 0.02) {
              const nRad = 7.2 * anatomy.scale * (0.7 + node.flash * 0.45);
              drawUnifiedSmoothPulse(node.x, node.y, nRad, lightR, lightG, lightB, r, g, b, glowFactor, node.flash * 0.85);
            }
          });

          // 5. Potenciais de ação percorrendo o axônio e entrando nos telodendros até os bulbos
          actionPotentials.forEach((ap) => {
            if (ap.t <= 1.0 && anatomy.axonPath.length > 1) {
              const headPos = ap.t * (anatomy.axonPath.length - 1);
              const trailSteps = 10;

              for (let s = trailSteps; s >= 0; s--) {
                const sampleIdx = headPos - s * 1.1;
                if (sampleIdx < 0) continue;
                const i0 = Math.floor(sampleIdx);
                const i1 = Math.min(anatomy.axonPath.length - 1, i0 + 1);
                const frac = sampleIdx - i0;
                const x = anatomy.axonPath[i0].x + (anatomy.axonPath[i1].x - anatomy.axonPath[i0].x) * frac;
                const y = anatomy.axonPath[i0].y + (anatomy.axonPath[i1].y - anatomy.axonPath[i0].y) * frac;

                const ratio = 1 - s / (trailSteps + 1);
                const rad = (2.8 + ratio * 3.7) * anatomy.scale;
                drawUnifiedSmoothPulse(x, y, rad, lightR, lightG, lightB, r, g, b, glowFactor, ratio * 0.85);
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
                  const tRad = (2.5 + ratio * 3.6) * anatomy.scale;
                  drawUnifiedSmoothPulse(x, y, tRad, lightR, lightG, lightB, r, g, b, glowFactor, ratio * 0.88);
                }
              });
            }
          });

          ctx.globalCompositeOperation = 'source-over';

          // 6. Bulbos Pré-Sinápticos Unificados em Sino Contínuo + Vesículas + Bolsas de Exocitose
          anatomy.terminalBoutons.forEach((bouton) => {
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

            bouton.grooves.forEach((gr, idx) => {
              const gy = gr.yNorm * bh;
              ctx.strokeStyle = idx % 2 === 0
                ? `rgba(${lightR}, ${lightG}, ${lightB}, 0.22)`
                : `rgba(${deepR}, ${deepG}, ${deepB}, 0.48)`;
              ctx.lineWidth = 0.9 * anatomy.scale;
              ctx.beginPath();
              ctx.moveTo(-bw * 0.75, gy * 0.25);
              ctx.quadraticCurveTo(0, gy * (0.95 + gr.curve), bw * 0.52, gy * 0.85);
              ctx.stroke();
            });

            const energyGrad = ctx.createLinearGradient(-bw * 0.85, 0, bw * 0.52, 0);
            energyGrad.addColorStop(0, `rgba(${lightR}, ${lightG}, ${lightB}, ${0.55 + bouton.flash * 0.40})`);
            energyGrad.addColorStop(1, `rgba(${lightR}, ${lightG}, ${lightB}, ${0.35 + bouton.flash * 0.55})`);
            ctx.strokeStyle = energyGrad;
            ctx.lineWidth = (1.4 + bouton.flash * 1.0) * anatomy.scale;
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
                ctx.lineWidth = 0.75 * anatomy.scale;
                ctx.stroke();

                const dotR = drawR * 0.26;
                ctx.fillStyle = `rgba(${lightR}, ${lightG}, ${lightB}, ${vAlpha})`;
                for (let d = 0; d < 4; d++) {
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
            const pocketRad = 2.2 * anatomy.scale;
            pocketYList.forEach((py, pi) => {
              const pGlow = bouton.pocketExcite[pi] || 0;
              ctx.fillStyle = '#000000';
              ctx.beginPath();
              ctx.arc(bw * 0.54, py, pocketRad, Math.PI * 0.5, Math.PI * 1.5);
              ctx.fill();

              ctx.strokeStyle = `rgba(${lightR}, ${lightG}, ${lightB}, ${0.58 + pGlow * 0.42})`;
              ctx.lineWidth = (0.95 + pGlow * 0.55) * anatomy.scale;
              ctx.beginPath();
              ctx.arc(bw * 0.54, py, pocketRad, Math.PI * 0.52, Math.PI * 1.48);
              ctx.stroke();
            });

            ctx.restore();

            // Contorno apenas nas paredes externas do sino (sem linha fechando o pescoço)
            ctx.strokeStyle = `rgba(${lightR}, ${lightG}, ${lightB}, 0.54)`;
            ctx.lineWidth = 1.0 * anatomy.scale;
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
            if (nt.progress < 0) return;

            if (nt.isCentralBeam) {
              ctx.strokeStyle = `rgba(${lightR}, ${lightG}, ${lightB}, 0.28)`;
              ctx.lineWidth = 0.85 * anatomy.scale;
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
      runtime.dpr = opc.leve ? 1 : Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(runtime.width * runtime.dpr);
      canvas.height = Math.round(runtime.height * runtime.dpr);
      buildCompleteNeuron();
      drawFrame();
    }

    aplicarCor(opc.cor);
    aplicarLeve(opc.leve);
    runtime.showLabels = false;

    return {
      redimensionar: redimensionar,
      passo: function (dt) { if (!runtime.paused) stepSimulation(Math.min(0.05, Math.max(0.001, dt))); },
      desenhar: drawFrame,
      iniciar: function () { for (let i = 0; i < 6; i++) spawnDendriteSignal(); triggerActionPotential(); },
      disparar: triggerActionPotential,
      pausar: function (p) { runtime.paused = !!p; },
      setCor: function (hex) { aplicarCor(hex); buildCompleteNeuron(); drawFrame(); },
      setLeve: function (ligado) { aplicarLeve(ligado); redimensionar(runtime.width, runtime.height); }
    };
  }

  window.Neuronio = { criar: criar };
})();
