/* Sexta-Feira Engine v0.4.2: cena/ciclo. o ciclo de um pedido: quem pede, o pulso que vai e volta, a fila de tarefas e o recomeço do ciclo quando a vista muda.
 * Código movido sem reescrever de neuronio/celula: o estado vem de Est (a tabela dos campos está no LEIA-ME.md da juntadora e deste) e as funções
 * das irmãs chegam em d, passadas pela juntadora. Só desenha/calcula o que está na lista da porta. */
function (usa) {
  'use strict';

  function criar(Est, d) {
    var esf = Est.esf, cfg = Est.cfg;
    var rgbDe = usa.cores.rgbDe;
    var irPara = d.irPara, modulosDe = d.modulosDe, alvoRel = d.alvoRel;

function agendar(seg, fn) { Est.fila.push({ t: Est.tempo + seg, fn: fn }); }

function disparar(lid, hex) { var ax = Est.eixoById[lid]; if (!ax) return; ax.pulso = { u: 0, k: 0 }; ax.pulsoCor = rgbDe(hex); }

function pedir(id, idxMod) {
      var a = esf[id], ax = Est.eixoById['i-' + id]; if (!a || !ax || !Est.ligMapa['i-' + id] || Est.ocupado[id]) return false;
      var lm = modulosDe(id); if (idxMod == null) idxMod = lm[Math.floor(usa.base.acaso() * lm.length)];
      if (!Est.fixoMod[idxMod]) return false;
      Est.ocupado[id] = true; Est.pedidoDe[id] = idxMod;
      a.n.excitar(a.cor);
      var dP = alvoRel(ax, idxMod);                    // o axônio inteiro se curva até o módulo pedido (depois corre o pulso)
      ax.estado = 'indo'; ax.pulso = null; ax.pAlvo = 0; irPara(ax, dP, 0.3 + 0.5 * Math.min(1, Math.abs(dP - ax.dC) / 1.0));     // a ventosa se solta e vira cone de crescimento, que vai até o módulo
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
      var livres = cfg.agentes.filter(function (a) { return !Est.ocupado[a.id] && Est.ligMapa['i-' + a.id]; }), em = Object.keys(Est.ocupado).filter(function (k) { return Est.ocupado[k]; }).length;
      if (!livres.length || em >= 3) return;
      pedir(livres[Math.floor(usa.base.acaso() * livres.length)].id);
    }

function reiniciaCiclo() {            // a troca de vista refaz as ligações: o que estava no ar recomeça do zero
      Est.ciclo++; Est.fila.length = 0; Est.ocupado = {}; Est.pedidoDe = {};
      Est.ventosas.forEach(function (v) { v.flash = 0; v.anel = 0; });
      Est.eixos.forEach(function (ax) { ax.pulso = null; ax.estado = 'repouso'; ax.mdur = 0; ax.nos.fill(0); if (ax.tipo === 'i') { ax.dC = ax.dPara = ax.dRep; ax.p = ax.pAlvo = 1; ax.sujoG = true; } });
      Est.sujo = true;
    }

    return { agendar: agendar, disparar: disparar, pedir: pedir, chegou: chegou, sortear: sortear, reiniciaCiclo: reiniciaCiclo };
  }

  return { criar: criar };
}
