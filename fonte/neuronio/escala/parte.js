/* Sexta-Feira Engine v0.4.2: neuronio/escala. o tamanho e o detalhe: o degrau de detalhe da lupa (nivel), 1 px em unidades do desenho (un), o zoom máximo, o contraste da lupa (zcDe), o giro da célula, o bitmap novo e os dois ramos que dependem do degrau (polígono afilado e ramo encorpado).
 * Código movido sem reescrever de neuronio/celula: o estado vem de Est (a tabela dos campos está no LEIA-ME.md da juntadora e deste) e as funções
 * das irmãs chegam em d, passadas pela juntadora. Só desenha/calcula o que está na lista da porta. */
function (usa) {
  'use strict';

  function criar(Est, d) {
    var dendritos = usa.ramos;
    var opc = Est.opc, runtime = Est.runtime, vista = Est.vista;

function agora() { return usa.base.agora(); }

function zcDe(z) { return Math.max(0, Math.min(1, (z - 1) / 3)); }

// o quanto a lupa já puxou o contraste (0 sem lupa, 1 a partir de 4x)
        // Degraus de detalhe, pelos pixels de tela por unidade do desenho da célula que está sendo pintada (0 = o desenho aprovado)
        function nivel() {
          if (Est.detZ <= 1.05) return 0;
          const p = vista.k * Est.detZ * runtime.dpr * Est.detLocal;
          return p >= 3.6 ? 3 : p >= 2.1 ? 2 : p >= 1.25 ? 1 : 0;
        }

function un() { return 1 / Math.max(1e-6, vista.k * Est.detZ * Est.detLocal); }

// 1 px do canvas, em unidades do desenho da célula
        function zMax() { return Math.max(4, Math.min(48, 16 / Math.max(0.05, vista.k))); }

function giroCelula(c, A) {
          if (!opc.giro0) return;
          c.translate(A.somaX, A.somaY); c.rotate(opc.giro0); c.translate(-A.somaX, -A.somaY);
        }

function novoBitmap() {
          const c = document.createElement('canvas');
          c.width = Math.max(1, Math.round(runtime.width * runtime.dpr));
          c.height = Math.max(1, Math.round(runtime.height * runtime.dpr));
          return c;
        }

function drawSharpDendritePolygon(targetCtx, points) { dendritos.poligonoAfilado(targetCtx, points, nivel()); }

function drawTaperedBranch(targetCtx, points) { dendritos.ramoEncorpado(targetCtx, points, nivel()); }

    return { agora: agora, zcDe: zcDe, nivel: nivel, un: un, zMax: zMax, giroCelula: giroCelula, novoBitmap: novoBitmap, drawSharpDendritePolygon: drawSharpDendritePolygon, drawTaperedBranch: drawTaperedBranch };
  }

  return { criar: criar };
}
