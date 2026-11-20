/* GERADO por ferramentas/montar-interface.sh a partir de fonte/ (versão 0.4.2). NÃO edite aqui: edite a parte em fonte/ e rode o montador. */
// ---- fonte/base/carregador/parte.js
/* O carregador (SF): registra as partes, resolve as portas na ordem das dependências e dá a cada parte SÓ as portas que ela declarou (usa.<parte>).
 * É a única parte que lê o relógio, o sorteio e o ambiente de teste. Ele contém as falhas: uma parte que dá erro é desligada e a tela segue
 * (no teste, o erro sobe e reprova; só o teste da falha contida liga o modo { estrito: false }). Veja o LEIA-ME.md desta pasta. */
(function (global) {
  'use strict';
  var T = global.SF_TESTE ? (typeof global.SF_TESTE === 'object' ? global.SF_TESTE : { estrito: true }) : null;     // só os testes definem SF_TESTE
  var estrito = !!T && T.estrito !== false;     // no teste o erro sobe; só o teste da falha contida define SF_TESTE = { estrito: false }
  var registro = Object.create(null), ordemReg = [], pronto = Object.create(null), mortas = Object.create(null), ouvintes = [], iniciado = false, falhas = [];

  function curto(nome) { return nome.slice(nome.indexOf('/') + 1); }
  function avisa(nome) { falhas.push(nome); ouvintes.forEach(function (cb) { try { cb(nome, falhas.slice()); } catch (e) { /* o aviso nunca derruba nada */ } }); }
  function desliga(nome, e) {
    if (mortas[nome]) return;
    mortas[nome] = true;
    if (global.console && global.console.error) global.console.error('parte desligada: ' + nome, e && e.stack ? e.stack : e);
    avisa(nome);
  }
  function ehContexto(x) { return !!x && typeof x === 'object' && typeof x.save === 'function' && typeof x.restore === 'function' && !!x.canvas; }

  // a guarda: cada função da porta de uma parte "guarda: sim" salva e restaura o estado do canvas (o que uma parte muda no desenho não vaza para a outra)
  // e, se der erro, desliga só aquela parte (no teste, relança)
  function guardar(nome, fn) {
    return function () {
      if (mortas[nome]) return undefined;
      var ctx = ehContexto(arguments[0]) ? arguments[0] : null;
      if (ctx) ctx.save();
      try { return fn.apply(this, arguments); }
      catch (e) { if (estrito) throw e; desliga(nome, e); return undefined; }
      finally { if (ctx) { try { ctx.restore(); } catch (e2) { /* sem estado para restaurar */ } } }
    };
  }

  // o tempo por parte (só no teste, com SF_TESTE = { medir: true }): soma o tempo gasto em cada função da porta; só informa, nunca reprova
  var tempos = Object.create(null);
  function medida(nome, fn) {
    return function () {
      var t0 = (typeof performance !== 'undefined' ? performance.now() : Date.now()), r;
      try { r = fn.apply(this, arguments); } finally { var d = (typeof performance !== 'undefined' ? performance.now() : Date.now()) - t0; var t = tempos[nome] || (tempos[nome] = { chamadas: 0, ms: 0 }); t.chamadas++; t.ms += d; }
      if (r && typeof r === 'object' && !Object.isFrozen(r) && !r.__medido) {        // um nível abaixo: os métodos do objeto devolvido (passo, desenhar, quadro...)
        Object.keys(r).forEach(function (m) { if (typeof r[m] === 'function') r[m] = medida(nome + '.' + m, r[m]); });
        try { Object.defineProperty(r, '__medido', { value: true }); } catch (e) { /* objeto fechado: segue sem a marca */ }
      }
      return r;
    };
  }

  var base = Object.freeze({
    versao: '0.4.2',
    teste: T,
    acaso: function () { return Math.random(); },
    agora: function () { return typeof performance !== 'undefined' ? performance.now() : Date.now(); },
    canvas: function (largura, altura) { var c = global.document.createElement('canvas'); c.width = largura; c.height = altura; return c; },
    // confere uma condição de entrada: no teste, reprova; fora dele, devolve falso (quem chamou ignora a entrada ruim)
    confere: function (cond, msg) { if (cond) return true; if (T) throw new Error('entrada inválida: ' + msg); return false; },
    // roda um pedaço da cena (uma esfera, um axônio) e contém a falha dele: desliga só aquele pedaço
    seguro: function (nome, fn) {
      if (mortas[nome]) return undefined;
      try { return fn(); } catch (e) { if (estrito) throw e; desliga(nome, e); return undefined; }
    },
    aoDesligar: function (cb) { ouvintes.push(cb); falhas.forEach(function (n) { try { cb(n, falhas.slice()); } catch (e) { /* idem */ } }); }
  });

  function parte(manifesto, fabrica) {
    if (iniciado) throw new Error('SF.parte depois de SF.iniciar: ' + manifesto.nome);
    if (registro[manifesto.nome]) throw new Error('parte repetida: ' + manifesto.nome);
    registro[manifesto.nome] = { m: manifesto, f: fabrica, porta: null, estado: 0 };
    ordemReg.push(manifesto.nome);
  }

  function construir(nome, pilha) {
    var p = registro[nome];
    if (!p) return false;
    if (p.estado === 2) return !!p.porta;
    if (p.estado === 1) { desliga(nome, new Error('ciclo: ' + pilha.join(' > '))); return false; }
    p.estado = 1;
    var usa = { base: base }, i, r, dep, ver, d;
    for (i = 0; i < p.m.requer.length; i++) {
      r = p.m.requer[i]; dep = r.slice(0, r.indexOf('@')); ver = +r.slice(r.indexOf('@') + 1); d = registro[dep];
      if (!d) { desliga(nome, new Error('falta a parte ' + dep)); p.estado = 2; return false; }
      if (d.m.compativelDesde > ver || ver > d.m.porta) { desliga(nome, new Error(dep + ' está na porta ' + d.m.porta + ', e ' + nome + ' pede a ' + ver)); p.estado = 2; return false; }
      if (!construir(dep, pilha.concat(nome))) { desliga(nome, new Error('depende de ' + dep + ', que não subiu')); p.estado = 2; return false; }
      usa[curto(dep)] = d.porta;
    }
    var porta;
    try { if (T && T.quebrar === nome) throw new Error('quebrada de propósito (teste): ' + nome); porta = p.f(Object.freeze(usa)); } catch (e) { if (estrito) throw e; desliga(nome, e); p.estado = 2; return false; }
    var final = {}, k;
    for (k in porta) {
      if (Object.prototype.hasOwnProperty.call(porta, k)) final[k] = (p.m.guarda && typeof porta[k] === 'function') ? guardar(nome, porta[k]) : porta[k];
      if (T && T.medir && typeof final[k] === 'function') final[k] = medida(nome, final[k]);
    }
    p.porta = Object.freeze(final); p.estado = 2;
    return true;
  }

  function iniciar() {
    if (iniciado) return;
    iniciado = true;
    ordemReg.forEach(function (n) { construir(n, []); });
  }

  // a "foto da porta": nome, versão, dependências e as funções (com o número de argumentos) de cada parte; só no teste
  function portas() {
    var o = {};
    ordemReg.forEach(function (n) {
      var p = registro[n], f = {}, k;
      for (k in (p.porta || {})) f[k] = typeof p.porta[k] === 'function' ? 'f' + p.porta[k].length : typeof p.porta[k];
      o[n] = { porta: p.m.porta, compativelDesde: p.m.compativelDesde, requer: p.m.requer, membros: f };
    });
    return o;
  }

  global.SF = Object.freeze({ parte: parte, iniciar: iniciar, versao: base.versao, portas: T ? portas : undefined, desligadas: T ? function () { return falhas.slice(); } : undefined, tempos: T ? function () { return JSON.parse(JSON.stringify(tempos)); } : undefined });
}(window));

