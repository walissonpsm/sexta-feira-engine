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
