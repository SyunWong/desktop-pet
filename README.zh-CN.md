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

在 setup 生成的 `voice/.env.local` 填写自己的配置。

- `NEXT_PUBLIC_AGORA_APP_ID` 和 `NEXT_AGORA_APP_CERTIFICATE` 来自同一个 Agora 项目，项目需开通 Conversational AI。
- `DEEPSEEK_API_KEY` 用于 DeepSeek。
- `FISH_AUDIO_API_KEY` 用于 Fish Audio。填好两个可选 key 可复现英文语音版本。
- 不填可选 key 时，代码回退到 Agora 托管的 OpenAI / MiniMax，使用中文开场白。

点 **Start Chat** 并允许麦克风访问。结束时点 **End Call**。语音调用需要网络，服务商可能收费。

当前模型、音色、提示词及识别语言写在 `voice/app/api/invite-agent/route.ts`，可根据自己的账号可用性调整。默认语音识别语言为中文，角色使用 Fish Audio 时用英文回复。

## 浏览器预览

在 `voice/` 运行 `pnpm dev --hostname 127.0.0.1`，访问 http://127.0.0.1:3000。

## 复刻和贡献

项目结构、排障方法和数据说明见 [英文 README](README.md)。可复用的 recipe 说明见 [docs/RECIPE.md](docs/RECIPE.md)。提交前运行类型检查、API 合约验证和构建，验证记录见 [docs/VALIDATION.md](docs/VALIDATION.md)。

请勿提交 `.env.local`、`.agora/`、日志、依赖目录或本机构建的 app。素材和上游代码署名见 [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md)。
