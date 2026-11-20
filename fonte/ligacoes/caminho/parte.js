/* O ajuste fino do caminho de um axônio (v0.5.0), como um galho que passa em volta do que encontra: parte do esboço (`ax.base`, de ligacoes/pistas), ondula de leve,
 * contorna as esferas e os neurônios do caminho (`ax.obst`), se afasta de quem corre junto dele (`ax.vizG`), arredonda as quinas e refaz a chegada ao terminal. Não desenha:
 * devolve a lista de pontos e só guarda em `ax.ck` o ponto de partida das rodadas seguintes do MESMO axônio (ver o passo 40 em `refinar`). Tem guarda: se der erro, só esta parte
 * cai e o tronco (ligacoes/tronco) fica com o esboço, que já é um caminho inteiro. */
function (usa) {
  'use strict';
  var suave = usa.curvas.suave, volta = usa.curvas.volta, chegada = usa.curvas.chegada;
  // listas de trabalho do ajuste, reaproveitadas de uma chamada para outra (o ajuste roda uma de cada vez): evitam alocar e limpar uns 200 KB a cada axônio
  var gcapO = 1024, gPO = new Int32Array(gcapO);
  var gcapV = 4096, gPX = new Float64Array(gcapV), gPY = new Float64Array(gcapV), gPRV = new Float64Array(gcapV), gPTX = new Float64Array(gcapV), gPTY = new Float64Array(gcapV), gPK = new Int32Array(gcapV);
    // A rota "de GPS": parte do esboço (`ax.base`), arredonda as quinas e contorna os obstáculos (esferas e neurônios), como um galho que passa em volta do que
    // encontra. O que está fora do Núcleo fica fora (com folga) e o que está dentro fica dentro. As pontas não se mexem. Devolve a lista de pontos (a própria
    // `ax.base` quando não há o que ajustar: menos de 5 pontos ou sem lista de obstáculos).
    function refinar(s, ax) {
      var b = ax.base, n = b.length, i, o;
      if (n < 5 || !ax.obst) return b;
      var N = ax.nucleo, folgaN = ax.larg * 0.8 + 3 * s, prende = 2;
      // os pontos ficam em listas de números (X, Y): o ajuste faz milhões de contas por ponto e as listas simples são bem mais rápidas que objetos {x, y}
      var X = new Float64Array(n), Y = new Float64Array(n), fora = new Uint8Array(n), rMin = new Float64Array(n), rB = new Float64Array(n);
      for (i = 0; i < n; i++) {
        X[i] = b[i].x; Y[i] = b[i].y;
        var dN = N ? Math.hypot(X[i] - N.x, Y[i] - N.y) : 0;
        fora[i] = !N || dN > N.R * 0.985 ? 1 : 0; rMin[i] = N ? dN - 6 * s : 0;
      }
      // o limite da pista (rMin, guardado por ponto) só vale onde a linha corre em volta do Núcleo (na pista); onde ela desce (saindo do agente ou chegando ao
      // terminal) o limite some aos poucos: um ponto que escorrega da pista para a descida não fica preso na altura da pista (seria um degrau)
      if (N) for (i = 0; i < n; i++) {
        var a = b[Math.max(0, i - 1)], c = b[Math.min(n - 1, i + 1)], tl = Math.hypot(c.x - a.x, c.y - a.y) || 1, ex = X[i] - N.x, ey = Y[i] - N.y, dn = Math.hypot(ex, ey) || 1;
        var g = Math.abs(((c.x - a.x) * ex + (c.y - a.y) * ey) / (tl * dn)), lam = suave((0.35 - g) / 0.25), r0 = N.R + folgaN;
        rB[i] = r0 + lam * Math.max(0, rMin[i] - r0);
      }
      // a ondulação orgânica entra ANTES do ajuste (assim a separação dos vizinhos vale para o desenho final)
      var cu = [0]; for (i = 1; i < n; i++) cu[i] = cu[i - 1] + Math.hypot(b[i].x - b[i - 1].x, b[i].y - b[i - 1].y);
      var Lb = cu[n - 1], fz = ax.fase || 0, Aw = Math.max(5, 26 * s), ent = Math.max(30, 60 * s), entF = Math.max(ent, 190 * s);   // perto do terminal a ondulação some devagar
      // a zona de chegada (a pista de pouso que já vem desenhada no esboço, de frente para o vidro) fica como foi desenhada: sem ondulação, sem alisamento e sem
      // se afastar dos vizinhos (são eles que se afastam dela). Perto da emenda o efeito entra aos poucos (rampa), para não fazer quina.
      var wA = new Float64Array(n), v0 = ax.vent, fixa = false;
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
        var tx0 = b[i + 1].x - b[i - 1].x, ty0 = b[i + 1].y - b[i - 1].y, tl0 = Math.hypot(tx0, ty0) || 1, en = Math.min(1, cu[i] / ent, (Lb - cu[i]) / entF);
        en = en <= 0 ? 0 : en * en * (3 - 2 * en);
        var ow = Aw * en * (1 - wA[i]) * (0.65 * Math.sin(cu[i] / (150 * s + 46) + fz * 3.1) + 0.35 * Math.sin(cu[i] / (52 * s + 18) + fz * 7.3));
        X[i] += -ty0 / tl0 * ow; Y[i] += tx0 / tl0 * ow;
      }
      var p0x = Float64Array.from(X), p0y = Float64Array.from(Y);
      // só os obstáculos que podem chegar perto da linha (os outros só gastariam conta)
      var bx0 = 1e9, by0 = 1e9, bx1 = -1e9, by1 = -1e9;
      for (i = 0; i < n; i++) { if (X[i] < bx0) bx0 = X[i]; if (X[i] > bx1) bx1 = X[i]; if (Y[i] < by0) by0 = Y[i]; if (Y[i] > by1) by1 = Y[i]; }
      var obs = ax.obst.filter(function (o2) { var m = o2.r * 1.25 + ax.larg * 0.6 + 60; return o2.x > bx0 - m && o2.x < bx1 + m && o2.y > by0 - m && o2.y < by1 + m; });
      // Nos 40 primeiros passos o ajuste ainda não olha os vizinhos (`vizG`), então o estado no passo 40 só depende do esboço, dos obstáculos e do Núcleo: a primeira chamada de um
      // axônio o guarda (`ax.ck`) e as rodadas seguintes, que mudam só os vizinhos, partem dali em vez de refazer os 40 passos. O guardado só vale para as MESMAS entradas.
      var ck = ax.ck, desde = 0;
      if (ck && ck.base === b && ck.obst === ax.obst && ck.nuc === N && ck.s === s && ck.X) { X.set(ck.X); Y.set(ck.Y); desde = 40; }
      else ck = ax.ck = { base: b, obst: ax.obst, nuc: N, s: s, X: null, Y: null };
      relaxa(X, Y, n, prende, wA, fora, rB, N, obs, ax, ax.vizG, desde, ck);
      // na rampa antes da emenda o deslocamento do ajuste encolhe aos poucos até zero (no fim do ajuste, não a cada passo: a cada passo o ponto acabava
      // chegando lá do mesmo jeito e a quina ficava na emenda)
      for (i = 0; i < n; i++) if (wA[i] > 0 && wA[i] < 1) { var wq = 1 - wA[i]; X[i] = p0x[i] + (X[i] - p0x[i]) * wq; Y[i] = p0y[i] + (Y[i] - p0y[i]) * wq; }
      alisa(X, Y, n, prende, N, fora, rB, wA);
      var p = new Array(n);
      for (i = 0; i < n; i++) p[i] = { x: X[i], y: Y[i] };
      if (!fixa) chegaFinal(s, ax, p);
      return p;
    }
    // O ajuste em si: 200 passos; a cada passo cada ponto (menos as pontas e a pista de pouso) anda um pouco em direção ao meio dos vizinhos da linha, é empurrado para
    // fora das esferas e dos neurônios, se afasta dos outros axônios que correm junto dele e fica do lado certo do Núcleo.
    // Quase sempre a resposta para "tem alguém encostando?" é não. Por isso cada ponto guarda a lista de quem PODE encostar nele enquanto estiver no mesmo quadradinho
    // (4 px de lado) e só a refaz quando muda de quadradinho. Quem fica de fora da lista está longe demais do quadradinho inteiro para encostar no ponto, então o resultado
    // é o mesmo de olhar todos, só sem as contas inúteis. Depois de um empurrão o ponto sai do quadradinho: aí vale a lista inteira (de todos da célula) para quem falta.
    function relaxa(X, Y, n, prende, wA, fora, rB, N, obs, ax, V, desde, ck) {
      var it, i, k, nO = obs.length, SUB = 4, INV = 0.25;
      var oX = new Float64Array(nO), oY = new Float64Array(nO), oR = new Float64Array(nO), oR2 = new Float64Array(nO);
      for (k = 0; k < nO; k++) { oX[k] = obs[k].x; oY[k] = obs[k].y; oR[k] = obs[k].r * 1.25 + ax.larg * 0.6; oR2[k] = oR[k] * oR[k]; }
      var larg = ax.larg, id = ax.id, vcel = V ? V.cel : 12, vfolga = V ? V.folga : 0, vm = V ? V.m : null;
      var nR = N ? N.R * 0.97 : 0, nR2 = nR * nR, nx = N ? N.x : 0, ny = N ? N.y : 0, nRR = N ? N.R : 0;
      // listas de quem pode encostar: obstáculos (PO: índices) e vizinhos (PX.. : a lista inteira da célula; PK: índices dos que estão perto do quadradinho)
      var capO = gcapO, PO = gPO, capV = gcapV, PX = gPX, PY = gPY, PRV = gPRV, PTX = gPTX, PTY = gPTY, PK = gPK, topO = 0, topV = 0, topK = 0;
      var ocx = new Int32Array(n).fill(0x7fffffff), ocy = new Int32Array(n).fill(0x7fffffff), oS = new Int32Array(n), oN = new Int32Array(n);
      var ncx = new Int32Array(n).fill(0x7fffffff), ncy = new Int32Array(n).fill(0x7fffffff), fS = new Int32Array(n), fN = new Int32Array(n), kS = new Int32Array(n), kN = new Int32Array(n);
      for (it = desde; it < 200; it++) {
        if (it === 40 && !ck.X) { ck.X = Float64Array.from(X); ck.Y = Float64Array.from(Y); }
        var comV = V && it >= 40 && it < 188;
        for (i = prende; i < n - prende; i++) {
          if (wA[i] >= 1) continue;
          var qx = X[i], qy = Y[i];
          qx += 0.42 * ((X[i - 1] + X[i + 1]) / 2 - qx); qy += 0.42 * ((Y[i - 1] + Y[i + 1]) / 2 - qy);
          // obstáculos (esferas e neurônios do caminho): empurra o ponto para fora
          var sx = Math.floor(qx * INV), sy = Math.floor(qy * INV);
          if (sx !== ocx[i] || sy !== ocy[i]) {
            ocx[i] = sx; ocy[i] = sy;
            var rx0 = sx * SUB, rx1 = rx0 + SUB, ry0 = sy * SUB, ry1 = ry0 + SUB;
            if (topO + nO > capO) { capO = Math.max(capO * 2, topO + nO); var PO2 = new Int32Array(capO); PO2.set(PO); PO = PO2; }
            oS[i] = topO;
            for (k = 0; k < nO; k++) {
              var ex1 = oX[k] < rx0 ? rx0 - oX[k] : oX[k] > rx1 ? oX[k] - rx1 : 0, ey1 = oY[k] < ry0 ? ry0 - oY[k] : oY[k] > ry1 ? oY[k] - ry1 : 0;
              if (ex1 * ex1 + ey1 * ey1 < oR2[k]) PO[topO++] = k;
            }
            oN[i] = topO - oS[i];
          }
          var pushO = false;
          for (var a1 = oS[i], a2 = oS[i] + oN[i]; a1 < a2; a1++) {
            k = PO[a1];
            var dx = qx - oX[k], dy = qy - oY[k], d2 = dx * dx + dy * dy;
            if (d2 < oR2[k]) {
              var d = Math.sqrt(dx * dx + dy * dy), rr = oR[k];
              if (d < rr && d > 1e-6) {
                var f = (rr - d) * 0.25; qx += dx / d * f; qy += dy / d * f; pushO = true;
                // o ponto saiu do lugar: para os obstáculos que faltam vale a lista inteira
                for (var k3 = k + 1; k3 < nO; k3++) {
                  var dx3 = qx - oX[k3], dy3 = qy - oY[k3], d23 = dx3 * dx3 + dy3 * dy3;
                  if (d23 < oR2[k3]) {
                    var d3 = Math.sqrt(dx3 * dx3 + dy3 * dy3), rr3 = oR[k3];
                    if (d3 < rr3 && d3 > 1e-6) { var f3 = (rr3 - d3) * 0.25; qx += dx3 / d3 * f3; qy += dy3 / d3 * f3; }
                  }
                }
                break;
              }
            }
          }
          if (comV) {                       // não correr em cima de outro axônio (cruzar pode; ficar por cima ao longo, não)
            var tx, ty;
            if (pushO) { tx = Math.floor(qx * INV); ty = Math.floor(qy * INV); } else { tx = sx; ty = sy; }
            if (tx !== ncx[i] || ty !== ncy[i]) {
              ncx[i] = tx; ncy[i] = ty;
              var mx0 = tx * SUB, mx1 = mx0 + SUB, my0 = ty * SUB, my1 = my0 + SUB;
              var gxa = Math.floor(mx0 / vcel) - 1, gxb = Math.floor(mx1 / vcel) + 1, gya = Math.floor(my0 / vcel) - 1, gyb = Math.floor(my1 / vcel) + 1;
              fS[i] = topV; kS[i] = topK;
              for (var gx = gxa; gx <= gxb; gx++) for (var gy = gya; gy <= gyb; gy++) {
                var L2 = vm[(gx + 4096) * 8192 + gy + 4096]; if (!L2) continue;   // chave numérica (a de texto deixava a montagem lenta)
                if (topV + L2.length > capV) {
                  capV = Math.max(capV * 2, topV + L2.length);
                  var g1 = new Float64Array(capV); g1.set(PX); PX = g1; g1 = new Float64Array(capV); g1.set(PY); PY = g1; g1 = new Float64Array(capV); g1.set(PRV); PRV = g1;
                  g1 = new Float64Array(capV); g1.set(PTX); PTX = g1; g1 = new Float64Array(capV); g1.set(PTY); PTY = g1; var g2 = new Int32Array(capV); g2.set(PK); PK = g2;
                }
                for (var j = 0; j < L2.length; j++) {
                  var w0 = L2[j]; if (w0.id === id) continue;
                  var rv0 = (larg + w0.l) * 0.5 + vfolga, ex0 = w0.x < mx0 ? mx0 - w0.x : w0.x > mx1 ? w0.x - mx1 : 0, ey0 = w0.y < my0 ? my0 - w0.y : w0.y > my1 ? w0.y - my1 : 0;
                  PX[topV] = w0.x; PY[topV] = w0.y; PRV[topV] = rv0; PTX[topV] = w0.tx === undefined ? NaN : w0.tx; PTY[topV] = w0.ty;
                  if (ex0 * ex0 + ey0 * ey0 < rv0 * rv0) PK[topK++] = topV;
                  topV++;
                }
              }
              fN[i] = topV - fS[i]; kN[i] = topK - kS[i];
            }
            if (kN[i] > 0) {
              // só se afasta de quem corre junto (quase paralelo); num cruzamento, nada de desviar (o desvio faria um degrau na linha)
              var qtx0 = X[i + 1] - X[i - 1], qty0 = Y[i + 1] - Y[i - 1], qtl = Math.sqrt(qtx0 * qtx0 + qty0 * qty0) || 1, qtx = qtx0 / qtl, qty = qty0 / qtl;
              for (var c1 = kS[i], c2 = kS[i] + kN[i]; c1 < c2; c1++) {
                var t = PK[c1], vx = qx - PX[t], vy = qy - PY[t], rv = PRV[t];
                if (vx * vx + vy * vy < rv * rv) {
                  var dv = Math.sqrt(vx * vx + vy * vy), pt = PTX[t], par = pt !== pt ? 1 : Math.min(1, Math.max(0, (Math.abs(qtx * pt + qty * PTY[t]) - 0.72) / 0.22));
                  if (par > 0 && dv < rv && dv > 1e-6) {
                    var fv = (rv - dv) * 0.15 * par; qx += vx / dv * fv; qy += vy / dv * fv;
                    // o ponto saiu do lugar: para quem falta vale a lista inteira da célula (a lista do quadradinho era para o ponto de antes do empurrão)
                    for (var u = t + 1, ue = fS[i] + fN[i]; u < ue; u++) {
                      var vx4 = qx - PX[u], vy4 = qy - PY[u], rv4 = PRV[u];
                      if (vx4 * vx4 + vy4 * vy4 < rv4 * rv4) {
                        var dv4 = Math.sqrt(vx4 * vx4 + vy4 * vy4), pt4 = PTX[u], par4 = pt4 !== pt4 ? 1 : Math.min(1, Math.max(0, (Math.abs(qtx * pt4 + qty * PTY[u]) - 0.72) / 0.22));
                        if (par4 > 0 && dv4 < rv4 && dv4 > 1e-6) { var fv4 = (rv4 - dv4) * 0.15 * par4; qx += vx4 / dv4 * fv4; qy += vy4 / dv4 * fv4; }
                      }
                    }
                    break;
                  }
                }
              }
            }
          }
          if (N) {
            var ex = qx - nx, ey = qy - ny, rm = rB[i], e2 = ex * ex + ey * ey;
            if (fora[i] ? e2 < rm * rm : e2 > nR2) {                       // cada axônio guarda a sua pista em volta do Núcleo (não se juntam no vidro)
              var dn = Math.sqrt(ex * ex + ey * ey) || 1;
              if (fora[i] && dn < rm) { qx = nx + ex / dn * rm; qy = ny + ey / dn * rm; }
              else if (!fora[i] && dn > nRR * 0.97) { qx = nx + ex / dn * nRR * 0.97; qy = ny + ey / dn * nRR * 0.97; }
            }
          }
          X[i] = qx; Y[i] = qy;
        }
      }
      gcapO = capO; gPO = PO; gcapV = capV; gPX = PX; gPY = PY; gPRV = PRV; gPTX = PTX; gPTY = PTY; gPK = PK;
    }
    // o alisamento final (Taubin: tira as quinas pequenas sem encolher a curva); depois, quem está fora do Núcleo continua fora
    function alisa(X, Y, n, prende, N, fora, rB, wA) {
      var i, k, QX = Float64Array.from(X), QY = Float64Array.from(Y), TX = new Float64Array(n), TY = new Float64Array(n);
      for (k = 0; k < 16; k++) {
        var f = k % 2 ? -0.53 : 0.5;
        for (i = prende; i < n - prende; i++) { TX[i] = QX[i] + f * ((QX[i - 1] + QX[i + 1]) / 2 - QX[i]); TY[i] = QY[i] + f * ((QY[i - 1] + QY[i + 1]) / 2 - QY[i]); }
        for (i = prende; i < n - prende; i++) if (wA[i] < 1) { QX[i] = TX[i]; QY[i] = TY[i]; }
      }
      for (i = prende; i < n - prende; i++) if (wA[i] > 0 && wA[i] < 1) { var w = 1 - wA[i]; QX[i] = X[i] + (QX[i] - X[i]) * w; QY[i] = Y[i] + (QY[i] - Y[i]) * w; }
      if (N) for (i = prende; i < n - prende; i++) {
        if (wA[i] > 0) continue;
        var ex = QX[i] - N.x, ey = QY[i] - N.y, dn = Math.hypot(ex, ey) || 1, rm = rB[i];
        if (fora[i] && dn < rm) { QX[i] = N.x + ex / dn * rm; QY[i] = N.y + ey / dn * rm; }
        else if (!fora[i] && dn > N.R * 0.97) { QX[i] = N.x + ex / dn * N.R * 0.97; QY[i] = N.y + ey / dn * N.R * 0.97; }
      }
      for (i = 0; i < n; i++) { X[i] = QX[i]; Y[i] = QY[i]; }
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
