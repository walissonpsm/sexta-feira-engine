/* O tronco do axônio: mede a linha (comprimento, normais, caixa), acha pontos e trechos nela e desenha o fio, as bainhas de mielina, os nódulos, o pulso e a ponta
 * (cone ou ventosa, de ligacoes/ponta). Não guarda estado: o axônio (`ax`) é de quem chama (cena/quadro). Juntadora da camada ligacoes. */
function (usa) {
  'use strict';
  var rgba = usa.cores.rgba, clar = usa.cores.clar, esc = usa.cores.esc, suave = usa.curvas.suave, ponta = usa.ponta, pulsoP = usa.pulso;
    function medeEixo(s, ax) {
      var p = ax.base, n = p.length, i, c = ax.cum, nx = ax.nx, ny = ax.ny, x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9;
      c.length = n; nx.length = n; ny.length = n; c[0] = 0;
      for (i = 1; i < n; i++) c[i] = c[i - 1] + Math.hypot(p[i].x - p[i - 1].x, p[i].y - p[i - 1].y);
      for (i = 0; i < n; i++) {
        var a = p[Math.max(0, i - 1)], b = p[Math.min(n - 1, i + 1)], tx = b.x - a.x, ty = b.y - a.y, l = Math.hypot(tx, ty) || 1;
        nx[i] = -ty / l; ny[i] = tx / l;
        if (p[i].x < x0) x0 = p[i].x; if (p[i].x > x1) x1 = p[i].x; if (p[i].y < y0) y0 = p[i].y; if (p[i].y > y1) y1 = p[i].y;
      }
      ax.len = c[n - 1];
      var mg = ax.larg * 1.6 + 8 * s + 8; ax.bb = { x0: x0 - mg, y0: y0 - mg, x1: x1 + mg, y1: y1 + mg };
      while (ax.pts.length < n) ax.pts.push({ x: 0, y: 0 });
      ax.pts.length = n;
      for (i = 0; i < n; i++) { ax.pts[i].x = p[i].x; ax.pts[i].y = p[i].y; }      // o tronco é liso e parado; quem se mexe é a ponta
    }
    function ponto(ax, u) {               // o ponto da linha (com a ondulação) na distância u do começo
      var c = ax.cum, p = ax.pts, n = p.length, lo = 0, hi = n - 1;
      if (u <= 0) return p[0]; if (u >= ax.len) return p[n - 1];
      while (hi - lo > 1) { var mid = (lo + hi) >> 1; if (c[mid] <= u) lo = mid; else hi = mid; }
      var f = (u - c[lo]) / Math.max(1e-9, c[hi] - c[lo]);
      return { x: p[lo].x + (p[hi].x - p[lo].x) * f, y: p[lo].y + (p[hi].y - p[lo].y) * f };
    }
    function caminhoSub(ax, a0, a1, cam) {       // acrescenta a um caminho o trecho da linha entre as distâncias a0 e a1
      if (a1 <= a0) return;
      var c = ax.cum, p = ax.pts, n = p.length, lo = 0, hi = n - 1, q = ponto(ax, a0);
      while (hi - lo > 1) { var mid = (lo + hi) >> 1; if (c[mid] <= a0) lo = mid; else hi = mid; }
      cam.moveTo(q.x, q.y);
      for (var j = lo + 1; j < n - 1 && c[j] < a1; j += ax.pulo) cam.lineTo(p[j].x, p[j].y);
      q = ponto(ax, a1); cam.lineTo(q.x, q.y);
    }
    function trechos(s, ax) {                  // as bainhas: [começo, fim, grupo de espessura] contadas desde o começo do axônio
      var w = ax.larg, Ls = 5.0 * w, gap = 0.5 * w, pitch = Ls + gap, Lm = ax.len - ponta.altVent(s) - 6 * s, out = [], tail = Math.max(1, Lm - 4 * pitch);
      for (var k = 0, a = ax.a0; a < Lm - 0.3 * Ls; k++, a = ax.a0 + k * pitch) {
        var b = Math.min(a + Ls, Lm), f = 0.70 + 0.30 * (1 - suave((a - tail) / (4 * pitch)));
        out.push([a, b, f > 0.93 ? 0 : f > 0.80 ? 1 : 2, k]);
      }
      ax.pitch = pitch; ax.nNos = out.length; return out;
    }
    var QG = [1, 0.86, 0.72];
    function pintaEixo(ctxP, s, relogio, ax) {
      var w = ax.larg, ou = Math.max(0.9, 1.3 * s), cor = ax.corRgb, fim = ax.len - ponta.altVent(s) * 0.5, tr = trechos(s, ax), g, i;
      ctxP.lineCap = 'butt'; ctxP.lineJoin = 'bevel'; ctxP.miterLimit = 2; ctxP.globalCompositeOperation = 'source-over';
      var fio = new Path2D();                                    // só onde não há bainha: o começo, a cintura de cada nódulo e o fim
      if (!tr.length) caminhoSub(ax, 0, fim, fio);
      else { caminhoSub(ax, 0, tr[0][0] + 0.5, fio); for (i = 0; i + 1 < tr.length; i++) caminhoSub(ax, tr[i][1] - 0.5, tr[i + 1][0] + 0.5, fio); caminhoSub(ax, tr[tr.length - 1][1] - 0.5, fim, fio); }       // o fio nu, de ponta a ponta (aparece na cintura dos nódulos e perto da ponta)
      ctxP.strokeStyle = 'rgb(6,4,14)'; ctxP.lineWidth = 0.40 * w + 2 * ou; ctxP.stroke(fio);
      ctxP.strokeStyle = rgba(clar(cor), 0.85); ctxP.lineWidth = 0.40 * w; ctxP.stroke(fio);
      var mains = [new Path2D(), new Path2D()], tem = [false, false];
      tr.forEach(function (t) { var g2 = t[2] ? 1 : 0; tem[g2] = true; caminhoSub(ax, t[0], t[1], mains[g2]); });
      var dk = 'rgb(6,4,14)', c42 = rgba(esc(cor, 0.42), 1), c80 = rgba(esc(cor, 0.80), 1), cl = null;
      for (g = 0; g < 2; g++) { if (tem[g]) { ctxP.strokeStyle = dk; ctxP.lineWidth = w * QG[g * 2] + 2 * ou; ctxP.stroke(mains[g]); } }
      for (g = 0; g < 2; g++) {
        if (!tem[g]) continue; var q = w * QG[g * 2];
        ctxP.strokeStyle = c42; ctxP.lineWidth = q; ctxP.stroke(mains[g]);
        ctxP.strokeStyle = c80; ctxP.lineWidth = 0.60 * q; ctxP.stroke(mains[g]);
      }
      ctxP.globalCompositeOperation = 'lighter';
      for (i = 0; i < ax.nos.length; i++) {       // o nódulo por onde o pulso acabou de saltar (o mesmo brilho da v09)
        if (ax.nos[i] <= 0.02) continue;
        var pp = ponto(ax, ax.a0 + i * ax.pitch - 0.25 * w), fl = ax.nos[i];
        pulsoP.pulso(ctxP, pp.x, pp.y, 0.9 * w * (0.7 + fl * 0.45), ax.pulsoCor, fl * 0.85);
      }
      if (ax.pulso) {                              // o pulso da v09: cabeça e rastro de 11 pontos, branco no centro, cor clara e a cor sumindo nas bordas
        for (var k = 10; k >= 0; k--) {
          var u = ax.pulso.u - k * Math.max(3.5, 5.5 * s); if (u < 0) continue;
          var qp = ponto(ax, u), ratio = 1 - k / 11; pulsoP.pulso(ctxP, qp.x, qp.y, w * (0.42 + ratio * 0.55), ax.pulsoCor, ratio * 0.85);
        }
      }
      ctxP.globalCompositeOperation = 'source-over';
      var v = ax.vent;
      if (ax.tipo === 'i' && ax.p < 0.999) ponta.cone(ctxP, s, relogio, ax);
      if (ax.p > 0.5) { var ga = ctxP.globalAlpha; ctxP.globalAlpha = ax.p >= 0.999 ? 1 : (ax.p - 0.5) * 2; ponta.ventosa(ctxP, s, v.cx, v.cy, v.R + 0.4, v.ang, v.cor, v.flash, v.anel, w); ctxP.globalAlpha = ga; }
    }

  return { medir: medeEixo, ponto: ponto, trechos: trechos, pintar: pintaEixo };
}
