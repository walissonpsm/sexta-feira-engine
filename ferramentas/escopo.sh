#!/usr/bin/env bash
# Confere o ESCOPO de uma versão: quais partes de fonte/<camada>/<parte>/ mudaram desde a tag anterior tem de bater com a linha "Pastas:" que vem
# logo abaixo do título da versão no topo do CHANGELOG.md. Quem mexe em uma parte diz quais; o que mudou sem ser dito, ou foi dito sem mudar, reprova.
#
#   ferramentas/escopo.sh [TAG_ANTERIOR]      (padrão: a tag logo abaixo da VERSAO atual; sem tag anterior, só mostra)
#
# Formato da linha:  Pastas: ligacoes/ponta, cena/quadro      |  Pastas: nenhuma      |  Pastas: todas (quando mexe em base, comum ou cores, ou em tudo)
# Mudar base/, comum/ ou cores/ AFETA TODAS as partes (todas as partes de desenho leem as cores, as curvas e o sorteio): exige "todas" e o teste de imagem inteiro.
# Só lê o git e o CHANGELOG.md; não escreve nada.

set -euo pipefail
RAIZ="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$RAIZ"

V="$(tr -d '[:space:]' < VERSAO)"
ANT="${1:-$(git tag --list 'v[0-9]*' | sort -V | awk -v c="v$V" '$0 == c { print prev; exit } { prev = $0 }')}"
if [ -z "$ANT" ]; then
    # a tag desta versão ainda não existe (empacotar cria depois): a anterior é a maior tag abaixo da VERSAO
    ANT="$(git tag --list 'v[0-9]*' | sort -V | awk -v c="v$V" '$0 != c { prev = $0 } END { print prev }')"
fi
[ -n "$ANT" ] || { echo "escopo: sem tag anterior (primeira versão): nada a conferir"; exit 0; }

mudou="$(git diff --name-only "$ANT" HEAD -- fonte | sed -n 's#^fonte/\([a-z0-9_-]*\)/\([a-z0-9_-]*\)/.*#\1/\2#p' | sort -u)"
afeta=0
if [ -n "$mudou" ] && printf '%s\n' "$mudou" | grep -qE '^(base|comum|cores)/'; then afeta=1; fi
todas="$(find fonte -mindepth 3 -maxdepth 3 -name PARTE | sed 's#^fonte/\([^/]*\)/\([^/]*\)/PARTE$#\1/\2#' | sort -u)"

linha="$(awk '/^## v/ { if (achou) exit; achou = 1; next } achou && /^Pastas:/ { print; exit }' CHANGELOG.md)"
[ -n "$linha" ] || { echo "escopo: falta a linha 'Pastas:' logo abaixo do título da versão no topo do CHANGELOG.md (mudou desde $ANT: ${mudou:-nenhuma})" >&2; exit 1; }
decl="$(printf '%s' "${linha#Pastas:}" | grep -oE '[a-z0-9_-]+/[a-z0-9_-]+' | sort -u || true)"
tem_todas=0; printf '%s' "$linha" | grep -qiE '(^|[^a-z])todas([^a-z]|$)' && tem_todas=1

if [ "$afeta" -eq 1 ]; then
    echo "escopo: AFETA TODAS (mudou base, comum ou cores desde $ANT): rode o teste de imagem inteiro"
    [ "$tem_todas" -eq 1 ] || { echo "escopo: mudou base, comum ou cores, então a linha 'Pastas:' tem de dizer 'todas'" >&2; exit 1; }
    echo "escopo: ok (Pastas: todas; partes que mudaram: $(printf '%s' "$mudou" | tr '\n' ' '))"
    exit 0
fi
if [ "$tem_todas" -eq 1 ]; then
    [ "$mudou" = "$todas" ] || { echo "escopo: a linha diz 'todas', mas só mudaram: ${mudou:-nenhuma}" >&2; exit 1; }
    echo "escopo: ok (Pastas: todas)"; exit 0
fi
if printf '%s' "$linha" | grep -qiE 'nenhuma'; then decl=""; fi
if [ "$decl" = "$mudou" ]; then
    echo "escopo: ok (desde $ANT: ${mudou:-nenhuma parte})"
else
    echo "escopo: a linha 'Pastas:' do CHANGELOG não bate com o que mudou desde $ANT" >&2
    echo "  mudou:  $(printf '%s' "$mudou" | tr '\n' ' ')" >&2
    echo "  disse:  $(printf '%s' "$decl" | tr '\n' ' ')" >&2
    exit 1
fi
