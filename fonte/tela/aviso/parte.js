/* O aviso de falha contida (v0.4.2, parte própria na v0.4.3): se uma esfera, um axônio ou QUALQUER parte for desligada, uma linha curta diz quantas e qual foi a última.
 * Não depende de nenhuma outra parte (requer vazio), então avisa mesmo quando a cena ou a própria tela não sobem. O elemento só nasce na falha; texto por textContent, só nomes internos. */
function (usa) {
  'use strict';
  var aviso = null;
  usa.base.aoDesligar(function (nome, todas) {
    if (!aviso) {
      aviso = document.createElement('div');
      aviso.id = 'aviso-falha'; aviso.setAttribute('role', 'status');
      document.body.appendChild(aviso);
    }
    aviso.textContent = (todas && todas.length > 1 ? todas.length + ' partes desligadas (última: ' + nome + ')' : 'Parte desligada: ' + nome) + '. O resto da tela segue.';
  });
  return {};
}
