/* Sexta-Feira Engine v0.4.2: neuronio/corpo. o desenho parado do corpo da célula: halo atmosférico, soma com parede 3D e núcleo texturizado (seções 1, 3 e 4 do desenho aprovado). Recebe a tinta T.
 * Código movido sem reescrever de neuronio/celula: o estado vem de Est (a tabela dos campos está no LEIA-ME.md da juntadora e deste) e as funções
 * das irmãs chegam em d, passadas pela juntadora. Só desenha/calcula o que está na lista da porta. */
function (usa) {
  'use strict';

  function criar(Est, d) {
    var trilhaSuave = usa.ramos.trilhaSuave;
    var createSeededRandom = usa.sorteio.criar;

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

    return { pintarHalo: pintarHalo, pintarSoma: pintarSoma, pintarNucleo: pintarNucleo };
  }

  return { criar: criar };
}
