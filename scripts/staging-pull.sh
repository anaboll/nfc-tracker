#!/bin/bash
# ---------------------------------------------------------------------------
# Pobiera snapshot DB + uploads z proda i wgrywa do LOKALNEGO stagingu.
#
# Wymaga:
#   - staging jest w górze (bash scripts/staging-up.sh)
#   - dostęp ssh do proda (klucz ~/.ssh/hetzner_nfc)
#   - tar + ssh (ships z Git Bash na Windows; nie wymaga rsync)
#
# Używanie:
#   bash scripts/staging-pull.sh
#
# Flagi:
#   --skip-uploads   pomija rsync uploads (tylko DB, szybciej przy dużych plikach)
#   --skip-db        pomija pg_dump (tylko uploads)
# ---------------------------------------------------------------------------

set -euo pipefail

# Wyłącz MSYS path mangling na Git Bash (inaczej /app/public/uploads staje się
# C:/Program Files/Git/app/public/uploads w argumentach do docker exec/cp).
export MSYS_NO_PATHCONV=1
export MSYS2_ARG_CONV_EXCL="*"

SSH_KEY="${SSH_KEY:-$HOME/.ssh/hetzner_nfc}"
PROD="${PROD_HOST:-root@46.225.127.112}"
SNAPSHOT_FILE="/tmp/prod-snapshot.dump"
UPLOADS_LOCAL="/tmp/prod-uploads"

SKIP_UPLOADS=false
SKIP_DB=false
for arg in "$@"; do
  case $arg in
    --skip-uploads) SKIP_UPLOADS=true ;;
    --skip-db) SKIP_DB=true ;;
    *) echo "Unknown flag: $arg" >&2; exit 1 ;;
  esac
done

# Colors
if [ -t 1 ]; then
  C_GREEN=$'\033[0;32m'; C_CYAN=$'\033[0;36m'; C_RED=$'\033[0;31m'; C_RESET=$'\033[0m'
else
  C_GREEN=; C_CYAN=; C_RED=; C_RESET=
fi

log()  { echo "${C_CYAN}[$(date +%H:%M:%S)]${C_RESET} $*"; }
ok()   { echo "${C_GREEN}✓${C_RESET} $*"; }
err()  { echo "${C_RED}✗${C_RESET} $*" >&2; }

# Pre-flight: sprawdź że staging chodzi
if ! docker ps --format '{{.Names}}' | grep -q '^nfc_postgres$'; then
  err "nfc_postgres nie chodzi. Najpierw: bash scripts/staging-up.sh"
  exit 1
fi
if ! docker ps --format '{{.Names}}' | grep -q '^nfc_app_1$'; then
  err "nfc_app_1 nie chodzi. Najpierw: bash scripts/staging-up.sh"
  exit 1
fi

# ---------------------------------------------------------------------------
# DB snapshot
# ---------------------------------------------------------------------------
if [ "$SKIP_DB" = false ]; then
  log "pg_dump na prodzie (custom format, compressed)..."
  ssh -i "$SSH_KEY" -o BatchMode=yes "$PROD" \
    'docker exec nfc_postgres pg_dump -U nfc_user -Fc nfc_tracker' \
    > "$SNAPSHOT_FILE"
  DUMP_SIZE=$(du -h "$SNAPSHOT_FILE" | awk '{print $1}')
  ok "Snapshot pobrany do $SNAPSHOT_FILE ($DUMP_SIZE)"

  log "pg_restore do lokalnego nfc_postgres..."
  # --clean --if-exists: drop i odtwórz schema (nie append do istniejących danych)
  # --no-owner: nie próbuj ustawiać właściciela (inaczej errory na różnych userach)
  cat "$SNAPSHOT_FILE" | docker exec -i nfc_postgres pg_restore \
    -U nfc_user -d nfc_tracker --clean --if-exists --no-owner 2>&1 | grep -v "^$" || true
  ok "DB zrestorowana (1:1 z proda)"
fi

# ---------------------------------------------------------------------------
# Uploads sync
# ---------------------------------------------------------------------------
if [ "$SKIP_UPLOADS" = false ]; then
  log "tar uploads z proda przez ssh (streaming, bez rsync)..."
  mkdir -p "$UPLOADS_LOCAL"
  # Wyczyść stary lokalny cache żeby 1:1 sync faktycznie usuwał stare pliki
  rm -rf "$UPLOADS_LOCAL"/* "$UPLOADS_LOCAL"/.[!.]* 2>/dev/null || true
  # Volume na prodzie: nfc-tracker_uploads_data
  # `tar cf - -C /path .` streamuje zawartość, local `tar xf -` rozpakowuje
  ssh -i "$SSH_KEY" -o BatchMode=yes "$PROD" \
    'tar cf - -C /var/lib/docker/volumes/nfc-tracker_uploads_data/_data .' \
    | tar xf - -C "$UPLOADS_LOCAL"
  UPLOADS_SIZE=$(du -sh "$UPLOADS_LOCAL" 2>/dev/null | awk '{print $1}' || echo "?")
  ok "Uploads pobrane do $UPLOADS_LOCAL ($UPLOADS_SIZE)"

  log "tar streaming uploads → nfc_app_1 (kontenery app1+app2 dzielą named volume uploads_data)..."
  # Najpierw wyczyść stare uploads w kontenerze (1:1 sync)
  docker exec nfc_app_1 sh -c 'rm -rf /app/public/uploads/* /app/public/uploads/.[!.]* 2>/dev/null || true'
  # Stream tar → docker exec tar xf: omija `docker cp` które na Git Bash potrafi
  # mangować ścieżki (gubi końcowy `/.` i pakuje do podkatalogu).
  tar cf - -C "$UPLOADS_LOCAL" . | docker exec -i nfc_app_1 tar xf - -C /app/public/uploads/
  # Właściciel — nextjs w kontenerze ma uid 1001
  docker exec --user root nfc_app_1 chown -R 1001:1001 /app/public/uploads/ 2>/dev/null || true
  ok "Uploads wgrane do kontenera (widoczne też z app2 przez wspólny volume)"
fi

echo ""
ok "Snapshot zaaplikowany. DB i uploads 1:1 z proda."
echo ""
echo "Szybki test:"
echo "  curl http://localhost:3001/api/health    # powinno być 200"
echo "  curl http://localhost:3001/vcard/laboversum-wizytowka  # prawdziwa wizytówka z proda"
