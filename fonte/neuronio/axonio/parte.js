/* Sexta-Feira Engine v0.4.2: neuronio/axonio. o desenho parado do axônio: tronco encorpado, bainhas de mielina estriadas e nódulos de Ranvier (seção 5 do desenho aprovado), um por axônio. Recebe a tinta T.
 * Código movido sem reescrever de neuronio/celula: o estado vem de Est (a tabela dos campos está no LEIA-ME.md da juntadora e deste) e as funções
 * das irmãs chegam em d, passadas pela juntadora. Só desenha/calcula o que está na lista da porta. */
function (usa) {
  'use strict';

  function criar(Est, d) {
    var ramos = usa.ramos; var trilhaSuave = ramos.trilhaSuave, bordasRamo = ramos.bordasRamo, desviar = ramos.desviar, mitocondrias = ramos.mitocondrias;
    var createSeededRandom = usa.sorteio.criar;
    var opc = Est.opc;
    var drawTaperedBranch = d.drawTaperedBranch;

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

    return { pintarAxonio: pintarAxonio };
  }

  return { criar: criar };
}
