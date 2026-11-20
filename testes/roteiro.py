#!/usr/bin/env python3
"""Sexta-Feira Engine: o roteiro do ciclo de um pedido (v0.4.3). Só na nuvem (playwright + Chromium; sem eles tudo é pulado).

Relógio preso e sorteio com semente fixa (os mesmos do `imagens.py`). O teste pede um agente, anda de 50 em 50 ms e grava cada MUDANÇA de estado:
o axônio de ida (desde a v0.5.0 há um por módulo que o agente pede, `i-<agente>#<módulo>`: o teste pede sempre o PRIMEIRO módulo do agente, para o roteiro não depender do sorteio; enquanto algum está fora do repouso, é o dele que vale), o de volta (`o-<agente>`), se há algum módulo ou agente brilhando, e quantos axônios estão fora do repouso.
Compara com `testes/referencias/roteiro.json`: se a ordem dos passos ou o tempo mudar, reprova.
Roteiro 1: um pedido inteiro (fiis). Roteiro 2: o foco muda no meio do pedido (o retorno de um pedido velho não pode fazer nada: no fim, tudo em repouso e nada brilhando).
Regravar (só com motivo dito na versão): SF_GRAVAR_ROTEIRO=1 python3 testes/roteiro.py
"""
import functools
import http.server
import json
import os
import pathlib
import threading
import unittest

try:
    from playwright.sync_api import sync_playwright
except Exception:
    sync_playwright = None

import imagens  # PREPARA (relógio e sorteio presos) e Quieto

RAIZ = pathlib.Path(__file__).resolve().parent.parent
INTERFACE = RAIZ / "interface"
REF = RAIZ / "testes" / "referencias" / "roteiro.json"

ESTADO = """(ag) => { const w = window.SF_CENA.parede(), is = w.eixos.filter(x => x.tipo === 'i' && x.ag === ag), o = w.eixos.find(x => x.id === 'o-' + ag);
  const i = is.find(x => x.estado !== 'repouso' || x.pulso) || is[0], txt = (x) => x ? x.estado + (x.pulso ? '*' : '') : 'sem';
  return [txt(i), txt(o), w.fixos.some(f => f.flash > 0) || (w.fixoAg[ag] && w.fixoAg[ag].flash > 0) ? 'brilha' : '-', w.ramos.length]; }"""

# o primeiro módulo que o agente pede (o id do axônio é i-<agente>#<módulo>): assim o roteiro não depende do sorteio do módulo
PEDIR = """(ag) => { const a = window.SF_CENA.parede().eixos.find(x => x.tipo === 'i' && x.ag === ag); return !!a && window.SF_CENA.pedir(ag, Number(a.id.split('#')[1])); }"""


@unittest.skipIf(sync_playwright is None, "playwright não instalado")
class Roteiro(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.srv = http.server.ThreadingHTTPServer(("127.0.0.1", 0), functools.partial(imagens.Quieto, directory=str(INTERFACE)))
        threading.Thread(target=cls.srv.serve_forever, daemon=True).start()
        cls.url = "http://127.0.0.1:%d/index.html" % cls.srv.server_address[1]
        cls.pw = sync_playwright().start()
        try:
            cls.nav = cls.pw.chromium.launch()
        except Exception as e:
            cls.pw.stop()
            cls.srv.shutdown()
            raise unittest.SkipTest("sem Chromium: %s" % e)

    @classmethod
    def tearDownClass(cls):
        cls.nav.close()
        cls.pw.stop()
        cls.srv.shutdown()

    def roda(self, agente, meio=None, total_ms=14000):
        ctx = self.nav.new_context(viewport={"width": 1672, "height": 941})
        self.addCleanup(ctx.close)
        pg = ctx.new_page()
        erros = []
        pg.on("pageerror", lambda e: erros.append(str(e)))
        pg.add_init_script(imagens.PREPARA)
        pg.clock.install(time=0)
        pg.clock.pause_at(1000)
        pg.goto(self.url)
        pg.wait_for_function("() => window.SF_CENA")
        pg.wait_for_load_state("load")
        pg.wait_for_timeout(400)
        pg.evaluate("() => { var base = performance.now.bind(performance), desvio = base() - 2; window.__raw = base; performance.now = function () { return base() - desvio; }; }")
        pg.evaluate("() => window.SF_CENA.automatico(false)")
        alvo = 2 + 2000                                   # os passos andam até instantes ABSOLUTOS do relógio (ver a causa em imagens.py)
        pg.clock.run_for(max(0, int(round(alvo - pg.evaluate("() => window.__raw()")))))
        self.assertTrue(pg.evaluate(PEDIR, agente))
        passos, ultimo, t = [], None, 0
        while t <= total_ms:
            if meio and t == meio[0]:
                pg.evaluate(meio[1])
            estado = pg.evaluate(ESTADO, agente)
            if estado != ultimo:
                passos.append([t, estado])
                ultimo = estado
            alvo += 50
            pg.clock.run_for(max(0, int(round(alvo - pg.evaluate("() => window.__raw()")))))
            t += 50
        self.assertEqual(erros, [])
        return passos

    def compara(self, nome, atual):
        ref = json.loads(REF.read_text(encoding="utf-8")) if REF.exists() else {}
        if os.environ.get("SF_GRAVAR_ROTEIRO"):
            ref[nome] = atual
            REF.write_text(json.dumps(ref, indent=1, sort_keys=True, ensure_ascii=False) + "\n", encoding="utf-8")
        else:
            self.assertIn(nome, ref, "sem referência: grave com SF_GRAVAR_ROTEIRO=1")
            self.assertEqual(atual, ref[nome], "o roteiro '%s' mudou (ordem ou tempo dos passos)" % nome)

    def test_um_pedido_inteiro(self):
        passos = self.roda("fiis")
        self.assertGreater(len(passos), 4, passos)
        ultimo = passos[-1][1]
        self.assertEqual(ultimo[3], 0, "no fim tudo volta ao repouso")
        self.compara("pedido-fiis", passos)

    def test_foco_no_meio_do_pedido_cancela_o_retorno_velho(self):
        passos = self.roda("cripto", meio=(450, "() => window.SF_CENA.focar('cripto')"))
        self.assertEqual(passos[-1][1][3], 0, "no fim tudo em repouso")
        self.assertEqual(passos[-1][1][2], "-", "e nada brilhando: o retorno do pedido velho não faz nada")
        self.compara("foco-no-meio", passos)


if __name__ == "__main__":
    unittest.main(verbosity=2)
