#!/usr/bin/env python3
"""Teste de IDENTIDADE da tela (só na nuvem; precisa do playwright do Python e de um Chromium).

    python3 testes/imagens.py --gravar                 # tira as referências da tela atual e grava em testes/referencias/cena.json
    python3 testes/imagens.py                          # compara a tela atual com as referências (reprova se um pixel mudou)
    python3 testes/imagens.py --pasta /outra/interface # usa outra pasta de interface (por exemplo, a de uma tag antiga)
    python3 testes/imagens.py --cena ciclo-robo        # só uma cena (nomes: ver CENAS)

Como é determinístico: antes dos scripts da página, o teste prende o relógio (page.clock: performance.now, timers e requestAnimationFrame
andam de 16 em 16 ms, só quando o teste manda) e troca Math.random por um sorteio com semente fixa. Assim a mesma interface dá sempre
os mesmos pixels. Em cada ponto o teste grava o hash de todos os canvases (pixel a pixel) e do HTML da tela, e o hash da captura de tela
inteira (que inclui o CSS e as misturas entre canvases). A referência vale para o Chromium da nuvem (no PC não há este teste).

Quando falha, grava a captura do ponto em /tmp/imagens-diferenca/<cena>-<ponto>.png e diz qual ponto e qual canvas mudou.
"""
import argparse
import functools
import hashlib
import http.server
import json
import pathlib
import sys
import threading

RAIZ = pathlib.Path(__file__).resolve().parent.parent
REFERENCIA = RAIZ / "testes" / "referencias" / "cena.json"

# sorteio com semente fixa (mulberry32) no lugar do Math.random, e o gancho de teste da tela
PREPARA = """
window.SF_TESTE = { estrito: true };
(function () { var s = 123456789 >>> 0; Math.random = function () { s = (s + 0x6D2B79F5) >>> 0; var t = s; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; })();
window.__hashes = function () {
  function fnv(u8) { var h = 2166136261 >>> 0; for (var i = 0; i < u8.length; i++) { h ^= u8[i]; h = Math.imul(h, 16777619) >>> 0; } return h.toString(16); }
  var out = {}, cs = document.querySelectorAll('canvas');
  for (var i = 0; i < cs.length; i++) {
    var c = cs[i], x = c.getContext('2d'); if (!x || !c.width || !c.height) { out['canvas' + i] = 'vazio'; continue; }
    out['canvas' + i] = c.width + 'x' + c.height + ':' + fnv(new Uint8Array(x.getImageData(0, 0, c.width, c.height).data.buffer));
  }
  var html = document.body.innerHTML.replace(/<script[\\s\\S]*?<\\/script>/g, '').replace(/\\s+/g, ' '), h = 2166136261 >>> 0;
  for (var j = 0; j < html.length; j++) { h ^= html.charCodeAt(j); h = Math.imul(h, 16777619) >>> 0; }
  out.html = h.toString(16);
  return out;
};
"""

# (nome, largura, altura, dpr, celular, query, passos)  passos: lista de ("pedir", id) | ("rodar", ms) | ("foto", ponto) | ("focar", id) | ("sair",) | ("lupa", fator) | ("tecla", nome)
def ciclo(agente, extra=()):
    p = [("rodar", 2000), ("foto", "repouso"), ("pedir", agente)]
    for i in range(1, 25):
        p += [("rodar", 400), ("foto", "t%02d" % i)]
    return p + list(extra)


CENAS = {
    "repouso": (1672, 941, 1, False, "", [("rodar", 1000), ("foto", "1s"), ("rodar", 2000), ("foto", "3s"), ("rodar", 4000), ("foto", "7s")]),
    "ciclo-robo": (1672, 941, 1, False, "", ciclo("robo")),
    "ciclo-fiis": (1672, 941, 1, False, "", ciclo("fiis")),
    "ciclo-cripto-2x": (1672, 941, 2, False, "", [("rodar", 1500), ("pedir", "cripto")] + sum([[("rodar", 700), ("foto", "t%02d" % i)] for i in range(1, 11)], [])),
    "foco-nucleo": (1672, 941, 1, False, "", [("rodar", 1000), ("focar", "nucleo"), ("rodar", 1500), ("foto", "foco"), ("lupa", 1.8), ("rodar", 800), ("foto", "lupa1"), ("lupa", 1.8), ("rodar", 2500),
                                              ("foto", "lupa2"), ("pedir", "radar"), ("rodar", 1200), ("foto", "pedido1"), ("rodar", 2500), ("foto", "pedido2"), ("sair",), ("rodar", 1500), ("foto", "saiu")]),
    "foco-agente": (1672, 941, 1, False, "", [("rodar", 800), ("pedir", "fiis"), ("rodar", 500), ("focar", "fiis"), ("rodar", 1500), ("foto", "foco"), ("pedir", "fiis"), ("rodar", 1500), ("foto", "pedido1"),
                                              ("rodar", 3000), ("foto", "pedido2"), ("sair",), ("rodar", 1500), ("foto", "saiu")]),
    "leve": (1672, 941, 1, False, "?leve=1", ciclo("seguranca")[:14]),
    "retrato": (390, 844, 3, True, "", [("rodar", 1500), ("foto", "repouso"), ("pedir", "acoes-etfs")] + sum([[("rodar", 600), ("foto", "t%02d" % i)] for i in range(1, 11)], [])),
    "paisagem": (844, 390, 3, True, "", [("rodar", 1500), ("foto", "repouso"), ("pedir", "radar")] + sum([[("rodar", 600), ("foto", "t%02d" % i)] for i in range(1, 11)], [])),
}


