#!/usr/bin/env python3
"""Teste de navegador da tela da engine (só na nuvem; precisa do playwright do Python e de um Chromium, senão é pulado).

    python3 testes/navegador.py

Serve a pasta interface/ num servidor local e confere a cena: abre sem erro e sem rede, o selo de dados fictícios, o foco por nome e a lupa,
o ciclo do pedido (cada agente pede e recebe, tudo volta ao repouso), as esferas sem sobreposição, texto e ids maliciosos nos dados,
o modo leve e o celular. O fps só é informado (ele depende da máquina), nunca reprova.
v0.5.0: os axônios (um por módulo pedido, no máximo 4 por agente; terminais lado a lado; chegada de frente e sem quina; sem volta grande, sem
sobreposição longa, teto de cruzamentos), as duas curvas puras de comum/curvas, os módulos do Núcleo espalhados e o tempo de abertura da cena.
Os scripts da página só expõem a cena (window.SF_CENA) se window.SF_TESTE existir antes deles; a tela de verdade não expõe nada.
"""
import functools
import http.server
import json
import math
import os
import pathlib
import threading
import time
import unittest

try:
    from playwright.sync_api import sync_playwright
except Exception:  # sem playwright: tudo pulado
    sync_playwright = None

INTERFACE = pathlib.Path(__file__).resolve().parent.parent / "interface"
REFERENCIAS = pathlib.Path(__file__).resolve().parent / "referencias"
AGENTES = ["cripto", "acoes-etfs", "fiis", "robo", "seguranca", "radar"]
NOMES = {"cripto": "Cripto", "acoes-etfs": "Ações e ETFs", "fiis": "FIIs", "robo": "Robô", "seguranca": "Segurança", "radar": "Radar", "nucleo": "Sexta-Feira"}
PREPARA = "window.SF_TESTE = true; window.__d = 0; (() => { const o = CanvasRenderingContext2D.prototype.drawImage; CanvasRenderingContext2D.prototype.drawImage = function () { window.__d++; return o.apply(this, arguments); }; })();"
# a lista fixa de módulos do Núcleo (a ordem de dados/limpa: o índice de cada um é o que o axônio leva em `mod`)
MODULOS = ["telegram", "internet", "planilha", "painel", "mapa", "resumo", "backup", "salas", "aprendido"]
# As medidas dos axônios (v0.5.0), feitas DENTRO da página sobre os pontos finais de cada axônio (`ax.pts`, no palco). Devolve: cruzamentos entre pares de axônios, o
# trecho mais longo em que um corre em cima de outro (em larguras de linha), e, por axônio de entrada: o raio de curva mais apertado nos últimos 150 px, o ângulo
# da chegada contra a direção do centro do Núcleo (últimos 6 px), a volta dada em torno do Núcleo (graus) e onde o terminal pousou (raio e ângulo) contra o ponto do módulo.
MEDE = r"""() => {
  const C = window.SF_CENA, W = C.parede(), N = C.esferas().nucleo, s = C.escala();
  const volta = (a) => { while (a > Math.PI) a -= 2 * Math.PI; while (a < -Math.PI) a += 2 * Math.PI; return a; };
  const E = W.eixos, I = E.filter(a => a.tipo === 'i');
  const reamostra = (P, h) => {
    const c = [0]; for (let i = 1; i < P.length; i++) c.push(c[i - 1] + Math.hypot(P[i].x - P[i - 1].x, P[i].y - P[i - 1].y));
    const L = c[c.length - 1], R = []; let j = 0;
    for (let u = 0; u <= L + 1e-6; u += h) { while (j < P.length - 2 && c[j + 1] < u) j++; const t = Math.min(1, (u - c[j]) / ((c[j + 1] - c[j]) || 1)); R.push({ x: P[j].x + (P[j + 1].x - P[j].x) * t, y: P[j].y + (P[j + 1].y - P[j].y) * t, u }); }
    return { R, L };
  };
  const seg = (p, q, r, t) => { const o = (a, b, c) => (b.x - a.x) * (c.y - a.y) - (b.y - a.y) * (c.x - a.x); return (o(p, q, r) > 0) !== (o(p, q, t) > 0) && (o(r, t, p) > 0) !== (o(r, t, q) > 0); };
  let cruzamentos = 0; const pares = [];
  for (let a = 0; a < E.length; a++) for (let b = a + 1; b < E.length; b++) {
    const A = E[a], B = E[b]; let n = 0, last = -9;
    for (let i = 0; i + 1 < A.pts.length; i += 2) { const p = A.pts[i], q = A.pts[Math.min(i + 2, A.pts.length - 1)];
      for (let j = 0; j + 1 < B.pts.length; j += 2) if (seg(p, q, B.pts[j], B.pts[Math.min(j + 2, B.pts.length - 1)])) { if (i - last > 6) n++; last = i; } }
    if (n) { cruzamentos += n; pares.push([A.id, B.id, n]); }
  }
  let sobre = 0; const sobrePares = [];
  for (let a = 0; a < E.length; a++) for (let b = a + 1; b < E.length; b++) {
    const A = E[a], B = E[b], lim = (A.larg + B.larg) / 2; let run = 0, best = 0;
    for (let i = 0; i < A.pts.length; i++) { const p = A.pts[i]; let dm = 1e9;
      for (let j = 0; j < B.pts.length; j++) { const d = Math.hypot(p.x - B.pts[j].x, p.y - B.pts[j].y); if (d < dm) dm = d; }
      if (dm < lim) { run += (i ? Math.hypot(p.x - A.pts[i - 1].x, p.y - A.pts[i - 1].y) : 0); if (run > best) best = run; } else run = 0; }
    if (best / lim > sobre) sobre = best / lim;
    if (best > 6 * lim) sobrePares.push([A.id, B.id, +(best / lim).toFixed(1)]);
  }
  const por = I.map(a => {
    const { R, L } = reamostra(a.pts, 2), h = 3, K = [];
    for (let i = h; i < R.length - h; i++) { const a1 = Math.atan2(R[i].y - R[i - h].y, R[i].x - R[i - h].x), a2 = Math.atan2(R[i + h].y - R[i].y, R[i + h].x - R[i].x); K.push({ k: volta(a2 - a1) / (2 * h), u: R[i].u }); }
    const kmax = K.filter(q => q.u > L - 150).reduce((m, q) => Math.max(m, Math.abs(q.k)), 0);
    const Pf = R[R.length - 1], Pb = R[Math.max(0, R.length - 4)], ta = Math.atan2(Pf.y - Pb.y, Pf.x - Pb.x), tr = Math.atan2(N.cy - Pf.y, N.cx - Pf.x);
    let giro = 0, an0 = null; for (const q of R) { const d = Math.hypot(q.x - N.cx, q.y - N.cy); if (d < N.R * 0.99) continue; const an = Math.atan2(q.y - N.cy, q.x - N.cx); if (an0 !== null) giro += Math.abs(volta(an - an0)); an0 = an; }
    const fx = W.fixos.find(f => f.mod && f.idx === a.mod);
    return { id: a.id, ag: a.ag, mod: a.mod === undefined ? null : a.mod, L: Math.round(L), raioCurva: kmax ? 1 / kmax : null, chegada: Math.abs(volta(ta - tr)) * 180 / Math.PI, giro: giro * 180 / Math.PI,
      rt: Math.hypot(Pf.x - N.cx, Pf.y - N.cy), angT: Math.atan2(Pf.y - N.cy, Pf.x - N.cx), angM: fx ? fx.ang : null };
  });
  return { s, n: E.length, entrada: I.length, cruzamentos, pares: pares.slice(0, 8), sobre, sobrePares, por };
}"""


