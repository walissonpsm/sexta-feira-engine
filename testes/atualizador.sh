#!/usr/bin/env bash
# shellcheck disable=SC2034  # variáveis lidas dentro de eval
# Testa o instalador e o atualizador numa pasta temporária, sem systemd e sem tocar na sua instalação.
# Cobre: instalação inicial; atualização da versão atual para 7.0.1; versão menor; bundle sem tag; pasta mexida à mão; rollback quando o
# teste falha; bundle refeito depois de recusado; --voltar; espelho ligado pela chave no caminho padrão; avisos de permissão.
#
#   bash testes/atualizador.sh        (precisa de git e flock; roda em segundos)

set -uo pipefail

REPO="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
T="$(mktemp -d "${TMPDIR:-/tmp}/engine-teste.XXXXXX")"
trap 'rm -rf -- "$T"' EXIT

export HOME="$T/casa"; mkdir -p "$HOME/Downloads"
export ENGINE_DIR="$T/casa/sexta-feira-engine" DOWNLOADS_DIR="$HOME/Downloads" SYSTEMD_USER_DIR="$T/casa/units"
SEG="$T/casa/sexta-feira-segredos/sexta-feira-engine"   # o padrão do engine com HOME=$T/casa; SEGREDOS_DIR não é exportado de propósito
export SEM_SYSTEMD=1 ESTAVEL_SEG=0 MAX_ESPERA=3
export ENGINE_TESTE=1
export GIT_AUTHOR_NAME=t GIT_AUTHOR_EMAIL=t@t GIT_COMMITTER_NAME=t GIT_COMMITTER_EMAIL=t@t

PASSOU=0; FALHOU=0
confere() { if eval "$2"; then PASSOU=$((PASSOU + 1)); echo "ok: $1"; else FALHOU=$((FALHOU + 1)); echo "FALHA: $1" >&2; fi; }
instalado() { tr -d '[:space:]' < "$ENGINE_DIR/VERSAO"; }
A() { bash "$ENGINE_DIR/atualizar-engine.sh" "$@"; }

# --- fonte: cópia do repo atual, com commit de cada versão de teste ---
FONTE="$T/fonte"; git clone -q "$REPO" "$FONTE" 2>/dev/null || { git init -q "$FONTE"; cp -a "$REPO"/. "$FONTE"/; }
cd "$FONTE" || exit 1
git checkout -q -B main 2>/dev/null
# copia a árvore de trabalho (inclui arquivos ainda sem commit) por cima do clone
(cd "$REPO" && git ls-files -z --cached --others --exclude-standard) | while IFS= read -r -d '' f; do mkdir -p "$(dirname "$f")"; cp -a "$REPO/$f" "$f"; done
git add -A && git commit -q -m "base de teste" --allow-empty
BASE="$(tr -d '[:space:]' < VERSAO)"   # a versão que está sendo testada; as de teste são 7.0.x

poe_versao() {   # $1 = X.Y.Z; grava VERSAO e acompanha o VERSAO_ENGINE da tela (o conferir.sh exige que os dois batam)
    printf '%s\n' "$1" > VERSAO
    # a tela é gerada de fonte/ (o VERSAO_ENGINE vem do VERSAO): depois de trocar a VERSAO, remonta interface/ com o montador
    if [ -f ferramentas/montar-interface.sh ]; then bash ferramentas/montar-interface.sh >/dev/null || return 1
    elif [ -f interface/tela.js ]; then sed -i "s/^\([[:space:]]*var VERSAO_ENGINE = '\)[0-9.]*';/\1$1';/" interface/tela.js; fi
    return 0
}

nova_versao() {   # $1 = X.Y.Z; faz commit com VERSAO e CHANGELOG novos e empacota
    local v="$1"
    if [ -f fonte/tela/pagina/index.html ]; then echo "<!-- $v -->" >> fonte/tela/pagina/index.html; fi   # uma mudança de verdade (na fonte; interface/ é gerada)
    poe_versao "$v"
    printf '# Changelog — Sexta-Feira Engine\n\n## v%s — teste (18/11)\n\n- mudança de teste %s.\n\n' "$v" "$v" > .novo && sed -n "/^## v$BASE /,\$p" CHANGELOG.md >> .novo && mv .novo CHANGELOG.md
    [ -f fonte/tela/pagina/index.html ] || echo "<!-- $v -->" >> interface/index.html
    git add -A && git commit -q -m "v$v" && git tag "v$v"
    git bundle create "$T/sexta-feira-engine-v$v.bundle" --branches --tags >/dev/null 2>&1
}
git tag "v$BASE"
git bundle create "$T/sexta-feira-engine-v$BASE.bundle" --branches --tags >/dev/null 2>&1

