/* Sexta-Feira Engine v0.4.2: neuronio/recorte. a máscara da esfera e o corredor por onde o tronco do axônio sai dela (só geometria de recorte, sem desenho próprio).
 * Código movido sem reescrever de neuronio/celula: o estado vem de Est (a tabela dos campos está no LEIA-ME.md da juntadora e deste) e as funções
 * das irmãs chegam em d, passadas pela juntadora. Só desenha/calcula o que está na lista da porta. */
function (usa) {
  'use strict';

  function criar(Est, d) {
    var PAREDE = Est.PAREDE, VISTA_1 = Est.VISTA_1, opc = Est.opc, runtime = Est.runtime, vista = Est.vista;

// Fora da esfera: a passagem do tronco vai da parede até a borda do canvas e some aos poucos
        function alcanceFora() { return Math.max(24, runtime.width - (vista.cx + vista.Rpx) - 6); }

function recortaNaEsfera() { return opc.modo !== 'ligacoes' && (opc.saida || opc.raioMax !== Infinity); }

// O corredor por onde o tronco do axônio sai da esfera: a faixa onde o tronco passa (com folga) até a borda do canvas
        function corredorTronco() {
          if (!opc.saida) return null;
          const xi = vista.cx + vista.Rpx * 0.8;
          let y0 = Infinity, y1 = -Infinity;
          Est.anatomy.axonPath.forEach(function (p) {
            const X = vista.tx + p.x * vista.k, Y = vista.ty + p.y * vista.k;
            if (X >= xi) { y0 = Math.min(y0, Y); y1 = Math.max(y1, Y); }
          });
          Est.anatomy.terminalBranches.forEach(function (br) {
            br.pts.forEach(function (q) {
              const X = vista.tx + q.x * vista.k, Y = vista.ty + q.y * vista.k;
              if (X >= xi) { y0 = Math.min(y0, Y - 8 * vista.k * Est.anatomy.scale); y1 = Math.max(y1, Y + 8 * vista.k * Est.anatomy.scale); }
            });
          });
          if (!isFinite(y0)) return null;
          const pad = 14 * Est.anatomy.scale * vista.k + 6;
          return { x: xi, y: y0 - pad, w: Math.max(1, runtime.width - xi), h: (y1 - y0) + 2 * pad };
        }

// Com vários axônios o corredor segue cada um (uma faixa em volta do traço, mais a caixa dos terminais), em vez de um retângulo
        // alto: o resto de fora da parede continua cortado
        function corredorPolis() {
          const xi = vista.cx + vista.Rpx * 0.8, k = vista.k, pad = 14 * Est.anatomy.scale * k + 6, polis = [];
          [Est.anatomy].concat(Est.anatomy.extras || []).forEach(function (E) {
            const P = [];
            E.axonPath.forEach(function (p, j) { const X = vista.tx + p.x * k, Y = vista.ty + p.y * k; if (X >= xi && (j % 3 === 0 || j === E.axonPath.length - 1)) P.push({ x: X, y: Y }); });
            if (P.length < 2) return;
            const L = [], R = [];
            P.forEach(function (p, j) {
              const a = P[Math.max(0, j - 1)], b = P[Math.min(P.length - 1, j + 1)];
              let tx = b.x - a.x, ty = b.y - a.y; const m = Math.hypot(tx, ty) || 1; tx /= m; ty /= m;
              L.push({ x: p.x - ty * pad, y: p.y + tx * pad }); R.push({ x: p.x + ty * pad, y: p.y - tx * pad });
            });
            let poly = L.concat(R.reverse()), area = 0;
            for (let j = 0; j < poly.length; j++) { const u = poly[j], v = poly[(j + 1) % poly.length]; area += u.x * v.y - v.x * u.y; }
            if (area < 0) poly = poly.reverse();
            polis.push(poly);
            let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
            const poe = function (p) { const X = vista.tx + p.x * k, Y = vista.ty + p.y * k; if (X < x0) x0 = X; if (X > x1) x1 = X; if (Y < y0) y0 = Y; if (Y > y1) y1 = Y; };
            E.terminalBranches.forEach(function (br) { br.pts.forEach(poe); });
            E.terminalBoutons.forEach(function (bt) { poe({ x: bt.x - (bt.bThick || 0), y: bt.y - (bt.bWidth || 0) }); poe({ x: bt.x + (bt.bThick || 0), y: bt.y + (bt.bWidth || 0) }); });
            if (isFinite(x0)) { const m2 = pad * 0.8; polis.push([{ x: x0 - m2, y: y0 - m2 }, { x: x1 + m2, y: y0 - m2 }, { x: x1 + m2, y: y1 + m2 }, { x: x0 - m2, y: y1 + m2 }]); }
          });
          return polis;
        }

function caminhoCorredor(c) {
          if (opc.axonios > 1) {
            const polis = corredorPolis();
            polis.forEach(function (poly) { poly.forEach(function (p, j) { if (j) c.lineTo(p.x, p.y); else c.moveTo(p.x, p.y); }); c.closePath(); });
            return polis.length > 0;
          }
          const cor = corredorTronco();
          if (!cor) return false;
          c.moveTo(cor.x, cor.y); c.rect(cor.x, cor.y, cor.w, cor.h);
          return true;
        }

// o recorte da esfera + corredores não muda entre os quadros: monta uma vez (Path2D) e reaproveita
        function recorte2D() {
          if (!vista.recorte2D) { const p = new Path2D(); caminhoRecorte(p); vista.recorte2D = p; }
          return vista.recorte2D;
        }

function caminhoRecorte(c) {
          c.arc(vista.cx, vista.cy, vista.Rpx * PAREDE, 0, Math.PI * 2);   // os dendritos terminam na parede interna do vidro
          caminhoCorredor(c);
        }

function montarMascara(W, H, v) {
          v = v || VISTA_1;
          const m = document.createElement('canvas');
          m.width = W; m.height = H;
          const c = m.getContext('2d');
          c.setTransform(runtime.dpr * v.z, 0, 0, runtime.dpr * v.z, runtime.dpr * v.ox, runtime.dpr * v.oy);
          c.fillStyle = '#fff';
          c.beginPath(); c.arc(vista.cx, vista.cy, vista.Rpx * PAREDE, 0, Math.PI * 2); c.fill();
          const gm = c.createLinearGradient(vista.cx + vista.Rpx, 0, runtime.width, 0);
          gm.addColorStop(0, 'rgba(255, 255, 255, 1)');
          gm.addColorStop(0.5, 'rgba(255, 255, 255, 0.97)');
          gm.addColorStop(1, 'rgba(255, 255, 255, 0.92)');
          c.beginPath();
          if (caminhoCorredor(c)) { c.fillStyle = gm; c.fill(); }
          return m;
        }

function fadeFora(x, y) {
          if (!opc.saida) return 1;
          const X = vista.tx + x * vista.k, Y = vista.ty + y * vista.k;
          const dd = Math.hypot(X - vista.cx, Y - vista.cy) - vista.Rpx;
          if (dd <= 0) return 1;
          const u = Math.min(1, dd / alcanceFora());
          return 1 - 0.1 * u;
        }

    return { alcanceFora: alcanceFora, recortaNaEsfera: recortaNaEsfera, corredorTronco: corredorTronco, corredorPolis: corredorPolis, caminhoCorredor: caminhoCorredor, recorte2D: recorte2D, caminhoRecorte: caminhoRecorte, montarMascara: montarMascara, fadeFora: fadeFora };
  }

  return { criar: criar };
}
