# Validation — 2026-11-04

Checked on the author's Apple Silicon Mac with Node.js 22 and pnpm 10.11.0.

| Check | Result |
| --- | --- |
| Fresh standalone directory, locked dependency install via setup script | Passed |
| Blank credential template creation | Passed |
| TypeScript `pnpm typecheck` | Passed |
| Mocked API contract checks `pnpm verify:api` | Passed |
| Next.js production build `pnpm build` | Passed |
| ESLint | 0 errors, 15 warnings (unused quickstart UI symbols and plain image tags) |
| Swift build, generated local plist and ad-hoc signing | Passed; two AVAudioEngine deprecation warnings on macOS 27 SDK |
| Native app launch and local server readiness | Passed |
| Browser pointer interaction at desktop size, catch and miss | Passed |
| Source scan for the author's credential values and personal absolute paths | Passed |

The original working desktop app was tested in a real conversation, including AirPods playback. This packaging pass uses a blank environment template and does not place another paid call. API contract tests mock service responses and do not prove provider availability for a new account.

Intel Macs, Windows/Linux desktop shells, other macOS versions, and another user's cloud account have not been verified. The package contains source and build scripts, not a notarized standalone installer. Setup and chat require network access; animations run locally after setup.
