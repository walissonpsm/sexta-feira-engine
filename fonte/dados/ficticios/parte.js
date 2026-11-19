/* Sexta-Feira Engine v0.3.0: DADOS FICTÍCIOS. Nada aqui é real: serve para ver e ajustar a tela.
 * O formato (formato: 1) é o contrato: quando a Sexta-Feira publicar dados reais, eles chegam neste mesmo formato, um bloco por vez.
 * A tela só aceita o que está na lista branca de tela.js (ids de agente fixos, estados fixos, textos curtos); o resto é ignorado.
 * Regra de privacidade: só contagens e estados; nunca quantidade, preço, valor, segmento, link, fonte nem texto de IA. */
window.SF_DADOS = {
  formato: 1,
  ficticio: true,
  estadoGeral: { tom: 'bom', texto: 'Tudo operando normalmente' },
  agentes: [
    { id: 'fiis', estado: 'rodando', ultima: '11:52', proxima: '12:05', resumo: 'lendo relatórios', contagens: { noticias: 14, alertas: 1, relatorios: 3 } },
    { id: 'acoes-etfs', estado: 'ok', ultima: '11:50', proxima: '12:10', resumo: 'em dia', contagens: { noticias: 9, alertas: 0, relatorios: 0 } },
    { id: 'cripto', estado: 'atencao', ultima: '11:47', proxima: '12:02', resumo: 'fonte lenta', contagens: { noticias: 21, alertas: 2, relatorios: 0 } },
    { id: 'radar', estado: 'ok', ultima: '11:55', proxima: '12:00', resumo: 'em dia', contagens: { noticias: 31, alertas: 1, relatorios: 0 } },
    { id: 'robo', estado: 'ok', ultima: '11:58', proxima: '12:03', resumo: 'rodada do papel', contagens: { noticias: 0, alertas: 0, relatorios: 0 } },
    { id: 'seguranca', estado: 'ok', ultima: '11:30', proxima: '12:30', resumo: 'nada a relatar', contagens: { noticias: 0, alertas: 0, relatorios: 0 } }
  ],
  tarefas: [
    { agente: 'fiis', texto: 'FIIs: lendo relatórios', estado: 'andamento', hora: '11:52' },
    { agente: 'cripto', texto: 'Cripto: próxima busca', estado: 'pendente', hora: '12:02' },
    { agente: 'robo', texto: 'Robô: próxima rodada', estado: 'pendente', hora: '12:03' },
    { agente: 'radar', texto: 'Radar: próxima busca', estado: 'pendente', hora: '12:05' }
  ],
  avisos: { hoje: 7, criticos: 0, atencao: 2, normais: 5 },
  logs: [
    { hora: '11:58', agente: 'robo', texto: 'rodada do papel concluída' },
    { hora: '11:55', agente: 'radar', texto: 'busca concluída, 2 temas novos' },
    { hora: '11:52', agente: 'fiis', texto: 'relatório gerencial lido' },
    { hora: '11:50', agente: 'acoes-etfs', texto: 'busca concluída, sem novidade' },
    { hora: '11:47', agente: 'cripto', texto: 'fonte demorou a responder' }
  ],
  destaque: { agente: 'fiis', titulo: 'Relatório gerencial novo', linhas: ['Fundo 3 de 12', 'Nível: atenção', 'Aviso enviado'] },
  sistema: { cpu: null, gpu: null, ram: null },
  // que módulos cada agente costuma pedir (a lista repete o módulo para ele aparecer mais; o Robô pede mais a internet). Só ids fixos; nunca valor nem dado.
  pedidos: {
    robo: ['internet', 'internet', 'internet', 'telegram', 'planilha'], fiis: ['planilha', 'internet', 'telegram', 'planilha'], 'acoes-etfs': ['planilha', 'internet', 'painel'],
    cripto: ['internet', 'internet', 'telegram', 'planilha'], seguranca: ['backup', 'salas', 'aprendido', 'mapa'], radar: ['internet', 'telegram', 'resumo']
  }
};
