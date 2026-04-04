#!/usr/bin/env bash
# Dev environment check: verifies the HA container is running, sshd is
# accessible, and your SSH key is accepted.

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
ENV_FILE="${HA_DEV_ENV_FILE:-$REPO_ROOT/.env.dev}"

if [[ -f "$ENV_FILE" ]]; then
  # shellcheck disable=SC1090
  source "$ENV_FILE"
fi

SSH_KEY="${HA_DEV_SSH_KEY:-$HOME/.ssh/id_ed25519}"
HA_DEV_HOST="${HA_DEV_HOST:-127.0.0.1}"
HA_DEV_PORT="${HA_DEV_PORT:-2222}"
HA_DEV_USER="${HA_DEV_USER:-root}"
HA_DEV_CONTAINER="${HA_DEV_CONTAINER:-homeassistant}"

echo "Checking HA container ($HA_DEV_CONTAINER)..."
if ! /usr/local/bin/docker inspect "$HA_DEV_CONTAINER" >/dev/null 2>&1; then
  echo "Container '$HA_DEV_CONTAINER' not found. Is it running?" >&2
  exit 1
fi

echo "Ensuring your SSH public key is in the container..."
PUB_KEY="${SSH_KEY}.pub"
if [[ ! -f "$PUB_KEY" ]]; then
  echo "Public key not found: $PUB_KEY" >&2
  exit 1
fi
/usr/local/bin/docker exec "$HA_DEV_CONTAINER" sh -c "mkdir -p /root/.ssh && chmod 700 /root/.ssh"
/usr/local/bin/docker cp "$PUB_KEY" "$HA_DEV_CONTAINER:/tmp/dev_key.pub"
/usr/local/bin/docker exec "$HA_DEV_CONTAINER" sh -c "
  grep -qF \"\$(cat /tmp/dev_key.pub)\" /root/.ssh/authorized_keys 2>/dev/null \
    || cat /tmp/dev_key.pub >> /root/.ssh/authorized_keys
  chmod 600 /root/.ssh/authorized_keys
  rm /tmp/dev_key.pub
"
echo "SSH key installed."

echo "Starting sshd in container..."
SSHD_RUNNING="$(/usr/local/bin/docker exec "$HA_DEV_CONTAINER" sh -c 'pgrep -x sshd >/dev/null 2>&1 && echo yes || echo no')"
if [[ "$SSHD_RUNNING" != "yes" ]]; then
  /usr/local/bin/docker exec -d "$HA_DEV_CONTAINER" /usr/sbin/sshd -D
  sleep 2
fi

echo "Testing SSH connection..."
if ssh -p "$HA_DEV_PORT" -i "$SSH_KEY" \
     -o StrictHostKeyChecking=no \
     -o ConnectTimeout=5 \
     -4 \
     "${HA_DEV_USER}@${HA_DEV_HOST}" echo ok 2>/dev/null; then
  echo "SSH connection: OK"
else
  echo "SSH connection failed. Check docker logs $HA_DEV_CONTAINER" >&2
  exit 1
fi

echo ""
echo "Setup complete. Start the dev watch loop with:"
echo "  pnpm dev:watch"
