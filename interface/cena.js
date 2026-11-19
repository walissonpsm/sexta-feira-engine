/* GERADO por ferramentas/montar-interface.sh a partir de fonte/ (versão 0.4.1). NÃO edite aqui: edite a parte em fonte/ e rode o montador. */
// ---- fonte/cena/quadro/parte.js
SF.parte({nome:'cena/quadro',porta:1,compativelDesde:1,requer:['neuronio/celula@1','comum/sorteio@1','comum/cores@1','comum/curvas@1','ligacoes/ponta@1','ligacoes/pulso@1','ligacoes/tronco@1','ligacoes/pistas@1'],guarda:true,dom:true},
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
    var leve = !!cfg.leve;
    var W = 1000, H = 600, s = 0.5, MG = 9;      // MG: a margem do canvas de cada esfera (o vidro desliza e brilha para fora do raio)
    var esf = {};                        // id -> { id, nome, cor, canvas, n, cx, cy, R, lado, giro, botao }
    var ordem = [];                      // ids na ordem de desenho (agentes, satélite, Núcleo)
    var foco = null, ouvinte = null, nLig = [];
    var VIOLETA = cfg.nucleo.cor;

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
    var POS = posicoes();

    function novaEsfera(id, nome, cor, semente, extra, lado) {
      var cv = document.createElement('canvas');
      cv.className = 'esfera';
      cv.setAttribute('data-id', id);
      raiz.appendChild(cv);
      var n = usa.celula.criar(cv, Object.assign({ cor: cor, semente: semente, leve: leve, lupa: false, margem: MG }, extra));
      var e = { id: id, nome: nome, cor: cor, canvas: cv, n: n, cx: 0, cy: 0, R: 10, lado: lado, giro: 0, botao: null, extra: extra };
      esf[id] = e;
      cv.style.pointerEvents = 'auto';
      cv.addEventListener('wheel', function (ev) { if (!foco && ev.deltaY < 0) { ev.preventDefault(); focar(id); } }, { passive: false });
      cv.addEventListener('dblclick', function () { if (!foco) focar(id); });
      return e;
    }

    // o canal de cada agente no Núcleo (dentro da folga entre dendritos: à direita em torno de 0°, à esquerda em torno de 163,5°) e o ângulo,
    // visto do agente, até ele
    function canalUC(a) {
      var p = POS[a.id], dir = Math.atan2(p.y, p.x), gc = a.lado === 'dir' ? 0 : Math.PI - 16.5 * Math.PI / 180, gam = a.lado === 'dir' ? 0.70 : 0.65;
      var th = gc + gam * volta(dir - gc), wx = 475 * Math.cos(th), wy = 475 * Math.sin(th);
      return { th: th, phi: Math.atan2(wy - p.y, wx - p.x) };
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
    var caixaPar = document.createElement('canvas');
    caixaPar.className = 'parede';
    raiz.appendChild(caixaPar);
    var caixaFix = document.createElement('canvas');           // os receptores parados (desenhados uma vez); a camada de cima só tem o que se mexe
    caixaFix.className = 'parede';
    raiz.insertBefore(caixaFix, caixaPar);
    var ctxP = caixaPar.getContext('2d'), ctxF = caixaFix.getContext('2d'), dprP = 1, bbAnt = null;

    // ---------------------------------------------------------------- tamanho e posição de tudo
    function medir() {
      var curto = H < 520, topo = curto ? 34 : 44, base = curto ? 54 : 76;           // faixas dos selos (em cima) e da lupa (embaixo); em tela baixa (celular deitado) ficam menores
      s = Math.max(0.05, Math.min(W / UC.largura, (H - topo - base) / UC.altura));
      var ox = W / 2, oy = topo + (H - topo - base) / 2;
      Object.keys(POS).forEach(function (id) {
        var e = esf[id], p = POS[id];
        e.cx = ox + p.x * s; e.cy = oy + (p.y - UC.centroY) * s; e.R = p.r * s;
      });
    }
    function caixaDe(e) { var lado = Math.round(2 * e.R + 2 * MG); return { x: Math.round(e.cx - lado / 2), y: Math.round(e.cy - lado / 2), w: lado, h: lado }; }
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

    // ---------------------------------------------------------------- a camada da parede: receptores, ventosas (os terminais) e os braços dos axônios
    var fixos = [], fixoAg = {}, fixoMod = [], ramos = [], ventosas = [], ventById = {}, sujo = true;
    var TF = { k: 1, tx: 0, ty: 0 }, T = { K: 1, TX: 0, TY: 0 };      // TF: a esfera em foco cabe no palco; T: a vista total (TF mais a lupa dela)
    function aplicaT(c) { c.setTransform(dprP * T.K, 0, 0, dprP * T.K, dprP * T.TX, dprP * T.TY); }
    function visivel(it) {                // no foco, só o que toca a esfera ampliada
      if (!foco) return true;
      if (it.mod || it.noN) return foco === 'nucleo';
      return it.ag === foco;
    }
    var ponta = usa.ponta, tronco = usa.tronco, pistas = usa.pistas;
    function luz(x, y, r, c, a) { ponta.luz(ctxP, x, y, r, c, a); }
    function espVent() { return ponta.espVent(s); }
    function raioVent(R) { return ponta.raioVent(s, R); }
    function pintaFixo(f) {
      var c = f.cor, u = Math.max(1.2, 4.2 * s);
      ctxP.lineCap = 'round';
      if (f.de) {                         // o último trecho do dendrito, da ponta que já estava até o vidro
        ctxP.beginPath(); ctxP.moveTo(f.de.x, f.de.y); ctxP.quadraticCurveTo(f.ctl.x, f.ctl.y, f.pw.x, f.pw.y);
        ctxP.strokeStyle = rgba(c, 0.30); ctxP.lineWidth = u * 1.5; ctxP.stroke();
        ctxP.strokeStyle = rgba(clar(c), 0.90); ctxP.lineWidth = u * 0.55; ctxP.stroke();
      }
      luz(f.pw.x, f.pw.y, u * (1.5 + f.flash * 2.6), c, 0.50 + 0.50 * f.flash);
      ctxP.fillStyle = rgba(clar(c), 0.95); ctxP.beginPath(); ctxP.arc(f.pw.x, f.pw.y, u * 0.72, 0, 6.2832); ctxP.fill();
    }
    // ---------------------------------------------------------------- os axônios vivos: um por agente para o Núcleo (na cor dele) e um do Núcleo para o agente (violeta)
    // Cada um tem uma linha central (base) que o agente-para-Núcleo recalcula quando o alvo se move; por cima dela vai a ondulação parada. A bainha de mielina
    // são tubos de tamanho fixo contados a partir do começo (então crescem pela ponta quando o tronco se estica), com a cintura do nódulo entre eles.
    var eixos = [], eixoById = {}, sujoE = true, eixosAntes = false, relogio = 0;
    function medeEixo(ax) { tronco.medir(s, ax); }
    function caminhoI(ax) { var N = esf.nucleo; return pistas.caminho(N, raioVent(N.R), ax); }
    function pintaEixo(ax) { tronco.pintar(ctxP, s, relogio, ax); }
    function refazEixo(ax) { ax.base = ax.tipo === 'i' ? caminhoI(ax) : ax.base; medeEixo(ax); ax.sujoG = false; }
    function visEixo(ax) { return !foco || foco === 'nucleo' || ax.ag === foco; }
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
        if (ax.estado === 'preso') { ax.espera -= dt; if (ax.espera <= 0) { ax.estado = 'voltando'; ax.pAlvo = 0; irPara(ax, ax.dRep, 0.5 + 0.7 * Math.min(1, Math.abs(ax.dRep - ax.dC))); } }
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
    function irPara(ax, dPara, dur) { ax.dDe = ax.dC; ax.dPara = dPara; ax.mt = 0; ax.mdur = Math.max(0.05, dur); }
    function pintaEstatico() {
      var salvo = ctxP; ctxP = ctxF;
      ctxF.setTransform(dprP, 0, 0, dprP, 0, 0); ctxF.clearRect(0, 0, W, H); aplicaT(ctxF); ctxF.globalCompositeOperation = 'lighter';
      fixos.forEach(function (f) { if (!visivel(f)) return; var fl = f.flash; f.flash = 0; pintaFixo(f); f.flash = fl; });
      ctxF.globalCompositeOperation = 'source-over';
      ctxP = salvo;
    }
    function uneBB(b, x0, y0, x1, y1) { if (!b) return { x0: x0, y0: y0, x1: x1, y1: y1 }; return { x0: Math.min(b.x0, x0), y0: Math.min(b.y0, y0), x1: Math.max(b.x1, x1), y1: Math.max(b.y1, y1) }; }
    function passoPar(dt) {
      var vivo = false, bb = null, m = 16 * Math.max(1.2, 4.2 * s), mexe = false;
      relogio += dt;
      if (sujo) { pintaEstatico(); sujo = false; sujoE = true; }
      fixos.forEach(function (f) { if (f.flash > 0) { f.flash = Math.max(0, f.flash - dt * 1.6); if (visivel(f)) { vivo = true; bb = uneBB(bb, f.pw.x - m, f.pw.y - m, f.pw.x + m, f.pw.y + m); } } });
      eixos.forEach(function (ax) { passoEixo(ax, dt); if (visEixo(ax)) { if (ax.ativo) mexe = true; bb = uneBB(bb, ax.bb.x0, ax.bb.y0, ax.bb.x1, ax.bb.y1); } });
      var desenha = mexe || eixosAntes || sujoE;       // o tronco parado é liso: só se redesenha quando algo se mexe       // no modo leve (sem ondulação) só se redesenha quando algo se mexe
      eixosAntes = mexe; sujoE = false;
      if (!vivo && !desenha && !bbAnt) return;
      if (!desenha && !vivo) return;
      var lim = bbAnt ? (bb ? uneBB(bb, bbAnt.x0, bbAnt.y0, bbAnt.x1, bbAnt.y1) : bbAnt) : bb;     // só se limpa o que foi pintado antes e o que vai ser pintado agora
      ctxP.setTransform(dprP, 0, 0, dprP, 0, 0);
      if (lim) ctxP.clearRect(Math.floor(lim.x0 * T.K + T.TX), Math.floor(lim.y0 * T.K + T.TY), Math.ceil((lim.x1 - lim.x0) * T.K) + 3, Math.ceil((lim.y1 - lim.y0) * T.K) + 3);
      bbAnt = bb;
      aplicaT(ctxP);
      ctxP.globalCompositeOperation = 'lighter';
      fixos.forEach(function (f) { if (f.flash > 0 && visivel(f)) pintaFixo(f); });
      ctxP.globalCompositeOperation = 'source-over';
      eixos.forEach(function (ax) { if (visEixo(ax)) pintaEixo(ax); });
    }

    // ---------------------------------------------------------------- as ligações (pares de axônios de mão única, que terminam em ventosa no vidro)
    var ligMapa = {}, ligMapaTodo = {}, nomeMod = {}, idAg = cfg.agentes.map(function (a) { return a.id; });
    function modulosDe(id) {
      var ids = cfg.nucleo.modulosIds || [], lista = (cfg.pedidos && cfg.pedidos[id]) || [], out = [];
      lista.forEach(function (m) { var i = ids.indexOf(m); if (i >= 0) out.push(i); });
      if (!out.length) (cfg.nucleo.modulos || []).forEach(function (_, i) { out.push(i); });
      return out;
    }
    // o ângulo (relativo à pista do axônio) do ponto do vidro do módulo; dois axônios no mesmo módulo pousam um ao lado do outro
    function alvoRel(ax, idx) {
      var fx = fixoMod[idx], base = fx.ang, cont = 0;
      eixos.forEach(function (o) { if (o.tipo === 'i' && o !== ax && Math.abs(volta(o.thL + o.dPara - base)) < 0.07) cont++; });
      var shift = cont ? (cont % 2 ? 1 : -1) * Math.ceil(cont / 2) * 0.12 : 0;
      return volta(base + shift - ax.thL);
    }
    function montarLigacoes() {
      var N = esf.nucleo, gN = paraPalco(N, N.n.geometria()), lista = [], mapa = {};
      var f = 0.40 * s, LAT = 0.5, d = 15 * s, passo = Math.max(3, 5 * s), meia = 0.8 * 150 * f * LAT;
      fixos = []; fixoAg = {}; fixoMod = []; ventosas = []; ventById = {}; eixos = []; eixoById = {};
      var rv = raioVent(N.R);

      // os receptores dos módulos: o ponto de dendrito de cada um que chega mais perto do vidro, e o último trecho até ele
      var cN = { x: gN.cx, y: gN.cy }, boxN = caixaDe(N);
      N.n.minisGeometria().forEach(function (m) {
        var p0 = { x: m.parede[0] + boxN.x, y: m.parede[1] + boxN.y }, ang = Math.atan2(p0.y - cN.y, p0.x - cN.x), r0 = Math.hypot(p0.x - cN.x, p0.y - cN.y);
        var pw = { x: cN.x + 0.996 * N.R * Math.cos(ang), y: cN.y + 0.996 * N.R * Math.sin(ang) };
        var lado = (hash('m' + m.idx) % 2 ? 1 : -1) * 0.14 * Math.hypot(pw.x - p0.x, pw.y - p0.y);
        var fx = { cor: m.rgb, pw: pw, de: r0 < 0.985 * N.R ? p0 : null, ctl: { x: (p0.x + pw.x) / 2 - Math.sin(ang) * lado, y: (p0.y + pw.y) / 2 + Math.cos(ang) * lado }, flash: 0, ang: ang, idx: m.idx, mod: true };
        fixos.push(fx); fixoMod[m.idx] = fx;
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
        fixos.push(fa); fixoAg[a.id] = fa;

        // ---- Núcleo -> agente (violeta): sai do corpo do neurônio central, pelo raio do canal, atravessa o vidro e PARA no vidro do agente
        var So = contornoMaisPerto(gN, th);
        var rvA = raioVent(A.R), fora = 70 * s;                                          // a ventosa pousa no vidro; o axônio chega de frente (de fora, no raio)
        var rO = polar(Acx, Acy, rvA, omA), CfO = polar(Acx, Acy, rvA + fora, omA);
        var NxO = { x: N.cx + N.R * 1.10 * Math.cos(th) + oO.x, y: N.cy + N.R * 1.10 * Math.sin(th) + oO.y };
        var pO = [So, { x: N.cx + 0.5 * WN * Math.cos(th) + oO.x * 0.5, y: N.cy + 0.5 * WN * Math.sin(th) + oO.y * 0.5 }, NxO,
          { x: (NxO.x + CfO.x) / 2, y: (NxO.y + CfO.y) / 2 }, CfO, rO];

        // ---- agente -> Núcleo (na cor do agente): sai do corpo do agente, atravessa o vidro dele e segue pelo canal até o vidro do Núcleo
        var Si = contornoMaisPerto(gA, phi), rank = Math.max(0, idAg.indexOf(a.id));
        var rawN = { x: N.cx + N.R * Math.cos(th) + uI.x * (d + 0.85 * meia), y: N.cy + N.R * Math.sin(th) + uI.y * (d + 0.85 * meia) };
        var thI = Math.atan2(rawN.y - N.cy, rawN.x - N.cx), rA = N.R * 1.08 + 28 * s * rank, drop = 70 * s;
        var WaOut = { x: Acx + A.R * 1.12 * Math.cos(phi) + oI.x, y: Acy + A.R * 1.12 * Math.sin(phi) + oI.y }, Qm = polar(N.cx, N.cy, rA + drop, thI);
        var head = [Si, { x: Acx + 0.55 * A.R * Math.cos(phi) + oI.x * 0.5, y: Acy + 0.55 * A.R * Math.sin(phi) + oI.y * 0.5 }, WaOut, { x: (WaOut.x + Qm.x) / 2, y: (WaOut.y + Qm.y) / 2 }, Qm];

        var vO = { id: 'o-' + a.id, cx: Acx, cy: Acy, R: A.R, ang: omA, cor: rgbDe(VIOLETA), ag: a.id, flash: 0, anel: 0 };
        var vI = { id: 'i-' + a.id, cx: N.cx, cy: N.cy, R: N.R, ang: thI, cor: cor, ag: a.id, noN: true, flash: 0, anel: 0 };
        ventosas.push(vO, vI); ventById[vO.id] = vO; ventById[vI.id] = vI;
        var novo = function (id, tipo, larg, corRgb, vent) {
          var ax = { id: id, tipo: tipo, ag: a.id, larg: larg, corRgb: corRgb, vent: vent, base: [], pts: [], cum: [], nx: [], ny: [], len: 1, bb: null, a0: 3.2 * larg, pitch: 5.5 * larg, nNos: 0,
            nos: new Array(160).fill(0), pulso: null, pulsoCor: cor, estado: 'repouso', vel: 1500 * s, fase: (hash(id) % 628) / 100, passo: passo, pulo: Math.max(1, Math.round(10 / passo)), ativo: false, sujoG: false,
            mdur: 0, mt: 0, dC: 0, dDe: 0, dPara: 0, dRep: 0, espera: 0, p: 1, pAlvo: 1, thL: thI, rA: rA, head: head, drop: drop };
          eixos.push(ax); eixoById[id] = ax; return ax;
        };
        var axO = novo('o-' + a.id, 'o', 24 * s, rgbDe(VIOLETA), vO); axO.base = curva(pO, passo); medeEixo(axO);
        var axI = novo('i-' + a.id, 'i', 15 * s, cor, vI);
        var rest = modulosDe(a.id)[0];
        axI.dPara = axI.dC = axI.dRep = fixoMod[rest] ? alvoRel(axI, rest) : 0;
        refazEixo(axI);
        lista.push(axO, axI);
        var bA = caixaDe(A);
        mapa['o-' + a.id] = { agente: a, para: A, alvo: { x: ponta.x - bA.x, y: ponta.y - bA.y } };
        mapa['i-' + a.id] = { agente: a, para: null };
      });
      nLig = lista;
      ligMapa = mapa; ligMapaTodo = mapa;
      sujo = true; sujoE = true;
    }

    // ---------------------------------------------------------------- o ciclo de um pedido (a cor de quem pediu vale do começo ao fim)
    //   agente (axônio na cor dele) -> parede do Núcleo -> ramo do terminal -> dendrito do módulo -> módulo -> neurônio central
    //   -> axônio violeta (com o pulso na cor de quem pediu) -> parede do agente -> dendrito do agente: o agente recebe
    var ciclo = 0, fila = [], tempo = 0, proximo = 1.2, ocupado = {}, pedidoDe = {}, automatico = true;
    function agendar(seg, fn) { fila.push({ t: tempo + seg, fn: fn }); }
    function disparar(lid, hex) { var ax = eixoById[lid]; if (!ax) return; ax.pulso = { u: 0, k: 0 }; ax.pulsoCor = rgbDe(hex); }
    function pedir(id, idxMod) {
      var a = esf[id], ax = eixoById['i-' + id]; if (!a || !ax || !ligMapa['i-' + id] || ocupado[id]) return false;
      var lm = modulosDe(id); if (idxMod == null) idxMod = lm[Math.floor(usa.base.acaso() * lm.length)];
      if (!fixoMod[idxMod]) return false;
      ocupado[id] = true; pedidoDe[id] = idxMod;
      a.n.excitar(a.cor);
      var dP = alvoRel(ax, idxMod);                    // o axônio inteiro se curva até o módulo pedido (depois corre o pulso)
      ax.estado = 'indo'; ax.pulso = null; ax.pAlvo = 0; irPara(ax, dP, 0.3 + 0.5 * Math.min(1, Math.abs(dP - ax.dC) / 1.0));     // a ventosa se solta e vira cone de crescimento, que vai até o módulo
      return true;
    }
    function chegou(lid) {
      var m = ligMapa[lid]; if (!m) return;
      var id = m.agente.id, a = m.agente, N = esf.nucleo;
      if (lid.charAt(0) === 'i') {            // o pulso chegou à ventosa no vidro do Núcleo: a parede transmite ao dendrito do módulo pedido
        var mod = pedidoDe[id], fx = fixoMod[mod];
        if (fx) fx.flash = 1;
        N.n.excitarMini(mod, a.cor);          // o módulo recebe, na cor de quem pediu
        var g = ciclo;                        // se o foco mudar ou a tela for redimensionada no meio, o retorno de um pedido velho não faz nada
        agendar(0.30, function () {
          N.n.dispararMini(mod, a.cor, function () {      // o módulo levou o sinal até o neurônio central
            if (g !== ciclo) return;
            agendar(0.10, function () { N.n.excitar(a.cor); disparar('o-' + id, a.cor); });
          });
        });
      } else {                                 // o axônio violeta chegou à parede do agente: o dendrito dele leva o sinal ao corpo
        m.para.n.receber(m.alvo.x, m.alvo.y, a.cor);
        if (fixoAg[id]) fixoAg[id].flash = 1;
        if (ventById[lid]) ventById[lid].flash = 1;
        ocupado[id] = false;
        if (usa.base.acaso() < 0.55) agendar(2.0 + usa.base.acaso() * 3.0, function () { if (automatico) pedir(id); });     // e o ciclo recomeça
      }
    }
    function sortear() {
      var livres = cfg.agentes.filter(function (a) { return !ocupado[a.id] && ligMapa['i-' + a.id]; }), em = Object.keys(ocupado).filter(function (k) { return ocupado[k]; }).length;
      if (!livres.length || em >= 3) return;
      pedir(livres[Math.floor(usa.base.acaso() * livres.length)].id);
    }

    // ---------------------------------------------------------------- o foco numa esfera (nome ou roda do mouse): ela ocupa o palco e ganha a lupa
    function focar(id) {
      var e = esf[id]; if (!e) return;
      if (foco && foco !== id) sair();
      if (foco === id) return;
      foco = id;
      raiz.classList.add('em-foco');
      ordem.forEach(function (k) { esf[k].canvas.classList.toggle('esmaece', k !== id); });
      e.canvas.style.left = '0px'; e.canvas.style.top = '0px'; e.canvas.style.width = W + 'px'; e.canvas.style.height = H + 'px';
      e.n.redimensionar(W, H);
      e.n.lupaLigar(true);
      e.n.lupa.aoMudar(function (z) { if (ouvinte) ouvinte({ foco: foco, z: z }); });
      // as ligações que tocam essa esfera ficam e seguem a lupa dela (axônios e pulsos); a esfera inteira cabe no palco
      var Rf = Math.min(W, H) / 2 - MG, k = Rf / e.R;
      TF = { k: k, tx: W / 2 - k * e.cx, ty: H / 2 - k * e.cy };
      var ids = id === 'nucleo' ? null : ['o-' + id, 'i-' + id];
      ligMapa = {}; Object.keys(ligMapaTodo).forEach(function (q) { if (!ids || ids.indexOf(q) >= 0) ligMapa[q] = ligMapaTodo[q]; });
      reiniciaCiclo();
      vistaTotal(1, 0, 0, true);
      if (ouvinte) ouvinte({ foco: foco, z: 1 });
    }
    function reiniciaCiclo() {            // a troca de vista refaz as ligações: o que estava no ar recomeça do zero
      ciclo++; fila.length = 0; ocupado = {}; pedidoDe = {};
      ventosas.forEach(function (v) { v.flash = 0; v.anel = 0; });
      eixos.forEach(function (ax) { ax.pulso = null; ax.estado = 'repouso'; ax.mdur = 0; ax.nos.fill(0); if (ax.tipo === 'i') { ax.dC = ax.dPara = ax.dRep; ax.p = ax.pAlvo = 1; ax.sujoG = true; } });
      sujo = true;
    }
    function vistaTotal(z, ox, oy, forca) {       // a vista das camadas da parede: a da esfera em foco (TF) com a lupa dela por cima
      var K = z * TF.k, TX = z * TF.tx + ox, TY = z * TF.ty + oy;
      if (!forca && Math.abs(K - T.K) < 1e-9 && Math.abs(TX - T.TX) < 1e-6 && Math.abs(TY - T.TY) < 1e-6) return;
      T = { K: K, TX: TX, TY: TY };
      ctxP.setTransform(dprP, 0, 0, dprP, 0, 0); ctxP.clearRect(0, 0, W, H); bbAnt = null; sujo = true;
    }
    function sair() {
      if (!foco) return;
      var e = esf[foco]; foco = null;
      e.n.lupa.aoMudar(null);
      e.n.lupaLigar(false);
      e.canvas.style.pointerEvents = 'auto';
      raiz.classList.remove('em-foco');
      ordem.forEach(function (k) { esf[k].canvas.classList.remove('esmaece'); });
      var c = caixaDe(e); pos(e, c); e.n.redimensionar(c.w, c.h);
      TF = { k: 1, tx: 0, ty: 0 }; ligMapa = ligMapaTodo; reiniciaCiclo();
      vistaTotal(1, 0, 0, true);
      if (ouvinte) ouvinte({ foco: null, z: 1 });
    }

    // ---------------------------------------------------------------- ajuste ao tamanho do palco (refaz tudo; chamado na abertura e ao redimensionar)
    function ajustar(largura, altura) {
      W = Math.max(320, Math.round(largura)); H = Math.max(240, Math.round(altura));
      raiz.style.width = W + 'px'; raiz.style.height = H + 'px';
      medir();
      if (foco) { var f0 = foco; foco = null; raiz.classList.remove('em-foco'); ordem.forEach(function (k) { esf[k].canvas.classList.remove('esmaece'); }); esf[f0].n.lupaLigar(false); esf[f0].canvas.style.pointerEvents = 'auto'; }
      TF = { k: 1, tx: 0, ty: 0 }; T = { K: 1, TX: 0, TY: 0 };
      ordem.forEach(function (id) { var e = esf[id], c = caixaDe(e); pos(e, c); e.n.redimensionar(c.w, c.h); });
      dprP = leve ? 1 : Math.min(window.devicePixelRatio || 1, 3);
      caixaPar.width = Math.round(W * dprP); caixaPar.height = Math.round(H * dprP);
      caixaPar.style.left = '0px'; caixaPar.style.top = '0px'; caixaPar.style.width = W + 'px'; caixaPar.style.height = H + 'px';
      caixaFix.width = caixaPar.width; caixaFix.height = caixaPar.height;
      caixaFix.style.left = '0px'; caixaFix.style.top = '0px'; caixaFix.style.width = W + 'px'; caixaFix.style.height = H + 'px'; bbAnt = null;
      ciclo++; fila.length = 0; ocupado = {}; pedidoDe = {};
      montarLigacoes();
      var kf = Math.max(0.58, Math.min(1, s / 0.4));                         // os nomes encolhem junto com a cena (celular)
      ordem.forEach(function (id) {
        var e = esf[id]; if (!e.botao) return;
        var base = id === 'nucleo' ? 19 : cfg.satelite && id === cfg.satelite.id ? 12 : 15;
        e.botao.style.fontSize = (base * kf).toFixed(1) + 'px'; e.botao.style.padding = Math.round(4 * kf) + 'px ' + Math.round(12 * kf) + 'px';
        e.botao.style.left = Math.round(e.cx) + 'px'; e.botao.style.top = Math.round(e.cy + e.R + 3) + 'px';
      });
      ordem.forEach(function (id) { esf[id].n.iniciar(); });
    }

    function quadro(dt) {
      tempo += dt;
      for (var i = fila.length - 1; i >= 0; i--) if (fila[i].t <= tempo) { var it = fila.splice(i, 1)[0]; it.fn(); }
      proximo -= dt;
      if (proximo <= 0) { if (automatico) sortear(); proximo = 1.0 + usa.base.acaso() * 1.6; }
      ordem.forEach(function (id) { esf[id].n.passo(dt); });
      if (foco) {
        var e = esf[foco]; e.n.desenhar();
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
        b.addEventListener('click', function () { if (foco === id) sair(); else focar(id); });
        raiz.appendChild(b); e.botao = b;
      });
    }
    nomes();

    return {
      ajustar: ajustar, quadro: quadro, focar: focar, sair: sair,
      foco: function () { return foco; },
      aoMudar: function (fn) { ouvinte = typeof fn === 'function' ? fn : null; },
      esferas: function () { return esf; },
      ligacoes: function () { return { lista: nLig.map(function (ax) { return { id: ax.id, caminho: ax.pts, larg: ax.larg, estado: ax.estado }; }), mapa: ligMapa }; },
      parede: function () { return { fixos: fixos, ramos: eixos.filter(function (ax) { return ax.estado !== 'repouso'; }), fixoAg: fixoAg, eixos: eixos }; },
      escala: function () { return s; },
      pedir: pedir, enviar: pedir, automatico: function (b) { automatico = !!b; },
      lupa: function () { return foco ? esf[foco].n.lupa : null; }
    };
  }

  return { criar: criar };
}

);
