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
HA_DEV_REMOTE_COMPONENT_PATH="${HA_DEV_REMOTE_COMPONENT_PATH:-$HA_DEV_CONFIG_PATH/custom_components/hass_datapoints}"
HA_DEV_BUILD="${HA_DEV_BUILD:-1}"
HA_DEV_DELETE="${HA_DEV_DELETE:-1}"

DO_BUILD=1
DO_RESTART=0
DRY_RUN=0
VERBOSE=0

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
    --verbose|-v)
      VERBOSE=1
      ;;
    *)
      echo "Unknown argument: $1" >&2
      echo "Usage: bash scripts/dev-sync.sh [--no-build] [--restart] [--dry-run] [--verbose]" >&2
      exit 1
      ;;
  esac
  shift
done

if [[ "$HA_DEV_BUILD" != "1" ]]; then
  DO_BUILD=0
fi

# ---------------------------------------------------------------------------
# Debug helpers
# ---------------------------------------------------------------------------

dbg() {
  if [[ $VERBOSE -eq 1 ]]; then
    echo "[debug] $*" >&2
  fi
}

dbg "=== dev-sync configuration ==="
dbg "  HA_DEV_HOST=$HA_DEV_HOST"
dbg "  HA_DEV_USER=$HA_DEV_USER"
dbg "  HA_DEV_PORT=$HA_DEV_PORT"
dbg "  HA_DEV_CONFIG_PATH=$HA_DEV_CONFIG_PATH"
dbg "  HA_DEV_REMOTE_COMPONENT_PATH=$HA_DEV_REMOTE_COMPONENT_PATH"
dbg "  HA_DEV_BUILD=$HA_DEV_BUILD"
dbg "  HA_DEV_DELETE=$HA_DEV_DELETE"
dbg "  HA_DEV_SSH_KEY=${HA_DEV_SSH_KEY:-<not set>}"
dbg "  HA_DEV_SSH_PERSIST=${HA_DEV_SSH_PERSIST:-<not set, default 10m>}"
dbg "  DO_BUILD=$DO_BUILD  DO_RESTART=$DO_RESTART  DRY_RUN=$DRY_RUN  VERBOSE=$VERBOSE"
dbg "==================================="

# ---------------------------------------------------------------------------
# DNS / address resolution check
# ---------------------------------------------------------------------------

dbg "Resolving $HA_DEV_HOST..."
if command -v getent >/dev/null 2>&1; then
  getent hosts "$HA_DEV_HOST" 2>&1 | while IFS= read -r line; do dbg "  getent: $line"; done || dbg "  getent: no result"
elif command -v host >/dev/null 2>&1; then
  host "$HA_DEV_HOST" 2>&1 | while IFS= read -r line; do dbg "  host: $line"; done || true
elif command -v dig >/dev/null 2>&1; then
  dig +short "$HA_DEV_HOST" 2>&1 | while IFS= read -r line; do dbg "  dig: $line"; done || true
else
  dbg "  (no DNS lookup tool available)"
fi

# ---------------------------------------------------------------------------
# Ensure sshd is running inside the HA container (it is not an s6 service
# by default, so it needs to be started manually after each container start).
# ---------------------------------------------------------------------------

HA_DEV_CONTAINER="${HA_DEV_CONTAINER:-homeassistant}"
if /usr/local/bin/docker inspect "$HA_DEV_CONTAINER" >/dev/null 2>&1; then
  SSHD_RUNNING="$(/usr/local/bin/docker exec "$HA_DEV_CONTAINER" sh -c 'pgrep -x sshd >/dev/null 2>&1 && echo yes || echo no' 2>/dev/null || echo no)"
  if [[ "$SSHD_RUNNING" != "yes" ]]; then
    dbg "sshd not running in container $HA_DEV_CONTAINER — starting it..."
    /usr/local/bin/docker exec -d "$HA_DEV_CONTAINER" /usr/sbin/sshd -D
    sleep 1
    dbg "sshd started."
  else
    dbg "sshd already running in $HA_DEV_CONTAINER."
  fi
else
  dbg "Container $HA_DEV_CONTAINER not found via docker — skipping sshd check."
fi

# ---------------------------------------------------------------------------
# Version bump
# ---------------------------------------------------------------------------

if [[ $DRY_RUN -eq 1 ]]; then
  NEW_VERSION="$(bash "$REPO_ROOT/scripts/bump-version.sh" --dry-run | tail -1)"
else
  NEW_VERSION="$(bash "$REPO_ROOT/scripts/bump-version.sh" | tail -1)"
fi
echo "Version bumped to $NEW_VERSION"

# ---------------------------------------------------------------------------
# Build
# ---------------------------------------------------------------------------

if [[ $DO_BUILD -eq 1 ]]; then
  echo "Building frontend bundle..."
  bash "$REPO_ROOT/scripts/build.sh"
fi

# ---------------------------------------------------------------------------
# SSH options
# ---------------------------------------------------------------------------

SSH_OPTS=(-4 -p "$HA_DEV_PORT")
if [[ -n "${HA_DEV_SSH_KEY:-}" ]]; then
  dbg "Using SSH key: $HA_DEV_SSH_KEY"
  if [[ ! -f "$HA_DEV_SSH_KEY" ]]; then
    echo "[error] SSH key file not found: $HA_DEV_SSH_KEY" >&2
    exit 1
  fi
  SSH_OPTS+=(-i "$HA_DEV_SSH_KEY")
fi

