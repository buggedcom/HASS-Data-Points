#!/usr/bin/env bash
#
# Build hass-datapoints-cards.js with Vite from the ES module entrypoint.
#
# Usage:  pnpm build             (from repo root)
#         bash scripts/build.sh  (direct fallback)
# Output: custom_components/hass_datapoints/hass-datapoints-cards.js

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
OUT_FILE="$REPO_ROOT/custom_components/hass_datapoints/hass-datapoints-cards.js"
MANIFEST="$REPO_ROOT/custom_components/hass_datapoints/manifest.json"

VERSION="${BUILD_VERSION:-$(python3 -c "import json; print(json.load(open('$MANIFEST'))['version'])")}"

pnpm exec vite build --config "$REPO_ROOT/vite.config.mjs"

sed -i.bak "s/v0\\.3\\.0/v${VERSION}/g" "$OUT_FILE" && rm -f "$OUT_FILE.bak"

echo "✓ Built $OUT_FILE v${VERSION} ($(wc -l < "$OUT_FILE") lines)"
