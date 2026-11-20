/* Sexta-Feira Engine v0.4.2: neuronio/dendritos. o desenho parado dos dendritos afilados e das espinhas sinápticas (seção 2 do desenho aprovado). Recebe a tinta T.
 * Código movido sem reescrever de neuronio/celula: o estado vem de Est (a tabela dos campos está no LEIA-ME.md da juntadora e deste) e as funções
 * das irmãs chegam em d, passadas pela juntadora. Só desenha/calcula o que está na lista da porta. */
function (usa) {
  'use strict';

  function criar(Est, d) {
    var ramos = usa.ramos; var trilhaSuave = ramos.trilhaSuave, bordasRamo = ramos.bordasRamo, desviar = ramos.desviar, mitocondrias = ramos.mitocondrias;
    var createSeededRandom = usa.sorteio.criar;
    var drawSharpDendritePolygon = d.drawSharpDendritePolygon;
    var incomingSignals = Est.incomingSignals;
    var drawUnifiedSmoothPulse = d.drawUnifiedSmoothPulse;

// 2. DENDRITOS AFILADOS E ESPINHAS SINÁPTICAS
        function pintarDendritos(octx, A, T) {
          var r = T.r, g = T.g, b = T.b, lightR = T.lightR, lightG = T.lightG, lightB = T.lightB, deepR = T.deepR, deepG = T.deepG, deepB = T.deepB, dendriteAlpha = T.dendriteAlpha, glowFactor = T.glowFactor, nv = T.nv, q = T.q, u = T.u, corOrg = T.corOrg;
          octx.save();
          A.dendriteBranches.forEach((branch) => {
            const levelMult = branch.level === 1 ? 1.0 : branch.level === 2 ? 0.85 : 0.72;
            const alpha = dendriteAlpha * levelMult;

            octx.fillStyle = `rgba(${r}, ${g}, ${b}, ${Math.min(1, alpha * (0.96 + 0.22 * q))})`;
            drawSharpDendritePolygon(octx, branch.pts);

            if (branch.pts.length > 3) {
              octx.strokeStyle = `rgba(${lightR}, ${lightG}, ${lightB}, ${Math.min(0.95, alpha * (0.70 + 0.42 * glowFactor) * (1 + 0.3 * q))})`;
              octx.lineWidth = Math.max(0.55, (branch.level === 1 ? 1.35 : branch.level === 2 ? 0.8 : 0.55) * A.scale);
              octx.beginPath();
              const endLimit = Math.floor(branch.pts.length * 0.97);
              if (nv >= 1) trilhaSuave(octx, branch.pts.slice(0, endLimit), true);
              else {
                octx.moveTo(branch.pts[0].x, branch.pts[0].y);
                for (let i = 1; i < endLimit; i++) {
                  octx.lineTo(branch.pts[i].x, branch.pts[i].y);
                }
              }
              octx.stroke();
            }
          });
          if (nv >= 1) {                                                      // de perto: as duas bordas da membrana de cada ramo, nítidas
            octx.lineJoin = 'round';
            A.dendriteBranches.forEach(function (branch) {
              if (branch.pts.length < 4) return;
              const bb = bordasRamo(branch.pts);
              octx.strokeStyle = `rgba(${lightR}, ${lightG}, ${lightB}, ${(branch.level === 1 ? 0.62 : 0.5) * (0.75 + 0.25 * q)})`;
              octx.lineWidth = (branch.level === 1 ? 0.95 : 0.75) * u;
              octx.beginPath(); trilhaSuave(octx, bb.L, true); octx.stroke();
              octx.beginPath(); trilhaSuave(octx, bb.R, true); octx.stroke();
            });
          }
          if (nv >= 2) {                                                      // mais perto: microtúbulos e mitocôndrias nos ramos grossos
            const rm = createSeededRandom(((A.semente || 1) + 4049) >>> 0);
            A.dendriteBranches.forEach(function (branch) {
              if (branch.level > 2 || branch.pts.length < 6) return;
              const n = Math.floor(branch.pts.length * (branch.level === 1 ? 0.8 : 0.6));
              octx.strokeStyle = `rgba(${lightR}, ${lightG}, ${lightB}, 0.30)`;
              octx.lineWidth = 0.55 * u;
              [-0.24, 0, 0.24].forEach(function (f) {
                if (branch.level === 2 && f === 0) return;
                octx.beginPath(); trilhaSuave(octx, desviar(branch.pts.slice(0, n), f), true); octx.stroke();
              });
              mitocondrias(octx, branch.pts, branch.level === 1 ? 0.75 : 0.5, rm, corOrg, u);
            });
          }

          octx.strokeStyle = `rgba(${lightR}, ${lightG}, ${lightB}, ${Math.min(0.95, dendriteAlpha * 0.95)})`;
          octx.lineWidth = Math.max(0.55, 0.85 * A.scale);
          octx.beginPath();
          A.synapticSpines.forEach((sp) => {
            octx.moveTo(sp.x1, sp.y1);
            octx.lineTo(sp.x2, sp.y2);
          });
          octx.stroke();

          octx.fillStyle = `rgba(255, 255, 255, ${dendriteAlpha * 0.78})`;
          A.synapticSpines.forEach((sp) => {
            if (sp.hasReceptor) {
              octx.beginPath();
              octx.arc(sp.x2, sp.y2, 0.95 * A.scale, 0, Math.PI * 2);
              octx.fill();
            }
          });
          if (nv >= 1) {                                                      // de perto: a cabeça de cada espinha (onde chega a sinapse)
            A.synapticSpines.forEach(function (sp) {
              const rr = 1.05 + (sp.hasReceptor ? 0.35 : 0);
              octx.fillStyle = `rgba(${lightR}, ${lightG}, ${lightB}, 0.88)`;
              octx.beginPath(); octx.arc(sp.x2, sp.y2, rr, 0, Math.PI * 2); octx.fill();
              octx.fillStyle = 'rgba(255, 255, 255, 0.78)';
              octx.beginPath(); octx.arc(sp.x2 - rr * 0.3, sp.y2 - rr * 0.3, rr * 0.38, 0, Math.PI * 2); octx.fill();
              if (nv >= 3) {                                                  // a densidade pós-sináptica: a borda escura da cabeça
                const ang = Math.atan2(sp.y2 - sp.y1, sp.x2 - sp.x1);
                octx.strokeStyle = `rgba(${deepR}, ${deepG}, ${deepB}, 0.9)`;
                octx.lineWidth = 0.6 * u;
                octx.beginPath(); octx.arc(sp.x2, sp.y2, rr * 0.9, ang - 0.9, ang + 0.9); octx.stroke();
              }
            });
          }
          octx.restore();
        }


// 3. Pulsos de entrada nos dendritos
        function pintarPulsosEntrada(T) {
          var r = T.r, g = T.g, b = T.b, lightR = T.lightR, lightG = T.lightG, lightB = T.lightB, glowFactor = T.glowFactor;
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
        }

    return { pintarDendritos: pintarDendritos, pintarPulsosEntrada: pintarPulsosEntrada };
  }

  return { criar: criar };
}
