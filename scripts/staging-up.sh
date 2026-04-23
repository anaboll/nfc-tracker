#!/bin/bash
# ---------------------------------------------------------------------------
# Stawia lokalny staging (2 repliki + Postgres) w Dockerze.
#
# Używa docker-compose.staging.yml jako override — porty bindowane do
# 0.0.0.0 zamiast 127.0.0.1 żeby telefon po WiFi mógł się dostać.
#
# Używanie:
#   bash scripts/staging-up.sh
#
# Po starcie wypisuje LAN IP + URL-e, żeby łatwo otworzyć na telefonie.
# ---------------------------------------------------------------------------

set -euo pipefail

cd "$(dirname "$0")/.."

# Colors
if [ -t 1 ]; then
  C_GREEN=$'\033[0;32m'; C_CYAN=$'\033[0;36m'; C_RED=$'\033[0;31m'; C_YELLOW=$'\033[0;33m'; C_RESET=$'\033[0m'
else
  C_GREEN=; C_CYAN=; C_RED=; C_YELLOW=; C_RESET=
fi

log()  { echo "${C_CYAN}[$(date +%H:%M:%S)]${C_RESET} $*"; }
ok()   { echo "${C_GREEN}✓${C_RESET} $*"; }
warn() { echo "${C_YELLOW}⚠${C_RESET} $*"; }
err()  { echo "${C_RED}✗${C_RESET} $*" >&2; }

# Pre-flight: env file
if [ ! -f .env.staging ]; then
  err "Brakuje .env.staging"
  echo ""
  echo "Stwórz go:"
  echo "  cp .env.staging.example .env.staging"
  echo "  # potem edytuj wartości (IP_HASH_SECRET i SALT skopiuj z proda)"
  exit 1
fi

# Pre-flight: docker running
if ! docker info >/dev/null 2>&1; then
  err "Docker nie chodzi. Uruchom Docker Desktop."
  exit 1
fi

# Pre-flight: porty 3001/3002 wolne
for port in 3001 3002; do
  if netstat -an 2>/dev/null | grep -q ":${port} .*LISTEN" ; then
    # Tylko ostrzeżenie — może to już nasz kontener. Docker compose sobie poradzi
    # jeśli to stary kontener (recreate), błąd dopiero jak to inna aplikacja.
    warn "Port ${port} już zajęty (może stary kontener staging — zostanie recreate)"
  fi
done

log "Build obrazu (app1 i app2 dzielą image nfc-tracker-app)..."
# UWAGA: budujemy TYLKO app1 — obie repliki dzielą ten sam image (x-app-common).
# `up --build` próbowałoby budować równolegle z wyścigiem o tag — crash.
docker compose \
  -f docker-compose.yml \
  -f docker-compose.staging.yml \
  --env-file .env.staging \
  build app1

log "Up (staging override, env=.env.staging)..."
docker compose \
  -f docker-compose.yml \
  -f docker-compose.staging.yml \
  --env-file .env.staging \
  up -d

log "Czekam aż obie repliki będą healthy (max 90s)..."
for container in nfc_app_1 nfc_app_2; do
  waited=0
  while [ $waited -lt 90 ]; do
    status=$(docker inspect --format '{{.State.Health.Status}}' "$container" 2>/dev/null || echo "starting")
    case "$status" in
      healthy)  ok "$container healthy (po ${waited}s)"; break ;;
      unhealthy) err "$container UNHEALTHY. Sprawdź logi: docker logs $container"; exit 1 ;;
    esac
    sleep 3
    waited=$((waited + 3))
  done
  if [ $waited -ge 90 ]; then
    err "$container nie wstał w 90s. Sprawdź logi: docker logs $container"
    exit 1
  fi
done

# Wykryj LAN IP dla dostępu z telefonu
# Na Windows/Git Bash: ipconfig.exe. Na WSL/Linux: ip route.
LAN_IP=""
if command -v ipconfig.exe >/dev/null 2>&1; then
  # Windows przez Git Bash
  LAN_IP=$(ipconfig.exe | grep -E "IPv4.*:" | grep -v "127\." | grep -v "172\." \
    | head -1 | awk -F': ' '{print $2}' | tr -d '\r\n ')
elif command -v hostname >/dev/null 2>&1; then
  LAN_IP=$(hostname -I 2>/dev/null | awk '{print $1}' || echo "")
fi
[ -z "$LAN_IP" ] && LAN_IP="<sprawdz_ipconfig>"

echo ""
echo "==================================================="
ok "Staging up!"
echo ""
echo "  Z tego PC:"
echo "    http://localhost:3001  (app1)"
echo "    http://localhost:3002  (app2)"
echo ""
echo "  Z telefonu po domowej WiFi:"
echo "    http://${LAN_IP}:3001"
echo "    http://${LAN_IP}:3002"
echo "==================================================="
echo ""
echo "Dalsze kroki:"
echo "  Dane 1:1 z proda:   bash scripts/staging-pull.sh"
echo "  Stop:               bash scripts/staging-down.sh"
echo "  Logi live:          docker logs -f nfc_app_1"
echo "  Panel admina:       http://${LAN_IP}:3001/dashboard/status"
