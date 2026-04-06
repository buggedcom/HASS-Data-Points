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
require_cmd python3

WATCH_INTERVAL="${HA_DEV_WATCH_INTERVAL:-2}"

snapshot() {
  (
    cd "$REPO_ROOT"
    find custom_components/hass_datapoints scripts \
      -type f \
      ! -name '.DS_Store' \
      ! -name '*.pyc' \
      ! -name '*.pyo' \
      ! -name '*.swp' \
      ! -name '*.tmp' \
      ! -path '*/__pycache__/*' \
      | LC_ALL=C sort \
      | xargs shasum
  ) | shasum | awk '{print $1}'
}

changed_files() {
  python3 - "$1" "$2" <<'PY'
import hashlib
import pathlib
import sys

before = pathlib.Path(sys.argv[1])
after = pathlib.Path(sys.argv[2])
repo_root = before.parent

def digest_map(base: pathlib.Path):
    result = {}
    for path in sorted((base / "custom_components" / "hass_datapoints").rglob("*")):
        if not path.is_file():
            continue
        if path.name in {".DS_Store"}:
            continue
        if path.suffix in {".pyc", ".pyo", ".tmp", ".swp"}:
            continue
        if "__pycache__" in path.parts:
            continue
        rel = path.relative_to(base).as_posix()
        result[rel] = hashlib.sha1(path.read_bytes()).hexdigest()
    for path in sorted((base / "scripts").rglob("*")):
        if not path.is_file():
            continue
        if path.name in {".DS_Store"}:
            continue
        if path.suffix in {".pyc", ".pyo", ".tmp", ".swp"}:
            continue
        if "__pycache__" in path.parts:
            continue
        rel = path.relative_to(base).as_posix()
        result[rel] = hashlib.sha1(path.read_bytes()).hexdigest()
    return result

before_map = digest_map(before)
after_map = digest_map(after)
for key in sorted(set(before_map) | set(after_map)):
    if before_map.get(key) != after_map.get(key):
        print(key)
PY
}

needs_restart_for_changes() {
  local changed="$1"
  while IFS= read -r file; do
    [[ -z "$file" ]] && continue
    case "$file" in
      custom_components/hass_datapoints/src/*|\
      custom_components/hass_datapoints/hass-datapoints-cards.js|\
      scripts/build.sh|\
      scripts/dev-sync.sh|\
      scripts/dev-watch.sh)
        ;;
      *)
        return 0
        ;;
    esac
  done <<< "$changed"
  return 1
}

LAST_HASH=""
PREV_SNAPSHOT_DIR=""
FORCE_REBUILD=false

echo "Starting hass-datapoints watch mode..."
echo "Polling every ${WATCH_INTERVAL}s"
echo "Press Enter to manually trigger a rebuild and sync."

while true; do
  CURRENT_HASH="$(snapshot)"
  if [[ "$CURRENT_HASH" != "$LAST_HASH" ]] || [[ "$FORCE_REBUILD" == "true" ]]; then
    FORCE_REBUILD=false
    CURRENT_SNAPSHOT_DIR="$(mktemp -d)"
    rsync -a \
      --exclude '__pycache__/' \
      --exclude '.DS_Store' \
      --exclude '*.pyc' \
      --exclude '*.pyo' \
      --exclude '*.swp' \
      --exclude '*.tmp' \
      "$REPO_ROOT/custom_components/" "$CURRENT_SNAPSHOT_DIR/custom_components/"
    rsync -a \
      --exclude '.DS_Store' \
      --exclude '*.pyc' \
      --exclude '*.pyo' \
      --exclude '*.swp' \
      --exclude '*.tmp' \
      "$REPO_ROOT/scripts/" "$CURRENT_SNAPSHOT_DIR/scripts/"

    if [[ -n "$LAST_HASH" ]]; then
      echo "Change detected. Syncing..."
    else
      echo "Initial sync..."
    fi
    CHANGED_FILES=""
    if [[ -n "$PREV_SNAPSHOT_DIR" ]]; then
      CHANGED_FILES="$(changed_files "$PREV_SNAPSHOT_DIR" "$CURRENT_SNAPSHOT_DIR")"
    fi

    if [[ -n "$CHANGED_FILES" ]]; then
      echo "$CHANGED_FILES"
    fi

    SYNC_EXIT_CODE=0
    if [[ -n "$PREV_SNAPSHOT_DIR" ]] && needs_restart_for_changes "$CHANGED_FILES"; then
      echo "Backend-affecting change detected. Syncing with restart..."
      if ! bash "$REPO_ROOT/scripts/dev-sync.sh" --restart; then
        SYNC_EXIT_CODE=$?
      fi
    else
      if ! bash "$REPO_ROOT/scripts/dev-sync.sh"; then
        SYNC_EXIT_CODE=$?
      fi
    fi

    if [[ $SYNC_EXIT_CODE -eq 0 ]]; then
      LAST_HASH="$CURRENT_HASH"
      echo "Watch sync succeeded."
    else
      echo "Watch sync failed with exit code $SYNC_EXIT_CODE. Waiting for the next change..." >&2
    fi

    if [[ -n "$PREV_SNAPSHOT_DIR" ]]; then
      rm -rf "$PREV_SNAPSHOT_DIR"
    fi
    PREV_SNAPSHOT_DIR="$CURRENT_SNAPSHOT_DIR"
  fi
  if IFS= read -r -s -t "$WATCH_INTERVAL" _REPLY; then
    echo "Manual rebuild triggered..."
    FORCE_REBUILD=true
    continue
  fi
done
