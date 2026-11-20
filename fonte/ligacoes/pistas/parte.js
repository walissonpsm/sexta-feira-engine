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
