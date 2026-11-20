/* Sexta-Feira Engine v0.4.2: neuronio/pulso. o pulso redondo e suave (drawUnifiedSmoothPulse): o brilho de um sinal num ponto, com o tamanho corrigido pela lupa. Usado pelos pulsos dos dendritos, do axônio e dos terminais.
 * Código movido sem reescrever de neuronio/celula: o estado vem de Est (a tabela dos campos está no LEIA-ME.md da juntadora e deste) e as funções
 * das irmãs chegam em d, passadas pela juntadora. Só desenha/calcula o que está na lista da porta. */
function (usa) {
  'use strict';

  function criar(Est, d) {
    var ctx = Est.ctx;

// Renderizador unificado de pulso luminoso suave
        function drawUnifiedSmoothPulse(x, y, radius, lightR, lightG, lightB, r, g, b, glowFactor, alphaScale) {
          const a = alphaScale !== undefined ? alphaScale : 1;
          radius *= Est.pulsoZ;                                                   // de perto o brilho do pulso não cresce na mesma proporção
          const pGrad = ctx.createRadialGradient(x, y, 0.5, x, y, radius);
          pGrad.addColorStop(0, `rgba(255, 255, 255, ${0.92 * glowFactor * a})`);
          pGrad.addColorStop(0.45, `rgba(${lightR}, ${lightG}, ${lightB}, ${0.65 * glowFactor * a})`);
          pGrad.addColorStop(1, `rgba(${r}, ${g}, ${b}, 0)`);
          ctx.fillStyle = pGrad;
          ctx.beginPath();
          ctx.arc(x, y, radius, 0, Math.PI * 2);
          ctx.fill();
        }

    return { drawUnifiedSmoothPulse: drawUnifiedSmoothPulse };
  }

  return { criar: criar };
}
