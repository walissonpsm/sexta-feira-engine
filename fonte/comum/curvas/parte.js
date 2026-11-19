/* Geometria de caminhos: a curva suave por pontos (Catmull-Rom reamostrada em passos iguais), pontos polares, ângulo e suavização. Funções puras, sem guarda. */
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
  return { curva: curva, volta: volta, polar: polar, suave: suave };
}
