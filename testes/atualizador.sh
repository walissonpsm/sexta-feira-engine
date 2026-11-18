#!/usr/bin/env bash
# Testa o instalador e o atualizador numa pasta temporária, sem systemd e sem tocar na sua instalação.
# Cobre: instalação inicial; atualização 0.1.0 para 0.1.1; versão menor; bundle sem tag; pasta mexida à mão; rollback quando o
# teste falha; bundle refeito depois de recusado; --voltar; espelho em repositório local.
#
#   bash testes/atualizador.sh        (precisa de git e flock; roda em segundos)

set -uo pipefail

REPO="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
T="$(mktemp -d "${TMPDIR:-/tmp}/engine-teste.XXXXXX")"
trap 'rm -rf -- "$T"' EXIT

export HOME="$T/home"; mkdir -p "$HOME/Downloads"
export ENGINE_DIR="$T/home/sexta-feira-engine" DOWNLOADS_DIR="$HOME/Downloads" SYSTEMD_USER_DIR="$T/home/units"
export SEGREDOS_DIR="$T/home/segredos" SEM_SYSTEMD=1 ESTAVEL_SEG=0 MAX_ESPERA=3
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
git add -A && git commit -q -m "base 0.1.0" --allow-empty
[ "$(tr -d '[:space:]' < VERSAO)" = "0.1.0" ] || { echo "a base do teste tem de ser a v0.1.0"; exit 2; }

nova_versao() {   # $1 = X.Y.Z; faz commit com VERSAO e CHANGELOG novos e empacota
    local v="$1"
    printf '%s\n' "$v" > VERSAO
    printf '# Changelog — Sexta-Feira Engine\n\n## v%s — teste (18/11)\n\n- mudança de teste %s.\n\n' "$v" "$v" > .novo && sed -n '/^## v0.1.0/,$p' CHANGELOG.md >> .novo && mv .novo CHANGELOG.md
    echo "<!-- $v -->" >> interface/index.html
    git add -A && git commit -q -m "v$v" && git tag "v$v"
    git bundle create "$T/sexta-feira-engine-v$v.bundle" --branches --tags >/dev/null 2>&1
}
git tag v0.1.0
git bundle create "$T/sexta-feira-engine-v0.1.0.bundle" --branches --tags >/dev/null 2>&1

# 1. instalação inicial ---------------------------------------------------------------------------------------------------
cp "$T/sexta-feira-engine-v0.1.0.bundle" "$DOWNLOADS_DIR/"
bash "$FONTE/instalar-engine.sh" >/dev/null 2>&1
confere "instalação inicial deixa a v0.1.0" '[ "$(instalado)" = 0.1.0 ]'
confere "instalação cria publicar/ com index.html" '[ -f "$ENGINE_DIR/publicar/index.html" ] && [ -f "$ENGINE_DIR/publicar/neuronio.html" ]'
confere "estado/ tem permissão 700" '[ "$(stat -c %a "$ENGINE_DIR/estado")" = 700 ]'
confere "unidades copiadas" '[ -f "$SYSTEMD_USER_DIR/engine-atualizador.path" ] && [ -f "$SYSTEMD_USER_DIR/engine-atualizador.timer" ] && [ -f "$SYSTEMD_USER_DIR/engine-atualizador.service" ]'
confere "instalado no branch main" '[ "$(git -C "$ENGINE_DIR" symbolic-ref --short HEAD)" = main ]'
bash "$FONTE/instalar-engine.sh" >/dev/null 2>&1
confere "segunda instalação é recusada" '[ $? -ne 0 ] || ! bash "$FONTE/instalar-engine.sh" >/dev/null 2>&1'
confere "sem nada novo o automático sai calado" '[ -z "$(A --auto 2>&1)" ]'
INODE_ANTES="$(stat -c %i "$ENGINE_DIR/publicar")"

