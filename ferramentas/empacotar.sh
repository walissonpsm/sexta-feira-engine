#!/usr/bin/env bash
# Cria a tag leve vX.Y.Z no HEAD e o bundle sexta-feira-engine-vX.Y.Z.bundle (só na nuvem; o dono nunca roda isto).
#
#   ferramentas/empacotar.sh [PASTA_DE_SAIDA]      (padrão: a pasta atual)
#
# Confere antes: árvore limpa, VERSAO igual ao topo do CHANGELOG, testes/conferir.sh aprovado. Depois confere o bundle como o
# atualizador confere (verify, tag, VERSAO de dentro). Não empurra nada para o GitHub: o main e as tags só andam pelo espelho do PC.

set -euo pipefail

RAIZ="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SAIDA="$(cd "${1:-.}" && pwd)"
cd "$RAIZ"

[ -z "$(git status --porcelain)" ] || { echo "empacotar: há alterações sem commit" >&2; exit 1; }
# clone raso gera bundle sem os objetos antigos: o "git bundle verify" passa, mas o fetch das tags no PC falha (aconteceu na Sexta-Feira v0.55.0)
[ "$(git rev-parse --is-shallow-repository)" = "false" ] || { echo "empacotar: este clone é raso; rode: git fetch --unshallow" >&2; exit 1; }
V="$(tr -d '[:space:]' < VERSAO)"
[[ "$V" =~ ^(0|[1-9][0-9]*)\.(0|[1-9][0-9]*)\.(0|[1-9][0-9]*)$ ]] || { echo "empacotar: VERSAO inválida: $V" >&2; exit 1; }
TOPO="$(sed -n 's/^## v\([0-9][0-9.]*\) .*/\1/p' CHANGELOG.md | head -n1)"
[ "$TOPO" = "$V" ] || { echo "empacotar: o topo do CHANGELOG ($TOPO) não é a VERSAO ($V)" >&2; exit 1; }
bash testes/conferir.sh >/dev/null || { echo "empacotar: testes/conferir.sh reprovou" >&2; exit 1; }

if git rev-parse -q --verify "refs/tags/v$V" >/dev/null; then
    [ "$(git rev-parse "refs/tags/v$V^{commit}")" = "$(git rev-parse HEAD)" ] || { echo "empacotar: a tag v$V já existe em outro commit" >&2; exit 1; }
else
    git tag "v$V"
fi

B="$SAIDA/sexta-feira-engine-v$V.bundle"
rm -f -- "$B"
git bundle create "$B" --branches --tags >/dev/null 2>&1

# conferência como o atualizador faz (examinar_bundle): verify, o MESMO fetch das tags num repositório vazio, objetos completos e
# a versão anterior como ancestral. Qualquer falha apaga o bundle: nunca sobra um arquivo que o PC recusaria.
TMP="$(mktemp -d)"; trap 'rm -rf -- "$TMP"' EXIT
recusa() { rm -f -- "$B"; echo "empacotar: $1 (bundle apagado)" >&2; exit 1; }
git init -q --bare "$TMP/v"
git -C "$TMP/v" bundle verify "$B" >/dev/null 2>&1 || recusa "bundle verify reprovou"
git -C "$TMP/v" fetch -q "$B" '+refs/tags/*:refs/tags/*' >/dev/null 2>&1 || recusa "o fetch das tags do bundle falhou (clone raso?)"
git -C "$TMP/v" fsck --connectivity-only >/dev/null 2>&1 || recusa "o bundle não traz todos os objetos"
ANTERIOR="$(git tag --list 'v[0-9]*' | sort -V | awk -v c="v$V" '$0 == c { print prev; exit } { prev = $0 }')"   # a tag logo abaixo desta (vazio na primeira versão)
if [ -n "$ANTERIOR" ]; then
    git -C "$TMP/v" merge-base --is-ancestor "$ANTERIOR" "v$V" || recusa "a versão anterior ($ANTERIOR) não é ancestral de v$V"
fi
git clone --quiet --no-checkout "$B" "$TMP/c" >/dev/null 2>&1 || recusa "não consegui clonar o bundle"
[ "$(git -C "$TMP/c" show "refs/tags/v$V:VERSAO" | tr -d '[:space:]')" = "$V" ] || recusa "a VERSAO dentro da tag não bate"
echo "bundle pronto: $B ($(sha256sum "$B" | cut -d' ' -f1))"
