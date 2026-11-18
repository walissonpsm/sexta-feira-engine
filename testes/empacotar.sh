#!/usr/bin/env bash
# Testa o ferramentas/empacotar.sh num clone descartável: clone raso é recusado e clone completo gera um bundle que o PC aceitaria
# shellcheck disable=SC2034  # variáveis lidas dentro de eval
# (verify + o mesmo fetch das tags + versão anterior como ancestral). Roda sobre o ÚLTIMO COMMIT do repositório (não sobre arquivos soltos).
#
#   bash testes/empacotar.sh        (precisa de git; roda em segundos)

set -uo pipefail

REPO="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
T="$(mktemp -d "${TMPDIR:-/tmp}/engine-empacotar.XXXXXX")"
trap 'rm -rf -- "$T"' EXIT
export GIT_AUTHOR_NAME=t GIT_AUTHOR_EMAIL=t@t GIT_COMMITTER_NAME=t GIT_COMMITTER_EMAIL=t@t ENGINE_TESTE=1

PASSOU=0; FALHOU=0
confere() { if eval "$2"; then PASSOU=$((PASSOU + 1)); echo "ok: $1"; else FALHOU=$((FALHOU + 1)); echo "FALHA: $1" >&2; fi; }

# clone raso (profundidade 1 de um clone com mais de um commit): tem de ser recusado
git clone -q --depth 1 "file://$REPO" "$T/raso" 2>/dev/null
mkdir -p "$T/saida1"
msg="$(bash "$T/raso/ferramentas/empacotar.sh" "$T/saida1" 2>&1)"; rc=$?
if [ "$(git -C "$T/raso" rev-parse --is-shallow-repository)" = "true" ]; then
    confere "clone raso é recusado" '[ "$rc" -ne 0 ] && [[ "$msg" == *raso* ]]'
    confere "clone raso não deixa bundle" '[ -z "$(ls -A "$T/saida1")" ]'
else
    echo "aviso: o repositório só tem um commit, o clone não ficou raso; caso pulado"
fi

# clone completo: gera o bundle e ele passa na conferência do atualizador
git clone -q "file://$REPO" "$T/completo" 2>/dev/null
mkdir -p "$T/saida2"
if V="$(tr -d '[:space:]' < "$T/completo/VERSAO")" && saida="$(bash "$T/completo/ferramentas/empacotar.sh" "$T/saida2" 2>&1)"; then
    B="$T/saida2/sexta-feira-engine-v$V.bundle"
    confere "clone completo gera o bundle" '[ -f "$B" ]'
    git init -q --bare "$T/v"
    confere "o fetch das tags do bundle funciona (como no PC)" 'git -C "$T/v" fetch -q "$B" "+refs/tags/*:refs/tags/*"'
    confere "o bundle traz todos os objetos" 'git -C "$T/v" fsck --connectivity-only >/dev/null 2>&1'
else
    FALHOU=$((FALHOU + 1)); echo "FALHA: clone completo não empacotou: $saida" >&2
fi

echo "---- $PASSOU ok, $FALHOU falha(s)"
[ "$FALHOU" -eq 0 ]
