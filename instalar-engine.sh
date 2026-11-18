#!/usr/bin/env bash
# Instala o Sexta-Feira Engine do zero, a partir do bundle (sexta-feira-engine-vX.Y.Z.bundle).
#
#   ./instalar-engine.sh                       usa o sexta-feira-engine-v*.bundle mais novo de ~/Downloads
#   ./instalar-engine.sh /caminho/do.bundle    usa esse bundle
#
# Cria ~/sexta-feira-engine (clone do bundle, no branch main), roda o teste, monta publicar/, cria estado/ e liga o atualizador
# (engine-atualizador.path e .timer) no systemd do usuário. Se existir a deploy key em
# ~/sexta-feira-engine-segredos/github/id_ed25519, liga também o espelho no GitHub. Não usa sudo, Docker nem rede (fora o espelho).
# Se já existir ~/sexta-feira-engine, recusa: use o atualizar-engine.sh.
# Variáveis para teste: ENGINE_DIR, DOWNLOADS_DIR, SYSTEMD_USER_DIR, SEGREDOS_DIR, SEM_SYSTEMD=1.

set -euo pipefail

ENGINE_DIR="${ENGINE_DIR:-$HOME/sexta-feira-engine}"
DOWNLOADS_DIR="${DOWNLOADS_DIR:-$HOME/Downloads}"
SYSTEMD_USER_DIR="${SYSTEMD_USER_DIR:-$HOME/.config/systemd/user}"
SEGREDOS_DIR="${SEGREDOS_DIR:-$HOME/sexta-feira-engine-segredos}"
SEM_SYSTEMD="${SEM_SYSTEMD:-0}"
RE_BUNDLE='^sexta-feira-engine-v([0-9]+\.[0-9]+\.[0-9]+)\.bundle$'

erro() { echo "instalar-engine: $*" >&2; }
log() { echo "instalar-engine: $*"; }
mais_nova() { printf '%s\n%s\n' "$1" "$2" | sort -V | tail -n1; }
maior() { [ "$1" != "$2" ] && [ "$(mais_nova "$1" "$2")" = "$1" ]; }

case "${1:-}" in
    -h|--help) sed -n '2,10p' "$0" | sed 's/^# \{0,1\}//'; exit 0 ;;
    -*) erro "opção desconhecida: $1"; exit 2 ;;
esac

[ "$(id -u)" -ne 0 ] || { erro "não rode como root"; exit 2; }
for c in git sha256sum flock; do command -v "$c" >/dev/null 2>&1 || { erro "falta o comando $c"; exit 2; }; done
if [ "$SEM_SYSTEMD" != 1 ]; then
    command -v systemctl >/dev/null 2>&1 && systemctl --user show-environment >/dev/null 2>&1 \
        || { erro "systemctl --user não está disponível nesta sessão"; exit 2; }
fi

