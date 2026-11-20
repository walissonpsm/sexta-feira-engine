/* Sexta-Feira Engine v0.4.2: neuronio/terminais. o desenho parado dos terminais: ramos dos telodendros uniformes (seção 6 do desenho aprovado, um por axônio) e os botões fixos dos neurônios menores. Recebe a tinta T.
 * Código movido sem reescrever de neuronio/celula: o estado vem de Est (a tabela dos campos está no LEIA-ME.md da juntadora e deste) e as funções
 * das irmãs chegam em d, passadas pela juntadora. Só desenha/calcula o que está na lista da porta. */
function (usa) {
  'use strict';

  function criar(Est, d) {
    var ramos = usa.ramos; var trilhaSuave = ramos.trilhaSuave, bordasRamo = ramos.bordasRamo, desviar = ramos.desviar, mitocondrias = ramos.mitocondrias;
    var createSeededRandom = usa.sorteio.criar;
    var config = Est.config;
    var nivel = d.nivel, drawTaperedBranch = d.drawTaperedBranch;
    var ctx = Est.ctx, lupa = Est.lupa, mistClouds = Est.mistClouds, releasedNeurotransmitters = Est.releasedNeurotransmitters, runtime = Est.runtime;

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


// 1. Névoa de Dispersão translúcida
        function pintarNevoa(T) {
          var zcL = T.zcL, r = T.r, g = T.g, b = T.b, lightR = T.lightR, lightG = T.lightG, lightB = T.lightB, deepR = T.deepR, deepG = T.deepG, deepB = T.deepB;
          var usaCor = function (c) { T.usaCor(c); r = T.r; g = T.g; b = T.b; lightR = T.lightR; lightG = T.lightG; lightB = T.lightB; deepR = T.deepR; deepG = T.deepG; deepB = T.deepB; };
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
        }

// 6. Bulbos Pré-Sinápticos Unificados em Sino Contínuo + Vesículas + Bolsas de Exocitose
        function pintarBulbos(T) {
          var r = T.r, g = T.g, b = T.b, lightR = T.lightR, lightG = T.lightG, lightB = T.lightB, deepR = T.deepR, deepG = T.deepG, deepB = T.deepB, dendriteAlpha = T.dendriteAlpha;
          var usaCor = function (c) { T.usaCor(c); r = T.r; g = T.g; b = T.b; lightR = T.lightR; lightG = T.lightG; lightB = T.lightB; deepR = T.deepR; deepG = T.deepG; deepB = T.deepB; };
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
        }

// 7. Neurotransmissores esféricos liberados na fenda sináptica
        function pintarNeurotransmissores(T) {
          var r = T.r, g = T.g, b = T.b, lightR = T.lightR, lightG = T.lightG, lightB = T.lightB, deepR = T.deepR, deepG = T.deepG, deepB = T.deepB;
          var usaCor = function (c) { T.usaCor(c); r = T.r; g = T.g; b = T.b; lightR = T.lightR; lightG = T.lightG; lightB = T.lightB; deepR = T.deepR; deepG = T.deepG; deepB = T.deepB; };
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
        }

    return { pintarTerminais: pintarTerminais, pintarBotoesFixos: pintarBotoesFixos, pintarNevoa: pintarNevoa, pintarBulbos: pintarBulbos, pintarNeurotransmissores: pintarNeurotransmissores };
  }

  return { criar: criar };
}
