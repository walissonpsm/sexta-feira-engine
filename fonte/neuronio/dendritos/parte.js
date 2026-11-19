/* O desenho dos ramos (dendritos e telodendros): polígonos afilados, as bordas, a linha por dentro e as mitocôndrias. Só desenha: o contexto, os pontos {x,y,w}
 * e o nível de detalhe vêm de quem chama (neuronio/celula). Sem estado. */
function (usa) {
  'use strict';

  // Polígono afilado até ponta aguda (para dendritos)
  function drawSharpDendritePolygon(targetCtx, points, nivelAtual) {
    if (!points || points.length < 2) return;
    const leftSide = [];
    const rightSide = [];

    for (let i = 0; i < points.length; i++) {
      const p = points[i];
      const prev = points[Math.max(0, i - 1)];
      const next = points[Math.min(points.length - 1, i + 1)];
      const dx = next.x - prev.x;
      const dy = next.y - prev.y;
      const len = Math.hypot(dx, dy) || 1;
      const nx = -dy / len;
      const ny = dx / len;
      const halfWidth = p.w * 0.5;

      leftSide.push({ x: p.x + nx * halfWidth, y: p.y + ny * halfWidth });
      rightSide.push({ x: p.x - nx * halfWidth, y: p.y - ny * halfWidth });
    }

    targetCtx.beginPath();
    const tip = points[points.length - 1];
    if (nivelAtual >= 1) {                       // de perto: as bordas viram curvas (sem quinas entre os segmentos)
      trilhaSuave(targetCtx, leftSide, true);
      targetCtx.lineTo(tip.x, tip.y);
      trilhaSuave(targetCtx, rightSide.slice().reverse(), false);
    } else {
      targetCtx.moveTo(leftSide[0].x, leftSide[0].y);
      for (let i = 1; i < leftSide.length; i++) {
        targetCtx.lineTo(leftSide[i].x, leftSide[i].y);
      }
      targetCtx.lineTo(tip.x, tip.y);

      for (let i = rightSide.length - 1; i >= 0; i--) {
        targetCtx.lineTo(rightSide[i].x, rightSide[i].y);
      }
    }
    targetCtx.closePath();
    targetCtx.fill();
  }

  // Polígono encorpado e contínuo (para telodendros que se fundem aos bulbos terminais)
  function drawTaperedBranch(targetCtx, points, nivelAtual) {
    if (!points || points.length < 2) return;
    const left = [];
    const right = [];

    for (let i = 0; i < points.length; i++) {
      const p = points[i];
      const prev = points[Math.max(0, i - 1)];
      const next = points[Math.min(points.length - 1, i + 1)];
      const dx = next.x - prev.x;
      const dy = next.y - prev.y;
      const len = Math.hypot(dx, dy) || 1;
      const nx = -dy / len;
      const ny = dx / len;
      const hw = p.w * 0.5;

      left.push({ x: p.x + nx * hw, y: p.y + ny * hw });
      right.push({ x: p.x - nx * hw, y: p.y - ny * hw });
    }

    targetCtx.beginPath();
    if (nivelAtual >= 1) {
      trilhaSuave(targetCtx, left, true);
      trilhaSuave(targetCtx, right.slice().reverse(), false);
    } else {
      targetCtx.moveTo(left[0].x, left[0].y);
      for (let i = 1; i < left.length; i++) targetCtx.lineTo(left[i].x, left[i].y);
      for (let i = right.length - 1; i >= 0; i--) targetCtx.lineTo(right[i].x, right[i].y);
    }
    targetCtx.closePath();
    targetCtx.fill();
  }

  // Uma curva suave pelos pontos (quadráticas pelos pontos médios); 'inicio' começa um traço novo
  function trilhaSuave(c, pts, inicio) {
    if (!pts.length) return;
    if (inicio) c.moveTo(pts[0].x, pts[0].y); else c.lineTo(pts[0].x, pts[0].y);
    for (let i = 1; i < pts.length - 1; i++) c.quadraticCurveTo(pts[i].x, pts[i].y, (pts[i].x + pts[i + 1].x) / 2, (pts[i].y + pts[i + 1].y) / 2);
    if (pts.length > 1) c.lineTo(pts[pts.length - 1].x, pts[pts.length - 1].y);
  }
  // As duas bordas de um ramo afilado (as mesmas do polígono do ramo)
  function bordasRamo(points) {
    const L = [], R = [];
    for (let i = 0; i < points.length; i++) {
      const p = points[i], prev = points[Math.max(0, i - 1)], next = points[Math.min(points.length - 1, i + 1)];
      const dx = next.x - prev.x, dy = next.y - prev.y, len = Math.hypot(dx, dy) || 1, nx = -dy / len, ny = dx / len, hw = p.w * 0.5;
      L.push({ x: p.x + nx * hw, y: p.y + ny * hw });
      R.push({ x: p.x - nx * hw, y: p.y - ny * hw });
    }
    return { L: L, R: R };
  }
  // A linha que corre por dentro do ramo, a uma fração f da meia largura (f > 0 para um lado, f < 0 para o outro)
  function desviar(points, f) {
    return points.map(function (p, i) {
      const prev = points[Math.max(0, i - 1)], next = points[Math.min(points.length - 1, i + 1)];
      const dx = next.x - prev.x, dy = next.y - prev.y, len = Math.hypot(dx, dy) || 1;
      return { x: p.x - dy / len * p.w * f, y: p.y + dx / len * p.w * f };
    });
  }
  // Mitocôndrias ao longo de um ramo grosso: cápsulas com as cristas de dentro, sempre nos mesmos lugares (semente da célula)
  function mitocondrias(c, pts, ate, rnd, cor, u) {
    let falta = 6 + rnd() * 10;
    const fim = Math.floor(pts.length * ate);
    for (let i = 1; i < fim; i++) {
      const a = pts[i - 1], b = pts[i];
      falta -= Math.hypot(b.x - a.x, b.y - a.y);
      if (falta > 0) continue;
      falta = 14 + rnd() * 16;
      const jit = rnd(), giro = rnd();
      if (b.w < 2.2) continue;
      const ang = Math.atan2(b.y - a.y, b.x - a.x), off = (jit - 0.5) * b.w * 0.45;
      const comp = Math.min(7, 3.5 + b.w * 0.5), larg = Math.min(1.9, b.w * 0.28);
      c.save();
      c.translate(b.x - Math.sin(ang) * off, b.y + Math.cos(ang) * off);
      c.rotate(ang + (giro - 0.5) * 0.3);
      c.beginPath();
      if (typeof c.roundRect === 'function') c.roundRect(-comp / 2, -larg / 2, comp, larg, larg / 2); else c.rect(-comp / 2, -larg / 2, comp, larg);
      c.fillStyle = `rgba(${cor.dr}, ${cor.dg}, ${cor.db}, 0.78)`;
      c.fill();
      c.strokeStyle = `rgba(${cor.lr}, ${cor.lg}, ${cor.lb}, 0.9)`;
      c.lineWidth = 0.5 * u;
      c.stroke();
      c.beginPath();
      for (let k = -2; k <= 2; k++) { c.moveTo(k * comp * 0.16 - larg * 0.15, -larg * 0.36); c.lineTo(k * comp * 0.16 + larg * 0.15, larg * 0.36); }
      c.lineWidth = 0.35 * u;
      c.stroke();
      c.restore();
    }
  }

  return { poligonoAfilado: drawSharpDendritePolygon, ramoEncorpado: drawTaperedBranch, trilhaSuave: trilhaSuave, bordasRamo: bordasRamo, desviar: desviar, mitocondrias: mitocondrias };
}
