#!/bin/bash
# ---------------------------------------------------------------------------
# Rolling deploy for nfc-tracker.
#
# Swaps app1, then app2 — never stops both at the same time, so nginx always
# has at least one healthy backend to route requests to. Each replica must
# pass its Docker HEALTHCHECK (hits /api/health) before we move on to the
# next one; if a replica fails to become healthy within HEALTH_TIMEOUT, the
# deploy aborts and the other replica keeps serving the old version.
#
# Usage (on server):
#   cd /opt/nfc-tracker && bash scripts/rolling-deploy.sh
#
# Usage (locally, for testing):
#   cd nfc-tracker && bash scripts/rolling-deploy.sh --skip-git
#
# Flags:
#   --skip-git    don't git pull (for local testing where branch is already set)
#   --skip-smoke  don't run smoke tests at the end
# ---------------------------------------------------------------------------

set -euo pipefail

# Config
HEALTH_TIMEOUT=90            # seconds to wait for a replica to become healthy
HEALTH_CHECK_INTERVAL=3      # polling interval during wait
SKIP_GIT=false
SKIP_SMOKE=false

for arg in "$@"; do
  case $arg in
    --skip-git)   SKIP_GIT=true ;;
    --skip-smoke) SKIP_SMOKE=true ;;
    *) echo "Unknown flag: $arg" >&2; exit 1 ;;
  esac
done

# Colors (if stdout is a TTY)
if [ -t 1 ]; then
  C_RED=$'\033[0;31m'; C_GREEN=$'\033[0;32m'; C_YELLOW=$'\033[0;33m'; C_CYAN=$'\033[0;36m'; C_RESET=$'\033[0m'
else
  C_RED=; C_GREEN=; C_YELLOW=; C_CYAN=; C_RESET=
fi

log()  { echo "${C_CYAN}[$(date +%H:%M:%S)]${C_RESET} $*"; }
ok()   { echo "${C_GREEN}✓${C_RESET} $*"; }
warn() { echo "${C_YELLOW}⚠${C_RESET} $*"; }
err()  { echo "${C_RED}✗${C_RESET} $*" >&2; }

# Wait for a container's healthcheck to report `healthy`.
# Arg1: container name (e.g. nfc_app_1). Returns 0 if healthy, 1 if timeout.
wait_healthy() {
  local container=$1
  local waited=0
  log "Waiting for $container to become healthy (timeout ${HEALTH_TIMEOUT}s)..."
  while [ $waited -lt $HEALTH_TIMEOUT ]; do
    local status
    status=$(docker inspect --format '{{.State.Health.Status}}' "$container" 2>/dev/null || echo "missing")
    case "$status" in
      healthy)  ok "$container is healthy (after ${waited}s)"; return 0 ;;
      unhealthy) err "$container reported UNHEALTHY"; return 1 ;;
    esac
    sleep $HEALTH_CHECK_INTERVAL
    waited=$((waited + HEALTH_CHECK_INTERVAL))
  done
  err "$container failed to become healthy within ${HEALTH_TIMEOUT}s (last status: $status)"
  return 1
}

# Rebuild then recreate a single app service (app1 or app2).
roll_replica() {
  local service=$1     # e.g. app1
  local container=$2   # e.g. nfc_app_1
  log "Rolling $service..."
  docker compose up -d --no-deps --force-recreate "$service"
  if ! wait_healthy "$container"; then
    err "Replica $service failed — OTHER replica still serving traffic on the OLD version."
    err "Fix the issue locally, then re-run this script to retry."
    exit 1
  fi
}

# ---------------------------------------------------------------------------
# MAIN
# ---------------------------------------------------------------------------

log "Starting rolling deploy"

if [ "$SKIP_GIT" = false ]; then
  log "git pull..."
  git pull --ff-only
fi

# Capture current git state for baking into the image via Docker ARGs.
# /api/health + /dashboard/status surface these so you can see exactly which
# commit each replica is serving — critical during/after a rolling deploy.
export BUILD_COMMIT="$(git rev-parse HEAD 2>/dev/null || echo unknown)"
export BUILD_BRANCH="$(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo unknown)"
export BUILD_TIME="$(date -u +%Y-%m-%dT%H:%M:%SZ)"
log "Build metadata: branch=$BUILD_BRANCH commit=${BUILD_COMMIT:0:7} time=$BUILD_TIME"

log "Building shared app image..."
# docker compose reads BUILD_* from env and passes them as --build-arg (see
# x-app-common.build.args in docker-compose.yml). app1 and app2 share the
# same image (x-app-common), so we build once using app1 as the proxy.
docker compose build app1

# Roll app1 first, then app2. Order doesn't matter functionally — nginx round-
# robins between them — but doing it sequentially guarantees at least one
# healthy replica throughout.
roll_replica app1 nfc_app_1
roll_replica app2 nfc_app_2

ok "Both replicas recreated and healthy"

if [ "$SKIP_SMOKE" = false ]; then
  log "Running smoke tests..."
  if bash "$(dirname "$0")/smoke-test.sh"; then
    ok "Smoke tests passed — deploy complete"
  else
    err "Smoke tests FAILED — both replicas are on the new version, but something is broken."
    err "Investigate logs: docker compose logs app1 app2 --tail 50"
    exit 1
  fi
else
  ok "Deploy complete (smoke tests skipped)"
fi
