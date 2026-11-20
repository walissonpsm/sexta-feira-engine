/* Sexta-Feira Engine v0.4.2: neuronio/lupa. a interação da lupa: zoom, arrasto, animação, prender nos limites, o refino da parte fixa em fatias e os ouvintes do ponteiro (roda, arrasto, pinça, duplo toque).
 * Código movido sem reescrever de neuronio/celula: o estado vem de Est (a tabela dos campos está no LEIA-ME.md da juntadora e deste) e as funções
 * das irmãs chegam em d, passadas pela juntadora. Só desenha/calcula o que está na lista da porta. */
function (usa) {
  'use strict';

  function criar(Est, d) {
    var canvas = Est.canvas, lupa = Est.lupa, opc = Est.opc, runtime = Est.runtime;
    var agora = d.agora, zMax = d.zMax, iniciarAssado = d.iniciarAssado, avancarAssado = d.avancarAssado, vidroDaVista = d.vidroDaVista;

// ---------------------------------------------------------------------------------- a lupa: ampliar, mover, animar e refinar
        function prenderLupa() {
          const z = lupa.z, W = runtime.width, H = runtime.height;
          lupa.ox = Math.min(0, Math.max(W - W * z, lupa.ox));
          lupa.oy = Math.min(0, Math.max(H - H * z, lupa.oy));
        }

function marcarLupa() {
          lupa.mudou = true; lupa.ultimo = agora(); Est.refino = null;
          if (lupa.ouvinte) lupa.ouvinte(lupa.z);
        }

function ampliarEm(f, fx, fy) {             // amplia por f mantendo parado o ponto (fx, fy) do canvas
          const z0 = lupa.z, z1 = Math.max(1, Math.min(zMax(), z0 * f));
          if (z1 === z0) return;
          lupa.ox = fx - z1 * (fx - lupa.ox) / z0;
          lupa.oy = fy - z1 * (fy - lupa.oy) / z0;
          lupa.z = z1;
          prenderLupa(); marcarLupa();
        }

function moverLupa(dx, dy) {
          if (lupa.z <= 1) return;
          const ox = lupa.ox, oy = lupa.oy;
          lupa.ox += dx; lupa.oy += dy; prenderLupa();
          if (lupa.ox !== ox || lupa.oy !== oy) marcarLupa();
        }

function animarLupa(zAlvo, fx, fy) {
          lupa.anim = { z0: lupa.z, z1: Math.max(1, Math.min(zMax(), zAlvo)), fx: fx, fy: fy, t0: agora(), dur: 280 };
        }

function passoAnimLupa() {
          const a = lupa.anim;
          if (!a) return;
          const u = Math.min(1, (agora() - a.t0) / a.dur), e = u < 0.5 ? 2 * u * u : 1 - Math.pow(-2 * u + 2, 2) / 2;
          ampliarEm(a.z0 * Math.pow(a.z1 / a.z0, e) / lupa.z, a.fx, a.fy);
          if (u >= 1) lupa.anim = null;
        }

function alternarLupa(x, y) { if (lupa.z < 2.2) animarLupa(Math.min(zMax(), 3.2), x, y); else animarLupa(1, x, y); }

// Quando a lupa para (170 ms sem mexer), a parte fixa é refeita para ela, uma fatia de ~10 ms por quadro
        function cuidarRefino() {
          if (lupa.mudou && !lupa.anim && agora() - lupa.ultimo > 170) {
            lupa.mudou = false;
            if (lupa.z > 1.001) Est.refino = iniciarAssado(lupa); else { Est.refino = null; Est.detalhe = null; }
          }
          if (Est.refino && avancarAssado(Est.refino, 10)) {
            Est.detalhe = { cv: Est.refino.off, v: Est.refino.v, vidro: vidroDaVista(Est.refino.v) };
            Est.refino = null;
          }
        }

// Os gestos: pinça (dois dedos), roda do mouse, arrastar quando ampliado e dois toques (ou clique duplo) para ir e voltar
        function ligarLupa() {
          if (typeof window === 'undefined') return;
          if (opc.lupa) { canvas.style.pointerEvents = 'auto'; canvas.style.touchAction = 'none'; canvas.style.cursor = 'zoom-in'; }
          const toques = new Map();
          let tapT = 0, tapX = 0, tapY = 0, andou = 0, semDuplo = 0;
          const local = function (e) {
            const r = canvas.getBoundingClientRect();
            return { x: (e.clientX - r.left) * runtime.width / Math.max(1, r.width), y: (e.clientY - r.top) * runtime.height / Math.max(1, r.height) };
          };
          canvas.addEventListener('wheel', function (e) {
            if (!opc.lupa) return;
            e.preventDefault();
            const p = local(e), dy = e.deltaMode === 1 ? e.deltaY * 16 : e.deltaMode === 2 ? e.deltaY * 400 : e.deltaY;
            lupa.anim = null;
            ampliarEm(Math.exp(-Math.max(-120, Math.min(120, dy)) * 0.0022), p.x, p.y);
          }, { passive: false });
          canvas.addEventListener('pointerdown', function (e) {
            if (!opc.lupa || e.button > 0) return;
            try { canvas.setPointerCapture(e.pointerId); } catch (x) { /* sem captura: segue sem ela */ }
            toques.set(e.pointerId, local(e));
            if (toques.size === 1) andou = 0;
            lupa.anim = null;
            canvas.style.cursor = lupa.z > 1 ? 'grabbing' : 'zoom-in';
          });
          canvas.addEventListener('pointermove', function (e) {
            if (!opc.lupa || !toques.has(e.pointerId)) return;
            const ids = Array.from(toques.keys()), antes = ids.map(function (k) { return toques.get(k); });
            const p = local(e), a = toques.get(e.pointerId);
            andou += Math.hypot(p.x - a.x, p.y - a.y);
            toques.set(e.pointerId, p);
            if (ids.length >= 2) {
              const P0 = antes[0], Q0 = antes[1], P1 = toques.get(ids[0]), Q1 = toques.get(ids[1]);
              const d0 = Math.hypot(P0.x - Q0.x, P0.y - Q0.y), d1 = Math.hypot(P1.x - Q1.x, P1.y - Q1.y);
              const m0x = (P0.x + Q0.x) / 2, m0y = (P0.y + Q0.y) / 2;
              if (d0 > 4) ampliarEm(d1 / d0, m0x, m0y);
              moverLupa((P1.x + Q1.x) / 2 - m0x, (P1.y + Q1.y) / 2 - m0y);
            } else {
              moverLupa(p.x - a.x, p.y - a.y);
            }
          });
          const soltar = function (e) {
            if (!opc.lupa || !toques.has(e.pointerId)) return;
            const p = local(e);
            toques.delete(e.pointerId);
            canvas.style.cursor = lupa.z > 1 ? 'grab' : 'zoom-in';
            if (e.type !== 'pointerup' || toques.size || andou > 10 || e.pointerType === 'mouse') return;
            const t = agora();
            if (t - tapT < 320 && Math.hypot(p.x - tapX, p.y - tapY) < 40) { tapT = 0; semDuplo = t; alternarLupa(p.x, p.y); }
            else { tapT = t; tapX = p.x; tapY = p.y; }
          };
          canvas.addEventListener('pointerup', soltar);
          canvas.addEventListener('pointercancel', soltar);
          canvas.addEventListener('dblclick', function (e) {
            if (!opc.lupa || agora() - semDuplo < 600) return;
            const p = local(e);
            alternarLupa(p.x, p.y);
          });
        }

    return { prenderLupa: prenderLupa, marcarLupa: marcarLupa, ampliarEm: ampliarEm, moverLupa: moverLupa, animarLupa: animarLupa, passoAnimLupa: passoAnimLupa, alternarLupa: alternarLupa, cuidarRefino: cuidarRefino, ligarLupa: ligarLupa };
  }

  return { criar: criar };
}