# macOS $TMPDIR is very long; Unix sockets have a ~104-char path limit.
# Always use /tmp with a short name to stay well under the limit.
CONTROL_DIR="${HA_DEV_SSH_CONTROL_DIR:-$(mktemp -d /tmp/hd-ssh.XXXXXX)}"
CONTROL_PATH="$CONTROL_DIR/s"
SSH_OPTS+=(
  -o "ControlMaster=auto"
  -o "ControlPersist=${HA_DEV_SSH_PERSIST:-10m}"
  -o "ControlPath=$CONTROL_PATH"
)

# Add -v for SSH verbosity when --verbose is set
if [[ $VERBOSE -eq 1 ]]; then
  SSH_OPTS+=(-v)
fi

dbg "Control socket path: $CONTROL_PATH (len=${#CONTROL_PATH})"
dbg "Full SSH options: ${SSH_OPTS[*]}"

REMOTE="${HA_DEV_USER}@${HA_DEV_HOST}"

cleanup() {
  dbg "Closing SSH control socket..."
  ssh "${SSH_OPTS[@]}" -O exit "$REMOTE" >/dev/null 2>&1 || true
  rm -rf "$CONTROL_DIR"
}
trap cleanup EXIT

# ---------------------------------------------------------------------------
# Connectivity check
# ---------------------------------------------------------------------------

echo "Opening shared SSH connection to $REMOTE (port $HA_DEV_PORT)..."
dbg "Running: ssh ${SSH_OPTS[*]} -o BatchMode=no $REMOTE true"
if ! ssh "${SSH_OPTS[@]}" -o "BatchMode=no" -o "ConnectTimeout=10" "$REMOTE" "true"; then
  echo "[error] SSH connection failed." >&2
  echo "[error] Check: host/port reachable? auth key accepted? SSH add-on running?" >&2
  echo "[error] Try manually: ssh -p $HA_DEV_PORT ${HA_DEV_SSH_KEY:+-i $HA_DEV_SSH_KEY} $REMOTE" >&2
  exit 1
fi
dbg "SSH connection established."

# Check control socket was created
if [[ -S "$CONTROL_PATH" ]]; then
  dbg "Control socket created at $CONTROL_PATH"
else
  dbg "WARNING: control socket not found at $CONTROL_PATH after connection"
fi

# ---------------------------------------------------------------------------
# Remote directory check
# ---------------------------------------------------------------------------

echo "Ensuring remote custom_components directory exists..."
REMOTE_PARENT="$(dirname "$HA_DEV_REMOTE_COMPONENT_PATH")"
dbg "Running: ssh ... mkdir -p $REMOTE_PARENT"
if ! ssh "${SSH_OPTS[@]}" "$REMOTE" "mkdir -p \"$REMOTE_PARENT\""; then
  echo "[error] Failed to create remote directory: $REMOTE_PARENT" >&2
  exit 1
fi
dbg "Remote directory ready."

# ---------------------------------------------------------------------------
# Rsync
# ---------------------------------------------------------------------------

RSYNC_ARGS=(-az)
if [[ $VERBOSE -eq 1 ]]; then
  RSYNC_ARGS+=(-v --progress)
fi
if [[ "$HA_DEV_DELETE" == "1" ]]; then
  RSYNC_ARGS+=(--delete)
fi
if [[ $DRY_RUN -eq 1 ]]; then
  RSYNC_ARGS+=(--dry-run)
fi

echo "Syncing custom component to $REMOTE:$HA_DEV_REMOTE_COMPONENT_PATH"

# Pass SSH opts as an array via -e to avoid word-splitting issues.
# We use "${SSH_OPTS[@]}" (array) here, not "${SSH_OPTS[*]}" (string),
# so options with spaces survive correctly.
dbg "rsync args: ${RSYNC_ARGS[*]}"
dbg "rsync -e: ssh ${SSH_OPTS[*]}"

rsync "${RSYNC_ARGS[@]}" \
  -e "ssh $(printf '%q ' "${SSH_OPTS[@]}")" \
  "$REPO_ROOT/custom_components/hass_datapoints/" \
  "$REMOTE:$HA_DEV_REMOTE_COMPONENT_PATH/"

dbg "rsync exit code: $?"

# ---------------------------------------------------------------------------
# Optional restart — auto-detect Docker vs HAOS
# ---------------------------------------------------------------------------

if [[ $DO_RESTART -eq 1 ]]; then
  if [[ -n "${HA_DEV_RESTART_COMMAND:-}" ]]; then
    # Explicit override takes precedence over auto-detection.
    echo "Running remote restart command..."
    ssh "${SSH_OPTS[@]}" "$REMOTE" "$HA_DEV_RESTART_COMMAND"
  elif /usr/local/bin/docker inspect "$HA_DEV_CONTAINER" >/dev/null 2>&1; then
    # Docker container running locally — restart it directly without SSH.
    echo "Detected Docker container ($HA_DEV_CONTAINER) — restarting..."
    /usr/local/bin/docker restart "$HA_DEV_CONTAINER"
  elif ssh "${SSH_OPTS[@]}" "$REMOTE" "command -v ha >/dev/null 2>&1"; then
    # Home Assistant OS / Supervisor — use the ha CLI on the remote.
    echo "Detected Home Assistant OS — running 'ha core restart'..."
    ssh "${SSH_OPTS[@]}" "$REMOTE" "ha core restart"
  else
    echo "[warn] Could not detect HA installation type — skipping restart." >&2
    echo "[warn] Set HA_DEV_RESTART_COMMAND in your .env.dev to specify a restart command." >&2
  fi
fi

echo "Sync complete."
