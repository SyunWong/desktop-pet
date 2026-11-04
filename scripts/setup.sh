#!/bin/bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
command -v node >/dev/null || { echo "Install Node.js 22 or newer first."; exit 1; }
node -e 'if (Number(process.versions.node.split(".")[0]) < 22) process.exit(1)'
command -v pnpm >/dev/null || { echo "Install pnpm: npm install -g pnpm@10.11.0"; exit 1; }
cd "$ROOT/voice"
pnpm install --frozen-lockfile
if [ ! -f .env.local ]; then
  cp env.local.example .env.local
  chmod 600 .env.local
fi
echo "Ready. Optional voice credentials go in voice/.env.local."
echo "On macOS, run ./scripts/run-macos.sh from the project root."
