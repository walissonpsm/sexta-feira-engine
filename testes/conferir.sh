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
    if [[ "$v" =~ ^(0|[1-9][0-9]*)\.(0|[1-9][0-9]*)\.(0|[1-9][0-9]*)$ ]]; then
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

# 2b. a fonte em pastas (v0.4.0): estrutura, regras das partes e interface/ igual à montagem ----------------------------------------
# A tela é GERADA de fonte/<camada>/<parte>/ por ferramentas/montar-interface.sh (só bash). O montador já recusa manifesto errado, parte sem LEIA-ME,
# arquivo fora da lista, ciclo e porta incompatível; aqui conferimos o resto: nenhuma parte "pura" toca em janela, relógio ou sorteio direto
# (só pelo carregador: usa.base) e interface/ + fonte/MAPA.md são exatamente o que o montador gera.
if [ -d fonte ]; then
    f0=$FALHAS
    if [ ! -f ferramentas/montar-interface.sh ]; then
        falha "falta ferramentas/montar-interface.sh"
    else
        tmp="$(mktemp -d 2>/dev/null || echo "")"
        if [ -z "$tmp" ]; then
            falha "não consegui criar pasta temporária para conferir a montagem"
        else
            if ! bash ferramentas/montar-interface.sh --em "$tmp" >"$tmp/.saida" 2>&1; then
                falha "o montador reprovou a fonte: $(tail -n3 "$tmp/.saida" | tr '\n' ' ')"
            else
                while IFS= read -r -d '' g; do
                    nome="$(basename "$g")"
                    [ "$nome" = "MAPA.md" ] && continue
                    cmp -s "$g" "interface/$nome" || falha "interface/$nome difere do que o montador gera de fonte/ (rode ferramentas/montar-interface.sh; não edite interface/ à mão)"
                done < <(find "$tmp" -mindepth 1 -maxdepth 1 -type f ! -name '.saida' -print0)
                while IFS= read -r -d '' g; do
                    nome="$(basename "$g")"
                    [ -f "$tmp/$nome" ] || falha "interface/$nome não vem de nenhuma parte em fonte/"
                done < <(find interface -mindepth 1 -maxdepth 1 -type f -print0)
                cmp -s "$tmp/MAPA.md" fonte/MAPA.md || falha "fonte/MAPA.md difere do gerado (rode ferramentas/montar-interface.sh)"
            fi
            rm -rf "$tmp"
        fi
    fi
    # as partes de lógica não tocam em janela, documento, relógio nem sorteio direto (dom: sim e as camadas base e tela são a exceção)
    proibido='(^|[^A-Za-z0-9_.])(window|document|globalThis|self|localStorage|sessionStorage|requestAnimationFrame|setTimeout|setInterval|performance)([^A-Za-z0-9_]|$)|Math\.random|Date\.now|new[[:space:]]+Date|(^|[^A-Za-z0-9_.])(SF|Neuronio|Cena)\.'
    np=0
    while IFS= read -r m; do
        np=$((np + 1)); d="$(dirname "$m")"
        tipo="$(sed -n 's/^tipo:[[:space:]]*//p' "$m" | head -n1)"; dom="$(sed -n 's/^dom:[[:space:]]*//p' "$m" | head -n1)"
        arq="$(sed -n 's/^arquivo:[[:space:]]*//p' "$m" | head -n1)"; arq="${arq:-parte.js}"
        [ "${tipo:-js}" = "js" ] || continue
        [ "$dom" = "sim" ] && continue
        case "$d" in fonte/base/*|fonte/tela/*) continue ;; esac
        if grep -vE '^[[:space:]]*(//|\*|/\*)' "$d/$arq" | grep -qE "$proibido"; then
            falha "$d/$arq: parte sem 'dom: sim' usa janela, documento, relógio ou sorteio direto (use usa.base: acaso, agora, canvas)"
        fi
    done < <(find fonte -mindepth 3 -maxdepth 3 -name PARTE | sort)
    [ "$FALHAS" -eq "$f0" ] && ok "fonte: $np parte(s), interface/ e MAPA.md iguais à montagem, sem acesso direto a janela, relógio ou sorteio"
fi

# 3. nada de rede na interface -----------------------------------------------------------------------------------------
if [ -d interface ]; then
    while IFS= read -r -d '' f; do
        nome="$(basename "$f")"
        # o endereço do espaço de nomes do SVG (um identificador, não uma requisição) é a única exceção, como atributo xmlns ou como texto
        sem_ns="$(sed -E -e 's#xmlns(:[a-z]+)?="http://www\.w3\.org/[^"]*"##g' -e "s#['\"]http://www\.w3\.org/2000/svg['\"]#''#g" "$f")"
        if printf '%s' "$sem_ns" | grep -qiE 'https?://|(src|href|action|poster|data)[[:space:]]*=[[:space:]]*["'\'']?//|url\([[:space:]]*["'\'']?//|@import'; then
            falha "$nome: endereço externo (http, https, // ou @import)"
        fi
        if printf '%s' "$sem_ns" | grep -qE 'fetch[[:space:]]*\(|XMLHttpRequest|WebSocket|EventSource|sendBeacon|importScripts|import[[:space:]]*\(|new[[:space:]]+(Shared)?Worker|serviceWorker|RTCPeerConnection|WebTransport|window\.open|location(\.href)?[[:space:]]*=([^=]|$)'; then
            falha "$nome: chamada de rede (fetch, XMLHttpRequest...). O canal com a Sexta-Feira entra numa versão futura, com regra própria"
        fi
    done < <(find interface -mindepth 1 -maxdepth 1 -type f -print0)
    [ "$FALHAS" -eq 0 ] && ok "interface/ sem endereço externo nem chamada de rede"
fi

# 3b. a tela (v0.2.0): texto só por textContent, scripts só locais, selo de dados fictícios ----------------------------------------
# neuronio.html é o laboratório do dono (usa innerHTML nos botões de cor, sem dado externo): fica fora só desta regra de HTML dinâmico.
if [ -d interface ]; then
    f0=$FALHAS
    while IFS= read -r -d '' f; do
        nome="$(basename "$f")"
        [ "$nome" = "neuronio.html" ] && continue
        if grep -qE 'innerHTML|outerHTML|insertAdjacentHTML|document\.write|(^|[^A-Za-z_.])eval[[:space:]]*\(|new[[:space:]]+Function|set(Timeout|Interval)[[:space:]]*\([[:space:]]*["'\'']' "$f"; then
            falha "$nome: HTML dinâmico ou código em texto (innerHTML, eval, setTimeout com texto...). Todo texto entra por textContent"
        fi
    done < <(find interface -mindepth 1 -maxdepth 1 -type f \( -name '*.js' -o -name '*.html' \) -print0)
    while IFS= read -r -d '' f; do
        nome="$(basename "$f")"
        while IFS= read -r alvo; do
            [[ "$alvo" =~ ^[a-z0-9_-]+\.(js|css|svg|json)$ ]] || falha "$nome: <script>/<link> aponta para algo que não é arquivo local simples: $alvo"
            [ -f "interface/$alvo" ] || falha "$nome: aponta para $alvo, que não existe em interface/"
        done < <(grep -oE '<(script|link)[^>]*(src|href)="[^"]*"' "$f" | grep -oE '(src|href)="[^"]*"' | sed -E 's/^(src|href)="//; s/"$//')
    done < <(find interface -mindepth 1 -maxdepth 1 -type f -name '*.html' -print0)
    if [ -f interface/dados-ficticios.js ]; then
        grep -qE 'ficticio:[[:space:]]*true' interface/dados-ficticios.js || falha "dados-ficticios.js tem de declarar ficticio: true"
        grep -q 'DADOS FICTÍCIOS' interface/index.html 2>/dev/null || falha "index.html tem de ter o selo DADOS FICTÍCIOS (enquanto a tela usar dados fictícios)"
    fi
    if [ -f interface/tela.js ] && [ -n "${v:-}" ]; then
        vt="$(sed -n "s/^[[:space:]]*var VERSAO_ENGINE = '\([0-9.]*\)';.*/\1/p" interface/tela.js | head -n1)"
        [ "$vt" = "$v" ] || falha "VERSAO_ENGINE em tela.js ($vt) diferente de VERSAO ($v)"
    fi
    [ "$FALHAS" -eq "$f0" ] && ok "tela: sem HTML dinâmico, scripts locais, selo e versão em dia"
fi

# 4. nenhum segredo nos arquivos versionados ---------------------------------------------------------------------------
padrao='BEGIN [A-Z ]*PRIVATE KEY|api[_-]?key|passw(or)?d[[:space:]]*[=:]|secret[[:space:]]*[=:]|ghp_[A-Za-z0-9]{20,}|github_pat_[A-Za-z0-9_]{20,}|sk-[A-Za-z0-9]{20,}|[0-9]{8,}:[A-Za-z0-9_-]{30,}|AKIA[0-9A-Z]{16}|xox[bpas]-[A-Za-z0-9-]{10,}|/home/[a-z][a-z0-9_-]*/'
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
        *.timer)   secoes="Unit Timer Install";   chaves="Description OnBootSec OnUnitActiveSec Unit WantedBy" ;;
        *.service) secoes="Unit Service";         chaves="Description StartLimitIntervalSec Type ExecStart TimeoutStartSec" ;;
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
