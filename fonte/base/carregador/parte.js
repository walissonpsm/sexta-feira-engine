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
    versao: '@VERSAO@',
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
