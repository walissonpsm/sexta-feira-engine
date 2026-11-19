/* Sorteio com semente (o mesmo do neuronio.html do dono) e o hash de texto (FNV). Sem estado próprio; nada aqui lê o relógio nem Math.random. */
function (usa) {
  'use strict';
  function createSeededRandom(seed) {
    let s = seed >>> 0;
    return function () {
      s = (s * 1664525 + 1013904223) >>> 0;
      return s / 4294967296;
    };
  }
  function hash(s) { var h = 2166136261 >>> 0; for (var i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619) >>> 0; } return h; }
  return { criar: createSeededRandom, hash: hash };
}
