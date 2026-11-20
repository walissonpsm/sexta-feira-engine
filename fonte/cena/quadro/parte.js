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
      var n = usa.celula.criar(cv, Object.assign({ cor: cor, semente: semente, leve: leve, lupa: false, margem: Est.MG }, extra));
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
    novaEsfera('nucleo', cfg.nucleo.nome, cfg.nucleo.cor, cfg.nucleo.semente || 94127, Object.assign({ semEixo: true, quieto: true, rede: (cfg.nucleo.modulos || []).length, anel: 400, raioMax: 500, sobra: 0.55, miniEsc: 0.42,
      cores: cfg.nucleo.modulos || [], arcos: [[-150, -38], [38, 124]], corredor: 42 }, cfg.nucleo.opcoes || {}), null);
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
    function irPara(ax, dPara, dur) { ax.dDe = ax.dC; ax.dPara = dPara; ax.mt = 0; ax.mdur = Math.max(0.05, dur); }
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
      Est.eixos.forEach(function (ax) { passoEixo(ax, dt); if (visEixo(ax)) { if (ax.ativo) mexe = true; bb = uneBB(bb, ax.bb.x0, ax.bb.y0, ax.bb.x1, ax.bb.y1); } });
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
      Est.eixos.forEach(function (ax) { if (visEixo(ax)) pintaEixo(ax); });
    }

    // ---------------------------------------------------------------- as ligações (pares de axônios de mão única, que terminam em ventosa no vidro)
    Est.ligMapa = {}; Est.ligMapaTodo = {}; Est.nomeMod = {}; Est.idAg = cfg.agentes.map(function (a) { return a.id; });
    function modulosDe(id) {
      var ids = cfg.nucleo.modulosIds || [], lista = (cfg.pedidos && cfg.pedidos[id]) || [], out = [];
      lista.forEach(function (m) { var i = ids.indexOf(m); if (i >= 0) out.push(i); });
      if (!out.length) (cfg.nucleo.modulos || []).forEach(function (_, i) { out.push(i); });
      return out;
    }
    // o ângulo (relativo à pista do axônio) do ponto do vidro do módulo; dois axônios no mesmo módulo pousam um ao lado do outro
    function alvoRel(ax, idx) {
      var fx = Est.fixoMod[idx], base = fx.ang, cont = 0;
      Est.eixos.forEach(function (o) { if (o.tipo === 'i' && o !== ax && Math.abs(volta(o.thL + o.dPara - base)) < 0.07) cont++; });
      var shift = cont ? (cont % 2 ? 1 : -1) * Math.ceil(cont / 2) * 0.12 : 0;
      return volta(base + shift - ax.thL);
    }
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
        Est.ventosas.push(vO, vI); Est.ventById[vO.id] = vO; Est.ventById[vI.id] = vI;
        var novo = function (id, tipo, larg, corRgb, vent) {
          var ax = { id: id, tipo: tipo, ag: a.id, larg: larg, corRgb: corRgb, vent: vent, base: [], pts: [], cum: [], nx: [], ny: [], len: 1, bb: null, a0: 3.2 * larg, pitch: 5.5 * larg, nNos: 0,
            nos: new Array(160).fill(0), pulso: null, pulsoCor: cor, estado: 'repouso', vel: 1500 * Est.s, fase: (hash(id) % 628) / 100, passo: passo, pulo: Math.max(1, Math.round(10 / passo)), ativo: false, sujoG: false,
            mdur: 0, mt: 0, dC: 0, dDe: 0, dPara: 0, dRep: 0, espera: 0, p: 1, pAlvo: 1, thL: thI, rA: rA, head: head, drop: drop };
          Est.eixos.push(ax); Est.eixoById[id] = ax; return ax;
        };
        var axO = novo('o-' + a.id, 'o', 24 * Est.s, rgbDe(VIOLETA), vO); axO.base = curva(pO, passo); medeEixo(axO);
        var axI = novo('i-' + a.id, 'i', 15 * Est.s, cor, vI);
        var rest = modulosDe(a.id)[0];
        axI.dPara = axI.dC = axI.dRep = Est.fixoMod[rest] ? alvoRel(axI, rest) : 0;
        refazEixo(axI);
        lista.push(axO, axI);
        var bA = caixaDe(A);
        mapa['o-' + a.id] = { agente: a, para: A, alvo: { x: ponta.x - bA.x, y: ponta.y - bA.y } };
        mapa['i-' + a.id] = { agente: a, para: null };
      });
      Est.nLig = lista;
      Est.ligMapa = mapa; Est.ligMapaTodo = mapa;
      Est.sujo = true; Est.sujoE = true;
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
      ordem.forEach(function (id) { esf[id].n.passo(dt); });
      if (Est.foco) {
        var e = esf[Est.foco]; e.n.desenhar();
        var st = e.n.lupa.estado();                           // a lupa da esfera em foco manda; os axônios e a parede a seguem
        vistaTotal(st.z, st.ox, st.oy, false);
      } else ordem.forEach(function (id) { esf[id].n.desenhar(); });
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
    const P_ciclo = usa.ciclo.criar(Est, { irPara: irPara, modulosDe: modulosDe, alvoRel: alvoRel });
    const pedir = P_ciclo.pedir, chegou = P_ciclo.chegou, sortear = P_ciclo.sortear, reiniciaCiclo = P_ciclo.reiniciaCiclo;
    // cena/foco (v0.4.2): o foco numa esfera: ela ocupa o palco e ganha a lupa; a vista das camadas da parede e a volta à vista geral.
    const P_foco = usa.foco.criar(Est, { caixaDe: P_posicoes.caixaDe, pos: P_posicoes.pos, reiniciaCiclo: P_ciclo.reiniciaCiclo });
    const focar = P_foco.focar, sair = P_foco.sair, vistaTotal = P_foco.vistaTotal;
    // cena/eixos (v0.4.2): a vida de cada axônio da cena: medir, pintar, refazer o caminho e o passo do tempo (cone de crescimento, pulso).
    const P_eixos = usa.eixos.criar(Est, { raioVent: raioVent, irPara: irPara, chegou: P_ciclo.chegou });
    const medeEixo = P_eixos.medeEixo, pintaEixo = P_eixos.pintaEixo, refazEixo = P_eixos.refazEixo, visEixo = P_eixos.visEixo, passoEixo = P_eixos.passoEixo;
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
