#!/bin/bash

# setup-worktree.sh
# Sets up a worktree with specs repo cloned and gitignored.
# Run this after creating a worktree from the bare clone.

set -e

SPECS_REPO="git@github.com:context-engine/v0-docs.git"
SPECS_DIR="specs"

# Check if we're in a worktree (not a bare clone)
if git rev-parse --is-bare-repository 2>/dev/null | grep -q "true"; then
    echo "❌ Error: This script must be run from a worktree, not the bare clone."
    echo ""
    echo "Usage:"
    echo "  1. Create a worktree from the bare clone:"
    echo "     git worktree add <path> -b <branch-name>"
    echo ""
    echo "  2. Change to the worktree directory:"
    echo "     cd <path>"
    echo ""
    echo "  3. Run this script:"
    echo "     ./scripts/setup-worktree.sh"
    exit 1
fi

# Check if we're in a git repository
if ! git rev-parse --git-dir > /dev/null 2>&1; then
    echo "❌ Error: Not in a git repository."
    exit 1
fi

echo "📦 Setting up worktree..."
echo ""

# Clone specs repo if not present
if [ ! -d "$SPECS_DIR" ]; then
    echo "📥 Cloning specs repo..."
    git clone "$SPECS_REPO" "$SPECS_DIR"
else
    echo "✅ Specs directory already exists."
    echo "   To update: cd $SPECS_DIR && git pull"
fi

# Add specs/ to .gitignore if not already present
if ! grep -q "^${SPECS_DIR}/$" .gitignore 2>/dev/null; then
    echo "📝 Adding $SPECS_DIR/ to .gitignore..."
    echo "${SPECS_DIR}/" >> .gitignore
else
    echo "✅ $SPECS_DIR/ already in .gitignore"
fi

# Install dependencies if package.json exists
if [ -f "package.json" ]; then
    echo "📦 Installing dependencies..."
    if command -v bun &> /dev/null; then
        bun install
    elif command -v npm &> /dev/null; then
        npm install
    else
        echo "⚠️  Neither bun nor npm found. Skipping dependency installation."
    fi
fi

echo ""
echo "✅ Worktree setup complete!"
echo ""
echo "Specs available at: $(pwd)/$SPECS_DIR"
echo ""
echo "You can find architecture docs at:"
echo "  $SPECS_DIR/say2/3-how/multi-protocols/say2/specs/v1/02-architecture/"
echo ""
