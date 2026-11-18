#!/usr/bin/env bash
# Atualiza o Sexta-Feira Engine só pelo bundle do git (sexta-feira-engine-vX.Y.Z.bundle em ~/Downloads).
#
#   ./atualizar-engine.sh                       usa o sexta-feira-engine-v*.bundle mais novo de ~/Downloads
#   ./atualizar-engine.sh /caminho/do.bundle    usa esse bundle (precisa ser mais novo que o instalado)
#   ./atualizar-engine.sh --auto                modo automático (a unidade engine-atualizador usa este): sem perguntas, sai calado
#                                               se não há versão mais nova; instala e AVISA na área de trabalho
#   ./atualizar-engine.sh --voltar v0.1.0       volta o código para essa versão; o automático não reinstala a recusada
#   ./atualizar-engine.sh --espelhar            envia main e tags ao GitHub (origin), se o espelho estiver ligado
#
# Só avança (fast-forward) e só se você não alterou arquivos versionados. Se o teste (testes/conferir.sh), a pasta publicar/ ou o
# systemd falhar, a versão anterior volta e o bundle recusado nunca mais é tentado sozinho. Não usa sudo, Docker nem rede (fora o
# git push do espelho) e nunca lê nada de ~/sexta-feira. Só apaga dentro de estado/ e publicar/.
# Variáveis para teste: ENGINE_DIR, DOWNLOADS_DIR, SYSTEMD_USER_DIR, SEGREDOS_DIR, SEM_SYSTEMD=1, ESTAVEL_SEG, MAX_ESPERA, ENGINE_TESTE=1 (aceita rodar como root).

set -euo pipefail

ENGINE_DIR="${ENGINE_DIR:-$HOME/sexta-feira-engine}"
export ENGINE_DIR
DOWNLOADS_DIR="${DOWNLOADS_DIR:-$HOME/Downloads}"
SYSTEMD_USER_DIR="${SYSTEMD_USER_DIR:-$HOME/.config/systemd/user}"
SEM_SYSTEMD="${SEM_SYSTEMD:-0}"
ESTAVEL_SEG="${ESTAVEL_SEG:-5}"
MAX_ESPERA="${MAX_ESPERA:-120}"
ESTADO="$ENGINE_DIR/estado"
RE_BUNDLE='^sexta-feira-engine-v((0|[1-9][0-9]*)\.(0|[1-9][0-9]*)\.(0|[1-9][0-9]*))\.bundle$'

AUTO=0; VOLTAR=""; ESPELHAR=0; BUNDLE_ARG=""

uso() { sed -n '2,13p' "$0" | sed 's/^# \{0,1\}//'; }

case "${1:-}" in
    --auto) AUTO=1 ;;
    --voltar) VOLTAR="${2:-}"; [[ "$VOLTAR" =~ ^v(0|[1-9][0-9]*)\.(0|[1-9][0-9]*)\.(0|[1-9][0-9]*)$ ]] || { echo "uso: --voltar vX.Y.Z" >&2; exit 2; } ;;
    --espelhar) ESPELHAR=1 ;;
    -h|--help) uso; exit 0 ;;
    "") ;;
    -*) echo "opção desconhecida: $1" >&2; uso >&2; exit 2 ;;
    *) BUNDLE_ARG="$1" ;;
esac

[ "$(id -u)" -ne 0 ] || [ "${ENGINE_TESTE:-0}" = 1 ] || { echo "não rode como root" >&2; exit 2; }

D() { git -C "$ENGINE_DIR" "$@"; }
log() { echo "engine-atualizador: $*"; }
erro() { echo "engine-atualizador: $*" >&2; }
agora_br() { date '+%d/%m/%Y %H:%M'; }
soma_de() { sha256sum "$1" 2>/dev/null | cut -d' ' -f1; }
mais_nova() { printf '%s\n%s\n' "$1" "$2" | sort -V | tail -n1; }
maior() { [ "$1" != "$2" ] && [ "$(mais_nova "$1" "$2")" = "$1" ]; }   # $1 é estritamente mais nova que $2

