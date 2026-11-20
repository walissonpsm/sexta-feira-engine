/* Sexta-Feira Engine v0.4.2: neuronio/tinta. as cores e os brilhos derivados de uma célula (o topo do desenho aprovado): cor clara, cor funda, transparências e brilhos, o degrau de detalhe e o contraste da lupa. Quem pinta recebe o objeto T e lê daqui.
 * Código movido sem reescrever de neuronio/celula: o estado vem de Est (a tabela dos campos está no LEIA-ME.md da juntadora e deste) e as funções
 * das irmãs chegam em d, passadas pela juntadora. Só desenha/calcula o que está na lista da porta. */
function (usa) {
  'use strict';

  function criar(Est, d) {
    var config = Est.config;
    var zcDe = d.zcDe, nivel = d.nivel, un = d.un;

// A tinta de uma célula: as cores e os brilhos derivados (o topo do desenho aprovado). Quem pinta recebe T e lê daqui.
        function tintaFixa(rgb) {
          let [r, g, b] = rgb || config.rgb;
          let lightR = Math.min(255, r + 90);
          let lightG = Math.min(255, g + 90);
          let lightB = Math.min(255, b + 90);
          let deepR = Math.round(r * 0.26);
          let deepG = Math.round(g * 0.26);
          let deepB = Math.round(b * 0.26);

          const bodyAlpha = Math.max(0.10, 1 - (config.transparenciaCorpo / 100) * 0.82);
          const dendriteAlpha = Math.max(0.08, config.opacidadeDendritos / 100);
          const glowFactor = config.brilhoGeral / 100;
          const nucFactor = config.brilhoNucleo / 100;
          const nv = nivel(), q = zcDe(Est.detZ), u = un();                     // com a lupa: degrau de detalhe, contraste e 1 px em unidades
          const corOrg = { dr: deepR, dg: deepG, db: deepB, lr: lightR, lg: lightG, lb: lightB };
          return { r: r, g: g, b: b, lightR: lightR, lightG: lightG, lightB: lightB, deepR: deepR, deepG: deepG, deepB: deepB, bodyAlpha: bodyAlpha, dendriteAlpha: dendriteAlpha, glowFactor: glowFactor, nucFactor: nucFactor, nv: nv, q: q, u: u, corOrg: corOrg };
        }

    return { tintaFixa: tintaFixa };
  }

  return { criar: criar };
}
