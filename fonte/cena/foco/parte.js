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
