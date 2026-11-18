/* Sexta-Feira Engine v0.2.0: a tela. Só mostra; não pede, não decide, não guarda dado.
 * Os dados vêm de window.SF_DADOS (hoje o dados-ficticios.js) e passam por uma lista branca (limpa): ids de agente fixos, estados fixos,
 * textos curtos sem caracteres de controle, números inteiros pequenos. Tudo entra na tela por textContent, nunca como HTML.
 * Nenhuma requisição de rede: o conferir.sh reprova as chamadas de rede (veja a regra 3 dele). */
(function () {
  'use strict';

  var VERSAO_ENGINE = '0.2.0';
  var W = 1672, H = 941;

  var AGENTES = [
    { id: 'fiis', nome: 'FIIs', cor: '--cor-fiis', padrao: '#00E676' },
    { id: 'acoes-etfs', nome: 'Ações e ETFs', cor: '--cor-acoes-etfs', padrao: '#00D4FF' },
    { id: 'cripto', nome: 'Cripto', cor: '--cor-cripto', padrao: '#FF7A00' },
    { id: 'radar', nome: 'Radar', cor: '--cor-radar', padrao: '#B388FF' },
    { id: 'robo', nome: 'Robô', cor: '--cor-robo', padrao: '#FFD600' },
    { id: 'seguranca', nome: 'Segurança', cor: '--cor-seguranca', padrao: '#FF2E55' }
  ];
  var NUCLEO = { nome: 'Sexta-Feira', cor: '--cor-sexta-feira', padrao: '#8B3DFF' };
  var ESTADOS = { ok: 'Em dia', rodando: 'Rodando', atencao: 'Atenção', parado: 'Parado' };
  var TONS = { bom: 'v', atencao: 'am', ruim: 'ruim' };
  var DIAS = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sáb'];

  // ---------------------------------------------------------------- lista branca (tudo que vem de fora passa por aqui)
  function texto(v, max) {
    return typeof v === 'string' ? v.replace(/[\u0000-\u001f\u007f]/g, ' ').slice(0, max) : '';
  }
  function hora(v) { return typeof v === 'string' && /^\d{2}:\d{2}$/.test(v) ? v : '--:--'; }
  function inteiro(v) { return typeof v === 'number' && isFinite(v) ? Math.max(0, Math.min(9999, Math.round(v))) : 0; }
  function idAgente(v) { return AGENTES.some(function (a) { return a.id === v; }) ? v : null; }
  function estado(v) { return Object.prototype.hasOwnProperty.call(ESTADOS, v) ? v : 'parado'; }

  function limpa(d) {
    var o = { ficticio: !!(d && d.ficticio === true), tom: 'bom', geral: '', agentes: {}, tarefas: [], avisos: { hoje: 0, criticos: 0, atencao: 0, normais: 0 }, logs: [], destaque: null };
    if (!d || typeof d !== 'object') return o;
    if (d.estadoGeral && typeof d.estadoGeral === 'object') {
      o.tom = Object.prototype.hasOwnProperty.call(TONS, d.estadoGeral.tom) ? d.estadoGeral.tom : 'bom';
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
    return o;
  }

  // ---------------------------------------------------------------- pequenos utilitários de DOM (sempre textContent)
  var NS = 'http://www.w3.org/2000/svg';
  function el(tag, cls, txt, pai) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (txt != null) e.textContent = txt;
    if (pai) pai.appendChild(e);
    return e;
  }
  function esvazia(e) { while (e.firstChild) e.removeChild(e.firstChild); }
  function z2(n) { return (n < 10 ? '0' : '') + n; }
  function nomeDe(id) { var a = AGENTES.filter(function (x) { return x.id === id; })[0]; return a ? a.nome : ''; }

  function cor(def) {   // a cor vem do cores.css (o dono edita lá); se o valor não for #RRGGBB, vale a padrão
    var v = '';
    try { v = getComputedStyle(document.documentElement).getPropertyValue(def.cor).trim(); } catch (e) { v = ''; }
    return /^#[0-9a-fA-F]{6}$/.test(v) ? v : def.padrao;
  }

  // ---------------------------------------------------------------- modo leve
  var params = new URLSearchParams(location.search);
  function lerLeve() {
    if (params.get('leve') === '1') return true;
    if (params.get('leve') === '0') return false;
    try { var g = window.localStorage.getItem('engine_leve'); if (g === '1') return true; if (g === '0') return false; } catch (e) { /* sem armazenamento */ }
    return !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  }
  var leve = lerLeve();
  function gravarLeve() { try { window.localStorage.setItem('engine_leve', leve ? '1' : '0'); } catch (e) { /* tudo bem */ } }

  // ---------------------------------------------------------------- montagem
  var dados = limpa(window.SF_DADOS);
  var tela = document.getElementById('tela');
  var sel = null;                    // id do agente aberto no detalhe (ou null)
  var nr = {};                       // id -> {wrap, canvas, n, x, y, w, h}
  var centro = null;
  var painel = {};                   // referências das caixas que mudam

  function geometria() {
    // zona do centro: x 368..1305, y 100..654; três neurônios em cima, três embaixo e o grande no meio
    var pw = 290, ph = 162, xs = [368, 691, 1015];
    var g = { centro: { x: 536, y: 210, w: 600, h: 335 }, ag: {} };
    ['fiis', 'acoes-etfs', 'cripto'].forEach(function (id, i) { g.ag[id] = { x: xs[i], y: 104, w: pw, h: ph }; });
    ['radar', 'robo', 'seguranca'].forEach(function (id, i) { g.ag[id] = { x: xs[i], y: 490, w: pw, h: ph }; });
    return g;
  }

  function criaNeuronio(nome, def, g, id, clique) {
    var wrap = el(id ? 'button' : 'div', 'nr' + (id ? '' : ' centro'), null, tela);
    if (id) { wrap.type = 'button'; wrap.setAttribute('aria-label', nome + ': abrir o detalhe'); wrap.addEventListener('click', clique); }
    else wrap.setAttribute('aria-label', nome + ' (o Núcleo)');
    wrap.style.left = g.x + 'px'; wrap.style.top = g.y + 'px'; wrap.style.width = g.w + 'px'; wrap.style.height = g.h + 'px';
    wrap.style.setProperty('--c', cor(def));
    var canvas = el('canvas', null, null, wrap);
    el('span', 'rot', nome, wrap);
    var n = window.Neuronio.criar(canvas, { cor: cor(def), semente: 94127 + (id ? id.length * 977 : 0), leve: leve });
    return { wrap: wrap, canvas: canvas, n: n, g: g, def: def };
  }

  function montaCentro() {
    var g = geometria();
    // os fios entram primeiro (ficam por baixo dos neurônios)
    var fios = document.createElementNS(NS, 'svg');
    fios.setAttribute('class', 'fios'); fios.setAttribute('viewBox', '0 0 ' + W + ' ' + H); fios.setAttribute('aria-hidden', 'true');
    tela.appendChild(fios); painel.fios = fios;

    centro = criaNeuronio(NUCLEO.nome + ' · Núcleo', NUCLEO, g.centro, null);
    AGENTES.forEach(function (a) {
      var r = criaNeuronio(a.nome, a, g.ag[a.id], a.id, function () { abrir(a.id); });
      nr[a.id] = r;
      var cx = g.centro.x + g.centro.w * 0.25, cy = g.centro.y + g.centro.h * 0.52;
      var linha = document.createElementNS(NS, 'line');
      linha.setAttribute('x1', String(g.ag[a.id].x + g.ag[a.id].w * 0.25)); linha.setAttribute('y1', String(g.ag[a.id].y + g.ag[a.id].h * 0.52));
      linha.setAttribute('x2', String(cx)); linha.setAttribute('y2', String(cy));
      linha.style.setProperty('--c', cor(a));
      fios.appendChild(linha);
      r.fio = [g.ag[a.id].x + g.ag[a.id].w * 0.25, g.ag[a.id].y + g.ag[a.id].h * 0.52, cx, cy];
      r.cor = cor(a);
    });
    // a Corretora: módulo satélite PARADO ao lado do Robô (não gira, não pulsa)
    var s = el('div', 'satelite', null, tela);
    s.style.left = (g.ag.robo.x + g.ag.robo.w - 62) + 'px'; s.style.top = (g.ag.robo.y + g.ag.robo.h - 64) + 'px';   // canto livre do Robô, fora da caixa do Núcleo
    el('span', null, 'Corretora', s);
    s.setAttribute('aria-label', 'Corretora: módulo satélite do Robô');
  }

  function montaTopo() {
    var t = el('div', 'topo', null, tela);
    var logo = el('div', 'cx logo', null, t);
    var bloco = el('div', null, null, logo);
    el('div', 'nm', 'Sexta-Feira', bloco);
    el('div', 'sb', 'Engine v' + VERSAO_ENGINE, bloco);
    var est = el('div', 'cx estado roxa', null, t);
    painel.bola = el('div', 'bola', null, est);
    var tx = el('div', null, null, est);
    el('div', 'a', 'Estado geral', tx);
    painel.geral = el('div', 'b v', '', tx);
    var selo = document.getElementById('selo');          // o selo mora no index.html (sempre existe); aqui só entra no lugar dele no topo
    if (selo) t.appendChild(selo);
    var rel = el('div', 'cx relogio ciano', null, t);
    painel.data = el('div', 'a', '', rel);
    painel.hora = el('div', 'hr', '', rel);
  }

  function montaColunas() {
    painel.esq = el('div', 'cx esq', null, tela);
    var tf = el('div', 'cx tarefas', null, tela);
    el('h3', null, 'Tarefas', tf);
    painel.tarefas = el('div', null, null, tf);
    var av = el('div', 'cx avisos roxa', null, tela);
    el('h3', null, 'Avisos de hoje', av);
    painel.avisos = el('div', null, null, av);
  }

  function montaBaixo() {
    var bx = el('div', 'bx', null, tela);
    var lg = el('div', 'cx logs', null, bx);
    el('h3', null, 'Logs recentes', lg); painel.logs = el('div', null, null, lg);
    var de = el('div', 'cx dest roxa', null, bx);
    el('h3', null, 'Destaque', de); painel.dest = el('div', null, null, de);
    var st = el('div', 'cx stat ciano', null, bx);
    var h = el('h3', null, 'Sistema', st); el('small', null, 'em breve', h);
    ['CPU', 'GPU', 'RAM'].forEach(function (nome) {
      var m = el('div', 'm', null, st); el('span', null, nome, m); el('span', null, 'em breve', m);
    });
    var rp = el('div', 'cx rp', null, tela);
    ['Chaves', 'Silêncio', 'Pedidos'].forEach(function (nome) {
      var b = el('button', 'cfg', nome, rp); b.type = 'button'; b.disabled = true; b.title = 'Em breve: o canal de pedidos ainda não existe';
    });
    el('span', 'em-breve', 'Configurações: em breve', rp);
    var esp = el('span', 'esp', null, rp);
    var lab = el('a', null, 'Laboratório do neurônio', esp); lab.href = 'neuronio.html';
    painel.leve = el('button', 'leve', '', rp); painel.leve.type = 'button';
    painel.leve.addEventListener('click', function () { definirLeve(!leve); });
  }

  // ---------------------------------------------------------------- conteúdo das caixas
  function corDe(id) { var a = AGENTES.filter(function (x) { return x.id === id; })[0]; return a ? cor(a) : '#fff'; }
  function classeEstado(e) { return e === 'ok' || e === 'rodando' ? 'v' : e === 'atencao' ? 'am' : 'ruim'; }

  function desenhaEsq() {
    esvazia(painel.esq);
    painel.lista = {}; painel.volta = null;
    if (!sel) {
      var h = el('h3', null, 'Agentes', painel.esq); el('small', null, AGENTES.length + ' agentes', h);
      AGENTES.forEach(function (a) {
        var d = dados.agentes[a.id];
        var b = el('button', 'ln', null, painel.esq); b.type = 'button'; painel.lista[a.id] = b; b.setAttribute('aria-label', a.nome + ': abrir o detalhe');
        b.addEventListener('click', function () { abrir(a.id); });
        var pt = el('span', 'pt', null, b); pt.style.setProperty('--c', cor(a));
        var n = el('span', 'n', a.nome, b);
        el('small', classeEstado(d ? d.estado : 'parado'), d ? ESTADOS[d.estado] + (d.resumo ? ' · ' + d.resumo : '') : 'Sem dados', n);
        el('span', 'h', d ? d.ultima : '--:--', b);
      });
      return;
    }
    var ag = AGENTES.filter(function (x) { return x.id === sel; })[0], d2 = dados.agentes[sel];
    var t = el('h3', null, ag.nome, painel.esq);
    t.style.color = cor(ag);
    var v = el('button', 'volta', '← voltar', t); v.type = 'button'; painel.volta = v; v.addEventListener('click', function () { abrir(null); });
    var det = el('div', 'det', null, painel.esq);
    if (!d2) { el('div', 'vazio', 'Sem dados deste agente.', det); return; }
    el('div', 'grande ' + classeEstado(d2.estado), ESTADOS[d2.estado], det);
    [['Última rodada', d2.ultima], ['Próxima rodada', d2.proxima], ['Notícias hoje', String(d2.noticias)], ['Alertas hoje', String(d2.alertas)], ['Relatórios', String(d2.relatorios)]]
      .forEach(function (kv) { var l = el('div', 'kv', null, det); el('span', null, kv[0], l); el('span', null, kv[1], l); });
    if (d2.resumo) el('div', 'vazio', d2.resumo, det);
  }

  function desenhaTarefas() {
    esvazia(painel.tarefas);
    if (!dados.tarefas.length) { el('div', 'vazio', 'Nada pendente.', painel.tarefas); return; }
    dados.tarefas.forEach(function (t) {
      var l = el('div', 'tf', null, painel.tarefas);
      el('span', 'pt' + (t.andamento ? '' : ' pe'), null, l);
      var x = el('span', 't', t.texto, l);
      el('small', t.andamento ? '' : 'am', t.andamento ? 'Em execução…' : 'Pendente', x);
      el('span', 'h', t.hora, l);
    });
  }

  function desenhaAvisos() {
    esvazia(painel.avisos);
    el('div', 'num', String(dados.avisos.hoje), painel.avisos);
    [['Críticos', dados.avisos.criticos, 'ruim'], ['Atenção', dados.avisos.atencao, 'am'], ['Normais', dados.avisos.normais, 'v']].forEach(function (k) {
      var l = el('div', 'kv', null, painel.avisos); el('span', null, k[0], l); el('span', k[2], String(k[1]), l);
    });
  }

  function desenhaBaixo() {
    esvazia(painel.logs);
    if (!dados.logs.length) el('div', 'vazio', 'Sem registros.', painel.logs);
    dados.logs.forEach(function (l) {
      var x = el('div', 'lg', null, painel.logs);
      el('span', 'h', l.hora, x);
      var a = el('span', 'a', nomeDe(l.agente), x); a.style.color = corDe(l.agente);
      el('span', null, l.texto, x);
    });
    esvazia(painel.dest);
    if (!dados.destaque) { el('div', 'vazio', 'Nada em destaque.', painel.dest); return; }
    var dd = el('div', 't', dados.destaque.titulo, painel.dest); dd.style.color = corDe(dados.destaque.agente);
    dados.destaque.linhas.forEach(function (l) { el('div', 'l', l, painel.dest); });
  }

  function desenhaGeral() {
    painel.geral.textContent = dados.geral || 'Sem dados';
    painel.geral.className = 'b ' + TONS[dados.tom];
    painel.bola.className = 'bola' + (dados.tom === 'bom' ? '' : ' ' + TONS[dados.tom]);
  }

  function desenhaLeve() {
    painel.leve.textContent = 'Modo leve: ' + (leve ? 'ligado' : 'desligado');
    painel.leve.setAttribute('aria-pressed', leve ? 'true' : 'false');
    painel.leve.title = 'Menos quadros por segundo, sem névoa nem vesículas e neurônios pequenos parados (poupa a GPU)';
  }

  function tique() {
    var d = new Date();
    painel.data.textContent = DIAS[d.getDay()] + ' · ' + z2(d.getDate()) + '/' + z2(d.getMonth() + 1) + '/' + d.getFullYear();
    painel.hora.textContent = z2(d.getHours()) + ':' + z2(d.getMinutes()) + ':' + z2(d.getSeconds());
  }

  function abrir(id) {
    var antes = sel;
    sel = id === sel ? null : id;
    AGENTES.forEach(function (a) { nr[a.id].wrap.classList.toggle('sel', a.id === sel); });
    desenhaEsq();
    // o painel foi refeito: devolve o foco do teclado (ao "voltar" quando abriu, ao botão do agente quando fechou)
    var alvo = sel ? painel.volta : (antes && painel.lista[antes]);
    if (alvo && document.activeElement === document.body) alvo.focus();
  }

  // ---------------------------------------------------------------- escala, leve e laço de animação
  var escala = 1;
  function ajusta() {
    escala = Math.min(window.innerWidth / W, window.innerHeight / H);
    tela.style.transform = 'translate(' + ((window.innerWidth - W * escala) / 2) + 'px,' + ((window.innerHeight - H * escala) / 2) + 'px) scale(' + escala + ')';
    [centro].concat(AGENTES.map(function (a) { return nr[a.id]; })).forEach(function (r) {
      r.n.redimensionar(r.g.w * escala, r.g.h * escala);
      if (r !== centro) r.n.desenhar();
    });
  }

  function definirLeve(v) {
    leve = !!v; gravarLeve();
    [centro].concat(AGENTES.map(function (a) { return nr[a.id]; })).forEach(function (r) {
      r.n.setLeve(leve);
      r.n.redimensionar(r.g.w * escala, r.g.h * escala);
      if (r !== centro || leve) r.n.desenhar();
      if (!leve) r.n.iniciar();
    });
    desenhaLeve();
  }

  var pulsos = [], proximo = 1.5, ultimo = 0;
  function sorteia() {
    var vivos = AGENTES.filter(function (a) { var d = dados.agentes[a.id]; return d && d.estado !== 'parado'; });
    if (!vivos.length) return;
    var a = vivos[Math.floor(Math.random() * vivos.length)], r = nr[a.id];
    var c = document.createElementNS(NS, 'circle');
    c.setAttribute('r', '6'); c.style.setProperty('--c', r.cor); painel.fios.appendChild(c);
    pulsos.push({ r: r, c: c, t: 0, dur: 1.3 });
    if (!leve) r.n.disparar();
    r.wrap.classList.remove('pulso'); void r.wrap.offsetWidth; r.wrap.classList.add('pulso');
  }
  function andaPulsos(dt) {
    proximo -= dt;
    if (proximo <= 0) { sorteia(); proximo = 1.5 + Math.random() * 3; }
    for (var i = pulsos.length - 1; i >= 0; i--) {
      var p = pulsos[i]; p.t += dt;
      var k = Math.min(1, p.t / p.dur), f = p.r.fio;
      p.c.setAttribute('cx', String(f[0] + (f[2] - f[0]) * k)); p.c.setAttribute('cy', String(f[1] + (f[3] - f[1]) * k));
      if (k >= 1) { painel.fios.removeChild(p.c); pulsos.splice(i, 1); centro.n.disparar(); centro.wrap.classList.remove('pulso'); void centro.wrap.offsetWidth; centro.wrap.classList.add('pulso'); }
    }
  }

  function quadro(t) {
    window.requestAnimationFrame(quadro);
    if (document.hidden) { ultimo = 0; return; }        // aba escondida: nada de desenho
    if (!ultimo) ultimo = t;
    var dt = (t - ultimo) / 1000;
    if (leve && dt < 1 / 24) return;                    // modo leve: no máximo 24 quadros por segundo
    ultimo = t;
    centro.n.passo(dt); centro.n.desenhar();
    if (!leve) AGENTES.forEach(function (a) { nr[a.id].n.passo(dt); nr[a.id].n.desenhar(); });
    andaPulsos(Math.min(dt, 0.1));
  }

  // ---------------------------------------------------------------- início
  if (!window.Neuronio) return;
  montaTopo(); montaColunas(); montaCentro(); montaBaixo();
  desenhaGeral(); desenhaEsq(); desenhaTarefas(); desenhaAvisos(); desenhaBaixo(); desenhaLeve(); tique();
  ajusta();
  centro.n.iniciar();
  AGENTES.forEach(function (a) { if (!leve) nr[a.id].n.iniciar(); });
  window.setInterval(tique, 1000);
  var espera = null;
  window.addEventListener('resize', function () { window.clearTimeout(espera); espera = window.setTimeout(ajusta, 150); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && sel) abrir(null); });
  window.requestAnimationFrame(quadro);
}());
