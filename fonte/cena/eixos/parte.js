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