# 1. instalação inicial ---------------------------------------------------------------------------------------------------
cp "$T/sexta-feira-engine-v$BASE.bundle" "$DOWNLOADS_DIR/"
bash "$FONTE/instalar-engine.sh" >"$T/inst.log" 2>&1 || cat "$T/inst.log" >&2
confere "instalação inicial deixa a versão do bundle" '[ "$(instalado)" = "$BASE" ]'
confere "instalação cria publicar/ com index.html" '[ -f "$ENGINE_DIR/publicar/index.html" ] && [ -f "$ENGINE_DIR/publicar/neuronio.html" ]'
confere "estado/ tem permissão 700" '[ "$(stat -c %a "$ENGINE_DIR/estado")" = 700 ]'
confere "unidades copiadas" '[ -f "$SYSTEMD_USER_DIR/engine-atualizador.path" ] && [ -f "$SYSTEMD_USER_DIR/engine-atualizador.timer" ] && [ -f "$SYSTEMD_USER_DIR/engine-atualizador.service" ]'
confere "instalado no branch main" '[ "$(git -C "$ENGINE_DIR" symbolic-ref --short HEAD)" = main ]'
bash "$FONTE/instalar-engine.sh" >"$T/inst.log" 2>&1 || cat "$T/inst.log" >&2
confere "segunda instalação é recusada" '[ $? -ne 0 ] || ! bash "$FONTE/instalar-engine.sh" >/dev/null 2>&1'
confere "sem nada novo o automático sai calado" '[ -z "$(A --auto 2>&1)" ]'
# shellcheck disable=SC2034  # usada dentro de eval
INODE_ANTES="$(stat -c %i "$ENGINE_DIR/publicar")"

