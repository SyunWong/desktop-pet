# Contributing

Run setup and follow the root README. Describe the visible behavior changed and how you tested it.

For UI changes, check the 228 × 251 desktop viewport, rice/frenzy completion, grass catch/miss, and switching activities. For voice changes, also test start, mute/unmute, interrupt, end, restart, and headphones on macOS.

Run `pnpm typecheck`, `pnpm verify:api`, and `pnpm build` inside `voice/`. Run `./scripts/build-macos.sh` for Swift changes. Include any lint findings and validation limits in your pull request.

Keep keys, logs, `.agora/`, dependencies and built app bundles out of commits. Preserve upstream licenses and update attribution when adding artwork. Update the README and recipe if setup or user-facing behavior changes.
