#!/usr/bin/env bash
#
# Install git hooks from scripts/ into .git/hooks/
#
# Usage:  ./scripts/install-hooks.sh

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
HOOKS_DIR="$REPO_ROOT/.git/hooks"

ln -sf "../../scripts/pre-commit" "$HOOKS_DIR/pre-commit"
chmod +x "$SCRIPT_DIR/pre-commit"

echo "✓ Git hooks installed"

