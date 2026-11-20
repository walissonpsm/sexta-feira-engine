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

    return { pintarTerminais: pintarTerminais, pintarBotoesFixos: pintarBotoesFixos };
  }

  return { criar: criar };
}