# 2. atualização 0.1.0 para 0.1.1 ------------------------------------------------------------------------------------------
nova_versao 0.1.1
rm -f "$DOWNLOADS_DIR"/*.bundle; cp "$T/sexta-feira-engine-v0.1.1.bundle" "$DOWNLOADS_DIR/"
A --auto >"$T/saida" 2>&1
confere "atualiza para a v0.1.1" '[ "$(instalado)" = 0.1.1 ]'
confere "publicar/ refeita com o conteúdo novo" 'grep -q "<!-- 0.1.1 -->" "$ENGINE_DIR/publicar/index.html"'
confere "publicar/ manteve o mesmo diretório (inode)" '[ "$(stat -c %i "$ENGINE_DIR/publicar")" = "$INODE_ANTES" ]'
confere "journal registra a atualização" 'grep -q "atualizada de v0.1.0 para v0.1.1" "$T/saida"'
A --auto >"$T/saida" 2>&1
confere "já atualizada: sai calada" '[ ! -s "$T/saida" ]'

# 3. versão menor / igual ---------------------------------------------------------------------------------------------------
cp "$T/sexta-feira-engine-v0.1.0.bundle" "$DOWNLOADS_DIR/"
A --auto >/dev/null 2>&1
confere "versão menor é ignorada" '[ "$(instalado)" = 0.1.1 ]'
! A "$DOWNLOADS_DIR/sexta-feira-engine-v0.1.0.bundle" >/dev/null 2>&1
confere "versão menor por caminho é recusada" '[ "$(instalado)" = 0.1.1 ]'
rm -f "$DOWNLOADS_DIR/sexta-feira-engine-v0.1.0.bundle"

# 4. bundle sem tag / VERSAO que não bate -------------------------------------------------------------------------------------
cd "$FONTE" || exit 1
printf '0.1.2\n' > VERSAO; sed -i '0,/^## v0.1.1/s//## v0.1.2/' CHANGELOG.md; git add -A; git commit -q -m "sem tag"
git bundle create "$T/sexta-feira-engine-v0.1.2.bundle" --branches >/dev/null 2>&1   # sem --tags: não leva a tag v0.1.2
cp "$T/sexta-feira-engine-v0.1.2.bundle" "$DOWNLOADS_DIR/"
A --auto >"$T/saida" 2>&1
confere "bundle sem tag não instala" '[ "$(instalado)" = 0.1.1 ]'
confere "bundle sem tag NÃO é registrado em lista" '[ ! -s "$ESTADO/atualizador-falhou.txt" ] && [ ! -e "$ENGINE_DIR/estado/atualizador-falhou.txt" ]'
git tag v0.1.3   # tag com número diferente do VERSAO de dentro
git bundle create "$T/x.bundle" --branches --tags >/dev/null 2>&1
mv "$T/x.bundle" "$DOWNLOADS_DIR/sexta-feira-engine-v0.1.3.bundle"
rm -f "$DOWNLOADS_DIR/sexta-feira-engine-v0.1.2.bundle"
A --auto >"$T/saida" 2>&1
confere "VERSAO de dentro diferente do nome não instala" '[ "$(instalado)" = 0.1.1 ]'
rm -f "$DOWNLOADS_DIR"/*.bundle
git tag -d v0.1.3 >/dev/null; git reset -q --hard v0.1.1; git tag -d v0.1.2 >/dev/null 2>&1 || true

# 5. pasta mexida à mão -----------------------------------------------------------------------------------------------------
nova_versao 0.1.2
cp "$T/sexta-feira-engine-v0.1.2.bundle" "$DOWNLOADS_DIR/"
echo "mexi à mão" >> "$ENGINE_DIR/README.md"
A --auto >"$T/saida" 2>&1
confere "pasta mexida à mão: recusa" '[ "$(instalado)" = 0.1.1 ]'
confere "recusa registrada em atualizador-falhou.txt" 'grep -q "v0.1.2" "$ENGINE_DIR/estado/atualizador-falhou.txt"'
git -C "$ENGINE_DIR" checkout -q -- README.md
A --auto >"$T/saida" 2>&1
confere "bundle já recusado não é tentado de novo pelo automático" '[ "$(instalado)" = 0.1.1 ]'
A >"$T/saida" 2>&1
confere "à mão, o bundle recusado pode ser reinstalado" '[ "$(instalado)" = 0.1.2 ]'
rm -f "$DOWNLOADS_DIR"/*.bundle

# 6. rollback quando o teste falha ------------------------------------------------------------------------------------------
git reset -q --hard v0.1.2
printf '0.1.3\n' > VERSAO; sed -i '0,/^## v0.1.2/s//## v0.1.3/' CHANGELOG.md
echo '<script>fetch("https://exemplo.invalid/x")</script>' > interface/ruim.html   # a conferência de rede reprova
git add -A; git commit -q -m "v0.1.3 ruim"; git tag v0.1.3
git bundle create "$T/sexta-feira-engine-v0.1.3.bundle" --branches --tags >/dev/null 2>&1
cp "$T/sexta-feira-engine-v0.1.3.bundle" "$DOWNLOADS_DIR/"
COMMIT_ANTES="$(git -C "$ENGINE_DIR" rev-parse HEAD)"
A --auto >"$T/saida" 2>&1
confere "teste que falha: volta para a versão anterior" '[ "$(instalado)" = 0.1.2 ] && [ "$(git -C "$ENGINE_DIR" rev-parse HEAD)" = "$COMMIT_ANTES" ]'
confere "rollback: publicar/ sem o arquivo ruim" '[ ! -e "$ENGINE_DIR/publicar/ruim.html" ]'
confere "rollback: soma registrada" 'grep -q "v0.1.3" "$ENGINE_DIR/estado/atualizador-falhou.txt"'
confere "rollback: pasta limpa" '[ -z "$(git -C "$ENGINE_DIR" status --porcelain --untracked-files=no)" ]'
rm -f "$DOWNLOADS_DIR"/*.bundle

# 7. bundle refeito (mesmo nome, soma nova) é tentado ---------------------------------------------------------------------
git reset -q --hard v0.1.2; git tag -d v0.1.3 >/dev/null
nova_versao 0.1.3
cp "$T/sexta-feira-engine-v0.1.3.bundle" "$DOWNLOADS_DIR/"
A --auto >"$T/saida" 2>&1
confere "bundle refeito com o mesmo nome é tentado e instala" '[ "$(instalado)" = 0.1.3 ]'
rm -f "$DOWNLOADS_DIR"/*.bundle

# 8. --voltar -----------------------------------------------------------------------------------------------------------------
A --voltar v0.1.1 >"$T/saida" 2>&1
confere "--voltar volta o código" '[ "$(instalado)" = 0.1.1 ]'
confere "--voltar grava atualizador-ignorar.txt" '[ "$(tr -d "[:space:]" < "$ENGINE_DIR/estado/atualizador-ignorar.txt")" = 0.1.3 ]'
cp "$T/sexta-feira-engine-v0.1.3.bundle" "$DOWNLOADS_DIR/"
A --auto >"$T/saida" 2>&1
confere "depois do --voltar o automático não reinstala a recusada" '[ "$(instalado)" = 0.1.1 ]'
! A --voltar v0.1.5 >/dev/null 2>&1
confere "--voltar para tag desconhecida é recusado" '[ "$(instalado)" = 0.1.1 ]'
rm -f "$DOWNLOADS_DIR"/*.bundle

# 9. espelho em repositório local --------------------------------------------------------------------------------------------
git init -q --bare "$T/espelho.git"
git -C "$ENGINE_DIR" remote add origin "$T/espelho.git" 2>/dev/null || git -C "$ENGINE_DIR" remote set-url origin "$T/espelho.git"
: > "$ENGINE_DIR/estado/espelho"
A --espelhar >"$T/saida" 2>&1
confere "--espelhar empurra o main" '[ "$(git -C "$T/espelho.git" rev-parse refs/heads/main)" = "$(git -C "$ENGINE_DIR" rev-parse HEAD)" ]'
confere "--espelhar empurra as tags" 'git -C "$T/espelho.git" rev-parse -q --verify refs/tags/v0.1.1 >/dev/null'

echo
echo "resultado: $PASSOU ok, $FALHOU falha(s)"
[ "$FALHOU" -eq 0 ]
