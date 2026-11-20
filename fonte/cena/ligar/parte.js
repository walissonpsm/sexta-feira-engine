/* Sexta-Feira Engine v0.5.0: cena/ligar. Monta as ligações da cena: o axônio violeta de volta de cada agente e um axônio de entrada PARADO para cada módulo que o agente
 * pede (no máximo 4; sem pedidos, um só, para o módulo mais perto), cada um com o seu terminal no vidro do Núcleo, junto do módulo. A escolha do lado, da pista e do ponto de
 * pouso é de cena/rotas; o ajuste fino do caminho de cada axônio, de ligacoes/caminho. O estado vem de Est (a tabela dos campos está no LEIA-ME.md da juntadora e deste) e as
 * funções das irmãs chegam em d, passadas pela juntadora. */
function (usa) {
  'use strict';

  function criar(Est, d) {
    var esf = Est.esf, cfg = Est.cfg, UC = Est.UC, VIOLETA = Est.VIOLETA;
    var rgbDe = usa.cores.rgbDe, hash = usa.sorteio.hash;
    var volta = usa.curvas.volta, curva = usa.curvas.curva, polar = usa.curvas.polar;
    var raioVent = d.raioVent, modulosDe = d.modulosDe, alvoRel = d.alvoRel, canalUC = d.canalUC, caixaDe = d.caixaDe, paraPalco = d.paraPalco, contornoMaisPerto = d.contornoMaisPerto, maisLonge = d.maisLonge, medeEixo = d.medeEixo, refazEixo = d.refazEixo, escolherRotas = d.escolherRotas;

function montarLigacoes() {
      var N = esf.nucleo, gN = paraPalco(N, N.n.geometria()), lista = [], mapa = {};
      var f = 0.40 * Est.s, LAT = 0.5, d = 15 * Est.s, passo = Math.max(3, 5 * Est.s), meia = 0.8 * 150 * f * LAT;
      Est.fixos = []; Est.fixoAg = {}; Est.fixoMod = []; Est.ventosas = []; Est.ventById = {}; Est.eixos = []; Est.eixoById = {};
      var rv = raioVent(N.R);

      // os receptores dos módulos: o ponto de dendrito de cada um que chega mais perto do vidro, e o último trecho até ele
      var cN = { x: gN.cx, y: gN.cy }, boxN = caixaDe(N);
      N.n.minisGeometria().forEach(function (m) {
        var p0 = { x: m.parede[0] + boxN.x, y: m.parede[1] + boxN.y }, ang = Math.atan2(p0.y - cN.y, p0.x - cN.x), r0 = Math.hypot(p0.x - cN.x, p0.y - cN.y);
        var pw = { x: cN.x + 0.996 * N.R * Math.cos(ang), y: cN.y + 0.996 * N.R * Math.sin(ang) };
        var lado = (hash('m' + m.idx) % 2 ? 1 : -1) * 0.14 * Math.hypot(pw.x - p0.x, pw.y - p0.y);
        var fx = { cor: m.rgb, pw: pw, de: r0 < 0.985 * N.R ? p0 : null, ctl: { x: (p0.x + pw.x) / 2 - Math.sin(ang) * lado, y: (p0.y + pw.y) / 2 + Math.cos(ang) * lado }, flash: 0, ang: ang, idx: m.idx, mod: true };
        Est.fixos.push(fx); Est.fixoMod[m.idx] = fx;
      });

      cfg.agentes.forEach(function (a) {
        var A = esf[a.id], Acx = A.cx, Acy = A.cy, WN = N.R * 0.95, WA = A.R * 0.95, cor = rgbDe(a.cor);
        var cn = canalUC(a), th = cn.th, phi = cn.phi;                                   // phi: do agente para o canal do Núcleo
        var Wn = { x: N.cx + WN * Math.cos(th), y: N.cy + WN * Math.sin(th) };
        var Wa = { x: Acx + WA * Math.cos(phi), y: Acy + WA * Math.sin(phi) };
        var ex = Wa.x - Wn.x, ey = Wa.y - Wn.y, el = Math.hypot(ex, ey); ex /= el; ey /= el;
        var vx = -ey, vy = ex; if (vy > 0) { vx = -vx; vy = -vy; }                        // normal da faixa, apontando para cima
        var sIn = Acy > N.cy + 1 ? -1 : 1;                                                // quem volta ao Núcleo fica por fora (no par do meio, em cima)
        var uI = { x: vx * sIn, y: vy * sIn }, uO = { x: -vx * sIn, y: -vy * sIn };
        var oO = { x: uO.x * d, y: uO.y * d }, oI = { x: uI.x * d, y: uI.y * d };

        // ---- o agente gira para que o dendrito que encosta no vidro fique de frente para o axônio violeta (que chega ao lado do par)
        var rawA = { x: Acx + A.R * Math.cos(phi) + uO.x * (d + 0.85 * meia), y: Acy + A.R * Math.sin(phi) + uO.y * (d + 0.85 * meia) };
        var omA = Math.atan2(rawA.y - Acy, rawA.x - Acx);
        var gA = paraPalco(A, A.n.geometria()), ponta = maisLonge(gA), dg = volta(omA - Math.atan2(ponta.y - gA.cy, ponta.x - gA.cx));
        if (Math.abs(dg) > 0.01) { A.giro += dg; A.n.setGiro(A.giro); gA = paraPalco(A, A.n.geometria()); ponta = maisLonge(gA); }
        var pwA = { x: gA.cx + 0.996 * A.R * Math.cos(omA), y: gA.cy + 0.996 * A.R * Math.sin(omA) };
        var fa = { cor: cor, pw: pwA, de: Math.hypot(ponta.x - gA.cx, ponta.y - gA.cy) < 0.985 * A.R ? ponta : null, ctl: { x: (ponta.x + pwA.x) / 2, y: (ponta.y + pwA.y) / 2 }, flash: 0, ang: omA, ag: a.id };
        Est.fixos.push(fa); Est.fixoAg[a.id] = fa;

        // ---- Núcleo -> agente (violeta): sai do corpo do neurônio central, pelo raio do canal, atravessa o vidro e PARA no vidro do agente
        var So = contornoMaisPerto(gN, th);
        var rvA = raioVent(A.R), fora = 70 * Est.s;                                          // o terminal pousa no vidro; o axônio chega de frente (de fora, no raio)
        var rO = polar(Acx, Acy, rvA, omA), CfO = polar(Acx, Acy, rvA + fora, omA);
        var NxO = { x: N.cx + N.R * 1.10 * Math.cos(th) + oO.x, y: N.cy + N.R * 1.10 * Math.sin(th) + oO.y };
        var pO = [So, { x: N.cx + 0.5 * WN * Math.cos(th) + oO.x * 0.5, y: N.cy + 0.5 * WN * Math.sin(th) + oO.y * 0.5 }, NxO,
          { x: (NxO.x + CfO.x) / 2, y: (NxO.y + CfO.y) / 2 }, CfO, rO];

        // ---- agente -> Núcleo (na cor do agente): sai do corpo do agente, atravessa o vidro dele e segue pelo canal até o vidro do Núcleo
        var Si = contornoMaisPerto(gA, phi), rank = Math.max(0, Est.idAg.indexOf(a.id));
        var rawN = { x: N.cx + N.R * Math.cos(th) + uI.x * (d + 0.85 * meia), y: N.cy + N.R * Math.sin(th) + uI.y * (d + 0.85 * meia) };
        var thI = Math.atan2(rawN.y - N.cy, rawN.x - N.cx), rA = N.R * 1.08 + 28 * Est.s * rank, drop = 70 * Est.s;
        var WaOut = { x: Acx + A.R * 1.12 * Math.cos(phi) + oI.x, y: Acy + A.R * 1.12 * Math.sin(phi) + oI.y }, Qm = polar(N.cx, N.cy, rA + drop, thI);
        var head = [Si, { x: Acx + 0.55 * A.R * Math.cos(phi) + oI.x * 0.5, y: Acy + 0.55 * A.R * Math.sin(phi) + oI.y * 0.5 }, WaOut, { x: (WaOut.x + Qm.x) / 2, y: (WaOut.y + Qm.y) / 2 }, Qm];

        var vO = { id: 'o-' + a.id, cx: Acx, cy: Acy, R: A.R, ang: omA, cor: rgbDe(VIOLETA), ag: a.id, flash: 0, anel: 0 };
        var vI = { id: 'i-' + a.id, cx: N.cx, cy: N.cy, R: N.R, ang: thI, cor: cor, ag: a.id, noN: true, flash: 0, anel: 0 };
        Est.ventosas.push(vO); Est.ventById[vO.id] = vO;
        var novo = function (id, tipo, larg, corRgb, vent) {
          var ax = { id: id, tipo: tipo, ag: a.id, larg: larg, corRgb: corRgb, vent: vent, base: [], pts: [], cum: [], nx: [], ny: [], len: 1, bb: null, a0: 3.2 * larg, pitch: 5.5 * larg, nNos: 0,
            nos: new Array(160).fill(0), pulso: null, pulsoCor: cor, estado: 'repouso', vel: 1200 * Est.s, fase: (hash(id) % 628) / 100, passo: passo, pulo: Math.max(1, Math.round(10 / passo)), ativo: false, sujoG: false,
            mdur: 0, mt: 0, dC: 0, dDe: 0, dPara: 0, dRep: 0, espera: 0, p: 1, pAlvo: 1, thL: thI, rA: rA, head: head, drop: drop };
          Est.eixos.push(ax); Est.eixoById[id] = ax; return ax;
        };
        var axO = novo('o-' + a.id, 'o', 10.8 * Est.s, rgbDe(VIOLETA), vO); axO.base = curva(pO, passo); medeEixo(axO);
        // o agente tem um axônio PARADO para cada módulo que pede (no máximo 4; sem pedidos, um só, para o módulo mais perto): sem o movimento de plugar. Cada um sai do
        // corpo num ponto um pouco diferente, corre na sua pista e termina, com o seu terminal, no vidro do Núcleo junto do módulo
        lista.push(axO);
        var mods = modulosDe(a.id).filter(function (m, i, L) { return L.indexOf(m) === i && Est.fixoMod[m]; }), nm = mods.length;
        mods.forEach(function (m, k) {
          var c = k - (nm - 1) / 2, sp = 40 * Est.s;
          var sgP = (uI.x * -Math.sin(phi) + uI.y * Math.cos(phi)) >= 0 ? 1 : -1;       // a ordem no contorno do agente acompanha a ordem da fila (sem cruzar dentro do agente)
          var mk = function (cc) { var Sk = contornoMaisPerto(gA, phi + sgP * cc * 0.34); return head.map(function (q, j) { return j === 0 ? Sk : { x: q.x + uI.x * cc * sp, y: q.y + uI.y * cc * sp }; }); };
          var hk = mk(c);
          var vk = { id: 'i-' + a.id + '#' + m, cx: N.cx, cy: N.cy, R: N.R, ang: thI, cor: cor, ag: a.id, noN: true, flash: 0, anel: 0 };
          Est.ventosas.push(vk); Est.ventById[vk.id] = vk;
          var axK = novo(vk.id, 'i', 6.75 * Est.s, cor, vk);
          axK.head = hk; axK.rA = rA + k * 7 * Est.s; axK.mod = m; axK.mkHead = mk; axK.c = c; axK.sc = Est.s;
          axK.dPara = axK.dC = axK.dRep = alvoRel(axK, m);
          axK.plano = { dir: volta(thI + axK.dC - Math.atan2(hk[2].y - N.cy, hk[2].x - N.cx)) >= 0 ? 1 : -1, lane: 0 };
          refazEixo(axK); lista.push(axK);
          mapa[vk.id] = { agente: a, para: null };
        });
        var bA = caixaDe(A);
        mapa['o-' + a.id] = { agente: a, para: A, alvo: { x: ponta.x - bA.x, y: ponta.y - bA.y } };
      });
      escolherRotas(lista);          // cena/rotas: o lado, a pista, a ordem e o ponto de pouso de cada axônio de entrada (e o caminho refeito)
      // a grade dos trechos de dendrito (de todas as esferas, no palco) para achar onde um dendrito cruza um axônio; metade passa por cima (a escolha é fixa por trecho)
      var G = { cel: Math.max(16, 26 * Est.s), m: {} }, nid = 0;
      Object.keys(esf).forEach(function (id) {
        var e = esf[id]; if (!e || !e.n) return;
        var g = paraPalco(e, e.n.geometria()), hs = hash(id), corD = usa.cores.rgba(usa.cores.clar(rgbDe(e.cor)), 0.9);
        g.dendritos.forEach(function (d, bi) {
          var P = d.pts;
          for (var j = 0; j + 1 < P.length; j++) {
            var a = P[Math.max(0, j - 1)], b = P[j], c = P[j + 1], q = P[Math.min(P.length - 1, j + 2)];
            var seg = { id: nid++, x0: a[0], y0: a[1], x1: b[0], y1: b[1], x2: c[0], y2: c[1], x3: q[0], y3: q[1], w: Math.max(0.8, (b[2] + c[2]) / 2), cor: corD,
              cima: ((hs + bi * 7919 + Math.floor(j / 3) * 104729) % 97) < 48 };
            var k = Math.floor((b[0] + c[0]) / 2 / G.cel) + ',' + Math.floor((b[1] + c[1]) / 2 / G.cel);
            (G.m[k] = G.m[k] || []).push(seg);
          }
        });
      });
      Est.grade = G;
      // os obstáculos de cada axônio (as outras esferas e os neurônios menores do Núcleo) e o Núcleo (quem está fora fica fora)
      var gN2 = N.n.geometria(), bN2 = caixaDe(N), rMini = 48 * 0.42 * gN2.k;
      var minis = N.n.minisGeometria().map(function (m) { return { x: m.soma[0] + bN2.x, y: m.soma[1] + bN2.y, r: rMini * 2.4 }; });
      Est.eixos.forEach(function (ax) {
        var obst = minis.slice();
        Object.keys(esf).forEach(function (id) { var e = esf[id]; if (!e || id === 'nucleo' || id === ax.ag) return; obst.push({ x: e.cx, y: e.cy, r: e.R + 10 * Est.s }); });
        ax.obst = obst; ax.nucleo = { x: N.cx, y: N.cy, R: N.R }; ax.grade = G; medeEixo(ax);
      });
      // três rodadas em que cada axônio vê onde os outros estão e se afasta de quem corre em cima dele, um de cada vez: quem acabou de se ajustar já aparece na grade
      // para o próximo (assim dois vizinhos não fogem para o mesmo lado)
      var VG = { cel: Math.max(12, 18 * Est.s), m: {}, folga: 5 * Est.s + 3 };
      var poe = function (ax, sinal) {
        var P = ax.pts;
        P.forEach(function (q, i) {
          var k = (Math.floor(q.x / VG.cel) + 4096) * 8192 + Math.floor(q.y / VG.cel) + 4096, a = P[Math.max(0, i - 1)], c = P[Math.min(P.length - 1, i + 1)], tl = Math.hypot(c.x - a.x, c.y - a.y) || 1;
          if (sinal > 0) (VG.m[k] = VG.m[k] || []).push({ x: q.x, y: q.y, l: ax.larg, id: ax.id, tx: (c.x - a.x) / tl, ty: (c.y - a.y) / tl });
          else if (VG.m[k]) VG.m[k] = VG.m[k].filter(function (w) { return w.id !== ax.id; });
        });
      };
      Est.eixos.forEach(function (ax) { poe(ax, 1); });
      for (var rodada = 0; rodada < 3; rodada++) Est.eixos.forEach(function (ax) { poe(ax, -1); ax.vizG = VG; medeEixo(ax); poe(ax, 1); });
      Est.nLig = lista;
      Est.ligMapa = mapa; Est.ligMapaTodo = mapa;
      Est.sujo = true; Est.sujoE = true;
    }

    return { montarLigacoes: montarLigacoes };
  }

  return { criar: criar };
}
