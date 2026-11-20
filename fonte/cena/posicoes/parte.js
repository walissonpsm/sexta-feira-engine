/* Sexta-Feira Engine v0.4.2: cena/posicoes. as posições e os tamanhos da cena: o desenho em unidades da cena (UC), a posição de cada esfera, o canal de ligação, medir para o palco, e as caixas e contornos que as ligações usam.
 * Código movido sem reescrever de neuronio/celula: o estado vem de Est (a tabela dos campos está no LEIA-ME.md da juntadora e deste) e as funções
 * das irmãs chegam em d, passadas pela juntadora. Só desenha/calcula o que está na lista da porta. */
function (usa) {
  'use strict';

  function criar(Est, d) {
    var UC = Est.UC;
    var volta = usa.curvas.volta;
    var cfg = Est.cfg, esf = Est.esf;
var POS = posicoes();

// ---------------------------------------------------------------- posições (em UC) e as esferas
    function posicoes() {
      var p = {}, ag = cfg.agentes, esq = ag.filter(function (a) { return a.lado === 'esq'; }), dir = ag.filter(function (a) { return a.lado === 'dir'; });
      p.nucleo = { x: UC.nucleo.x, y: UC.nucleo.y, r: UC.nucleo.r };
      esq.forEach(function (a, i) { p[a.id] = { x: -UC.ax, y: (i - 1) * UC.ay, r: UC.agente }; });
      dir.forEach(function (a, i) { p[a.id] = { x: UC.ax, y: (i - 1) * UC.ay, r: UC.agente }; });
      if (cfg.satelite) {
        var junto = p[cfg.satelite.junto] || p.nucleo, d = Math.hypot(-300, -150), r = UC.agente + UC.sat + 10;
        p[cfg.satelite.id] = { x: junto.x + (-300 / d) * r, y: junto.y + (-150 / d) * r, r: UC.sat };
      }
      return p;
    }

// o canal de cada agente no Núcleo (dentro da folga entre dendritos: à direita em torno de 0°, à esquerda em torno de 163,5°) e o ângulo,
    // visto do agente, até ele
    function canalUC(a) {
      var p = POS[a.id], dir = Math.atan2(p.y, p.x), gc = a.lado === 'dir' ? 0 : Math.PI - 16.5 * Math.PI / 180, gam = a.lado === 'dir' ? 0.70 : 0.65;
      var th = gc + gam * volta(dir - gc), wx = 475 * Math.cos(th), wy = 475 * Math.sin(th);
      return { th: th, phi: Math.atan2(wy - p.y, wx - p.x) };
    }

// ---------------------------------------------------------------- tamanho e posição de tudo
    function medir() {
      var curto = Est.H < 520, topo = curto ? 34 : 44, base = curto ? 54 : 76;           // faixas dos selos (em cima) e da lupa (embaixo); em tela baixa (celular deitado) ficam menores
      Est.s = Math.max(0.05, Math.min(Est.W / UC.largura, (Est.H - topo - base) / UC.altura));
      var ox = Est.W / 2, oy = topo + (Est.H - topo - base) / 2;
      Object.keys(POS).forEach(function (id) {
        var e = esf[id], p = POS[id];
        e.cx = ox + p.x * Est.s; e.cy = oy + (p.y - UC.centroY) * Est.s; e.R = p.r * Est.s;
      });
    }

function caixaDe(e) { var lado = Math.round(2 * e.R + 2 * Est.MG); return { x: Math.round(e.cx - lado / 2), y: Math.round(e.cy - lado / 2), w: lado, h: lado }; }

function pos(e, c) { e.canvas.style.left = c.x + 'px'; e.canvas.style.top = c.y + 'px'; e.canvas.style.width = c.w + 'px'; e.canvas.style.height = c.h + 'px'; }

// ---------------------------------------------------------------- a geometria (das esferas para o palco)
    function paraPalco(e, g) {            // a geometria da esfera (px do canvas dela) para o palco
      var c = caixaDe(e), ox = c.x, oy = c.y, mv = function (p) { return [p[0] + ox, p[1] + oy, p[2]]; };
      return { cx: g.cx + ox, cy: g.cy + oy, R: g.R, soma: [g.soma[0] + ox, g.soma[1] + oy], rSoma: g.rSoma,
        contorno: g.contornoSoma.map(mv), dendritos: g.dendritos.map(function (d) { return { nivel: d.nivel, pts: d.pts.map(mv) }; }) };
    }

function contornoMaisPerto(g, ang) {   // o ponto do contorno do corpo mais perto de um ângulo (visto do centro)
      var melhor = null, dm = 9;
      g.contorno.forEach(function (p) { var d = Math.abs(volta(Math.atan2(p[1] - g.soma[1], p[0] - g.soma[0]) - ang)); if (d < dm) { dm = d; melhor = p; } });
      return melhor ? { x: melhor[0], y: melhor[1] } : { x: g.soma[0] + Math.cos(ang) * g.rSoma, y: g.soma[1] + Math.sin(ang) * g.rSoma };
    }

function maisLonge(g) {                // o ponto de dendrito mais longe do centro (é o que encosta na parede)
      var melhor = null, dm = -1;
      g.dendritos.forEach(function (d) { d.pts.forEach(function (p) { var r = Math.hypot(p[0] - g.cx, p[1] - g.cy); if (r > dm) { dm = r; melhor = p; } }); });
      return melhor ? { x: melhor[0], y: melhor[1], r: dm } : { x: g.cx + g.R, y: g.cy, r: g.R };
    }

    return { posicoes: posicoes, canalUC: canalUC, medir: medir, caixaDe: caixaDe, pos: pos, paraPalco: paraPalco, contornoMaisPerto: contornoMaisPerto, maisLonge: maisLonge };
  }

  return { criar: criar };
}
