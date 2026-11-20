#!/usr/bin/env bash
# Monta a interface/ a partir da fonte/ (as pastas isoladas). Só bash, coreutils, sed, grep, find, tsort e sha256sum: roda no PC e na nuvem.
#
#   ferramentas/montar-interface.sh              gera interface/ e fonte/MAPA.md
#   ferramentas/montar-interface.sh --em PASTA   gera os mesmos arquivos (e o MAPA.md) numa PASTA (o conferir.sh usa isto para comparar)
#
# Cada parte é uma pasta fonte/<camada>/<parte>/ com o manifesto PARTE (nome, tipo, porta, requer...), o parte.js (ou o arquivo dela), o LEIA-ME.md
# e a pasta teste/ (referências só dos testes; nunca vai para a tela). Veja o README.md (seção "A fonte"), o LEIA-ME.md de cada parte e as regras permanentes na seção 7 do AGENTS.md.
#
# Camadas (só se usa o que está embaixo): base < comum < neuronio, ligacoes, dados < cena < tela. Dentro de uma camada só a parte marcada
# "juntadora: sim" pode usar as irmãs. Versões de porta: "requer: x@N" vale se compativel-desde(x) <= N <= porta(x). Ciclo: o tsort recusa.
set -euo pipefail
export LC_ALL=C

RAIZ="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SAIDA="$RAIZ/interface"
MAPA="$RAIZ/fonte/MAPA.md"
if [ "${1:-}" = "--em" ]; then
    [ -n "${2:-}" ] || { echo "montar-interface: falta a pasta depois de --em" >&2; exit 2; }
    mkdir -p "$2"; SAIDA="$(cd "$2" && pwd)"; MAPA="$SAIDA/MAPA.md"
elif [ -n "${1:-}" ]; then
    echo "uso: montar-interface.sh [--em PASTA]" >&2; exit 2
fi
VERSAO="$(tr -d '[:space:]' < "$RAIZ/VERSAO")"
[ -n "$VERSAO" ] || { echo "montar-interface: VERSAO vazia" >&2; exit 2; }
cd "$RAIZ/fonte"

erro() { echo "montar-interface: $*" >&2; exit 1; }
campo() { sed -n "s/^$2:[[:space:]]*//p" "$1" | head -n1 | sed 's/[[:space:]]*#.*$//; s/[[:space:]]*$//'; }
camada_idx() { case "$1" in base) echo 0;; comum) echo 1;; neuronio|ligacoes|dados) echo 2;; cena) echo 3;; tela) echo 4;; cores|laboratorio) echo 9;; *) echo -1;; esac; }

declare -A TIPO PORTA COMPAT REQUER GUARDA DOM JUNTA SAIDAARQ CAMADA ARQ
NOMES=()
while IFS= read -r p; do
    d="$(dirname "$p")"; d="${d#./}"
    nome="$(campo "$p" nome)"
    [ "$nome" = "$d" ] || erro "$p: nome '$nome' diferente da pasta '$d'"
    [[ "$d" =~ ^[a-z0-9-]+/[a-z0-9-]+$ ]] || erro "$p: nome de pasta fora de [a-z0-9-]+"
    cam="${d%%/*}"; ci="$(camada_idx "$cam")"; [ "$ci" != "-1" ] || erro "$p: camada desconhecida '$cam'"
    [ -f "$d/LEIA-ME.md" ] || erro "$d: falta o LEIA-ME.md"
    tipo="$(campo "$p" tipo)"; tipo="${tipo:-js}"
    case "$tipo" in js|js-cru|html|css) ;; *) erro "$p: tipo '$tipo' inválido";; esac
    arq="$(campo "$p" arquivo)"; arq="${arq:-parte.js}"
    [ -f "$d/$arq" ] || erro "$d: falta o arquivo $arq"
    TIPO[$nome]="$tipo"; PORTA[$nome]="$(campo "$p" porta)"; PORTA[$nome]="${PORTA[$nome]:-1}"
    COMPAT[$nome]="$(campo "$p" compativel-desde)"; COMPAT[$nome]="${COMPAT[$nome]:-1}"
    [[ "${PORTA[$nome]}" =~ ^[0-9]+$ && "${COMPAT[$nome]}" =~ ^[0-9]+$ ]] || erro "$nome: porta e compativel-desde têm de ser números inteiros"
    REQUER[$nome]="$(campo "$p" requer)"; GUARDA[$nome]="$(campo "$p" guarda)"; DOM[$nome]="$(campo "$p" dom)"; JUNTA[$nome]="$(campo "$p" juntadora)"
    CAMADA[$nome]="$ci"; ARQ[$nome]="$d/$arq"
    s="$(campo "$p" saida)"
    if [ -z "$s" ]; then case "$cam" in base|comum) s="sf.js";; *) s="$cam.js";; esac; fi
    SAIDAARQ[$nome]="$s"
    NOMES+=("$nome")
