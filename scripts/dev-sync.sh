#!/usr/bin/env bash

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
ENV_FILE="${HA_DEV_ENV_FILE:-$REPO_ROOT/.env.dev}"

if [[ -f "$ENV_FILE" ]]; then
  # shellcheck disable=SC1090
  source "$ENV_FILE"
fi

require_var() {
  local name="$1"
  if [[ -z "${!name:-}" ]]; then
    echo "Missing required setting: $name" >&2
    exit 1
  fi
}

require_cmd() {
  local name="$1"
  if ! command -v "$name" >/dev/null 2>&1; then
    echo "Required command not found: $name" >&2
    exit 1
  fi
}

require_cmd bash
require_cmd rsync
require_cmd ssh
require_cmd mktemp

require_var HA_DEV_HOST
require_var HA_DEV_CONFIG_PATH

HA_DEV_USER="${HA_DEV_USER:-root}"
HA_DEV_PORT="${HA_DEV_PORT:-22}"
HA_DEV_REMOTE_COMPONENT_PATH="${HA_DEV_REMOTE_COMPONENT_PATH:-$HA_DEV_CONFIG_PATH/custom_components/hass_records}"
HA_DEV_BUILD="${HA_DEV_BUILD:-1}"
HA_DEV_DELETE="${HA_DEV_DELETE:-1}"

DO_BUILD=1
DO_RESTART=0
DRY_RUN=0

while [[ $# -gt 0 ]]; do
  case "$1" in
    --no-build)
      DO_BUILD=0
      ;;
    --restart)
      DO_RESTART=1
      ;;
    --dry-run)
      DRY_RUN=1
      ;;
    *)
      echo "Unknown argument: $1" >&2
      echo "Usage: bash scripts/dev-sync.sh [--no-build] [--restart] [--dry-run]" >&2
      exit 1
      ;;
  esac
  shift
done

if [[ "$HA_DEV_BUILD" != "1" ]]; then
  DO_BUILD=0
fi

if [[ $DO_BUILD -eq 1 ]]; then
  echo "Building frontend bundle..."
  bash "$REPO_ROOT/scripts/build.sh"
fi

SSH_OPTS=(-p "$HA_DEV_PORT")
if [[ -n "${HA_DEV_SSH_KEY:-}" ]]; then
  SSH_OPTS+=(-i "$HA_DEV_SSH_KEY")
fi

CONTROL_DIR="${HA_DEV_SSH_CONTROL_DIR:-$(mktemp -d "${TMPDIR:-/tmp}/hass-records-ssh.XXXXXX")}"
CONTROL_PATH="$CONTROL_DIR/control.sock"
SSH_OPTS+=(
  -o "ControlMaster=auto"
  -o "ControlPersist=${HA_DEV_SSH_PERSIST:-10m}"
  -o "ControlPath=$CONTROL_PATH"
)

RSYNC_RSH=(ssh "${SSH_OPTS[@]}")
RSYNC_ARGS=(-az)
if [[ "$HA_DEV_DELETE" == "1" ]]; then
  RSYNC_ARGS+=(--delete)
fi
if [[ $DRY_RUN -eq 1 ]]; then
  RSYNC_ARGS+=(--dry-run)
fi

REMOTE="${HA_DEV_USER}@${HA_DEV_HOST}"
REMOTE_PARENT="$(dirname "$HA_DEV_REMOTE_COMPONENT_PATH")"

cleanup() {
  ssh "${SSH_OPTS[@]}" -O exit "$REMOTE" >/dev/null 2>&1 || true
  rm -rf "$CONTROL_DIR"
}
trap cleanup EXIT

echo "Opening shared SSH connection..."
ssh "${SSH_OPTS[@]}" -o "BatchMode=no" "$REMOTE" "true"

echo "Ensuring remote custom_components directory exists..."
ssh "${SSH_OPTS[@]}" "$REMOTE" "mkdir -p \"$REMOTE_PARENT\""

echo "Syncing custom component to $REMOTE:$HA_DEV_REMOTE_COMPONENT_PATH"
rsync "${RSYNC_ARGS[@]}" \
  -e "${RSYNC_RSH[*]}" \
  "$REPO_ROOT/custom_components/hass_records/" \
  "$REMOTE:$HA_DEV_REMOTE_COMPONENT_PATH/"

if [[ $DO_RESTART -eq 1 ]]; then
  if [[ -z "${HA_DEV_RESTART_COMMAND:-}" ]]; then
    echo "Skipping restart because HA_DEV_RESTART_COMMAND is not set."
  else
    echo "Running remote restart command..."
    ssh "${SSH_OPTS[@]}" "$REMOTE" "$HA_DEV_RESTART_COMMAND"
  fi
fi

echo "Sync complete."
