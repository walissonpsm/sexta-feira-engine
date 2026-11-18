#!/usr/bin/env bash
# Rodada de teste do engine (a única; o instalador e o atualizador chamam esta).
# Sai com código diferente de zero se qualquer conferência falhar. Só lê arquivos: não escreve, não usa rede.
#
#   testes/conferir.sh            confere a pasta onde este script mora (ou ENGINE_DIR)

set -uo pipefail

RAIZ="${ENGINE_DIR:-$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)}"
cd "$RAIZ" || { echo "FALHA: não achei a pasta $RAIZ" >&2; exit 2; }

FALHAS=0
falha() { echo "FALHA: $*" >&2; FALHAS=$((FALHAS + 1)); }
ok() { echo "ok: $*"; }

lista_versionados() {   # arquivos versionados (git) ou, sem git, todos fora de .git/estado/publicar
    if [ -d .git ] && command -v git >/dev/null 2>&1; then
        git ls-files
    else
        find . -type f ! -path './.git/*' ! -path './estado/*' ! -path './publicar/*' ! -name '*.bundle' | sed 's|^\./||'
    fi
}

# 1. VERSAO e CHANGELOG ------------------------------------------------------------------------------------------------
if [ -f VERSAO ]; then
    v="$(head -n1 VERSAO | tr -d '[:space:]')"
    if [[ "$v" =~ ^[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
        topo="$(sed -n 's/^## v\([0-9][0-9.]*\) .*/\1/p' CHANGELOG.md 2>/dev/null | head -n1)"
        if [ "$topo" = "$v" ]; then ok "VERSAO $v bate com o topo do CHANGELOG"; else falha "VERSAO ($v) diferente do topo do CHANGELOG ($topo)"; fi
    else
        falha "VERSAO com formato inválido: $v"
    fi
else
    falha "falta o arquivo VERSAO"
fi
[ "$(cat CLAUDE.md 2>/dev/null)" = "@AGENTS.md" ] || falha "CLAUDE.md tem de ser exatamente @AGENTS.md"

# 2. arquivos da interface ---------------------------------------------------------------------------------------------
if [ -d interface ] && [ ! -L interface ]; then
    if [ -n "$(find interface -mindepth 1 ! -type f -print -quit)" ]; then
        falha "interface/ só pode ter arquivos comuns, sem subpasta nem link: $(find interface -mindepth 1 ! -type f | head -n3 | tr '\n' ' ')"
    fi
    n=0
    while IFS= read -r -d '' f; do
        n=$((n + 1)); nome="$(basename "$f")"
        [[ "$nome" =~ ^[a-z0-9_-]+\.(html|js|css|woff2|svg|json)$ ]] || falha "nome ou extensão não permitidos em interface/: $nome"
        tam="$(stat -c %s "$f")"
        [ "$tam" -le 4194304 ] || falha "$nome passa de 4 MB ($tam bytes)"
    done < <(find interface -mindepth 1 -maxdepth 1 -type f -print0)
    [ "$n" -gt 0 ] || falha "interface/ está vazia"
    [ -f interface/index.html ] || falha "falta interface/index.html"
    ok "$n arquivo(s) na interface/ dentro das regras"
else
    falha "falta a pasta interface/ (ou é link)"
fi

# 3. nada de rede na interface -----------------------------------------------------------------------------------------
if [ -d interface ]; then
    while IFS= read -r -d '' f; do
        nome="$(basename "$f")"
        sem_ns="$(sed -E 's#xmlns(:[a-z]+)?="http://www\.w3\.org/[^"]*"##g' "$f")"
        if printf '%s' "$sem_ns" | grep -qiE 'https?://|(src|href|action|poster|data)[[:space:]]*=[[:space:]]*["'\'']?//|url\([[:space:]]*["'\'']?//|@import'; then
            falha "$nome: endereço externo (http, https, // ou @import)"
        fi
        if printf '%s' "$sem_ns" | grep -qE 'fetch[[:space:]]*\(|XMLHttpRequest|WebSocket|EventSource|sendBeacon|importScripts'; then
            falha "$nome: chamada de rede (fetch, XMLHttpRequest...). O canal com a Sexta-Feira entra numa versão futura, com regra própria"
        fi
    done < <(find interface -mindepth 1 -maxdepth 1 -type f -print0)
    [ "$FALHAS" -eq 0 ] && ok "interface/ sem endereço externo nem chamada de rede"
fi

# 4. nenhum segredo nos arquivos versionados ---------------------------------------------------------------------------
padrao='BEGIN [A-Z ]*PRIVATE KEY|api[_-]?key|passw(or)?d[[:space:]]*[=:]|secret[[:space:]]*[=:]|ghp_[A-Za-z0-9]{20,}|github_pat_[A-Za-z0-9_]{20,}|sk-[A-Za-z0-9]{20,}|[0-9]{8,}:[A-Za-z0-9_-]{30,}'
achou=0
while IFS= read -r f; do
    [ -f "$f" ] || continue
    [ "$f" = "testes/conferir.sh" ] && continue   # este arquivo contém os padrões
    case "$f" in LICENSE) continue ;; esac
    if grep -IqiE "$padrao" "$f" 2>/dev/null; then falha "$f parece conter segredo"; achou=1; fi
done < <(lista_versionados)
[ "$achou" -eq 0 ] && ok "nenhum segredo nos arquivos versionados"

# 5. shell -------------------------------------------------------------------------------------------------------------
nsh=0
while IFS= read -r f; do
    [ -f "$f" ] || continue
    nsh=$((nsh + 1))
    bash -n "$f" 2>/dev/null || falha "erro de sintaxe em $f"
done < <(lista_versionados | grep -E '\.sh$' || true)
if command -v shellcheck >/dev/null 2>&1; then
    while IFS= read -r f; do
        [ -f "$f" ] || continue
        shellcheck -S warning "$f" >/dev/null 2>&1 || falha "shellcheck reclamou de $f"
    done < <(lista_versionados | grep -E '\.sh$' || true)
else
    echo "aviso: shellcheck não instalado, só conferi a sintaxe com bash -n"
fi
ok "$nsh script(s) shell com sintaxe válida"

# 5b. a função examinar_bundle é a mesma no instalador e no atualizador -----------------------------------------------------
extrai_funcao() { awk '/^examinar_bundle\(\) \{/ { d = 1 } d { print } d && /^}/ { exit }' "$1"; }
if [ -f instalar-engine.sh ] && [ -f atualizar-engine.sh ]; then
    a="$(extrai_funcao instalar-engine.sh)"; b="$(extrai_funcao atualizar-engine.sh)"
    if [ -n "$a" ] && [ "$a" = "$b" ]; then ok "examinar_bundle idêntica no instalador e no atualizador"; else falha "examinar_bundle difere entre instalar-engine.sh e atualizar-engine.sh"; fi
fi

# 6. unidades do systemd -----------------------------------------------------------------------------------------------
for u in systemd/*; do
    [ -f "$u" ] || continue
    case "$u" in
        *.path)    secoes="Unit Path Install";    chaves="Description PathChanged Unit WantedBy" ;;
        *.timer)   secoes="Unit Timer Install";   chaves="Description OnBootSec OnUnitActiveSec Persistent Unit WantedBy" ;;
        *.service) secoes="Unit Service";         chaves="Description Type ExecStart TimeoutStartSec" ;;
        *) falha "$u: tipo de unidade não esperado"; continue ;;
    esac
    secao=""
    while IFS= read -r linha || [ -n "$linha" ]; do
        [[ -z "${linha//[[:space:]]/}" || "$linha" =~ ^[[:space:]]*# ]] && continue
        if [[ "$linha" =~ ^\[([A-Za-z]+)\]$ ]]; then
            secao="${BASH_REMATCH[1]}"
            [[ " $secoes " == *" $secao "* ]] || falha "$u: seção não esperada [$secao]"
            continue
        fi
        if [[ "$linha" =~ ^([A-Za-z]+)=(.*)$ ]]; then
            chave="${BASH_REMATCH[1]}"; valor="${BASH_REMATCH[2]}"
            [[ " $chaves " == *" $chave "* ]] || falha "$u: chave não esperada $chave"
            case "$chave" in
                ExecStart)
                    [[ "$valor" == %h/sexta-feira-engine/* ]] || falha "$u: ExecStart fora de %h/sexta-feira-engine"
                    ;;
                PathChanged)
                    [ "$valor" = '%h/Downloads' ] || falha "$u: PathChanged só pode ser %h/Downloads"
                    ;;
            esac
            [[ "$valor" == *..* ]] && falha "$u: '..' em $chave"
            [[ "$valor" == /* ]] && falha "$u: caminho absoluto em $chave (use %h)"
        else
            falha "$u: linha não reconhecida: $linha"
        fi
    done < "$u"
done
ok "unidades do systemd conferidas"

if [ "$FALHAS" -gt 0 ]; then
    echo "REPROVADO: $FALHAS falha(s)." >&2
    exit 1
fi
echo "APROVADO."