done < <(find . -mindepth 3 -maxdepth 3 -name PARTE | sort)
[ "${#NOMES[@]}" -gt 0 ] || erro "nenhuma parte em fonte/"

# estrutura: só os arquivos permitidos em cada pasta de parte
while IFS= read -r f; do
    f="${f#./}"; pasta="${f%/*}"; base="${f##*/}"
    case "$f" in */teste/*) continue;; esac
    [ -n "${TIPO[$pasta]:-}" ] || erro "$f: arquivo fora de uma parte (a pasta ${pasta} não tem PARTE)"
    [ "$base" = "PARTE" ] || [ "$base" = "LEIA-ME.md" ] || [ "$f" = "${ARQ[$pasta]}" ] || erro "$f: arquivo não permitido (só PARTE, LEIA-ME.md, ${ARQ[$pasta]##*/} e teste/)"
done < <(find . -mindepth 3 -type f ! -name MAPA.md | sort)

# dependências: versão da porta, camadas e irmãs
ARESTAS=""
for n in "${NOMES[@]}"; do
    ARESTAS+="$n $n"$'\n'
    for r in ${REQUER[$n]}; do
        dep="${r%@*}"; ver="${r#*@}"
        [ "$dep" != "$r" ] && [[ "$ver" =~ ^[0-9]+$ ]] || erro "$n: requer '$r' sem @versão"
        [ -n "${TIPO[$dep]:-}" ] || erro "$n: requer '$dep', que não existe"
        [ "${TIPO[$n]}" = "js" ] || erro "$n: só parte do tipo js tem requer"
        [ "${TIPO[$dep]}" = "js" ] || erro "$n: requer '$dep', que não é do tipo js"
        if [ "${COMPAT[$dep]}" -gt "$ver" ] || [ "$ver" -gt "${PORTA[$dep]}" ]; then
            erro "$n: requer $dep@$ver, mas a porta de $dep é ${PORTA[$dep]} (compatível desde ${COMPAT[$dep]})"
        fi
        if [ "${CAMADA[$dep]}" -gt "${CAMADA[$n]}" ]; then erro "$n usa '$dep', de uma camada acima"; fi
        if [ "${CAMADA[$dep]}" -eq "${CAMADA[$n]}" ] && [ "${JUNTA[$n]}" != "sim" ]; then
            erro "$n usa a irmã '$dep': só a parte com 'juntadora: sim' pode usar partes da mesma camada"
        fi
        ARESTAS+="$dep $n"$'\n'
    done
done
ORDEM=()
if ! SAIDA_TSORT="$(printf '%s' "$ARESTAS" | sort -u | tsort 2>&1)"; then erro "ciclo entre partes: $SAIDA_TSORT"; fi
while IFS= read -r n; do [ -n "$n" ] && ORDEM+=("$n"); done <<< "$SAIDA_TSORT"
# o carregador vem sempre primeiro (as outras partes chamam SF.parte; não dependemos da ordem em que o tsort desempata)
if [ -n "${TIPO[base/carregador]:-}" ]; then
    NOVA=("base/carregador"); for n in "${ORDEM[@]}"; do [ "$n" = "base/carregador" ] || NOVA+=("$n"); done; ORDEM=("${NOVA[@]}")
