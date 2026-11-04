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

The floating desktop app targets macOS. The current version has been tested on Apple Silicon; Intel and other macOS versions need validation. For other platforms, start with the browser preview.

### 1. Prepare your tools

Install Node.js 22+, Python 3, and Apple Command Line Tools. Check your terminal before proceeding.

```bash
node --version
python3 --version
xcrun --find swiftc
```

If Command Line Tools are missing, run `xcode-select --install` and wait for the installer to finish. If Node.js or Python is missing, install it and reopen your terminal. Then install pnpm.

```bash
npm install -g pnpm@10.11.0
```

### 2. Clone and launch

Run these commands in the directory where you want to keep the project.

```bash
git clone https://github.com/SyunWong/desktop-pet.git
cd desktop-pet
./scripts/setup.sh
./scripts/run-macos.sh
```

Setup installs the locked dependencies and creates `voice/.env.local` if it is missing. The run script builds and opens `Desktop Pet.app`. Expect a small floating character with interaction buttons and **Start Chat**. Try Feed Rice, Rice Frenzy, and a foxtail catch/miss first; these work without API keys. Drag the title to move her and click × to quit.

The app starts a local Next.js development server on a random loopback port. Keep the generated app beside `voice/`. Close the existing window before running the launch script again. Rebuild after changing your Node installation. The app bundle needs this source directory and the installed Node packages to run.

## Voice setup

The author chose the providers below for this demo. Developers can choose other STT, LLM, and TTS providers supported by their Agora integration, along with their preferred languages, models, and voices.

To reproduce the included configuration, open `voice/.env.local` in your editor after running setup. Enter one `NAME=value` per line and keep the file local. Obtain the Agora App ID and matching App Certificate from your project in the Agora Console. Enable Conversational AI for that project. Obtain optional provider keys from your own DeepSeek and Fish Audio accounts.

| Variable | Purpose |
| --- | --- |
| `NEXT_PUBLIC_AGORA_APP_ID` | Your Agora project App ID |
| `NEXT_AGORA_APP_CERTIFICATE` | Matching App Certificate, used server-side |
| `DEEPSEEK_API_KEY` | Optional, selects the demo's DeepSeek LLM |
| `FISH_AUDIO_API_KEY` | Optional, selects Fish Audio and the English greeting/persona |

Ensure the configured providers are available to your account. Calls can incur provider charges. Set both optional keys to reproduce the English voice demo. With neither optional key, the code uses Agora-managed OpenAI and MiniMax with a Chinese greeting.

### Demo choices and customization

| Stage | Author’s demo choice | What you can customize |
| --- | --- | --- |
| Speech recognition (STT) | Deepgram `nova-3`, `zh-CN` | Provider, recognition model and input language |
| Conversation (LLM) | DeepSeek `deepseek-flash`, thinking disabled | Provider, model, prompt and generation settings |
| Speech synthesis (TTS) | Fish Audio `s2-pro`, voice reference `091cad5003ed4e90826a92e1fadde278` | Provider, speech model, voice and output language |

Configure these stages in `voice/app/api/invite-agent/route.ts`, using the `.withStt(...)`, `.withLlm(...)`, and `.withTts(...)` sections. To switch providers, update the corresponding SDK provider configuration and its server-side environment variables. Changing models or voices within the same provider may only require updating that provider’s settings. Check support and availability for your account and SDK version.

The included code also ties the English greeting/persona to the presence of a Fish Audio key. When choosing another voice provider or language, update the prompt and greeting in the same file to match.

After saving your configuration, run the credential-presence check from the repository root.

```bash
cd voice
pnpm doctor
cd ..
```

Doctor checks the local setup and that the two Agora variables have values. A successful call verifies credentials and provider access. Close and reopen the desktop app after changing `.env.local`, then click **Start Chat**, allow microphone access, and speak. Expect an audible greeting and a response to your voice. Try **Mute**, **Unmute**, and **End Call**, then start a second call to verify reconnection. The macOS shell forwards audio to AVAudioEngine for native playback, including headphones. Browser previews use HTML audio playback.

## Browser preview

Run setup first, then run the following from the repository root. Browser preview uses Node.js and pnpm; the Swift build is specific to the macOS desktop window.

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

Run these checks from the repository root. They can run with the blank configuration template.

```bash
cd voice
pnpm typecheck
pnpm verify:api
pnpm build
```

For changes to `Whale.swift`, run `./scripts/build-macos.sh` from the repository root. The front end uses development hot reload; closing and reopening the app loads a newly built native executable. See [validation results](docs/VALIDATION.md) for checks and limitations of this source release.

## Reproduce with your coding assistant

Give your AI access to this repository and paste the following task.

```text
Set up and run this Desktop Pet repository on my machine.
Read README.md, scripts/setup.sh, and scripts/run-macos.sh first.
Check my OS and prerequisites. On macOS, follow the desktop quick start;
on another OS, use the browser preview and report that verification scope.
Run the existing setup script and keep credentials in voice/.env.local.
Start with local rice and foxtail interactions. Confirm the UI loads and
check both catching and missing the grass if browser controls are available.
For voice chat, use my chosen STT/LLM/TTS configuration. Consult the Voice
setup section and invite-agent route before changing providers. Ask me to
enter missing keys locally, and report any unavailable provider access.
After code changes, run the documented checks. Report which startup, UI,
and real-call checks passed and which still need manual verification.
```

For provider changes, look up the selected provider in the installed SDK and its current integration documentation. The customization map and original quickstart provenance are in [the recipe](docs/RECIPE.md).

## Troubleshooting

- Startup failed — check `desktop.log`, run setup, and rebuild after a Node path change.
- No microphone — allow access in macOS Privacy & Security, then restart the call.
- No sound — check system output and volume, use **Enable Sound** if shown, and reconnect.
- Voice connection fails — check credentials, Agora feature enablement and provider access.
- Moving the app to another folder breaks startup — keep it beside `voice/`.
- Clone outside protected Desktop/Documents folders to reduce first-run file-access prompts.

## Data and deployment

Voice chat sends microphone audio to Agora and its configured speech/LLM providers. Keys stay in the local server environment. Local animation needs no cloud connection. The sample API routes have no user authentication, so keep the server on loopback; a hosted multi-user version needs authentication and rate limits.

## Roadmap

Planned directions for future versions, with scope and timing still open.

- **More expressions and reactions** — closed eyes, happy, sleepy, surprised, and richer responses to interaction.
- **More characters** — additional pets and a simpler way to switch character artwork, personalities, and voices.
- **Tasks through conversation** — tell your companion what you want to get done, connect it to tools, and hear progress and results in the same conversation. For example, ask it to summarize a document or organize a set of notes, with confirmation for actions that need it.

Ideas and contributions are welcome through GitHub issues and pull requests. See [Contributing](CONTRIBUTING.md).

## License and attribution

Project code is MIT licensed. This project derives its voice integration from Agora's official Next.js quickstart. Character artwork comes from the credited upstream pet project. See `THIRD_PARTY_NOTICES.md` and the preserved licenses. This is a community project.
