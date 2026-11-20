/* Geometria de caminhos: a curva suave por pontos (Catmull-Rom reamostrada em passos iguais), pontos polares, ângulo e suavização e, desde a v0.5.0, as duas
 * curvas em volta de um centro que o axônio usa para sair do agente e chegar ao vidro do Núcleo (`ponte` e `chegada`). Funções puras, sem guarda. */
function (usa) {
  'use strict';
  // Catmull-Rom centrípeta (Barry-Goldman) por uma lista de pontos, depois reamostrada em passos iguais (px)
  function curva(pts, passo) {
    var n = pts.length, P = [{ x: 2 * pts[0].x - pts[1].x, y: 2 * pts[0].y - pts[1].y }].concat(pts, [{ x: 2 * pts[n - 1].x - pts[n - 2].x, y: 2 * pts[n - 1].y - pts[n - 2].y }]);
    var denso = [], dist = function (a, b) { return Math.pow(Math.hypot(b.x - a.x, b.y - a.y) + 1e-6, 0.5); };
    var mix = function (a, b, u) { return { x: a.x + (b.x - a.x) * u, y: a.y + (b.y - a.y) * u }; };
    for (var i = 0; i < n - 1; i++) {
      var p0 = P[i], p1 = P[i + 1], p2 = P[i + 2], p3 = P[i + 3];
      var t0 = 0, t1 = t0 + dist(p0, p1), t2 = t1 + dist(p1, p2), t3 = t2 + dist(p2, p3);
      var seg = Math.max(8, Math.ceil(Math.hypot(p2.x - p1.x, p2.y - p1.y) / 2));
      for (var s = 0; s < seg; s++) {
        var t = t1 + (t2 - t1) * s / seg;
        var A1 = mix(p0, p1, (t - t0) / (t1 - t0)), A2 = mix(p1, p2, (t - t1) / (t2 - t1)), A3 = mix(p2, p3, (t - t2) / (t3 - t2));
        var B1 = mix(A1, A2, (t - t0) / (t2 - t0)), B2 = mix(A2, A3, (t - t1) / (t3 - t1));
        denso.push(mix(B1, B2, (t - t1) / (t2 - t1)));
      }
    }
    denso.push({ x: pts[n - 1].x, y: pts[n - 1].y });
    var acum = [0];
    for (var j = 1; j < denso.length; j++) acum.push(acum[j - 1] + Math.hypot(denso[j].x - denso[j - 1].x, denso[j].y - denso[j - 1].y));
    var total = acum[acum.length - 1], out = [], k = 0, m = Math.max(8, Math.round(total / passo));
    for (var q = 0; q <= m; q++) {
      var alvo = total * q / m;
      while (k < acum.length - 2 && acum[k + 1] < alvo) k++;
      var f = (alvo - acum[k]) / Math.max(1e-9, acum[k + 1] - acum[k]);
      out.push({ x: denso[k].x + (denso[k + 1].x - denso[k].x) * f, y: denso[k].y + (denso[k + 1].y - denso[k].y) * f });
    }
    return out;
  }
  function volta(a) { while (a > Math.PI) a -= 2 * Math.PI; while (a < -Math.PI) a += 2 * Math.PI; return a; }
  function polar(cx, cy, r, a) { return { x: cx + r * Math.cos(a), y: cy + r * Math.sin(a) }; }
  function suave(u) { u = Math.max(0, Math.min(1, u)); return u * u * (3 - 2 * u); }
  // v0.5.0: as duas curvas "em volta de um centro" (cx, cy), usadas pelo axônio de ligações/pistas e de ligacoes/caminho. As duas descrevem o caminho por raio e ângulo
  // em torno do centro (o Núcleo) com polinômios de Hermite que NÃO voltam atrás (Fritsch-Carlson: a inclinação nunca passa de 3x a inclinação média do trecho),
  // então a curva nunca mergulha no vidro nem recua em ângulo; saem reamostradas em passos quase iguais (o último ponto é sempre o ponto final pedido).
  function igual(D, c, m) {
    var K = D.length - 1, L = c[K], out = [], k = 1, i, al, f;
    for (i = 1; i <= m; i++) {
      al = L * i / m; while (k < K && c[k] < al) k++;
      f = (al - c[k - 1]) / Math.max(1e-9, c[k] - c[k - 1]); out.push({ x: D[k - 1].x + (D[k].x - D[k - 1].x) * f, y: D[k - 1].y + (D[k].y - D[k - 1].y) * f });
    }
    return out;
  }
  // A chegada a um terminal no vidro de um círculo de centro (cx, cy): do ponto A, seguindo a direção tA (unitária), até E. O raio desce (Hermite cúbica) sem entrar no
  // vidro antes de E, o ângulo avança (Hermite de grau 5, que termina com a curva já reta) e os últimos hq px são uma reta de frente para o centro (a pista de pouso do
  // terminal). Sem quina em A e sem gancho. Devolve m pontos (sem A, com E).
  function chegada(cx, cy, A, tA, E, m, hq) {
    var rA = Math.hypot(A.x - cx, A.y - cy), aA = Math.atan2(A.y - cy, A.x - cx), rE = Math.hypot(E.x - cx, E.y - cy), aE = Math.atan2(E.y - cy, E.x - cx), dA = volta(aE - aA);
    var hQ = Math.max(0, Math.min(hq || 0, 0.45 * (rA - rE))), rQ = rE + hQ, Dr = rQ - rA;
    var ux = Math.cos(aA), uy = Math.sin(aA), lam = Math.hypot(rA * dA, Dr) * 1.1 + 1e-6;
    var r0 = lam * (tA.x * ux + tA.y * uy), t0 = lam * (-tA.x * uy + tA.y * ux) / Math.max(rA, 1e-6), r1 = Dr < 0 ? Math.max(3 * Dr, -1.1 * lam) : 0;
    if (Dr < 0 && r0 < 3 * Dr) r0 = 3 * Dr;
    if (t0 * dA < 0) t0 = 0; else if (Math.abs(t0) > 2.5 * Math.abs(dA)) t0 = 2.5 * dA;
    var D = [{ x: A.x, y: A.y }], c = [0], i, u, u2, u3, u4, u5, r, a;
    for (i = 1; i <= 64; i++) {
      u = i / 64; u2 = u * u; u3 = u2 * u; u4 = u3 * u; u5 = u4 * u;
      r = (2 * u3 - 3 * u2 + 1) * rA + (u3 - 2 * u2 + u) * r0 + (3 * u2 - 2 * u3) * rQ + (u3 - u2) * r1;
      a = aA + (u - 6 * u3 + 8 * u4 - 3 * u5) * t0 + (10 * u3 - 15 * u4 + 6 * u5) * dA;
      D.push({ x: cx + r * Math.cos(a), y: cy + r * Math.sin(a) });
    }
    var nq = Math.max(1, Math.ceil(hQ / 2));
    for (i = 1; i <= nq; i++) { r = rQ - hQ * i / nq; D.push({ x: cx + r * Math.cos(aE), y: cy + r * Math.sin(aE) }); }
    for (i = 1; i < D.length; i++) c.push(c[i - 1] + Math.hypot(D[i].x - D[i - 1].x, D[i].y - D[i - 1].y));
    var out = igual(D, c, m);
    out[m - 1] = { x: E.x, y: E.y };
    return out;
  }
  // A ponte entre dois pontos em volta de um centro (cx, cy): sai de A na direção tA e chega a B na direção tB (unitárias). Raio e ângulo são curvas de Hermite que
  // não voltam. Serve para a descida do axônio da saída do agente até a pista em volta do Núcleo (sem mergulho nem quina). Devolve m pontos (sem A, com B).
  function ponte(cx, cy, A, tA, B, tB, m) {
    var rA = Math.hypot(A.x - cx, A.y - cy), aA = Math.atan2(A.y - cy, A.x - cx), rB = Math.hypot(B.x - cx, B.y - cy), aB = Math.atan2(B.y - cy, B.x - cx), dA = volta(aB - aA), Dr = rB - rA;
    var lam = Math.hypot((rA + rB) / 2 * dA, Dr) * 1.1 + 1e-6;
    var fc = function (d, D) { if (d * D < 0 || Math.abs(D) < 1e-9) return 0; return Math.abs(d) > 3 * Math.abs(D) ? 3 * D : d; };
    var r0 = fc(lam * (tA.x * Math.cos(aA) + tA.y * Math.sin(aA)), Dr), t0 = fc(lam * (-tA.x * Math.sin(aA) + tA.y * Math.cos(aA)) / Math.max(rA, 1e-6), dA);
    var r1 = fc(lam * (tB.x * Math.cos(aB) + tB.y * Math.sin(aB)), Dr), t1 = fc(lam * (-tB.x * Math.sin(aB) + tB.y * Math.cos(aB)) / Math.max(rB, 1e-6), dA);
    var D = [{ x: A.x, y: A.y }], c = [0], i, u, u2, u3, r, a, h00, h10, h01, h11;
    for (i = 1; i <= 64; i++) {
      u = i / 64; u2 = u * u; u3 = u2 * u; h00 = 2 * u3 - 3 * u2 + 1; h10 = u3 - 2 * u2 + u; h01 = 3 * u2 - 2 * u3; h11 = u3 - u2;
      r = h00 * rA + h10 * r0 + h01 * rB + h11 * r1; a = aA + h10 * t0 + h01 * dA + h11 * t1;
      D.push({ x: cx + r * Math.cos(a), y: cy + r * Math.sin(a) }); c.push(c[i - 1] + Math.hypot(D[i].x - D[i - 1].x, D[i].y - D[i - 1].y));
    }
    var out = igual(D, c, m);
    out[m - 1] = { x: B.x, y: B.y };
    return out;
  }
  return { curva: curva, volta: volta, polar: polar, suave: suave, chegada: chegada, ponte: ponte };
}