# NOTA: a função abaixo é a mesma do atualizar-engine.sh (testes/conferir.sh confere que as duas são idênticas).
examinar_bundle() {   # $1 = bundle, $2 = versão do nome. Mensagem de motivo em stderr se reprovar.
    local b="$1" v="$2" tmp rc
    tmp="$(mktemp -d "${TMPDIR:-/tmp}/engine-bundle.XXXXXX")" || return 1
    (
        set -euo pipefail
        cd "$tmp"
        git init -q v
        ( cd v && git bundle verify "$b" >/dev/null 2>&1 ) || { echo "git bundle verify reprovou o arquivo" >&2; exit 1; }
        git -c core.hooksPath=/dev/null clone --quiet --no-checkout "$b" c >/dev/null 2>&1 || { echo "não consegui abrir o bundle" >&2; exit 1; }
        cd c
        git rev-parse -q --verify "refs/tags/v$v^{commit}" >/dev/null || { echo "o bundle não tem a tag v$v" >&2; exit 1; }
        vi="$(git show "refs/tags/v$v:VERSAO" 2>/dev/null | tr -d '[:space:]')" || vi=""
        [ "$vi" = "$v" ] || { echo "a versão de dentro ($vi) não bate com o nome do arquivo ($v)" >&2; exit 1; }
        while IFS= read -r -d '' ent; do
            modo="${ent%% *}"; caminho="${ent#*$'\t'}"
            [ "$modo" != 120000 ] || { echo "link simbólico no pacote: $caminho" >&2; exit 1; }
            [ "$modo" != 160000 ] || { echo "submódulo no pacote: $caminho" >&2; exit 1; }
            [ "$caminho" != .gitmodules ] || { echo ".gitmodules no pacote" >&2; exit 1; }
            case "$caminho" in /*) echo "caminho absoluto no pacote: $caminho" >&2; exit 1 ;; esac
            case "/$caminho/" in */../*|*/./*|*/.git/*) echo "caminho suspeito no pacote: $caminho" >&2; exit 1 ;; esac
            [[ "$caminho" =~ [[:cntrl:]] ]] && { echo "caractere de controle em caminho do pacote" >&2; exit 1; }
            case "$caminho" in estado/*|publicar/*) echo "o pacote não pode trazer $caminho" >&2; exit 1 ;; esac
        done < <(git ls-tree -r -z --full-tree "refs/tags/v$v")
        exit 0
    )
    rc=$?
    rm -rf -- "$tmp"
    return "$rc"
}

# --- escolha do bundle --------------------------------------------------------------------------------------------------
BUNDLE=""; V=""
if [ -n "${1:-}" ]; then
    BUNDLE="$1"
    [ -f "$BUNDLE" ] || { erro "não achei $BUNDLE"; exit 1; }
    [[ "$(basename "$BUNDLE")" =~ $RE_BUNDLE ]] || { erro "o nome tem de ser sexta-feira-engine-vX.Y.Z.bundle"; exit 1; }
    V="${BASH_REMATCH[1]}"
else
    for f in "$DOWNLOADS_DIR"/sexta-feira-engine-v*.bundle; do
        [ -f "$f" ] && [ ! -L "$f" ] || continue
        [[ "$(basename "$f")" =~ $RE_BUNDLE ]] || continue
        if [ -z "$V" ] || maior "${BASH_REMATCH[1]}" "$V"; then V="${BASH_REMATCH[1]}"; BUNDLE="$f"; fi
    done
    [ -n "$BUNDLE" ] || { erro "não achei sexta-feira-engine-v*.bundle em $DOWNLOADS_DIR"; exit 1; }
fi
log "bundle: $BUNDLE (v$V)"

if [ -e "$ENGINE_DIR" ]; then
    erro "$ENGINE_DIR já existe. Para atualizar use $ENGINE_DIR/atualizar-engine.sh"
    exit 1
fi

if ! motivo="$(examinar_bundle "$BUNDLE" "$V" 2>&1)"; then
    erro "bundle reprovado na conferência do arquivo: $motivo"; exit 1
fi

# --- clone, teste, publicar, estado -------------------------------------------------------------------------------------
limpar() { rm -rf -- "$ENGINE_DIR"; }
mkdir -p "$(dirname "$ENGINE_DIR")"
git -c core.hooksPath=/dev/null clone --quiet --no-checkout "$BUNDLE" "$ENGINE_DIR" >/dev/null 2>&1 || { erro "não consegui clonar o bundle"; limpar; exit 1; }
if ! git -C "$ENGINE_DIR" checkout --quiet -B main "refs/tags/v$V"; then
    erro "não consegui colocar o main na tag v$V"; limpar; exit 1
fi

ERRO_TESTE="$(mktemp "${TMPDIR:-/tmp}/engine-conferir.XXXXXX")"
if ! ENGINE_DIR="$ENGINE_DIR" bash "$ENGINE_DIR/testes/conferir.sh" >/dev/null 2>"$ERRO_TESTE"; then
    erro "a rodada de teste reprovou:"; cat "$ERRO_TESTE" >&2 || true
    rm -f -- "$ERRO_TESTE"; limpar; exit 1
fi
rm -f -- "$ERRO_TESTE"

bash "$ENGINE_DIR/ferramentas/montar-publicar.sh" "$ENGINE_DIR" >/dev/null || { erro "não consegui montar publicar/"; limpar; exit 1; }
mkdir -p "$ENGINE_DIR/estado"; chmod 700 "$ENGINE_DIR/estado"

# --- unidades do systemd ------------------------------------------------------------------------------------------------
mkdir -p "$SYSTEMD_USER_DIR"
for u in "$ENGINE_DIR"/systemd/*; do
    [ -f "$u" ] && cp -- "$u" "$SYSTEMD_USER_DIR/$(basename "$u")"
done
if [ "$SEM_SYSTEMD" != 1 ]; then
    systemctl --user daemon-reload
    systemctl --user enable --now engine-atualizador.path engine-atualizador.timer
fi

# --- espelho (opcional) -------------------------------------------------------------------------------------------------
if [ -f "$SEGREDOS_DIR/github/id_ed25519" ]; then
    SEGREDOS_DIR="$SEGREDOS_DIR" ENGINE_DIR="$ENGINE_DIR" bash "$ENGINE_DIR/atualizar-engine.sh" --espelhar \
        || erro "aviso: o espelho no GitHub não funcionou agora (a instalação está certa). Tente depois: $ENGINE_DIR/atualizar-engine.sh --espelhar"
else
    log "espelho no GitHub desligado (sem a chave em $SEGREDOS_DIR/github/id_ed25519). Para ligar depois: coloque a chave e rode $ENGINE_DIR/atualizar-engine.sh --espelhar"
fi

log "Sexta-Feira Engine v$V instalada em $ENGINE_DIR"
if command -v notify-send >/dev/null 2>&1; then
    notify-send -a "Sexta-Feira Engine" "Sexta-Feira Engine v$V instalada" "Atualizações: coloque o novo .bundle em ~/Downloads." >/dev/null 2>&1 || true
fi
