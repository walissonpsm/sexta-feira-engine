/* GERADO por ferramentas/montar-interface.sh a partir de fonte/ (versão 0.4.4). NÃO edite aqui: edite a parte em fonte/ e rode o montador. */
// ---- fonte/ligacoes/pulso/parte.js
SF.parte({nome:'ligacoes/pulso',porta:1,compativelDesde:1,requer:['comum/cores@1'],guarda:true,dom:false},
/* O pulso que corre pelo tronco (o desenho da v09): centro branco, cor clara e a cor sumindo nas bordas. Só desenha. */
function (usa) {
  'use strict';
  var rgba = usa.cores.rgba, clar = usa.cores.clar;
    function pulsoV09(ctxP, x, y, rad, c, a) {          // o desenho do pulso da v09 (drawUnifiedSmoothPulse): centro branco, cor clara e a cor sumindo
      var l = clar(c), g = ctxP.createRadialGradient(x, y, 0.5, x, y, rad);
      g.addColorStop(0, 'rgba(255,255,255,' + (0.92 * a).toFixed(3) + ')'); g.addColorStop(0.45, rgba(l, 0.65 * a)); g.addColorStop(1, rgba(c, 0));
      ctxP.fillStyle = g; ctxP.beginPath(); ctxP.arc(x, y, rad, 0, 6.2832); ctxP.fill();
    }

  return { pulso: pulsoV09 };
}

);
// ---- fonte/ligacoes/ponta/parte.js
SF.parte({nome:'ligacoes/ponta',porta:1,compativelDesde:1,requer:['comum/cores@1'],guarda:true,dom:false},
/* A ponta do axônio: o cone de crescimento (ponta solta, com filopódios e véu), a ventosa (o terminal colado ao vidro) e a luz suave. Só desenha: recebe o contexto
 * (ctx), a escala (s) e o estado do axônio; não guarda nada e não conhece as outras partes. */
function (usa) {
  'use strict';
  var rgba = usa.cores.rgba, clar = usa.cores.clar, esc = usa.cores.esc;
    function luz(ctxP, x, y, r, c, a) {
      var g = ctxP.createRadialGradient(x, y, 0, x, y, r);
      g.addColorStop(0, rgba(clar(c), a)); g.addColorStop(0.45, rgba(c, a * 0.45)); g.addColorStop(1, rgba(c, 0));
      ctxP.fillStyle = g; ctxP.beginPath(); ctxP.arc(x, y, r, 0, 6.2832); ctxP.fill();
    }
    // a espessura da ventosa e o raio do centro dela (o disco encosta no vidro)
    function espVent(s) { return Math.max(2.2, 5.0 * s); }
    function raioVent(s, R) { return R + 0.4 + espVent(s) * 0.6; }
    function altVent(s) { return Math.max(9, 24 * s); }                 // a altura do sino: do pescoço do axônio até o disco
    // a ventosa, o terminal do axônio: um sino curto (o axônio afina no pescoço e alarga) que termina num disco achatado e côncavo, colado ao vidro e
    // seguindo a curva dele, com aro claro. sq (0..1) é o aperto quando o sinal chega: achata, alarga e o vidro embaixo acende. anel (0..1) é a onda
    // que corre pelo vidro quando ela pousa. O contorno escuro faz o que passa por baixo parecer passar por baixo.
    function pintaVentosa(ctxP, s, cx, cy, rIn, ang, cor, sq, anel, wTronco) {
      var th = espVent(s) * (1 - 0.30 * sq), larg = Math.max(10, 34 * s) * (1 + 0.22 * sq), d = larg / 2 / Math.max(rIn, 1), ou = Math.max(0.9, 1.2 * s);
      var alt = altVent(s) * (1 - 0.18 * sq), ux = Math.cos(ang), uy = Math.sin(ang), tx = -uy, ty = ux, hb = larg * 0.46, wn = Math.max(1.2, wTronco * 0.18);
      var P = function (r, o) { return { x: cx + ux * r + tx * o, y: cy + uy * r + ty * o }; };
      var arco = function (r, w, cc) { ctxP.beginPath(); ctxP.arc(cx, cy, r, ang - d, ang + d); ctxP.strokeStyle = cc; ctxP.lineWidth = w; ctxP.stroke(); };
      ctxP.save(); ctxP.globalCompositeOperation = 'source-over'; ctxP.lineCap = 'round'; ctxP.lineJoin = 'round';
      var pe = P(rIn + alt, wn), pd = P(rIn + alt, -wn), b1 = P(rIn + th, hb), b2 = P(rIn + th, -hb), c1 = P(rIn + alt * 0.40, wn * 1.1 + (hb - wn) * 0.30), c2 = P(rIn + alt * 0.40, -(wn * 1.1 + (hb - wn) * 0.30));
      ctxP.beginPath(); ctxP.moveTo(pe.x, pe.y); ctxP.quadraticCurveTo(c1.x, c1.y, b1.x, b1.y); ctxP.lineTo(b2.x, b2.y); ctxP.quadraticCurveTo(c2.x, c2.y, pd.x, pd.y); ctxP.closePath();
      ctxP.fillStyle = rgba(esc(cor, 0.50), 1); ctxP.strokeStyle = 'rgba(6,4,14,0.92)'; ctxP.lineWidth = 2 * ou; ctxP.stroke(); ctxP.fill();
      ctxP.beginPath(); ctxP.moveTo(pe.x, pe.y); ctxP.quadraticCurveTo(c1.x, c1.y, b1.x, b1.y); ctxP.strokeStyle = rgba(clar(cor), 0.55); ctxP.lineWidth = Math.max(0.8, 1.3 * s); ctxP.stroke();
      ctxP.beginPath(); ctxP.moveTo(pd.x, pd.y); ctxP.quadraticCurveTo(c2.x, c2.y, b2.x, b2.y); ctxP.stroke();
      arco(rIn + th * 0.5, th + 2 * ou, 'rgba(6,4,14,0.92)');
      arco(rIn + th * 0.5, th, rgba(esc(cor, 0.52), 1));
      arco(rIn + th * 0.22, th * 0.40, rgba(esc(cor, 0.16), 1));            // o fundo côncavo, virado para o vidro
      arco(rIn + th * 0.86, th * 0.30, rgba(clar(cor), 0.95));                // o aro
      if (anel > 0.02) { var q = 1 - anel, dd = d * (1.2 + 5 * q); ctxP.beginPath(); ctxP.arc(cx, cy, rIn - 0.2, ang - dd, ang + dd); ctxP.strokeStyle = rgba(clar(cor), 0.65 * anel); ctxP.lineWidth = Math.max(0.8, 1.6 * s); ctxP.stroke(); }
      ctxP.restore();
      if (sq > 0.02) { ctxP.save(); ctxP.globalCompositeOperation = 'lighter'; luz(ctxP, cx + (rIn - 0.6) * ux, cy + (rIn - 0.6) * uy, espVent(s) * (2.2 + 4.5 * sq), cor, 0.65 * sq); ctxP.restore(); }
    }

    // o cone de crescimento: a ponta do axônio quando solta do vidro. Um leque achatado de filopódios finos com o véu (lamelipódio) entre eles; os dedos da frente
    // esticam e encolhem, explorando; ao assentar no vidro eles se recolhem e o cone se achata na ventosa
    function pintaCone(ctxP, s, relogio, ax) {
      var n = ax.pts.length, E = ax.pts[n - 1], B = ax.pts[Math.max(0, n - 5)], hx = E.x - B.x, hy = E.y - B.y, hl = Math.hypot(hx, hy) || 1, ang = Math.atan2(hy, hx);
      var cor = ax.corRgb, w = ax.larg, k = 1 - ax.p, L0 = Math.max(18, 46 * s) * Math.min(1, k * 1.6), base = w * 0.9, nf = 5, tips = [], i;
      var ou = Math.max(0.9, 1.2 * s), ca = Math.cos(ang), sa = Math.sin(ang);
      for (i = 0; i < nf; i++) {
        var f = i / (nf - 1) - 0.5, aa = ang + f * 1.9, expl = 0.72 + 0.28 * Math.sin(2.6 * relogio + i * 1.9 + ax.fase), len = L0 * (1 - 0.38 * Math.abs(f)) * expl;
        tips.push({ x: E.x + Math.cos(aa) * len, y: E.y + Math.sin(aa) * len, a: aa, l: len });
      }
      var Pb = function (o) { return { x: E.x - sa * o - ca * w * 0.15, y: E.y + ca * o - sa * w * 0.15 }; };
      ctxP.save(); ctxP.lineCap = 'round'; ctxP.lineJoin = 'round';
      ctxP.beginPath(); var b0 = Pb(-base); ctxP.moveTo(b0.x, b0.y);       // o véu: do lado de trás, pelas pontas dos filopódios (com a concavidade entre elas) e de volta
      ctxP.lineTo(tips[0].x, tips[0].y);
      for (i = 1; i < nf; i++) { var m = { x: (tips[i - 1].x + tips[i].x) / 2 + (E.x - (tips[i - 1].x + tips[i].x) / 2) * 0.38, y: (tips[i - 1].y + tips[i].y) / 2 + (E.y - (tips[i - 1].y + tips[i].y) / 2) * 0.38 }; ctxP.quadraticCurveTo(m.x, m.y, tips[i].x, tips[i].y); }
      var b1 = Pb(base); ctxP.lineTo(b1.x, b1.y); ctxP.closePath();
      ctxP.fillStyle = rgba(esc(cor, 0.55), 0.62 * Math.min(1, k * 2)); ctxP.fill();
      ctxP.strokeStyle = 'rgba(6,4,14,0.55)'; ctxP.lineWidth = ou; ctxP.stroke();
      for (i = 0; i < nf; i++) {                                           // os filopódios: fios finos de feixe de actina, com uma pontinha clara
        ctxP.beginPath(); ctxP.moveTo(E.x, E.y); ctxP.lineTo(tips[i].x, tips[i].y);
        ctxP.strokeStyle = rgba(clar(cor), 0.85); ctxP.lineWidth = Math.max(0.8, 1.5 * s); ctxP.stroke();
        ctxP.fillStyle = rgba(clar(cor), 0.95); ctxP.beginPath(); ctxP.arc(tips[i].x, tips[i].y, Math.max(0.9, 1.7 * s), 0, 6.2832); ctxP.fill();
      }
      ctxP.beginPath(); ctxP.arc(E.x, E.y, w * 0.42, 0, 6.2832); ctxP.fillStyle = rgba(esc(cor, 0.85), 1); ctxP.strokeStyle = 'rgba(6,4,14,0.9)'; ctxP.lineWidth = ou; ctxP.stroke(); ctxP.fill();
      ctxP.restore();
    }

  return {
    luz: luz, ventosa: pintaVentosa, cone: pintaCone, espVent: espVent, raioVent: raioVent, altVent: altVent
  };
}

);
// ---- fonte/ligacoes/pistas/parte.js
SF.parte({nome:'ligacoes/pistas',porta:1,compativelDesde:1,requer:['comum/curvas@1'],guarda:true,dom:false},
/* O caminho do axônio do agente até o vidro do Núcleo (a pista dele). Só geometria: recebe o Núcleo (cx, cy, R), o raio do centro da ventosa (rv) e o axônio. */
function (usa) {
  'use strict';
  var curva = usa.curvas.curva, polar = usa.curvas.polar;
    // o caminho do axônio do agente até o vidro do Núcleo para o ângulo dC (relativo à pista dele): sai pelo canal, junta-se a um arco por fora do vidro (cada
    // agente num raio, para dois nunca correrem juntos) e termina de frente para o vidro, no ponto do módulo
    function caminhoI(N, rv, ax) {
      var rA = ax.rA, thL = ax.thL, dth = ax.dC, adth = Math.abs(dth), sg = dth >= 0 ? 1 : -1, drop = ax.drop;
      var pts = ax.head.slice(), thT = thL + dth, i, v, m, p = ax.p, rEnd = rA - (rA - rv) * p;
      if (adth < 0.012) {
        pts.push(polar(N.cx, N.cy, rEnd, thT));
      } else {
        var dm = Math.min(0.30, adth * 0.40), hook = Math.min((rA - rv) * 1.3 / N.R, adth * 0.55) * p;
        m = 10;
        for (i = 1; i <= m; i++) { v = i / m; pts.push(polar(N.cx, N.cy, rA + drop * Math.pow(1 - v, 1.6), thL + sg * dm * v * v)); }
        var a0 = thL + sg * dm, a1 = thT - sg * hook, n1 = Math.floor(Math.abs(a1 - a0) * N.R / 7);
        for (i = 1; i <= n1; i++) pts.push(polar(N.cx, N.cy, rA, a0 + (a1 - a0) * i / (n1 + 1)));
        if (p < 0.03) pts.push(polar(N.cx, N.cy, rA, thT));
        else { m = 14; for (i = 0; i <= m; i++) { v = i / m; pts.push(polar(N.cx, N.cy, rEnd + (rA - rEnd) * Math.pow(1 - v, 1.6), thT - sg * hook * (1 - v) * (1 - v))); } }
      }
      return curva(pts, ax.passo);
    }

  return { caminho: caminhoI };
}

);
// ---- fonte/ligacoes/tronco/parte.js
SF.parte({nome:'ligacoes/tronco',porta:1,compativelDesde:1,requer:['comum/cores@1','comum/curvas@1','ligacoes/ponta@1','ligacoes/pulso@1'],guarda:true,dom:false},
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

);
