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
SF.parte({nome:'ligacoes/ponta',porta:2,compativelDesde:1,requer:['comum/cores@1'],guarda:true,dom:false},
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

);
// ---- fonte/ligacoes/pistas/parte.js
SF.parte({nome:'ligacoes/pistas',porta:2,compativelDesde:1,requer:['comum/curvas@2'],guarda:true,dom:false},
/* O caminho do axônio do agente até o vidro do Núcleo (a pista dele). Só geometria: recebe o Núcleo (cx, cy, R), o raio do centro da ventosa (rv) e o axônio. */
function (usa) {
  'use strict';
  var curva = usa.curvas.curva, polar = usa.curvas.polar, volta = usa.curvas.volta, chegada = usa.curvas.chegada, ponte = usa.curvas.ponte;
    // v0.5.0: o esboço do caminho de um axônio (só os pontos, sem suavizar): sai do agente, desce em curva suave até uma "pista" em volta do Núcleo (quase reta quando o
    // ponto de chegada está de frente) e chega de frente ao vidro, numa reta curta. `pl` = { dir: lado (+1 ou -1), lane: qual pista }; `s` = a escala da cena. Quem escolhe
    // o lado e a pista é cena/rotas; o ajuste fino (desviar de neurônios, vizinhos e da própria curva) é de ligacoes/caminho.
    function esboco(N, rv, ax, pl, s) {
      var S = ax.head[2], H1 = ax.head[1], dx = S.x - N.cx, dy = S.y - N.cy, rS = Math.hypot(dx, dy), a0 = Math.atan2(dy, dx), thT = ax.thL + ax.dC, D = volta(thT - a0), dir = pl.dir;
      if (D * dir < 0) D += dir * 2 * Math.PI;
      var sg = D >= 0 ? 1 : -1, rE = rv + 100 * s, step = 22 * s + 4, w = Math.min(1, Math.abs(D) / 1.2), rL = rE + pl.lane * step * w;
      var E = polar(N.cx, N.cy, rv, thT), pts = ax.head.slice(0, 3), tl;
      // a chegada é uma curva de Hermite que termina de frente no vidro, sem gancho; o arco dela cresce com a altura da pista (as pistas de fora abrem mais a curva e
      // passam por cima das de dentro, sem cruzar). A descida da saída do agente até a pista é uma ponte de Hermite que começa na direção em que o axônio sai e termina
      // deitada na pista (sem mergulho e sem quina). Terminal quase de frente: uma curva só, da saída do agente até o vidro.
      var phi = 1.2 * (rL - rv) / rL, psi = Math.max(0.12, 1.1 * Math.max(0, rS - rL) / ((rS + rL) / 2)), hq = Math.max(8, 14 * s);
      tl = Math.hypot(S.x - H1.x, S.y - H1.y) || 1;
      var tS = { x: (S.x - H1.x) / tl, y: (S.y - H1.y) / tl };
      if (Math.abs(D) <= phi + psi + 0.05) return pts.concat(chegada(N.cx, N.cy, S, tS, E, Math.max(8, Math.ceil(Math.hypot(E.x - S.x, E.y - S.y) / 9)), hq));
      var aL1 = a0 + sg * psi, aA = a0 + D - sg * phi, L1 = polar(N.cx, N.cy, rL, aL1), tL = { x: -sg * Math.sin(aL1), y: sg * Math.cos(aL1) }, i;
      pts = pts.concat(ponte(N.cx, N.cy, S, tS, L1, tL, Math.max(8, Math.ceil(Math.hypot(L1.x - S.x, L1.y - S.y) * 1.2 / 9))));
      var n = Math.max(2, Math.ceil(Math.abs(aA - aL1) * rL / 9));
      for (i = 1; i <= n; i++) pts.push(polar(N.cx, N.cy, rL, aL1 + (aA - aL1) * i / n));
      var A = pts[pts.length - 1];
      return pts.concat(chegada(N.cx, N.cy, A, { x: -sg * Math.sin(aA), y: sg * Math.cos(aA) }, E, Math.max(8, Math.ceil(phi * rL / 9)), hq));
    }
    // o caminho do axônio do agente até o vidro do Núcleo para o ângulo dC (relativo à pista dele): sai pelo canal, junta-se a um arco por fora do vidro (cada
    // agente num raio, para dois nunca correrem juntos) e termina de frente para o vidro, no ponto do módulo
    function caminhoI(N, rv, ax) {
      if (ax.plano && ax.sc) return curva(esboco(N, rv, ax, ax.plano, ax.sc), ax.passo);
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

  return { caminho: caminhoI, esboco: esboco };
}

);
// ---- fonte/ligacoes/caminho/parte.js
SF.parte({nome:'ligacoes/caminho',porta:1,compativelDesde:1,requer:['comum/curvas@2'],guarda:true,dom:false},
/* O ajuste fino do caminho de um axônio (v0.5.0), como um galho que passa em volta do que encontra: parte do esboço (`ax.base`, de ligacoes/pistas), ondula de leve,
 * contorna as esferas e os neurônios do caminho (`ax.obst`), se afasta de quem corre junto dele (`ax.vizG`), arredonda as quinas e refaz a chegada ao terminal. Não guarda
 * estado nem desenha: devolve a lista de pontos. Tem guarda: se der erro, só esta parte cai e o tronco (ligacoes/tronco) fica com o esboço, que já é um caminho inteiro. */
function (usa) {
  'use strict';
  var suave = usa.curvas.suave, volta = usa.curvas.volta, chegada = usa.curvas.chegada;
    // A rota "de GPS": parte do esboço (`ax.base`), arredonda as quinas e contorna os obstáculos (esferas e neurônios), como um galho que passa em volta do que
    // encontra. O que está fora do Núcleo fica fora (com folga) e o que está dentro fica dentro. As pontas não se mexem. Devolve a lista de pontos (a própria
    // `ax.base` quando não há o que ajustar: menos de 5 pontos ou sem lista de obstáculos).
    function refinar(s, ax) {
      var b = ax.base, n = b.length, i, it, o;
      if (n < 5 || !ax.obst) return b;
      var p = b.map(function (q) { return { x: q.x, y: q.y }; }), N = ax.nucleo, fora = p.map(function (q) { return !N || Math.hypot(q.x - N.x, q.y - N.y) > N.R * 0.985; }), rMin = p.map(function (q) { return N ? Math.hypot(q.x - N.x, q.y - N.y) - 6 * s : 0; });
      var folgaN = ax.larg * 0.8 + 3 * s, prende = 2;
      // o limite da pista (rMin, guardado por ponto) só vale onde a linha corre em volta do Núcleo (na pista); onde ela desce (saindo do agente ou chegando ao
      // terminal) o limite some aos poucos: um ponto que escorrega da pista para a descida não fica preso na altura da pista (seria um degrau)
      var rB = p.map(function (q, i) {
        if (!N) return 0;
        var a = b[Math.max(0, i - 1)], c = b[Math.min(n - 1, i + 1)], tl = Math.hypot(c.x - a.x, c.y - a.y) || 1, ex = q.x - N.x, ey = q.y - N.y, dn = Math.hypot(ex, ey) || 1;
        var g = Math.abs(((c.x - a.x) * ex + (c.y - a.y) * ey) / (tl * dn)), lam = suave((0.35 - g) / 0.25), r0 = N.R + folgaN;
        return r0 + lam * Math.max(0, rMin[i] - r0);
      });
      // a ondulação orgânica entra ANTES do ajuste (assim a separação dos vizinhos vale para o desenho final)
      var cu = [0]; for (i = 1; i < n; i++) cu[i] = cu[i - 1] + Math.hypot(b[i].x - b[i - 1].x, b[i].y - b[i - 1].y);
      var Lb = cu[n - 1], fz = ax.fase || 0, Aw = Math.max(5, 26 * s), ent = Math.max(30, 60 * s), entF = Math.max(ent, 190 * s);   // perto do terminal a ondulação some devagar
      // a zona de chegada (a pista de pouso que já vem desenhada no esboço, de frente para o vidro) fica como foi desenhada: sem ondulação, sem alisamento e sem
      // se afastar dos vizinhos (são eles que se afastam dela). Perto da emenda o efeito entra aos poucos (rampa), para não fazer quina.
      var wA = cu.map(function () { return 0; }), v0 = ax.vent, fixa = false;
      if (ax.tipo === 'i' && v0) {
        var cxA = v0.cx, cyA = v0.cy, EA = b[n - 1], rEA = Math.hypot(EA.x - cxA, EA.y - cyA), aEA = Math.atan2(EA.y - cyA, EA.x - cxA), accA = 0, iaA = n - 1, LmA = 300 * s + 50, rampA = 70 * s + 20;
        for (i = n - 2; i > 2; i--) {
          accA += Math.hypot(b[i + 1].x - b[i].x, b[i + 1].y - b[i].y); iaA = i;
          var riA = Math.hypot(b[i].x - cxA, b[i].y - cyA), xiA = Math.abs(volta(Math.atan2(b[i].y - cyA, b[i].x - cxA) - aEA)) * riA;
          if (xiA > 1.2 * (riA - rEA) + 3 || accA > LmA) break;
        }
        for (i = 0; i < n; i++) { var dA2 = cu[i] - cu[iaA]; wA[i] = dA2 >= 0 ? 1 : suave(1 + dA2 / rampA); }
        fixa = true;
      }
      for (i = 1; i < n - 1; i++) {
        var tx0 = b[i + 1].x - b[i - 1].x, ty0 = b[i + 1].y - b[i - 1].y, tl = Math.hypot(tx0, ty0) || 1, en = Math.min(1, cu[i] / ent, (Lb - cu[i]) / entF);
        en = en <= 0 ? 0 : en * en * (3 - 2 * en);
        var ow = Aw * en * (1 - wA[i]) * (0.65 * Math.sin(cu[i] / (150 * s + 46) + fz * 3.1) + 0.35 * Math.sin(cu[i] / (52 * s + 18) + fz * 7.3));
        p[i].x += -ty0 / tl * ow; p[i].y += tx0 / tl * ow;
      }
      var V = ax.vizG, p0 = p.map(function (q) { return { x: q.x, y: q.y }; });
      // só os obstáculos que podem chegar perto da linha (os outros só gastariam conta)
      var bx0 = 1e9, by0 = 1e9, bx1 = -1e9, by1 = -1e9;
      p.forEach(function (q) { if (q.x < bx0) bx0 = q.x; if (q.x > bx1) bx1 = q.x; if (q.y < by0) by0 = q.y; if (q.y > by1) by1 = q.y; });
      var obs = ax.obst.filter(function (o2) { var m = o2.r * 1.25 + ax.larg * 0.6 + 60; return o2.x > bx0 - m && o2.x < bx1 + m && o2.y > by0 - m && o2.y < by1 + m; });
      for (it = 0; it < 200; it++) {
        for (i = prende; i < n - prende; i++) {
          var q = p[i];
          if (wA[i] >= 1) continue;
          q.x += 0.42 * ((p[i - 1].x + p[i + 1].x) / 2 - q.x); q.y += 0.42 * ((p[i - 1].y + p[i + 1].y) / 2 - q.y);
          for (var k = 0; k < obs.length; k++) {
            o = obs[k]; var dx = q.x - o.x, dy = q.y - o.y, d = Math.hypot(dx, dy), rr = o.r * 1.25 + ax.larg * 0.6;
            if (d < rr && d > 1e-6) { var f = (rr - d) * 0.25; q.x += dx / d * f; q.y += dy / d * f; }
          }
          if (V && it >= 40 && it < 188) {                       // não correr em cima de outro axônio (cruzar pode; ficar por cima ao longo, não)
            // só se afasta de quem corre junto (quase paralelo); num cruzamento, nada de desviar (o desvio faria um degrau na linha)
            var qa = p[i - 1], qc = p[i + 1], qtl = Math.hypot(qc.x - qa.x, qc.y - qa.y) || 1, qtx = (qc.x - qa.x) / qtl, qty = (qc.y - qa.y) / qtl;
            var gx0 = Math.floor(q.x / V.cel), gy0 = Math.floor(q.y / V.cel);
            for (var gx = gx0 - 1; gx <= gx0 + 1; gx++) for (var gy = gy0 - 1; gy <= gy0 + 1; gy++) {
              var L2 = V.m[(gx + 4096) * 8192 + gy + 4096]; if (!L2) continue;   // chave numérica (a de texto deixava a montagem lenta)
              for (var j = 0; j < L2.length; j++) {
                var w2 = L2[j]; if (w2.id === ax.id) continue;
                var vx = q.x - w2.x, vy = q.y - w2.y, dv = Math.hypot(vx, vy), rv = (ax.larg + w2.l) * 0.5 + V.folga;
                var par = w2.tx === undefined ? 1 : Math.min(1, Math.max(0, (Math.abs(qtx * w2.tx + qty * w2.ty) - 0.72) / 0.22));
                if (par > 0 && dv < rv && dv > 1e-6) { var fv = (rv - dv) * 0.15 * par; q.x += vx / dv * fv; q.y += vy / dv * fv; }
              }
            }
          }
          if (N) {
            var ex = q.x - N.x, ey = q.y - N.y, dn = Math.hypot(ex, ey) || 1;
            var rm = rB[i];                                                // cada axônio guarda a sua pista em volta do Núcleo (não se juntam no vidro)
            if (fora[i] && dn < rm) { q.x = N.x + ex / dn * rm; q.y = N.y + ey / dn * rm; }
            else if (!fora[i] && dn > N.R * 0.97) { q.x = N.x + ex / dn * N.R * 0.97; q.y = N.y + ey / dn * N.R * 0.97; }
          }
        }
      }
      // na rampa antes da emenda o deslocamento do ajuste encolhe aos poucos até zero (no fim do ajuste, não a cada passo: a cada passo o ponto acabava
      // chegando lá do mesmo jeito e a quina ficava na emenda)
      for (i = 0; i < n; i++) if (wA[i] > 0 && wA[i] < 1) { var wq = 1 - wA[i]; p[i].x = p0[i].x + (p[i].x - p0[i].x) * wq; p[i].y = p0[i].y + (p[i].y - p0[i].y) * wq; }
      p = alisa(p, prende, N, fora, rB, wA);
      if (!fixa) chegaFinal(s, ax, p);
      return p;
    }
    // o alisamento final (Taubin: tira as quinas pequenas sem encolher a curva); depois, quem está fora do Núcleo continua fora
    function alisa(p, prende, N, fora, rB, wA) {
      var n = p.length, i, k, q = p.map(function (a) { return { x: a.x, y: a.y }; }), t = [];
      for (k = 0; k < 16; k++) {
        var f = k % 2 ? -0.53 : 0.5;
        for (i = prende; i < n - prende; i++) t[i] = { x: q[i].x + f * ((q[i - 1].x + q[i + 1].x) / 2 - q[i].x), y: q[i].y + f * ((q[i - 1].y + q[i + 1].y) / 2 - q[i].y) };
        for (i = prende; i < n - prende; i++) if (wA[i] < 1) q[i] = t[i];
      }
      for (i = prende; i < n - prende; i++) if (wA[i] > 0 && wA[i] < 1) { var w = 1 - wA[i]; q[i] = { x: p[i].x + (q[i].x - p[i].x) * w, y: p[i].y + (q[i].y - p[i].y) * w }; }
      if (N) for (i = prende; i < n - prende; i++) {
        if (wA[i] > 0) continue;
        var ex = q[i].x - N.x, ey = q[i].y - N.y, dn = Math.hypot(ex, ey) || 1, rm = rB[i];
        if (fora[i] && dn < rm) { q[i].x = N.x + ex / dn * rm; q[i].y = N.y + ey / dn * rm; }
        else if (!fora[i] && dn > N.R * 0.97) { q[i].x = N.x + ex / dn * N.R * 0.97; q[i].y = N.y + ey / dn * N.R * 0.97; }
      }
      return q;
    }
    // a chegada ao terminal é refeita depois de todos os ajustes: do ponto A (onde começa a pista de pouso: a distância até o terminal, ao longo do vidro, é 1,2
    // vez a altura) até o vidro, uma curva de Hermite que continua a direção de A e termina de frente, sem quina nem gancho
    function chegaFinal(s, ax, p) {
      var v = ax.vent, n = p.length, i, k;
      if (!v || n < 14) return;
      var cx = v.cx, cy = v.cy, E = p[n - 1], rE = Math.hypot(E.x - cx, E.y - cy), aE = Math.atan2(E.y - cy, E.x - cx), LaMin = 40 * s + 12, LaMax = 300 * s + 50, acc = 0, ia = -1;
      for (i = n - 2; i > 4; i--) {
        acc += Math.hypot(p[i + 1].x - p[i].x, p[i + 1].y - p[i].y);
        if (acc < LaMin) continue;
        var ri = Math.hypot(p[i].x - cx, p[i].y - cy), xi = Math.abs(volta(Math.atan2(p[i].y - cy, p[i].x - cx) - aE)) * ri;
        if (xi >= 1.2 * (ri - rE) + 25 * s + 10 || acc >= LaMax) { ia = i; break; }   // um pouco antes do começo do cone: a emenda fica fora da descida
      }
      if (ia < 5) return;
      var j0 = ia - 3, j1 = Math.min(n - 1, ia + 3), tx = p[j1].x - p[j0].x, ty = p[j1].y - p[j0].y, tl = Math.hypot(tx, ty) || 1;
      var ch = chegada(cx, cy, p[ia], { x: tx / tl, y: ty / tl }, E, n - 1 - ia, Math.max(8, 14 * s));
      for (i = ia + 1; i < n; i++) p[i] = ch[i - ia - 1];
      for (k = 0; k < 6; k++) for (i = Math.max(2, ia - 4); i <= Math.min(n - 3, ia + 4); i++) { p[i].x += 0.4 * ((p[i - 1].x + p[i + 1].x) / 2 - p[i].x); p[i].y += 0.4 * ((p[i - 1].y + p[i + 1].y) / 2 - p[i].y); }
    }

  return { refinar: refinar };
}

);
// ---- fonte/ligacoes/tronco/parte.js
SF.parte({nome:'ligacoes/tronco',porta:2,compativelDesde:1,requer:['comum/cores@1','comum/curvas@2','ligacoes/caminho@1','ligacoes/ponta@2','ligacoes/pulso@1'],guarda:true,dom:false},
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
    function pintaEixo(ctxP, s, relogio, ax) {
      var w = ax.larg, ou = Math.max(0.9, 1.3 * s), cor = ax.corRgb, fim = ax.len - ponta.altVent(s) * 0.5, tr = trechos(s, ax), g, i;
      ctxP.lineCap = 'butt'; ctxP.lineJoin = 'bevel'; ctxP.miterLimit = 2; ctxP.globalCompositeOperation = 'source-over';
      var fio = new Path2D();                                    // só onde não há bainha: o começo, a cintura de cada nódulo e o fim
      if (!tr.length) caminhoSub(ax, 0, fim, fio);
      else { caminhoSub(ax, 0, tr[0][0] + 0.5, fio); for (i = 0; i + 1 < tr.length; i++) caminhoSub(ax, tr[i][1] - 0.5, tr[i + 1][0] + 0.5, fio); caminhoSub(ax, tr[tr.length - 1][1] - 0.5, fim, fio); }       // o fio nu, de ponta a ponta (aparece na cintura dos nódulos e perto da ponta)
      ctxP.strokeStyle = rgba(clar(cor), 0.85); ctxP.lineWidth = 0.40 * w; ctxP.stroke(fio);
      var mains = [new Path2D(), new Path2D()], tem = [false, false];
      tr.forEach(function (t) { var g2 = t[2] ? 1 : 0; tem[g2] = true; caminhoSub(ax, t[0], t[1], mains[g2]); });
      var dk = 'rgb(6,4,14)', c42 = rgba(esc(cor, 0.42), 1), c80 = rgba(esc(cor, 0.80), 1), cl = null;
      for (g = 0; g < 2; g++) {
        if (!tem[g]) continue; var q = w * QG[g * 2];
        ctxP.strokeStyle = c42; ctxP.lineWidth = q; ctxP.stroke(mains[g]);
        ctxP.strokeStyle = c80; ctxP.lineWidth = 0.60 * q; ctxP.stroke(mains[g]);
      }
      if (ax.pulso) {                                  // onde o potencial de ação passa, o axônio incha de leve
        var inch = new Path2D(); caminhoSub(ax, Math.max(0, ax.pulso.u - 26 * s), Math.min(fim, ax.pulso.u + 6 * s), inch);
        ctxP.strokeStyle = c42; ctxP.lineWidth = w * 1.16; ctxP.stroke(inch);
        ctxP.strokeStyle = c80; ctxP.lineWidth = 0.66 * w; ctxP.stroke(inch);
      }
      if (ax.sobre && ax.sobre.length) {              // o dendrito que passa por cima: o trecho dele é pintado por cima do axônio, na cor dele (sem buraco nem sombra)
        ctxP.save(); ctxP.lineCap = 'round'; ctxP.lineJoin = 'round';
        ax.sobre.forEach(function (d) { ctxP.strokeStyle = d.cor; ctxP.lineWidth = d.w; ctxP.beginPath(); ctxP.moveTo(d.x0, d.y0); ctxP.lineTo(d.x1, d.y1); ctxP.lineTo(d.x2, d.y2); ctxP.lineTo(d.x3, d.y3); ctxP.stroke(); });
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

);
