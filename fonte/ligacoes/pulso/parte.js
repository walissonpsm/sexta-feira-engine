/* O pulso que corre pelo tronco (o desenho da v09): centro branco, cor clara e a cor sumindo nas bordas. Só desenha. */
function (usa) {
  'use strict';
  var rgba = usa.cores.rgba, clar = usa.cores.clar;
    function pulsoV09(ctxP, x, y, rad, c, a) {          // o desenho do pulso da v09 (drawUnifiedSmoothPulse): centro branco, cor clara e a cor sumindo
      var l = clar(c), g = ctxP.createRadialGradient(x, y, 0.5, x, y, rad);
      g.addColorStop(0, 'rgba(255,255,255,' + (0.92 * a).toFixed(3) + ')'); g.addColorStop(0.45, rgba(l, 0.65 * a)); g.addColorStop(1, rgba(c, 0));
      ctxP.fillStyle = g; ctxP.beginPath(); ctxP.arc(x, y, rad, 0, 6.2832); ctxP.fill();
    }

  return { pulso: pulsoV09 };
}