avisar() {   # aviso na área de trabalho; nunca derruba a atualização
    if command -v notify-send >/dev/null 2>&1; then
        notify-send -a "Sexta-Feira Engine" -- "$1" "${2:-}" >/dev/null 2>&1 || true
    fi
}

# --- pasta instalada, trava ---------------------------------------------------------------------------------------------
if [ ! -d "$ENGINE_DIR/.git" ] || [ ! -f "$ENGINE_DIR/VERSAO" ]; then
    if [ "$AUTO" -eq 1 ]; then exit 0; fi
    erro "não achei a instalação em $ENGINE_DIR (use instalar-engine.sh)"; exit 1
fi
mkdir -p "$ESTADO"; chmod 700 "$ESTADO"
exec 9>"$ESTADO/atualizador.trava"
flock -n 9 || { [ "$AUTO" -eq 1 ] && exit 0; erro "já há outro atualizador rodando"; exit 1; }

VERSAO_INSTALADA="$(tr -d '[:space:]' < "$ENGINE_DIR/VERSAO")"

# --- espelho opcional ---------------------------------------------------------------------------------------------------
SEGREDOS_DIR="${SEGREDOS_DIR:-$HOME/sexta-feira-segredos/sexta-feira-engine}"   # só a chave de github/ daqui; o resto de sexta-feira-segredos é da Sexta-Feira
ENGINE_ORIGIN="${ENGINE_ORIGIN:-git@github.com:walissonpsm/sexta-feira-engine.git}"

ligar_espelho() {   # com a deploy key no lugar, configura o origin e liga o espelho (marca em estado/espelho)
    local chave="$SEGREDOS_DIR/github/id_ed25519" chave_q atual
    [ -f "$chave" ] && [ ! -L "$chave" ] || return 0
    printf -v chave_q '%q' "$chave"
    D config core.sshCommand "ssh -i $chave_q -o IdentitiesOnly=yes -o StrictHostKeyChecking=accept-new -o BatchMode=yes"
    atual="$(D remote get-url origin 2>/dev/null || true)"
    if [ -z "$atual" ]; then D remote add origin "$ENGINE_ORIGIN"
    elif [[ "$atual" == *.bundle ]]; then D remote set-url origin "$ENGINE_ORIGIN"; fi
    : > "$ESTADO/espelho"
}

espelhar() {   # devolve 0 mesmo se falhar quando $1 = suave (depois de uma instalação: só avisa)
    local suave="${1:-}"
    ligar_espelho
    if [ ! -f "$ESTADO/espelho" ]; then
        [ "$suave" = suave ] || erro "espelho desligado: coloque a chave (deploy key com escrita) em $SEGREDOS_DIR/github/id_ed25519 e rode de novo"
        return 0
    fi
    if ! D remote get-url origin >/dev/null 2>&1; then
        erro "espelho: não há remoto origin"; [ "$suave" = suave ] && return 0 || return 1
    fi
    if timeout 120 git -C "$ENGINE_DIR" push --quiet origin main && timeout 120 git -C "$ENGINE_DIR" push --quiet origin 'refs/tags/*'; then
        log "espelho no GitHub em dia"
    else
        erro "aviso: não consegui espelhar no GitHub (isso não afeta a instalação). Tente depois: ./atualizar-engine.sh --espelhar"
        [ "$suave" = suave ] && return 0 || return 1
    fi
}

if [ "$ESPELHAR" -eq 1 ]; then espelhar; exit $?; fi