class Quieto(http.server.SimpleHTTPRequestHandler):
    def log_message(self, *a):
        pass


def tirar(pasta, nomes, nav):
    srv = http.server.ThreadingHTTPServer(("127.0.0.1", 0), functools.partial(Quieto, directory=str(pasta)))
    threading.Thread(target=srv.serve_forever, daemon=True).start()
    url = "http://127.0.0.1:%d/index.html" % srv.server_address[1]
    resultado, erros = {}, []
    try:
        for nome in nomes:
            l, a, dpr, cel, query, passos = CENAS[nome]
            ctx = nav.new_context(viewport={"width": l, "height": a}, device_scale_factor=dpr, has_touch=cel, is_mobile=cel)
            pg = ctx.new_page()
            pg.on("pageerror", lambda e, n=nome: erros.append("%s: %s" % (n, e)))
            pg.on("console", lambda m, n=nome: erros.append("%s: %s" % (n, m.text)) if m.type in ("error", "warning") and "willReadFrequently" not in m.text else None)
            pg.add_init_script(PREPARA)
            pg.clock.install(time=0)
            pg.clock.pause_at(1000)          # sem isto o relógio falso continua andando em tempo real e os quadros variam de uma rodada para outra
            pg.goto(url + query)
            pg.wait_for_function("() => window.SF_CENA")
            pg.wait_for_load_state("load")
            pg.wait_for_timeout(400)         # tempo REAL para o navegador (celular emulado) assentar o tamanho da janela antes de o relógio falso andar
            pg.evaluate("() => window.SF_CENA.automatico(false)")
            pontos = {}
            for p in passos:
                if p[0] == "rodar":
                    pg.clock.run_for(p[1])
                elif p[0] == "pedir":
                    if not pg.evaluate("(id) => window.SF_CENA.pedir(id)", p[1]):
                        erros.append("%s: pedido de %s recusado" % (nome, p[1]))
                elif p[0] == "focar":
                    pg.evaluate("(id) => window.SF_CENA.focar(id)", p[1])
                elif p[0] == "sair":
                    pg.evaluate("() => window.SF_CENA.sair()")
                elif p[0] == "lupa":
                    pg.evaluate("(f) => window.SF_CENA.lupa().ampliar(f)", p[1])
                elif p[0] == "foto":
                    h = pg.evaluate("() => window.__hashes()")
                    png = pg.screenshot()
                    h["tela"] = hashlib.sha256(png).hexdigest()[:16]
                    pontos[p[1]] = h
                    pathlib.Path("/tmp/imagens-atual").mkdir(exist_ok=True)
                    pathlib.Path("/tmp/imagens-atual/%s-%s.png" % (nome, p[1])).write_bytes(png)
            resultado[nome] = pontos
            ctx.close()
    finally:
        srv.shutdown()
    return resultado, erros


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--gravar", action="store_true")
    ap.add_argument("--pasta", default=str(RAIZ / "interface"))
    ap.add_argument("--cena", action="append")
    ap.add_argument("--referencia", default=str(REFERENCIA))
    a = ap.parse_args()
    try:
        from playwright.sync_api import sync_playwright
    except Exception:
        print("imagens: sem playwright (só roda na nuvem)")
        return 0
    nomes = a.cena or list(CENAS)
    with sync_playwright() as p:
        nav = p.chromium.launch()
        res, erros = tirar(pathlib.Path(a.pasta), nomes, nav)
        nav.close()
    ref = pathlib.Path(a.referencia)
    if a.gravar:
        atual = json.loads(ref.read_text()) if ref.exists() else {}
        atual.update(res)
        ref.parent.mkdir(parents=True, exist_ok=True)
        ref.write_text(json.dumps(atual, indent=1, sort_keys=True) + "\n")
        print("gravado: %s (%d cenas, %d pontos)" % (ref, len(res), sum(len(v) for v in res.values())))
        if erros:
            print("AVISO: erros durante a gravação:", *erros[:5], sep="\n  ")
        return 1 if erros else 0
    antigo = json.loads(ref.read_text())

    def compara(res):
        f = []
        for nome, pontos in res.items():
            for ponto, h in pontos.items():
                r = antigo.get(nome, {}).get(ponto)
                if r is None:
                    f.append("%s/%s: sem referência" % (nome, ponto))
                    continue
                dif = sorted(k for k in set(h) | set(r) if h.get(k) != r.get(k))
                if dif:
                    f.append("%s/%s: mudou %s" % (nome, ponto, ", ".join(dif)))
                    d = pathlib.Path("/tmp/imagens-diferenca")
                    d.mkdir(exist_ok=True)
                    src = pathlib.Path("/tmp/imagens-atual/%s-%s.png" % (nome, ponto))
                    if src.exists():
                        (d / src.name).write_bytes(src.read_bytes())
        return f
    falhas = list(erros) + compara(res)
    total = sum(len(v) for v in res.values())
    if falhas:
        print("REPROVADO: %d ponto(s) diferentes de %d" % (len([f for f in falhas if "mudou" in f]), total))
        for f in falhas[:25]:
            print("  " + f)
        print("capturas em /tmp/imagens-diferenca/")
        return 1
    print("APROVADO: %d pontos idênticos às referências (pixel a pixel)." % total)
    return 0


if __name__ == "__main__":
    sys.exit(main())
