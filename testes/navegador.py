#!/usr/bin/env python3
"""Teste de navegador da tela da engine (só na nuvem; precisa do playwright do Python e de um Chromium, senão é pulado).

    python3 testes/navegador.py

Serve a pasta interface/ num servidor local e confere a cena: abre sem erro e sem rede, o selo de dados fictícios, o foco por nome e a lupa,
o ciclo do pedido (cada agente pede e recebe, tudo volta ao repouso), as esferas sem sobreposição, texto e ids maliciosos nos dados,
o modo leve e o celular. O fps só é informado (ele depende da máquina), nunca reprova.
Os scripts da página só expõem a cena (window.SF_CENA) se window.SF_TESTE existir antes deles; a tela de verdade não expõe nada.
"""
import functools
import http.server
import json
import pathlib
import threading
import unittest

try:
    from playwright.sync_api import sync_playwright
except Exception:  # sem playwright: tudo pulado
    sync_playwright = None

INTERFACE = pathlib.Path(__file__).resolve().parent.parent / "interface"
AGENTES = ["cripto", "acoes-etfs", "fiis", "robo", "seguranca", "radar"]
NOMES = {"cripto": "Cripto", "acoes-etfs": "Ações e ETFs", "fiis": "FIIs", "robo": "Robô", "seguranca": "Segurança", "radar": "Radar", "nucleo": "Sexta-Feira"}
PREPARA = "window.SF_TESTE = true; window.__d = 0; (() => { const o = CanvasRenderingContext2D.prototype.drawImage; CanvasRenderingContext2D.prototype.drawImage = function () { window.__d++; return o.apply(this, arguments); }; })();"


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

    def abre(self, largura=1672, altura=941, query="", rota=None, dpr=1, celular=False, auto=True):
        ctx = self.nav.new_context(viewport={"width": largura, "height": altura}, device_scale_factor=dpr, has_touch=celular, is_mobile=celular)
        self.addCleanup(ctx.close)
        pg = ctx.new_page()
        pg.erros, pg.externas = [], []
        pg.on("console", lambda m: pg.erros.append(m.text) if m.type in ("error", "warning") else None)
        pg.on("pageerror", lambda e: pg.erros.append(str(e)))
        pg.on("request", lambda r: pg.externas.append(r.url) if not r.url.startswith("http://127.0.0.1:%d/" % self.srv.server_address[1]) else None)
        pg.add_init_script(PREPARA)
        if rota:
            pg.route("**/dados-ficticios.js", lambda r: r.fulfill(body=rota, content_type="text/javascript"))
        pg.goto(self.url + query)
        pg.wait_for_function("() => window.SF_CENA")
        if not auto:                                   # desliga o ciclo automático antes do primeiro pedido (o primeiro sai com ~1,2 s de cena)
            pg.evaluate("() => window.SF_CENA.automatico(false)")
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

    # ---------------------------------------------------------------------------------------------------------------- dados
    def test_dados_maliciosos_sao_ignorados(self):
        mau = "<img src=x onerror=window.__x=1>"
        dados = {"formato": 1, "ficticio": True, "estadoGeral": {"tom": "bom", "texto": mau},
                 "agentes": [{"id": "fiis", "estado": mau, "resumo": mau}, {"id": "intruso", "estado": "ok"}],
                 "pedidos": {"fiis": [mau, "internet", "modulo-que-nao-existe", {"x": 1}], "intruso": ["internet"], "__proto__": ["internet"],
                             "robo": "internet", "radar": ["telegram"] * 50}}
        pg = self.abre(rota="window.SF_DADOS = %s;" % json.dumps(dados), auto=False)
        self.assertEqual(pg.locator("img").count(), 0)
        self.assertIsNone(pg.evaluate("window.__x"))
        self.assertTrue(pg.evaluate("() => window.SF_CENA.pedir('fiis')"))
        self.assertTrue(pg.evaluate("() => window.SF_CENA.pedir('robo')"))      # sem pedidos válidos, vale qualquer módulo
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

    def test_fps_so_informa(self):
        pg = self.abre()
        fps = pg.evaluate("() => new Promise(r => { let n = 0, t0 = performance.now(); function f() { n++; if (performance.now() - t0 > 2000) r(Math.round(n / 2)); else requestAnimationFrame(f); } requestAnimationFrame(f); })")
        print("\n  fps medido (sem placa de vídeo, só informação): %s" % fps)


if __name__ == "__main__":
    unittest.main(verbosity=2)