// ---- fonte/comum/cores/parte.js
SF.parte({nome:'comum/cores',porta:1,compativelDesde:1,requer:[],guarda:false,dom:false},
/* Conversões de cor (hexa e rgb) e os tons usados pelas ligações. Funções puras, chamadas muitas vezes por quadro: por isso esta parte não tem guarda. */
function (usa) {
  'use strict';
  function hexToRgb(hex) {
    const clean = hex.replace('#', '');
    const full = clean.length === 3 ? clean.split('').map(c => c + c).join('') : clean;
    const intVal = parseInt(full, 16);
    return [(intVal >> 16) & 255, (intVal >> 8) & 255, intVal & 255];
  }
  function ehCor(c) { return typeof c === 'string' && /^#[0-9a-fA-F]{6}$/.test(c); }
  function rgbDe(h) { return [parseInt(h.substr(1, 2), 16), parseInt(h.substr(3, 2), 16), parseInt(h.substr(5, 2), 16)]; }
  function clar(c) { return [Math.min(255, c[0] + 95), Math.min(255, c[1] + 95), Math.min(255, c[2] + 95)]; }
  function esc(c, k) { return [Math.round(c[0] * k), Math.round(c[1] * k), Math.round(c[2] * k)]; }
  function rgba(c, a) { return 'rgba(' + c[0] + ',' + c[1] + ',' + c[2] + ',' + Math.max(0, Math.min(1, a)).toFixed(3) + ')'; }
  return { hexParaRgb: hexToRgb, ehCor: ehCor, rgbDe: rgbDe, clar: clar, esc: esc, rgba: rgba };
}

);
// ---- fonte/comum/curvas/parte.js
SF.parte({nome:'comum/curvas',porta:1,compativelDesde:1,requer:[],guarda:false,dom:false},
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

);
// ---- fonte/comum/ramos/parte.js
SF.parte({nome:'comum/ramos',porta:1,compativelDesde:1,requer:[],guarda:false,dom:false},
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

);
// ---- fonte/comum/sorteio/parte.js
SF.parte({nome:'comum/sorteio',porta:1,compativelDesde:1,requer:[],guarda:false,dom:false},
/* Sorteio com semente (o mesmo do neuronio.html do dono) e o hash de texto (FNV). Sem estado próprio; nada aqui lê o relógio nem Math.random. */
function (usa) {
  'use strict';
  function createSeededRandom(seed) {
    let s = seed >>> 0;
    return function () {
      s = (s * 1664525 + 1013904223) >>> 0;
      return s / 4294967296;
    };
  }
  function hash(s) { var h = 2166136261 >>> 0; for (var i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619) >>> 0; } return h; }
  return { criar: createSeededRandom, hash: hash };
}

);
