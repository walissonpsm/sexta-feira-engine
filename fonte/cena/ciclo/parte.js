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
      if (lid.charAt(0) === 'i') {            // o pulso chegou ao terminal no vidro do Núcleo: a parede transmite ao dendrito do módulo pedido
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
