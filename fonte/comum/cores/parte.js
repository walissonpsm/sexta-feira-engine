/* Conversões de cor (hexa e rgb) e os tons usados pelas ligações. Funções puras, chamadas muitas vezes por quadro: por isso esta parte não tem guarda. */
function (usa) {
  'use strict';
  function hexToRgb(hex) {
    const clean = hex.replace('#', '');
    const full = clean.length === 3 ? clean.split('').map(c => c + c).join('') : clean;
    const intVal = parseInt(full, 16);
    return [(intVal >> 16) & 255, (intVal >> 8) & 255, intVal & 255];
  }
  function ehCor(c) { return typeof c === 'string' && /^#[0-9a-fA-F]{6}$/.test(c); }
  function rgbDe(h) { return [parseInt(h.substr(1, 2), 16), parseInt(h.substr(3, 2), 16), parseInt(h.substr(5, 2), 16)]; }
  function clar(c) { return [Math.min(255, c[0] + 95), Math.min(255, c[1] + 95), Math.min(255, c[2] + 95)]; }
  function esc(c, k) { return [Math.round(c[0] * k), Math.round(c[1] * k), Math.round(c[2] * k)]; }
  function rgba(c, a) { return 'rgba(' + c[0] + ',' + c[1] + ',' + c[2] + ',' + Math.max(0, Math.min(1, a)).toFixed(3) + ')'; }
  return { hexParaRgb: hexToRgb, ehCor: ehCor, rgbDe: rgbDe, clar: clar, esc: esc, rgba: rgba };
}
