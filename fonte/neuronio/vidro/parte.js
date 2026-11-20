/* Sexta-Feira Engine v0.4.2: neuronio/vidro. o vidro da esfera, com profundidade: as duas camadas pré-renderizadas (fundo e frente), a paralaxe do ponteiro, e como o vidro e a parte fixa entram na vista atual (com a lupa).
 * Código movido sem reescrever de neuronio/celula: o estado vem de Est (a tabela dos campos está no LEIA-ME.md da juntadora e deste) e as funções
 * das irmãs chegam em d, passadas pela juntadora. Só desenha/calcula o que está na lista da porta. */
function (usa) {
  'use strict';

  function criar(Est, d) {
    var createSeededRandom = usa.sorteio.criar;
    var VISTA_1 = Est.VISTA_1, canvas = Est.canvas, ctx = Est.ctx, lupa = Est.lupa, opc = Est.opc, par = Est.par, runtime = Est.runtime, vista = Est.vista;
    var zcDe = d.zcDe, novoBitmap = d.novoBitmap;

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

function moverParalaxe() {
          if (opc.leve) { par.x = 0; par.y = 0; return; }
          const t = usa.base.agora() / 1000;
          const ax = par.tx + Math.sin(t * 0.31) * 0.40, ay = par.ty + Math.cos(t * 0.23) * 0.30;   // o vidro respira mesmo parado
          par.x += (ax - par.x) * 0.07;
          par.y += (ay - par.y) * 0.07;
        }

    return { construirVidro: construirVidro, mesmaVista: mesmaVista, vidroDaVista: vidroDaVista, vidroNaVista: vidroNaVista, estaticoNaVista: estaticoNaVista, moverParalaxe: moverParalaxe };
  }

  return { criar: criar };
}