fi

mkdir -p "$SAIDA"
trap 'rm -f -- "$SAIDA"/.montando-* 2>/dev/null || true' EXIT   # falha no meio não deixa arquivo temporário para trás
CAB="/* GERADO por ferramentas/montar-interface.sh a partir de fonte/ (versão $VERSAO). NÃO edite aqui: edite a parte em fonte/ e rode o montador. */"

js_manifesto() {   # $1 = nome da parte
    local n="$1" req="" r
    for r in ${REQUER[$n]}; do req+="'$r',"; done
    printf "{nome:'%s',porta:%s,compativelDesde:%s,requer:[%s],guarda:%s,dom:%s}" "$n" "${PORTA[$n]}" "${COMPAT[$n]}" "${req%,}" \
        "$([ "${GUARDA[$n]}" = "sim" ] && echo true || echo false)" "$([ "${DOM[$n]}" = "sim" ] && echo true || echo false)"
}

# arquivos de saída (js): na ordem global
ARQS=""
for n in "${ORDEM[@]}"; do s="${SAIDAARQ[$n]}"; case " $ARQS " in *" $s "*) ;; *) ARQS+="$s ";; esac; done
for s in $ARQS; do
    tmp="$SAIDA/.montando-$s"
    case "$s" in
        *.js)
            { echo "$CAB"
              [ "$s" = "tela.js" ] && echo "var VERSAO_ENGINE = '$VERSAO';"
              for n in "${ORDEM[@]}"; do
                  [ "${SAIDAARQ[$n]}" = "$s" ] || continue
                  echo "// ---- fonte/$n/${ARQ[$n]##*/}"
                  case "${TIPO[$n]}" in
                      js) printf 'SF.parte(%s,\n' "$(js_manifesto "$n")"; cat "$RAIZ/fonte/${ARQ[$n]}"; printf '\n);\n';;
                      js-cru) sed "s/@VERSAO@/$VERSAO/g" "$RAIZ/fonte/${ARQ[$n]}"; printf '\n';;
                      *) erro "$n: tipo ${TIPO[$n]} não vai para um .js";;
                  esac
              done
              [ "$s" = "tela.js" ] && echo "SF.iniciar();"
              true
            } > "$tmp";;
        *)  # html e css: cópia byte a byte (uma parte só por arquivo)
            c=0; for n in "${ORDEM[@]}"; do [ "${SAIDAARQ[$n]}" = "$s" ] || continue; c=$((c + 1)); cp "$RAIZ/fonte/${ARQ[$n]}" "$tmp"; done
            [ "$c" -eq 1 ] || erro "$s: precisa de exatamente uma parte (tem $c)";;
    esac
    mv -f "$tmp" "$SAIDA/$s"
done

# o MAPA: quem usa a porta de quem (gerado; o "usado por" nunca vai para o LEIA-ME de cada parte)
{
    echo "# MAPA das partes (gerado por ferramentas/montar-interface.sh: não edite)"
    echo
    echo "Camadas (só se usa o que está embaixo): base < comum < neuronio, ligacoes, dados < cena < tela. 'juntadora' é a única parte da camada que pode usar as irmãs."
    echo
    echo "| parte | tipo | porta | compatível desde | requer | usado por | arquivo gerado |"
    echo "|---|---|---|---|---|---|---|"
    for n in "${ORDEM[@]}"; do
        u=""; for m in "${ORDEM[@]}"; do for r in ${REQUER[$m]}; do [ "${r%@*}" = "$n" ] && u+="$m "; done; done
        printf '| %s%s | %s | %s | %s | %s | %s | %s |\n' "$n" "$([ "${JUNTA[$n]}" = "sim" ] && echo " (juntadora)")" "${TIPO[$n]}" "${PORTA[$n]}" "${COMPAT[$n]}" "${REQUER[$n]:--}" "${u:--}" "${SAIDAARQ[$n]}"
    done
} > "$MAPA"
echo "montar-interface: ${#NOMES[@]} partes -> $SAIDA (versão $VERSAO)"
