#!/usr/bin/env bash
#
# Install git hooks from scripts/ into .git/hooks/
#
# Usage:  pnpm hooks:install

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
HOOKS_DIR="$REPO_ROOT/.git/hooks"

ln -sf "../../scripts/pre-commit" "$HOOKS_DIR/pre-commit"
ln -sf "../../scripts/pre-push" "$HOOKS_DIR/pre-push"
chmod +x "$SCRIPT_DIR/pre-commit"
chmod +x "$SCRIPT_DIR/pre-push"

echo "✓ Git hooks installed"
