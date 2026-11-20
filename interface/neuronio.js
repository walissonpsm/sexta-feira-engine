/* GERADO por ferramentas/montar-interface.sh a partir de fonte/ (versão 0.4.2). NÃO edite aqui: edite a parte em fonte/ e rode o montador. */
// ---- fonte/neuronio/camada/parte.js
SF.parte({nome:'neuronio/camada',porta:1,compativelDesde:1,requer:[],guarda:false,dom:true},
/* Sexta-Feira Engine v0.4.2: neuronio/camada. a camada fixa (pré-desenhada): a ordem das camadas (principal e menores), pintar uma camada com luz, névoa e sombra, o assado em fatias com orçamento de tempo, o lustre do soma, iluminar, reduzir e compor.
 * Código movido sem reescrever de neuronio/celula: o estado vem de Est (a tabela dos campos está no LEIA-ME.md da juntadora e deste) e as funções
 * das irmãs chegam em d, passadas pela juntadora. Só desenha/calcula o que está na lista da porta. */
function (usa) {
  'use strict';

  function criar(Est, d) {
    var VISTA_1 = Est.VISTA_1, lupa = Est.lupa, opc = Est.opc, runtime = Est.runtime, vista = Est.vista;
    var recortaNaEsfera = d.recortaNaEsfera, montarMascara = d.montarMascara, agora = d.agora, zcDe = d.zcDe, giroCelula = d.giroCelula, novoBitmap = d.novoBitmap, pintarBotoesFixos = d.pintarBotoesFixos, pintarCelula = d.pintarCelula;

// As camadas, do fundo para a frente (o principal fica no meio)
        function camadasOrdenadas() {
          const camadas = Est.minis.map(function (m) { return { z: m.z, m: m }; });
          camadas.push({ z: 0, m: null });
          camadas.sort(function (p, q) { return p.z - q.z; });
          return camadas;
        }

// O retângulo (px do bitmap) que a camada ocupa nesta vista; null se ela está toda fora (não é pintada)
        function retCamada(c, v, W, H) {
          if (!c.m) return { x: 0, y: 0, w: W, h: H };
          const cx = c.m.caixa, pad = 16, d = runtime.dpr, a = d * v.z * vista.k, bx = d * (v.z * vista.tx + v.ox), by = d * (v.z * vista.ty + v.oy);
          const X0 = Math.max(0, Math.floor(bx + a * (cx.x0 - pad))), Y0 = Math.max(0, Math.floor(by + a * (cx.y0 - pad)));
          const X1 = Math.min(W, Math.ceil(bx + a * (cx.x1 + pad))), Y1 = Math.min(H, Math.ceil(by + a * (cx.y1 + pad)));
          return X1 > X0 && Y1 > Y0 ? { x: X0, y: Y0, w: X1 - X0, h: Y1 - Y0 } : null;
        }

// Pinta uma camada (um neurônio) na vista v: só no retângulo dela, com a luz, a névoa, a sombra e o brilho da profundidade
        function pintarCamada(c, v, octx, tmp, tctx) {
          const R = retCamada(c, v, tmp.width, tmp.height);
          if (!R) return;
          const d = runtime.dpr;
          tctx.setTransform(1, 0, 0, 1, 0, 0);
          tctx.globalCompositeOperation = 'source-over';
          tctx.clearRect(R.x, R.y, R.w, R.h);
          tctx.save();
          tctx.beginPath(); tctx.rect(R.x, R.y, R.w, R.h); tctx.clip();
          tctx.setTransform(d * v.z, 0, 0, d * v.z, d * v.ox, d * v.oy);
          tctx.translate(vista.tx, vista.ty);
          tctx.scale(vista.k, vista.k);
          Est.detZ = v.z;
          if (c.m) {
            Est.detLocal = c.m.s;
            tctx.transform(c.m.M[0], c.m.M[1], c.m.M[2], c.m.M[3], c.m.M[4], c.m.M[5]);
            pintarCelula(tctx, c.m.A, c.m.rgb);
            pintarBotoesFixos(tctx, c.m.A, c.m.rgb);
            lustreSoma(tctx, c.m.A);
          } else {
            Est.detLocal = 1;
            tctx.save(); giroCelula(tctx, Est.anatomy);
            pintarCelula(tctx, Est.anatomy);
            tctx.restore();
            lustreSoma(tctx, Est.anatomy);
          }
          tctx.restore();
          iluminarCamada(tctx, R, c.z, v);
          comporCamada(octx, tmp, c.z, c.m ? c.m.dA : 1, R, v);
          Est.detZ = 1; Est.detLocal = 1;
        }

function iniciarAssado(v) {
          const off = novoBitmap();
          if (!Est.tmpCamada || Est.tmpCamada.width !== off.width || Est.tmpCamada.height !== off.height) Est.tmpCamada = novoBitmap();
          return { v: { z: v.z, ox: v.ox, oy: v.oy }, off: off, octx: off.getContext('2d'), tmp: Est.tmpCamada, tctx: Est.tmpCamada.getContext('2d'),
            camadas: camadasOrdenadas(), i: 0, feito: false };
        }

// Pinta camadas até gastar 'ms' milissegundos (ao menos uma); devolve true quando o bitmap ficou pronto
        function avancarAssado(job, ms) {
          const t0 = agora();
          while (job.i < job.camadas.length) {
            pintarCamada(job.camadas[job.i], job.v, job.octx, job.tmp, job.tctx);
            job.i++;
            if (agora() - t0 > ms) return false;
          }
          if (!job.feito) {
            if (recortaNaEsfera()) {
              job.octx.setTransform(1, 0, 0, 1, 0, 0);
              job.octx.globalCompositeOperation = 'destination-in';
              job.octx.drawImage(montarMascara(job.off.width, job.off.height, job.v), 0, 0);
              job.octx.globalCompositeOperation = 'source-over';
            }
            job.feito = true;
          }
          return true;
        }

// Pré-renderiza a estrutura celular estática (a vista normal, sem lupa) de uma vez
        function bakeStaticLayer() {
          const job = iniciarAssado(VISTA_1);
          avancarAssado(job, Infinity);
          Est.anatomy.offscreenCanvas = job.off;
          Est.detalhe = null; Est.refino = null;
          lupa.z = 1; lupa.ox = 0; lupa.oy = 0; lupa.mudou = false; lupa.anim = null;
          if (lupa.ouvinte) lupa.ouvinte(1);
        }

// Volume do corpo celular: sombra na borda, brilho especular (a mesma luz do vidro) e luz refletida embaixo
        function lustreSoma(octx, A) {
          const r0 = A.somaRadius, x = A.somaX, y = A.somaY, lado = r0 * 2.7, q = zcDe(Est.detZ);   // de perto, o brilho não lava o contraste
          octx.save();
          const gi = A === Est.anatomy ? opc.giro0 : 0;           // o contorno do corpo gira com a célula; a luz não
          if (gi) { octx.translate(x, y); octx.rotate(gi); octx.translate(-x, -y); }
          octx.beginPath();
          A.somaOutline.forEach(function (pt, i) { if (i === 0) octx.moveTo(pt.x, pt.y); else octx.lineTo(pt.x, pt.y); });
          octx.closePath();
          octx.clip();
          if (gi) { octx.translate(x, y); octx.rotate(-gi); octx.translate(-x, -y); }
          let g = octx.createRadialGradient(x, y, r0 * 0.40, x, y, r0 * 1.10);
          g.addColorStop(0, 'rgba(8, 0, 26, 0)');
          g.addColorStop(0.68, 'rgba(8, 0, 26, 0.12)');
          g.addColorStop(1, 'rgba(8, 0, 26, 0.55)');
          octx.fillStyle = g; octx.fillRect(x - lado / 2, y - lado / 2, lado, lado);
          g = octx.createRadialGradient(x + r0 * 0.46, y + r0 * 0.52, 0, x + r0 * 0.46, y + r0 * 0.52, r0 * 0.6);
          g.addColorStop(0, 'rgba(190, 150, 255, ' + (0.26 * (1 - 0.4 * q)).toFixed(3) + ')');
          g.addColorStop(1, 'rgba(190, 150, 255, 0)');
          octx.fillStyle = g; octx.fillRect(x - lado / 2, y - lado / 2, lado, lado);
          g = octx.createRadialGradient(x - r0 * 0.34, y - r0 * 0.38, 0, x - r0 * 0.34, y - r0 * 0.38, r0 * 0.62);
          g.addColorStop(0, 'rgba(255, 255, 255, ' + (0.66 * (1 - 0.55 * q)).toFixed(3) + ')');
          g.addColorStop(0.35, 'rgba(236, 226, 255, ' + (0.22 * (1 - 0.55 * q)).toFixed(3) + ')');
          g.addColorStop(1, 'rgba(255, 255, 255, 0)');
          octx.fillStyle = g; octx.fillRect(x - lado / 2, y - lado / 2, lado, lado);
          octx.restore();
        }

// Luz única vinda do canto superior esquerdo sobre tudo o que a camada pintou, e névoa para o que está ao fundo (de perto, menos)
        function iluminarCamada(tctx, R, z, v) {
          const d = runtime.dpr, q = zcDe(v.z);
          const Rr = vista.Rpx * d * v.z, cx = d * (v.z * vista.cx + v.ox), cy = d * (v.z * vista.cy + v.oy);
          tctx.setTransform(1, 0, 0, 1, 0, 0);
          tctx.globalCompositeOperation = 'source-atop';
          const lg = tctx.createLinearGradient(cx - Rr * 0.75, cy - Rr * 0.85, cx + Rr * 0.75, cy + Rr * 0.85);
          lg.addColorStop(0, 'rgba(255, 255, 255, ' + (0.22 * (1 - 0.6 * q)).toFixed(3) + ')');
          lg.addColorStop(0.45, 'rgba(255, 255, 255, 0)');
          lg.addColorStop(1, 'rgba(0, 0, 16, ' + (0.08 * (1 - q)).toFixed(3) + ')');
          tctx.fillStyle = lg;
          tctx.fillRect(R.x, R.y, R.w, R.h);
          if (z < 0 && q < 1) {
            tctx.fillStyle = 'rgba(26, 22, 78, ' + (0.14 * -z * (1 - q)).toFixed(3) + ')';
            tctx.fillRect(R.x, R.y, R.w, R.h);
          }
          tctx.globalCompositeOperation = 'source-over';
        }

// A camada (só o retângulo R) reduzida f vezes num canvas auxiliar: ampliada de volta, vira um desfoque barato
        // (o filtro blur() do canvas custa 70 a 100 ms por camada em alguns navegadores; este caminho custa poucos ms)
        function reduzido(tmp, R, f) {
          const w = Math.max(1, Math.round(R.w / f)), h = Math.max(1, Math.round(R.h / f));
          if (!Est.auxCv) Est.auxCv = document.createElement('canvas');
          if (Est.auxCv.width < w || Est.auxCv.height < h) { Est.auxCv.width = Math.max(Est.auxCv.width, w); Est.auxCv.height = Math.max(Est.auxCv.height, h); }
          const a = Est.auxCv.getContext('2d');
          a.setTransform(1, 0, 0, 1, 0, 0);
          a.globalCompositeOperation = 'source-over';
          a.clearRect(0, 0, w, h);
          a.imageSmoothingEnabled = true; a.imageSmoothingQuality = 'high';
          a.drawImage(tmp, R.x, R.y, R.w, R.h, 0, 0, w, h);
          return { cv: Est.auxCv, w: w, h: h };
        }

function comporCamada(octx, tmp, z, dA, R, v) {
          const dpr = runtime.dpr, zn = (z + 1) / 2, q = zcDe(v.z), sz = Math.sqrt(v.z);
          const desfoque = Math.max(0, -z - 0.3) * 0.8 * (1 - q);   // só o que está bem ao fundo perde foco (de perto, nada perde)
          const pinta = function (src) {
            octx.imageSmoothingEnabled = true; octx.imageSmoothingQuality = 'high';
            if (src) octx.drawImage(src.cv, 0, 0, src.w, src.h, R.x, R.y, R.w, R.h);
            else octx.drawImage(tmp, R.x, R.y, R.w, R.h, R.x, R.y, R.w, R.h);
          };
          octx.save();
          octx.setTransform(1, 0, 0, 1, 0, 0);
          // sombra no fundo do vidro: quem está perto do fundo projeta curta e escura, quem está na frente projeta longa e difusa;
          // de perto a sombra some aos poucos (ela custa caro e tira contraste; a profundidade já vem do tamanho)
          if (q < 0.5) {
            const sb = Math.pow(v.z, 0.25);
            octx.shadowColor = 'rgba(6, 3, 22, ' + ((0.62 - 0.30 * zn) * (1 - 2 * q)).toFixed(3) + ')';
            octx.shadowBlur = (8 + 16 * zn) * dpr * sb;
            octx.shadowOffsetX = (5 + 14 * zn) * dpr * sb;
            octx.shadowOffsetY = (7 + 18 * zn) * dpr * sb;
          }
          octx.globalAlpha = Math.min(1, dA + (1 - dA) * q);          // de perto, quem está ao fundo também fica opaco
          pinta(desfoque * dpr > 0.5 ? reduzido(tmp, R, 2) : null);
          octx.restore();
          const brilho = function (alfa, f) {
            octx.save();
            octx.setTransform(1, 0, 0, 1, 0, 0);
            octx.globalCompositeOperation = 'lighter';
            octx.globalAlpha = alfa;
            pinta(f ? reduzido(tmp, R, f) : null);
            octx.restore();
          };
          if (z >= 0) brilho((z === 0 ? 0.22 : 0.10) * (1 - 0.4 * q));   // o Núcleo e quem está na frente ganham um halo leve de luz
          if (z < 0) brilho(0.30 * -z * (1 - 0.5 * q));                  // quem está ao fundo não pode sumir: um brilho próprio o realça
          if (z > 0.3) brilho(0.34 * z * (1 - 0.5 * q), Math.max(2, Math.min(16, Math.round(5 * dpr * sz / 1.6))));   // perto de quem olha: brilho suave
        }

    return { camadasOrdenadas: camadasOrdenadas, retCamada: retCamada, pintarCamada: pintarCamada, iniciarAssado: iniciarAssado, avancarAssado: avancarAssado, bakeStaticLayer: bakeStaticLayer, lustreSoma: lustreSoma, iluminarCamada: iluminarCamada, reduzido: reduzido, comporCamada: comporCamada };
  }

  return { criar: criar };
}

);
// ---- fonte/neuronio/lupa/parte.js
SF.parte({nome:'neuronio/lupa',porta:1,compativelDesde:1,requer:[],guarda:false,dom:true},
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

);
// ---- fonte/neuronio/pulso/parte.js
SF.parte({nome:'neuronio/pulso',porta:1,compativelDesde:1,requer:[],guarda:false,dom:false},
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

);
// ---- fonte/neuronio/recorte/parte.js
SF.parte({nome:'neuronio/recorte',porta:1,compativelDesde:1,requer:[],guarda:false,dom:true},
/* Sexta-Feira Engine v0.4.2: neuronio/recorte. a máscara da esfera e o corredor por onde o tronco do axônio sai dela (só geometria de recorte, sem desenho próprio).
 * Código movido sem reescrever de neuronio/celula: o estado vem de Est (a tabela dos campos está no LEIA-ME.md da juntadora e deste) e as funções
 * das irmãs chegam em d, passadas pela juntadora. Só desenha/calcula o que está na lista da porta. */
function (usa) {
  'use strict';

  function criar(Est, d) {
    var PAREDE = Est.PAREDE, VISTA_1 = Est.VISTA_1, opc = Est.opc, runtime = Est.runtime, vista = Est.vista;

// Fora da esfera: a passagem do tronco vai da parede até a borda do canvas e some aos poucos
        function alcanceFora() { return Math.max(24, runtime.width - (vista.cx + vista.Rpx) - 6); }

function recortaNaEsfera() { return opc.modo !== 'ligacoes' && (opc.saida || opc.raioMax !== Infinity); }

// O corredor por onde o tronco do axônio sai da esfera: a faixa onde o tronco passa (com folga) até a borda do canvas
        function corredorTronco() {
          if (!opc.saida) return null;
          const xi = vista.cx + vista.Rpx * 0.8;
          let y0 = Infinity, y1 = -Infinity;
          Est.anatomy.axonPath.forEach(function (p) {
            const X = vista.tx + p.x * vista.k, Y = vista.ty + p.y * vista.k;
            if (X >= xi) { y0 = Math.min(y0, Y); y1 = Math.max(y1, Y); }
          });
          Est.anatomy.terminalBranches.forEach(function (br) {
            br.pts.forEach(function (q) {
              const X = vista.tx + q.x * vista.k, Y = vista.ty + q.y * vista.k;
              if (X >= xi) { y0 = Math.min(y0, Y - 8 * vista.k * Est.anatomy.scale); y1 = Math.max(y1, Y + 8 * vista.k * Est.anatomy.scale); }
            });
          });
          if (!isFinite(y0)) return null;
          const pad = 14 * Est.anatomy.scale * vista.k + 6;
          return { x: xi, y: y0 - pad, w: Math.max(1, runtime.width - xi), h: (y1 - y0) + 2 * pad };
        }

// Com vários axônios o corredor segue cada um (uma faixa em volta do traço, mais a caixa dos terminais), em vez de um retângulo
        // alto: o resto de fora da parede continua cortado
        function corredorPolis() {
          const xi = vista.cx + vista.Rpx * 0.8, k = vista.k, pad = 14 * Est.anatomy.scale * k + 6, polis = [];
          [Est.anatomy].concat(Est.anatomy.extras || []).forEach(function (E) {
            const P = [];
            E.axonPath.forEach(function (p, j) { const X = vista.tx + p.x * k, Y = vista.ty + p.y * k; if (X >= xi && (j % 3 === 0 || j === E.axonPath.length - 1)) P.push({ x: X, y: Y }); });
            if (P.length < 2) return;
            const L = [], R = [];
            P.forEach(function (p, j) {
              const a = P[Math.max(0, j - 1)], b = P[Math.min(P.length - 1, j + 1)];
              let tx = b.x - a.x, ty = b.y - a.y; const m = Math.hypot(tx, ty) || 1; tx /= m; ty /= m;
              L.push({ x: p.x - ty * pad, y: p.y + tx * pad }); R.push({ x: p.x + ty * pad, y: p.y - tx * pad });
            });
            let poly = L.concat(R.reverse()), area = 0;
            for (let j = 0; j < poly.length; j++) { const u = poly[j], v = poly[(j + 1) % poly.length]; area += u.x * v.y - v.x * u.y; }
            if (area < 0) poly = poly.reverse();
            polis.push(poly);
            let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
            const poe = function (p) { const X = vista.tx + p.x * k, Y = vista.ty + p.y * k; if (X < x0) x0 = X; if (X > x1) x1 = X; if (Y < y0) y0 = Y; if (Y > y1) y1 = Y; };
            E.terminalBranches.forEach(function (br) { br.pts.forEach(poe); });
            E.terminalBoutons.forEach(function (bt) { poe({ x: bt.x - (bt.bThick || 0), y: bt.y - (bt.bWidth || 0) }); poe({ x: bt.x + (bt.bThick || 0), y: bt.y + (bt.bWidth || 0) }); });
            if (isFinite(x0)) { const m2 = pad * 0.8; polis.push([{ x: x0 - m2, y: y0 - m2 }, { x: x1 + m2, y: y0 - m2 }, { x: x1 + m2, y: y1 + m2 }, { x: x0 - m2, y: y1 + m2 }]); }
          });
          return polis;
        }

function caminhoCorredor(c) {
          if (opc.axonios > 1) {
            const polis = corredorPolis();
            polis.forEach(function (poly) { poly.forEach(function (p, j) { if (j) c.lineTo(p.x, p.y); else c.moveTo(p.x, p.y); }); c.closePath(); });
            return polis.length > 0;
          }
          const cor = corredorTronco();
          if (!cor) return false;
          c.moveTo(cor.x, cor.y); c.rect(cor.x, cor.y, cor.w, cor.h);
          return true;
        }

// o recorte da esfera + corredores não muda entre os quadros: monta uma vez (Path2D) e reaproveita
        function recorte2D() {
          if (!vista.recorte2D) { const p = new Path2D(); caminhoRecorte(p); vista.recorte2D = p; }
          return vista.recorte2D;
        }

function caminhoRecorte(c) {
          c.arc(vista.cx, vista.cy, vista.Rpx * PAREDE, 0, Math.PI * 2);   // os dendritos terminam na parede interna do vidro
          caminhoCorredor(c);
        }

function montarMascara(W, H, v) {
          v = v || VISTA_1;
          const m = document.createElement('canvas');
          m.width = W; m.height = H;
          const c = m.getContext('2d');
          c.setTransform(runtime.dpr * v.z, 0, 0, runtime.dpr * v.z, runtime.dpr * v.ox, runtime.dpr * v.oy);
          c.fillStyle = '#fff';
          c.beginPath(); c.arc(vista.cx, vista.cy, vista.Rpx * PAREDE, 0, Math.PI * 2); c.fill();
          const gm = c.createLinearGradient(vista.cx + vista.Rpx, 0, runtime.width, 0);
          gm.addColorStop(0, 'rgba(255, 255, 255, 1)');
          gm.addColorStop(0.5, 'rgba(255, 255, 255, 0.97)');
          gm.addColorStop(1, 'rgba(255, 255, 255, 0.92)');
          c.beginPath();
          if (caminhoCorredor(c)) { c.fillStyle = gm; c.fill(); }
          return m;
        }

function fadeFora(x, y) {
          if (!opc.saida) return 1;
          const X = vista.tx + x * vista.k, Y = vista.ty + y * vista.k;
          const dd = Math.hypot(X - vista.cx, Y - vista.cy) - vista.Rpx;
          if (dd <= 0) return 1;
          const u = Math.min(1, dd / alcanceFora());
          return 1 - 0.1 * u;
        }

    return { alcanceFora: alcanceFora, recortaNaEsfera: recortaNaEsfera, corredorTronco: corredorTronco, corredorPolis: corredorPolis, caminhoCorredor: caminhoCorredor, recorte2D: recorte2D, caminhoRecorte: caminhoRecorte, montarMascara: montarMascara, fadeFora: fadeFora };
  }

  return { criar: criar };
}

);
// ---- fonte/neuronio/sinais/parte.js
SF.parte({nome:'neuronio/sinais',porta:1,compativelDesde:1,requer:[],guarda:false,dom:false},
/* Sexta-Feira Engine v0.4.2: neuronio/sinais. o comportamento dos sinais: quando nasce cada pulso de dendrito e potencial de ação, como a liberação de neurotransmissores e o disparo dos menores andam a cada passo. Só calcula, não desenha.
 * Código movido sem reescrever de neuronio/celula: o estado vem de Est (a tabela dos campos está no LEIA-ME.md da juntadora e deste) e as funções
 * das irmãs chegam em d, passadas pela juntadora. Só desenha/calcula o que está na lista da porta. */
function (usa) {
  'use strict';

  function criar(Est, d) {
    var actionPotentials = Est.actionPotentials, config = Est.config, incomingSignals = Est.incomingSignals, miniAPs = Est.miniAPs, mistClouds = Est.mistClouds, opc = Est.opc, releasedNeurotransmitters = Est.releasedNeurotransmitters, runtime = Est.runtime;

// Dispara sinal receptivo ao longo de um dendrito até o soma
        function spawnDendriteSignal() {
          if (!Est.anatomy.dendriteTips.length) return;
          const idx = Math.floor(usa.base.acaso() * Est.anatomy.dendriteTips.length);
          const branch = Est.anatomy.dendriteTips[idx];
          incomingSignals.push({
            pts: branch.pts,
            progress: 1.0,
            speed: 0.56 + usa.base.acaso() * 0.34,
            entrada: branch
          });
        }

// Dispara potencial de ação pelo axônio saltatório até os bulbos sinápticos
        function triggerActionPotential() {
          if (opc.semEixo || opc.modo === 'ligacoes') return;    // sem axônio próprio: quem manda sinal é a cena (dispararEixo)
          runtime.somaExcitation = 1.0;
          const eixos = [Est.anatomy].concat(Est.anatomy.extras || []);
          const E = eixos[Math.floor(usa.base.acaso() * eixos.length)];       // cada pulso sai por um dos axônios
          const chosenBoutons = E.terminalBoutons.filter((_, idx) => usa.base.acaso() < 0.65 || idx % 2 === 0);
          actionPotentials.push({
            t: 0,
            visitedNodes: new Set(),
            eixo: E,
            boutons: chosenBoutons.length ? chosenBoutons : E.terminalBoutons,
            released: false
          });
        }

function dispararMini(m, rgb, cb) {
          if (!m) return;
          m.excita = 1;
          if (rgb) { m.ativo = rgb; m.ativoT = 2.4; }
          miniAPs.push({ m: m, t: 0, rgb: rgb || null, cb: cb || null });
        }

// Exocitose biológica nos bulbos terminais unificados
        function emitSynapticRelease(bouton) {
          bouton.flash = 1.0;

          let fusedCount = 0;
          bouton.vesicles.forEach((v) => {
            if (v.docked && v.fusionProgress <= 0 && fusedCount < 2) {
              v.fusionProgress = 0.01;
              bouton.pocketExcite[v.pocketIndex] = 1.0;
              fusedCount++;
            }
          });

          if (config.enableMist) {
            const dist = (8 + usa.base.acaso() * 5) * Est.anatomy.scale;
            mistClouds.push({
              x: bouton.x + Math.cos(bouton.tipAngle) * dist,
              y: bouton.y + Math.sin(bouton.tipAngle) * dist,
              vx: Math.cos(bouton.tipAngle) * (2.8 + usa.base.acaso() * 3.0) * Est.anatomy.scale,
              vy: Math.sin(bouton.tipAngle) * (2.8 + usa.base.acaso() * 3.0) * Est.anatomy.scale,
              radius: (6.5 + usa.base.acaso() * 4.5) * Est.anatomy.scale,
              growRate: (6.5 + usa.base.acaso() * 4.0) * Est.anatomy.scale,
              life: 1.0,
              rgb: bouton.rgb
            });
          }

          const cosA = Math.cos(bouton.tipAngle);
          const sinA = Math.sin(bouton.tipAngle);
          const perpX = -sinA;
          const perpY = cosA;
          const cleftSpan = bouton.bThick * 1.45;
          const pocketOffsets = [-0.26, 0, 0.26];

          for (let k = 0; k < 10; k++) {
            const pIdx = k % 3;
            const pocketY = pocketOffsets[pIdx] * bouton.bWidth + ((usa.base.acaso() - 0.5) * 2.0 * Est.anatomy.scale);
            const startX = bouton.x + cosA * (bouton.bThick * 0.50) + perpX * pocketY;
            const startY = bouton.y + sinA * (bouton.bThick * 0.50) + perpY * pocketY;
            const targetX = startX + cosA * cleftSpan + perpX * ((usa.base.acaso() - 0.5) * 4.2 * Est.anatomy.scale);
            const targetY = startY + sinA * cleftSpan + perpY * ((usa.base.acaso() - 0.5) * 4.2 * Est.anatomy.scale);

            releasedNeurotransmitters.push({
              startX,
              startY,
              targetX,
              targetY,
              x: startX,
              y: startY,
              progress: -usa.base.acaso() * 0.22,
              speed: 1.50 + usa.base.acaso() * 0.60,
              jitter: 5.5 * Est.anatomy.scale,
              size: (1.25 + usa.base.acaso() * 0.55) * Est.anatomy.scale,
              isCentralBeam: k === 3 || k === 6,
              rgb: bouton.rgb
            });
          }
        }

// Atualiza física da rede neural completa
        function stepSimulation(dt) {
          runtime.time += dt;
          const speedFactor = 0.35 + (config.velocidadePulsos / 100) * 1.45;
          const freqFactor = config.frequenciaDisparos / 100;

          if (freqFactor > 0.01 && !opc.quieto) {
            const interval = Math.max(0.22, 1.85 - freqFactor * 1.50);
            runtime.spawnAccumulator += dt;
            if (runtime.spawnAccumulator >= interval) {
              runtime.spawnAccumulator = 0;
              if (Est.minis.length) {
                dispararMini(Est.minis[Math.floor(usa.base.acaso() * Est.minis.length)]);
                if (usa.base.acaso() < 0.22) triggerActionPotential();
              } else {
                spawnDendriteSignal();
                if (usa.base.acaso() < 0.45 + freqFactor * 0.45) {
                  triggerActionPotential();
                }
              }
            }
          }

          runtime.somaExcitation = Math.max(0, runtime.somaExcitation - dt * 1.4);

          // 1. Sinais nos dendritos (de fora para dentro até o soma)
          for (let i = incomingSignals.length - 1; i >= 0; i--) {
            const sig = incomingSignals[i];
            sig.progress -= sig.speed * speedFactor * dt * 1.25;
            while (sig.progress <= 0 && sig.entrada && sig.entrada.pai) {   // chegou à bifurcação: segue pelo ramo pai
              const pai = sig.entrada.pai;
              sig.progress += sig.entrada.idxPai / Math.max(1, pai.pts.length - 1);
              sig.entrada = pai;
              sig.pts = pai.pts;
            }
            if (sig.progress <= 0) {
              incomingSignals.splice(i, 1);
              runtime.somaExcitation = Math.min(1.0, runtime.somaExcitation + 0.35);
              runtime.somaRgb = sig.rgb || null;                  // o Núcleo pisca na cor de quem acabou de falar com ele
              if (sig.cb) { try { sig.cb(); } catch (erro) { /* a cena não pode derrubar o desenho */ } }
              if (usa.base.acaso() < 0.35) {
                triggerActionPotential();
              }
            }
          }

          // 2. Ciclo de vesículas e bolsas nos bulbos terminais
          Est.anatomy.boutonsTodos.forEach((b) => {
            b.flash = Math.max(0, b.flash - dt * 1.9);
            for (let pi = 0; pi < 3; pi++) {
              b.pocketExcite[pi] = Math.max(0, b.pocketExcite[pi] - dt * 1.8);
            }
            b.vesicles.forEach((v) => {
              if (v.fusionProgress > 0) {
                v.fusionProgress += dt * 1.45;
                if (v.fusionProgress >= 1.0) {
                  v.fusionProgress = 0;
                  v.localX = v.homeX - b.bThick * 0.14;
                }
              } else {
                v.localX += (v.homeX - v.localX) * dt * 1.8 + v.vx * dt * 0.35;
                v.localY += (v.homeY - v.localY) * dt * 1.8 + v.vy * dt * 0.35;
                const maxX = b.bThick * 0.36;
                const minX = -b.bThick * 0.28;
                const maxY = b.bWidth * 0.32;
                if (v.localX > maxX || v.localX < minX) v.vx *= -1;
                if (Math.abs(v.localY) > maxY) v.vy *= -1;
              }
            });
          });

          // 3. Potenciais de ação ao longo do axônio -> telodendros -> bulbos terminais
          for (let i = actionPotentials.length - 1; i >= 0; i--) {
            const ap = actionPotentials[i];
            ap.t += speedFactor * dt * 0.85 * (ap.eixo.axonEscala || 1);

            ap.eixo.ranvierNodes.forEach((node, idx) => {
              if (!ap.visitedNodes.has(idx) && Math.abs(ap.t - node.t) < 0.045) {
                ap.visitedNodes.add(idx);
                node.flash = 1.0;
              }
            });

            if (ap.t >= 1.35) {
              ap.boutons.forEach((bouton) => emitSynapticRelease(bouton));
              actionPotentials.splice(i, 1);
              if (opc.aoChegar) { try { opc.aoChegar(ap.eixo.id, ap.eixo); } catch (erro) { /* a cena não pode derrubar o desenho */ } }
            }
          }

          Est.anatomy.nosTodos.forEach((n) => {
            n.flash = Math.max(0, n.flash - dt * 2.8);
          });

          // 3b. Os neurônios menores: o sinal corre pelo axônio até os terminais e passa para o dendrito do principal
          for (let i = miniAPs.length - 1; i >= 0; i--) {
            const ap = miniAPs[i];
            ap.t += speedFactor * dt * 1.3;
            if (ap.t >= 1.35) {
              ap.m.flash = 1;
              incomingSignals.push({ pts: ap.m.alvo.pts, progress: 1.0, speed: 0.56 + usa.base.acaso() * 0.34, entrada: ap.m.alvo, rgb: ap.rgb || ap.m.rgb, cb: ap.cb || null });
              miniAPs.splice(i, 1);
            }
          }
          Est.minis.forEach(function (m) {
            m.flash = Math.max(0, m.flash - dt * 1.9);
            m.excita = Math.max(0, m.excita - dt * 1.4);
            if (m.ativoT > 0) m.ativoT = Math.max(0, m.ativoT - dt);
          });

          // 4. Névoa de dispersão translúcida
          for (let i = mistClouds.length - 1; i >= 0; i--) {
            const m = mistClouds[i];
            m.x += m.vx * dt;
            m.y += m.vy * dt;
            m.radius += m.growRate * dt;
            m.life -= dt * 1.45;
            if (m.life <= 0) mistClouds.splice(i, 1);
          }

          // 5. Neurotransmissores na fenda sináptica
          for (let i = releasedNeurotransmitters.length - 1; i >= 0; i--) {
            const nt = releasedNeurotransmitters[i];
            nt.progress += nt.speed * dt;
            if (nt.progress < 0) continue;

            const clamped = Math.min(1, nt.progress);
            const jx = (usa.base.acaso() - 0.5) * nt.jitter * dt;
            const jy = (usa.base.acaso() - 0.5) * nt.jitter * dt;
            nt.x = nt.startX + (nt.targetX - nt.startX) * clamped + jx;
            nt.y = nt.startY + (nt.targetY - nt.startY) * clamped + jy;

            if (nt.progress >= 1.0) {
              releasedNeurotransmitters.splice(i, 1);
            }
          }
        }

    return { spawnDendriteSignal: spawnDendriteSignal, triggerActionPotential: triggerActionPotential, dispararMini: dispararMini, emitSynapticRelease: emitSynapticRelease, stepSimulation: stepSimulation };
  }

  return { criar: criar };
}

);
// ---- fonte/neuronio/tinta/parte.js
SF.parte({nome:'neuronio/tinta',porta:1,compativelDesde:1,requer:[],guarda:false,dom:false},
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

);
// ---- fonte/neuronio/escala/parte.js
SF.parte({nome:'neuronio/escala',porta:1,compativelDesde:1,requer:['comum/ramos@1'],guarda:false,dom:true},
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

);
// ---- fonte/neuronio/vidro/parte.js
SF.parte({nome:'neuronio/vidro',porta:1,compativelDesde:1,requer:['comum/sorteio@1'],guarda:false,dom:true},
/* Sexta-Feira Engine v0.4.2: neuronio/vidro. o vidro da esfera, com profundidade: as duas camadas pré-renderizadas (fundo e frente), a paralaxe do ponteiro, e como o vidro e a parte fixa entram na vista atual (com a lupa).
 * Código movido sem reescrever de neuronio/celula: o estado vem de Est (a tabela dos campos está no LEIA-ME.md da juntadora e deste) e as funções
 * das irmãs chegam em d, passadas pela juntadora. Só desenha/calcula o que está na lista da porta. */
function (usa) {
  'use strict';

  function criar(Est, d) {
    var createSeededRandom = usa.sorteio.criar;
    var VISTA_1 = Est.VISTA_1, canvas = Est.canvas, ctx = Est.ctx, lupa = Est.lupa, opc = Est.opc, par = Est.par, runtime = Est.runtime, vista = Est.vista;
    var zcDe = d.zcDe, novoBitmap = d.novoBitmap;

function construirVidro() {
          if (opc.modo === 'ligacoes') { Est.vidro = null; return; }
          const R = vista.Rpx, dpr = runtime.dpr, m = Math.ceil(R * 0.05) + 14, S = Math.round((R + m) * 2 * dpr);
          const rnd = createSeededRandom(77123);
          const novo = function () { const c = document.createElement('canvas'); c.width = S; c.height = S; const x = c.getContext('2d'); x.scale(dpr, dpr); x.translate(R + m, R + m); return { cv: c, c: x }; };
          const poeira = function (c, n, rmin, rmax, amin, amax, alcance) {
            for (let i = 0; i < n; i++) {
              const ang = rnd() * Math.PI * 2, dist = Math.sqrt(rnd()) * alcance * R, rr = (rmin + rnd() * (rmax - rmin)) * R / 410, al = amin + rnd() * (amax - amin);
              const x = Math.cos(ang) * dist, y = Math.sin(ang) * dist, g = c.createRadialGradient(x, y, 0, x, y, rr);
              g.addColorStop(0, 'rgba(225, 230, 255, ' + al.toFixed(3) + ')');
              g.addColorStop(0.5, 'rgba(190, 200, 255, ' + (al * 0.45).toFixed(3) + ')');
              g.addColorStop(1, 'rgba(190, 200, 255, 0)');
              c.fillStyle = g; c.beginPath(); c.arc(x, y, rr, 0, Math.PI * 2); c.fill();
            }
          };
          // ---- o fundo: a parede de trás
          const F = novo(), f = F.c;
          f.save();
          f.beginPath(); f.arc(0, 0, R * 0.975, 0, Math.PI * 2); f.clip();
          let g = f.createRadialGradient(-R * 0.10, -R * 0.14, 0, -R * 0.10, -R * 0.14, R * 1.05);   // névoa: mais clara no meio, escurecendo para a borda
          g.addColorStop(0, 'rgba(150, 152, 238, 0.17)');
          g.addColorStop(0.45, 'rgba(96, 86, 192, 0.12)');
          g.addColorStop(0.80, 'rgba(46, 38, 112, 0.075)');
          g.addColorStop(1, 'rgba(18, 12, 44, 0.03)');
          f.fillStyle = g; f.fillRect(-R, -R, R * 2, R * 2);
          g = f.createRadialGradient(0, 0, R * 0.55, 0, 0, R * 0.98);                                  // vinheta: a borda afunda
          g.addColorStop(0, 'rgba(0, 0, 10, 0)');
          g.addColorStop(1, 'rgba(0, 0, 10, 0.55)');
          f.fillStyle = g; f.fillRect(-R, -R, R * 2, R * 2);
          f.save();                                                                                    // brilho refletido no fundo, embaixo
          f.translate(R * 0.04, R * 0.80); f.scale(1, 0.22);
          g = f.createRadialGradient(0, 0, 0, 0, 0, R * 0.52);
          g.addColorStop(0, 'rgba(176, 180, 255, 0.20)');
          g.addColorStop(1, 'rgba(176, 180, 255, 0)');
          f.fillStyle = g; f.beginPath(); f.arc(0, 0, R * 0.52, 0, Math.PI * 2); f.fill();
          f.restore();
          poeira(f, 34, 1.4, 4.6, 0.05, 0.13, 0.9);                                                    // poeira distante
          f.restore();
          f.lineWidth = Math.max(1, R * 0.010);                                                          // a borda da parede de trás, deslocada pela refração
          g = f.createLinearGradient(-R * 0.7, -R * 0.7, R * 0.7, R * 0.7);
          g.addColorStop(0, 'rgba(200, 205, 255, 0.04)');
          g.addColorStop(1, 'rgba(215, 220, 255, 0.24)');
          f.strokeStyle = g;
          f.beginPath(); f.arc(R * 0.018, R * 0.024, R * 0.945, 0, Math.PI * 2); f.stroke();
          // ---- a frente: a casca de vidro
          const T = novo(), t = T.c;
          g = t.createRadialGradient(0, 0, 0, 0, 0, R);                                                // borda de Fresnel: o vidro brilha onde é visto de lado
          g.addColorStop(0, 'rgba(170, 180, 255, 0)');
          g.addColorStop(0.78, 'rgba(170, 180, 255, 0)');
          g.addColorStop(0.90, 'rgba(176, 186, 255, 0.05)');
          g.addColorStop(0.965, 'rgba(215, 222, 255, 0.14)');
          g.addColorStop(0.995, 'rgba(240, 244, 255, 0.28)');
          g.addColorStop(1, 'rgba(240, 244, 255, 0)');
          t.fillStyle = g; t.beginPath(); t.arc(0, 0, R, 0, Math.PI * 2); t.fill();
          t.lineWidth = Math.max(1.2, R * 0.012);                                                      // as duas paredes
          t.strokeStyle = 'rgba(255, 255, 255, 0.20)';
          t.beginPath(); t.arc(0, 0, R - t.lineWidth / 2, 0, Math.PI * 2); t.stroke();
          t.lineWidth = Math.max(0.6, R * 0.005);
          t.strokeStyle = 'rgba(255, 255, 255, 0.08)';
          t.beginPath(); t.arc(0, 0, R * 0.955, 0, Math.PI * 2); t.stroke();
          t.lineCap = 'round';                                                                         // reflexo principal (a janela de luz)
          t.lineWidth = Math.max(3, R * 0.052); t.strokeStyle = 'rgba(255, 255, 255, 0.06)';
          t.beginPath(); t.arc(0, 0, R * 0.885, Math.PI * 1.10, Math.PI * 1.42); t.stroke();
          t.lineWidth = Math.max(1.6, R * 0.024); t.strokeStyle = 'rgba(255, 255, 255, 0.24)';
          t.beginPath(); t.arc(0, 0, R * 0.885, Math.PI * 1.13, Math.PI * 1.39); t.stroke();
          t.save();
          t.translate(-R * 0.40, -R * 0.55); t.rotate(-0.62); t.scale(1, 0.38);
          g = t.createRadialGradient(0, 0, 0, 0, 0, R * 0.20);
          g.addColorStop(0, 'rgba(255, 255, 255, 0.34)');
          g.addColorStop(0.6, 'rgba(255, 255, 255, 0.12)');
          g.addColorStop(1, 'rgba(255, 255, 255, 0)');
          t.fillStyle = g; t.beginPath(); t.arc(0, 0, R * 0.20, 0, Math.PI * 2); t.fill();
          t.restore();
          t.lineWidth = Math.max(1.4, R * 0.020);                                                      // reflexo de volta, embaixo à direita
          t.strokeStyle = 'rgba(210, 220, 255, 0.15)';
          t.beginPath(); t.arc(0, 0, R * 0.90, Math.PI * 0.08, Math.PI * 0.30); t.stroke();
          g = t.createRadialGradient(R * 0.54, R * 0.66, 0, R * 0.54, R * 0.66, R * 0.045);
          g.addColorStop(0, 'rgba(255, 255, 255, 0.32)');
          g.addColorStop(1, 'rgba(255, 255, 255, 0)');
          t.fillStyle = g; t.beginPath(); t.arc(R * 0.54, R * 0.66, R * 0.045, 0, Math.PI * 2); t.fill();
          t.save(); t.beginPath(); t.arc(0, 0, R * 0.99, 0, Math.PI * 2); t.clip();
          poeira(t, 9, 7, 17, 0.025, 0.065, 0.85);                                                     // poeira perto de quem olha, fora de foco
          t.restore();
          Est.vidro = { fundo: F.cv, frente: T.cv, m: m };
        }

function mesmaVista(a, b) { return a.z === b.z && a.ox === b.ox && a.oy === b.oy; }

// O vidro já na vista de uma lupa (feito uma vez quando a lupa para; depois cada quadro só copia, sem reamostrar)
        function vidroDaVista(v) {
          if (!Est.vidro) return null;
          const d = runtime.dpr, S = Est.vidro.fundo.width;
          const X = d * (v.z * (vista.cx - vista.Rpx - Est.vidro.m) + v.ox), Y = d * (v.z * (vista.cy - vista.Rpx - Est.vidro.m) + v.oy);
          const faz = function (fonte) {
            const c = novoBitmap(), x = c.getContext('2d');
            x.imageSmoothingQuality = 'high';
            x.drawImage(fonte, X, Y, S * v.z, S * v.z);
            return c;
          };
          return { fundo: faz(Est.vidro.fundo), frente: faz(Est.vidro.frente) };
        }

// De perto, o vidro fica mais discreto (o reflexo e a névoa tiram contraste)
        function vidroNaVista(qual) {
          if (!Est.vidro) return;
          const d = runtime.dpr, q = zcDe(lupa.z), desloc = qual === 'fundo' ? -0.9 : 1.0, amp = Math.min(8, Math.max(2.4, vista.Rpx * 0.045));      // o vidro desliza menos nas esferas pequenas
          const px = desloc * amp * par.x, py = desloc * amp * par.y, B = vista.cx - vista.Rpx - Est.vidro.m, C = vista.cy - vista.Rpx - Est.vidro.m;
          ctx.save();
          ctx.setTransform(1, 0, 0, 1, 0, 0);
          ctx.globalAlpha = qual === 'fundo' ? 1 - 0.45 * q : 1 - 0.6 * q;
          if (lupa.z === 1) {
            ctx.drawImage(Est.vidro[qual], Math.round((B + px) * d), Math.round((C + py) * d));
          } else if (Est.detalhe && Est.detalhe.vidro && mesmaVista(Est.detalhe.v, lupa)) {
            ctx.drawImage(Est.detalhe.vidro[qual], Math.round(px * d), Math.round(py * d));
          } else {
            const S = Est.vidro[qual].width * lupa.z;
            ctx.drawImage(Est.vidro[qual], d * (lupa.z * B + lupa.ox + px), d * (lupa.z * C + lupa.oy + py), S, S);
          }
          ctx.restore();
        }

// A parte fixa na vista atual: o bitmap refeito para a lupa onde ele cobre, e a vista normal ampliada no resto (até o refino chegar)
        function estaticoNaVista() {
          const base = Est.anatomy.offscreenCanvas;
          if (!base) return;
          const d = runtime.dpr;
          const desenha = function (fonte, v0) {
            const s = lupa.z / v0.z, tx = d * (lupa.ox - s * v0.ox), ty = d * (lupa.oy - s * v0.oy);
            ctx.save();
            if (Math.abs(s - 1) < 1e-9) ctx.setTransform(1, 0, 0, 1, Math.round(tx), Math.round(ty));
            else { ctx.setTransform(s, 0, 0, s, tx, ty); ctx.imageSmoothingQuality = 'medium'; }
            ctx.drawImage(fonte, 0, 0);
            ctx.restore();
          };
          if (lupa.z <= 1.0001 || !Est.detalhe) { desenha(base, VISTA_1); return; }
          const v0 = Est.detalhe.v, s = lupa.z / v0.z, rx = d * (lupa.ox - s * v0.ox), ry = d * (lupa.oy - s * v0.oy);
          const rw = Est.detalhe.cv.width * s, rh = Est.detalhe.cv.height * s, W = canvas.width, H = canvas.height;
          if (!(rx <= 0.5 && ry <= 0.5 && rx + rw >= W - 0.5 && ry + rh >= H - 0.5)) {
            ctx.save();
            ctx.setTransform(1, 0, 0, 1, 0, 0);
            ctx.beginPath(); ctx.rect(0, 0, W, H); ctx.rect(rx, ry, rw, rh); ctx.clip('evenodd');
            desenha(base, VISTA_1);
            ctx.restore();
          }
          desenha(Est.detalhe.cv, v0);
        }

function moverParalaxe() {
          if (opc.leve) { par.x = 0; par.y = 0; return; }
          const t = usa.base.agora() / 1000;
          const ax = par.tx + Math.sin(t * 0.31) * 0.40, ay = par.ty + Math.cos(t * 0.23) * 0.30;   // o vidro respira mesmo parado
          par.x += (ax - par.x) * 0.07;
          par.y += (ay - par.y) * 0.07;
        }

    return { construirVidro: construirVidro, mesmaVista: mesmaVista, vidroDaVista: vidroDaVista, vidroNaVista: vidroNaVista, estaticoNaVista: estaticoNaVista, moverParalaxe: moverParalaxe };
  }

  return { criar: criar };
}

);
// ---- fonte/neuronio/terminais/parte.js
SF.parte({nome:'neuronio/terminais',porta:1,compativelDesde:1,requer:['comum/ramos@1','comum/sorteio@1'],guarda:false,dom:false},
/* Sexta-Feira Engine v0.4.2: neuronio/terminais. o desenho parado dos terminais: ramos dos telodendros uniformes (seção 6 do desenho aprovado, um por axônio) e os botões fixos dos neurônios menores. Recebe a tinta T.
 * Código movido sem reescrever de neuronio/celula: o estado vem de Est (a tabela dos campos está no LEIA-ME.md da juntadora e deste) e as funções
 * das irmãs chegam em d, passadas pela juntadora. Só desenha/calcula o que está na lista da porta. */
function (usa) {
  'use strict';

  function criar(Est, d) {
    var ramos = usa.ramos; var trilhaSuave = ramos.trilhaSuave, bordasRamo = ramos.bordasRamo, desviar = ramos.desviar, mitocondrias = ramos.mitocondrias;
    var createSeededRandom = usa.sorteio.criar;
    var config = Est.config;
    var nivel = d.nivel, drawTaperedBranch = d.drawTaperedBranch;
    var ctx = Est.ctx, lupa = Est.lupa, mistClouds = Est.mistClouds, releasedNeurotransmitters = Est.releasedNeurotransmitters, runtime = Est.runtime;

// 6. RAMOS DOS TELODENDROS UNIFORMES (Padrão aprovado) (um por axônio)
        function pintarTerminais(octx, A, E, T) {
          var r = T.r, g = T.g, b = T.b, lightR = T.lightR, lightG = T.lightG, lightB = T.lightB, dendriteAlpha = T.dendriteAlpha, nv = T.nv, u = T.u;
          octx.save();
          E.terminalBranches.forEach((br) => {
            const mult = br.depth === 1 ? 1.0 : 0.84;
            octx.fillStyle = `rgba(${r}, ${g}, ${b}, ${dendriteAlpha * 0.94 * mult})`;
            drawTaperedBranch(octx, br.pts);

            octx.strokeStyle = `rgba(${lightR}, ${lightG}, ${lightB}, ${Math.min(0.95, dendriteAlpha * 0.88 * mult)})`;
            octx.lineWidth = Math.max(0.8, (br.depth === 1 ? 1.35 : 0.95) * A.scale);
            octx.beginPath();
            br.pts.forEach((p, idx) => {
              if (idx === 0) octx.moveTo(p.x, p.y);
              else octx.lineTo(p.x, p.y);
            });
            octx.stroke();
            if (nv >= 1 && br.pts.length > 3) {                               // de perto: as bordas dos ramos terminais
              const bb = bordasRamo(br.pts);
              octx.strokeStyle = `rgba(${lightR}, ${lightG}, ${lightB}, 0.6)`;
              octx.lineWidth = 0.8 * u;
              octx.beginPath(); trilhaSuave(octx, bb.L, true); octx.stroke();
              octx.beginPath(); trilhaSuave(octx, bb.R, true); octx.stroke();
            }
          });
          octx.restore();
        }

// Os bulbos dos neurônios menores ficam na camada fixa (sem vesículas); o brilho do disparo é desenhado por cima
        function pintarBotoesFixos(octx, A, rgb) {
          const [r, g, b] = rgb || config.rgb;
          const lr = Math.min(255, r + 95), lg = Math.min(255, g + 95), lb = Math.min(255, b + 95);
          const dr = Math.round(r * 0.28), dg = Math.round(g * 0.28), db = Math.round(b * 0.28);
          const dAlpha = Math.max(0.08, config.opacidadeDendritos / 100);
          A.terminalBoutons.forEach(function (bt) {
            octx.save();
            octx.translate(bt.x, bt.y);
            octx.rotate(bt.tipAngle);
            const bw = bt.bThick, bh = bt.bWidth, nh = bt.neckW * 0.5;
            octx.beginPath();
            octx.moveTo(-bw * 0.92, -nh);
            octx.bezierCurveTo(-bw * 0.42, -nh * 1.12, -bw * 0.14, -bh * 0.54, bw * 0.36, -bh * 0.50);
            octx.bezierCurveTo(bw * 0.62, -bh * 0.46, bw * 0.64, bh * 0.46, bw * 0.36, bh * 0.50);
            octx.bezierCurveTo(-bw * 0.14, bh * 0.54, -bw * 0.42, nh * 1.12, -bw * 0.92, nh);
            octx.closePath();
            const cg = octx.createLinearGradient(-bw * 0.85, 0, bw * 0.60, 0);
            cg.addColorStop(0, `rgba(${r}, ${g}, ${b}, 0)`);
            cg.addColorStop(0.28, `rgba(${r}, ${g}, ${b}, ${dAlpha * 0.94})`);
            cg.addColorStop(0.68, `rgba(${dr}, ${dg}, ${db}, 0.88)`);
            cg.addColorStop(1, `rgba(${lr}, ${lg}, ${lb}, 0.80)`);
            octx.fillStyle = cg;
            octx.fill();
            octx.strokeStyle = `rgba(${lr}, ${lg}, ${lb}, 0.6)`;
            octx.lineWidth = 1.0 * A.scale;
            octx.stroke();
            if (nivel() >= 2) {                                               // de perto: as vesículas dentro do bulbo
              bt.vesicles.forEach(function (v) {
                octx.fillStyle = `rgba(${lr}, ${lg}, ${lb}, 0.25)`;
                octx.beginPath(); octx.arc(v.homeX, v.homeY, v.radius, 0, Math.PI * 2); octx.fill();
                octx.strokeStyle = `rgba(${lr}, ${lg}, ${lb}, 0.8)`;
                octx.lineWidth = 0.6;
                octx.stroke();
              });
            }
            octx.restore();
          });
        }


// 1. Névoa de Dispersão translúcida
        function pintarNevoa(T) {
          var zcL = T.zcL, r = T.r, g = T.g, b = T.b, lightR = T.lightR, lightG = T.lightG, lightB = T.lightB, deepR = T.deepR, deepG = T.deepG, deepB = T.deepB;
          var usaCor = function (c) { T.usaCor(c); r = T.r; g = T.g; b = T.b; lightR = T.lightR; lightG = T.lightG; lightB = T.lightB; deepR = T.deepR; deepG = T.deepG; deepB = T.deepB; };
          if (config.enableMist && zcL < 0.98) {
            mistClouds.forEach((m) => {
              usaCor(m.rgb);
              const mGrad = ctx.createRadialGradient(m.x, m.y, 1, m.x, m.y, m.radius);
              mGrad.addColorStop(0, `rgba(${lightR}, ${lightG}, ${lightB}, ${0.24 * m.life * (1 - zcL)})`);
              mGrad.addColorStop(0.55, `rgba(${r}, ${g}, ${b}, ${0.12 * m.life * (1 - zcL)})`);
              mGrad.addColorStop(1, `rgba(${r}, ${g}, ${b}, 0)`);
              ctx.fillStyle = mGrad;
              ctx.beginPath();
              ctx.arc(m.x, m.y, m.radius, 0, Math.PI * 2);
              ctx.fill();
            });
          }
        }

// 6. Bulbos Pré-Sinápticos Unificados em Sino Contínuo + Vesículas + Bolsas de Exocitose
        function pintarBulbos(T) {
          var r = T.r, g = T.g, b = T.b, lightR = T.lightR, lightG = T.lightG, lightB = T.lightB, deepR = T.deepR, deepG = T.deepG, deepB = T.deepB, dendriteAlpha = T.dendriteAlpha;
          var usaCor = function (c) { T.usaCor(c); r = T.r; g = T.g; b = T.b; lightR = T.lightR; lightG = T.lightG; lightB = T.lightB; deepR = T.deepR; deepG = T.deepG; deepB = T.deepB; };
          const boutonsMain = Est.anatomy.terminalBoutons;
          const detalheFino = lupa.z >= 1.5;                                  // os pontinhos das vesículas e os sulcos só aparecem com a lupa
          Est.anatomy.boutonsTodos.forEach((bouton) => {
            usaCor(bouton.rgb);
            const leveB = !detalheFino && boutonsMain.indexOf(bouton) < 0;   // nos terminais dos axônios extras, a 1x, só o essencial
            ctx.save();
            ctx.translate(bouton.x, bouton.y);
            ctx.rotate(bouton.tipAngle);

            const bw = bouton.bThick;
            const bh = bouton.bWidth;
            const neckHalf = bouton.neckW * 0.5;

            ctx.beginPath();
            ctx.moveTo(-bw * 0.92, -neckHalf);
            ctx.bezierCurveTo(-bw * 0.42, -neckHalf * 1.12, -bw * 0.14, -bh * 0.54, bw * 0.36, -bh * 0.50);
            ctx.bezierCurveTo(bw * 0.62, -bh * 0.46, bw * 0.64, bh * 0.46, bw * 0.36, bh * 0.50);
            ctx.bezierCurveTo(-bw * 0.14, bh * 0.54, -bw * 0.42, neckHalf * 1.12, -bw * 0.92, neckHalf);
            ctx.closePath();

            const cupGrad = ctx.createLinearGradient(-bw * 0.85, 0, bw * 0.60, 0);
            cupGrad.addColorStop(0, `rgba(${r}, ${g}, ${b}, 0)`);
            cupGrad.addColorStop(0.28, `rgba(${r}, ${g}, ${b}, ${dendriteAlpha * 0.94})`);
            cupGrad.addColorStop(0.68, `rgba(${deepR}, ${deepG}, ${deepB}, 0.88)`);
            cupGrad.addColorStop(1, `rgba(${r}, ${g}, ${b}, ${0.72 + bouton.flash * 0.25})`);

            ctx.fillStyle = cupGrad;
            ctx.fill();

            ctx.save();
            ctx.clip();

            if (!leveB) bouton.grooves.forEach((gr, idx) => {
              const gy = gr.yNorm * bh;
              ctx.strokeStyle = idx % 2 === 0
                ? `rgba(${lightR}, ${lightG}, ${lightB}, 0.22)`
                : `rgba(${deepR}, ${deepG}, ${deepB}, 0.48)`;
              ctx.lineWidth = 0.9 * Est.anatomy.scale;
              ctx.beginPath();
              ctx.moveTo(-bw * 0.75, gy * 0.25);
              ctx.quadraticCurveTo(0, gy * (0.95 + gr.curve), bw * 0.52, gy * 0.85);
              ctx.stroke();
            });

            const energyGrad = ctx.createLinearGradient(-bw * 0.85, 0, bw * 0.52, 0);
            energyGrad.addColorStop(0, `rgba(${lightR}, ${lightG}, ${lightB}, ${0.55 + bouton.flash * 0.40})`);
            energyGrad.addColorStop(1, `rgba(${lightR}, ${lightG}, ${lightB}, ${0.35 + bouton.flash * 0.55})`);
            ctx.strokeStyle = energyGrad;
            ctx.lineWidth = (1.4 + bouton.flash * 1.0) * Est.anatomy.scale;
            ctx.beginPath();
            ctx.moveTo(-bw * 0.85, 0);
            ctx.quadraticCurveTo(-bw * 0.15, -bh * 0.06, bw * 0.46, -bh * 0.24);
            ctx.moveTo(-bw * 0.45, 0);
            ctx.quadraticCurveTo(0, bh * 0.04, bw * 0.46, bh * 0.24);
            ctx.stroke();

            if (config.enableVesicles) {
              bouton.vesicles.forEach((v) => {
                const twinkle = 0.72 + 0.28 * Math.sin(runtime.time * 3.8 + v.phase);
                const isFusing = v.fusionProgress > 0;
                const vAlpha = isFusing
                  ? Math.max(0.25, (1 - v.fusionProgress) * 0.95)
                  : Math.min(1, twinkle * (0.80 + bouton.flash * 0.20));

                const drawX = isFusing ? bw * 0.42 : v.localX;
                const drawY = v.localY;
                const drawR = v.radius;

                ctx.fillStyle = `rgba(${lightR}, ${lightG}, ${lightB}, ${0.26 * vAlpha})`;
                ctx.beginPath();
                ctx.arc(drawX, drawY, drawR, 0, Math.PI * 2);
                ctx.fill();

                ctx.strokeStyle = `rgba(${lightR}, ${lightG}, ${lightB}, ${0.75 * vAlpha})`;
                ctx.lineWidth = 0.75 * Est.anatomy.scale;
                ctx.stroke();

                const dotR = drawR * 0.26;
                ctx.fillStyle = `rgba(${lightR}, ${lightG}, ${lightB}, ${vAlpha})`;
                for (let d = 0; d < (leveB ? 0 : 4); d++) {
                  const da = v.phase + (d * Math.PI) / 2;
                  ctx.beginPath();
                  ctx.arc(
                    drawX + Math.cos(da) * drawR * 0.42,
                    drawY + Math.sin(da) * drawR * 0.42,
                    dotR,
                    0,
                    Math.PI * 2
                  );
                  ctx.fill();
                }
              });
            }

            const pocketYList = [-bh * 0.26, 0, bh * 0.26];
            const pocketRad = 2.2 * Est.anatomy.scale;
            pocketYList.forEach((py, pi) => {
              const pGlow = bouton.pocketExcite[pi] || 0;
              ctx.fillStyle = '#000000';
              ctx.beginPath();
              ctx.arc(bw * 0.54, py, pocketRad, Math.PI * 0.5, Math.PI * 1.5);
              ctx.fill();

              ctx.strokeStyle = `rgba(${lightR}, ${lightG}, ${lightB}, ${0.58 + pGlow * 0.42})`;
              ctx.lineWidth = (0.95 + pGlow * 0.55) * Est.anatomy.scale;
              ctx.beginPath();
              ctx.arc(bw * 0.54, py, pocketRad, Math.PI * 0.52, Math.PI * 1.48);
              ctx.stroke();
            });

            ctx.restore();

            // Contorno apenas nas paredes externas do sino (sem linha fechando o pescoço)
            ctx.strokeStyle = `rgba(${lightR}, ${lightG}, ${lightB}, 0.54)`;
            ctx.lineWidth = 1.0 * Est.anatomy.scale;
            ctx.beginPath();
            ctx.moveTo(-bw * 0.92, -neckHalf);
            ctx.bezierCurveTo(-bw * 0.42, -neckHalf * 1.12, -bw * 0.14, -bh * 0.54, bw * 0.36, -bh * 0.50);
            ctx.bezierCurveTo(bw * 0.62, -bh * 0.46, bw * 0.64, bh * 0.46, bw * 0.36, bh * 0.50);
            ctx.bezierCurveTo(-bw * 0.14, bh * 0.54, -bw * 0.42, neckHalf * 1.12, -bw * 0.92, neckHalf);
            ctx.stroke();

            ctx.restore();
          });
        }

// 7. Neurotransmissores esféricos liberados na fenda sináptica
        function pintarNeurotransmissores(T) {
          var r = T.r, g = T.g, b = T.b, lightR = T.lightR, lightG = T.lightG, lightB = T.lightB, deepR = T.deepR, deepG = T.deepG, deepB = T.deepB;
          var usaCor = function (c) { T.usaCor(c); r = T.r; g = T.g; b = T.b; lightR = T.lightR; lightG = T.lightG; lightB = T.lightB; deepR = T.deepR; deepG = T.deepG; deepB = T.deepB; };
          releasedNeurotransmitters.forEach((nt) => {
            usaCor(nt.rgb);
            if (nt.progress < 0) return;

            if (nt.isCentralBeam) {
              ctx.strokeStyle = `rgba(${lightR}, ${lightG}, ${lightB}, 0.28)`;
              ctx.lineWidth = 0.85 * Est.anatomy.scale;
              ctx.beginPath();
              ctx.moveTo(nt.startX, nt.startY);
              ctx.lineTo(nt.targetX, nt.targetY);
              ctx.stroke();
            }

            const ntGrad = ctx.createRadialGradient(nt.x, nt.y, 0.2, nt.x, nt.y, nt.size * 2.4);
            ntGrad.addColorStop(0, 'rgba(255, 255, 255, 0.96)');
            ntGrad.addColorStop(0.45, `rgba(${lightR}, ${lightG}, ${lightB}, 0.85)`);
            ntGrad.addColorStop(1, `rgba(${r}, ${g}, ${b}, 0)`);
            ctx.fillStyle = ntGrad;
            ctx.beginPath();
            ctx.arc(nt.x, nt.y, nt.size * 2.4, 0, Math.PI * 2);
            ctx.fill();

            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            ctx.arc(nt.x, nt.y, nt.size * 0.72, 0, Math.PI * 2);
            ctx.fill();
          });
        }

    return { pintarTerminais: pintarTerminais, pintarBotoesFixos: pintarBotoesFixos, pintarNevoa: pintarNevoa, pintarBulbos: pintarBulbos, pintarNeurotransmissores: pintarNeurotransmissores };
  }

  return { criar: criar };
}

);
// ---- fonte/neuronio/minis/parte.js
SF.parte({nome:'neuronio/minis',porta:1,compativelDesde:1,requer:['comum/sorteio@1','comum/cores@1'],guarda:false,dom:false},
/* Sexta-Feira Engine v0.4.2: neuronio/minis. os neurônios menores dentro da esfera: monta cada um (anatomia em escala, posição, profundidade, caixa) a partir da anatomia do principal. A anatomia chega pela juntadora.
 * Código movido sem reescrever de neuronio/celula: o estado vem de Est (a tabela dos campos está no LEIA-ME.md da juntadora e deste) e as funções
 * das irmãs chegam em d, passadas pela juntadora. Só desenha/calcula o que está na lista da porta. */
function (usa) {
  'use strict';

  function criar(Est, d) {
    var createSeededRandom = usa.sorteio.criar, hexToRgb = usa.cores.hexParaRgb;
    var MINI_ESC = Est.MINI_ESC, config = Est.config, opc = Est.opc;
    var axonStartFim = d.axonStartFim, montarAnatomia = d.montarAnatomia, caixaDe = d.caixaDe, pontasTerminais = d.pontasTerminais;
    var miniAPs = Est.miniAPs;
    var drawUnifiedSmoothPulse = d.drawUnifiedSmoothPulse;

// Os neurônios menores: o mesmo desenho do principal, em escala. Cada um aponta o axônio para dentro e os terminais param na
        // ponta mais distante de um dendrito primário do principal (um menor por dendrito primário).
        function montarMinis() {
          const A = Est.anatomy, C = { x: A.somaX, y: A.somaY };
          // o ponto de contato de cada menor é a ponta de um ramo do dendrito primário, a uma fração (alcance) da ponta mais longe
          const grupos = new Map();
          A.dendriteTips.forEach(function (e) {
            let raiz = e;
            while (raiz.pai) raiz = raiz.pai;
            if (!grupos.has(raiz)) grupos.set(raiz, []);
            grupos.get(raiz).push({ e: e, d: Math.hypot(e.tipX - C.x, e.tipY - C.y) });
          });
          let alvos = Array.from(grupos.values()).map(function (lista) {
            const maxd = lista.reduce(function (m, o) { return Math.max(m, o.d); }, 0), alvoD = maxd * opc.alcance;
            let melhor = lista[0];
            lista.forEach(function (o) { if (Math.abs(o.d - alvoD) < Math.abs(melhor.d - alvoD)) melhor = o; });
            return { e: melhor.e, ang: Math.atan2(melhor.e.tipY - C.y, melhor.e.tipX - C.x) };
          });
          alvos.sort(function (p, q) { return p.ang - q.ang; });
          if (opc.rede < alvos.length) {
            const tot = alvos.length;
            alvos = Array.from({ length: opc.rede }, function (_, i) { return alvos[Math.floor(i * tot / opc.rede)]; });
          }
          // distribuição homogênea (opc.anel > 0): os menores ficam num anel ao redor do principal, a passos iguais de ângulo, com a
          // passagem do tronco (à direita) livre; cada um se prende à ponta de dendrito que melhor leva o seu corpo ao seu lugar no anel
          if (opc.anel > 0 && opc.rede > 1) {
            const todas = A.dendriteTips.filter(function (e) { return !e.extra; }).map(function (e) { return { e: e, d: Math.hypot(e.tipX - C.x, e.tipY - C.y), ang: Math.atan2(e.tipY - C.y, e.tipX - C.x) }; });
            const maxD = todas.reduce(function (m, o) { return Math.max(m, o.d); }, 0), sL0 = opc.anel * 0.44, n = opc.rede;
            const a0 = 40 * Math.PI / 180, a1 = 2 * Math.PI - a0, escolhidos = [];
            // com opc.arcos (graus, no sentido do canvas) os menores ficam só nesses arcos e as laterais viram passagens
            const angArcos = opc.arcos ? (function () {
              const arcos = opc.arcos.map(function (a) { return [a[0] * Math.PI / 180, a[1] * Math.PI / 180]; });
              const tot = arcos.reduce(function (s, a) { return s + (a[1] - a[0]); }, 0);
              const cota = arcos.map(function (a) { return n * (a[1] - a[0]) / tot; });
              const qtd = cota.map(function (c) { return Math.floor(c); });
              let falta = n - qtd.reduce(function (s, q) { return s + q; }, 0);
              while (falta > 0) {                          // o que sobra vai para quem tem o maior resto (os dois lados ficam o mais iguais possível)
                let jm = 0; cota.forEach(function (c, j) { if (c - qtd[j] > cota[jm] - qtd[jm]) jm = j; });
                qtd[jm]++; falta--;
              }
              const lista = [];
              arcos.forEach(function (a, j) { for (let i = 0; i < qtd[j]; i++) lista.push(a[0] + (a[1] - a[0]) * (i + 0.5) / qtd[j]); });
              return lista;
            })() : null;
            alvos = [];
            for (let k = 0; k < n; k++) {
              const fi = angArcos ? angArcos[k] : a0 + (a1 - a0) * k / (n - 1), P = { x: C.x + opc.anel * Math.cos(fi), y: C.y + opc.anel * Math.sin(fi) };
              let melhor = null, custo = Infinity;
              todas.forEach(function (o) {
                if (o.d < 0.45 * maxD || escolhidos.some(function (q) { return Math.hypot(q.e.tipX - o.e.tipX, q.e.tipY - o.e.tipY) < 28; })) return;
                const da = Math.abs(((o.ang - fi + 3 * Math.PI) % (2 * Math.PI)) - Math.PI);
                if (da > 1.1) return;
                const c = Math.abs(Math.hypot(P.x - o.e.tipX, P.y - o.e.tipY) - sL0) + 70 * da;
                if (c < custo) { custo = c; melhor = o; }
              });
              if (!melhor) {
                todas.forEach(function (o) { const da = Math.abs(((o.ang - fi + 3 * Math.PI) % (2 * Math.PI)) - Math.PI); if (!escolhidos.includes(o) && da < custo) { custo = da; melhor = o; } });
              }
              escolhidos.push(melhor);
              alvos.push({ e: melhor.e, ang: melhor.ang, P: P });
            }
          }
          const rnd = createSeededRandom((opc.semente ^ 0x5bd1e995) >>> 0);
          // a cor de cada menor (opc.cores, na ordem); sem cor própria, vale a do principal
          const corDoMini = function (i) {
            const h = opc.cores && opc.cores[i];
            return typeof h === 'string' && /^#[0-9a-fA-F]{6}$/.test(h) ? hexToRgb(h) : config.rgb;
          };
          // 1) cada menor: o desenho (semente própria), o tamanho e o eixo do soma até o ponto de contato (o meio dos terminais)
          // profundidade de cada menor (-1 = ao fundo do vidro, +1 = perto de quem olha), espalhada e sorteada
          const zs = alvos.map(function (_, i) { return alvos.length > 1 ? -1 + 2 * (opc.anel > 0 ? (i * 4) % alvos.length : i) / (alvos.length - 1) : 0; });
          if (!(opc.anel > 0)) for (let i = zs.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); const t = zs[i]; zs[i] = zs[j]; zs[j] = t; }
          const itens = alvos.map(function (alvo, i) {
            const B = montarAnatomia((opc.semente + 7919 * (i + 1)) >>> 0, axonStartFim());
            const pontas = pontasTerminais(B);
            let px = 0, py = 0;
            pontas.forEach(function (p) { px += p.x; py += p.y; });
            px /= pontas.length; py /= pontas.length;
            const vx = px - B.somaX, vy = py - B.somaY, L = Math.hypot(vx, vy);
            const z = zs[i], ds = 1 + 0.12 * z;                       // perto = um pouco maior, longe = um pouco menor
            const s = (MINI_ESC + rnd() * 0.06) * ds;
            const mu = rnd() < 0.5 ? 1 : -1;
            const th0 = alvo.P ? Math.atan2(alvo.e.tipY - alvo.P.y, alvo.e.tipX - alvo.P.x) + (rnd() - 0.5) * 0.12 : alvo.ang + Math.PI + opc.giro + (rnd() - 0.5) * 0.24;   // do soma do menor até a ponta do dendrito (para dentro, com o giro do cata-vento)
            let rho = 0;                                               // alcance dos dendritos do menor, já na escala
            B.dendriteTips.forEach(function (t) { rho = Math.max(rho, Math.hypot(t.tipX - B.somaX, t.tipY - B.somaY)); });
            return { alvo: alvo, B: B, pontas: pontas, px: px, py: py, vx: vx, vy: vy, L: L, s: s, mu: mu, th0: th0, th: th0, lim: 0.55, z: z, ds: ds, idx: i,
              rho: rho * s, T: { x: alvo.e.tipX, y: alvo.e.tipY }, alfa: 0.78 + rnd() * 0.14 };
          });
          // 2) os terminais ficam presos na ponta do dendrito; o corpo de cada menor gira em volta dela até não encostar no vizinho
          //    nem na passagem do tronco (no máximo 0,9 rad para cada lado)
          const somaDe = function (it) { return { x: it.T.x - Math.cos(it.th) * it.s * it.L, y: it.T.y - Math.sin(it.th) * it.s * it.L }; };
          const gira = function (it, ax, ay) {
            const proj = ax * Math.sin(it.th) - ay * Math.cos(it.th);
            if (Math.abs(proj) < 1e-9) return;
            it.th += proj > 0 ? 0.025 : -0.025;
            it.th = Math.max(it.th0 - it.lim, Math.min(it.th0 + it.lim, it.th));
          };
          for (let volta = 0; volta < 160; volta++) {
            let mexeu = false;
            for (let i = 0; i < itens.length; i++) {
              for (let j = i + 1; j < itens.length; j++) {
                const P = somaDe(itens[i]), Q = somaDe(itens[j]);
                if (Math.hypot(P.x - Q.x, P.y - Q.y) >= (itens[i].rho + itens[j].rho) * opc.sobra) continue;
                mexeu = true;
                gira(itens[i], P.x - Q.x, P.y - Q.y);
                gira(itens[j], Q.x - P.x, Q.y - P.y);
              }
              const P = somaDe(itens[i]), it = itens[i];
              if ((opc.arcos || P.x > C.x) && Math.abs(P.y - C.y) < it.rho + opc.corredor) { it.lim = 1.6; mexeu = true; gira(it, 0, P.y >= C.y ? 1 : -1); }
            }
            if (!mexeu) break;
          }
          // 2b) a passagem do tronco é sagrada: quem ainda ficou sobre ela gira o mínimo necessário (para qualquer lado) até sair
          const naFaixa = function (it) { const P = somaDe(it); return (opc.arcos || P.x > C.x) && Math.abs(P.y - C.y) < it.rho + opc.corredor; };
          itens.forEach(function (it) {
            if (!naFaixa(it)) return;
            const base = it.th;
            for (let d = 0.02; d <= 3.2; d += 0.02) {
              let achou = false;
              for (let sg = -1; sg <= 1 && !achou; sg += 2) { it.th = base + sg * d; if (!naFaixa(it)) achou = true; }
              if (achou) return;
            }
            it.th = base;
          });
          // e os vizinhos se afastam de quem foi desviado (que fica onde está)
          itens.forEach(function (it) { it.fixo = it.th !== it.th0 && it.lim === 1.6; });
          for (let volta = 0; volta < 80; volta++) {
            let mexeu = false;
            for (let i = 0; i < itens.length; i++) for (let j = i + 1; j < itens.length; j++) {
              const P = somaDe(itens[i]), Q = somaDe(itens[j]);
              if (Math.hypot(P.x - Q.x, P.y - Q.y) >= (itens[i].rho + itens[j].rho) * opc.sobra) continue;
              mexeu = true;
              if (!itens[i].fixo) gira(itens[i], P.x - Q.x, P.y - Q.y);
              if (!itens[j].fixo) gira(itens[j], Q.x - P.x, Q.y - P.y);
            }
            itens.forEach(function (it) { if (!it.fixo && naFaixa(it)) { it.th = it.th0; } });
            if (!mexeu) break;
          }
          // 3) a matriz de cada menor (escala, espelho e rotação) e os pontos já no espaço do principal
          // 2c) os buracos perto da parede: cada menor ganha alguns dendritos finos virados para fora, até uns 90% do raio da esfera (sem tocar o vidro)
          let RdPre = 0;
          itens.forEach(function (it) {
            const S = somaDe(it), M0 = it.s, ph = it.th - Math.atan2(it.mu * it.vy, it.vx), a0 = M0 * Math.cos(ph), b0 = M0 * Math.sin(ph), c0 = -M0 * it.mu * Math.sin(ph), d0 = M0 * it.mu * Math.cos(ph);
            const e0 = S.x - a0 * it.B.somaX - c0 * it.B.somaY, f0 = S.y - b0 * it.B.somaX - d0 * it.B.somaY;
            it.B.dendriteTips.forEach(function (t) { RdPre = Math.max(RdPre, Math.hypot(a0 * t.tipX + c0 * t.tipY + e0 - C.x, b0 * t.tipX + d0 * t.tipY + f0 - C.y)); });
            it.pontas.forEach(function (p) { RdPre = Math.max(RdPre, Math.hypot(a0 * p.x + c0 * p.y + e0 - C.x, b0 * p.x + d0 * p.y + f0 - C.y)); });
          });
          RdPre *= 1.03;
          itens.forEach(function (it, ii) {
            const S = somaDe(it), phi0 = it.th - Math.atan2(it.mu * it.vy, it.vx), ex = [], R = RdPre * (opc.preencher || 0.88);
            const dist = function (ang) {         // do corpo do menor, na direção ang (mundo), até o círculo de raio R em volta do principal
              const ux = Math.cos(ang), uy = Math.sin(ang), bx = (S.x - C.x) * ux + (S.y - C.y) * uy, cc = (S.x - C.x) * (S.x - C.x) + (S.y - C.y) * (S.y - C.y) - R * R;
              const dsc = bx * bx - cc; return dsc < 0 ? 0 : -bx + Math.sqrt(dsc);
            };
            const base = Math.atan2(S.y - C.y, S.x - C.x);            // para fora = longe do centro do principal
            [-0.62, 0, 0.62, -1.15, 1.15].forEach(function (off, k) {
              const wa = base + off * (0.85 + 0.3 * ((ii + k) % 3) / 2), t = dist(wa);
              if (t < 24) return;
              ex.push({ ang: it.mu * (wa - phi0), comp: Math.max(18, (t - 8) / it.s * (0.62 + 0.20 * ((ii * 3 + k) % 4) / 3)), larg: 6.2, nivel: 2 });
            });
            if (ex.length) it.B = montarAnatomia((opc.semente + 7919 * (it.idx + 1)) >>> 0, axonStartFim(), false, ex);
          });
          return itens.map(function (it) {
            const B = it.B, s = it.s, mu = it.mu, dirAng = it.th;
            const S = somaDe(it);
            const phi = dirAng - Math.atan2(mu * it.vy, it.vx);
            const a = s * Math.cos(phi), b = s * Math.sin(phi), c = -s * mu * Math.sin(phi), d = s * mu * Math.cos(phi);
            const e = S.x - a * B.somaX - c * B.somaY, f = S.y - b * B.somaX - d * B.somaY;
            const leva = function (p) { return { x: a * p.x + c * p.y + e, y: b * p.x + d * p.y + f }; };
            const botoes = it.pontas.map(leva);
            const pontos = botoes.slice();
            B.dendriteTips.forEach(function (t) { if (!t.extra) pontos.push(leva({ x: t.tipX, y: t.tipY })); });
            B.somaOutline.forEach(function (p, j) { if (j % 6 === 0) pontos.push(leva(p)); });
            B.terminalBranches.forEach(function (br) { br.pts.forEach(function (p, j) { if (j % 4 === 0) pontos.push(leva(p)); }); });
            return {
              A: B, M: [a, b, c, d, e, f], s: s, rho: it.rho, z: it.z, ds: it.ds, dA: 0.86 + 0.14 * (it.z + 1) / 2,
              soma: S, contato: leva({ x: it.px, y: it.py }), alvo: it.alvo.e,
              eixo: B.axonPath.map(leva),
              ramos: B.terminalBoutons.map(function (bt) { return bt.branchPts.map(leva); }),
              botoes: botoes, pontos: pontos, flash: 0, excita: 0,
              rgb: corDoMini(it.idx), caixa: caixaDe(B, leva, S, B.somaRadius * 3.4 * s)
            };
          });
        }


// 1b. Os neurônios menores: o disparo no soma, o sinal no axônio e nos telodendros, o brilho nos terminais
        function pintarMinisVivo(T) {
          var glowFactor = T.glowFactor, r = T.r, g = T.g, b = T.b, lightR = T.lightR, lightG = T.lightG, lightB = T.lightB, deepR = T.deepR, deepG = T.deepG, deepB = T.deepB;
          var usaCor = function (c) { T.usaCor(c); r = T.r; g = T.g; b = T.b; lightR = T.lightR; lightG = T.lightG; lightB = T.lightB; deepR = T.deepR; deepG = T.deepG; deepB = T.deepB; };
          Est.minis.forEach(function (m) {
            const cm = (m.ativoT > 0 && m.ativo) || m.rgb;
            const mr = cm[0], mg = cm[1], mb = cm[2], ml = Math.min(255, mr + 95), mgl = Math.min(255, mg + 95), mbl = Math.min(255, mb + 95);
            if (m.excita > 0.02) {
              drawUnifiedSmoothPulse(m.soma.x, m.soma.y, 48 * m.s * (1.6 + m.excita * 0.6), ml, mgl, mbl, mr, mg, mb, glowFactor, 0.55 * m.excita * m.dA);
            }
            if (m.flash > 0.02) {
              m.botoes.forEach(function (p) {
                drawUnifiedSmoothPulse(p.x, p.y, 6.5 * m.ds, ml, mgl, mbl, mr, mg, mb, glowFactor, m.flash * 0.9 * m.dA);
              });
            }
          });
          miniAPs.forEach(function (ap) {
            const m = ap.m;
            if (ap.t < 0) return;
            const cm = ap.rgb || m.rgb;
            const mr = cm[0], mg = cm[1], mb = cm[2], ml = Math.min(255, mr + 95), mgl = Math.min(255, mg + 95), mbl = Math.min(255, mb + 95);
            if (ap.t <= 1.0) {
              const pts = m.eixo, head = ap.t * (pts.length - 1);
              for (let k = 10; k >= 0; k--) {
                const si = head - k * 1.1;
                if (si < 0) continue;
                const i0 = Math.floor(si), i1 = Math.min(pts.length - 1, i0 + 1), fr = si - i0;
                const ratio = 1 - k / 11;
                drawUnifiedSmoothPulse(pts[i0].x + (pts[i1].x - pts[i0].x) * fr, pts[i0].y + (pts[i1].y - pts[i0].y) * fr,
                  (2.8 + ratio * 3.7) * 0.6 * m.ds, ml, mgl, mbl, mr, mg, mb, glowFactor, ratio * 0.85 * m.dA);
              }
            } else {
              const subT = Math.min(1, (ap.t - 1.0) / 0.35);
              m.ramos.forEach(function (pts) {
                if (pts.length < 2) return;
                for (let k = 8; k >= 0; k--) {
                  const st = Math.max(0, subT - k * 0.032), si = st * (pts.length - 1);
                  const i0 = Math.floor(si), i1 = Math.min(pts.length - 1, i0 + 1), fr = si - i0;
                  const ratio = 1 - k / 9;
                  drawUnifiedSmoothPulse(pts[i0].x + (pts[i1].x - pts[i0].x) * fr, pts[i0].y + (pts[i1].y - pts[i0].y) * fr,
                    (2.5 + ratio * 3.6) * 0.5 * m.ds, ml, mgl, mbl, mr, mg, mb, glowFactor, ratio * 0.8 * m.dA);
                }
              });
            }
          });
        }

    return { montarMinis: montarMinis, pintarMinisVivo: pintarMinisVivo };
  }

  return { criar: criar };
}

);
// ---- fonte/neuronio/dendritos/parte.js
SF.parte({nome:'neuronio/dendritos',porta:1,compativelDesde:1,requer:['comum/ramos@1','comum/sorteio@1'],guarda:false,dom:false},
/* Sexta-Feira Engine v0.4.2: neuronio/dendritos. o desenho parado dos dendritos afilados e das espinhas sinápticas (seção 2 do desenho aprovado). Recebe a tinta T.
 * Código movido sem reescrever de neuronio/celula: o estado vem de Est (a tabela dos campos está no LEIA-ME.md da juntadora e deste) e as funções
 * das irmãs chegam em d, passadas pela juntadora. Só desenha/calcula o que está na lista da porta. */
function (usa) {
  'use strict';

  function criar(Est, d) {
    var ramos = usa.ramos; var trilhaSuave = ramos.trilhaSuave, bordasRamo = ramos.bordasRamo, desviar = ramos.desviar, mitocondrias = ramos.mitocondrias;
    var createSeededRandom = usa.sorteio.criar;
    var drawSharpDendritePolygon = d.drawSharpDendritePolygon;
    var incomingSignals = Est.incomingSignals;
    var drawUnifiedSmoothPulse = d.drawUnifiedSmoothPulse;

// 2. DENDRITOS AFILADOS E ESPINHAS SINÁPTICAS
        function pintarDendritos(octx, A, T) {
          var r = T.r, g = T.g, b = T.b, lightR = T.lightR, lightG = T.lightG, lightB = T.lightB, deepR = T.deepR, deepG = T.deepG, deepB = T.deepB, dendriteAlpha = T.dendriteAlpha, glowFactor = T.glowFactor, nv = T.nv, q = T.q, u = T.u, corOrg = T.corOrg;
          octx.save();
          A.dendriteBranches.forEach((branch) => {
            const levelMult = branch.level === 1 ? 1.0 : branch.level === 2 ? 0.85 : 0.72;
            const alpha = dendriteAlpha * levelMult;

            octx.fillStyle = `rgba(${r}, ${g}, ${b}, ${Math.min(1, alpha * (0.96 + 0.22 * q))})`;
            drawSharpDendritePolygon(octx, branch.pts);

            if (branch.pts.length > 3) {
              octx.strokeStyle = `rgba(${lightR}, ${lightG}, ${lightB}, ${Math.min(0.95, alpha * (0.70 + 0.42 * glowFactor) * (1 + 0.3 * q))})`;
              octx.lineWidth = Math.max(0.55, (branch.level === 1 ? 1.35 : branch.level === 2 ? 0.8 : 0.55) * A.scale);
              octx.beginPath();
              const endLimit = Math.floor(branch.pts.length * 0.97);
              if (nv >= 1) trilhaSuave(octx, branch.pts.slice(0, endLimit), true);
              else {
                octx.moveTo(branch.pts[0].x, branch.pts[0].y);
                for (let i = 1; i < endLimit; i++) {
                  octx.lineTo(branch.pts[i].x, branch.pts[i].y);
                }
              }
              octx.stroke();
            }
          });
          if (nv >= 1) {                                                      // de perto: as duas bordas da membrana de cada ramo, nítidas
            octx.lineJoin = 'round';
            A.dendriteBranches.forEach(function (branch) {
              if (branch.pts.length < 4) return;
              const bb = bordasRamo(branch.pts);
              octx.strokeStyle = `rgba(${lightR}, ${lightG}, ${lightB}, ${(branch.level === 1 ? 0.62 : 0.5) * (0.75 + 0.25 * q)})`;
              octx.lineWidth = (branch.level === 1 ? 0.95 : 0.75) * u;
              octx.beginPath(); trilhaSuave(octx, bb.L, true); octx.stroke();
              octx.beginPath(); trilhaSuave(octx, bb.R, true); octx.stroke();
            });
          }
          if (nv >= 2) {                                                      // mais perto: microtúbulos e mitocôndrias nos ramos grossos
            const rm = createSeededRandom(((A.semente || 1) + 4049) >>> 0);
            A.dendriteBranches.forEach(function (branch) {
              if (branch.level > 2 || branch.pts.length < 6) return;
              const n = Math.floor(branch.pts.length * (branch.level === 1 ? 0.8 : 0.6));
              octx.strokeStyle = `rgba(${lightR}, ${lightG}, ${lightB}, 0.30)`;
              octx.lineWidth = 0.55 * u;
              [-0.24, 0, 0.24].forEach(function (f) {
                if (branch.level === 2 && f === 0) return;
                octx.beginPath(); trilhaSuave(octx, desviar(branch.pts.slice(0, n), f), true); octx.stroke();
              });
              mitocondrias(octx, branch.pts, branch.level === 1 ? 0.75 : 0.5, rm, corOrg, u);
            });
          }

          octx.strokeStyle = `rgba(${lightR}, ${lightG}, ${lightB}, ${Math.min(0.95, dendriteAlpha * 0.95)})`;
          octx.lineWidth = Math.max(0.55, 0.85 * A.scale);
          octx.beginPath();
          A.synapticSpines.forEach((sp) => {
            octx.moveTo(sp.x1, sp.y1);
            octx.lineTo(sp.x2, sp.y2);
          });
          octx.stroke();

          octx.fillStyle = `rgba(255, 255, 255, ${dendriteAlpha * 0.78})`;
          A.synapticSpines.forEach((sp) => {
            if (sp.hasReceptor) {
              octx.beginPath();
              octx.arc(sp.x2, sp.y2, 0.95 * A.scale, 0, Math.PI * 2);
              octx.fill();
            }
          });
          if (nv >= 1) {                                                      // de perto: a cabeça de cada espinha (onde chega a sinapse)
            A.synapticSpines.forEach(function (sp) {
              const rr = 1.05 + (sp.hasReceptor ? 0.35 : 0);
              octx.fillStyle = `rgba(${lightR}, ${lightG}, ${lightB}, 0.88)`;
              octx.beginPath(); octx.arc(sp.x2, sp.y2, rr, 0, Math.PI * 2); octx.fill();
              octx.fillStyle = 'rgba(255, 255, 255, 0.78)';
              octx.beginPath(); octx.arc(sp.x2 - rr * 0.3, sp.y2 - rr * 0.3, rr * 0.38, 0, Math.PI * 2); octx.fill();
              if (nv >= 3) {                                                  // a densidade pós-sináptica: a borda escura da cabeça
                const ang = Math.atan2(sp.y2 - sp.y1, sp.x2 - sp.x1);
                octx.strokeStyle = `rgba(${deepR}, ${deepG}, ${deepB}, 0.9)`;
                octx.lineWidth = 0.6 * u;
                octx.beginPath(); octx.arc(sp.x2, sp.y2, rr * 0.9, ang - 0.9, ang + 0.9); octx.stroke();
              }
            });
          }
          octx.restore();
        }


// 3. Pulsos de entrada nos dendritos
        function pintarPulsosEntrada(T) {
          var r = T.r, g = T.g, b = T.b, lightR = T.lightR, lightG = T.lightG, lightB = T.lightB, glowFactor = T.glowFactor;
          incomingSignals.forEach((sig) => {
            const pts = sig.pts;
            if (!pts || pts.length < 2) return;
            const idxFloat = sig.progress * (pts.length - 1);
            const i0 = Math.max(0, Math.floor(idxFloat));
            const i1 = Math.min(pts.length - 1, i0 + 1);
            const frac = idxFloat - i0;
            const x = pts[i0].x + (pts[i1].x - pts[i0].x) * frac;
            const y = pts[i0].y + (pts[i1].y - pts[i0].y) * frac;

            if (sig.rgb) drawUnifiedSmoothPulse(x, y, 6.5 * Est.anatomy.scale, Math.min(255, sig.rgb[0] + 95), Math.min(255, sig.rgb[1] + 95), Math.min(255, sig.rgb[2] + 95), sig.rgb[0], sig.rgb[1], sig.rgb[2], glowFactor, 1);
            else drawUnifiedSmoothPulse(x, y, 6.5 * Est.anatomy.scale, lightR, lightG, lightB, r, g, b, glowFactor, 1);
          });
        }

    return { pintarDendritos: pintarDendritos, pintarPulsosEntrada: pintarPulsosEntrada };
  }

  return { criar: criar };
}

);
// ---- fonte/neuronio/corpo/parte.js
SF.parte({nome:'neuronio/corpo',porta:1,compativelDesde:1,requer:['comum/ramos@1','comum/sorteio@1'],guarda:false,dom:false},
/* Sexta-Feira Engine v0.4.2: neuronio/corpo. o desenho parado do corpo da célula: halo atmosférico, soma com parede 3D e núcleo texturizado (seções 1, 3 e 4 do desenho aprovado). Recebe a tinta T.
 * Código movido sem reescrever de neuronio/celula: o estado vem de Est (a tabela dos campos está no LEIA-ME.md da juntadora e deste) e as funções
 * das irmãs chegam em d, passadas pela juntadora. Só desenha/calcula o que está na lista da porta. */
function (usa) {
  'use strict';

  function criar(Est, d) {
    var trilhaSuave = usa.ramos.trilhaSuave;
    var createSeededRandom = usa.sorteio.criar;
    var ctx = Est.ctx, runtime = Est.runtime;

// 1. Halo atmosférico suave ao redor do Soma
        function pintarHalo(octx, A, T) {
          var r = T.r, g = T.g, b = T.b, bodyAlpha = T.bodyAlpha, glowFactor = T.glowFactor, q = T.q;
          if (glowFactor > 0.02 && !A.semCorpo) {
            const halo = octx.createRadialGradient(
              A.somaX, A.somaY, A.somaRadius * 0.35,
              A.somaX, A.somaY, A.somaRadius * 3.35
            );
            halo.addColorStop(0, `rgba(${r}, ${g}, ${b}, ${0.28 * glowFactor * bodyAlpha * (1 - 0.65 * q)})`);
            halo.addColorStop(0.55, `rgba(${r}, ${g}, ${b}, ${0.09 * glowFactor * bodyAlpha * (1 - 0.65 * q)})`);
            halo.addColorStop(1, `rgba(${r}, ${g}, ${b}, 0)`);
            octx.fillStyle = halo;
            octx.beginPath();
            octx.arc(A.somaX, A.somaY, A.somaRadius * 3.35, 0, Math.PI * 2);
            octx.fill();
          }
        }

// 3. SOMA COM PAREDE CELULAR 3D
        function pintarSoma(octx, A, T) {
          var r = T.r, g = T.g, b = T.b, lightR = T.lightR, lightG = T.lightG, lightB = T.lightB, deepR = T.deepR, deepG = T.deepG, deepB = T.deepB, bodyAlpha = T.bodyAlpha, nv = T.nv, u = T.u;
          octx.save();
          octx.beginPath();
          A.somaOutline.forEach((pt, idx) => {
            if (idx === 0) octx.moveTo(pt.x, pt.y);
            else octx.lineTo(pt.x, pt.y);
          });
          octx.closePath();

          const somaGrad = octx.createRadialGradient(
            A.somaX - A.somaRadius * 0.28,
            A.somaY - A.somaRadius * 0.28,
            A.somaRadius * 0.08,
            A.somaX,
            A.somaY,
            A.somaRadius * 1.5
          );
          somaGrad.addColorStop(0, `rgba(${lightR}, ${lightG}, ${lightB}, ${0.76 * bodyAlpha})`);
          somaGrad.addColorStop(0.50, `rgba(${r}, ${g}, ${b}, ${0.66 * bodyAlpha})`);
          somaGrad.addColorStop(0.85, `rgba(${deepR}, ${deepG}, ${deepB}, ${0.52 * bodyAlpha})`);
          somaGrad.addColorStop(1, `rgba(${lightR}, ${lightG}, ${lightB}, ${0.44 * bodyAlpha})`);

          octx.fillStyle = somaGrad;
          octx.fill();

          octx.save();
          octx.clip();

          A.cytoplasmRidges.forEach((ridge) => {
            octx.beginPath();
            octx.moveTo(ridge.x1, ridge.y1);
            octx.quadraticCurveTo(ridge.cx, ridge.cy, ridge.x2, ridge.y2);
            octx.lineWidth = ridge.width;
            octx.strokeStyle = ridge.isHighlight
              ? `rgba(${lightR}, ${lightG}, ${lightB}, ${0.38 * bodyAlpha})`
              : `rgba(${deepR}, ${deepG}, ${deepB}, ${0.56 * bodyAlpha})`;
            octx.stroke();
          });

          A.membraneGranules.forEach((gr) => {
            octx.fillStyle = `rgba(${deepR}, ${deepG}, ${deepB}, ${0.56 * bodyAlpha})`;
            octx.beginPath();
            octx.arc(gr.x + 0.85 * A.scale, gr.y + 0.95 * A.scale, gr.r, 0, Math.PI * 2);
            octx.fill();

            octx.fillStyle = `rgba(${lightR}, ${lightG}, ${lightB}, ${0.36 * bodyAlpha})`;
            octx.beginPath();
            octx.arc(gr.x - 0.65 * A.scale, gr.y - 0.65 * A.scale, gr.r * 0.72, 0, Math.PI * 2);
            octx.fill();
          });
          if (nv >= 2) {                                                      // de perto: corpúsculos de Nissl e o complexo de Golgi
            const rs = createSeededRandom(((A.semente || 1) + 7331) >>> 0), nucR0 = A.somaRadius * 0.34;
            for (let i = 0; i < 90; i++) {
              const ang = rs() * Math.PI * 2, dist = A.somaRadius * (0.46 + rs() * 0.42), rr = 0.45 + rs() * 0.75;
              octx.fillStyle = i % 3 === 0 ? `rgba(${lightR}, ${lightG}, ${lightB}, 0.55)` : `rgba(${deepR}, ${deepG}, ${deepB}, 0.70)`;
              octx.beginPath(); octx.arc(A.somaX + Math.cos(ang) * dist, A.somaY + Math.sin(ang) * dist, rr, 0, Math.PI * 2); octx.fill();
            }
            octx.strokeStyle = `rgba(${lightR}, ${lightG}, ${lightB}, 0.5)`;
            octx.lineWidth = 0.7 * u;
            for (let k = 0; k < 4; k++) {
              octx.beginPath(); octx.arc(A.somaX, A.somaY, nucR0 * (1.38 + k * 0.17), Math.PI * 0.72 + k * 0.05, Math.PI * 1.22 - k * 0.04); octx.stroke();
            }
          }
          octx.restore();

          if (nv >= 1) {                                                      // de perto: a membrana do corpo celular, nítida
            octx.beginPath(); trilhaSuave(octx, A.somaOutline.length ? A.somaOutline.concat([A.somaOutline[0]]) : [], true); octx.closePath();
            octx.strokeStyle = `rgba(${lightR}, ${lightG}, ${lightB}, 0.85)`;
            octx.lineWidth = 1.1 * u;
            octx.stroke();
          } else {
            octx.strokeStyle = `rgba(${lightR}, ${lightG}, ${lightB}, ${Math.min(0.95, bodyAlpha * 0.94)})`;
            octx.lineWidth = Math.max(1.1, 1.65 * A.scale);
            octx.stroke();
          }

          A.membraneSpicules.forEach((sp) => {
            octx.save();
            octx.translate(sp.x, sp.y);
            octx.rotate(sp.ang);
            octx.beginPath();
            octx.moveTo(-1, -sp.w * 0.5);
            octx.quadraticCurveTo(sp.h * 0.7, -sp.w * 0.3, sp.h, 0);
            octx.quadraticCurveTo(sp.h * 0.7, sp.w * 0.3, -1, sp.w * 0.5);
            octx.closePath();
            octx.fillStyle = `rgba(${lightR}, ${lightG}, ${lightB}, ${0.58 * bodyAlpha})`;
            octx.fill();
            octx.restore();
          });
          octx.restore();
        }

// 4. NÚCLEO ESFÉRICO TEXTURIZADO (Calibrado em brilhoNucleo = 21%)
        function pintarNucleo(octx, A, T) {
          var r = T.r, g = T.g, b = T.b, lightR = T.lightR, lightG = T.lightG, lightB = T.lightB, deepR = T.deepR, deepG = T.deepG, deepB = T.deepB, bodyAlpha = T.bodyAlpha, nucFactor = T.nucFactor, nv = T.nv, u = T.u;
          octx.save();
          const nucR = A.somaRadius * 0.34;
          if (nucFactor > 0.01 && !A.semCorpo) {
            const nucHalo = octx.createRadialGradient(
              A.somaX, A.somaY, nucR * 0.25,
              A.somaX, A.somaY, nucR * 2.5
            );
            nucHalo.addColorStop(0, `rgba(255, 255, 255, ${0.80 * nucFactor})`);
            nucHalo.addColorStop(0.45, `rgba(${lightR}, ${lightG}, ${lightB}, ${0.52 * nucFactor})`);
            nucHalo.addColorStop(1, `rgba(${r}, ${g}, ${b}, 0)`);
            octx.fillStyle = nucHalo;
            octx.beginPath();
            octx.arc(A.somaX, A.somaY, nucR * 2.5, 0, Math.PI * 2);
            octx.fill();
          }

          const coreGrad = octx.createRadialGradient(
            A.somaX - nucR * 0.22,
            A.somaY - nucR * 0.22,
            1,
            A.somaX,
            A.somaY,
            nucR
          );
          coreGrad.addColorStop(0, `rgba(248, 244, 255, ${0.44 + 0.56 * nucFactor})`);
          coreGrad.addColorStop(0.72, `rgba(${lightR}, ${lightG}, ${lightB}, ${0.46 + 0.48 * nucFactor})`);
          coreGrad.addColorStop(1, `rgba(${r}, ${g}, ${b}, ${0.65 * bodyAlpha})`);

          octx.fillStyle = coreGrad;
          octx.beginPath();
          octx.arc(A.somaX, A.somaY, nucR, 0, Math.PI * 2);
          octx.fill();

          octx.save();
          octx.clip();
          A.nucleusChromatin.forEach((ch) => {
            octx.fillStyle = ch.bright
              ? `rgba(255, 255, 255, ${0.18 + 0.26 * nucFactor})`
              : `rgba(${deepR}, ${deepG}, ${deepB}, 0.28)`;
            octx.beginPath();
            octx.arc(ch.x, ch.y, ch.r, 0, Math.PI * 2);
            octx.fill();
          });
          if (nv >= 2) {                                                      // de perto: a cromatina fina e o nucléolo
            const rn = createSeededRandom(((A.semente || 1) + 911) >>> 0);
            for (let i = 0; i < 70; i++) {
              const ang = rn() * Math.PI * 2, dist = Math.sqrt(rn()) * nucR * 0.9, rr = 0.3 + rn() * 0.45;
              octx.fillStyle = i % 2 ? `rgba(${deepR}, ${deepG}, ${deepB}, 0.35)` : 'rgba(255, 255, 255, 0.28)';
              octx.beginPath(); octx.arc(A.somaX + Math.cos(ang) * dist, A.somaY + Math.sin(ang) * dist, rr, 0, Math.PI * 2); octx.fill();
            }
            const nx = A.somaX + nucR * 0.22, ny = A.somaY - nucR * 0.18, nr = nucR * 0.30;
            const ng = octx.createRadialGradient(nx - nr * 0.3, ny - nr * 0.3, 0, nx, ny, nr);
            ng.addColorStop(0, 'rgba(255, 255, 255, 0.9)');
            ng.addColorStop(0.5, `rgba(${lightR}, ${lightG}, ${lightB}, 0.75)`);
            ng.addColorStop(1, `rgba(${deepR}, ${deepG}, ${deepB}, 0.8)`);
            octx.fillStyle = ng;
            octx.beginPath(); octx.arc(nx, ny, nr, 0, Math.PI * 2); octx.fill();
            octx.strokeStyle = `rgba(${deepR}, ${deepG}, ${deepB}, 0.8)`;
            octx.lineWidth = 0.6 * u;
            octx.stroke();
            if (nv >= 3) {
              for (let i = 0; i < 12; i++) {
                const ang = rn() * Math.PI * 2, dist = Math.sqrt(rn()) * nr * 0.75, rr = 0.25 + rn() * 0.3;
                octx.fillStyle = 'rgba(255, 255, 255, 0.8)';
                octx.beginPath(); octx.arc(nx + Math.cos(ang) * dist, ny + Math.sin(ang) * dist, rr, 0, Math.PI * 2); octx.fill();
              }
            }
          }
          octx.restore();

          if (nv >= 1) { octx.beginPath(); octx.arc(A.somaX, A.somaY, nucR, 0, Math.PI * 2); }   // de perto: o contorno do núcleo
          octx.strokeStyle = `rgba(255, 255, 255, ${0.30 + 0.45 * nucFactor})`;
          octx.lineWidth = nv >= 1 ? 0.9 * u : Math.max(0.85, 1.15 * A.scale);
          octx.stroke();
          if (nv >= 2) {                                                      // o envelope nuclear duplo e os poros
            octx.strokeStyle = 'rgba(255, 255, 255, 0.35)';
            octx.lineWidth = 0.6 * u;
            octx.beginPath(); octx.arc(A.somaX, A.somaY, nucR * 0.93, 0, Math.PI * 2); octx.stroke();
            for (let i = 0; i < 22; i++) {
              const ang = (i / 22) * Math.PI * 2 + 0.13, x = A.somaX + Math.cos(ang) * nucR * 0.965, y = A.somaY + Math.sin(ang) * nucR * 0.965;
              octx.fillStyle = `rgba(${deepR}, ${deepG}, ${deepB}, 0.95)`;
              octx.beginPath(); octx.arc(x, y, 0.55, 0, Math.PI * 2); octx.fill();
              octx.strokeStyle = 'rgba(255, 255, 255, 0.7)';
              octx.lineWidth = 0.3 * u;
              octx.stroke();
            }
          }
          octx.restore();
        }


// 2. Excitação dinâmica suave no Soma
        function pintarExcitacaoSoma(T) {
          var zcL = T.zcL, r = T.r, g = T.g, b = T.b, lightR = T.lightR, lightG = T.lightG, lightB = T.lightB, glowFactor = T.glowFactor;
          if (runtime.somaExcitation > 0.02) {
            const exRad = Est.anatomy.somaRadius * (1.25 + runtime.somaExcitation * 0.45);
            const exGrad = ctx.createRadialGradient(
              Est.anatomy.somaX, Est.anatomy.somaY, Est.anatomy.somaRadius * 0.2,
              Est.anatomy.somaX, Est.anatomy.somaY, exRad
            );
            const sc = runtime.somaRgb;
            exGrad.addColorStop(0, sc ? `rgba(${Math.min(255, sc[0] + 95)}, ${Math.min(255, sc[1] + 95)}, ${Math.min(255, sc[2] + 95)}, ${0.34 * runtime.somaExcitation * glowFactor * (1 - 0.5 * zcL)})` : `rgba(${lightR}, ${lightG}, ${lightB}, ${0.34 * runtime.somaExcitation * glowFactor * (1 - 0.5 * zcL)})`);
            exGrad.addColorStop(1, sc ? `rgba(${sc[0]}, ${sc[1]}, ${sc[2]}, 0)` : `rgba(${r}, ${g}, ${b}, 0)`);
            ctx.fillStyle = exGrad;
            ctx.beginPath();
            ctx.arc(Est.anatomy.somaX, Est.anatomy.somaY, exRad, 0, Math.PI * 2);
            ctx.fill();
          }
        }

    return { pintarHalo: pintarHalo, pintarSoma: pintarSoma, pintarNucleo: pintarNucleo, pintarExcitacaoSoma: pintarExcitacaoSoma };
  }

  return { criar: criar };
}

);
// ---- fonte/neuronio/axonio/parte.js
SF.parte({nome:'neuronio/axonio',porta:1,compativelDesde:1,requer:['comum/ramos@1','comum/sorteio@1'],guarda:false,dom:false},
/* Sexta-Feira Engine v0.4.2: neuronio/axonio. o desenho parado do axônio: tronco encorpado, bainhas de mielina estriadas e nódulos de Ranvier (seção 5 do desenho aprovado), um por axônio. Recebe a tinta T.
 * Código movido sem reescrever de neuronio/celula: o estado vem de Est (a tabela dos campos está no LEIA-ME.md da juntadora e deste) e as funções
 * das irmãs chegam em d, passadas pela juntadora. Só desenha/calcula o que está na lista da porta. */
function (usa) {
  'use strict';

  function criar(Est, d) {
    var ramos = usa.ramos; var trilhaSuave = ramos.trilhaSuave, bordasRamo = ramos.bordasRamo, desviar = ramos.desviar, mitocondrias = ramos.mitocondrias;
    var createSeededRandom = usa.sorteio.criar;
    var opc = Est.opc;
    var drawTaperedBranch = d.drawTaperedBranch;
    var actionPotentials = Est.actionPotentials;
    var fadeFora = d.fadeFora, drawUnifiedSmoothPulse = d.drawUnifiedSmoothPulse;

// 5. AXÔNIO ENCORPADO & 6 SEGMENTOS ESTRIADOS DE BAINHA DE MIELINA (um por axônio)
        function pintarAxonio(octx, A, E, T) {
          var r = T.r, g = T.g, b = T.b, lightR = T.lightR, lightG = T.lightG, lightB = T.lightB, deepR = T.deepR, deepG = T.deepG, deepB = T.deepB, bodyAlpha = T.bodyAlpha, dendriteAlpha = T.dendriteAlpha, nv = T.nv, u = T.u;
          octx.save();
          octx.fillStyle = `rgba(${r}, ${g}, ${b}, ${dendriteAlpha * 0.92})`;
          drawTaperedBranch(octx, E.axonPath);

          octx.strokeStyle = `rgba(${lightR}, ${lightG}, ${lightB}, ${Math.max(0.55, bodyAlpha * 0.95)})`;
          octx.lineWidth = Math.max(1.2, 1.6 * A.scale);
          octx.beginPath();
          E.axonPath.forEach((p, idx) => {
            if (idx === 0) octx.moveTo(p.x, p.y);
            else octx.lineTo(p.x, p.y);
          });
          octx.stroke();
          if (nv >= 2) {                                                      // de perto: os microtúbulos do axônio (aparecem entre as bainhas)
            octx.strokeStyle = `rgba(${lightR}, ${lightG}, ${lightB}, 0.32)`;
            octx.lineWidth = 0.5 * u;
            [-0.22, 0.22].forEach(function (f) { octx.beginPath(); trilhaSuave(octx, desviar(E.axonPath, f), true); octx.stroke(); });
          }

          E.myelinSheaths.forEach((seg, mIdx) => {
            octx.save();
            octx.translate(seg.pMid.x, seg.pMid.y);
            octx.rotate(seg.angle);

            const w = seg.length;
            const h = seg.thickness;
            const rad = h * 0.45;

            // bainha como um cilindro: borda clara, corpo escuro e uma faixa de luz no alto
            const mGrad = octx.createLinearGradient(0, -h / 2, 0, h / 2);
            mGrad.addColorStop(0, `rgba(${lightR}, ${lightG}, ${lightB}, ${0.78 * bodyAlpha})`);
            mGrad.addColorStop(0.22, `rgba(${r}, ${g}, ${b}, ${0.52 * bodyAlpha})`);
            mGrad.addColorStop(0.55, `rgba(${deepR}, ${deepG}, ${deepB}, ${0.50 * bodyAlpha})`);
            mGrad.addColorStop(0.85, `rgba(${r}, ${g}, ${b}, ${0.50 * bodyAlpha})`);
            mGrad.addColorStop(1, `rgba(${lightR}, ${lightG}, ${lightB}, ${0.72 * bodyAlpha})`);

            octx.beginPath();
            if (typeof octx.roundRect === 'function') {
              octx.roundRect(-w / 2, -h / 2, w, h, rad);
            } else {
              octx.rect(-w / 2, -h / 2, w, h);
            }
            octx.fillStyle = mGrad;
            octx.fill();

            octx.save();
            octx.clip();
            // as lamelas de mielina: camadas finas ao longo do comprimento
            const nl = nv >= 3 ? 4 : 2;                                       // de muito perto: mais lamelas, mais finas
            octx.lineWidth = nv >= 1 ? (nv >= 3 ? 0.5 : 0.7) * u : Math.max(0.6, 0.8 * A.scale);
            for (let li = -nl; li <= nl; li++) {
              octx.strokeStyle = `rgba(${lightR}, ${lightG}, ${lightB}, ${li === 0 ? 0.20 * bodyAlpha : 0.34 * bodyAlpha})`;
              octx.beginPath();
              octx.moveTo(-w * 0.47, li * h * 0.34 / nl + (mIdx % 2) * 0.8);
              octx.quadraticCurveTo(0, li * h * 0.42 / nl, w * 0.47, li * h * 0.34 / nl - (mIdx % 2) * 0.8);
              octx.stroke();
            }
            // brilho especular no alto da bainha
            const sp = octx.createLinearGradient(-w / 2, 0, w / 2, 0);
            sp.addColorStop(0, 'rgba(255, 255, 255, 0)');
            sp.addColorStop(0.18, `rgba(255, 255, 255, ${0.34 * bodyAlpha})`);
            sp.addColorStop(0.82, `rgba(255, 255, 255, ${0.34 * bodyAlpha})`);
            sp.addColorStop(1, 'rgba(255, 255, 255, 0)');
            octx.fillStyle = sp;
            octx.fillRect(-w / 2, -h * 0.40, w, h * 0.12);
            octx.restore();

            // contorno nítido e os anéis das extremidades (paranós)
            octx.strokeStyle = `rgba(${lightR}, ${lightG}, ${lightB}, ${0.95 * bodyAlpha})`;
            octx.lineWidth = Math.max(1.0, 1.4 * A.scale);
            octx.beginPath();
            if (typeof octx.roundRect === 'function') {
              octx.roundRect(-w / 2, -h / 2, w, h, rad);
            } else {
              octx.rect(-w / 2, -h / 2, w, h);
            }
            octx.stroke();
            octx.strokeStyle = `rgba(255, 255, 255, ${0.55 * bodyAlpha})`;
            octx.lineWidth = Math.max(0.8, 1.0 * A.scale);
            [-1, 1].forEach(function (sd) {
              octx.beginPath();
              octx.ellipse(sd * (w / 2 - h * 0.16), 0, h * 0.10, h * 0.40, 0, 0, Math.PI * 2);
              octx.stroke();
            });
            octx.restore();
          });
          if (nv >= 2 && opc.modo !== 'ligacoes') {                                                      // nos nódulos de Ranvier: os canais de sódio
            octx.fillStyle = 'rgba(255, 255, 255, 0.85)';
            E.ranvierNodes.forEach(function (nd) {
              for (let k = -2; k <= 2; k++) { octx.beginPath(); octx.arc(nd.x, nd.y + k * 1.5, 0.45, 0, Math.PI * 2); octx.fill(); }
            });
          }
          octx.restore();
        }


// 4. Nódulos de Ranvier
        function pintarNodulos(T) {
          var r = T.r, g = T.g, b = T.b, lightR = T.lightR, lightG = T.lightG, lightB = T.lightB, glowFactor = T.glowFactor, deepR = T.deepR, deepG = T.deepG, deepB = T.deepB;
          var usaCor = function (c) { T.usaCor(c); r = T.r; g = T.g; b = T.b; lightR = T.lightR; lightG = T.lightG; lightB = T.lightB; deepR = T.deepR; deepG = T.deepG; deepB = T.deepB; };
          Est.anatomy.nosTodos.forEach((node) => {
            usaCor(node.rgb);
            if (node.flash > 0.02) {
              const nRad = 7.2 * Est.anatomy.scale * (0.7 + node.flash * 0.45);
              const foraN = fadeFora(node.x, node.y);
              if (foraN > 0.01) drawUnifiedSmoothPulse(node.x, node.y, nRad, lightR, lightG, lightB, r, g, b, glowFactor, node.flash * 0.85 * foraN);
            }
          });
        }

// 5. Potenciais de ação percorrendo o axônio e entrando nos telodendros até os bulbos
        function pintarPotenciais(T) {
          var r = T.r, g = T.g, b = T.b, lightR = T.lightR, lightG = T.lightG, lightB = T.lightB, glowFactor = T.glowFactor, deepR = T.deepR, deepG = T.deepG, deepB = T.deepB;
          var usaCor = function (c) { T.usaCor(c); r = T.r; g = T.g; b = T.b; lightR = T.lightR; lightG = T.lightG; lightB = T.lightB; deepR = T.deepR; deepG = T.deepG; deepB = T.deepB; };
          actionPotentials.forEach((ap) => {
            usaCor(ap.rgb || ap.eixo.rgb);
            const eixoPts = ap.eixo.axonPath;
            if (ap.t <= 1.0 && eixoPts.length > 1) {
              const headPos = Math.max(0, ap.t) * (eixoPts.length - 1);
              const trailSteps = 10;

              for (let s = trailSteps; s >= 0; s--) {
                const sampleIdx = headPos - s * 1.1;
                if (sampleIdx < 0) continue;
                const i0 = Math.floor(sampleIdx);
                const i1 = Math.min(eixoPts.length - 1, i0 + 1);
                const frac = sampleIdx - i0;
                const x = eixoPts[i0].x + (eixoPts[i1].x - eixoPts[i0].x) * frac;
                const y = eixoPts[i0].y + (eixoPts[i1].y - eixoPts[i0].y) * frac;

                const ratio = 1 - s / (trailSteps + 1);
                const rad = (2.8 + ratio * 3.7) * Est.anatomy.scale;
                const fora = fadeFora(x, y);
                if (fora > 0.01) drawUnifiedSmoothPulse(x, y, rad, lightR, lightG, lightB, r, g, b, glowFactor, ratio * 0.85 * fora);
              }
            } else {
              const subT = Math.min(1, (ap.t - 1.0) / 0.35);
              const trailSteps = 8;
              ap.boutons.forEach((bouton) => {
                const pts = bouton.branchPts;
                if (!pts || pts.length < 2) return;
                for (let s = trailSteps; s >= 0; s--) {
                  const st = Math.max(0, subT - s * 0.032);
                  const idxFloat = st * (pts.length - 1);
                  const i0 = Math.floor(idxFloat);
                  const i1 = Math.min(pts.length - 1, i0 + 1);
                  const frac = idxFloat - i0;
                  const x = pts[i0].x + (pts[i1].x - pts[i0].x) * frac;
                  const y = pts[i0].y + (pts[i1].y - pts[i0].y) * frac;

                  const ratio = 1 - s / (trailSteps + 1);
                  const tRad = (2.5 + ratio * 3.6) * Est.anatomy.scale;
                  drawUnifiedSmoothPulse(x, y, tRad, lightR, lightG, lightB, r, g, b, glowFactor, ratio * 0.88);
                }
              });
            }
          });
        }

    return { pintarAxonio: pintarAxonio, pintarNodulos: pintarNodulos, pintarPotenciais: pintarPotenciais };
  }

  return { criar: criar };
}

);
// ---- fonte/neuronio/anatomia/parte.js
SF.parte({nome:'neuronio/anatomia',porta:1,compativelDesde:1,requer:['comum/sorteio@1','comum/cores@1'],guarda:false,dom:false},
/* Sexta-Feira Engine v0.4.2: neuronio/anatomia. a geometria do neurônio: onde fica cada ramo, o axônio, as bainhas, os terminais, as árvores das ligações e a vista (escala e centro) da esfera. Não desenha.
 * Código movido sem reescrever de neuronio/celula: o estado vem de Est (a tabela dos campos está no LEIA-ME.md da juntadora e deste) e as funções
 * das irmãs chegam em d, passadas pela juntadora. Só desenha/calcula o que está na lista da porta. */
function (usa) {
  'use strict';

  function criar(Est, d) {
    var createSeededRandom = usa.sorteio.criar, hexToRgb = usa.cores.hexParaRgb;
    var DH = Est.DH, DW = Est.DW, EIXO_BASE = Est.EIXO_BASE, MINI_EIXO = Est.MINI_EIXO, PAREDE = Est.PAREDE, config = Est.config, opc = Est.opc, runtime = Est.runtime, vista = Est.vista;
// As ligações entre as esferas: cada uma é um axônio (caminho já no espaço do palco, em px) com bainhas, nódulos e uma
        // pequena árvore de terminais que termina tocando um dendrito. Mão única: o sinal só corre do começo para o fim do caminho.
        const arvoresCache = new Map();

// comprimento do axônio do menor em relação ao do principal
        function axonStartFim() { return DW * 0.25 + 48 * 1.44 + EIXO_BASE * MINI_EIXO; }

// Monta a anatomia completa de um neurônio (o desenho aprovado) a partir de uma semente; não desenha nada
        function montarAnatomia(semente, fimAxonio, principal, extrasMini) {
          const rng = createSeededRandom(semente);
          const somaX = DW * 0.25;
          const somaY = DH * 0.52;
          const scale = 1;

          const somaRadius = 48 * scale;

          // 1. SOMA MULTIPOLAR COM PAREDE CELULAR 3D (Padrão bloqueado)
          const primaryAngles = [-2.74, -2.16, -1.58, -0.98, -0.50, 0.50, 0.98, 1.58, 2.16];
          const somaOutline = [];
          const outlineSteps = 144;

          for (let i = 0; i < outlineSteps; i++) {
            const ang = (Math.PI * 2 * i) / outlineSteps;
            let pull = 0;

            for (let t = 0; t < primaryAngles.length; t++) {
              const diff = Math.atan2(Math.sin(ang - primaryAngles[t]), Math.cos(ang - primaryAngles[t]));
              pull += Math.exp(-(diff * diff) / 0.044) * 0.45;
            }

            const hillockDiff = Math.atan2(Math.sin(ang), Math.cos(ang));
            pull += Math.exp(-(hillockDiff * hillockDiff) / 0.065) * 0.74;

            const ruffle = Math.sin(ang * 15) * 0.02 + Math.cos(ang * 26 + 0.7) * 0.014 + (rng() - 0.5) * 0.016;
            const r = somaRadius * (0.86 + pull + ruffle);

            somaOutline.push({
              x: somaX + Math.cos(ang) * r,
              y: somaY + Math.sin(ang) * r,
              ang,
              r
            });
          }

          const membraneSpicules = [];
          for (let i = 0; i < somaOutline.length; i += 3) {
            if (rng() < 0.56) {
              const pt = somaOutline[i];
              membraneSpicules.push({
                x: pt.x,
                y: pt.y,
                ang: pt.ang + (rng() - 0.5) * 0.20,
                h: (2.3 + rng() * 3.3) * scale,
                w: (2.1 + rng() * 1.9) * scale
              });
            }
          }

          const cytoplasmRidges = [];
          for (let i = 0; i < 42; i++) {
            const ang = (Math.PI * 2 * i) / 42 + (rng() - 0.5) * 0.14;
            const rIn = somaRadius * (0.36 + rng() * 0.20);
            const rOut = somaRadius * (0.78 + rng() * 0.35);
            const ctrlAng = ang + (rng() - 0.5) * 0.28;
            const rMid = (rIn + rOut) * 0.52;
            cytoplasmRidges.push({
              x1: somaX + Math.cos(ang) * rIn,
              y1: somaY + Math.sin(ang) * rIn,
              cx: somaX + Math.cos(ctrlAng) * rMid,
              cy: somaY + Math.sin(ctrlAng) * rMid,
              x2: somaX + Math.cos(ang + (rng() - 0.5) * 0.14) * rOut,
              y2: somaY + Math.sin(ang + (rng() - 0.5) * 0.14) * rOut,
              isHighlight: rng() > 0.42,
              width: (0.85 + rng() * 1.6) * scale
            });
          }

          const membraneGranules = [];
          for (let i = 0; i < 50; i++) {
            const ang = (Math.PI * 2 * i) / 50 + rng() * 0.35;
            const dist = somaRadius * (0.34 + rng() * 0.65);
            membraneGranules.push({
              x: somaX + Math.cos(ang) * dist,
              y: somaY + Math.sin(ang) * dist,
              r: (1.5 + rng() * 2.6) * scale
            });
          }

          const nucleusChromatin = [];
          const nucR = somaRadius * 0.34;
          for (let n = 0; n < 24; n++) {
            const na = rng() * Math.PI * 2;
            const nd = rng() * nucR * 0.78;
            nucleusChromatin.push({
              x: somaX + Math.cos(na) * nd,
              y: somaY + Math.sin(na) * nd,
              r: (1.0 + rng() * 1.8) * scale,
              bright: n % 2 === 0
            });
          }

          // 2. DENDRITOS AFILADOS COM PONTAS AGUDAS (Padrão bloqueado)
          const branchFactor = Math.max(0.15, config.ramificacaoDendritos / 100);
          const dendriteBranches = [];
          const dendriteTips = [];
          const synapticSpines = [];

          function growDendrite(startX, startY, angle, length, startWidth, level, maxLevel, pai, idxPai, reto) {
            const segCount = Math.max(12, Math.round(length / (4.3 * scale)));
            const pts = [{ x: startX, y: startY, w: startWidth }];
            const entrada = { pts, tipX: startX, tipY: startY, level, pai: pai || null, idxPai: idxPai || 0 };

            let curX = startX;
            let curY = startY;
            let curAng = angle;
            const stepLen = length / segCount;
            const curlFreq = 0.24 + rng() * 0.26;
            const curlAmp = (0.075 + rng() * 0.065) * (rng() > 0.5 ? 1 : -1);

            for (let s = 1; s <= segCount; s++) {
              const progress = s / segCount;
              curAng += (Math.sin(s * curlFreq + level) * curlAmp + (rng() - 0.5) * 0.055) * (reto || 1);
              curX += Math.cos(curAng) * stepLen;
              curY += Math.sin(curAng) * stepLen;

              const w = startWidth * Math.pow(1 - progress, 1.38);
              pts.push({ x: curX, y: curY, w: Math.max(0.02, w) });

              if (s > 2 && s < segCount - 1 && rng() < 0.44 * branchFactor) {
                const side = rng() > 0.5 ? 1 : -1;
                const spineAng = curAng + side * (1.06 + rng() * 0.42);
                const spineLen = (3.3 + rng() * 4.4) * scale;
                synapticSpines.push({
                  x1: curX,
                  y1: curY,
                  x2: curX + Math.cos(spineAng) * spineLen,
                  y2: curY + Math.sin(spineAng) * spineLen,
                  hasReceptor: rng() < 0.45
                });
              }

              if (level < maxLevel && s >= Math.floor(segCount * 0.28) && s <= Math.floor(segCount * 0.84)) {
                const splitChance = level === 1 ? 0.29 : 0.19;
                if (rng() < splitChance * branchFactor) {
                  const forkSide = s % 2 === 0 ? 1 : -1;
                  const forkAng = curAng + forkSide * (0.40 + rng() * 0.28);
                  const childLen = length * (1 - progress * 0.38) * (0.65 + rng() * 0.16);
                  const childW = Math.max(0.8 * scale, w * 0.78);
                  growDendrite(curX, curY, forkAng, childLen, childW, level + 1, maxLevel, entrada, s);
                }
              }
            }

            dendriteBranches.push({ pts, level });
            entrada.tipX = curX; entrada.tipY = curY;
            dendriteTips.push(entrada);
          }

          const maxDepth = branchFactor > 0.65 ? 3 : branchFactor > 0.3 ? 2 : 1;
          primaryAngles.forEach((ang) => {
            const sx = somaX + Math.cos(ang) * (somaRadius * 1.02);
            const sy = somaY + Math.sin(ang) * (somaRadius * 1.02);
            const trunkLen = (148 + rng() * 50) * scale * (0.65 + branchFactor * 0.45);
            const trunkWidth = (7.4 + rng() * 1.8) * scale;
            growDendrite(sx, sy, ang, trunkLen, trunkWidth, 1, maxDepth);
          });

          // dendritos de contato (opcionais, só no principal): um ramo fino e curto, sorteado depois dos primários (os primários não mudam),
          // para onde uma ligação precisa tocar um dendrito e a folga entre os primários não tem nenhum
          if ((principal && opc.dendritosExtra) || extrasMini) {
            (principal ? opc.dendritosExtra : extrasMini).forEach(function (x) {
              const n0 = dendriteTips.length, b0 = dendriteBranches.length;
              growDendrite(somaX + Math.cos(x.ang) * somaRadius * 1.02, somaY + Math.sin(x.ang) * somaRadius * 1.02, x.ang, x.comp * scale, x.larg * scale, 1, x.nivel || 1, null, 0, 0.18);
              for (let q = n0; q < dendriteTips.length; q++) dendriteTips[q].extra = true;
              for (let q = b0; q < dendriteBranches.length; q++) dendriteBranches[q].extra = true;
            });
          }

          // 3. AXÔNIO SALTATÓRIO COM BAINHA DE MIELINA & NÓDULOS DE RANVIER
          const eixo = montarAxonio(somaX, somaY, somaRadius, scale, fimAxonio || DW * 0.62);
          const axonPath = eixo.axonPath;
          const myelinSheaths = eixo.myelinSheaths;
          const ranvierNodes = eixo.ranvierNodes;

          // 4. TELODENDROS ENCORPADOS & BULBOS PRÉ-SINÁPTICOS EM SINO CONTÍNUO (Peça aprovada)
          const terminalRoot = axonPath[axonPath.length - 1];
          const terminalBranches = [];
          const terminalBoutons = [];
          const terminalRng = createSeededRandom((semente + 55219 - 94127) >>> 0);
          const primaryTermAngles = [-0.94, -0.65, -0.37, -0.11, 0.14, 0.40, 0.68, 0.95];

          function growTelodendria(startX, startY, angle, length, startW, depth) {
            const steps = Math.max(12, Math.round(length / (5.8 * scale)));
            const pts = [{ x: startX, y: startY, w: startW }];

            let cx = startX;
            let cy = startY;
            let curAng = angle;
            const stepLen = length / steps;
            const waveFreq = 0.26 + terminalRng() * 0.22;
            const waveAmp = (0.055 + terminalRng() * 0.045) * (terminalRng() > 0.5 ? 1 : -1);

            for (let s = 1; s <= steps; s++) {
              const p = s / steps;
              curAng += Math.sin(s * waveFreq + depth) * waveAmp + (terminalRng() - 0.5) * 0.03;
              cx += Math.cos(curAng) * stepLen;
              cy += Math.sin(curAng) * stepLen;

              const w = startW * (1 - p * 0.26);
              pts.push({ x: cx, y: cy, w: Math.max(3.6 * scale, w) });

              if (config.enableSubBranches && depth === 1 && s === Math.floor(steps * 0.54)) {
                const side = terminalRng() > 0.5 ? 1 : -1;
                const subAng = curAng + side * (0.34 + terminalRng() * 0.16);
                const subLen = length * 0.56;
                growTelodendria(cx, cy, subAng, subLen, w * 0.86, 2);
              }
            }

            terminalBranches.push({ pts, depth });

            const prevPt = pts[Math.max(0, pts.length - 3)];
            const tipAngle = Math.atan2(cy - prevPt.y, cx - prevPt.x);
            const neckW = Math.max(3.6 * scale, startW * 0.74);
            const bWidth = (depth === 1 ? 21.0 : 16.5) * scale;
            const bThick = (depth === 1 ? 15.2 : 12.0) * scale;

            const vesicles = [];
            const vCount = depth === 1 ? 6 : 4;
            for (let v = 0; v < vCount; v++) {
              const isDocked = v < 3;
              const slotY = (-0.28 + (v / Math.max(1, vCount - 1)) * 0.56) * bWidth;
              const homeX = isDocked ? bThick * 0.34 : (-0.15 + terminalRng() * 0.34) * bThick;
              vesicles.push({
                localX: homeX,
                localY: slotY,
                homeX,
                homeY: slotY,
                vx: (terminalRng() - 0.5) * 1.4,
                vy: (terminalRng() - 0.5) * 1.4,
                radius: (2.1 + terminalRng() * 0.55) * scale,
                phase: terminalRng() * Math.PI * 2,
                docked: isDocked,
                fusionProgress: 0,
                pocketIndex: v % 3
              });
            }

            terminalBoutons.push({
              branchPts: pts,
              x: cx,
              y: cy,
              tipAngle,
              neckW,
              bWidth,
              bThick,
              depth,
              vesicles,
              flash: 0,
              pocketExcite: [0, 0, 0],
              grooves: Array.from({ length: 6 }, (_, gi) => ({
                yNorm: -0.35 + (gi / 5) * 0.70,
                curve: (terminalRng() - 0.5) * 0.20
              }))
            });
          }

          primaryTermAngles.forEach((ang, idx) => {
            const len = (116 + (idx % 3) * 18) * scale;
            growTelodendria(terminalRoot.x, terminalRoot.y, ang, len, 7.2 * scale, 1);
          });

          return {
            somaX,
            somaY,
            somaRadius,
            scale,
            somaOutline,
            membraneSpicules,
            cytoplasmRidges,
            membraneGranules,
            nucleusChromatin,
            dendriteBranches,
            dendriteTips,
            synapticSpines,
            axonPath,
            myelinSheaths,
            ranvierNodes,
            terminalBranches,
            terminalBoutons,
            axonEscala: eixo.axonEscala,
            semente: semente,
            offscreenCanvas: null
          };
        }

// Axônio com bainha de mielina e nódulos de Ranvier. No comprimento original o resultado é idêntico ao desenho aprovado;
        // mais longo (o tronco que sai da esfera), a onda, a espessura e o tamanho das bainhas ficam iguais e só aumentam em número.
        function montarAxonio(somaX, somaY, somaRadius, scale, axonEndX) {
          const axonStartX = somaX + somaRadius * 1.44;
          const axonStartY = somaY;
          const axonLen = Math.max(120, axonEndX - axonStartX);
          const rel = axonLen / EIXO_BASE;
          const axonSteps = Math.max(24, Math.round(72 * rel));

          const axonPath = [];
          for (let i = 0; i <= axonSteps; i++) {
            const t = i / axonSteps;
            const x = axonStartX + t * axonLen;
            const tb = t * rel;
            const y = axonStartY + Math.sin(tb * Math.PI * 1.65) * (15 * scale);
            const w = (7.8 - Math.min(1, tb) * 0.8) * scale;
            axonPath.push({ x, y, t, w });
          }

          const myelinSheaths = [];
          const ranvierNodes = [];
          const numSheaths = Math.max(3, Math.round(6 * (rel - 0.1) / 0.9));
          const gapRatio = 0.028 / rel;
          const usableSpan = 1 - 0.10 / rel;
          const startOffset = 0.04 / rel;
          const segSpan = (usableSpan - gapRatio * (numSheaths - 1)) / numSheaths;

          for (let m = 0; m < numSheaths; m++) {
            const t0 = startOffset + m * (segSpan + gapRatio);
            const t1 = t0 + segSpan;
            const idx0 = Math.floor(t0 * axonSteps);
            const idx1 = Math.min(axonSteps, Math.ceil(t1 * axonSteps));
            const pStart = axonPath[idx0];
            const pEnd = axonPath[idx1];
            const pMid = axonPath[Math.floor((idx0 + idx1) / 2)];

            myelinSheaths.push({
              pStart,
              pMid,
              pEnd,
              angle: Math.atan2(pEnd.y - pStart.y, pEnd.x - pStart.x),
              length: Math.hypot(pEnd.x - pStart.x, pEnd.y - pStart.y),
              thickness: (15.0 + (m % 2) * 1.4) * scale
            });

            if (m < numSheaths - 1) {
              const tGap = t1 + gapRatio * 0.5;
              const gapIdx = Math.min(axonSteps, Math.round(tGap * axonSteps));
              ranvierNodes.push({
                x: axonPath[gapIdx].x,
                y: axonPath[gapIdx].y,
                t: tGap,
                flash: 0
              });
            }
          }
          return { axonPath, myelinSheaths, ranvierNodes, axonEscala: 1 / rel };
        }

function arvoreDe(semente) {
          if (!arvoresCache.has(semente)) {
            const B = montarAnatomia(semente), pts = pontasTerminais(B), raiz = B.axonPath[B.axonPath.length - 1];
            let cx = 0, cy = 0;
            pts.forEach(function (p) { cx += p.x; cy += p.y; });
            cx /= pts.length; cy /= pts.length;
            let fx = -Infinity; pts.forEach(function (p) { fx = Math.max(fx, p.x - cx); });
            arvoresCache.set(semente, { B: B, cx: cx, cy: cy, rx: raiz.x - cx, ry: raiz.y - cy, fx: fx });
          }
          return arvoresCache.get(semente);
        }

function anatomiaLigacoes() {
          const A = { somaX: 0, somaY: 0, somaRadius: 0, scale: opc.escLig || 1, somaOutline: [], membraneSpicules: [], cytoplasmRidges: [], membraneGranules: [], nucleusChromatin: [],
            dendriteBranches: [], dendriteTips: [], synapticSpines: [], axonPath: [], myelinSheaths: [], ranvierNodes: [], terminalBranches: [], terminalBoutons: [],
            offscreenCanvas: null, semCorpo: true, semente: opc.semente, axonEscala: 1 };
          A.extras = opc.ligacoes.map(montarLigacao).filter(Boolean);
          return A;
        }

function montarLigacao(L, i) {
          const P = L && L.caminho, T = L && L.arvore;
          if (!P || P.length < 8) return null;
          const esc = L.esc || 1, n = P.length, rgb = /^#[0-9a-fA-F]{6}$/.test(L.cor) ? hexToRgb(L.cor) : config.rgb;
          // a árvore: o desenho dos terminais de uma semente, em escala f, girado para a direção de chegada, com o centro das pontas em (x, y)
          // (sem árvore, T = null: o axônio termina no caminho e quem desenha o terminal é a cena, uma ventosa)
          const arv = T ? arvoreDe(T.semente >>> 0) : null, f = T ? T.f : 1, fl = f * (T ? (T.lat || 1) : 1), ca = T ? Math.cos(T.ang) : 1, sa = T ? Math.sin(T.ang) : 0;
          const tr = function (p) { const dx = f * (p.x - arv.cx), dy = fl * (p.y - arv.cy); return { x: T.x + ca * dx - sa * dy, y: T.y + sa * dx + ca * dy }; };
          const B = T ? montarAnatomia(T.semente >>> 0) : { terminalBranches: [], terminalBoutons: [], axonPath: [] }, feitos = new Set();
          B.terminalBranches.forEach(function (br) {
            if (feitos.has(br.pts)) return;
            feitos.add(br.pts);
            br.pts.forEach(function (p) { const q = tr(p); p.x = q.x; p.y = q.y; p.w *= f; });
          });
          B.terminalBoutons.forEach(function (bt) {
            if (!feitos.has(bt.branchPts)) { feitos.add(bt.branchPts); bt.branchPts.forEach(function (p) { const q = tr(p); p.x = q.x; p.y = q.y; p.w *= f; }); }
            const q = tr({ x: bt.x, y: bt.y });
            bt.x = q.x; bt.y = q.y; bt.neckW *= f; bt.bWidth *= f; bt.bThick *= f; bt.rgb = rgb;
            bt.vesicles.forEach(function (v) { v.localX *= f; v.localY *= f; v.homeX *= f; v.homeY *= f; v.vx *= f; v.vy *= f; v.radius *= f; });
            const pb = bt.branchPts, pv = pb[Math.max(0, pb.length - 3)], pl = pb[pb.length - 1];
            bt.tipAngle = Math.atan2(pl.y - pv.y, pl.x - pv.x);
          });
          const raizNova = T ? tr(B.axonPath[B.axonPath.length - 1]) : null;
          let len = 0;
          const axonPath = P.map(function (p, j) {
            if (j) len += Math.hypot(p.x - P[j - 1].x, p.y - P[j - 1].y);
            return { x: p.x, y: p.y, t: j / (n - 1), w: 0, s: len };
          });
          if (raizNova) { axonPath[n - 1].x = raizNova.x; axonPath[n - 1].y = raizNova.y; }      // o axônio termina exatamente na raiz da árvore
          axonPath.forEach(function (p) { p.w = (7.8 - Math.min(1, p.s / (EIXO_BASE * esc)) * 0.8) * esc; });
          const rel = len / (EIXO_BASE * esc);
          const bn = bainhasNos(axonPath, rel, n - 1, esc, (i % 3) - 1, (L.livre || 0) / esc);
          bn.ranvierNodes.forEach(function (nd) { nd.rgb = rgb; });
          return { id: L.id, axonPath: axonPath, myelinSheaths: bn.myelinSheaths, ranvierNodes: bn.ranvierNodes, axonEscala: 1 / rel,
            terminalBranches: B.terminalBranches, terminalBoutons: B.terminalBoutons, scale: esc, indice: i, rgb: rgb };
        }

// Onde fica a raiz da árvore para um centro de pontas (x, y), direção de chegada ang e escala f (a cena precisa saber antes de traçar o caminho)
        function raizDaArvore(semente, x, y, ang, f, lat) {
          const a = arvoreDe(semente >>> 0), ca = Math.cos(ang), sa = Math.sin(ang), dx = f * a.rx, dy = f * (lat || 1) * a.ry;
          return { x: x + ca * dx - sa * dy, y: y + sa * dx + ca * dy, fwd: f * a.fx };
        }

// A caixa (no espaço do desenho) que um menor ocupa: ramos, axônio, terminais, espinhas e o halo do soma
        function caixaDe(B, leva, S, hr) {
          let x0 = S.x - hr, y0 = S.y - hr, x1 = S.x + hr, y1 = S.y + hr;
          const poe = function (p) { const q = leva(p); if (q.x < x0) x0 = q.x; if (q.y < y0) y0 = q.y; if (q.x > x1) x1 = q.x; if (q.y > y1) y1 = q.y; };
          B.dendriteBranches.forEach(function (br) { br.pts.forEach(poe); });
          B.terminalBranches.forEach(function (br) { br.pts.forEach(poe); });
          B.axonPath.forEach(poe); B.somaOutline.forEach(poe);
          B.synapticSpines.forEach(function (sp) { poe({ x: sp.x2, y: sp.y2 }); });
          B.terminalBoutons.forEach(function (bt) { poe({ x: bt.x, y: bt.y }); });
          return { x0: x0, y0: y0, x1: x1, y1: y1 };
        }

// Só o tronco do axônio do principal atravessa a parede: ele segue até a borda do canvas, rumo às outras esferas.
        // Os terminais dele ficam nas outras esferas e por isso não são desenhados aqui.
        function estenderTronco() {
          const borda = (runtime.width - vista.tx) / vista.k - 6;
          const ramos = Est.anatomy.terminalBranches, boutons = Est.anatomy.terminalBoutons;
          const velho = Est.anatomy.axonPath[Est.anatomy.axonPath.length - 1];
          // o quanto os terminais do Núcleo se espalham para a direita (com os bulbos), para que caibam no canvas
          let ext = 0;
          ramos.forEach(function (br) { br.pts.forEach(function (q) { ext = Math.max(ext, q.x - velho.x); }); });
          boutons.forEach(function (bt) { ext = Math.max(ext, bt.x - velho.x + (bt.bWidth || 0)); });
          const eixo = montarAxonio(Est.anatomy.somaX, Est.anatomy.somaY, Est.anatomy.somaRadius, Est.anatomy.scale, Math.max(DW * 0.62, borda - ext - 6));
          const novo = eixo.axonPath[eixo.axonPath.length - 1], dx = novo.x - velho.x, dy = novo.y - velho.y;
          const feitos = new Set();
          ramos.forEach(function (br) { if (!feitos.has(br.pts)) { feitos.add(br.pts); br.pts.forEach(function (q) { q.x += dx; q.y += dy; }); } });
          boutons.forEach(function (bt) {
            if (!feitos.has(bt.branchPts)) { feitos.add(bt.branchPts); bt.branchPts.forEach(function (q) { q.x += dx; q.y += dy; }); }
            bt.x += dx; bt.y += dy;
          });
          Est.anatomy.axonPath = eixo.axonPath;
          Est.anatomy.myelinSheaths = eixo.myelinSheaths;
          Est.anatomy.ranvierNodes = eixo.ranvierNodes;
          Est.anatomy.axonEscala = eixo.axonEscala;
          Est.anatomy.terminalBranches = ramos;        // os terminais do Núcleo ficam fora da esfera, no fim do tronco
          Est.anatomy.terminalBoutons = boutons;
        }

// As bainhas de mielina e os nódulos de Ranvier de um axônio já traçado (a mesma regra do montarAxonio; delta muda o número de
        // bainhas para que os axônios do feixe não tenham os nódulos alinhados)
        function bainhasNos(axonPath, rel, axonSteps, scale, delta, livre) {
          const myelinSheaths = [], ranvierNodes = [];
          const numSheaths = Math.max(3, Math.round(6 * (rel - 0.1) / 0.9) + (delta || 0));
          const gapRatio = 0.028 / rel;
          const startOffset = Math.max(0.04 / rel, (livre || 0) / (rel * EIXO_BASE));     // livre: o começo do axônio fica sem bainha (segmento inicial)
          const usableSpan = 1 - 0.10 / rel - (startOffset - 0.04 / rel);
          const segSpan = (usableSpan - gapRatio * (numSheaths - 1)) / numSheaths;
          for (let m = 0; m < numSheaths; m++) {
            const t0 = startOffset + m * (segSpan + gapRatio);
            const t1 = t0 + segSpan;
            const idx0 = Math.floor(t0 * axonSteps);
            const idx1 = Math.min(axonSteps, Math.ceil(t1 * axonSteps));
            const pStart = axonPath[idx0], pEnd = axonPath[idx1], pMid = axonPath[Math.floor((idx0 + idx1) / 2)];
            myelinSheaths.push({
              pStart, pMid, pEnd,
              angle: Math.atan2(pEnd.y - pStart.y, pEnd.x - pStart.x),
              length: Math.hypot(pEnd.x - pStart.x, pEnd.y - pStart.y),
              thickness: (15.0 + (m % 2) * 1.4) * scale
            });
            if (m < numSheaths - 1) {
              const tGap = t1 + gapRatio * 0.5;
              const gapIdx = Math.min(axonSteps, Math.round(tGap * axonSteps));
              ranvierNodes.push({ x: axonPath[gapIdx].x, y: axonPath[gapIdx].y, t: tGap, flash: 0 });
            }
          }
          return { myelinSheaths, ranvierNodes };
        }

// Os axônios do Núcleo (opc.axonios): saem do soma em leque curto, correm juntos e paralelos pelo corredor, atravessam a parede e
        // abrem em leque rumo às esferas dos agentes (uma ponta para cada). O principal (o do desenho aprovado) é um deles; os outros
        // levam terminais próprios (outra semente). Cada um é um objeto com as mesmas peças do principal (anatomy.extras).
        function montarFeixe() {
          const A = Est.anatomy, n = opc.axonios, k = vista.k, esc = A.scale;
          const somaX = A.somaX, somaY = A.somaY;
          const meio = (n - 1) / 2, iMain = Math.floor(meio);
          const x0 = somaX + A.somaRadius * 1.44;                                   // de onde parte o axônio original (fase da onda)
          const xBorda = (runtime.width - vista.tx) / k - 6;
          const xParede = (vista.cx + vista.Rpx * PAREDE - vista.tx) / k;
          const xAbre = xParede - opc.abre;                                         // onde o leque começa a abrir (antes da parede)
          const xFeixe = somaX + 330 * esc;                                         // daí em diante correm juntos, em paralelo
          const sp = 24 * esc;                                                      // distância entre os axônios no feixe
          const dyE = opc.leque / k;                                                // distância entre as pontas, no desenho
          const sm = function (u) { u = Math.max(0, Math.min(1, u)); return u * u * (3 - 2 * u); };
          const onda = function (x) { return Math.sin((x - x0) / EIXO_BASE * Math.PI * 1.65) * 15 * esc; };
          const raioSoma = function (ang) {
            const m = A.somaOutline.length, f = (((ang % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI)) / (2 * Math.PI) * m;
            const i0 = Math.floor(f) % m, i1 = (i0 + 1) % m, fr = f - Math.floor(f);
            return A.somaOutline[i0].r * (1 - fr) + A.somaOutline[i1].r * fr;
          };
          const extras = [];
          for (let i = 0; i < n; i++) {
            const q = i - meio;
            const th = q * 0.22, rs = raioSoma(th) - 6 * esc;
            const sx = somaX + Math.cos(th) * rs, sy = somaY + Math.sin(th) * rs;
            const fy = somaY + q * sp, yE = somaY + q * dyE;
            // os terminais deste axônio: no principal, os que já existem; nos outros, um conjunto novo
            let ramos, boutons, raiz;
            if (i === iMain) { ramos = A.terminalBranches; boutons = A.terminalBoutons; raiz = A.axonPath[A.axonPath.length - 1]; }
            else { const B = montarAnatomia((opc.semente + 104729 * (i + 1)) >>> 0); ramos = B.terminalBranches; boutons = B.terminalBoutons; raiz = B.axonPath[B.axonPath.length - 1]; }
            const rx = raiz.x, ry = raiz.y;
            let ext = 0;
            ramos.forEach(function (br) { br.pts.forEach(function (p) { ext = Math.max(ext, p.x - rx); }); });
            boutons.forEach(function (bt) { ext = Math.max(ext, bt.x - rx + (bt.bWidth || 0)); });
            const xE = xBorda - ext - 6 - (i % 2 ? opc.degrau / k : 0);
            const len = xE - sx, rel = len / EIXO_BASE, steps = Math.max(24, Math.round(72 * rel));
            const axonPath = [];
            for (let s2 = 0; s2 <= steps; s2++) {
              const t = s2 / steps, x = sx + t * len;
              const y = sy + (fy - sy) * sm((x - sx) / (xFeixe - sx)) + (yE - fy) * sm((x - xAbre) / (xE - xAbre)) + onda(x) - onda(sx);
              axonPath.push({ x, y, t, w: (7.8 - Math.min(1, (x - sx) / EIXO_BASE) * 0.8) * esc });
            }
            const bn = bainhasNos(axonPath, rel, steps, esc, (i % 3) - 1, 120 * esc);
            const fim = axonPath[axonPath.length - 1], dx = fim.x - rx, dy = fim.y - ry, feitos = new Set();
            ramos.forEach(function (br) { if (!feitos.has(br.pts)) { feitos.add(br.pts); br.pts.forEach(function (p) { p.x += dx; p.y += dy; }); } });
            boutons.forEach(function (bt) {
              if (!feitos.has(bt.branchPts)) { feitos.add(bt.branchPts); bt.branchPts.forEach(function (p) { p.x += dx; p.y += dy; }); }
              bt.x += dx; bt.y += dy;
            });
            const E = { axonPath: axonPath, myelinSheaths: bn.myelinSheaths, ranvierNodes: bn.ranvierNodes, axonEscala: 1 / rel, terminalBranches: ramos, terminalBoutons: boutons, scale: esc, indice: i };
            if (i === iMain) {
              A.axonPath = E.axonPath; A.myelinSheaths = E.myelinSheaths; A.ranvierNodes = E.ranvierNodes; A.axonEscala = E.axonEscala;
              A.terminalBranches = ramos; A.terminalBoutons = boutons;
            } else extras.push(E);
          }
          A.extras = extras;
        }

// Esfera de vidro: o menor círculo que contém o neurônio inteiro (soma, dendritos, axônio e terminais). Os pontos mais distantes,
        // em geral as pontas dos terminais do axônio, encostam na parede. Aproximação de Bădoiu-Clarkson (sem dependência).
        function pontasTerminais(A) {
          return A.terminalBoutons.map(function (b) { return { x: b.x + Math.cos(b.tipAngle) * (b.bThick || 0) * 0.6, y: b.y + Math.sin(b.tipAngle) * (b.bThick || 0) * 0.6 }; });
        }

function calcularVista() {
          if (opc.modo === 'ligacoes') {          // as ligações vivem no espaço do palco (1 unidade = 1 px do canvas)
            const X = opc.vistaExt;           // no foco de uma esfera, a cena inteira entra na vista dela (escala e deslocamento)
            vista.k = X ? X.k : 1; vista.tx = X ? X.tx : 0; vista.ty = X ? X.ty : 0; vista.cx = runtime.width / 2; vista.cy = runtime.height / 2;
            vista.Rpx = Math.max(runtime.width, runtime.height); vista.Rd = vista.Rpx; vista.RdTodos = vista.Rd; vista.recorte2D = null; vista.terminais = 0; vista.toques = 0;
            return;
          }
          const term = (opc.saida || opc.semEixo) ? [] : pontasTerminais(Est.anatomy);
          const pts = term.slice();
          Est.anatomy.dendriteTips.forEach(function (d) { pts.push({ x: d.tipX, y: d.tipY }); });
          Est.anatomy.somaOutline.forEach(function (p) { pts.push({ x: p.x, y: p.y }); });
          Est.minis.forEach(function (m) { m.pontos.forEach(function (p) { pts.push(p); }); });
          // o centro da esfera é o corpo celular (soma); o raio vai até a ponta mais distante
          const cx = Est.anatomy.somaX, cy = Est.anatomy.somaY;
          let Rd = 0;
          pts.forEach(function (p) { Rd = Math.max(Rd, Math.hypot(p.x - cx, p.y - cy)); });
          Rd = Est.minis.length ? Rd * 1.03 : Rd + 3;
          const Rpx = Math.max(10, Math.min(runtime.width, runtime.height) / 2 - (opc.margem || 3));
          vista.RdTodos = Rd;
          Rd = Math.min(Rd, opc.raioMax);
          vista.k = Rpx / Rd;
          vista.recorte2D = null;
          vista.cx = opc.saida ? Rpx + 3 : runtime.width / 2; vista.cy = runtime.height / 2; vista.Rpx = Rpx; vista.Rd = Rd;
          vista.tx = vista.cx - cx * vista.k; vista.ty = vista.cy - cy * vista.k;
          vista.terminais = term.length;
          vista.toques = term.filter(function (p) { return Math.hypot(p.x - cx, p.y - cy) > Rd * 0.93; }).length;
        }

    return { axonStartFim: axonStartFim, montarAnatomia: montarAnatomia, montarAxonio: montarAxonio, arvoreDe: arvoreDe, anatomiaLigacoes: anatomiaLigacoes, montarLigacao: montarLigacao, raizDaArvore: raizDaArvore, caixaDe: caixaDe, estenderTronco: estenderTronco, bainhasNos: bainhasNos, montarFeixe: montarFeixe, pontasTerminais: pontasTerminais, calcularVista: calcularVista };
  }

  return { criar: criar };
}

);
// ---- fonte/neuronio/celula/parte.js
SF.parte({nome:'neuronio/celula',porta:1,compativelDesde:1,requer:['comum/sorteio@1','comum/cores@1','comum/ramos@1','neuronio/recorte@1','neuronio/anatomia@1','neuronio/sinais@1','neuronio/minis@1','neuronio/escala@1','neuronio/tinta@1','neuronio/dendritos@1','neuronio/corpo@1','neuronio/axonio@1','neuronio/terminais@1','neuronio/camada@1','neuronio/vidro@1','neuronio/lupa@1','neuronio/pulso@1'],guarda:true,dom:true},
/* Sexta-Feira Engine: o motor do neurônio (v0.3.0).
 * Vem do neuronio.html do dono (desenho aprovado: soma, dendritos, axônio, terminais), transformado em fábrica: cada canvas tem o seu
 * neurônio, com estado próprio. Só desenha; não lê dado, não usa rede, não mexe em nada fora do canvas que recebe.
 *
 *   var n = Neuronio.criar(canvas, { cor: '#8B3DFF', semente: 94127, leve: false });
 *   n.redimensionar(largura, altura);   // em pixels CSS; refaz o desenho estático
 *   n.passo(segundos); n.desenhar();     // um quadro (a tela chama, a 60 ou 24 por segundo)
 *   n.iniciar(); n.disparar(); n.pausar(true|false); n.setCor('#RRGGBB'); n.setLeve(true|false);
 *
 * Opções da esfera: rede: N (até 9) neurônios menores dentro da esfera, com o MESMO desenho, cada um com os terminais do axônio
 * na ponta de um dendrito primário do principal; saida: true faz só o tronco do axônio do principal atravessar a parede da esfera
 * (rumo às outras esferas): a esfera fica à esquerda do canvas e o resto da largura é a passagem do tronco, que some aos poucos.
 */
function (usa) {
  'use strict';

  var createSeededRandom = usa.sorteio.criar, hexToRgb = usa.cores.hexParaRgb;

  function criar(canvas, opcoes) {
    const opc = Object.assign({ cor: '#8B3DFF', semente: 94127, leve: false, rede: 0, saida: false, raioMax: Infinity, cores: null, anel: 0, lupa: false, axonios: 1, leque: 100, degrau: 0, abre: 200, miniEsc: 0.54, miniEixo: 0.25, giro: 0.9, sobra: 0.7, alcance: 0.8, semEixo: false, quieto: false, giro0: 0, dprMax: 3, margem: 3, dendritosExtra: null, arcos: null, corredor: 42, ligacoes: null, escLig: 1, aoChegar: null }, opcoes || {});
    opc.semente = opc.semente >>> 0;
    opc.rede = Math.max(0, Math.min(9, Math.floor(Number(opc.rede) || 0)));
    opc.saida = !!opc.saida;
    opc.axonios = Math.max(1, Math.min(8, Math.round(opc.axonios) || 1));
    opc.semEixo = !!opc.semEixo; opc.quieto = !!opc.quieto; opc.giro0 = Number(opc.giro0) || 0;
    opc.modo = Array.isArray(opc.ligacoes) ? 'ligacoes' : '';       // 'ligacoes': a camada só dos axônios que ligam as esferas (sem corpo, sem vidro)
    const ctx = canvas.getContext('2d');
    const DW = 1360, DH = 760;          // o neurônio é montado neste espaço e depois escalado para caber na esfera
    const vista = { k: 1, tx: 0, ty: 0, cx: 0, cy: 0, Rpx: 1, Rd: 1, toques: 0, terminais: 0 };
    // A lupa: a vista pode ser ampliada (z) e deslocada (ox, oy, em px do canvas). Quando ela para, a parte fixa é refeita naquela
    // ampliação (resolução e detalhes novos), em fatias por quadro, sem travar a animação.
    const lupa = { z: 1, ox: 0, oy: 0, mudou: false, ultimo: 0, anim: null, ouvinte: null };
    const VISTA_1 = { z: 1, ox: 0, oy: 0 };

        const config = {
          agente: 'Sexta-Feira',
          corHex: '#8B3DFF',
          rgb: [139, 61, 255],
          brilhoNucleo: 21,
          transparenciaCorpo: 45,
          opacidadeDendritos: 84,
          brilhoGeral: 72,
          ramificacaoDendritos: 82,
          velocidadePulsos: 40,
          frequenciaDisparos: 72,
          enableVesicles: true,
          enableMist: true,
          enableSubBranches: true
        };

        const runtime = {
          width: 1280,
          height: 720,
          dpr: 1,
          paused: false,
          showLabels: true,
          sidebarOpen: true,
          time: 0,
          lastFrameTime: 0,
          spawnAccumulator: 0,
          somaExcitation: 0,
          somaRgb: null
        };


        const incomingSignals = [];
        const actionPotentials = [];
        const mistClouds = [];
        const releasedNeurotransmitters = [];
        const MINI_ESC = opc.miniEsc;      // tamanho do menor em relação ao principal
        const MINI_EIXO = opc.miniEixo;        const miniAPs = [];                 // sinais correndo pelo axônio de cada neurônio menor
        const EIXO_BASE = DW * 0.62 - (DW * 0.25 + 48 * 1.44);   // comprimento do axônio no desenho original

        // O ESTADO do neurônio, num objeto só (v0.4.2): as partes recebem Est e leem/escrevem aqui. Cada campo está na tabela do LEIA-ME.md.
        const Est = {
          canvas: canvas,
          opc: opc,
          ctx: ctx,
          DW: DW,
          DH: DH,
          vista: vista,
          lupa: lupa,
          VISTA_1: VISTA_1,
          config: config,
          runtime: runtime,
          incomingSignals: incomingSignals,
          actionPotentials: actionPotentials,
          mistClouds: mistClouds,
          releasedNeurotransmitters: releasedNeurotransmitters,
          MINI_ESC: MINI_ESC,
          MINI_EIXO: MINI_EIXO,
          miniAPs: miniAPs,
          EIXO_BASE: EIXO_BASE,
          detalhe: null,
          refino: null,
          detZ: 1,
          detLocal: 1,
          pulsoZ: 1,
          tmpCamada: null,
          anatomy: {
            somaX: 0,
            somaY: 0,
            somaRadius: 48,
            scale: 1,
            somaOutline: [],
            membraneSpicules: [],
            cytoplasmRidges: [],
            membraneGranules: [],
            nucleusChromatin: [],
            dendriteBranches: [],
            dendriteTips: [],
            synapticSpines: [],
            axonPath: [],
            myelinSheaths: [],
            ranvierNodes: [],
            terminalBranches: [],
            terminalBoutons: [],
            offscreenCanvas: null
          },
          minis: [],  // os neurônios menores dentro da esfera (o mesmo desenho, em escala)
          auxCv: null,
          vidro: null,
          par: { x: 0, y: 0, tx: 0, ty: 0 },
          PAREDE: 0.955  // raio da parede interna do vidro (a mesma do traço da casca em construirVidro)
        };
        // neuronio/recorte (v0.4.2): a máscara da esfera e o corredor por onde o tronco do axônio sai dela (só geometria de recorte, sem desenho próprio).
        const P_recorte = usa.recorte.criar(Est, {});
        const recortaNaEsfera = P_recorte.recortaNaEsfera, recorte2D = P_recorte.recorte2D, montarMascara = P_recorte.montarMascara, fadeFora = P_recorte.fadeFora;
        // neuronio/anatomia (v0.4.2): a geometria do neurônio: onde fica cada ramo, o axônio, as bainhas, os terminais, as árvores das ligações e a vista (escala e centro) da esfera. Não desenha.
        const P_anatomia = usa.anatomia.criar(Est, {});
        const axonStartFim = P_anatomia.axonStartFim, montarAnatomia = P_anatomia.montarAnatomia, anatomiaLigacoes = P_anatomia.anatomiaLigacoes, raizDaArvore = P_anatomia.raizDaArvore, caixaDe = P_anatomia.caixaDe, estenderTronco = P_anatomia.estenderTronco, montarFeixe = P_anatomia.montarFeixe, pontasTerminais = P_anatomia.pontasTerminais, calcularVista = P_anatomia.calcularVista;
        // neuronio/sinais (v0.4.2): o comportamento dos sinais: quando nasce cada pulso de dendrito e potencial de ação, como a liberação de neurotransmissores e o disparo dos menores andam a cada passo. Só calcula, não desenha.
        const P_sinais = usa.sinais.criar(Est, {});
        const spawnDendriteSignal = P_sinais.spawnDendriteSignal, triggerActionPotential = P_sinais.triggerActionPotential, dispararMini = P_sinais.dispararMini, stepSimulation = P_sinais.stepSimulation;
        // neuronio/pulso (v0.4.2): o pulso redondo e suave (drawUnifiedSmoothPulse): o brilho de um sinal num ponto, com o tamanho corrigido pela lupa. Usado pelos pulsos dos dendritos, do axônio e dos terminais.
        const P_pulso = usa.pulso.criar(Est, {});
        const drawUnifiedSmoothPulse = P_pulso.drawUnifiedSmoothPulse;
        // neuronio/minis (v0.4.2): os neurônios menores dentro da esfera: monta cada um (anatomia em escala, posição, profundidade, caixa) a partir da anatomia do principal. A anatomia chega pela juntadora.
        const P_minis = usa.minis.criar(Est, { axonStartFim: P_anatomia.axonStartFim, montarAnatomia: P_anatomia.montarAnatomia, caixaDe: P_anatomia.caixaDe, pontasTerminais: P_anatomia.pontasTerminais, drawUnifiedSmoothPulse: P_pulso.drawUnifiedSmoothPulse });
        const montarMinis = P_minis.montarMinis, pintarMinisVivo = P_minis.pintarMinisVivo;
        // neuronio/escala (v0.4.2): o tamanho e o detalhe: o degrau de detalhe da lupa (nivel), 1 px em unidades do desenho (un), o zoom máximo, o contraste da lupa (zcDe), o giro da célula, o bitmap novo e os dois ramos que dependem do degrau (polígono afilado e ramo encorpado).
        const P_escala = usa.escala.criar(Est, {});
        const agora = P_escala.agora, zcDe = P_escala.zcDe, nivel = P_escala.nivel, un = P_escala.un, zMax = P_escala.zMax, giroCelula = P_escala.giroCelula, novoBitmap = P_escala.novoBitmap, drawSharpDendritePolygon = P_escala.drawSharpDendritePolygon, drawTaperedBranch = P_escala.drawTaperedBranch;
        // neuronio/tinta (v0.4.2): as cores e os brilhos derivados de uma célula (o topo do desenho aprovado): cor clara, cor funda, transparências e brilhos, o degrau de detalhe e o contraste da lupa. Quem pinta recebe o objeto T e lê daqui.
        const P_tinta = usa.tinta.criar(Est, { zcDe: P_escala.zcDe, nivel: P_escala.nivel, un: P_escala.un });
        const tintaFixa = P_tinta.tintaFixa, tintaViva = P_tinta.tintaViva;
        // neuronio/dendritos (v0.4.2): o desenho parado dos dendritos afilados e das espinhas sinápticas (seção 2 do desenho aprovado). Recebe a tinta T.
        const P_dendritos = usa.dendritos.criar(Est, { drawSharpDendritePolygon: P_escala.drawSharpDendritePolygon, drawUnifiedSmoothPulse: P_pulso.drawUnifiedSmoothPulse });
        const pintarDendritos = P_dendritos.pintarDendritos, pintarPulsosEntrada = P_dendritos.pintarPulsosEntrada;
        // neuronio/corpo (v0.4.2): o desenho parado do corpo da célula: halo atmosférico, soma com parede 3D e núcleo texturizado (seções 1, 3 e 4 do desenho aprovado). Recebe a tinta T.
        const P_corpo = usa.corpo.criar(Est, {  });
        const pintarHalo = P_corpo.pintarHalo, pintarSoma = P_corpo.pintarSoma, pintarNucleo = P_corpo.pintarNucleo, pintarExcitacaoSoma = P_corpo.pintarExcitacaoSoma;
        // neuronio/axonio (v0.4.2): o desenho parado do axônio: tronco encorpado, bainhas de mielina estriadas e nódulos de Ranvier (seção 5 do desenho aprovado), um por axônio. Recebe a tinta T.
        const P_axonio = usa.axonio.criar(Est, { drawTaperedBranch: P_escala.drawTaperedBranch, fadeFora: P_recorte.fadeFora, drawUnifiedSmoothPulse: P_pulso.drawUnifiedSmoothPulse });
        const pintarAxonio = P_axonio.pintarAxonio, pintarNodulos = P_axonio.pintarNodulos, pintarPotenciais = P_axonio.pintarPotenciais;
        // neuronio/terminais (v0.4.2): o desenho parado dos terminais: ramos dos telodendros uniformes (seção 6 do desenho aprovado, um por axônio) e os botões fixos dos neurônios menores. Recebe a tinta T.
        const P_terminais = usa.terminais.criar(Est, { nivel: P_escala.nivel, drawTaperedBranch: P_escala.drawTaperedBranch });
        const pintarTerminais = P_terminais.pintarTerminais, pintarBotoesFixos = P_terminais.pintarBotoesFixos, pintarNevoa = P_terminais.pintarNevoa, pintarBulbos = P_terminais.pintarBulbos, pintarNeurotransmissores = P_terminais.pintarNeurotransmissores;
        // neuronio/camada (v0.4.2): a camada fixa (pré-desenhada): a ordem das camadas (principal e menores), pintar uma camada com luz, névoa e sombra, o assado em fatias com orçamento de tempo, o lustre do soma, iluminar, reduzir e compor.
        const P_camada = usa.camada.criar(Est, { recortaNaEsfera: P_recorte.recortaNaEsfera, montarMascara: P_recorte.montarMascara, agora: P_escala.agora, zcDe: P_escala.zcDe, giroCelula: P_escala.giroCelula, novoBitmap: P_escala.novoBitmap, pintarBotoesFixos: P_terminais.pintarBotoesFixos, pintarCelula: pintarCelula });
        const iniciarAssado = P_camada.iniciarAssado, avancarAssado = P_camada.avancarAssado, bakeStaticLayer = P_camada.bakeStaticLayer;
        // neuronio/vidro (v0.4.2): o vidro da esfera, com profundidade: as duas camadas pré-renderizadas (fundo e frente), a paralaxe do ponteiro, e como o vidro e a parte fixa entram na vista atual (com a lupa).
        const P_vidro = usa.vidro.criar(Est, { zcDe: P_escala.zcDe, novoBitmap: P_escala.novoBitmap });
        const construirVidro = P_vidro.construirVidro, vidroDaVista = P_vidro.vidroDaVista, vidroNaVista = P_vidro.vidroNaVista, estaticoNaVista = P_vidro.estaticoNaVista, moverParalaxe = P_vidro.moverParalaxe;
        // neuronio/lupa (v0.4.2): a interação da lupa: zoom, arrasto, animação, prender nos limites, o refino da parte fixa em fatias e os ouvintes do ponteiro (roda, arrasto, pinça, duplo toque).
        const P_lupa = usa.lupa.criar(Est, { agora: P_escala.agora, zMax: P_escala.zMax, iniciarAssado: P_camada.iniciarAssado, avancarAssado: P_camada.avancarAssado, vidroDaVista: P_vidro.vidroDaVista });
        const prenderLupa = P_lupa.prenderLupa, marcarLupa = P_lupa.marcarLupa, animarLupa = P_lupa.animarLupa, passoAnimLupa = P_lupa.passoAnimLupa, cuidarRefino = P_lupa.cuidarRefino, ligarLupa = P_lupa.ligarLupa;
        // FIM DOS BLOCOS DAS PARTES
        const par = Est.par, PAREDE = Est.PAREDE;


        const dendritos = usa.ramos;
        const trilhaSuave = dendritos.trilhaSuave, bordasRamo = dendritos.bordasRamo, desviar = dendritos.desviar, mitocondrias = dendritos.mitocondrias;




        // Constrói o que a esfera mostra: o neurônio principal (soma no centro) e, com a opção rede, os menores em volta
        function buildCompleteNeuron() {
          Est.anatomy = opc.modo === 'ligacoes' ? anatomiaLigacoes() : montarAnatomia(opc.semente, undefined, true);
          if (opc.semEixo) { Est.anatomy.axonPath = []; Est.anatomy.myelinSheaths = []; Est.anatomy.ranvierNodes = []; Est.anatomy.terminalBranches = []; Est.anatomy.terminalBoutons = []; }
          actionPotentials.length = 0; incomingSignals.length = 0; mistClouds.length = 0; releasedNeurotransmitters.length = 0;
          miniAPs.length = 0;
          Est.minis = opc.rede > 0 ? montarMinis() : [];
          calcularVista();
          if (opc.saida) { if (opc.axonios > 1) montarFeixe(); else estenderTronco(); }
          Est.anatomy.nosTodos = [Est.anatomy].concat(Est.anatomy.extras || []).reduce(function (a, E) { return a.concat(E.ranvierNodes); }, []);
          Est.anatomy.boutonsTodos = [Est.anatomy].concat(Est.anatomy.extras || []).reduce(function (a, E) { return a.concat(E.terminalBoutons); }, []);
          construirVidro();
          bakeStaticLayer();
        }

















        // ---------------------------------------------------------------------------------- o vidro da esfera, com profundidade
        // Duas camadas pré-renderizadas: o fundo do vidro (a parede de trás, com névoa e poeira distante) e a frente (a casca, com reflexos e
        // borda de Fresnel). Elas se deslocam em sentidos opostos com o ponteiro, e o neurônio fica parado entre as duas.












        // Desenha uma célula (halo, dendritos, soma, núcleo, axônio, telodendros) no espaço do neurônio: o desenho aprovado
        // falha contida por órgão (v0.4.3): cada órgão do desenho roda em usa.base.seguro; se der erro, só ele para (nesta esfera) e o contexto volta à transformação, ao modo de composição
        // e à opacidade de antes dele (um clip ou um save aberto pelo órgão não dá para desfazer: fica até o restore do quadro). Sem erro, nada muda no desenho.
        const idE = String(opc.id || 'esfera');
        function orgao(c, nome, fn) {
          const t = c.getTransform(), op = c.globalCompositeOperation, al = c.globalAlpha;
          let ok = false;
          usa.base.seguro(idE + ':' + nome, function () { fn(); ok = true; });
          if (!ok) { c.setTransform(t); c.globalCompositeOperation = op; c.globalAlpha = al; }
        }
        function pintarCelula(octx, A, rgb) {
          const T = tintaFixa(rgb);
          orgao(octx, 'halo', function () { pintarHalo(octx, A, T); });                // 1
          orgao(octx, 'dendritos', function () { pintarDendritos(octx, A, T); });           // 2
          orgao(octx, 'soma', function () { pintarSoma(octx, A, T); });                // 3
          orgao(octx, 'nucleo', function () { pintarNucleo(octx, A, T); });              // 4
          // (com mais de um axônio, o laço desenha cada um com as mesmas peças: axônio, bainhas, nódulos e terminais)
          [A].concat(A.extras || []).forEach(function (E) {
          if (E.rgb) {                                                        // ligações: cada axônio na sua cor
            T.r = E.rgb[0]; T.g = E.rgb[1]; T.b = E.rgb[2];
            T.lightR = Math.min(255, T.r + 90); T.lightG = Math.min(255, T.g + 90); T.lightB = Math.min(255, T.b + 90);
            T.deepR = Math.round(T.r * 0.26); T.deepG = Math.round(T.g * 0.26); T.deepB = Math.round(T.b * 0.26);
          }
          orgao(octx, 'axonio', function () { pintarAxonio(octx, A, E, T); });           // 5
          orgao(octx, 'terminais', function () { pintarTerminais(octx, A, E, T); });        // 6
          });
        }


















        // Renderização completa do neurônio montado
        function drawFrame() {
          if (!ctx || !canvas) return;
          passoAnimLupa();
          cuidarRefino();

          ctx.save();
          ctx.scale(runtime.dpr, runtime.dpr);

          ctx.clearRect(0, 0, runtime.width, runtime.height);
          moverParalaxe();
          vidroNaVista('fundo');

          // Camada anatômica estática pré-renderizada (já na vista da esfera; com a lupa, a que foi refeita para ela)
          estaticoNaVista();
          // o que é vivo (pulsos, vesículas, neurotransmissores) é desenhado no espaço do neurônio e entra na mesma vista e na mesma lupa
          ctx.transform(lupa.z, 0, 0, lupa.z, lupa.ox, lupa.oy);
          Est.pulsoZ = Math.pow(lupa.z, -0.45);
          const zcL = zcDe(lupa.z);
          if (recortaNaEsfera()) ctx.clip(recorte2D());
          ctx.translate(vista.tx, vista.ty);
          ctx.scale(vista.k, vista.k);
          giroCelula(ctx, Est.anatomy);

          const T = tintaViva(zcL);
          orgao(ctx, 'nevoa', function () { pintarNevoa(T); });                        // 1

          ctx.globalCompositeOperation = 'lighter';

          orgao(ctx, 'minis', function () { pintarMinisVivo(T); });                    // 1b
          T.usaCor();
          orgao(ctx, 'excitacao', function () { pintarExcitacaoSoma(T); });                // 2
          orgao(ctx, 'pulsos', function () { pintarPulsosEntrada(T); });                // 3
          orgao(ctx, 'nodulos', function () { pintarNodulos(T); });                      // 4
          orgao(ctx, 'potenciais', function () { pintarPotenciais(T); });                   // 5

          ctx.globalCompositeOperation = 'source-over';

          orgao(ctx, 'bulbos', function () { pintarBulbos(T); });                       // 6

          ctx.globalCompositeOperation = 'lighter';

          orgao(ctx, 'neurotransmissores', function () { pintarNeurotransmissores(T); });           // 7

          ctx.globalCompositeOperation = 'source-over';

          ctx.restore();
          vidroNaVista('frente');
        }


    function aplicarCor(hex) {
      config.corHex = String(hex).toUpperCase();
      config.rgb = hexToRgb(config.corHex);
    }

    function aplicarLeve(ligado) {
      opc.leve = !!ligado;
      config.enableMist = !opc.leve;
      config.enableVesicles = !opc.leve;
      config.enableSubBranches = !opc.leve;
    }

    function redimensionar(largura, altura) {
      runtime.width = Math.max(40, Math.round(largura));
      runtime.height = Math.max(40, Math.round(altura));
      runtime.dpr = opc.leve ? 1 : Math.min(window.devicePixelRatio || 1, opc.dprMax || 3);
      canvas.width = Math.round(runtime.width * runtime.dpr);
      canvas.height = Math.round(runtime.height * runtime.dpr);
      buildCompleteNeuron();
      drawFrame();
    }

    if (typeof document !== 'undefined') {
      document.addEventListener('pointermove', function (e) {
        if (opc.leve) return;
        const L = Math.max(1, window.innerWidth / 2), H2 = Math.max(1, window.innerHeight / 2);
        par.tx = Math.max(-1, Math.min(1, (e.clientX - L) / L)) * 0.8;
        par.ty = Math.max(-1, Math.min(1, (e.clientY - H2) / H2)) * 0.8;
      }, { passive: true });
    }
    aplicarCor(opc.cor);
    aplicarLeve(opc.leve);
    ligarLupa();
    runtime.showLabels = false;

    return {
      redimensionar: redimensionar,
      passo: function (dt) { if (!runtime.paused) stepSimulation(Math.min(0.05, Math.max(0.001, dt))); },
      desenhar: drawFrame,
      esfera: function () {
        let contato = 0, dentro = 0, fora = 0;
        Est.minis.forEach(function (m) {
          contato = Math.max(contato, Math.hypot(m.contato.x - m.alvo.tipX, m.contato.y - m.alvo.tipY) * vista.k);
          m.pontos.forEach(function (p) { if (Math.hypot(p.x - Est.anatomy.somaX, p.y - Est.anatomy.somaY) <= vista.Rd) dentro++; else fora++; });
        });
        let folga = Infinity;
        for (let i = 0; i < Est.minis.length; i++) for (let j = i + 1; j < Est.minis.length; j++) {
          const A1 = Est.minis[i], B1 = Est.minis[j];
          folga = Math.min(folga, Math.hypot(A1.soma.x - B1.soma.x, A1.soma.y - B1.soma.y) / (A1.rho + B1.rho));
        }
        return { raio: vista.Rpx, terminais: vista.terminais, toques: vista.toques, minis: Est.minis.length, contato: contato, folga: folga,
          profundidades: Est.minis.map(function (m) { return +m.z.toFixed(2); }), pontosDentro: dentro, pontosFora: fora, escondidos: +(fora / Math.max(1, fora + dentro)).toFixed(3), saida: opc.saida, centro: [vista.cx, vista.cy], RdTodos: vista.RdTodos, Rd: vista.Rd, k: vista.k,
          raiosPrimarios: Est.minis.map(function (m) { return Math.round(Math.hypot(m.alvo.tipX - Est.anatomy.somaX, m.alvo.tipY - Est.anatomy.somaY)); }),
          raiosSomas: Est.minis.map(function (m) { return Math.round(Math.hypot(m.soma.x - Est.anatomy.somaX, m.soma.y - Est.anatomy.somaY)); }),
          rhos: Est.minis.map(function (m) { return Math.round(m.rho); }),
          somas: Est.minis.map(function (m) { return [vista.tx + m.soma.x * vista.k, vista.ty + m.soma.y * vista.k]; }),
          axonios: opc.axonios, pontas: [Est.anatomy].concat(Est.anatomy.extras || []).filter(function (E) { return E.axonPath.length; }).map(function (E) { const p = E.axonPath[E.axonPath.length - 1]; return [Math.round(vista.tx + p.x * vista.k), Math.round(vista.ty + p.y * vista.k)]; }),
          pontaTronco: (function () { const p = Est.anatomy.axonPath[Est.anatomy.axonPath.length - 1]; return p ? [vista.tx + p.x * vista.k, vista.ty + p.y * vista.k] : null; })() };
      },
      // a lupa: ampliar e voltar (botões), ir direto a um ponto (testes), o estado e um aviso a cada mudança
      lupa: {
        ampliar: function (f) {
          const fx = lupa.z > 1.001 ? runtime.width / 2 : vista.cx, fy = lupa.z > 1.001 ? runtime.height / 2 : vista.cy;
          animarLupa(lupa.z * f, fx, fy);
        },
        zerar: function () { animarLupa(1, runtime.width / 2, runtime.height / 2); },
        ir: function (z, x, y) {
          lupa.anim = null;
          lupa.z = Math.max(1, Math.min(zMax(), z));
          lupa.ox = runtime.width / 2 - lupa.z * x; lupa.oy = runtime.height / 2 - lupa.z * y;
          prenderLupa(); marcarLupa();
        },
        estado: function () { return { z: lupa.z, ox: lupa.ox, oy: lupa.oy, zmax: zMax(), pronto: !Est.refino && !lupa.mudou && !lupa.anim, temDetalhe: !!Est.detalhe }; },
        aoMudar: function (fn) { lupa.ouvinte = typeof fn === 'function' ? fn : null; if (lupa.ouvinte) lupa.ouvinte(lupa.z); }
      },
      iniciar: function () {
        if (opc.modo === 'ligacoes') return;
        if (Est.minis.length) {
          if (!opc.quieto) for (let i = 0; i < 3; i++) miniAPs.push({ m: Est.minis[(i * 3) % Est.minis.length], t: -i * 0.45 });
        } else if (!opc.quieto) {
          for (let i = 0; i < 6; i++) spawnDendriteSignal();
        }
        triggerActionPotential();
        { const L = [Est.anatomy].concat(Est.anatomy.extras || []); for (let i = 1; i < L.length; i++) actionPotentials.push({ t: -0.28 * i, visitedNodes: new Set(), eixo: L[i], boutons: L[i].terminalBoutons, released: false }); }
      },
      disparar: triggerActionPotential,
      // a cena manda: um pulso por uma ligação (pelo id), o corpo piscando na cor de quem fala, o sinal chegando a um dendrito
      dispararEixo: function (id, hex) {
        const E = (Est.anatomy.extras || []).filter(function (x) { return x.id === id; })[0];
        if (!E) return false;
        actionPotentials.push({ t: 0, visitedNodes: new Set(), eixo: E, boutons: E.terminalBoutons, released: false, rgb: /^#[0-9a-fA-F]{6}$/.test(hex) ? hexToRgb(hex) : null });
        return true;
      },
      excitar: function (hex) {
        runtime.somaExcitation = 1.0;
        runtime.somaRgb = /^#[0-9a-fA-F]{6}$/.test(hex) ? hexToRgb(hex) : null;
      },
      // o sinal entra pelo dendrito mais perto de (x, y) (px do canvas), corre até o corpo e o corpo pisca na cor de quem falou
      receber: function (x, y, hex) {
        let melhor = null, d2 = Infinity;
        const rot = function (p) {
          if (!opc.giro0) return p;
          const c = Math.cos(opc.giro0), s = Math.sin(opc.giro0), dx = p.x - Est.anatomy.somaX, dy = p.y - Est.anatomy.somaY;
          return { x: Est.anatomy.somaX + dx * c - dy * s, y: Est.anatomy.somaY + dx * s + dy * c };
        };
        Est.anatomy.dendriteTips.forEach(function (e) {
          e.pts.forEach(function (p, j) {
            const q = rot(p), dx = vista.tx + q.x * vista.k - x, dy = vista.ty + q.y * vista.k - y, d = dx * dx + dy * dy;
            if (d < d2) { d2 = d; melhor = { e: e, j: j }; }
          });
        });
        if (!melhor) { runtime.somaExcitation = 1.0; runtime.somaRgb = /^#[0-9a-fA-F]{6}$/.test(hex) ? hexToRgb(hex) : null; return; }
        incomingSignals.push({ pts: melhor.e.pts, progress: melhor.j / Math.max(1, melhor.e.pts.length - 1), speed: 0.56 + usa.base.acaso() * 0.34, entrada: melhor.e,
          rgb: /^#[0-9a-fA-F]{6}$/.test(hex) ? hexToRgb(hex) : null });
      },
      // a geometria da célula no canvas (px): o corpo, o raio da esfera e os pontos de cada ramo de dendrito (para as ligações tocarem um)
      geometria: function () {
        const rot = function (p) {
          if (!opc.giro0) return p;
          const c = Math.cos(opc.giro0), s = Math.sin(opc.giro0), dx = p.x - Est.anatomy.somaX, dy = p.y - Est.anatomy.somaY;
          return { x: Est.anatomy.somaX + dx * c - dy * s, y: Est.anatomy.somaY + dx * s + dy * c };
        };
        const px = function (p) { const q = rot(p); return [vista.tx + q.x * vista.k, vista.ty + q.y * vista.k, (p.w || 0) * vista.k]; };
        const sm = px({ x: Est.anatomy.somaX, y: Est.anatomy.somaY });
        return { cx: vista.cx, cy: vista.cy, R: vista.Rpx, k: vista.k, soma: [sm[0], sm[1]], rSoma: Est.anatomy.somaRadius * vista.k,
          dendritos: Est.anatomy.dendriteBranches.map(function (br) {
            const L = br.pts.length, out = [];
            br.pts.forEach(function (p, j) { if (j % 2 === 0 || j === L - 1) out.push(px(p)); });
            return { nivel: br.level, pts: out };
          }),
          contornoSoma: Est.anatomy.somaOutline.filter(function (p, j) { return j % 4 === 0; }).map(function (p) { return px(p); }) };
      },
      // as cabeças dos pulsos que estão correndo pelos axônios das ligações, com um rastro curto (px do canvas), para a cena pintar a cor de quem pediu por cima
      cabecas: function () {
        const out = [];
        actionPotentials.forEach(function (ap) {
          const P = ap.eixo.axonPath;
          if (!ap.rgb || ap.t <= 0 || ap.t > 1 || !P || P.length < 2) return;
          const pts = [];
          for (let k = 0; k < 6; k++) {
            const si = ap.t * (P.length - 1) - k * 1.4;
            if (si < 0) break;
            const i0 = Math.floor(si), i1 = Math.min(P.length - 1, i0 + 1), fr = si - i0;
            pts.push({ x: P[i0].x + (P[i1].x - P[i0].x) * fr, y: P[i0].y + (P[i1].y - P[i0].y) * fr });
          }
          out.push({ id: ap.eixo.id, rgb: ap.rgb, pts: pts });
        });
        return out;
      },
      arvoreRaiz: raizDaArvore,
      // os neurônios menores (os módulos), no canvas (px): o corpo, a cor e o ponto de dendrito que chega mais perto da parede da esfera
      minisGeometria: function () {
        const rot = function (p) {
          if (!opc.giro0) return p;
          const c = Math.cos(opc.giro0), s = Math.sin(opc.giro0), dx = p.x - Est.anatomy.somaX, dy = p.y - Est.anatomy.somaY;
          return { x: Est.anatomy.somaX + dx * c - dy * s, y: Est.anatomy.somaY + dx * s + dy * c };
        };
        const px = function (p) { const q = rot(p); return [vista.tx + q.x * vista.k, vista.ty + q.y * vista.k]; };
        return Est.minis.map(function (m, i) {
          const a = m.M[0], b = m.M[1], c = m.M[2], d = m.M[3], e = m.M[4], f = m.M[5];
          let melhor = null, dm = -1;
          m.A.dendriteBranches.forEach(function (br) {
            if (br.extra) return;
            br.pts.forEach(function (p) {
              const w = { x: a * p.x + c * p.y + e, y: b * p.x + d * p.y + f }, r = Math.hypot(w.x - Est.anatomy.somaX, w.y - Est.anatomy.somaY);
              if (r > dm) { dm = r; melhor = w; }
            });
          });
          return { idx: i, rgb: m.rgb, soma: px(m.soma), parede: px(melhor || m.soma) };
        });
      },
      excitarMini: function (i, hex) {
        const m = Est.minis[i]; if (!m) return false;
        m.excita = 1; m.ativo = /^#[0-9a-fA-F]{6}$/.test(hex) ? hexToRgb(hex) : null; m.ativoT = m.ativo ? 2.4 : 0;
        return true;
      },
      dispararMini: function (i, hex, cb) {
        const m = Est.minis[i]; if (!m) return false;
        dispararMini(m, /^#[0-9a-fA-F]{6}$/.test(hex) ? hexToRgb(hex) : null, cb);
        return true;
      },
      setGiro: function (g) { opc.giro0 = g; buildCompleteNeuron(); drawFrame(); },
      // o foco numa esfera: só as ligações dela, na vista dela (X = {k, tx, ty}); sem X volta tudo ao normal
      focoLigacoes: function (lista, X) {
        opc.ligacoes = Array.isArray(lista) ? lista : []; opc.vistaExt = X || null;
        lupa.z = 1; lupa.ox = 0; lupa.oy = 0; lupa.mudou = false; lupa.anim = null; Est.refino = null; Est.detalhe = null;
        redimensionar(runtime.width, runtime.height);
      },
      // a lupa da esfera em foco manda; as ligações a seguem (o refino refaz o desenho nítido quando para)
      lupaEspelho: function (z, ox, oy) {
        if (lupa.z === z && lupa.ox === ox && lupa.oy === oy) return;
        lupa.z = z; lupa.ox = ox; lupa.oy = oy; lupa.mudou = true; lupa.ultimo = agora(); Est.refino = null;
      },
      setLigacoes: function (lista, esc, semRefazer) { opc.ligacoes = Array.isArray(lista) ? lista : []; opc.vistaExt = null; if (esc) opc.escLig = esc; if (semRefazer) return; buildCompleteNeuron(); drawFrame(); },
      lupaLigar: function (ligada) {
        opc.lupa = !!ligada;
        canvas.style.pointerEvents = opc.lupa ? 'auto' : 'none';
        canvas.style.touchAction = opc.lupa ? 'none' : '';
        canvas.style.cursor = opc.lupa ? 'zoom-in' : '';
        if (!opc.lupa) { lupa.anim = null; lupa.z = 1; lupa.ox = 0; lupa.oy = 0; lupa.mudou = false; Est.refino = null; Est.detalhe = null; if (lupa.ouvinte) lupa.ouvinte(1); }
      },
      pausar: function (p) { runtime.paused = !!p; },
      setCor: function (hex) { aplicarCor(hex); buildCompleteNeuron(); drawFrame(); },
      setLeve: function (ligado) { aplicarLeve(ligado); redimensionar(runtime.width, runtime.height); }
    };
  }

  return { criar: criar };
}

);
