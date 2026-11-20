/* Sexta-Feira Engine v0.4.2: neuronio/camada. a camada fixa (pré-desenhada): a ordem das camadas (principal e menores), pintar uma camada com luz, névoa e sombra, o assado em fatias com orçamento de tempo, o lustre do soma, iluminar, reduzir e compor.
 * Código movido sem reescrever de neuronio/celula: o estado vem de Est (a tabela dos campos está no LEIA-ME.md da juntadora e deste) e as funções
 * das irmãs chegam em d, passadas pela juntadora. Só desenha/calcula o que está na lista da porta. */
function (usa) {
  'use strict';

  function criar(Est, d) {
    var VISTA_1 = Est.VISTA_1, lupa = Est.lupa, opc = Est.opc, runtime = Est.runtime, vista = Est.vista;
    var recortaNaEsfera = d.recortaNaEsfera, montarMascara = d.montarMascara, agora = d.agora, zcDe = d.zcDe, giroCelula = d.giroCelula, novoBitmap = d.novoBitmap, pintarBotoesFixos = d.pintarBotoesFixos, pintarCelula = d.pintarCelula;

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

    return { camadasOrdenadas: camadasOrdenadas, retCamada: retCamada, pintarCamada: pintarCamada, iniciarAssado: iniciarAssado, avancarAssado: avancarAssado, bakeStaticLayer: bakeStaticLayer, lustreSoma: lustreSoma, iluminarCamada: iluminarCamada, reduzido: reduzido, comporCamada: comporCamada };
  }

  return { criar: criar };
}
