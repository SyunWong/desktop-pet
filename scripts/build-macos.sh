#!/bin/bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
[ "$(uname -s)" = Darwin ] || { echo "The desktop app requires macOS."; exit 1; }
command -v node >/dev/null || { echo "Install Node.js 22+ first."; exit 1; }
xcrun --find swiftc >/dev/null || { echo "Install Apple Command Line Tools: xcode-select --install"; exit 1; }
[ -f "$ROOT/voice/node_modules/next/dist/bin/next" ] || { echo "Run ./scripts/setup.sh first."; exit 1; }
APP="$ROOT/Desktop Pet.app"
mkdir -p "$APP/Contents/MacOS"
swiftc "$ROOT/Whale.swift" -o "$APP/Contents/MacOS/Whale"
export WHALE_BUILD_APP="$APP"
export WHALE_BUILD_NODE="$(command -v node)"
python3 - <<'PY'
import os, plistlib
from pathlib import Path
info = {
    'CFBundleExecutable': 'Whale',
    'CFBundleIdentifier': 'io.github.syunwong.desktop-pet',
    'CFBundleName': 'Desktop Pet',
    'CFBundleVersion': '1',
    'CFBundleShortVersionString': '0.1.0',
    'CFBundlePackageType': 'APPL',
    'LSUIElement': True,
    'NSAppTransportSecurity': {'NSAllowsLocalNetworking': True},
    'NSMicrophoneUsageDescription': 'Desktop Pet uses the microphone when you start voice chat.',
    'WhaleNode': os.environ['WHALE_BUILD_NODE'],
}
with (Path(os.environ['WHALE_BUILD_APP']) / 'Contents/Info.plist').open('wb') as f:
    plistlib.dump(info, f)
PY
codesign --force --sign - "$APP"
echo "Built $APP"