# 2. atualização da versão atual para 7.0.1 ------------------------------------------------------------------------------------------
nova_versao 7.0.1
rm -f "$DOWNLOADS_DIR"/*.bundle; cp "$T/sexta-feira-engine-v7.0.1.bundle" "$DOWNLOADS_DIR/"
A --auto >"$T/saida" 2>&1
confere "atualiza para a v7.0.1" '[ "$(instalado)" = 7.0.1 ]'
confere "publicar/ refeita com o conteúdo novo" 'grep -q "<!-- 7.0.1 -->" "$ENGINE_DIR/publicar/index.html"'
confere "publicar/ manteve o mesmo diretório (inode)" '[ "$(stat -c %i "$ENGINE_DIR/publicar")" = "$INODE_ANTES" ]'
confere "journal registra a atualização" 'grep -q "atualizada de v$BASE para v7.0.1" "$T/saida"'
A --auto >"$T/saida" 2>&1
confere "já atualizada: sai calada" '[ ! -s "$T/saida" ]'

# 3. versão menor / igual ---------------------------------------------------------------------------------------------------
cp "$T/sexta-feira-engine-v$BASE.bundle" "$DOWNLOADS_DIR/"
A --auto >/dev/null 2>&1
confere "versão menor é ignorada" '[ "$(instalado)" = 7.0.1 ]'
# shellcheck disable=SC2034  # RC é lida dentro de eval
A "$DOWNLOADS_DIR/sexta-feira-engine-v$BASE.bundle" >"$T/saida" 2>&1; RC=$?
confere "versão menor por caminho é recusada com motivo" '[ "$RC" -ne 0 ] && grep -q "não é mais nova" "$T/saida" && [ "$(instalado)" = 7.0.1 ]'
rm -f "$DOWNLOADS_DIR/sexta-feira-engine-v$BASE.bundle"

# 4. bundle sem tag / VERSAO que não bate -------------------------------------------------------------------------------------
cd "$FONTE" || exit 1
poe_versao 7.0.2; sed -i '0,/^## v7.0.1/s//## v7.0.2/' CHANGELOG.md; git add -A; git commit -q -m "sem tag"
git bundle create "$T/sexta-feira-engine-v7.0.2.bundle" --branches >/dev/null 2>&1   # sem --tags: não leva a tag v7.0.2
cp "$T/sexta-feira-engine-v7.0.2.bundle" "$DOWNLOADS_DIR/"
A --auto >"$T/saida" 2>&1
confere "bundle sem tag não instala" '[ "$(instalado)" = 7.0.1 ]'
confere "bundle sem tag: motivo no journal" 'grep -q "não tem a tag" "$T/saida"'
confere "bundle sem tag NÃO é registrado em lista" '[ ! -e "$ENGINE_DIR/estado/atualizador-falhou.txt" ]'
git tag v7.0.3   # tag com número diferente do VERSAO de dentro
git bundle create "$T/x.bundle" --branches --tags >/dev/null 2>&1
mv "$T/x.bundle" "$DOWNLOADS_DIR/sexta-feira-engine-v7.0.3.bundle"
rm -f "$DOWNLOADS_DIR/sexta-feira-engine-v7.0.2.bundle"
A --auto >"$T/saida" 2>&1
confere "VERSAO de dentro diferente do nome não instala, com motivo" '[ "$(instalado)" = 7.0.1 ] && grep -q "não bate com o nome" "$T/saida"'
rm -f "$DOWNLOADS_DIR"/*.bundle
git tag -d v7.0.3 >/dev/null; git reset -q --hard v7.0.1; git tag -d v7.0.2 >/dev/null 2>&1 || true

# 4b. bundle que é link simbólico no Downloads é ignorado pelo automático
nova_versao 7.0.9
ln -s "$T/sexta-feira-engine-v7.0.9.bundle" "$DOWNLOADS_DIR/sexta-feira-engine-v7.0.9.bundle"
A --auto >"$T/saida" 2>&1
confere "link simbólico em ~/Downloads é ignorado" '[ "$(instalado)" = 7.0.1 ]'
rm -f "$DOWNLOADS_DIR"/*.bundle
git tag -d v7.0.9 >/dev/null; git reset -q --hard v7.0.1

# 5. pasta mexida à mão -----------------------------------------------------------------------------------------------------
nova_versao 7.0.2
cp "$T/sexta-feira-engine-v7.0.2.bundle" "$DOWNLOADS_DIR/"
echo "mexi à mão" >> "$ENGINE_DIR/README.md"
A --auto >"$T/saida" 2>&1
confere "pasta mexida à mão: recusa" '[ "$(instalado)" = 7.0.1 ]'
confere "recusa registrada em atualizador-falhou.txt" 'grep -q "v7.0.2" "$ENGINE_DIR/estado/atualizador-falhou.txt"'
git -C "$ENGINE_DIR" checkout -q -- README.md
A --auto >"$T/saida" 2>&1
confere "bundle já recusado não é tentado de novo pelo automático" '[ "$(instalado)" = 7.0.1 ]'
A >"$T/saida" 2>&1
confere "à mão, o bundle recusado pode ser reinstalado" '[ "$(instalado)" = 7.0.2 ]'
rm -f "$DOWNLOADS_DIR"/*.bundle

# 6. rollback quando o teste falha ------------------------------------------------------------------------------------------
git reset -q --hard v7.0.2
poe_versao 7.0.3; sed -i '0,/^## v7.0.2/s//## v7.0.3/' CHANGELOG.md
echo '<script>fetch("https://exemplo.invalid/x")</script>' > interface/ruim.html   # a conferência de rede reprova
git add -A; git commit -q -m "v7.0.3 ruim"; git tag v7.0.3
git bundle create "$T/sexta-feira-engine-v7.0.3.bundle" --branches --tags >/dev/null 2>&1
cp "$T/sexta-feira-engine-v7.0.3.bundle" "$DOWNLOADS_DIR/"
# shellcheck disable=SC2034  # usada dentro de eval
COMMIT_ANTES="$(git -C "$ENGINE_DIR" rev-parse HEAD)"
A --auto >"$T/saida" 2>&1
confere "teste que falha: volta para a versão anterior" '[ "$(instalado)" = 7.0.2 ] && [ "$(git -C "$ENGINE_DIR" rev-parse HEAD)" = "$COMMIT_ANTES" ]'
confere "rollback: publicar/ sem o arquivo ruim" '[ ! -e "$ENGINE_DIR/publicar/ruim.html" ]'
confere "rollback: soma registrada" 'grep -q "v7.0.3" "$ENGINE_DIR/estado/atualizador-falhou.txt"'
confere "rollback: tag recusada não fica no repositório (não sobe ao espelho)" '! git -C "$ENGINE_DIR" rev-parse -q --verify refs/tags/v7.0.3 >/dev/null'
confere "rollback: publicar/ manteve o inode" '[ "$(stat -c %i "$ENGINE_DIR/publicar")" = "$INODE_ANTES" ]'
confere "rollback: pasta limpa" '[ -z "$(git -C "$ENGINE_DIR" status --porcelain --untracked-files=no)" ]'
rm -f "$DOWNLOADS_DIR"/*.bundle

# 7. bundle refeito (mesmo nome, soma nova) é tentado ---------------------------------------------------------------------
git reset -q --hard v7.0.2; git tag -d v7.0.3 >/dev/null
nova_versao 7.0.3
cp "$T/sexta-feira-engine-v7.0.3.bundle" "$DOWNLOADS_DIR/"
A --auto >"$T/saida" 2>&1
confere "bundle refeito com o mesmo nome é tentado e instala" '[ "$(instalado)" = 7.0.3 ]'
rm -f "$DOWNLOADS_DIR"/*.bundle

# 8. --voltar -----------------------------------------------------------------------------------------------------------------
A --voltar v7.0.1 >"$T/saida" 2>&1
confere "--voltar volta o código" '[ "$(instalado)" = 7.0.1 ]'
confere "--voltar grava atualizador-ignorar.txt" '[ "$(tr -d "[:space:]" < "$ENGINE_DIR/estado/atualizador-ignorar.txt")" = 7.0.3 ]'
cp "$T/sexta-feira-engine-v7.0.3.bundle" "$DOWNLOADS_DIR/"
A --auto >"$T/saida" 2>&1
confere "depois do --voltar o automático não reinstala a recusada" '[ "$(instalado)" = 7.0.1 ]'
# shellcheck disable=SC2034  # RC é lida dentro de eval
A --voltar v7.0.5 >"$T/saida" 2>&1; RC=$?
confere "--voltar para tag desconhecida é recusado" '[ "$RC" -ne 0 ] && [ "$(instalado)" = 7.0.1 ]'
rm -f "$DOWNLOADS_DIR"/*.bundle

# 9. espelho: a chave no caminho padrão liga o espelho sozinho ---------------------------------------------------------------
git init -q --bare "$T/espelho.git"
export ENGINE_ORIGIN="$T/espelho.git"
confere "SEGREDOS_DIR não está definido: vale o caminho padrão do código" '[ -z "${SEGREDOS_DIR:-}" ]'
A --espelhar >"$T/saida" 2>&1
confere "sem a chave o espelho fica desligado (não empurra nada)" '! git -C "$T/espelho.git" rev-parse -q --verify refs/heads/main >/dev/null && [ ! -e "$ENGINE_DIR/estado/espelho" ]'
mkdir -p "$SEG/github"; chmod 700 "$SEG/github"
printf 'chave falsa de teste\n' > "$SEG/github/id_ed25519"; chmod 600 "$SEG/github/id_ed25519"
A --espelhar >"$T/saida" 2>&1
confere "com a chave no caminho padrão o espelho liga" '[ -e "$ENGINE_DIR/estado/espelho" ] && [ "$(git -C "$ENGINE_DIR" remote get-url origin)" = "$T/espelho.git" ]'
confere "core.sshCommand usa a chave e IdentitiesOnly" 'git -C "$ENGINE_DIR" config core.sshCommand | grep -q "IdentitiesOnly=yes" && git -C "$ENGINE_DIR" config core.sshCommand | grep -q "github/id_ed25519"'
confere "--espelhar empurra o main" '[ "$(git -C "$T/espelho.git" rev-parse refs/heads/main)" = "$(git -C "$ENGINE_DIR" rev-parse HEAD)" ]'
confere "--espelhar empurra as tags" 'git -C "$T/espelho.git" rev-parse -q --verify refs/tags/v7.0.1 >/dev/null'
confere "o caminho padrão fica dentro de sexta-feira-segredos/sexta-feira-engine" 'grep -q "sexta-feira-segredos/sexta-feira-engine" "$ENGINE_DIR/atualizar-engine.sh" && ! grep -q "sexta-feira-engine-segredos" "$ENGINE_DIR/atualizar-engine.sh" "$ENGINE_DIR/instalar-engine.sh"'

# 10. instalador avisa permissão ruim da chave ------------------------------------------------------------------------------
git init -q --bare "$T/espelho2.git"
chmod 755 "$SEG/github"; chmod 644 "$SEG/github/id_ed25519"
ENGINE_ORIGIN="$T/espelho2.git" ENGINE_DIR="$T/casa/engine2" SYSTEMD_USER_DIR="$T/casa/units2" DOWNLOADS_DIR="$T/dl2" bash -c 'mkdir -p "$DOWNLOADS_DIR"; cp "'"$T/sexta-feira-engine-v$BASE.bundle"'" "$DOWNLOADS_DIR/"; bash "'"$FONTE"'/instalar-engine.sh"' >"$T/inst2.log" 2>&1
confere "instalador avisa pasta fora de 700" 'grep -q "modo 700" "$T/inst2.log"'
confere "instalador avisa chave fora de 600" 'grep -q "modo 600" "$T/inst2.log"'
confere "instalador não muda as permissões" '[ "$(stat -c %a "$SEG/github")" = 755 ] && [ "$(stat -c %a "$SEG/github/id_ed25519")" = 644 ]'

echo
echo "resultado: $PASSOU ok, $FALHOU falha(s)"
[ "$FALHOU" -eq 0 ]
