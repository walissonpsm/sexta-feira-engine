/* GERADO por ferramentas/montar-interface.sh a partir de fonte/ (versão 0.3.0). NÃO edite aqui: edite a parte em fonte/ e rode o montador. */
// ---- fonte/base/carregador/parte.js
/* O carregador (SF): registra as partes, resolve as portas na ordem das dependências e dá a cada parte SÓ as portas que ela declarou (usa.<parte>).
 * É a única parte que lê o relógio, o sorteio e o ambiente de teste. Ele contém as falhas: uma parte que dá erro é desligada e a tela segue
 * (no teste, o erro sobe e reprova). Veja o LEIA-ME.md desta pasta. */
(function (global) {
  'use strict';
  var T = global.SF_TESTE ? (typeof global.SF_TESTE === 'object' ? global.SF_TESTE : { estrito: true }) : null;     // só os testes definem SF_TESTE
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
      catch (e) { if (T) throw e; desliga(nome, e); return undefined; }
      finally { if (ctx) { try { ctx.restore(); } catch (e2) { /* sem estado para restaurar */ } } }
    };
  }

  var base = Object.freeze({
    versao: '0.3.0',
    teste: T,
    acaso: function () { return Math.random(); },
    agora: function () { return typeof performance !== 'undefined' ? performance.now() : Date.now(); },
    canvas: function (largura, altura) { var c = global.document.createElement('canvas'); c.width = largura; c.height = altura; return c; },
    // confere uma condição de entrada: no teste, reprova; fora dele, devolve falso (quem chamou ignora a entrada ruim)
    confere: function (cond, msg) { if (cond) return true; if (T) throw new Error('entrada inválida: ' + msg); return false; },
    // roda um pedaço da cena (uma esfera, um axônio) e contém a falha dele: desliga só aquele pedaço
    seguro: function (nome, fn) {
      if (mortas[nome]) return undefined;
      try { return fn(); } catch (e) { if (T) throw e; desliga(nome, e); return undefined; }
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
    try { porta = p.f(Object.freeze(usa)); } catch (e) { if (T) throw e; desliga(nome, e); p.estado = 2; return false; }
    var final = {}, k;
    for (k in porta) {
      if (Object.prototype.hasOwnProperty.call(porta, k)) final[k] = (p.m.guarda && typeof porta[k] === 'function') ? guardar(nome, porta[k]) : porta[k];
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

  global.SF = Object.freeze({ parte: parte, iniciar: iniciar, versao: base.versao, portas: T ? portas : undefined, desligadas: T ? function () { return falhas.slice(); } : undefined });
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
