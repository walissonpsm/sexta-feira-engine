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