# --- unidades do systemd ------------------------------------------------------------------------------------------------
NOVAS_UNIDADES=()
sincronizar_unidades() {   # copia as unidades que mudaram; liga só .path e .timer novos. Devolve 1 se o systemd falhar.
    local u nome dest mudou=0
    NOVAS_UNIDADES=()
    mkdir -p "$SYSTEMD_USER_DIR"
    for u in "$ENGINE_DIR"/systemd/*; do
        [ -f "$u" ] || continue
        nome="$(basename "$u")"; dest="$SYSTEMD_USER_DIR/$nome"
        if [ ! -e "$dest" ]; then
            cp -- "$u" "$dest"; NOVAS_UNIDADES+=("$nome"); mudou=1
        elif ! cmp -s "$u" "$dest"; then
            cp -- "$u" "$dest"; mudou=1
        fi
    done
    [ "$mudou" -eq 1 ] || return 0
    [ "$SEM_SYSTEMD" = 1 ] && return 0
    command -v systemctl >/dev/null 2>&1 || { erro "systemctl não encontrado"; return 1; }
    systemctl --user daemon-reload || return 1
    for nome in "${NOVAS_UNIDADES[@]}"; do
        case "$nome" in *.path|*.timer) systemctl --user enable --now "$nome" || return 1 ;; esac
    done
    return 0
}

desfazer_unidades_novas() {   # usado no rollback: tira o que a tentativa acabou de ligar
    local nome
    for nome in "${NOVAS_UNIDADES[@]}"; do
        if [ "$SEM_SYSTEMD" != 1 ] && command -v systemctl >/dev/null 2>&1; then
            case "$nome" in *.path|*.timer) systemctl --user disable --now "$nome" >/dev/null 2>&1 || true ;; esac
        fi
        rm -f -- "$SYSTEMD_USER_DIR/$nome"
    done
    NOVAS_UNIDADES=()
}

voltar_commit() {   # rollback do código; se nem isso o git deixar, avisa claro e para
    if ! D reset --keep -q "$1"; then
        erro "CRÍTICO: não consegui voltar o código para $1. Rode: git -C $ENGINE_DIR reset --keep $1"
        avisar "Engine: rollback falhou" "Não consegui voltar o código. Veja o journal: journalctl --user -u engine-atualizador -e"
        exit 1
    fi
}

montar_publicar() { bash "$ENGINE_DIR/ferramentas/montar-publicar.sh" "$ENGINE_DIR" >/dev/null; }
rodar_conferencia() { bash "$ENGINE_DIR/testes/conferir.sh" >/dev/null; }

# --- conferência do arquivo (clone descartável) -------------------------------------------------------------------------
examinar_bundle() {   # $1 = bundle, $2 = versão do nome. Mensagem de motivo em stderr se reprovar.
    local b="$1" v="$2" tmp rc
    tmp="$(mktemp -d "${TMPDIR:-/tmp}/engine-bundle.XXXXXX")" || return 1
    (
        set -euo pipefail
        cd "$tmp"
        git init -q v
        ( cd v && git bundle verify "$b" >/dev/null 2>&1 ) || { echo "git bundle verify reprovou o arquivo" >&2; exit 1; }
        git -c core.hooksPath=/dev/null -c transfer.fsckObjects=true clone --quiet --no-checkout "$b" c >/dev/null 2>&1 || { echo "não consegui abrir o bundle" >&2; exit 1; }
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

esperar_estavel() {   # espera o download terminar: tamanho igual em duas leituras seguidas
    local f="$1" a b i=0
    a="$(stat -c %s "$f" 2>/dev/null)" || return 1
    while :; do
        sleep "$ESTAVEL_SEG"
        b="$(stat -c %s "$f" 2>/dev/null)" || return 1
        [ "$a" = "$b" ] && return 0
        a="$b"; i=$((i + 1))
        [ "$i" -lt "$MAX_ESPERA" ] || return 1
    done
}

registrar_falha() {   # $1 soma  $2 versão  $3 motivo
    printf '%s  v%s  %s  %s\n' "$1" "$2" "$(agora_br)" "$3" >> "$ESTADO/atualizador-falhou.txt"
}

ignorada() { local ign=""; [ -f "$ESTADO/atualizador-ignorar.txt" ] && ign="$(head -n1 "$ESTADO/atualizador-ignorar.txt" | tr -d '[:space:]')"; echo "$ign"; }

# --- escolha ------------------------------------------------------------------------------------------------------------
escolher_bundle() {   # imprime "versão caminho" do mais novo que vale a pena, ou nada
    local f nome v ign soma melhor="" melhor_v=""
    ign="$(ignorada)"
    for f in "$DOWNLOADS_DIR"/sexta-feira-engine-v*.bundle; do
        [ -e "$f" ] || continue
        nome="$(basename "$f")"
        [[ "$nome" =~ $RE_BUNDLE ]] || continue
        v="${BASH_REMATCH[1]}"
        maior "$v" "$VERSAO_INSTALADA" || continue
        if [ -n "$ign" ] && ! maior "$v" "$ign"; then continue; fi
        { [ -f "$f" ] && [ ! -L "$f" ] && [ -O "$f" ]; } || continue
        if [ "$AUTO" -eq 1 ]; then
            soma="$(soma_de "$f")"
            if [ -f "$ESTADO/atualizador-falhou.txt" ] && grep -q "^$soma " "$ESTADO/atualizador-falhou.txt"; then continue; fi
        fi
        if [ -z "$melhor_v" ] || maior "$v" "$melhor_v"; then melhor="$f"; melhor_v="$v"; fi
    done
    [ -z "$melhor" ] || printf '%s %s\n' "$melhor_v" "$melhor"
}

notas_da_versao() {   # primeiras linhas do CHANGELOG da versão $1 (já instalada)
    awk -v v="$1" '
        $0 ~ "^## v" v " " { dentro = 1; next }
        dentro && /^## / { exit }
        dentro && NF { print }
    ' "$ENGINE_DIR/CHANGELOG.md" | head -n 8 | cut -c1-160
}

# --- voltar -------------------------------------------------------------------------------------------------------------
if [ -n "$VOLTAR" ]; then
    alvo="${VOLTAR#v}"
    D rev-parse -q --verify "refs/tags/$VOLTAR^{commit}" >/dev/null || { erro "não conheço a tag $VOLTAR aqui"; exit 1; }
    maior "$VERSAO_INSTALADA" "$alvo" || { erro "$VOLTAR não é anterior à instalada (v$VERSAO_INSTALADA)"; exit 1; }
    [ -z "$(D status --porcelain --untracked-files=no)" ] || { erro "há arquivos versionados alterados à mão; recuso"; exit 1; }
    [ "$(D symbolic-ref --short -q HEAD || true)" = main ] || { erro "a pasta instalada não está no main; recuso"; exit 1; }
    anterior="$(D rev-parse HEAD)"
    D reset --keep -q "refs/tags/$VOLTAR" || { erro "o git não conseguiu voltar para $VOLTAR (nada foi alterado)"; exit 1; }
    if rodar_conferencia && montar_publicar && sincronizar_unidades; then
        printf '%s\n' "$VERSAO_INSTALADA" > "$ESTADO/atualizador-ignorar.txt"
        log "voltei de v$VERSAO_INSTALADA para $VOLTAR; o automático só instala versão acima de v$VERSAO_INSTALADA"
        avisar "Engine voltou para $VOLTAR" "Estava na v$VERSAO_INSTALADA. O automático só instala versão mais nova que ela."
        exit 0
    fi
    erro "a rodada de teste da $VOLTAR falhou; volto para v$VERSAO_INSTALADA"
    desfazer_unidades_novas
    voltar_commit "$anterior"
    montar_publicar || true
    sincronizar_unidades || true
    exit 1
fi

# --- escolha do pacote --------------------------------------------------------------------------------------------------
BUNDLE=""; VNOVA=""
if [ -n "$BUNDLE_ARG" ]; then
    { [ -f "$BUNDLE_ARG" ] && [ ! -L "$BUNDLE_ARG" ]; } || { erro "não achei $BUNDLE_ARG (ou é link)"; exit 1; }
    nome="$(basename "$BUNDLE_ARG")"
    [[ "$nome" =~ $RE_BUNDLE ]] || { erro "o nome tem de ser sexta-feira-engine-vX.Y.Z.bundle"; exit 1; }
    VNOVA="${BASH_REMATCH[1]}"; BUNDLE="$BUNDLE_ARG"
    maior "$VNOVA" "$VERSAO_INSTALADA" || { erro "v$VNOVA não é mais nova que a instalada (v$VERSAO_INSTALADA). Para voltar use --voltar"; exit 1; }
    ign="$(ignorada)"
    if [ -n "$ign" ] && ! maior "$VNOVA" "$ign"; then erro "v$VNOVA não passa da versão ignorada (v$ign)"; exit 1; fi
else
    achado="$(escolher_bundle)"
    if [ -z "$achado" ]; then
        [ "$AUTO" -eq 1 ] || log "nada mais novo que v$VERSAO_INSTALADA em $DOWNLOADS_DIR"
        exit 0
    fi
    VNOVA="${achado%% *}"; BUNDLE="${achado#* }"
fi

if ! esperar_estavel "$BUNDLE"; then
    erro "o arquivo $(basename "$BUNDLE") não parou de crescer (ou sumiu); tento de novo no próximo disparo"
    exit 0
fi
COPIA="$ESTADO/pacote.$$.bundle"   # tudo abaixo (soma, conferência, fetch) usa esta cópia, não o arquivo de ~/Downloads
trap 'rm -f -- "$COPIA"' EXIT
cp -- "$BUNDLE" "$COPIA" || { erro "não consegui copiar o bundle para $ESTADO"; exit 0; }
SOMA="$(soma_de "$COPIA")"

if ! motivo="$(examinar_bundle "$COPIA" "$VNOVA" 2>&1)"; then
    erro "bundle $(basename "$BUNDLE") reprovado na conferência do arquivo (não registrado): $motivo"
    exit 0
fi

recusar() {   # depois da conferência do arquivo: registra, avisa, devolve 1
    registrar_falha "$SOMA" "$VNOVA" "$1"
    D tag -d "v$VNOVA" >/dev/null 2>&1 || true   # tag buscada e não instalada nunca sobe ao espelho
    erro "recusei a v$VNOVA: $1"
    avisar "Engine: v$VNOVA recusada" "$1 Continua na v$VERSAO_INSTALADA."
    return 1
}

# --- conferências antes de mexer ----------------------------------------------------------------------------------------
if [ -n "$(D status --porcelain --untracked-files=no)" ]; then
    recusar "há arquivos versionados alterados à mão na pasta instalada." || exit 1
fi
if [ "$(D symbolic-ref --short -q HEAD || true)" != main ]; then
    recusar "a pasta instalada não está no branch main." || exit 1
fi
ANTERIOR="$(D rev-parse HEAD)"
if ! git -c transfer.fsckObjects=true -C "$ENGINE_DIR" fetch --quiet "$COPIA" "+refs/tags/v$VNOVA:refs/tags/v$VNOVA" >/dev/null 2>&1; then
    recusar "não consegui ler a tag v$VNOVA do bundle." || exit 1
fi
if ! D merge-base --is-ancestor "$ANTERIOR" "refs/tags/v$VNOVA"; then
    recusar "a história do bundle não continua a partir do commit instalado." || exit 1
fi

# --- instalação com rollback --------------------------------------------------------------------------------------------
MOTIVO_FALHA=""
if ! D merge --ff-only --quiet "refs/tags/v$VNOVA" >/dev/null 2>&1; then
    recusar "o git não conseguiu avançar (fast-forward) para a v$VNOVA." || exit 1
fi

instalar_passos() {
    [ "$(tr -d '[:space:]' < "$ENGINE_DIR/VERSAO")" = "$VNOVA" ] || { MOTIVO_FALHA="VERSAO depois do merge não é $VNOVA."; return 1; }
    rodar_conferencia || { MOTIVO_FALHA="a rodada de teste (testes/conferir.sh) reprovou."; return 1; }
    montar_publicar || { MOTIVO_FALHA="não consegui montar a pasta publicar/."; return 1; }
    sincronizar_unidades || { MOTIVO_FALHA="o systemd não aceitou as unidades."; return 1; }
    return 0
}

if ! instalar_passos; then
    erro "falhou: $MOTIVO_FALHA Voltando para v$VERSAO_INSTALADA."
    desfazer_unidades_novas
    voltar_commit "$ANTERIOR"
    montar_publicar || erro "aviso: não consegui remontar publicar/ da versão anterior"
    sincronizar_unidades || erro "aviso: não consegui restaurar as unidades da versão anterior"
    recusar "$MOTIVO_FALHA" || exit 1
fi

# --- deu certo ----------------------------------------------------------------------------------------------------------
NOTAS="$(notas_da_versao "$VNOVA")"
log "atualizada de v$VERSAO_INSTALADA para v$VNOVA em $(agora_br)"
avisar "Engine atualizada de v$VERSAO_INSTALADA para v$VNOVA" "$NOTAS"
espelhar suave
exit 0
