/* GERADO por ferramentas/montar-interface.sh a partir de fonte/ (versão 0.3.0). NÃO edite aqui: edite a parte em fonte/ e rode o montador. */
var VERSAO_ENGINE = '0.3.0';
// ---- fonte/dados/limpa/parte.js
SF.parte({nome:'dados/limpa',porta:1,compativelDesde:1,requer:[],guarda:false,dom:false},
/* A lista branca (limpa) e o catálogo fixo (agentes, módulos, cores padrão). TUDO que vem de fora (window.SF_DADOS) passa por `limpa` antes de a tela ver:
 * ids de agente e de módulo fixos, estados fixos, textos curtos sem caracteres de controle, inteiros pequenos. Nunca valor, quantidade, preço ou segmento. */
function (usa) {
  'use strict';

  // esquerda, de cima para baixo: Cripto, Ações e ETFs, FIIs; direita, de cima para baixo: Robô, Segurança, Radar
  var AGENTES = [
    { id: 'cripto', nome: 'Cripto', cor: '--cor-cripto', padrao: '#FF7A00', lado: 'esq' },
    { id: 'acoes-etfs', nome: 'Ações e ETFs', cor: '--cor-acoes-etfs', padrao: '#00D4FF', lado: 'esq' },
    { id: 'fiis', nome: 'FIIs', cor: '--cor-fiis', padrao: '#00E676', lado: 'esq' },
    { id: 'robo', nome: 'Robô', cor: '--cor-robo', padrao: '#FFD600', lado: 'dir' },
    { id: 'seguranca', nome: 'Segurança', cor: '--cor-seguranca', padrao: '#FF2E55', lado: 'dir' },
    { id: 'radar', nome: 'Radar', cor: '--cor-radar', padrao: '#B388FF', lado: 'dir' }
  ];
  var NUCLEO = { nome: 'Sexta-Feira', cor: '--cor-sexta-feira', padrao: '#9D5CFF' };
  var CORRETORA = { id: 'corretora', nome: 'Corretora', cor: '--cor-corretora', padrao: '#FFD600' };
  var MODULOS = [
    { id: 'telegram', cor: '--cor-mod-telegram', padrao: '#38A8FF' }, { id: 'internet', cor: '--cor-mod-internet', padrao: '#19E3C3' }, { id: 'planilha', cor: '--cor-mod-planilha', padrao: '#9BE22B' },
    { id: 'painel', cor: '--cor-mod-painel', padrao: '#FF4FA8' }, { id: 'mapa', cor: '--cor-mod-mapa', padrao: '#FFB224' }, { id: 'resumo', cor: '--cor-mod-resumo', padrao: '#FF6A4D' },
    { id: 'backup', cor: '--cor-mod-backup', padrao: '#D45CFF' }, { id: 'salas', cor: '--cor-mod-salas', padrao: '#E8E26A' }, { id: 'aprendido', cor: '--cor-mod-aprendido', padrao: '#7DFFB0' }
  ];
  // ---------------------------------------------------------------- lista branca (tudo que vem de fora passa por aqui)
  var ESTADOS = { ok: 1, rodando: 1, atencao: 1, parado: 1 };
  var TONS = { bom: 1, atencao: 1, ruim: 1 };
  function texto(v, max) { return typeof v === 'string' ? v.replace(/[\u0000-\u001f\u007f]/g, ' ').slice(0, max) : ''; }
  function hora(v) { return typeof v === 'string' && /^\d{2}:\d{2}$/.test(v) ? v : '--:--'; }
  function inteiro(v) { return typeof v === 'number' && isFinite(v) ? Math.max(0, Math.min(9999, Math.round(v))) : 0; }
  function idAgente(v) { return AGENTES.some(function (a) { return a.id === v; }) ? v : null; }
  function idModulo(v) { return MODULOS.some(function (m) { return m.id === v; }) ? v : null; }
  function estado(v) { return typeof v === 'string' && Object.prototype.hasOwnProperty.call(ESTADOS, v) ? v : 'parado'; }

  function limpa(d) {
    var o = { ficticio: !!(d && d.ficticio === true), tom: 'bom', geral: '', agentes: {}, tarefas: [], avisos: { hoje: 0, criticos: 0, atencao: 0, normais: 0 }, logs: [], destaque: null, pedidos: {} };
    if (!d || typeof d !== 'object') return o;
    if (d.estadoGeral && typeof d.estadoGeral === 'object') {
      o.tom = typeof d.estadoGeral.tom === 'string' && Object.prototype.hasOwnProperty.call(TONS, d.estadoGeral.tom) ? d.estadoGeral.tom : 'bom';
      o.geral = texto(d.estadoGeral.texto, 60);
    }
    (Array.isArray(d.agentes) ? d.agentes : []).forEach(function (a) {
      var id = a && idAgente(a.id);
      if (!id) return;
      var c = a.contagens && typeof a.contagens === 'object' ? a.contagens : {};
      o.agentes[id] = { estado: estado(a.estado), ultima: hora(a.ultima), proxima: hora(a.proxima), resumo: texto(a.resumo, 40),
        noticias: inteiro(c.noticias), alertas: inteiro(c.alertas), relatorios: inteiro(c.relatorios) };
    });
    (Array.isArray(d.tarefas) ? d.tarefas : []).slice(0, 4).forEach(function (t) {
      if (t && idAgente(t.agente)) o.tarefas.push({ agente: t.agente, texto: texto(t.texto, 40), andamento: t.estado === 'andamento', hora: hora(t.hora) });
    });
    if (d.avisos && typeof d.avisos === 'object') {
      o.avisos = { hoje: inteiro(d.avisos.hoje), criticos: inteiro(d.avisos.criticos), atencao: inteiro(d.avisos.atencao), normais: inteiro(d.avisos.normais) };
    }
    (Array.isArray(d.logs) ? d.logs : []).slice(0, 5).forEach(function (l) {
      if (l && idAgente(l.agente)) o.logs.push({ hora: hora(l.hora), agente: l.agente, texto: texto(l.texto, 70) });
    });
    if (d.destaque && typeof d.destaque === 'object' && idAgente(d.destaque.agente)) {
      o.destaque = { agente: d.destaque.agente, titulo: texto(d.destaque.titulo, 50),
        linhas: (Array.isArray(d.destaque.linhas) ? d.destaque.linhas : []).slice(0, 3).map(function (x) { return texto(x, 50); }) };
    }
    // que módulos cada agente costuma pedir (a lista repete o módulo para ele aparecer mais): só ids fixos de agente e de módulo, no máximo 12 por agente
    if (d.pedidos && typeof d.pedidos === 'object') {
      AGENTES.forEach(function (a) {
        var l = Object.prototype.hasOwnProperty.call(d.pedidos, a.id) && Array.isArray(d.pedidos[a.id]) ? d.pedidos[a.id] : [];
        var ok = l.slice(0, 12).map(idModulo).filter(function (m) { return m; });
        if (ok.length) o.pedidos[a.id] = ok;
      });
    }
    return o;
  }

  return { limpa: limpa, AGENTES: AGENTES, NUCLEO: NUCLEO, CORRETORA: CORRETORA, MODULOS: MODULOS };
}

);
// ---- fonte/tela/inicio/parte.js
SF.parte({nome:'tela/inicio',porta:1,compativelDesde:1,requer:['dados/limpa@1','cena/quadro@1'],guarda:false,dom:true},
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
  function ajusta() { cena.ajustar(window.innerWidth, window.innerHeight); }
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

);
SF.iniciar();
