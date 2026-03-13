#!/usr/bin/env bash

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
ENV_FILE="${HA_DEV_ENV_FILE:-$REPO_ROOT/.env.dev}"

if [[ -f "$ENV_FILE" ]]; then
  # shellcheck disable=SC1090
  source "$ENV_FILE"
fi

require_cmd() {
  local name="$1"
  if ! command -v "$name" >/dev/null 2>&1; then
    echo "Required command not found: $name" >&2
    exit 1
  fi
}

require_cmd find
require_cmd shasum

WATCH_INTERVAL="${HA_DEV_WATCH_INTERVAL:-2}"

snapshot() {
  (
    cd "$REPO_ROOT"
    find custom_components/hass_records scripts \
      -type f \
      \( -name '*.js' -o -name '*.py' -o -name '*.json' -o -name '*.yaml' -o -name '*.sh' \) \
      | LC_ALL=C sort \
      | xargs shasum
  ) | shasum | awk '{print $1}'
}

LAST_HASH=""

echo "Starting hass-records watch mode..."
echo "Polling every ${WATCH_INTERVAL}s"

while true; do
  CURRENT_HASH="$(snapshot)"
  if [[ "$CURRENT_HASH" != "$LAST_HASH" ]]; then
    if [[ -n "$LAST_HASH" ]]; then
      echo "Change detected. Syncing..."
    else
      echo "Initial sync..."
    fi
    bash "$REPO_ROOT/scripts/dev-sync.sh"
    LAST_HASH="$CURRENT_HASH"
  fi
  sleep "$WATCH_INTERVAL"
done