class Quieto(http.server.SimpleHTTPRequestHandler):
    def log_message(self, *a):
        pass


@unittest.skipIf(sync_playwright is None, "playwright não instalado")
class Tela(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.srv = http.server.ThreadingHTTPServer(("127.0.0.1", 0), functools.partial(Quieto, directory=str(INTERFACE)))
        threading.Thread(target=cls.srv.serve_forever, daemon=True).start()
        cls.url = "http://127.0.0.1:%d/index.html" % cls.srv.server_address[1]
        cls.pw = sync_playwright().start()
        try:
            cls.nav = cls.pw.chromium.launch()
        except Exception as e:  # sem Chromium
            cls.pw.stop()
            cls.srv.shutdown()
            raise unittest.SkipTest("sem Chromium: %s" % e)

    @classmethod
    def tearDownClass(cls):
        cls.nav.close()
        cls.pw.stop()
        cls.srv.shutdown()

    def abre(self, largura=1672, altura=941, query="", rota=None, dpr=1, celular=False, auto=True, estrito=True):
        ctx = self.nav.new_context(viewport={"width": largura, "height": altura}, device_scale_factor=dpr, has_touch=celular, is_mobile=celular)
        self.addCleanup(ctx.close)
        pg = ctx.new_page()
        pg.erros, pg.externas = [], []
        pg.on("console", lambda m: pg.erros.append(m.text) if m.type in ("error", "warning") else None)
        pg.on("pageerror", lambda e: pg.erros.append(str(e)))
        pg.on("request", lambda r: pg.externas.append(r.url) if not r.url.startswith("http://127.0.0.1:%d/" % self.srv.server_address[1]) else None)
        pg.add_init_script(PREPARA if estrito else PREPARA.replace("window.SF_TESTE = true;", "window.SF_TESTE = { estrito: false };"))
        if rota:
            pg.route("**/dados-ficticios.js", lambda r: r.fulfill(body=rota, content_type="text/javascript"))
        if not auto:                                   # desliga o ciclo automático NO INSTANTE em que a cena aparece, antes do primeiro quadro
            # (o primeiro quadro recebe como dt o tempo que a montagem levou: se ela passa de 1,2 s o primeiro pedido sai no segundo quadro, antes de qualquer
            # evaluate do teste; por isso o gancho fica no próprio setter de SF_CENA)
            pg.add_init_script("(() => { let c; Object.defineProperty(window, 'SF_CENA', { configurable: true, get() { return c; }, set(v) { c = v; try { v.automatico(false); } catch (e) {} } }); })();")
        pg.goto(self.url + query)
        pg.wait_for_function("() => window.SF_CENA")
        pg.wait_for_timeout(800)
        return pg

    def espera_repouso(self, pg, ms=25000):
        pg.wait_for_function("() => window.SF_CENA.parede().ramos.length === 0", timeout=ms)

    # ---------------------------------------------------------------------------------------------------------------- abrir
    def test_abre_sem_erro_e_sem_rede(self):
        pg = self.abre()
        self.assertEqual(pg.erros, [])
        self.assertEqual(pg.externas, [])
        self.assertEqual(pg.locator("#cena canvas.esfera").count(), 8)   # o Núcleo, seis agentes e a Corretora
        self.assertTrue(pg.locator("#selo").is_visible())
        self.assertIn("FICTÍCIOS", pg.locator("#selo").inner_text())
        self.assertEqual(pg.locator(".selo-preview").count(), 0)

    def test_sem_gancho_de_teste_nada_e_exposto(self):
        ctx = self.nav.new_context(viewport={"width": 1280, "height": 720})
        self.addCleanup(ctx.close)
        pg = ctx.new_page()
        erros = []
        pg.on("pageerror", lambda e: erros.append(str(e)))
        pg.goto(self.url)
        pg.wait_for_selector("#cena canvas")
        pg.wait_for_timeout(600)
        self.assertEqual(pg.evaluate("typeof window.SF_CENA"), "undefined")
        self.assertEqual(pg.evaluate("typeof window.SF_LIMPA"), "undefined")
        self.assertEqual(erros, [])

    def test_esferas_nao_se_sobrepoem_e_a_corretora_fica_ao_lado_do_robo(self):
        pg = self.abre()
        r = pg.evaluate("""() => { const E = window.SF_CENA.esferas(), k = Object.keys(E), o = [];
          for (let i = 0; i < k.length; i++) for (let j = i + 1; j < k.length; j++) { const a = E[k[i]], b = E[k[j]];
            if (Math.hypot(a.cx - b.cx, a.cy - b.cy) < a.R + b.R) o.push([k[i], k[j]]); } return o; }""")
        self.assertEqual(r, [])
        d = pg.evaluate("() => { const E = window.SF_CENA.esferas(); const c = E.corretora, r = E.robo, outros = Object.keys(E).filter(k => k !== 'corretora' && k !== 'robo'); "
                        "const dist = (a, b) => Math.hypot(a.cx - b.cx, a.cy - b.cy); return [dist(c, r), Math.min.apply(null, outros.map(k => dist(c, E[k])))]; }")
        self.assertLess(d[0], d[1], "a Corretora não é a vizinha mais perto do Robô")

    # ---------------------------------------------------------------------------------------------------------------- foco e lupa
    def test_nome_de_cada_esfera_recebe_o_clique_e_o_foco_volta(self):
        pg = self.abre()
        for id_ in AGENTES + ["nucleo"]:
            pg.get_by_text(NOMES[id_], exact=True).first.click()
            pg.wait_for_timeout(1100)
            self.assertEqual(pg.evaluate("() => window.SF_CENA.foco()"), id_)
            self.assertFalse(pg.locator(".voltar-cena").is_hidden())
            pg.keyboard.press("Escape")
            pg.wait_for_timeout(800)
            self.assertIsNone(pg.evaluate("() => window.SF_CENA.foco()"))
        self.assertEqual(pg.erros, [])

    def test_botoes_da_lupa(self):
        pg = self.abre()
        menos, mais, um = pg.locator(".lupa-ctl button").nth(0), pg.locator(".lupa-ctl button").nth(1), pg.locator(".lupa-ctl button").nth(2)
        self.assertTrue(menos.is_disabled())
        self.assertTrue(um.is_disabled())
        mais.click()                                   # sem foco, o + abre o Núcleo
        pg.wait_for_timeout(1000)
        self.assertEqual(pg.evaluate("() => window.SF_CENA.foco()"), "nucleo")
        self.assertFalse(menos.is_disabled())
        mais.click()
        pg.wait_for_timeout(500)
        self.assertGreater(pg.evaluate("() => window.SF_CENA.lupa().estado().z"), 1.5)
        um.click()
        pg.wait_for_timeout(500)
        self.assertLess(pg.evaluate("() => window.SF_CENA.lupa().estado().z"), 1.05)
        pg.locator(".voltar-cena").click()
        pg.wait_for_timeout(800)
        self.assertIsNone(pg.evaluate("() => window.SF_CENA.foco()"))
        self.assertEqual(pg.erros, [])

    # ---------------------------------------------------------------------------------------------------------------- o ciclo
    def test_cada_agente_pede_recebe_e_tudo_volta_ao_repouso(self):
        pg = self.abre(auto=False)
        pg.evaluate("""() => { const c = window.SF_CENA, E = c.esferas(); window.__c = {};
          AGENTES.forEach(id => { const n = E[id].n, r = n.receber, x = n.excitar;
            n.receber = function () { window.__c['recebe:' + id] = (window.__c['recebe:' + id] || 0) + 1; return r.apply(this, arguments); };
            n.excitar = function () { window.__c['pede:' + id] = (window.__c['pede:' + id] || 0) + 1; return x.apply(this, arguments); }; }); }""".replace("AGENTES", json.dumps(AGENTES)))
        for id_ in AGENTES:
            self.assertTrue(pg.evaluate("(id) => window.SF_CENA.pedir(id)", id_), "o pedido de %s foi recusado" % id_)
            pg.wait_for_function("(id) => (window.__c['recebe:' + id] || 0) >= 1", arg=id_, timeout=30000)
        self.espera_repouso(pg)
        pg.wait_for_timeout(2500)
        c = pg.evaluate("() => window.__c")
        for id_ in AGENTES:
            self.assertEqual(c.get("pede:" + id_), 1, id_)
            self.assertEqual(c.get("recebe:" + id_), c.get("pede:" + id_), "%s: cada pedido tem de ter uma resposta" % id_)
        self.assertEqual(pg.evaluate("() => window.SF_CENA.parede().ramos.length"), 0)
        self.assertEqual(pg.erros, [])

    def test_o_ciclo_automatico_roda_sem_erro(self):
        pg = self.abre()
        pg.wait_for_timeout(9000)
        self.assertEqual(pg.erros, [])
        pg.evaluate("() => window.SF_CENA.automatico(false)")
        self.espera_repouso(pg)

    def test_mudar_de_foco_no_meio_do_ciclo_nao_trava(self):
        pg = self.abre(auto=False)
        self.assertTrue(pg.evaluate("() => window.SF_CENA.pedir('robo')"))
        pg.wait_for_timeout(500)
        pg.get_by_text("FIIs", exact=True).first.click()
        pg.wait_for_timeout(1200)
        pg.keyboard.press("Escape")
        pg.wait_for_timeout(900)
        self.assertTrue(pg.evaluate("() => window.SF_CENA.pedir('fiis')"))
        pg.wait_for_timeout(1500)
        self.espera_repouso(pg)
        self.assertEqual(pg.erros, [])

    def test_pedidos_repetidos_nao_gastam_as_vagas_da_lista(self):
        # v0.5.0: cada módulo vira UM axônio e só os 4 primeiros pedidos DIFERENTES valem; repetir o mesmo módulo não pode empurrar os outros para fora da lista (antes a lista era cortada
        # em 12 ANTES de tirar os repetidos: 12 "telegram" seguidos de "internet" davam um axônio só). A leitura continua limitada (as 100 primeiras entradas), contra lista gigante.
        pg = self.abre(auto=False)
        dados = {"pedidos": {"radar": ["telegram"] * 12 + ["internet", "planilha"], "fiis": ["internet", "telegram"] * 20 + ["planilha"],
                             "robo": ["lixo"] * 500 + ["internet"], "cripto": ["internet", "internet", "telegram", "planilha", "painel", "backup", "salas"]}}
        limpo = pg.evaluate("(d) => window.SF_LIMPA(d)", dados)["pedidos"]
        self.assertEqual(limpo["radar"], ["telegram", "internet", "planilha"])
        self.assertEqual(limpo["fiis"], ["internet", "telegram", "planilha"])
        self.assertEqual(limpo["cripto"], ["internet", "telegram", "planilha", "painel", "backup", "salas"], "sem repetir; a cena é que fica com os 4 primeiros")
        self.assertNotIn("robo", limpo, "só lixo nas 100 primeiras entradas: a lista é descartada")

    # ---------------------------------------------------------------------------------------------------------------- dados
    # (v0.5.0: havia aqui duas funções com este mesmo nome; a segunda valia e a primeira era código morto, que saiu.)
    def test_dados_maliciosos_sao_ignorados(self):
        mau = "<img src=x onerror=window.__x=1>"
        dados = {"formato": 1, "ficticio": True, "estadoGeral": {"tom": "bom", "texto": mau},
                 "agentes": [{"id": "fiis", "estado": mau, "resumo": mau}, {"id": "intruso", "estado": "ok"}],
                 "pedidos": {"fiis": [mau, "internet", "modulo-que-nao-existe", {"x": 1}], "intruso": ["internet"], "__proto__": ["internet"],
                             "robo": "internet", "radar": ["telegram"] * 50}}
        pg = self.abre(rota="window.SF_DADOS = %s;" % json.dumps(dados), auto=False)
        self.assertEqual(pg.locator("img").count(), 0)
        self.assertIsNone(pg.evaluate("window.__x"))
        limpo = pg.evaluate("(d) => window.SF_LIMPA(d)", dados)
        self.assertEqual(limpo["pedidos"], {"fiis": ["internet"], "radar": ["telegram"]})     # só ids fixos e sem repetir; o resto foi descartado
        self.assertEqual(pg.evaluate("() => Object.keys(window.SF_LIMPA({ pedidos: JSON.parse('{\"__proto__\": [\"internet\"]}') }).pedidos)"), [])
        # o único módulo válido de "fiis" é a internet (índice 1 na lista fixa): ele ganha UM axônio, para ela; o texto malicioso, o id desconhecido e o módulo
        # inexistente foram descartados pela lista branca (se passassem, haveria axônio para outro módulo). Quem pede "radar" repete telegram 50 vezes: um só axônio.
        por = lambda ag: pg.evaluate("(ag) => window.SF_CENA.parede().eixos.filter(a => a.tipo === 'i' && a.ag === ag).map(a => a.id)", ag)
        self.assertEqual(por("fiis"), ["i-fiis#1"])
        self.assertEqual(por("radar"), ["i-radar#0"])
        self.assertFalse(pg.evaluate("() => window.SF_CENA.pedir('fiis', 0)"), "um módulo sem axônio do agente não pode ser pedido")
        self.assertTrue(pg.evaluate("() => window.SF_CENA.pedir('fiis', 1)"))
        self.assertTrue(pg.evaluate("() => window.SF_CENA.pedir('robo')"))      # sem pedidos válidos (texto em vez de lista), vale o único axônio dele (o módulo mais perto)
        pg.wait_for_timeout(500)
        pg.get_by_text("FIIs", exact=True).first.click()
        pg.wait_for_timeout(1200)
        pg.keyboard.press("Escape")
        pg.wait_for_timeout(900)
        self.assertTrue(pg.evaluate("() => window.SF_CENA.pedir('fiis')"))
        pg.wait_for_timeout(1500)
        self.espera_repouso(pg)
        self.assertEqual(pg.erros, [])

    def test_sem_dados_a_cena_abre(self):
        pg = self.abre(rota="window.SF_DADOS = null;")
        self.assertEqual(pg.locator("#cena canvas.esfera").count(), 8)
        self.assertEqual(pg.erros, [])

    def test_ficticio_obrigatorio_no_arquivo_de_dados(self):
        self.assertIn("ficticio: true", (INTERFACE / "dados-ficticios.js").read_text(encoding="utf-8"))

    # ---------------------------------------------------------------------------------------------------------------- leve e celular
    def test_modo_leve_desenha_bem_menos(self):
        def desenhos(query):
            pg = self.abre(query=query)
            pg.evaluate("window.__d = 0")
            pg.wait_for_timeout(1500)
            return pg.evaluate("window.__d")
        normal, leve = desenhos(""), desenhos("?leve=1")
        self.assertGreater(normal, 0)
        self.assertLess(leve * 2, normal, "modo leve %d, normal %d" % (leve, normal))

    def test_celular_em_paisagem_e_em_retrato(self):
        for l, a in ((844, 390), (390, 844)):
            pg = self.abre(l, a, dpr=3, celular=True, auto=False)
            self.assertEqual(pg.erros, [], "%dx%d" % (l, a))
            self.assertTrue(pg.evaluate("() => window.SF_CENA.pedir('fiis')"))
            pg.wait_for_timeout(1500)
            self.espera_repouso(pg)
            self.assertEqual(pg.erros, [], "%dx%d" % (l, a))

    # ---------------------------------------------------------------------------------------------------------------- falha contida e foto da porta (v0.4.2)
    def test_falha_numa_esfera_desliga_so_ela_e_avisa(self):
        pg = self.abre(auto=False, estrito=False)
        self.assertEqual(pg.locator("#aviso-falha").count(), 0, "o aviso só nasce na falha")
        self.assertEqual(pg.evaluate("() => window.SF.desligadas()"), [])
        pg.evaluate("""() => { const e = window.SF_CENA.esferas().fiis, n0 = e.n;
            e.n = Object.assign(Object.create(n0), { passo() { throw new Error('falha de teste'); }, desenhar() { throw new Error('falha de teste'); } }); }""")
        pg.wait_for_timeout(800)
        self.assertEqual(pg.evaluate("() => window.SF.desligadas()"), ["esfera:fiis"])
        self.assertEqual(pg.locator("#aviso-falha").count(), 1)
        self.assertIn("esfera:fiis", pg.locator("#aviso-falha").inner_text())
        self.assertTrue(all(e.startswith("parte desligada: esfera:fiis") for e in pg.erros if "falha de teste" in e or "parte desligada" in e), pg.erros)
        pg.evaluate("window.__d = 0")                                  # as outras esferas e a cena seguem
        self.assertTrue(pg.evaluate("() => window.SF_CENA.pedir('cripto')"))
        pg.wait_for_timeout(1500)
        self.espera_repouso(pg)
        self.assertGreater(pg.evaluate("window.__d"), 0)
        self.assertEqual(pg.evaluate("() => window.SF.desligadas()"), ["esfera:fiis"], "só a esfera com defeito saiu")

    def test_falha_num_orgao_desliga_so_o_orgao_daquela_esfera(self):
        pg = self.abre(auto=False, estrito=False)
        pg.evaluate("""() => { const c = window.SF_CENA.esferas().fiis.canvas.getContext('2d'); c.fill = function () { throw new Error('falha de teste'); }; }""")
        pg.evaluate("() => window.SF_CENA.pedir('fiis')")                 # os órgãos vivos só desenham quando há sinal: o pedido faz a excitação do corpo aparecer
        pg.wait_for_timeout(2500)
        caiu = pg.evaluate("() => window.SF.desligadas()")
        self.assertGreater(len(caiu), 0)
        self.assertTrue(all(n.startswith("fiis:") for n in caiu), caiu)      # só órgãos da esfera dos FIIs (não a esfera inteira, nem outra esfera)
        self.assertEqual(pg.locator("#aviso-falha").count(), 1)
        pg.evaluate("window.__d = 0")
        self.espera_repouso(pg)
        self.assertTrue(pg.evaluate("() => window.SF_CENA.pedir('cripto')"))
        pg.wait_for_timeout(1500)
        self.espera_repouso(pg)
        self.assertGreater(pg.evaluate("window.__d"), 0)
        self.assertEqual(pg.evaluate("() => window.SF.desligadas().filter(n => !n.startsWith('fiis:')).length"), 0, "nenhuma outra esfera caiu")

    def test_falha_ao_montar_a_cena_ainda_mostra_o_aviso(self):
        ctx = self.nav.new_context(viewport={"width": 1280, "height": 720})
        self.addCleanup(ctx.close)
        pg = ctx.new_page()
        pg.add_init_script(PREPARA.replace("window.SF_TESTE = true;", "window.SF_TESTE = { estrito: false };")
                           + " (() => { const g = HTMLCanvasElement.prototype.getContext; let n = 0; HTMLCanvasElement.prototype.getContext = function () { if (++n === 3) throw new Error('falha de teste'); return g.apply(this, arguments); }; })();")
        pg.goto(self.url)
        pg.wait_for_selector("#aviso-falha", timeout=10000)
        self.assertIn("desligada", pg.locator("#aviso-falha").inner_text())

    def test_foto_da_porta_so_muda_com_a_versao_da_porta(self):
        pg = self.abre(auto=False)
        foto = pg.evaluate("() => window.SF.portas()")
        ref_arq = REFERENCIAS / "portas.json"
        if os.environ.get("SF_GRAVAR_PORTAS"):
            ref_arq.write_text(json.dumps(foto, indent=1, sort_keys=True, ensure_ascii=False) + "\n", encoding="utf-8")
        ref = json.loads(ref_arq.read_text(encoding="utf-8"))
        self.assertEqual(sorted(foto), sorted(ref), "partes novas ou removidas: grave a foto com SF_GRAVAR_PORTAS=1 e diga na versão")
        for nome, atual in foto.items():
            antes = ref[nome]
            if atual["membros"] != antes["membros"] or atual["requer"] != antes["requer"] or atual["compativelDesde"] != antes["compativelDesde"]:
                self.assertGreater(atual["porta"], antes["porta"], "%s: a porta mudou (membros, dependências ou compativel-desde) sem subir `porta:` no PARTE; mude e grave a foto com SF_GRAVAR_PORTAS=1" % nome)
            self.assertGreaterEqual(atual["porta"], antes["porta"], nome)

    def test_sorteio_separado_por_pedaco_da_anatomia(self):
        pg = self.abre(auto=False)
        r = pg.evaluate("""() => {
          const C = window.SF.porta('neuronio/celula');
          const mk = (extra, sem) => { const cv = document.createElement('canvas'); cv.width = 900; cv.height = 700;
            const n = C.criar(cv, Object.assign({ cor: '#4aa8ff', semente: sem || 4242, leve: false, lupa: false, margem: 9, id: 't' }, extra));
            n.redimensionar(900, 700); const A = n.anatomia(); return { contorno: JSON.stringify(A.somaOutline), rams: A.dendriteBranches.map(b => JSON.stringify([b.level, !!b.extra, b.pts])) }; };
          const X1 = { ang: -1.2, comp: 40, larg: 2.4, nivel: 1 }, X2 = { ang: 1.2, comp: 36, larg: 2.2, nivel: 1 };
          return { base: mk({}), um: mk({ dendritosExtra: [X1] }), dois: mk({ dendritosExtra: [X1, X2] }), outra: mk({}, 777), gasto: mk({ gastarContorno: 7 }) };
        }""")
        sem = lambda o: [b for b in o["rams"] if '"extra"' not in b and ",true," not in b]
        extras = lambda o: [b for b in o["rams"] if ",true," in b]
        self.assertGreater(len(extras(r["um"])), 0, "o dendrito de contato não apareceu")
        self.assertEqual(r["um"]["contorno"], r["base"]["contorno"], "um dendrito de contato mexeu no contorno do corpo")
        self.assertEqual(sem(r["um"]), sem(r["base"]), "um dendrito de contato mexeu nos troncos primários")
        self.assertEqual(sem(r["dois"]), sem(r["base"]))
        n1 = len(extras(r["um"]))
        self.assertEqual(extras(r["dois"])[:n1], extras(r["um"]), "o segundo contato mexeu no primeiro")
        self.assertGreater(len(extras(r["dois"])), n1)
        self.assertNotEqual(r["outra"]["contorno"], r["base"]["contorno"], "outra semente tem de dar outro corpo")
        self.assertNotEqual(r["gasto"]["contorno"], r["base"]["contorno"], "gastar sorteios do contorno tem de mudar o contorno")
        self.assertEqual(r["gasto"]["rams"], r["base"]["rams"], "os dendritos dependem do sorteio do contorno do corpo")

    # ---------------------------------------------------------------------------------------------------------------- os módulos do Núcleo (v0.5.0)
    def test_modulos_do_nucleo_ficam_espalhados_em_volta_do_vidro(self):
        pg = self.abre(auto=False)
        angs = sorted(pg.evaluate("() => window.SF_CENA.parede().fixos.filter(f => f.mod).map(f => Math.round(f.ang * 180 / Math.PI))"))
        self.assertGreater(len(angs), 2)
        vazios = [(angs[(i + 1) % len(angs)] - a) % 360 for i, a in enumerate(angs)]
        self.assertLessEqual(max(vazios), 70, "há um vazio de %d° no vidro do Núcleo sem módulo (ângulos: %s)" % (max(vazios), angs))

    # ---------------------------------------------------------------------------------------------------------------- um axônio por módulo (v0.5.0)
    def modulos_pedidos(self, pg, ag):
        """Os módulos (índices) que o agente pede, na ordem dos dados, sem repetir e no máximo 4: o que a cena tem de desenhar para ele."""
        return pg.evaluate("""(ag) => { const ids = window.SF.porta('dados/limpa').MODULOS.map(m => m.id), lista = window.SF_LIMPA(window.SF_DADOS).pedidos[ag] || [], out = [];
          lista.forEach(id => { const i = ids.indexOf(id); if (i >= 0 && out.indexOf(i) < 0) out.push(i); }); return out.slice(0, 4); }""", ag)

    def axonios_de_entrada(self, pg, ag):
        return pg.evaluate("(ag) => window.SF_CENA.parede().eixos.filter(a => a.tipo === 'i' && a.ag === ag).map(a => ({ id: a.id, mod: a.mod === undefined ? null : a.mod }))", ag)

    def test_um_axonio_por_modulo_pedido_no_maximo_quatro_por_agente(self):
        pg = self.abre(auto=False)
        for id_ in AGENTES:
            esperados = self.modulos_pedidos(pg, id_)
            self.assertGreater(len(esperados), 0, id_)
            entrada = self.axonios_de_entrada(pg, id_)
            self.assertEqual(sorted(a["id"] for a in entrada), sorted("i-%s#%d" % (id_, m) for m in esperados), "%s: um axônio parado para cada módulo que ele pede" % id_)
            self.assertEqual(sorted(a["mod"] for a in entrada if a["mod"] is not None), sorted(esperados), id_)
            self.assertLessEqual(len(entrada), 4, id_)
            self.assertEqual(pg.evaluate("(ag) => window.SF_CENA.parede().eixos.filter(a => a.tipo === 'o' && a.ag === ag).length", id_), 1, "%s: um axônio violeta de volta" % id_)

    def test_o_agente_com_muitos_pedidos_ganha_so_os_quatro_primeiros(self):
        dados = {"formato": 1, "ficticio": True, "pedidos": {"fiis": MODULOS[:7], "robo": ["planilha", "planilha", "telegram", "internet", "painel", "mapa", "resumo"]}}
        pg = self.abre(rota="window.SF_DADOS = %s;" % json.dumps(dados), auto=False)
        self.assertEqual(sorted(a["mod"] for a in self.axonios_de_entrada(pg, "fiis")), [0, 1, 2, 3], "os 4 primeiros da lista: telegram, internet, planilha, painel")
        self.assertEqual(sorted(a["mod"] for a in self.axonios_de_entrada(pg, "robo")), [0, 1, 2, 3], "repetido não conta: planilha, telegram, internet, painel")
        self.assertFalse(pg.evaluate("() => window.SF_CENA.pedir('fiis', 4)"), "o quinto módulo da lista não tem axônio: não pode ser pedido")
        self.assertTrue(pg.evaluate("() => window.SF_CENA.pedir('fiis', 3)"))

    def test_sem_pedidos_cada_agente_ganha_um_axonio_para_o_modulo_mais_perto(self):
        for rota in ("window.SF_DADOS = null;", "window.SF_DADOS = { formato: 1, ficticio: true, pedidos: {} };"):
            pg = self.abre(rota=rota, auto=False)
            for id_ in AGENTES:
                perto = pg.evaluate("""(ag) => { const E = window.SF_CENA.esferas()[ag]; let melhor = null, dm = 1e18;
                  window.SF_CENA.parede().fixos.filter(f => f.mod).forEach(f => { const d = Math.hypot(f.pw.x - E.cx, f.pw.y - E.cy); if (d < dm) { dm = d; melhor = f.idx; } }); return melhor; }""", id_)
                entrada = self.axonios_de_entrada(pg, id_)
                self.assertEqual([a["mod"] for a in entrada], [perto], "%s (%s): sem pedidos, um axônio só, para o módulo mais perto" % (id_, rota[:30]))
            self.assertEqual(pg.erros, [])

    def test_terminais_do_mesmo_modulo_ficam_lado_a_lado_perto_do_modulo(self):
        m = self.geometria(1672, 941)
        por = {}
        for x in m["por"]:
            self.assertIsNotNone(x["mod"], "%s: o axônio de entrada não tem módulo" % x["id"])
            por.setdefault(x["mod"], []).append(x)
        vao = 26 * m["s"] + 4                          # o espaço de cada terminal no vidro (px): o mesmo de cena/rotas
        arco = lambda a, b, r: min(abs(a - b) % (2 * math.pi), 2 * math.pi - abs(a - b) % (2 * math.pi)) * r
        for mod, lista in por.items():
            for i, a in enumerate(lista):
                self.assertLessEqual(arco(a["angT"], a["angM"], a["rt"]), ((len(lista) - 1) / 2 + 0.15) * vao, "%s: o terminal pousou longe do módulo %d" % (a["id"], mod))
                for b in lista[i + 1:]:
                    self.assertGreaterEqual(arco(a["angT"], b["angT"], a["rt"]), 0.9 * vao, "%s e %s pousaram quase no mesmo ponto do módulo %d" % (a["id"], b["id"], mod))

    # ---------------------------------------------------------------------------------------------------------------- a forma dos axônios (v0.5.0)
    TAMANHOS = ((1672, 941), (844, 390), (390, 844))
    _geo = {}

    def geometria(self, largura, altura):
        """As medidas dos axônios (MEDE) com os dados fictícios, numa tela de largura×altura. A cena é determinística: cada tamanho é medido uma vez só."""
        if (largura, altura) not in Tela._geo:
            pg = self.abre(largura, altura, auto=False)
            self.assertEqual(pg.erros, [])
            Tela._geo[(largura, altura)] = pg.evaluate(MEDE)
        return Tela._geo[(largura, altura)]

    def test_axonios_chegam_de_frente_ao_vidro_e_sem_quina(self):
        for l, a in self.TAMANHOS:
            m = self.geometria(l, a)
            self.assertGreater(m["entrada"], 5)
            for x in m["por"]:
                self.assertLessEqual(x["chegada"], 5, "%s (%dx%d): chega torto, %.1f° fora da direção do centro do Núcleo" % (x["id"], l, a, x["chegada"]))
                self.assertGreaterEqual(x["raioCurva"] or 1e9, 25 * m["s"], "%s (%dx%d): quina nos últimos 150 px (raio de curva de %.1f px)" % (x["id"], l, a, x["raioCurva"] or 0))

    def test_nenhum_axonio_passa_de_uma_volta_e_meia_em_torno_do_nucleo(self):
        for l, a in self.TAMANHOS:
            m = self.geometria(l, a)
            for x in m["por"]:
                self.assertLessEqual(x["giro"], 205, "%s (%dx%d): deu %d° em volta do Núcleo (o caminho reto é o preferido)" % (x["id"], l, a, x["giro"]))

    def test_axonios_nao_correm_um_em_cima_do_outro(self):
        for l, a in self.TAMANHOS:
            m = self.geometria(l, a)
            self.assertLessEqual(m["sobre"], 15, "%dx%d: axônios correm juntos por %.1f larguras de linha: %s" % (l, a, m["sobre"], m["sobrePares"]))

    def test_teto_de_cruzamentos_entre_os_axonios(self):
        for l, a in self.TAMANHOS:
            m = self.geometria(l, a)
            self.assertGreater(m["n"], 12, "%dx%d: faltam axônios" % (l, a))
            self.assertLessEqual(m["cruzamentos"], 100, "%dx%d: %d cruzamentos (%s...)" % (l, a, m["cruzamentos"], m["pares"][:4]))

    def test_com_o_maximo_de_pedidos_so_informa_e_confere_o_que_vale_sempre(self):
        # O máximo é 4 módulos por agente: 6 agentes dão 24 axônios de entrada + 6 violetas = 30. Os tetos de cruzamentos (100) e de trechos juntos (15 larguras) valem para os dados
        # de teste (19 entradas) e NÃO para este caso: aqui só se informa (v0.5.0, achado da auditoria: os números de 19 entradas não valem para 24). Vale sempre: sem erro, 30 axônios,
        # chegada de frente ao vidro, sem quina na ponta e nenhum axônio dando mais de uma volta e meia em torno do Núcleo.
        ped = {a: [MODULOS[(i * 2 + k) % len(MODULOS)] for k in range(4)] for i, a in enumerate(AGENTES)}
        rota = "window.SF_DADOS = %s;" % json.dumps({"formato": 1, "ficticio": True, "pedidos": ped})
        for l, a in ((1672, 941), (844, 390), (390, 844)):
            abre = min(self.tempo_de_abertura(l, a, rota) for _ in range(3))                  # o mesmo jeito de medir do teste de abertura rápida
            pg = self.abre(l, a, rota=rota, auto=False)
            self.assertEqual(pg.erros, [])
            m = pg.evaluate(MEDE)
            self.assertEqual((m["n"], m["entrada"]), (30, 24), "%dx%d: com 4 módulos por agente são 24 entradas e 6 violetas" % (l, a))
            for x in m["por"]:
                self.assertLessEqual(x["chegada"], 5, "%s (%dx%d): chega torto, %.1f°" % (x["id"], l, a, x["chegada"]))
                self.assertGreaterEqual(x["raioCurva"] or 1e9, 25 * m["s"], "%s (%dx%d): quina nos últimos 150 px" % (x["id"], l, a))
                self.assertLessEqual(x["giro"], 205, "%s (%dx%d): deu %d° em volta do Núcleo" % (x["id"], l, a, x["giro"]))
            print("\n  24 entradas %dx%d (só informação): abre em %.2f s (melhor de 3), %d cruzamentos, trechos juntos até %.1f larguras de linha, giro máximo %d°"
                  % (l, a, abre, m["cruzamentos"], m["sobre"], max(x["giro"] for x in m["por"])))

    # ---------------------------------------------------------------------------------------------------------------- o pedido no axônio do módulo (v0.5.0)
    def test_o_pedido_corre_no_axonio_do_modulo_acende_o_modulo_e_volta_pelo_violeta(self):
        pg = self.abre(auto=False)
        mods = [a["mod"] for a in self.axonios_de_entrada(pg, "fiis")]
        self.assertGreater(len(mods), 1)
        m, sem = mods[1], [i for i in range(len(MODULOS)) if i not in mods][0]
        self.assertFalse(pg.evaluate("(m) => window.SF_CENA.pedir('fiis', m)", sem), "um módulo sem axônio dele não pode ser pedido")
        pg.evaluate("""() => { const c = window.SF_CENA, E = c.esferas(); window.__v = { minis: [], pulsos: {}, recebe: 0 };
          const x = E.nucleo.n.excitarMini; E.nucleo.n.excitarMini = function (i) { window.__v.minis.push(i); return x.apply(this, arguments); };
          const r = E.fiis.n.receber; E.fiis.n.receber = function () { window.__v.recebe++; return r.apply(this, arguments); };
          window.__poll = setInterval(() => c.parede().eixos.forEach(a => { if (a.pulso) window.__v.pulsos[a.id] = 1; }), 20); }""")
        self.assertTrue(pg.evaluate("(m) => window.SF_CENA.pedir('fiis', m)", m))
        pg.wait_for_function("() => window.__v.recebe >= 1", timeout=30000)
        self.espera_repouso(pg)
        pg.wait_for_timeout(800)
        v = pg.evaluate("() => window.__v")
        self.assertEqual(sorted(v["pulsos"]), sorted(["i-fiis#%d" % m, "o-fiis"]), "o pulso só corre no axônio do módulo pedido e na volta violeta")
        self.assertEqual(v["minis"], [m], "só o módulo pedido acende")
        self.assertEqual(pg.evaluate("() => window.SF_CENA.parede().eixos.filter(a => a.pulso).length"), 0)
        self.assertEqual(pg.erros, [])

    def test_falha_no_ajuste_fino_do_axonio_desliga_so_o_caminho_e_o_axonio_fica_no_esboco(self):
        pg = self.abre(auto=False, estrito=False)
        antes = pg.evaluate("() => window.SF_CENA.parede().eixos.find(a => a.tipo === 'i' && a.ag === 'cripto').pts.length")
        pg.evaluate("() => { const a = window.SF_CENA.parede().eixos.find(a => a.tipo === 'i' && a.ag === 'cripto'); a.obst = 5; a.sujoG = true; }")   # uma lista de obstáculos inválida: o ajuste fino dá erro
        pg.wait_for_timeout(800)
        self.assertEqual(pg.evaluate("() => window.SF.desligadas()"), ["ligacoes/caminho"])
        self.assertEqual(pg.locator("#aviso-falha").count(), 1)
        depois = pg.evaluate("() => window.SF_CENA.parede().eixos.find(a => a.tipo === 'i' && a.ag === 'cripto').pts.length")
        self.assertGreater(depois, 10, "o axônio sumiu em vez de ficar no esboço")
        self.assertGreater(depois, antes * 0.3)
        self.assertTrue(pg.evaluate("() => window.SF_CENA.pedir('fiis')"))
        pg.wait_for_timeout(1500)
        self.espera_repouso(pg)
        self.assertEqual(pg.evaluate("() => window.SF.desligadas()"), ["ligacoes/caminho"], "só o ajuste fino caiu")

    # ---------------------------------------------------------------------------------------------------------------- as duas curvas puras (v0.5.0)
    def test_curvas_chegada_desce_sem_voltar_e_termina_de_frente(self):
        pg = self.abre(auto=False)
        r = pg.evaluate("""() => {
          const C = window.SF.porta('comum/curvas'); if (typeof C.chegada !== 'function') return null;
          const cx = 500, cy = 400, rE = 200, graus = (a, b) => { let d = Math.abs(a - b); while (d > Math.PI) d = Math.abs(d - 2 * Math.PI); return d * 180 / Math.PI; };
          return [[330, 0.2, 0.9, 1], [300, 1.0, 1.9, 1], [320, -0.5, -1.4, -1], [280, 2.0, 2.2, 1]].map(([rA, aA, aE, sg]) => {
            const A = { x: cx + rA * Math.cos(aA), y: cy + rA * Math.sin(aA) }, E = { x: cx + rE * Math.cos(aE), y: cy + rE * Math.sin(aE) }, tA = { x: -sg * Math.sin(aA), y: sg * Math.cos(aA) };
            const P = C.chegada(cx, cy, A, tA, E, 40, 14), Q = C.chegada(cx, cy, A, tA, E, 400, 14), pr = [A].concat(P);
            let sobe = 0, recua = 0, entra = 0;
            for (let i = 1; i < pr.length; i++) {
              const r0 = Math.hypot(pr[i - 1].x - cx, pr[i - 1].y - cy), r1 = Math.hypot(pr[i].x - cx, pr[i].y - cy);
              if (r1 > r0 + 0.05) sobe++; if (r1 < rE - 0.05) entra++;
              let da = Math.atan2(pr[i].y - cy, pr[i].x - cx) - Math.atan2(pr[i - 1].y - cy, pr[i - 1].x - cx); while (da > Math.PI) da -= 2 * Math.PI; while (da < -Math.PI) da += 2 * Math.PI;
              if (sg * da < -1e-3) recua++;
            }
            const u = P[P.length - 1], w = P[P.length - 2];
            return { n: P.length, fim: Math.hypot(u.x - E.x, u.y - E.y), sobe, recua, entra,
              chegada: graus(Math.atan2(u.y - w.y, u.x - w.x), Math.atan2(cy - u.y, cx - u.x)), saida: graus(Math.atan2(Q[0].y - A.y, Q[0].x - A.x), Math.atan2(tA.y, tA.x)) };
          }); }""")
        self.assertIsNotNone(r, "comum/curvas ainda não tem a função chegada")
        for c in r:
            self.assertEqual(c["n"], 40)
            self.assertLess(c["fim"], 1e-6, "a curva não termina no ponto do terminal")
            self.assertEqual(c["sobe"], 0, "o raio voltou a subir no meio da chegada")
            self.assertEqual(c["recua"], 0, "o ângulo recuou no meio da chegada")
            self.assertEqual(c["entra"], 0, "a curva entrou no vidro antes do terminal")
            self.assertLessEqual(c["chegada"], 2, "a chegada não é de frente para o centro")
            self.assertLessEqual(c["saida"], 5, "a curva não continua a direção em que o caminho vinha (quina na emenda)")

    def test_curvas_ponte_sai_e_chega_nas_direcoes_pedidas_sem_passar_dos_raios(self):
        pg = self.abre(auto=False)
        r = pg.evaluate("""() => {
          const C = window.SF.porta('comum/curvas'); if (typeof C.ponte !== 'function') return null;
          const cx = 500, cy = 400, graus = (a, b) => { let d = Math.abs(a - b); while (d > Math.PI) d = Math.abs(d - 2 * Math.PI); return d * 180 / Math.PI; };
          const un = (x, y) => { const l = Math.hypot(x, y); return { x: x / l, y: y / l }; };
          // [raio de A, ângulo de A, raio de B, ângulo de B, sentido da volta, inclinação da saída para o lado em que o raio vai]. Nos dois últimos casos os raios são quase
          // iguais e a saída pedida é bem inclinada: seguir a direção pedida faria a ponte passar dos raios, então a trava de Fritsch-Carlson a endireita (nesses, só se confere
          // que não passa dos raios e não recua; nos outros três a direção pedida é seguida)
          return [[450, 0.3, 300, 0.8, 1, 0.3], [260, 1.2, 380, 1.9, 1, 0.3], [430, -0.4, 310, -1.1, -1, 0.3], [450, 0.3, 430, 1.1, 1, 0.8], [300, 2.0, 310, 2.9, 1, 0.8]].map(([rA, aA, rB, aB, sg, tilt], k) => {
            const A = { x: cx + rA * Math.cos(aA), y: cy + rA * Math.sin(aA) }, B = { x: cx + rB * Math.cos(aB), y: cy + rB * Math.sin(aB) }, vai = rB < rA ? -1 : 1;
            // as direções: a de rumo ao sentido da volta, inclinada para o lado em que o raio vai (consistente com a ponte)
            const tA = un(-sg * Math.sin(aA) + vai * tilt * Math.cos(aA), sg * Math.cos(aA) + vai * tilt * Math.sin(aA)), tB = un(-sg * Math.sin(aB), sg * Math.cos(aB));
            const P = C.ponte(cx, cy, A, tA, B, tB, 300), pr = [A].concat(P), lo = Math.min(rA, rB) - 0.05, hi = Math.max(rA, rB) + 0.05;
            let fora = 0, recua = 0;
            for (let i = 1; i < pr.length; i++) {
              const r1 = Math.hypot(pr[i].x - cx, pr[i].y - cy); if (r1 < lo || r1 > hi) fora++;
              let da = Math.atan2(pr[i].y - cy, pr[i].x - cx) - Math.atan2(pr[i - 1].y - cy, pr[i - 1].x - cx); while (da > Math.PI) da -= 2 * Math.PI; while (da < -Math.PI) da += 2 * Math.PI;
              if (sg * da < -1e-3) recua++;
            }
            const u = P[P.length - 1], w = P[P.length - 2];
            return { n: P.length, fim: Math.hypot(u.x - B.x, u.y - B.y), fora, recua, segue: k < 3, saida: graus(Math.atan2(P[0].y - A.y, P[0].x - A.x), Math.atan2(tA.y, tA.x)), chegada: graus(Math.atan2(u.y - w.y, u.x - w.x), Math.atan2(tB.y, tB.x)) };
          }); }""")
        self.assertIsNotNone(r, "comum/curvas ainda não tem a função ponte")
        for c in r:
            self.assertEqual(c["n"], 300)
            self.assertLess(c["fim"], 1e-6, "a ponte não termina no ponto B")
            self.assertEqual(c["fora"], 0, "a ponte passou dos raios dos dois pontos (mergulho)")
            self.assertEqual(c["recua"], 0, "o ângulo recuou no meio da ponte")
            if c["segue"]:
                self.assertLessEqual(c["saida"], 6, "a ponte não sai na direção pedida")
                self.assertLessEqual(c["chegada"], 6, "a ponte não chega na direção pedida")

    # ---------------------------------------------------------------------------------------------------------------- o tempo de abertura (v0.5.0)
    def tempo_de_abertura(self, largura, altura, rota=None):
        ctx = self.nav.new_context(viewport={"width": largura, "height": altura})
        self.addCleanup(ctx.close)
        pg = ctx.new_page()
        pg.add_init_script(PREPARA)
        if rota:
            pg.route("**/dados-ficticios.js", lambda r: r.fulfill(body=rota, content_type="text/javascript"))
        t0 = time.perf_counter()
        pg.goto(self.url)
        pg.wait_for_function("() => window.SF_CENA", timeout=120000)
        t = time.perf_counter() - t0
        pg.close()
        return t

    def test_a_cena_abre_rapido_com_dados_e_sem_dados(self):
        # Um axônio por módulo não pode deixar a tela lenta. A primeira abertura esquenta o Chromium e fica de fora; vale a MELHOR de 5 (a máquina da nuvem varia até ~40% de uma hora
        # para outra: a mesma versão abriu em 1,1 s numa hora e em 1,3 s noutra; o melhor de 5 mede o código, não o momento da máquina).
        self.tempo_de_abertura(1672, 941)
        for l, a, lim in ((1672, 941, 1.5), (844, 390, 1.0)):
            melhor = min(self.tempo_de_abertura(l, a) for _ in range(5))
            self.assertLess(melhor, lim, "%dx%d: a cena levou %.2f s para abrir (limite %.1f s)" % (l, a, melhor, lim))
        melhor = min(self.tempo_de_abertura(1672, 941, "window.SF_DADOS = null;") for _ in range(5))
        self.assertLess(melhor, 1.5, "sem dados: a cena levou %.2f s para abrir (limite 1,5 s)" % melhor)

    def test_fps_so_informa(self):
        pg = self.abre()
        fps = pg.evaluate("() => new Promise(r => { let n = 0, t0 = performance.now(); function f() { n++; if (performance.now() - t0 > 2000) r(Math.round(n / 2)); else requestAnimationFrame(f); } requestAnimationFrame(f); })")
        print("\n  fps medido (sem placa de vídeo, só informação): %s" % fps)


if __name__ == "__main__":
    unittest.main(verbosity=2)
