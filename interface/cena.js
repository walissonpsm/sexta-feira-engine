/* GERADO por ferramentas/montar-interface.sh a partir de fonte/ (versão 0.4.4). NÃO edite aqui: edite a parte em fonte/ e rode o montador. */
// ---- fonte/cena/foco/parte.js
SF.parte({nome:'cena/foco',porta:1,compativelDesde:1,requer:[],guarda:false,dom:true},
/* Sexta-Feira Engine v0.4.2: cena/foco. o foco numa esfera: ela ocupa o palco e ganha a lupa; a vista das camadas da parede e a volta à vista geral.
 * Código movido sem reescrever de neuronio/celula: o estado vem de Est (a tabela dos campos está no LEIA-ME.md da juntadora e deste) e as funções
 * das irmãs chegam em d, passadas pela juntadora. Só desenha/calcula o que está na lista da porta. */
function (usa) {
  'use strict';

  function criar(Est, d) {
    var esf = Est.esf, ordem = Est.ordem, raiz = Est.raiz;
    var caixaDe = d.caixaDe, pos = d.pos, reiniciaCiclo = d.reiniciaCiclo;

// ---------------------------------------------------------------- o foco numa esfera (nome ou roda do mouse): ela ocupa o palco e ganha a lupa
    function focar(id) {
      var e = esf[id]; if (!e) return;
      if (Est.foco && Est.foco !== id) sair();
      if (Est.foco === id) return;
      Est.foco = id;
      raiz.classList.add('em-foco');
      ordem.forEach(function (k) { esf[k].canvas.classList.toggle('esmaece', k !== id); });
      e.canvas.style.left = '0px'; e.canvas.style.top = '0px'; e.canvas.style.width = Est.W + 'px'; e.canvas.style.height = Est.H + 'px';
      e.n.redimensionar(Est.W, Est.H);
      e.n.lupaLigar(true);
      e.n.lupa.aoMudar(function (z) { if (Est.ouvinte) Est.ouvinte({ foco: Est.foco, z: z }); });
      // as ligações que tocam essa esfera ficam e seguem a lupa dela (axônios e pulsos); a esfera inteira cabe no palco
      var Rf = Math.min(Est.W, Est.H) / 2 - Est.MG, k = Rf / e.R;
      Est.TF = { k: k, tx: Est.W / 2 - k * e.cx, ty: Est.H / 2 - k * e.cy };
      var ids = id === 'nucleo' ? null : ['o-' + id];
      Est.ligMapa = {}; Object.keys(Est.ligMapaTodo).forEach(function (q) { if (!ids || ids.indexOf(q) >= 0 || q.indexOf('i-' + id + '#') === 0) Est.ligMapa[q] = Est.ligMapaTodo[q]; });     // os axônios de entrada do agente são um por módulo (i-<agente>#<módulo>)
      reiniciaCiclo();
      vistaTotal(1, 0, 0, true);
      if (Est.ouvinte) Est.ouvinte({ foco: Est.foco, z: 1 });
    }

function sair() {
      if (!Est.foco) return;
      var e = esf[Est.foco]; Est.foco = null;
      e.n.lupa.aoMudar(null);
      e.n.lupaLigar(false);
      e.canvas.style.pointerEvents = 'auto';
      raiz.classList.remove('em-foco');
      ordem.forEach(function (k) { esf[k].canvas.classList.remove('esmaece'); });
      var c = caixaDe(e); pos(e, c); e.n.redimensionar(c.w, c.h);
      Est.TF = { k: 1, tx: 0, ty: 0 }; Est.ligMapa = Est.ligMapaTodo; reiniciaCiclo();
      vistaTotal(1, 0, 0, true);
      if (Est.ouvinte) Est.ouvinte({ foco: null, z: 1 });
    }

function vistaTotal(z, ox, oy, forca) {       // a vista das camadas da parede: a da esfera em foco (TF) com a lupa dela por cima
      var K = z * Est.TF.k, TX = z * Est.TF.tx + ox, TY = z * Est.TF.ty + oy;
      if (!forca && Math.abs(K - Est.T.K) < 1e-9 && Math.abs(TX - Est.T.TX) < 1e-6 && Math.abs(TY - Est.T.TY) < 1e-6) return;
      Est.T = { K: K, TX: TX, TY: TY };
      Est.ctxP.setTransform(Est.dprP, 0, 0, Est.dprP, 0, 0); Est.ctxP.clearRect(0, 0, Est.W, Est.H); Est.bbAnt = null; Est.sujo = true;
    }

    return { focar: focar, sair: sair, vistaTotal: vistaTotal };
  }

  return { criar: criar };
}

);
// ---- fonte/cena/ciclo/parte.js
SF.parte({nome:'cena/ciclo',porta:1,compativelDesde:1,requer:['comum/cores@1'],guarda:false,dom:false},
/* Sexta-Feira Engine v0.5.0: cena/ciclo. o ciclo de um pedido: quem pede, o pulso que vai e volta, a fila de tarefas e o recomeço do ciclo quando a vista muda.
 * Desde a v0.5.0 cada agente tem um axônio PARADO para cada módulo que pede (`i-<agente>#<módulo>`): o pedido não move nada, o pulso corre direto no axônio do módulo
 * pedido (sem plugar nem cone de crescimento). O estado vem de Est (a tabela dos campos está no LEIA-ME.md da juntadora e deste) e as funções das irmãs chegam em d,
 * passadas pela juntadora. */
function (usa) {
  'use strict';

  function criar(Est, d) {
    var esf = Est.esf, cfg = Est.cfg;
    var rgbDe = usa.cores.rgbDe;
    var modulosDe = d.modulosDe;

function agendar(seg, fn) { Est.fila.push({ t: Est.tempo + seg, fn: fn }); }

function disparar(lid, hex) { var ax = Est.eixoById[lid]; if (!ax) return; ax.pulso = { u: 0, k: 0 }; ax.pulsoCor = rgbDe(hex); }

function pedir(id, idxMod) {
      var a = esf[id]; if (!a || Est.ocupado[id]) return false;
      var lm = modulosDe(id); if (idxMod == null) idxMod = lm[Math.floor(usa.base.acaso() * lm.length)];     // sem módulo dito, sorteia entre os que o agente tem axônio
      var ax = Est.eixoById['i-' + id + '#' + idxMod];
      if (!ax || !Est.ligMapa[ax.id] || !Est.fixoMod[idxMod]) return false;                                  // módulo sem axônio dele (ou fora de foco) não pode ser pedido
      Est.ocupado[id] = true; Est.pedidoDe[id] = idxMod;
      a.n.excitar(a.cor);
      ax.estado = 'pulso'; ax.pulso = { u: 0, k: 0 }; ax.pulsoCor = ax.corRgb;                                // o axônio do módulo já está ligado: só o sinal corre
      return true;
    }

function chegou(lid) {
      var m = Est.ligMapa[lid]; if (!m) return;
      var id = m.agente.id, a = m.agente, N = esf.nucleo;
      if (lid.charAt(0) === 'i') {            // o pulso chegou à ventosa no vidro do Núcleo: a parede transmite ao dendrito do módulo pedido
        var mod = Est.pedidoDe[id], fx = Est.fixoMod[mod];
        if (fx) fx.flash = 1;
        N.n.excitarMini(mod, a.cor);          // o módulo recebe, na cor de quem pediu
        var g = Est.ciclo;                        // se o foco mudar ou a tela for redimensionada no meio, o retorno de um pedido velho não faz nada
        agendar(0.30, function () {
          N.n.dispararMini(mod, a.cor, function () {      // o módulo levou o sinal até o neurônio central
            if (g !== Est.ciclo) return;
            agendar(0.10, function () { N.n.excitar(a.cor); disparar('o-' + id, a.cor); });
          });
        });
      } else {                                 // o axônio violeta chegou à parede do agente: o dendrito dele leva o sinal ao corpo
        m.para.n.receber(m.alvo.x, m.alvo.y, a.cor);
        if (Est.fixoAg[id]) Est.fixoAg[id].flash = 1;
        if (Est.ventById[lid]) Est.ventById[lid].flash = 1;
        Est.ocupado[id] = false;
        if (usa.base.acaso() < 0.55) agendar(2.0 + usa.base.acaso() * 3.0, function () { if (Est.automatico) pedir(id); });     // e o ciclo recomeça
      }
    }

function sortear() {
      var livres = cfg.agentes.filter(function (a) { return !Est.ocupado[a.id] && Est.ligMapa['o-' + a.id]; }), em = Object.keys(Est.ocupado).filter(function (k) { return Est.ocupado[k]; }).length;
      if (!livres.length || em >= 3) return;
      pedir(livres[Math.floor(usa.base.acaso() * livres.length)].id);
    }

function reiniciaCiclo() {            // a troca de vista refaz as ligações: o que estava no ar recomeça do zero
      Est.ciclo++; Est.fila.length = 0; Est.ocupado = {}; Est.pedidoDe = {};
      Est.ventosas.forEach(function (v) { v.flash = 0; v.anel = 0; });
      Est.eixos.forEach(function (ax) { ax.pulso = null; ax.estado = 'repouso'; ax.mdur = 0; ax.nos.fill(0); if (ax.tipo === 'i') { ax.dC = ax.dPara = ax.dRep; ax.p = ax.pAlvo = 1; } });     // o caminho não muda (os axônios são parados): nada a refazer
      Est.sujo = true;
    }

    return { agendar: agendar, disparar: disparar, pedir: pedir, chegou: chegou, sortear: sortear, reiniciaCiclo: reiniciaCiclo };
  }

  return { criar: criar };
}

);
// ---- fonte/cena/posicoes/parte.js
SF.parte({nome:'cena/posicoes',porta:1,compativelDesde:1,requer:['comum/curvas@1'],guarda:false,dom:false},
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

);
// ---- fonte/cena/ligar/parte.js
SF.parte({nome:'cena/ligar',porta:2,compativelDesde:1,requer:['comum/cores@1','comum/sorteio@1','comum/curvas@2'],guarda:false,dom:false},
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
        var rvA = raioVent(A.R), fora = 70 * Est.s;                                          // a ventosa pousa no vidro; o axônio chega de frente (de fora, no raio)
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

);
// ---- fonte/cena/rotas/parte.js
SF.parte({nome:'cena/rotas',porta:1,compativelDesde:1,requer:['comum/curvas@2','ligacoes/pistas@2'],guarda:false,dom:false},
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
      var caixa = function (P) {
        var x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9, i, q;
        for (i = 2; i < P.length; i++) { q = P[i]; if (q.x < x0) x0 = q.x; if (q.x > x1) x1 = q.x; if (q.y < y0) y0 = q.y; if (q.y > y1) y1 = q.y; }
        P.bb = { x0: x0, y0: y0, x1: x1, y1: y1 }; return P;
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
      var esb = function (ax) { var P = esboco(Nn, rvN, ax, ax.plano, Est.s), L = 0; for (var q = 1; q < P.length; q++) L += Math.hypot(P[q].x - P[q - 1].x, P[q].y - P[q - 1].y); ax.esbL = L; return caixa(P); };
      var dCurto = function (ax) { return volta(ax.thL + ax.dC - Math.atan2(ax.head[2].y - Nn.cy, ax.head[2].x - Nn.cx)); };
      var custoDe = function (ax) {
        var P = ax.esb, c = 0, lim0 = 5 * Est.s + 3;
        iA.forEach(function (o) { if (o === ax) return; c += 100 * cruz(P, o.esb) + 4 * Math.min(15, perto(P, o.esb, (ax.larg + o.larg) / 2 + lim0)); });
        fixos.forEach(function (f) { c += 100 * cruz(P, f.pts) + 4 * Math.min(15, perto(P, f.pts, (ax.larg + f.ax.larg) / 2 + lim0)); });
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
          [1, -1].forEach(function (dr) { for (var ln = 0; ln < 6; ln++) { ax.plano = { dir: dr, lane: ln }; if (giro(ax) > 3.5) continue; ax.esb = esb(ax); var cc = custoDe(ax); if (cc < cm - 1e-9) { cm = cc; melhor = ax.plano; } } });
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

);
// ---- fonte/cena/eixos/parte.js
SF.parte({nome:'cena/eixos',porta:1,compativelDesde:1,requer:['ligacoes/tronco@1','ligacoes/pistas@1'],guarda:false,dom:false},
/* Sexta-Feira Engine v0.5.0: cena/eixos. a vida de cada axônio da cena: medir, pintar, refazer o caminho e o passo do tempo (pulso, nódulos, o terminal que acende).
 * Desde a v0.5.0 o terminal fica onde está: depois do pulso o axônio só espera um instante e volta ao repouso (sem desplugar). O estado vem de Est (a tabela dos campos
 * está no LEIA-ME.md da juntadora e deste) e as funções das irmãs chegam em d, passadas pela juntadora. */
function (usa) {
  'use strict';

  function criar(Est, d) {
    var esf = Est.esf;
    var tronco = usa.tronco, pistas = usa.pistas;
    var raioVent = d.raioVent, chegou = d.chegou;

function medeEixo(ax) { tronco.medir(Est.s, ax); }

function caminhoI(ax) { var N = esf.nucleo; return pistas.caminho(N, raioVent(N.R), ax); }

function pintaEixo(ax) { tronco.pintar(Est.ctxP, Est.s, Est.relogio, ax); }

function refazEixo(ax) { ax.base = ax.tipo === 'i' ? caminhoI(ax) : ax.base; medeEixo(ax); ax.sujoG = false; }

function visEixo(ax) { return !Est.foco || Est.foco === 'nucleo' || ax.ag === Est.foco; }

function passoEixo(ax, dt) {
      var v = ax.vent, i;
      if (ax.tipo === 'i') {
        if (ax.p !== ax.pAlvo) { ax.p = ax.pAlvo > ax.p ? Math.min(ax.pAlvo, ax.p + dt / 0.4) : Math.max(ax.pAlvo, ax.p - dt / 0.3); ax.sujoG = true; }
        if (ax.mdur > 0) {
          ax.mt += dt; var q = Math.min(1, ax.mt / ax.mdur), ee = q * q * (3 - 2 * q);
          ax.dC = ax.dDe + (ax.dPara - ax.dDe) * ee; ax.sujoG = true;
          if (q >= 1) {
            ax.mdur = 0; ax.dC = ax.dPara;
            ax.pAlvo = 1; ax.estado = ax.estado === 'indo' ? 'pousando-ida' : 'pousando-volta';       // chegou: o cone se achata no vidro
          }
        }
        if (ax.estado === 'pousando-ida' && ax.p >= 0.999) { ax.estado = 'pulso'; ax.pulso = { u: 0, k: 0 }; ax.pulsoCor = ax.corRgb; v.anel = 1; }
        else if (ax.estado === 'pousando-volta' && ax.p >= 0.999) ax.estado = 'repouso';
        if (ax.estado === 'preso') { ax.espera -= dt; if (ax.espera <= 0) ax.estado = 'repouso'; }      // o terminal fica onde está (sem desplugar)
        if (ax.sujoG) refazEixo(ax);
        v.ang = ax.thL + ax.dC;
      }
      var vivo = ax.estado !== 'repouso' || !!ax.pulso || v.flash > 0 || v.anel > 0;
      if (v.flash > 0) v.flash = Math.max(0, v.flash - dt * 1.7);
      if (v.anel > 0) v.anel = Math.max(0, v.anel - dt * 1.6);
      if (ax.pulso) {
        var P = ax.pulso; P.u += ax.vel * dt;
        while (P.k < ax.nNos && ax.a0 + P.k * ax.pitch - 0.25 * ax.larg <= P.u) { ax.nos[P.k] = 1; P.k++; }
        if (P.u >= ax.len) {
          ax.pulso = null; if (ax.tipo === 'i') { ax.estado = 'preso'; ax.espera = 0.9; v.flash = 1; v.anel = 1; }
          chegou(ax.id);
        }
      }
      for (i = 0; i < ax.nos.length; i++) if (ax.nos[i] > 0) { ax.nos[i] = Math.max(0, ax.nos[i] - dt * 2.8); vivo = true; }
      ax.ativo = vivo;
    }

    return { medeEixo: medeEixo, caminhoI: caminhoI, pintaEixo: pintaEixo, refazEixo: refazEixo, visEixo: visEixo, passoEixo: passoEixo };
  }

  return { criar: criar };
}

);
// ---- fonte/cena/quadro/parte.js
SF.parte({nome:'cena/quadro',porta:2,compativelDesde:1,requer:['neuronio/celula@1','comum/sorteio@1','comum/cores@1','comum/curvas@2','ligacoes/ponta@2','ligacoes/tronco@2','ligacoes/pistas@2','cena/posicoes@1','cena/ciclo@1','cena/foco@1','cena/eixos@1','cena/ligar@2','cena/rotas@1'],guarda:true,dom:true},
/* Sexta-Feira Engine v0.3.0: a cena. O Núcleo no centro, seis agentes ao redor (três de cada lado) e a Corretora parada ao lado do Robô.
 * Cada esfera é um Neuronio.criar próprio. Axônio só leva e dendrito só recebe, e a PAREDE de vidro é a sinapse: para cada agente há um par de
 * axônios de mão única, lado a lado, e os dois PARAM no vidro (por fora). Do lado de dentro, um dendrito encosta no mesmo ponto.
 *   - o axônio do agente (na cor dele) vai até a parede do Núcleo; quando o agente pede algo a um módulo, o terminal cria um ramo que corre
 *     por fora da parede até o dendrito do módulo (a parede transmite); o módulo leva o sinal ao neurônio central;
 *   - o neurônio central responde pelo axônio violeta, que para na parede do agente, onde um dendrito dele recebe.
 * O sinal leva a cor de quem pediu do começo ao fim. Só desenha; não lê dado, não usa rede.
 *
 *   var c = Cena.criar(elemento, { nucleo: { cor, semente, modulos: [cores], modulosIds: [ids] }, agentes: [{ id, nome, cor, lado }], satelite: { id, nome, cor },
 *                                  pedidos: { idDoAgente: [idsDeModulo] }, leve });
 *   c.ajustar(largura, altura); c.quadro(dt); c.focar(id); c.sair(); c.esferas(); c.ligacoes(); c.pedir(idDoAgente, idxDoModulo);
 */
function (usa) {
  'use strict';

  var hash = usa.sorteio.hash, ehCor = usa.cores.ehCor, rgbDe = usa.cores.rgbDe, clar = usa.cores.clar, esc = usa.cores.esc, rgba = usa.cores.rgba;
  var volta = usa.curvas.volta, curva = usa.curvas.curva, polar = usa.curvas.polar, suave = usa.curvas.suave;

  // ---- o desenho da cena em "unidades da cena" (UC): o Núcleo tem raio 500; tudo é escalado por s (px por UC) para caber no palco
  var UC = { nucleo: { x: 0, y: 0, r: 500 }, agente: 200, ax: 1080, ay: 520, sat: 72, centroY: 25, largura: 2640, altura: 1500 };


  function criar(raiz, cfg) {
    var seguro = usa.base.seguro;
    var Est = { UC: UC, cfg: cfg, raiz: raiz };        // O ESTADO da cena, num objeto só (v0.4.2): as partes recebem Est (ver o LEIA-ME.md desta pasta)
    var leve = !!cfg.leve;  Est.leve = leve;
    Est.W = 1000; Est.H = 600; Est.s = 0.5; Est.MG = 9;      // MG: a margem do canvas de cada esfera (o vidro desliza e brilha para fora do raio)
    var esf = {};  Est.esf = esf;                        // id -> { id, nome, cor, canvas, n, cx, cy, R, lado, giro, botao }
    var ordem = [];  Est.ordem = ordem;                      // ids na ordem de desenho (agentes, satélite, Núcleo)
    Est.foco = null; Est.ouvinte = null; Est.nLig = [];
    var VIOLETA = cfg.nucleo.cor;  Est.VIOLETA = VIOLETA;


    function novaEsfera(id, nome, cor, semente, extra, lado) {
      var cv = document.createElement('canvas');
      cv.className = 'esfera';
      cv.setAttribute('data-id', id);
      raiz.appendChild(cv);
      var n = usa.celula.criar(cv, Object.assign({ cor: cor, semente: semente, leve: leve, lupa: false, margem: Est.MG, id: id }, extra));
      var e = { id: id, nome: nome, cor: cor, canvas: cv, n: n, cx: 0, cy: 0, R: 10, lado: lado, giro: 0, botao: null, extra: extra };
      esf[id] = e;
      cv.style.pointerEvents = 'auto';
      cv.addEventListener('wheel', function (ev) { if (!Est.foco && ev.deltaY < 0) { ev.preventDefault(); focar(id); } }, { passive: false });
      cv.addEventListener('dblclick', function () { if (!Est.foco) focar(id); });
      return e;
    }


    // o Núcleo e os módulos: os menores ficam só nos arcos de cima e de baixo; as laterais são as passagens dos axônios
    esf.nucleo = null;
    cfg.agentes.forEach(function (a) {
      var e = novaEsfera(a.id, a.nome, a.cor, 94127 + (hash(a.id) % 90000), { semEixo: true, quieto: true, giro0: 0 }, a.lado);
      e.giro = 0; ordem.push(a.id);
    });
    if (cfg.satelite) { novaEsfera(cfg.satelite.id, cfg.satelite.nome, cfg.satelite.cor, 94127 + (hash(cfg.satelite.id) % 90000), { semEixo: true, quieto: true }, null); ordem.push(cfg.satelite.id); }
    novaEsfera('nucleo', cfg.nucleo.nome, cfg.nucleo.cor, cfg.nucleo.semente || 94127, Object.assign({ semEixo: true, quieto: true, rede: (cfg.nucleo.modulos || []).length, anel: 470, raioMax: 500, sobra: 0.55, miniEsc: 0.42,
      cores: cfg.nucleo.modulos || [], arcos: [[-180, 180]], corredor: -9999 }, cfg.nucleo.opcoes || {}), null);     // v0.5.0: os módulos em volta de todo o vidro (sem corredor), em raios alternados
    ordem.push('nucleo');

    // as ligações: uma camada de tela cheia por cima das esferas, e por cima dela a camada da parede (ramos e receptores)
    var caixaPar = document.createElement('canvas');  Est.caixaPar = caixaPar;
    caixaPar.className = 'parede';
    raiz.appendChild(caixaPar);
    var caixaFix = document.createElement('canvas');  Est.caixaFix = caixaFix;           // os receptores parados (desenhados uma vez); a camada de cima só tem o que se mexe
    caixaFix.className = 'parede';
    raiz.insertBefore(caixaFix, caixaPar);
    Est.ctxP = caixaPar.getContext('2d'); Est.ctxF = caixaFix.getContext('2d'); Est.dprP = 1; Est.bbAnt = null;



    // ---------------------------------------------------------------- a camada da parede: receptores, ventosas (os terminais) e os braços dos axônios
    Est.fixos = []; Est.fixoAg = {}; Est.fixoMod = []; Est.ramos = []; Est.ventosas = []; Est.ventById = {}; Est.sujo = true;
    Est.TF = { k: 1, tx: 0, ty: 0 }; Est.T = { K: 1, TX: 0, TY: 0 };      // TF: a esfera em foco cabe no palco; T: a vista total (TF mais a lupa dela)
    function aplicaT(c) { c.setTransform(Est.dprP * Est.T.K, 0, 0, Est.dprP * Est.T.K, Est.dprP * Est.T.TX, Est.dprP * Est.T.TY); }
    function visivel(it) {                // no foco, só o que toca a esfera ampliada
      if (!Est.foco) return true;
      if (it.mod || it.noN) return Est.foco === 'nucleo';
      return it.ag === Est.foco;
    }
    var ponta = usa.ponta, tronco = usa.tronco, pistas = usa.pistas;
    function luz(x, y, r, c, a) { ponta.luz(Est.ctxP, x, y, r, c, a); }
    function espVent() { return ponta.espVent(Est.s); }
    function raioVent(R) { return ponta.raioVent(Est.s, R); }
    function pintaFixo(f) {
      var c = f.cor, u = Math.max(1.2, 4.2 * Est.s);
      Est.ctxP.lineCap = 'round';
      if (f.de) {                         // o último trecho do dendrito, da ponta que já estava até o vidro
        Est.ctxP.beginPath(); Est.ctxP.moveTo(f.de.x, f.de.y); Est.ctxP.quadraticCurveTo(f.ctl.x, f.ctl.y, f.pw.x, f.pw.y);
        Est.ctxP.strokeStyle = rgba(c, 0.30); Est.ctxP.lineWidth = u * 1.5; Est.ctxP.stroke();
        Est.ctxP.strokeStyle = rgba(clar(c), 0.90); Est.ctxP.lineWidth = u * 0.55; Est.ctxP.stroke();
      }
      luz(f.pw.x, f.pw.y, u * (1.5 + f.flash * 2.6), c, 0.50 + 0.50 * f.flash);
      Est.ctxP.fillStyle = rgba(clar(c), 0.95); Est.ctxP.beginPath(); Est.ctxP.arc(f.pw.x, f.pw.y, u * 0.72, 0, 6.2832); Est.ctxP.fill();
    }
    // ---------------------------------------------------------------- os axônios vivos: um por agente para o Núcleo (na cor dele) e um do Núcleo para o agente (violeta)
    // Cada um tem uma linha central (base) que o agente-para-Núcleo recalcula quando o alvo se move; por cima dela vai a ondulação parada. A bainha de mielina
    // são tubos de tamanho fixo contados a partir do começo (então crescem pela ponta quando o tronco se estica), com a cintura do nódulo entre eles.
    Est.eixos = []; Est.eixoById = {}; Est.sujoE = true; Est.eixosAntes = false; Est.relogio = 0;
    function pintaEstatico() {
      var salvo = Est.ctxP; Est.ctxP = Est.ctxF;
      Est.ctxF.setTransform(Est.dprP, 0, 0, Est.dprP, 0, 0); Est.ctxF.clearRect(0, 0, Est.W, Est.H); aplicaT(Est.ctxF); Est.ctxF.globalCompositeOperation = 'lighter';
      Est.fixos.forEach(function (f) { if (!visivel(f)) return; var fl = f.flash; f.flash = 0; pintaFixo(f); f.flash = fl; });
      Est.ctxF.globalCompositeOperation = 'source-over';
      Est.ctxP = salvo;
    }
    function uneBB(b, x0, y0, x1, y1) { if (!b) return { x0: x0, y0: y0, x1: x1, y1: y1 }; return { x0: Math.min(b.x0, x0), y0: Math.min(b.y0, y0), x1: Math.max(b.x1, x1), y1: Math.max(b.y1, y1) }; }
    function passoPar(dt) {
      var vivo = false, bb = null, m = 16 * Math.max(1.2, 4.2 * Est.s), mexe = false;
      Est.relogio += dt;
      if (Est.sujo) { pintaEstatico(); Est.sujo = false; Est.sujoE = true; }
      Est.fixos.forEach(function (f) { if (f.flash > 0) { f.flash = Math.max(0, f.flash - dt * 1.6); if (visivel(f)) { vivo = true; bb = uneBB(bb, f.pw.x - m, f.pw.y - m, f.pw.x + m, f.pw.y + m); } } });
      Est.eixos.forEach(function (ax) { seguro('eixo:' + ax.id, function () { passoEixo(ax, dt); }); if (visEixo(ax)) { if (ax.ativo) mexe = true; bb = uneBB(bb, ax.bb.x0, ax.bb.y0, ax.bb.x1, ax.bb.y1); } });
      var desenha = mexe || Est.eixosAntes || Est.sujoE;       // o tronco parado é liso: só se redesenha quando algo se mexe       // no modo leve (sem ondulação) só se redesenha quando algo se mexe
      Est.eixosAntes = mexe; Est.sujoE = false;
      if (!vivo && !desenha && !Est.bbAnt) return;
      if (!desenha && !vivo) return;
      var lim = Est.bbAnt ? (bb ? uneBB(bb, Est.bbAnt.x0, Est.bbAnt.y0, Est.bbAnt.x1, Est.bbAnt.y1) : Est.bbAnt) : bb;     // só se limpa o que foi pintado antes e o que vai ser pintado agora
      Est.ctxP.setTransform(Est.dprP, 0, 0, Est.dprP, 0, 0);
      if (lim) Est.ctxP.clearRect(Math.floor(lim.x0 * Est.T.K + Est.T.TX), Math.floor(lim.y0 * Est.T.K + Est.T.TY), Math.ceil((lim.x1 - lim.x0) * Est.T.K) + 3, Math.ceil((lim.y1 - lim.y0) * Est.T.K) + 3);
      Est.bbAnt = bb;
      aplicaT(Est.ctxP);
      Est.ctxP.globalCompositeOperation = 'lighter';
      Est.fixos.forEach(function (f) { if (f.flash > 0 && visivel(f)) pintaFixo(f); });
      Est.ctxP.globalCompositeOperation = 'source-over';
      Est.eixos.forEach(function (ax) { if (visEixo(ax)) seguro('eixo:' + ax.id, function () { pintaEixo(ax); }); });
    }

    // ---------------------------------------------------------------- as ligações (pares de axônios de mão única, que terminam em ventosa no vidro)
    Est.ligMapa = {}; Est.ligMapaTodo = {}; Est.nomeMod = {}; Est.idAg = cfg.agentes.map(function (a) { return a.id; });
    // v0.5.0: os módulos para os quais o agente tem axônio: os que ele pede, na ordem dos dados, sem repetir e no máximo 4; sem pedidos, um só, o módulo mais perto dele
    // (a distância do centro do agente até o ponto do módulo no vidro do Núcleo). Só vale depois de `montarLigacoes` (precisa de `Est.fixoMod`).
    function modulosDe(id) {
      var ids = cfg.nucleo.modulosIds || [], lista = (cfg.pedidos && cfg.pedidos[id]) || [], out = [];
      lista.forEach(function (m) { var i = ids.indexOf(m); if (i >= 0 && out.indexOf(i) < 0 && out.length < 4) out.push(i); });
      if (out.length) return out;
      var E = esf[id], melhor = -1, dm = 1e18;
      if (E) Est.fixoMod.forEach(function (f, i) { if (!f) return; var dd = Math.hypot(f.pw.x - E.cx, f.pw.y - E.cy); if (dd < dm) { dm = dd; melhor = i; } });
      return melhor >= 0 ? [melhor] : [];
    }
    // o ângulo (relativo à pista do axônio) do ponto do vidro do módulo; dois axônios no mesmo módulo pousam um ao lado do outro
    function alvoRel(ax, idx) {
      var fx = Est.fixoMod[idx], base = fx.ang, cont = 0;
      Est.eixos.forEach(function (o) { if (o.tipo === 'i' && o !== ax && Math.abs(volta(o.thL + o.dPara - base)) < 0.07) cont++; });
      var shift = cont ? (cont % 2 ? 1 : -1) * Math.ceil(cont / 2) * 0.12 : 0;
      return volta(base + shift - ax.thL);
    }

    // ---------------------------------------------------------------- o ciclo de um pedido (a cor de quem pediu vale do começo ao fim)
    //   agente (axônio na cor dele) -> parede do Núcleo -> ramo do terminal -> dendrito do módulo -> módulo -> neurônio central
    //   -> axônio violeta (com o pulso na cor de quem pediu) -> parede do agente -> dendrito do agente: o agente recebe
    Est.ciclo = 0; Est.fila = []; Est.tempo = 0; Est.proximo = 1.2; Est.ocupado = {}; Est.pedidoDe = {}; Est.automatico = true;


    // ---------------------------------------------------------------- ajuste ao tamanho do palco (refaz tudo; chamado na abertura e ao redimensionar)
    function ajustar(largura, altura) {
      Est.W = Math.max(320, Math.round(largura)); Est.H = Math.max(240, Math.round(altura));
      raiz.style.width = Est.W + 'px'; raiz.style.height = Est.H + 'px';
      medir();
      if (Est.foco) { var f0 = Est.foco; Est.foco = null; raiz.classList.remove('em-foco'); ordem.forEach(function (k) { esf[k].canvas.classList.remove('esmaece'); }); esf[f0].n.lupaLigar(false); esf[f0].canvas.style.pointerEvents = 'auto'; }
      Est.TF = { k: 1, tx: 0, ty: 0 }; Est.T = { K: 1, TX: 0, TY: 0 };
      ordem.forEach(function (id) { var e = esf[id], c = caixaDe(e); pos(e, c); e.n.redimensionar(c.w, c.h); });
      Est.dprP = leve ? 1 : Math.min(window.devicePixelRatio || 1, 3);
      caixaPar.width = Math.round(Est.W * Est.dprP); caixaPar.height = Math.round(Est.H * Est.dprP);
      caixaPar.style.left = '0px'; caixaPar.style.top = '0px'; caixaPar.style.width = Est.W + 'px'; caixaPar.style.height = Est.H + 'px';
      caixaFix.width = caixaPar.width; caixaFix.height = caixaPar.height;
      caixaFix.style.left = '0px'; caixaFix.style.top = '0px'; caixaFix.style.width = Est.W + 'px'; caixaFix.style.height = Est.H + 'px'; Est.bbAnt = null;
      Est.ciclo++; Est.fila.length = 0; Est.ocupado = {}; Est.pedidoDe = {};
      montarLigacoes();
      var kf = Math.max(0.58, Math.min(1, Est.s / 0.4));                         // os nomes encolhem junto com a cena (celular)
      ordem.forEach(function (id) {
        var e = esf[id]; if (!e.botao) return;
        var base = id === 'nucleo' ? 19 : cfg.satelite && id === cfg.satelite.id ? 12 : 15;
        e.botao.style.fontSize = (base * kf).toFixed(1) + 'px'; e.botao.style.padding = Math.round(4 * kf) + 'px ' + Math.round(12 * kf) + 'px';
        e.botao.style.left = Math.round(e.cx) + 'px'; e.botao.style.top = Math.round(e.cy + e.R + 3) + 'px';
      });
      ordem.forEach(function (id) { esf[id].n.iniciar(); });
    }

    function quadro(dt) {
      Est.tempo += dt;
      for (var i = Est.fila.length - 1; i >= 0; i--) if (Est.fila[i].t <= Est.tempo) { var it = Est.fila.splice(i, 1)[0]; it.fn(); }
      Est.proximo -= dt;
      if (Est.proximo <= 0) { if (Est.automatico) sortear(); Est.proximo = 1.0 + usa.base.acaso() * 1.6; }
      // falha contida (v0.4.2): cada esfera e cada axônio roda dentro de usa.base.seguro; se um der erro, só ele é desligado (no teste o erro sobe)
      ordem.forEach(function (id) { seguro('esfera:' + id, function () { esf[id].n.passo(dt); }); });
      if (Est.foco) {
        var id = Est.foco;
        seguro('esfera:' + id, function () {
          var e = esf[id]; e.n.desenhar();
          var st = e.n.lupa.estado();                           // a lupa da esfera em foco manda; os axônios e a parede a seguem
          vistaTotal(st.z, st.ox, st.oy, false);
        });
      } else ordem.forEach(function (id) { seguro('esfera:' + id, function () { esf[id].n.desenhar(); }); });
      passoPar(dt);
    }

    // os nomes: botões sob cada esfera (texto sempre por textContent)
    function nomes() {
      ordem.forEach(function (id) {
        var e = esf[id], b = document.createElement('button');
        b.type = 'button'; b.className = 'nome' + (id === 'nucleo' ? ' nome-nucleo' : '') + (cfg.satelite && id === cfg.satelite.id ? ' nome-sat' : '');
        b.textContent = e.nome; b.style.setProperty('--c', e.cor);
        b.setAttribute('aria-label', e.nome + ': ampliar');
        b.addEventListener('click', function () { if (Est.foco === id) sair(); else focar(id); });
        raiz.appendChild(b); e.botao = b;
      });
    }
    // cena/posicoes (v0.4.2): as posições e os tamanhos da cena: o desenho em unidades da cena (UC), a posição de cada esfera, o canal de ligação, medir para o palco, e as caixas e contornos que as ligações usam.
    const P_posicoes = usa.posicoes.criar(Est, {});
    const canalUC = P_posicoes.canalUC, medir = P_posicoes.medir, caixaDe = P_posicoes.caixaDe, pos = P_posicoes.pos, paraPalco = P_posicoes.paraPalco, contornoMaisPerto = P_posicoes.contornoMaisPerto, maisLonge = P_posicoes.maisLonge;
    // cena/ciclo (v0.4.2): o ciclo de um pedido: quem pede, o pulso que vai e volta, a fila de tarefas e o recomeço do ciclo quando a vista muda.
    const P_ciclo = usa.ciclo.criar(Est, { modulosDe: modulosDe });
    const pedir = P_ciclo.pedir, chegou = P_ciclo.chegou, sortear = P_ciclo.sortear, reiniciaCiclo = P_ciclo.reiniciaCiclo;
    // cena/foco (v0.4.2): o foco numa esfera: ela ocupa o palco e ganha a lupa; a vista das camadas da parede e a volta à vista geral.
    const P_foco = usa.foco.criar(Est, { caixaDe: P_posicoes.caixaDe, pos: P_posicoes.pos, reiniciaCiclo: P_ciclo.reiniciaCiclo });
    const focar = P_foco.focar, sair = P_foco.sair, vistaTotal = P_foco.vistaTotal;
    // cena/eixos (v0.4.2): a vida de cada axônio da cena: medir, pintar, refazer o caminho e o passo do tempo (cone de crescimento, pulso).
    const P_eixos = usa.eixos.criar(Est, { raioVent: raioVent, chegou: P_ciclo.chegou });
    const medeEixo = P_eixos.medeEixo, pintaEixo = P_eixos.pintaEixo, refazEixo = P_eixos.refazEixo, visEixo = P_eixos.visEixo, passoEixo = P_eixos.passoEixo;
    // cena/rotas (v0.5.0): escolhe o lado, a pista, a ordem e o ponto de pouso de cada axônio de entrada.
    const P_rotas = usa.rotas.criar(Est, { raioVent: raioVent, refazEixo: P_eixos.refazEixo });
    // cena/ligar (v0.5.0): monta as ligações da cena: o axônio violeta de volta de cada agente e um axônio de entrada parado para cada módulo que ele pede.
    const P_ligar = usa.ligar.criar(Est, { raioVent: raioVent, modulosDe: modulosDe, alvoRel: alvoRel, canalUC: P_posicoes.canalUC, caixaDe: P_posicoes.caixaDe, paraPalco: P_posicoes.paraPalco, contornoMaisPerto: P_posicoes.contornoMaisPerto, maisLonge: P_posicoes.maisLonge, medeEixo: P_eixos.medeEixo, refazEixo: P_eixos.refazEixo, escolherRotas: P_rotas.escolher });
    const montarLigacoes = P_ligar.montarLigacoes;
    // FIM DOS BLOCOS DAS PARTES
    nomes();

    return {
      ajustar: ajustar, quadro: quadro, focar: focar, sair: sair,
      foco: function () { return Est.foco; },
      aoMudar: function (fn) { Est.ouvinte = typeof fn === 'function' ? fn : null; },
      esferas: function () { return esf; },
      ligacoes: function () { return { lista: Est.nLig.map(function (ax) { return { id: ax.id, caminho: ax.pts, larg: ax.larg, estado: ax.estado }; }), mapa: Est.ligMapa }; },
      parede: function () { return { fixos: Est.fixos, ramos: Est.eixos.filter(function (ax) { return ax.estado !== 'repouso'; }), fixoAg: Est.fixoAg, eixos: Est.eixos }; },
      escala: function () { return Est.s; },
      pedir: pedir, enviar: pedir, automatico: function (b) { Est.automatico = !!b; },
      lupa: function () { return Est.foco ? esf[Est.foco].n.lupa : null; }
    };
  }

  return { criar: criar };
}

);
