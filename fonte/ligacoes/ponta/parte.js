/* A ponta do axônio: o terminal axonal (v0.5.0: telodendros finos, pés achatados no vidro e neurotransmissores; é o que o tronco desenha no fim de cada axônio) e a luz suave.
 * O cone de crescimento (ponta solta, com filopódios e véu) e a ventosa (o terminal antigo, colado ao vidro) continuam aqui, mas SEM USO desde a v0.5.0: o axônio não pluga mais.
 * Só desenha: recebe o contexto (ctx), a escala (s) e o estado do axônio; não guarda nada e não conhece as outras partes. */
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

    // v0.5.0: o terminal axonal (no lugar da ventosa). O axônio, já sem mielina, atravessa o vidro e se abre em telodendros finos (4 a 6 galhos), cada um com uma
    // placa achatada na ponta (o pé pré-sináptico, sem bolinha), encostados no dendrito de quem recebe. Quando o sinal chega (sq 0..1, vai sumindo): os pés acendem e
    // soltam neurotransmissores (pontinhos) que atravessam a fenda até o dendrito. `E` é o ponto onde o tronco termina (a bainha acaba um pouco antes); `fase` é o
    // sorteio fixo do axônio (muda o número e o jeito dos galhos, nunca a cada quadro).
    function pintaTerminal(ctxP, s, cx, cy, rIn, ang, cor, sq, wTronco, fase, E) {
      var ux = Math.cos(ang), uy = Math.sin(ang), ou = Math.max(0.8, 1.1 * s), wn = Math.max(1.0, wTronco * 0.40);
      var fora = altVent(s), fundo = Math.max(6, 13 * s), P = function (r, o) { return { x: cx + ux * r - uy * o, y: cy + uy * r + ux * o }; };
      var A0 = E || P(rIn + fora * 0.55, 0), B = P(rIn - fundo, Math.sin(fase * 5.1) * 3 * s), C = P(rIn + fora * 0.15, Math.sin(fase * 2.3) * 2 * s);
      var n = 4 + Math.floor(((fase * 13.7) % 1) * 2.99), galhos = [], i;
      for (i = 0; i < n; i++) {
        var fr = n > 1 ? i / (n - 1) - 0.5 : 0, jit = Math.sin(fase * 9.7 + i * 2.1) * 0.18, aa = ang + Math.PI + fr * 1.6 + jit;
        var len = Math.max(6, 13 * s) * (0.75 + 0.5 * Math.abs(Math.sin(fase * 4.3 + i * 1.7)));
        var meio = { x: B.x + Math.cos(aa - jit * 1.5) * len * 0.55, y: B.y + Math.sin(aa - jit * 1.5) * len * 0.55 };
        galhos.push({ m: meio, t: { x: B.x + Math.cos(aa) * len, y: B.y + Math.sin(aa) * len }, a: aa });
      }
      ctxP.save(); ctxP.lineCap = 'round'; ctxP.lineJoin = 'round'; ctxP.globalCompositeOperation = 'source-over';
      var tracar = function (w, cc) {
        ctxP.strokeStyle = cc; ctxP.lineWidth = w;
        ctxP.beginPath(); ctxP.moveTo(A0.x, A0.y); ctxP.quadraticCurveTo(C.x, C.y, B.x, B.y); ctxP.stroke();
        galhos.forEach(function (g) { ctxP.beginPath(); ctxP.moveTo(B.x, B.y); ctxP.quadraticCurveTo(g.m.x, g.m.y, g.t.x, g.t.y); ctxP.lineWidth = w * 0.62; ctxP.stroke(); });
      };
      tracar(wn, rgba(clar(cor), 0.9));
      // sem bolinhas: cada telodendro afina e, na ponta, alarga num pé achatado (a placa pré-sináptica) encostado no dendrito
      var rb = Math.max(1.0, 1.6 * s);
      galhos.forEach(function (g) {
        var dx = g.t.x - g.m.x, dy = g.t.y - g.m.y, l = Math.hypot(dx, dy) || 1, tx = dx / l, ty = dy / l, nx2 = -ty, ny2 = tx, lp = rb * (1.1 + 0.5 * sq);
        var e = { x: g.t.x + tx * rb * 0.5, y: g.t.y + ty * rb * 0.5 };
        ctxP.beginPath(); ctxP.moveTo(g.t.x - tx * rb * 1.6 + nx2 * wn * 0.3, g.t.y - ty * rb * 1.6 + ny2 * wn * 0.3);
        ctxP.quadraticCurveTo(g.t.x + nx2 * lp * 0.6, g.t.y + ny2 * lp * 0.6, e.x + nx2 * lp, e.y + ny2 * lp);
        ctxP.quadraticCurveTo(e.x + tx * rb * 0.5, e.y + ty * rb * 0.5, e.x - nx2 * lp, e.y - ny2 * lp);
        ctxP.quadraticCurveTo(g.t.x - nx2 * lp * 0.6, g.t.y - ny2 * lp * 0.6, g.t.x - tx * rb * 1.6 - nx2 * wn * 0.3, g.t.y - ty * rb * 1.6 - ny2 * wn * 0.3);
        ctxP.closePath();
        ctxP.fillStyle = rgba(clar(cor), 0.55 + 0.4 * sq); ctxP.fill();
      });
      ctxP.restore();
      if (sq > 0.02) {                                  // a transmissão: os pés brilham e os neurotransmissores atravessam a fenda
        ctxP.save(); ctxP.globalCompositeOperation = 'lighter';
        var q = 1 - sq;
        galhos.forEach(function (g, gi) {
          luz(ctxP, g.t.x, g.t.y, rb * (2.2 + 2.5 * sq), cor, 0.7 * sq);
          for (var k = 0; k < 4; k++) {
            var da = g.a + (k - 1.5) * 0.35 + Math.sin(fase * 3 + gi + k) * 0.2, dist = rb + q * Math.max(4, 9 * s) * (0.7 + 0.15 * k);
            ctxP.beginPath(); ctxP.arc(g.t.x + Math.cos(da) * dist, g.t.y + Math.sin(da) * dist, Math.max(0.6, 1.1 * s), 0, 6.2832);
            ctxP.fillStyle = rgba(clar(cor), 0.9 * Math.min(1, sq * 1.6)); ctxP.fill();
          }
        });
        ctxP.restore();
      }
    }

  return {
    terminal: pintaTerminal, luz: luz, ventosa: pintaVentosa, cone: pintaCone, espVent: espVent, raioVent: raioVent, altVent: altVent
  };
}
