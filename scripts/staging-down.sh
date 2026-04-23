#!/bin/bash
# ---------------------------------------------------------------------------
# Zatrzymuje lokalny staging. Dane DB + uploads ZOSTAJĄ w docker volumes,
# żeby następny staging-up.sh wstał od razu z istniejącym snapshotem (bez
# konieczności ponownego pullu z proda).
#
# Używanie:
#   bash scripts/staging-down.sh          # zatrzymanie, zachowanie danych
#   bash scripts/staging-down.sh --wipe   # zatrzymanie + usunięcie volumes
# ---------------------------------------------------------------------------

set -euo pipefail

cd "$(dirname "$0")/.."

WIPE=false
for arg in "$@"; do
  case $arg in
    --wipe) WIPE=true ;;
    *) echo "Unknown flag: $arg" >&2; exit 1 ;;
  esac
done

if [ -t 1 ]; then
  C_GREEN=$'\033[0;32m'; C_CYAN=$'\033[0;36m'; C_YELLOW=$'\033[0;33m'; C_RESET=$'\033[0m'
else
  C_GREEN=; C_CYAN=; C_YELLOW=; C_RESET=
fi

log()  { echo "${C_CYAN}[$(date +%H:%M:%S)]${C_RESET} $*"; }
ok()   { echo "${C_GREEN}✓${C_RESET} $*"; }
warn() { echo "${C_YELLOW}⚠${C_RESET} $*"; }

# .env.staging może nie istnieć (np. po wipe) — docker compose i tak sobie poradzi
ENV_FLAG=""
[ -f .env.staging ] && ENV_FLAG="--env-file .env.staging"

log "Zatrzymywanie stagingu..."

if [ "$WIPE" = true ]; then
  warn "Tryb --wipe: usuwam też volumes (DB + uploads)"
  docker compose -f docker-compose.yml -f docker-compose.staging.yml $ENV_FLAG down -v --remove-orphans
  ok "Staging down + dane usunięte. Następny staging-up = pusta baza, trzeba staging-pull."
else
  docker compose -f docker-compose.yml -f docker-compose.staging.yml $ENV_FLAG down
  ok "Staging down. Dane (DB + uploads) zachowane w volumes."
  echo "  → następny staging-up.sh wstanie z tymi samymi danymi (bez potrzeby pull)"
  echo "  → aby wymazać całkowicie: bash scripts/staging-down.sh --wipe"
fi
