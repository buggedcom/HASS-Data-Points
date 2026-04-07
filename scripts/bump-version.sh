#!/usr/bin/env bash
# bump-version.sh — Increment the patch segment of the version in
#   custom_components/hass_datapoints/manifest.json  (canonical source)
#   package.json                                      (kept in sync)
#
# Usage: bash scripts/bump-version.sh [--dry-run]
#
# Reads the current version from manifest.json, bumps the PATCH component by 1,
# and writes the new version back to both files.  Prints the new version string
# to stdout so callers can capture it.

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

MANIFEST="$REPO_ROOT/custom_components/hass_datapoints/manifest.json"
PACKAGE="$REPO_ROOT/package.json"

DRY_RUN=0
while [[ $# -gt 0 ]]; do
  case "$1" in
    --dry-run) DRY_RUN=1 ;;
    *) echo "Unknown argument: $1" >&2; exit 1 ;;
  esac
  shift
done

# ---------------------------------------------------------------------------
# Read current version from manifest.json (canonical)
# ---------------------------------------------------------------------------

CURRENT_VERSION="$(node -e "process.stdout.write(require('$MANIFEST').version)")"

# Split into MAJOR.MINOR.PATCH
IFS='.' read -r MAJOR MINOR PATCH <<< "$CURRENT_VERSION"

if [[ -z "$MAJOR" || -z "$MINOR" || -z "$PATCH" ]]; then
  echo "[bump-version] Could not parse version '$CURRENT_VERSION' from manifest.json" >&2
  exit 1
fi

NEW_PATCH=$(( PATCH + 1 ))
NEW_VERSION="${MAJOR}.${MINOR}.${NEW_PATCH}"

echo "[bump-version] $CURRENT_VERSION → $NEW_VERSION"

if [[ $DRY_RUN -eq 1 ]]; then
  echo "[bump-version] Dry run — no files written."
  echo "$NEW_VERSION"
  exit 0
fi

# ---------------------------------------------------------------------------
# Write new version to manifest.json
# ---------------------------------------------------------------------------

node - "$MANIFEST" "$NEW_VERSION" <<'EOF'
const fs = require("fs");
const [, , file, version] = process.argv;
const data = JSON.parse(fs.readFileSync(file, "utf8"));
data.version = version;
fs.writeFileSync(file, JSON.stringify(data, null, 2) + "\n");
EOF

# ---------------------------------------------------------------------------
# Write new version to package.json
# ---------------------------------------------------------------------------

node - "$PACKAGE" "$NEW_VERSION" <<'EOF'
const fs = require("fs");
const [, , file, version] = process.argv;
const data = JSON.parse(fs.readFileSync(file, "utf8"));
data.version = version;
fs.writeFileSync(file, JSON.stringify(data, null, 2) + "\n");
EOF

echo "$NEW_VERSION"
