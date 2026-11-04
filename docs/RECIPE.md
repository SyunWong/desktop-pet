# Recipe — macOS voice companion

Status: reproducible demo candidate. This document is packaged with the standalone project for a future recipe contribution.

## Outcome

A transparent floating macOS companion with local pointer interactions and real-time voice conversation through Agora. The front end runs in WKWebView; Swift forwards remote PCM audio to AVAudioEngine.

## Ingredients

- Official Agora Next.js quickstart, base commit `e25a5d5b68fccd990d77d86292770acad397ff15`.
- Swift Cocoa + WebKit + AVFoundation desktop shell.
- React/CSS/SVG pet animation layer.
- Agora project with Conversational AI enabled.
- Optional DeepSeek and Fish Audio keys.

## Reproduction

1. Follow the root README setup and run scripts.
2. Without keys, verify rice, frenzy and foxtail catch/miss.
3. Set the voice credentials in `voice/.env.local`.
4. Start a call, allow the microphone and verify both speaking and listening.
5. Test headphones, mute/unmute, interruption, ending and restarting a call.
6. Retain the upstream licenses and asset notices when copying the project.

## Customization map

| Feature | Files |
| --- | --- |
| Character art | `voice/public/whale.png` |
| Rice, kicking, foxtail | `voice/components/Pet.tsx`, `voice/app/globals.css` |
| Name and visible text | `Whale.swift`, `Pet.tsx`, `LandingPage.tsx`, `ConversationComponent.tsx` |
| Personality and language | `voice/app/api/invite-agent/route.ts` |
| STT/LLM/TTS configuration | `voice/app/api/invite-agent/route.ts` |
| Native PCM playback | `Whale.swift`, `voice/components/ConversationComponent.tsx` |

Animations are aligned to this character's image coordinates. Replacing the image requires adjusting the mouth, sleeves and foot masks.

## Integration details

The original token/invite/stop routes and RTC/RTM lifecycle are retained. The pet reacts to conversation state through its `action` prop. The desktop host accepts audio messages only from its loopback origin and main frame. A browser uses the HTML audio path.

The author’s STT/LLM/TTS choices, optional-key fallbacks and STT language are documented in the README. Developers can replace each provider through its SDK configuration and server-side credentials, and align the prompt and greeting with the selected language. The native app launches a development server and requires the source tree and Node installation on the local machine.

## Contribution scope

A future recipe submission can reference this repository, the base commit, the changes above, and `VALIDATION.md`. Adapt to the destination repository's contribution template when it is selected.
