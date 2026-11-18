#!/usr/bin/env python3
"""Teste de navegador da tela da engine (só na nuvem; precisa do playwright do Python e de um Chromium, senão é pulado).

    python3 testes/navegador.py

Serve a pasta interface/ num servidor local e confere: abre sem erro, nenhuma requisição sai para fora, todas as caixas aparecem em duas
telas, o modo leve desenha bem menos, texto malicioso vira texto (nunca HTML) e o detalhe do agente abre e fecha.
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
CAIXAS = [".topo", ".esq", ".tarefas", ".avisos", ".bx .logs", ".bx .dest", ".bx .stat", ".rp", ".selo", ".nr.centro", ".satelite"]
CONTA_DESENHOS = "(() => { window.__d = 0; const o = CanvasRenderingContext2D.prototype.drawImage; CanvasRenderingContext2D.prototype.drawImage = function () { window.__d++; return o.apply(this, arguments); }; })();"


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

    def abre(self, largura=1672, altura=941, query="", rota=None):
        pg = self.nav.new_page(viewport={"width": largura, "height": altura})
        self.addCleanup(pg.close)
        pg.erros, pg.externas = [], []
        pg.on("console", lambda m: pg.erros.append(m.text) if m.type in ("error", "warning") else None)
        pg.on("pageerror", lambda e: pg.erros.append(str(e)))
        pg.on("request", lambda r: pg.externas.append(r.url) if not r.url.startswith("http://127.0.0.1:%d/" % self.srv.server_address[1]) else None)
        pg.add_init_script(CONTA_DESENHOS)
        if rota:
            pg.route("**/dados-ficticios.js", lambda r: r.fulfill(body=rota, content_type="text/javascript"))
        pg.goto(self.url + query)
        pg.wait_for_selector(".nr canvas")
        pg.wait_for_timeout(800)
        return pg

    def test_abre_sem_erro_e_sem_rede(self):
        pg = self.abre()
        self.assertEqual(pg.erros, [])
        self.assertEqual(pg.externas, [])
        self.assertEqual(pg.locator(".nr canvas").count(), 7)   # o Núcleo e seis agentes
        self.assertTrue(pg.locator("#selo").is_visible())
        self.assertIn("FICTÍCIOS", pg.locator("#selo").inner_text())

    def test_todas_as_caixas_cabem_em_duas_telas(self):
        for l, a in ((1920, 1080), (1366, 768)):
            pg = self.abre(l, a)
            for sel in CAIXAS:
                caixa = pg.locator(sel).first.bounding_box()
                self.assertIsNotNone(caixa, "%s sumiu em %dx%d" % (sel, l, a))
                self.assertGreaterEqual(caixa["x"], -1, sel)
                self.assertGreaterEqual(caixa["y"], -1, sel)
                self.assertLessEqual(caixa["x"] + caixa["width"], l + 1, "%s passa da largura em %dx%d" % (sel, l, a))
                self.assertLessEqual(caixa["y"] + caixa["height"], a + 1, "%s passa da altura em %dx%d" % (sel, l, a))

    def test_modo_leve_desenha_bem_menos(self):
        def desenhos(query):
            pg = self.abre(query=query)
            pg.evaluate("window.__d = 0")
            pg.wait_for_timeout(1500)
            return pg.evaluate("window.__d")
        normal, leve = desenhos(""), desenhos("?leve=1")
        self.assertGreater(normal, 0)
        self.assertLess(leve * 3, normal, "modo leve %d, normal %d" % (leve, normal))
        pg = self.abre(query="?leve=1")
        self.assertEqual(pg.locator("button.leve").get_attribute("aria-pressed"), "true")

    def test_botao_do_modo_leve_liga_e_desliga(self):
        pg = self.abre(query="?leve=0")
        botao = pg.locator("button.leve")
        self.assertEqual(botao.get_attribute("aria-pressed"), "false")
        botao.click()
        self.assertEqual(botao.get_attribute("aria-pressed"), "true")
        botao.click()
        self.assertEqual(botao.get_attribute("aria-pressed"), "false")
        self.assertEqual(pg.erros, [])

    def test_texto_malicioso_vira_texto(self):
        mau = "<img src=x onerror=window.__x=1>"
        dados = {"formato": 1, "ficticio": True, "estadoGeral": {"tom": "bom", "texto": mau},
                 "agentes": [{"id": "fiis", "estado": "ok", "ultima": "11:00", "proxima": "12:00", "resumo": mau, "contagens": {"noticias": 1}},
                             {"id": "intruso", "estado": "ok"}],
                 "tarefas": [{"agente": "fiis", "texto": mau, "estado": "andamento", "hora": "11:00"}],
                 "logs": [{"hora": "11:00", "agente": "fiis", "texto": mau}],
                 "destaque": {"agente": "fiis", "titulo": mau, "linhas": [mau]}}
        pg = self.abre(rota="window.SF_DADOS = %s;" % json.dumps(dados))
        self.assertEqual(pg.locator("img").count(), 0)
        self.assertIsNone(pg.evaluate("window.__x"))
        self.assertIn("<img", pg.locator(".topo").inner_text())
        self.assertEqual(pg.locator(".esq .ln").count(), 6)     # só os seis agentes da lista fixa; o "intruso" foi ignorado
        self.assertEqual(pg.erros, [])

    def test_detalhe_do_agente_abre_e_fecha(self):
        pg = self.abre()
        pg.locator(".esq .ln").first.click()
        self.assertIn("Última rodada", pg.locator(".esq").inner_text())
        pg.keyboard.press("Escape")
        self.assertIn("6 agentes", pg.locator(".esq").inner_text())
        pg.locator(".nr:not(.centro)").first.click()
        self.assertIn("Próxima rodada", pg.locator(".esq").inner_text())
        pg.locator(".esq .volta").click()
        self.assertIn("6 agentes", pg.locator(".esq").inner_text())
        self.assertEqual(pg.erros, [])


    def test_nome_de_cada_agente_aparece_e_recebe_o_clique(self):
        pg = self.abre()
        for i in range(6):
            wrap = pg.locator(".nr:not(.centro)").nth(i)
            rot = wrap.locator(".rot").bounding_box()
            x, y = rot["x"] + rot["width"] / 2, rot["y"] + rot["height"] / 2
            topo = pg.evaluate("([x, y]) => { const e = document.elementFromPoint(x, y); const b = e && e.closest('.nr'); return b ? b.getAttribute('aria-label') : null; }", [x, y])
            self.assertEqual(topo, wrap.get_attribute("aria-label"), "algo cobre o nome do agente %d" % i)
            pg.mouse.click(x, y)
            self.assertEqual(pg.locator(".nr.sel").count(), 1, "o clique no nome do agente %d não abriu o detalhe" % i)
            pg.keyboard.press("Escape")
        self.assertEqual(pg.erros, [])


if __name__ == "__main__":
    unittest.main(verbosity=2)
