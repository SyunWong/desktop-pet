# Desktop Pet / 桌宠

可以拖动、喂米饭、疯狂炫饭、逗狗尾巴草，还能实时语音聊天的 macOS 桌宠。

| 待机陪伴 | 疯狂炫饭 | 狗尾巴草 |
| :---: | :---: | :---: |
| ![待机的桌宠](docs/media/idle.png) | ![双手炫米饭](docs/media/rice.gif) | ![扑向狗尾巴草](docs/media/foxtail.gif) |

## 和她互动

拖动顶部名字，把她挪到身边。点 **Feed Rice** 喂一碗米饭，或者点 **Rice Frenzy**，看她两手疯狂炫饭、脚脚乱蹬。

点 **Foxtail**，就能拖动狗尾巴草逗她玩。草尖在面前停半秒，她会起扑；你可以等她抓住，也可以在她跳起来时抽走，让她扑空。这些互动无需 API 密钥。

## 语音聊天

点互动按钮下面的 **Start Chat** 就能和她说话，也可以静音或挂断。语音由 Agora 连接 DeepSeek 和 Fish Audio，填写自己的密钥后即可体验，配置方法见下方。

## 安装运行

需要 macOS、Apple Command Line Tools、Python 3、Node.js 22+ 和 pnpm 10。目前在 Apple Silicon Mac 上验证过，Intel Mac 尚未验证。

```bash
xcode-select --install
npm install -g pnpm@10.11.0
git clone https://github.com/SyunWong/desktop-pet.git
cd desktop-pet
./scripts/setup.sh
./scripts/run-macos.sh
```

已经安装 Command Line Tools 可以跳过第一步。吃饭和玩草无需密钥。程序会在项目旁生成 `Desktop Pet.app`，并启动本地 Next.js 开发服务器。请保持 app 与 `voice/` 在同一个目录，Node 路径变化后重新运行构建脚本。

## 语音配置

下面的 STT、LLM 和 TTS 是作者录制 demo 时的个人选择。开发者可以选择自己的 Agora 集成支持的其他服务商，并按需求调整识别语言、模型和音色。

如果要复现当前 demo，在 setup 生成的 `voice/.env.local` 填写自己的配置。

- `NEXT_PUBLIC_AGORA_APP_ID` 和 `NEXT_AGORA_APP_CERTIFICATE` 来自同一个 Agora 项目，项目需开通 Conversational AI。
- `DEEPSEEK_API_KEY` 用于 DeepSeek。
- `FISH_AUDIO_API_KEY` 用于 Fish Audio。填好两个可选 key 可复现英文语音版本。
- 不填可选 key 时，代码回退到 Agora 托管的 OpenAI / MiniMax，使用中文开场白。

点 **Start Chat** 并允许麦克风访问。结束时点 **End Call**。语音调用需要网络，服务商可能收费。

### Demo 配置与替换位置

| 环节 | 作者的 demo 选择 | 可调整内容 |
| --- | --- | --- |
| 语音识别 STT | Deepgram `nova-3`，`zh-CN` | 服务商、识别模型、输入语言 |
| 对话模型 LLM | DeepSeek `deepseek-flash`，关闭 thinking | 服务商、模型、提示词、生成参数 |
| 语音合成 TTS | Fish Audio `s2-pro`，示例音色 | 服务商、语音模型、音色、输出语言 |

在 `voice/app/api/invite-agent/route.ts` 的 `.withStt(...)`、`.withLlm(...)` 和 `.withTts(...)` 中修改对应配置。更换服务商时，需要同步修改 SDK provider 配置和服务端环境变量；同一服务商内换模型或音色，可调整对应参数。具体可用范围以你的账号及 SDK 版本支持情况为准。

当前代码会在存在 Fish Audio key 时启用英文提示词和开场白。换成其他语音服务商或语言时，也请在同一文件中调整提示词和开场白。

## 浏览器预览

在 `voice/` 运行 `pnpm dev --hostname 127.0.0.1`，访问 http://127.0.0.1:3000。

## 复刻和贡献

项目结构、排障方法和数据说明见 [英文 README](README.md)。可复用的 recipe 说明见 [docs/RECIPE.md](docs/RECIPE.md)。提交前运行类型检查、API 合约验证和构建，验证记录见 [docs/VALIDATION.md](docs/VALIDATION.md)。

请勿提交 `.env.local`、`.agora/`、日志、依赖目录或本机构建的 app。素材和上游代码署名见 [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md)。
