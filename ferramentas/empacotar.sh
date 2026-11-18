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

# conferência como o atualizador faz
TMP="$(mktemp -d)"; trap 'rm -rf -- "$TMP"' EXIT
git init -q "$TMP/v"
( cd "$TMP/v" && git bundle verify "$B" >/dev/null 2>&1 ) || { echo "empacotar: bundle verify reprovou" >&2; exit 1; }
git clone --quiet --no-checkout "$B" "$TMP/c" >/dev/null 2>&1
[ "$(git -C "$TMP/c" show "refs/tags/v$V:VERSAO" | tr -d '[:space:]')" = "$V" ] || { echo "empacotar: VERSAO dentro da tag não bate" >&2; exit 1; }
echo "bundle pronto: $B ($(sha256sum "$B" | cut -d' ' -f1))"
