#!/bin/bash
# ---------------------------------------------------------------------------
# Post-deploy smoke test for nfc-tracker.
#
# Verifies the 5 most important end-user paths work. Runs both against each
# replica directly (internal port 3001/3002) and against the public URL
# (through Cloudflare + system nginx), so failures localize quickly:
#   - replica direct fails → replica bug
#   - public fails but replica OK → nginx / Cloudflare / DNS
#
# Exit code 0 = all tests passed. Non-zero = at least one failed, count + list
# printed to stderr.
#
# Env overrides:
#   SMOKE_PUBLIC_URL (default https://twojenfc.pl)
#   SMOKE_REPLICAS   (default "3001 3002" — space-separated host ports)
#   BN_STATS_TOKEN   (default from env, or skip that specific test)
# ---------------------------------------------------------------------------

set -uo pipefail

PUBLIC_URL="${SMOKE_PUBLIC_URL:-https://twojenfc.pl}"
REPLICA_PORTS="${SMOKE_REPLICAS:-3001 3002}"
BN_TOKEN="${BN_STATS_TOKEN:-}"

PASS=0
FAIL=0
FAIL_LIST=()

# Colors
if [ -t 1 ]; then
  C_RED=$'\033[0;31m'; C_GREEN=$'\033[0;32m'; C_RESET=$'\033[0m'
else
  C_RED=; C_GREEN=; C_RESET=
fi

ok()   { echo "${C_GREEN}PASS${C_RESET} $*"; PASS=$((PASS + 1)); }
fail() { echo "${C_RED}FAIL${C_RESET} $*" >&2; FAIL=$((FAIL + 1)); FAIL_LIST+=("$*"); }

# check_http NAME URL EXPECTED_CODE [EXTRA_CURL_ARGS...]
check_http() {
  local name=$1; local url=$2; local expected=$3; shift 3
  local actual
  actual=$(curl -sk -o /dev/null -w "%{http_code}" --max-time 10 "$@" "$url" 2>&1 || echo "000")
  if [ "$actual" = "$expected" ]; then
    ok "$name → $expected"
  else
    fail "$name → expected $expected, got $actual ($url)"
  fi
}

# check_redirect NAME URL EXPECTED_CODE LOCATION_CONTAINS
check_redirect() {
  local name=$1; local url=$2; local expected_code=$3; local expected_location=$4
  local response
  response=$(curl -sk -o /dev/null -w "%{http_code}|%{redirect_url}" --max-time 10 "$url" 2>&1 || echo "000|")
  local code="${response%%|*}"
  local loc="${response##*|}"
  if [ "$code" = "$expected_code" ] && echo "$loc" | grep -q "$expected_location"; then
    ok "$name → $code → $loc"
  else
    fail "$name → expected $expected_code to *$expected_location*, got $code → $loc"
  fi
}

# check_json_ok NAME URL POST_BODY
check_json_ok() {
  local name=$1; local url=$2; local body=$3
  local response
  response=$(curl -sk --max-time 10 -X POST -H "Content-Type: application/json" -d "$body" "$url" 2>&1 || echo "{}")
  if echo "$response" | grep -q '"ok":true'; then
    ok "$name → {ok:true}"
  else
    fail "$name → no {ok:true} in response: $response"
  fi
}

echo "=== Replica direct checks ==="
for port in $REPLICA_PORTS; do
  check_http "replica:$port /api/health"       "http://127.0.0.1:${port}/api/health"       200
  check_http "replica:$port /"                 "http://127.0.0.1:${port}/"                  200
done

echo ""
echo "=== Public URL checks (through Cloudflare + nginx) ==="
check_http     "public / (landing)"               "${PUBLIC_URL}/"                                           200
check_http     "public /api/health"               "${PUBLIC_URL}/api/health"                                 200
check_http     "public /vcard/laboversum-wizytowka" "${PUBLIC_URL}/vcard/laboversum-wizytowka"               200
check_redirect "public /s/wizytowka redirect"    "${PUBLIC_URL}/s/wizytowka"                                302 "/vcard/wizytowka"
check_json_ok  "public POST /api/track-hash"     "${PUBLIC_URL}/api/track-hash"                             '{"code":"TEST"}'

if [ -n "$BN_TOKEN" ]; then
  check_http "public /api/bn-stats (auth'd)"      "${PUBLIC_URL}/api/bn-stats?token=${BN_TOKEN}"             200
else
  echo "skip: /api/bn-stats (BN_STATS_TOKEN not set)"
fi

echo ""
echo "======================================================================"
TOTAL=$((PASS + FAIL))
if [ $FAIL -eq 0 ]; then
  echo "${C_GREEN}ALL ${PASS}/${TOTAL} TESTS PASSED${C_RESET}"
  exit 0
else
  echo "${C_RED}${FAIL}/${TOTAL} TESTS FAILED${C_RESET}"
  echo ""
  echo "Failures:"
  for item in "${FAIL_LIST[@]}"; do
    echo "  - $item"
  done
  exit 1
fi
