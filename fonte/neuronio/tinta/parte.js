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


// A tinta do desenho animado: as cores e os brilhos da célula (e o usaCor, que troca a cor para o axônio ou a esfera de quem vai desenhar).
        function tintaViva(zcL) {
          let [r, g, b] = config.rgb;
          let lightR = Math.min(255, r + 95);
          let lightG = Math.min(255, g + 95);
          let lightB = Math.min(255, b + 95);
          let deepR = Math.round(r * 0.28);
          let deepG = Math.round(g * 0.28);
          let deepB = Math.round(b * 0.28);
          const glowFactor = Math.max(0.15, config.brilhoGeral / 100);
          const dendriteAlpha = Math.max(0.08, config.opacidadeDendritos / 100);
          const T = { zcL: zcL, r: r, g: g, b: b, lightR: lightR, lightG: lightG, lightB: lightB, deepR: deepR, deepG: deepG, deepB: deepB, glowFactor: glowFactor, dendriteAlpha: dendriteAlpha };
          // cada axônio das ligações tem a sua cor: quem desenha o que é dele chama T.usaCor(cor); sem cor vale a da célula
          T.usaCor = function (c) {
            c = c || config.rgb; T.r = c[0]; T.g = c[1]; T.b = c[2];
            T.lightR = Math.min(255, T.r + 95); T.lightG = Math.min(255, T.g + 95); T.lightB = Math.min(255, T.b + 95);
            T.deepR = Math.round(T.r * 0.28); T.deepG = Math.round(T.g * 0.28); T.deepB = Math.round(T.b * 0.28);
          };
          return T;
        }

    return { tintaFixa: tintaFixa, tintaViva: tintaViva };
  }

  return { criar: criar };
}
