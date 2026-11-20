/* Sexta-Feira Engine v0.3.0: a tela da cena. Só mostra; não pede, não decide, não guarda dado. Nenhuma requisição de rede.
 * Os dados vêm de window.SF_DADOS (hoje o dados-ficticios.js) e passam por uma lista branca (limpa): ids de agente e de módulo fixos, estados
 * fixos, textos curtos sem caracteres de controle, números inteiros pequenos. Tudo que for texto entra na tela por textContent, nunca como HTML. */
function (usa) {
  'use strict';

  var AGENTES = usa.limpa.AGENTES, NUCLEO = usa.limpa.NUCLEO, CORRETORA = usa.limpa.CORRETORA, MODULOS = usa.limpa.MODULOS;
  function cor(def) {   // a cor vem do cores.css (o dono edita lá); se o valor não for #RRGGBB, vale a padrão
    var v = '';
    try { v = getComputedStyle(document.documentElement).getPropertyValue(def.cor).trim(); } catch (e) { v = ''; }
    return /^#[0-9a-fA-F]{6}$/.test(v) ? v : def.padrao;
  }
  function el(tag, cls, txt, pai) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (txt != null) e.textContent = txt;
    if (pai) pai.appendChild(e);
    return e;
  }

  var params = new URLSearchParams(location.search);
  var leve = params.get('leve') === '1' || (params.get('leve') !== '0' && !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches));

  var dados = usa.limpa.limpa(window.SF_DADOS);
  var raiz = document.getElementById('cena');
  // o aviso de falha contida (v0.4.2): registrado ANTES de criar a cena, para cobrir também uma falha ao montá-la. Se uma esfera, um axônio ou uma parte
  // for desligada, uma linha curta diz quantas e qual foi a última (o elemento só nasce na falha; texto por textContent, só nomes internos)
  var aviso = null;
  usa.base.aoDesligar(function (nome, todas) {
    if (!aviso) {
      aviso = document.createElement('div');
      aviso.id = 'aviso-falha'; aviso.setAttribute('role', 'status');
      document.body.appendChild(aviso);
    }
    aviso.textContent = (todas && todas.length > 1 ? todas.length + ' partes desligadas (última: ' + nome + ')' : 'Parte desligada: ' + nome) + '. O resto da tela segue.';
  });
  var cena = usa.quadro.criar(raiz, {
    leve: leve,
    nucleo: { nome: NUCLEO.nome, cor: cor(NUCLEO), modulos: MODULOS.map(cor), modulosIds: MODULOS.map(function (m) { return m.id; }) },
    pedidos: dados.pedidos,
    agentes: AGENTES.map(function (a) { return { id: a.id, nome: a.nome, cor: cor(a), lado: a.lado }; }),
    satelite: { id: CORRETORA.id, nome: CORRETORA.nome, cor: cor(CORRETORA), junto: 'robo' }
  });

  // ---------------------------------------------------------------- a lupa (embaixo, no centro) e o voltar
  var caixa = el('div', 'lupa-ctl', null, document.body);
  caixa.setAttribute('role', 'group'); caixa.setAttribute('aria-label', 'Lupa');
  var menos = el('button', null, '−', caixa), nivel = el('span', 'lupa-z', 'cena', caixa), mais = el('button', null, '+', caixa), volta = el('button', 'lupa-volta', '1:1', caixa);
  [menos, mais, volta].forEach(function (b) { b.type = 'button'; });
  menos.setAttribute('aria-label', 'Afastar'); mais.setAttribute('aria-label', 'Aproximar'); volta.setAttribute('aria-label', 'Voltar ao tamanho normal');
  var voltarCena = el('button', 'voltar-cena', '← cena', document.body);
  voltarCena.type = 'button'; voltarCena.hidden = true;
  var dica = el('div', 'lupa-dica', 'Toque no nome de uma esfera (ou gire a roda sobre ela) para ampliar', document.body);

  var zAtual = 1;
  menos.addEventListener('click', function () { var l = cena.lupa(); if (!l) return; if (zAtual > 1.001) l.ampliar(1 / 1.8); else cena.sair(); });
  mais.addEventListener('click', function () { var l = cena.lupa(); if (l) l.ampliar(1.8); else cena.focar('nucleo'); });
  volta.addEventListener('click', function () { var l = cena.lupa(); if (!l) return; if (zAtual > 1.001) l.zerar(); else cena.sair(); });
  voltarCena.addEventListener('click', function () { cena.sair(); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') cena.sair(); });
  cena.aoMudar(function (st) {
    zAtual = st.z;
    var em = !!st.foco;
    voltarCena.hidden = !em;
    nivel.textContent = em ? st.z.toFixed(1).replace('.', ',') + '×' : 'cena';
    menos.disabled = !em; volta.disabled = !em; mais.disabled = false;
    dica.style.display = em ? 'none' : '';
  });
  menos.disabled = true; volta.disabled = true;

  // ---------------------------------------------------------------- escala, laço de animação
  var ultW = -1, ultH = -1, ultD = -1;   // só refaz a cena se o tamanho ou a densidade da tela mudaram de verdade (o navegador pode avisar "resize" sem mudança; refazer à toa mudava o desenho)
  function ajusta() {
    var w = window.innerWidth, h = window.innerHeight, d = window.devicePixelRatio || 1;
    if (w === ultW && h === ultH && d === ultD) return;
    ultW = w; ultH = h; ultD = d;
    cena.ajustar(w, h);
  }
  ajusta();
  if (window.SF_TESTE) { window.SF_CENA = cena; window.SF_LIMPA = usa.limpa.limpa; }          // gancho só dos testes automáticos (sem SF_TESTE nada é exposto)
  var espera = null;
  window.addEventListener('resize', function () { window.clearTimeout(espera); espera = window.setTimeout(ajusta, 150); });

  var ultimo = 0;
  function quadro(t) {
    window.requestAnimationFrame(quadro);
    if (document.hidden) { ultimo = 0; return; }
    if (!ultimo) ultimo = t;
    var dt = (t - ultimo) / 1000;
    if (leve && dt < 1 / 24) return;                   // modo leve: no máximo 24 quadros por segundo
    ultimo = t;
    cena.quadro(dt);
  }
  window.requestAnimationFrame(quadro);

  return {};
}
