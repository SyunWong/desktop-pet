# Desktop Pet 🐋

A tiny floating macOS companion who loves rice, chases a foxtail, and talks with you.

| Hang out | Rice frenzy | Foxtail play |
| :---: | :---: | :---: |
| ![Idle desktop pet](docs/media/idle.png) | ![Eating rice with both hands](docs/media/rice.gif) | ![Pouncing on a foxtail](docs/media/foxtail.gif) |

[中文说明](README.zh-CN.md) · [Recipe](docs/RECIPE.md) · [Credits](THIRD_PARTY_NOTICES.md)

## Play together

Drag her title bar to bring her closer, offer a bowl of rice with **Feed Rice**, or choose **Rice Frenzy** to watch her eat with both hands and kick her feet.

Try **Foxtail** to tease her with a draggable grass toy. Hold it nearby for half a second and she pounces. Let her catch it, or pull away mid-jump and watch her miss. These interactions work locally without API credentials.

## Voice chat

Click **Start Chat** to talk with her. The demo connects DeepSeek and Fish Audio through Agora for real-time voice conversation. You can mute your microphone or end the call from the controls below the interaction buttons. See [Voice setup](#voice-setup) to configure your own keys.

## Requirements and quick start

The floating desktop app requires macOS, Apple Command Line Tools, Python 3, Node.js 22+, and pnpm 10. The Swift app is built locally for your Mac. Apple Silicon has been tested; Intel and other macOS versions need validation. A browser preview is also available.

```bash
xcode-select --install
npm install -g pnpm@10.11.0
git clone https://github.com/SyunWong/desktop-pet.git
cd desktop-pet
./scripts/setup.sh
./scripts/run-macos.sh
```

If Command Line Tools are already installed, skip the first command. Pet interactions work without API credentials.

The app starts a local Next.js development server on a random loopback port. Keep the generated app beside the `voice/` directory. Run the build script again after changing your Node installation. This is a source-based developer demo; the app bundle depends on the project directory and installed Node packages.

## Voice setup

The author chose the providers below for this demo. Developers can choose other STT, LLM, and TTS providers supported by their Agora integration, along with their preferred languages, models, and voices.

To reproduce the included configuration, edit `voice/.env.local`, created by setup.

| Variable | Purpose |
| --- | --- |
| `NEXT_PUBLIC_AGORA_APP_ID` | Your Agora project App ID |
| `NEXT_AGORA_APP_CERTIFICATE` | Matching App Certificate, used server-side |
| `DEEPSEEK_API_KEY` | Optional, selects the demo's DeepSeek LLM |
| `FISH_AUDIO_API_KEY` | Optional, selects Fish Audio and the English greeting/persona |

Enable Conversational AI in your Agora project and ensure the configured providers are available to your account. Calls can incur provider charges. Set both optional keys to reproduce the English voice demo. With neither optional key, the code uses Agora-managed OpenAI and MiniMax with a Chinese greeting.

### Demo choices and customization

| Stage | Author’s demo choice | What you can customize |
| --- | --- | --- |
| Speech recognition (STT) | Deepgram `nova-3`, `zh-CN` | Provider, recognition model and input language |
| Conversation (LLM) | DeepSeek `deepseek-flash`, thinking disabled | Provider, model, prompt and generation settings |
| Speech synthesis (TTS) | Fish Audio `s2-pro`, voice reference `091cad5003ed4e90826a92e1fadde278` | Provider, speech model, voice and output language |

Configure these stages in `voice/app/api/invite-agent/route.ts`, using the `.withStt(...)`, `.withLlm(...)`, and `.withTts(...)` sections. To switch providers, update the corresponding SDK provider configuration and its server-side environment variables. Changing models or voices within the same provider may only require updating that provider’s settings. Check support and availability for your account and SDK version.

The included code also ties the English greeting/persona to the presence of a Fish Audio key. When choosing another voice provider or language, update the prompt and greeting in the same file to match.

Start Chat, grant microphone access, speak, then use **End Call** to finish. The macOS shell forwards audio to AVAudioEngine for native playback, including headphones. Browser previews use HTML audio playback.

## Browser preview

```bash
cd voice
pnpm dev --hostname 127.0.0.1
```

Open http://127.0.0.1:3000. The native floating window and native audio bridge are macOS features.

## Development

- `Whale.swift` — floating window, drag handle, local server and native audio bridge.
- `voice/components/Pet.tsx` — eating animations and foxtail interaction.
- `voice/app/globals.css` — pet animation styles.
- `voice/app/api/invite-agent/route.ts` — persona, model, voice and turn detection.
- `voice/components/ConversationComponent.tsx` — RTC/RTM lifecycle and audio playback.
- `scripts/` — setup and local app build.

```bash
cd voice
pnpm typecheck
pnpm verify:api
pnpm build
```

See `docs/VALIDATION.md` for checks and limitations of this source release.

## Troubleshooting

- Startup failed — check `desktop.log`, run setup, and rebuild after a Node path change.
- No microphone — allow access in macOS Privacy & Security, then restart the call.
- No sound — check system output and volume, use **Enable Sound** if shown, and reconnect.
- Voice connection fails — check credentials, Agora feature enablement and provider access.
- Moving the app to another folder breaks startup — keep it beside `voice/`.
- Clone outside protected Desktop/Documents folders to reduce first-run file-access prompts.

## Data and deployment

Voice chat sends microphone audio to Agora and its configured speech/LLM providers. Keys stay in the local server environment. Local animation needs no cloud connection. The sample API routes have no user authentication, so keep the server on loopback; a hosted multi-user version needs authentication and rate limits.

## License and attribution

Project code is MIT licensed. This project derives its voice integration from Agora's official Next.js quickstart. Character artwork comes from the credited upstream pet project. See `THIRD_PARTY_NOTICES.md` and the preserved licenses. This is a community project.
