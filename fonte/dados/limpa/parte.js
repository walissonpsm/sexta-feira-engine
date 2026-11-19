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
