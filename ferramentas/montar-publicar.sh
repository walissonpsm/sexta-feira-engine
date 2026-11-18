#!/usr/bin/env bash
# Monta a pasta publicar/ (o que o servidor do mapa da Sexta-Feira entrega em /engine/) a partir de interface/.
#
#   ferramentas/montar-publicar.sh [PASTA_DO_ENGINE]      (padrão: ENGINE_DIR ou a pasta deste script)
#
# A pasta publicar/ NUNCA é recriada: o serviço do mapa a monta somente leitura no sandbox e só enxerga o "mesmo" diretório
# enquanto ele for o mesmo. Por isso cada arquivo é copiado para um nome oculto (.novo.*) e movido por cima do antigo (rename
# atômico), e depois somem os arquivos que não existem mais em interface/. Só mexe dentro de publicar/.
# Pré-condição: testes/conferir.sh já aprovou interface/ (nomes, extensões, tamanho, sem subpasta nem link).

set -euo pipefail

RAIZ="${1:-${ENGINE_DIR:-$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)}}"
ORIGEM="$RAIZ/interface"
DESTINO="$RAIZ/publicar"

[ -d "$ORIGEM" ] && [ ! -L "$ORIGEM" ] || { echo "montar-publicar: falta $ORIGEM" >&2; exit 1; }
[ ! -L "$DESTINO" ] || { echo "montar-publicar: $DESTINO é link, recuso" >&2; exit 1; }
mkdir -p "$DESTINO"
chmod 755 "$DESTINO"

copiados=()
while IFS= read -r -d '' f; do
    nome="$(basename "$f")"
    [[ "$nome" =~ ^[a-z0-9_-]+\.(html|js|css|woff2|svg|json)$ ]] || { echo "montar-publicar: nome não permitido: $nome" >&2; exit 1; }
    [ -f "$f" ] && [ ! -L "$f" ] || { echo "montar-publicar: não é arquivo comum: $nome" >&2; exit 1; }
    cp -- "$f" "$DESTINO/.novo.$nome"
    chmod 644 "$DESTINO/.novo.$nome"
    mv -f -- "$DESTINO/.novo.$nome" "$DESTINO/$nome"
    copiados+=("$nome")
done < <(find "$ORIGEM" -mindepth 1 -maxdepth 1 -print0)

[ "${#copiados[@]}" -gt 0 ] || { echo "montar-publicar: interface/ vazia" >&2; exit 1; }

# tira o que sobrou de versões antigas (só dentro de publicar/)
while IFS= read -r -d '' velho; do
    nome="$(basename "$velho")"
    achou=0
    for c in "${copiados[@]}"; do [ "$c" = "$nome" ] && achou=1 && break; done
    [ "$achou" -eq 1 ] || rm -f -- "$velho"
done < <(find "$DESTINO" -mindepth 1 -maxdepth 1 -type f -print0)

echo "publicar/ montada com ${#copiados[@]} arquivo(s)."
