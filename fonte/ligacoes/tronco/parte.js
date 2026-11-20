/* O tronco do axônio: mede a linha (a rota ajustada por ligacoes/caminho; comprimento, normais, caixa), acha pontos e trechos nela e desenha o fio, as bainhas de
 * mielina (cada uma com o seu comprimento), os nódulos, o pulso (que incha o axônio por onde passa), os dendritos que passam por cima e o terminal axonal (de
 * ligacoes/ponta). Não guarda estado: o axônio (`ax`) é de quem chama (cena/quadro). Juntadora da camada ligacoes. */
function (usa) {
  'use strict';
  var rgba = usa.cores.rgba, clar = usa.cores.clar, esc = usa.cores.esc, suave = usa.curvas.suave, ponta = usa.ponta, pulsoP = usa.pulso, caminho = usa.caminho;
    function medeEixo(s, ax) {
      var p = caminho.refinar(s, ax) || ax.base, n = p.length, i, c = ax.cum, nx = ax.nx, ny = ax.ny, x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9;
      c.length = n; nx.length = n; ny.length = n; c[0] = 0;
      for (i = 1; i < n; i++) c[i] = c[i - 1] + Math.hypot(p[i].x - p[i - 1].x, p[i].y - p[i - 1].y);
      for (i = 0; i < n; i++) {
        var a = p[Math.max(0, i - 1)], b = p[Math.min(n - 1, i + 1)], tx = b.x - a.x, ty = b.y - a.y, l = Math.hypot(tx, ty) || 1;
        nx[i] = -ty / l; ny[i] = tx / l;
        if (p[i].x < x0) x0 = p[i].x; if (p[i].x > x1) x1 = p[i].x; if (p[i].y < y0) y0 = p[i].y; if (p[i].y > y1) y1 = p[i].y;
      }
      ax.len = c[n - 1];
      var mg = ax.larg * 1.6 + 14 * s + 10; ax.bb = { x0: x0 - mg, y0: y0 - mg, x1: x1 + mg, y1: y1 + mg };
      while (ax.pts.length < n) ax.pts.push({ x: 0, y: 0 });
      ax.pts.length = n;
      // o axônio é orgânico: uma ondulação lenta e irregular (duas ondas com fase própria do axônio), parada, que some nas duas pontas. Quem tem lista de
      // obstáculos (`ax.obst`) já ganhou a ondulação em ligacoes/caminho, junto com o desvio dos vizinhos, e aqui não ganha de novo
      var f = ax.fase || 0, A = Math.max(2, 9 * s), L = ax.len, ent = Math.max(30, 60 * s);
      for (i = 0; i < n; i++) {
        var u = c[i], env = Math.min(1, u / ent, (L - u) / ent); env = env <= 0 ? 0 : env * env * (3 - 2 * env);
        var o = ax.obst ? 0 : A * env * (0.65 * Math.sin(u / (95 * s + 30) + f * 3.1) + 0.35 * Math.sin(u / (41 * s + 14) + f * 7.3));
        ax.pts[i].x = p[i].x + nx[i] * o; ax.pts[i].y = p[i].y + ny[i] * o;
      }
      for (i = 1; i < n; i++) c[i] = c[i - 1] + Math.hypot(ax.pts[i].x - ax.pts[i - 1].x, ax.pts[i].y - ax.pts[i - 1].y);
      ax.len = c[n - 1];
      ax.sobre = ax.grade ? cruzamentos(ax) : [];
      ax.cT = null;                      // a linha mudou: o que o desenho guardou dela (caminhos do fio e das bainhas) já não vale
      trechos(s, ax);                    // as cinturas entre as bainhas (`nosU`, `nNos`, `pitch`) são da linha: ficam prontas para o passo do pulso (cena/eixos) mesmo antes do 1º desenho
    }
    // onde um dendrito cruza o axônio, metade das vezes ele passa POR CIMA (é repintado por cima do axônio, na cor dele); na outra metade passa por baixo.
    // A escolha é fixa para cada cruzamento (`d.cima`, sorteada em cena/ligar).
    function cruzamentos(ax) {
      var G = ax.grade, out = [], visto = {}, p = ax.pts, i;
      for (i = 0; i + 1 < p.length; i += 1) {
        var a = p[i], b = p[i + 1], cx = Math.floor((a.x + b.x) / 2 / G.cel), cy = Math.floor((a.y + b.y) / 2 / G.cel);
        for (var gx = cx - 1; gx <= cx + 1; gx++) for (var gy = cy - 1; gy <= cy + 1; gy++) {
          var lista = G.m[gx + ',' + gy]; if (!lista) continue;
          for (var j = 0; j < lista.length; j++) {
            var d = lista[j]; if (visto[d.id]) continue;
            if (corta(a, b, d)) { visto[d.id] = 1; if (d.cima) out.push(d); }
          }
        }
      }
      return out;
    }
    function corta(a, b, d) {
      var r = function (p, q, x, y) { return (q.x - p.x) * (y - p.y) - (q.y - p.y) * (x - p.x); };
      var d1 = r(a, b, d.x1, d.y1), d2 = r(a, b, d.x2, d.y2), d3 = (d.x2 - d.x1) * (a.y - d.y1) - (d.y2 - d.y1) * (a.x - d.x1), d4 = (d.x2 - d.x1) * (b.y - d.y1) - (d.y2 - d.y1) * (b.x - d.x1);
      return (d1 > 0) !== (d2 > 0) && (d3 > 0) !== (d4 > 0);
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
      var nos = [], a = ax.a0, fs = ax.fase || 0;
      for (var k = 0; a < Lm - 0.3 * Ls; k++) {          // cada bainha tem o seu comprimento (como no tecido real), fixo por axônio
        var vr = Math.sin(k * 12.9898 + fs * 78.233) * 43758.5453; vr = vr - Math.floor(vr);
        var Lk = Ls * (0.62 + 0.76 * vr), gk = gap * (0.8 + 0.5 * ((vr * 7.31) % 1));
        var b = Math.min(a + Lk, Lm), f = 0.70 + 0.30 * (1 - suave((a - tail) / (4 * pitch)));
        out.push([a, b, f > 0.93 ? 0 : f > 0.80 ? 1 : 2, k]); nos.push(a - 0.25 * w);
        a = b + gk;
      }
      ax.pitch = pitch; ax.nNos = out.length; ax.nosU = nos; return out;
    }
    var QG = [1, 0.86, 0.72];
    // O que só depende da linha (as bainhas, o caminho do fio nu, o das bainhas de cada espessura, os trechos de dendrito por cima e as cores) é montado na primeira vez
    // que o axônio é desenhado e guardado em `ax.cT`; `medeEixo` apaga o guardado quando a linha muda. Refazer tudo isso a cada quadro custava ~3.900 chamadas de caminho
    // por quadro só nos troncos. Só o que se mexe (o inchaço e o pulso, os nódulos acesos, o terminal) é calculado de novo a cada quadro.
    function guardaTronco(s, ax, fim) {
      var cor = ax.corRgb, tr = trechos(s, ax), fio = new Path2D(), mains = [new Path2D(), new Path2D()], tem = [false, false], i;
      if (!tr.length) caminhoSub(ax, 0, fim, fio);
      else { caminhoSub(ax, 0, tr[0][0] + 0.5, fio); for (i = 0; i + 1 < tr.length; i++) caminhoSub(ax, tr[i][1] - 0.5, tr[i + 1][0] + 0.5, fio); caminhoSub(ax, tr[tr.length - 1][1] - 0.5, fim, fio); }       // o fio nu, de ponta a ponta (aparece na cintura dos nódulos e perto da ponta)
      tr.forEach(function (t) { var g2 = t[2] ? 1 : 0; tem[g2] = true; caminhoSub(ax, t[0], t[1], mains[g2]); });
      var sobre = (ax.sobre || []).map(function (d) { var pd = new Path2D(); pd.moveTo(d.x0, d.y0); pd.lineTo(d.x1, d.y1); pd.lineTo(d.x2, d.y2); pd.lineTo(d.x3, d.y3); return { p: pd, cor: d.cor, w: d.w }; });
      return { fio: fio, mains: mains, tem: tem, sobre: sobre, fim: fim, cFio: rgba(clar(cor), 0.85), c42: rgba(esc(cor, 0.42), 1), c80: rgba(esc(cor, 0.80), 1) };
    }
    function pintaEixo(ctxP, s, relogio, ax) {
      var w = ax.larg, fim = ax.len - ponta.altVent(s) * 0.5, g, i, K = ax.cT;
      if (!K || K.fim !== fim) K = ax.cT = guardaTronco(s, ax, fim);
      ctxP.lineCap = 'butt'; ctxP.lineJoin = 'bevel'; ctxP.miterLimit = 2; ctxP.globalCompositeOperation = 'source-over';
      ctxP.strokeStyle = K.cFio; ctxP.lineWidth = 0.40 * w; ctxP.stroke(K.fio);
      var c42 = K.c42, c80 = K.c80;
      for (g = 0; g < 2; g++) {
        if (!K.tem[g]) continue; var q = w * QG[g * 2];
        ctxP.strokeStyle = c42; ctxP.lineWidth = q; ctxP.stroke(K.mains[g]);
        ctxP.strokeStyle = c80; ctxP.lineWidth = 0.60 * q; ctxP.stroke(K.mains[g]);
      }
      if (ax.pulso) {                                  // onde o potencial de ação passa, o axônio incha de leve
        var inch = new Path2D(); caminhoSub(ax, Math.max(0, ax.pulso.u - 26 * s), Math.min(fim, ax.pulso.u + 6 * s), inch);
        ctxP.strokeStyle = c42; ctxP.lineWidth = w * 1.16; ctxP.stroke(inch);
        ctxP.strokeStyle = c80; ctxP.lineWidth = 0.66 * w; ctxP.stroke(inch);
      }
      if (K.sobre.length) {                            // o dendrito que passa por cima: o trecho dele é pintado por cima do axônio, na cor dele (sem buraco nem sombra)
        ctxP.save(); ctxP.lineCap = 'round'; ctxP.lineJoin = 'round';
        K.sobre.forEach(function (d) { ctxP.strokeStyle = d.cor; ctxP.lineWidth = d.w; ctxP.stroke(d.p); });
        ctxP.restore();
      }
      ctxP.globalCompositeOperation = 'lighter';
      for (i = 0; i < ax.nos.length; i++) {       // o nódulo por onde o pulso acabou de saltar (o mesmo brilho da v09)
        if (ax.nos[i] <= 0.02) continue;
        var pp = ponto(ax, ax.nosU && ax.nosU[i] != null ? ax.nosU[i] : ax.a0 + i * ax.pitch - 0.25 * w), fl = ax.nos[i];
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
      if (ax.p > 0.5) { var ga = ctxP.globalAlpha; ctxP.globalAlpha = ax.p >= 0.999 ? 1 : (ax.p - 0.5) * 2; ponta.terminal(ctxP, s, v.cx, v.cy, v.R + 0.4, v.ang, v.cor, v.flash, w, ax.fase || 0, ponto(ax, fim)); ctxP.globalAlpha = ga; }
    }

  return { medir: medeEixo, ponto: ponto, trechos: trechos, pintar: pintaEixo };
}
