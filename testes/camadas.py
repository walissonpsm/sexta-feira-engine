#!/usr/bin/env python3
"""Sexta-Feira Engine: uma parte quebrada de cada vez (v0.4.3). Só na nuvem (precisa de playwright e Chromium; sem eles tudo é pulado).

Para cada parte registrada no carregador, a página abre com SF_TESTE = { estrito: false, quebrar: '<parte>' }: o carregador faz aquela
parte falhar ao montar. Confere que:
  1. caem exatamente ela e quem depende dela (direta ou indiretamente, pelo `requer`), e mais nenhuma;
  2. o aviso na tela (#aviso-falha) aparece (a parte tela/aviso não depende de ninguém);
  3. a página não tem erro solto (só os console.error "parte desligada: ..." do próprio carregador).
Também imprime (só informação) o tempo que cada parte gasta em ~4 s de cena (SF_TESTE = { medir: true }); nunca reprova por tempo.

Uso: python3 testes/camadas.py           (todas)      python3 testes/camadas.py -k neuronio/minis   (uma)
"""
import functools
import http.server
import pathlib
import threading
import unittest

try:
    from playwright.sync_api import sync_playwright
except Exception:  # sem playwright: tudo pulado
    sync_playwright = None

INTERFACE = pathlib.Path(__file__).resolve().parent.parent / "interface"


class Quieto(http.server.SimpleHTTPRequestHandler):
    def log_message(self, *a):
        pass


def nome_da(requer):
    return requer.split("@")[0]


def esperadas(quebrada, portas):
    """A parte quebrada e todas que dependem dela, direta ou indiretamente."""
    mortas = {quebrada}
    mudou = True
    while mudou:
        mudou = False
        for nome, p in portas.items():
            if nome not in mortas and any(nome_da(r) in mortas for r in p["requer"]):
                mortas.add(nome)
                mudou = True
    return mortas


@unittest.skipIf(sync_playwright is None, "playwright não instalado")
class Camadas(unittest.TestCase):
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

    def pagina(self, teste_js, espera=1500):
        ctx = self.nav.new_context(viewport={"width": 1280, "height": 720})
        self.addCleanup(ctx.close)
        pg = ctx.new_page()
        pg.erros, pg.externas = [], []
        pg.on("console", lambda m: pg.erros.append(m.text) if m.type in ("error", "warning") else None)
        pg.on("pageerror", lambda e: pg.erros.append("pageerror: %s" % e))
        pg.on("request", lambda r: pg.externas.append(r.url) if not r.url.startswith("http://127.0.0.1:%d/" % self.srv.server_address[1]) else None)
        pg.add_init_script("window.SF_TESTE = %s;" % teste_js)
        pg.goto(self.url)
        pg.wait_for_timeout(espera)
        return pg

    def portas(self):
        pg = self.pagina("{ estrito: false }", espera=500)
        return pg.evaluate("() => window.SF.portas()")

    def test_cada_parte_quebrada_derruba_so_quem_depende_dela(self):
        portas = self.portas()
        js = [d.parent.parent.name + "/" + d.parent.name for d in (INTERFACE.parent / "fonte").glob("*/*/PARTE") if "\ntipo:" not in "\n" + d.read_text(encoding="utf-8")]
        self.assertEqual(sorted(portas), sorted(js), "as partes registradas no carregador têm de ser as partes js de fonte/")
        for nome in sorted(portas):
            with self.subTest(parte=nome):
                pg = self.pagina("{ estrito: false, quebrar: %r }" % nome)
                caiu = set(pg.evaluate("() => window.SF.desligadas()"))
                esperado = esperadas(nome, portas)
                self.assertEqual(caiu, esperado, "quebrando %s: caíram %s, era esperado %s" % (nome, sorted(caiu), sorted(esperado)))
                if nome != "tela/aviso":                       # quebrando o próprio aviso não há quem avise (só o console.error do carregador)
                    self.assertEqual(pg.locator("#aviso-falha").count(), 1, "sem aviso na tela quebrando %s" % nome)
                else:
                    self.assertEqual(pg.locator("#aviso-falha").count(), 0)
                soltos = [e for e in pg.erros if not e.startswith("parte desligada")]
                self.assertEqual(soltos, [], "erro solto quebrando %s" % nome)
                self.assertEqual(pg.externas, [])

    def test_sem_quebrar_nada_nao_cai_parte_nenhuma(self):
        pg = self.pagina("{ estrito: false }")
        self.assertEqual(pg.evaluate("() => window.SF.desligadas()"), [])
        self.assertEqual(pg.locator("#aviso-falha").count(), 0)
        self.assertEqual(pg.erros, [])

    def test_tempo_por_parte_so_informa(self):
        pg = self.pagina("{ medir: true }", espera=4000)
        tempos = pg.evaluate("() => window.SF.tempos()")
        self.assertGreater(len(tempos), 0)
        linhas = sorted(tempos.items(), key=lambda kv: -kv[1]["ms"])[:12]
        print("\n  tempo por parte em ~4 s de cena (só informação; wrapper + software, não vale para o PC):")
        for nome, t in linhas:
            print("    %-34s %8.1f ms em %6d chamadas" % (nome, t["ms"], t["chamadas"]))


if __name__ == "__main__":
    unittest.main(verbosity=2)
