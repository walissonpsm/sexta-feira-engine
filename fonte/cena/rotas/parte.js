/* Sexta-Feira Engine v0.5.0: cena/rotas. Escolhe, para cada axônio de entrada (um por módulo que o agente pede), o lado e a pista em volta do Núcleo que menos cruzam os
 * outros, a ordem dos axônios de um mesmo agente (a que não cruza dentro do corpo dele) e o ponto do vidro onde cada terminal pousa: os terminais de um mesmo módulo ficam
 * lado a lado (vão de 26·s + 4 px) e nunca no mesmo ponto. É só geometria e contas: não desenha nem guarda estado além do que põe em cada axônio (`plano`, `dC`, `dPara`,
 * `dRep`, `c`, `head`). O estado vem de Est e as funções das irmãs chegam em d, passadas pela juntadora (cena/quadro). */
function (usa) {
  'use strict';

  function criar(Est, d) {
    var esf = Est.esf;
    var volta = usa.curvas.volta, esboco = usa.pistas.esboco;
    var raioVent = d.raioVent, refazEixo = d.refazEixo;

    // `lista`: todos os axônios montados por cena/ligar (os de entrada, `tipo` 'i', e os violetas, 'o'). Ao sair, cada axônio de entrada tem `plano` { dir, lane },
    // o ponto de pouso (`dC`, `dPara`, `dRep`) e o caminho refeito (`refazEixo`); os violetas servem só de obstáculo para a escolha.
    function escolher(lista) {
      var Nn = esf.nucleo, rvN = raioVent(Nn.R), iA = lista.filter(function (x) { return x.tipo === 'i'; }), oA = lista.filter(function (x) { return x.tipo === 'o'; });
      // a caixa de cada linha (dos pontos a partir do 3º): `cruz` e `perto` só olham os trechos que podem encostar na outra linha (o resultado é o mesmo, a conta é bem menor)
      var uidN = 0;
      var caixa = function (P) {
        var x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9, i, q;
        for (i = 2; i < P.length; i++) { q = P[i]; if (q.x < x0) x0 = q.x; if (q.x > x1) x1 = q.x; if (q.y < y0) y0 = q.y; if (q.y > y1) y1 = q.y; }
        P.bb = { x0: x0, y0: y0, x1: x1, y1: y1 }; P.uid = ++uidN; return P;
      };
      var fixos = oA.map(function (x) { return { ax: x, pts: caixa(x.base.filter(function (q, i) { return i % 4 === 0; })) }; });
      var cruz = function (A, B) {
        var ba = A.bb, bb = B.bb;
        if (ba.x1 < bb.x0 || bb.x1 < ba.x0 || ba.y1 < bb.y0 || bb.y1 < ba.y0) return 0;
        var n = 0, i, j, a0, a1, b0, b1, ia, jb, IA = [], JB = [], o = function (p, q, r) { return (q.x - p.x) * (r.y - p.y) - (q.y - p.y) * (r.x - p.x); };
        for (i = 2; i + 1 < A.length; i++) { a0 = A[i]; a1 = A[i + 1]; if (Math.max(a0.x, a1.x) < bb.x0 || bb.x1 < Math.min(a0.x, a1.x) || Math.max(a0.y, a1.y) < bb.y0 || bb.y1 < Math.min(a0.y, a1.y)) continue; IA.push(i); }
        for (j = 2; j + 1 < B.length; j++) { b0 = B[j]; b1 = B[j + 1]; if (Math.max(b0.x, b1.x) < ba.x0 || ba.x1 < Math.min(b0.x, b1.x) || Math.max(b0.y, b1.y) < ba.y0 || ba.y1 < Math.min(b0.y, b1.y)) continue; JB.push(j); }
        for (ia = 0; ia < IA.length; ia++) { a0 = A[IA[ia]]; a1 = A[IA[ia] + 1];
          for (jb = 0; jb < JB.length; jb++) { b0 = B[JB[jb]]; b1 = B[JB[jb] + 1];
            if (Math.max(a0.x, a1.x) < Math.min(b0.x, b1.x) || Math.max(b0.x, b1.x) < Math.min(a0.x, a1.x) || Math.max(a0.y, a1.y) < Math.min(b0.y, b1.y) || Math.max(b0.y, b1.y) < Math.min(a0.y, a1.y)) continue;
            if ((o(a0, a1, b0) > 0) !== (o(a0, a1, b1) > 0) && (o(b0, b1, a0) > 0) !== (o(b0, b1, a1) > 0)) n++; } }
        return n;
      };
      var perto = function (A, B, lim) {
        var ba = A.bb, bb = B.bb;
        if (bb.x0 - ba.x1 >= lim || ba.x0 - bb.x1 >= lim || bb.y0 - ba.y1 >= lim || ba.y0 - bb.y1 >= lim) return 0;
        var n = 0, i, j, q, ia, jb, IA = [], JB = [];
        for (i = 2; i < A.length; i++) { q = A[i]; if (q.x > bb.x0 - lim && q.x < bb.x1 + lim && q.y > bb.y0 - lim && q.y < bb.y1 + lim) IA.push(q); }
        for (j = 2; j < B.length; j++) { q = B[j]; if (q.x > ba.x0 - lim && q.x < ba.x1 + lim && q.y > ba.y0 - lim && q.y < ba.y1 + lim) JB.push(q); }
        for (ia = 0; ia < IA.length; ia++) for (jb = 0; jb < JB.length; jb++) if (Math.abs(IA[ia].x - JB[jb].x) < lim && Math.abs(IA[ia].y - JB[jb].y) < lim && Math.hypot(IA[ia].x - JB[jb].x, IA[ia].y - JB[jb].y) < lim) n++;
        return n;
      };
      var giro = function (ax) { var D = volta(ax.thL + ax.dC - Math.atan2(ax.head[2].y - Nn.cy, ax.head[2].x - Nn.cx)); if (D * ax.plano.dir < 0) D += ax.plano.dir * 2 * Math.PI; return Math.abs(D); };
      // o esboço de um axônio só depende do lado, da pista, do ponto de saída (`c`) e do ponto de pouso (`dC`): para o mesmo estado, é a mesma linha (e já com a conta do
      // comprimento); as rodadas repetem muitos estados, e o resultado de cada par de linhas também fica guardado (a conta de cruzar e de chegar perto é pura)
      var esbMemo = {}, parMemo = new Map();
      var esb = function (ax) {
        var chave = ax.id + '|' + ax.plano.dir + '|' + ax.plano.lane + '|' + ax.c + '|' + ax.dC, h = esbMemo[chave];
        if (!h) {
          var P = esboco(Nn, rvN, ax, ax.plano, Est.s), L = 0;
          for (var q = 1; q < P.length; q++) L += Math.hypot(P[q].x - P[q - 1].x, P[q].y - P[q - 1].y);
          h = esbMemo[chave] = { P: caixa(P), L: L };
        }
        ax.esbL = h.L; return h.P;
      };
      var custoPar = function (A, B, lim) {
        var k = A.uid < B.uid ? A.uid * 1048576 + B.uid : B.uid * 1048576 + A.uid, v = parMemo.get(k);
        if (v === undefined) { v = 100 * cruz(A, B) + 4 * Math.min(15, perto(A, B, lim)); parMemo.set(k, v); }
        return v;
      };
      var dCurto = function (ax) { return volta(ax.thL + ax.dC - Math.atan2(ax.head[2].y - Nn.cy, ax.head[2].x - Nn.cx)); };
      // `teto` (opcional): a soma dos pares só cresce, então, ao passar do teto (o melhor custo até agora), esta pista já não ganha e a conta para (devolve uma soma qualquer >= teto)
      var custoDe = function (ax, teto) {
        var P = ax.esb, c = 0, lim0 = 5 * Est.s + 3, i, o;
        for (i = 0; i < iA.length; i++) { o = iA[i]; if (o === ax) continue; c += custoPar(P, o.esb, (ax.larg + o.larg) / 2 + lim0); if (c >= teto) return c; }
        for (i = 0; i < fixos.length; i++) { c += custoPar(P, fixos[i].pts, (ax.larg + fixos[i].ax.larg) / 2 + lim0); if (c >= teto) return c; }
        return c + 2.5 * ax.plano.lane + (ax.plano.dir * dCurto(ax) < 0 ? 25 : 0) + 0.12 * (ax.esbL || 0)    // volta longa custa (o caminho reto é preferido); mais de ~200° em volta do Núcleo, nem se tenta
      };
      // os terminais de um mesmo módulo ficam lado a lado no vidro (nenhum pousa em cima do outro), na ordem de quem chega: quem vem dos ângulos menores pousa do
      // lado dos menores; entre os que vêm do mesmo lado, a pista de dentro pousa primeiro (a de fora passa por cima dela). O vão é o de um terminal: 26·s + 4 px
      var porMod = {}, gapM = (26 * Est.s + 4) / rvN;
      iA.forEach(function (ax) { (porMod[ax.mod] = porMod[ax.mod] || []).push(ax); });
      var espalha = function () {
        Object.keys(porMod).forEach(function (m) {
          var L = porMod[m], fx = Est.fixoMod[m], k = L.length, chave = function (ax) { return ax.plano.dir > 0 ? ax.plano.lane : 100 - ax.plano.lane; };
          L.sort(function (a, b) { return chave(a) - chave(b) || (a.id < b.id ? -1 : 1); });
          L.forEach(function (ax, j) {
            ax.dPara = ax.dC = ax.dRep = volta(fx.ang + (j - (k - 1) / 2) * gapM - ax.thL);
            if (giro(ax) > 3.5) ax.plano = { dir: -ax.plano.dir, lane: ax.plano.lane };   // o terminal mudou de lado: nada de dar a volta no Núcleo
          });
        });
        iA.forEach(function (ax) { ax.esb = esb(ax); });
      };
      iA.forEach(function (ax) { ax.plano = { dir: dCurto(ax) >= 0 ? 1 : -1, lane: 0 }; });
      espalha();
      for (var rd = 0; rd < 4; rd++) {
        iA.forEach(function (ax) {
          var melhor = ax.plano, cm = 1e18;
          [1, -1].forEach(function (dr) { for (var ln = 0; ln < 6; ln++) { ax.plano = { dir: dr, lane: ln }; if (giro(ax) > 3.5) continue; ax.esb = esb(ax); var cc = custoDe(ax, cm - 1e-9); if (cc < cm - 1e-9) { cm = cc; melhor = ax.plano; } } });
          ax.plano = melhor; ax.esb = esb(ax);
        });
        iA.forEach(function (a) { iA.forEach(function (b) {
          if (a.ag !== b.ag || a.c >= b.c) return;
          var antes = custoDe(a) + custoDe(b), ca = a.c, cb = b.c;
          a.c = cb; b.c = ca; a.head = a.mkHead(a.c); b.head = b.mkHead(b.c); a.esb = esb(a); b.esb = esb(b);
          if (custoDe(a) + custoDe(b) >= antes - 1e-9) { a.c = ca; b.c = cb; a.head = a.mkHead(a.c); b.head = b.mkHead(b.c); a.esb = esb(a); b.esb = esb(b); }
        }); });
        espalha();
      }
      iA.forEach(function (ax) { ax.esb = null; refazEixo(ax); });
    }

    return { escolher: escolher };
  }

  return { criar: criar };
}
