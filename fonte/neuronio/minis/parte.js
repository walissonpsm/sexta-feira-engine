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
              const fi = angArcos ? angArcos[k] : a0 + (a1 - a0) * k / (n - 1), rk = opc.anel * (0.84 + 0.30 * ((k * 0.618034) % 1)), P = { x: C.x + rk * Math.cos(fi), y: C.y + rk * Math.sin(fi) };   // v0.5.0: raios alternados, mais espalhados
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
