# Desktop Pet / 桌宠

可以拖动、喂米饭、疯狂炫饭、逗狗尾巴草，还能实时语音聊天的 macOS 桌宠。

| 待机陪伴 | 吃米饭 | 铁盆炫饭 | 狗尾巴草 | 睡觉与唤醒 |
| :---: | :---: | :---: | :---: | :---: |
| ![待机](docs/media/idle-v2.png) | ![吃米饭](docs/media/feed-rice-v2.gif) | ![铁盆炫饭](docs/media/rice-frenzy-v2.gif) | ![狗尾巴草](docs/media/foxtail-v2.gif) | ![睡觉](docs/media/sleep-v2.gif) |

## 和她互动

拖动顶部名字，把她挪到身边。点 **Feed Rice** 喂一碗米饭，或者点 **Rice Frenzy**，看她两手疯狂炫饭、脚脚乱蹬。

点 **Foxtail**，就能拖动狗尾巴草逗她玩。草尖在面前停半秒，她会起扑；你可以等她抓住，也可以在她跳起来时抽走，让她扑空。这些互动无需 API 密钥。

点 **Sleep**，她会先犯困，再挪到一旁睡觉；点她或 **Wake up** 可以叫醒，喂饭或逗草也会立即唤醒。桌宠窗口内 5 分钟没有互动后会自动睡觉，语音通话期间不会入睡。

## 语音聊天

点互动按钮下面的 **Start Chat** 就能和她说话，也可以静音或挂断。语音由 Agora 连接 DeepSeek 和 Fish Audio，填写自己的密钥后即可体验，配置方法见下方。

## 安装运行

桌面悬浮窗口面向 macOS，目前在 Apple Silicon 上验证过。Intel 和其他 macOS 版本还需要验证；其他系统可以先尝试浏览器预览。

### 1. 准备工具

安装 Node.js 22+、Python 3 和 Apple Command Line Tools，然后在终端检查。

```bash
node --version
python3 --version
xcrun --find swiftc
```

如果缺少 Command Line Tools，运行 `xcode-select --install`，等待安装完成后继续。缺少 Node.js 或 Python 时先安装，再重新打开终端。接着安装 pnpm。

```bash
npm install -g pnpm@10.11.0
```

### 2. 克隆并启动

在你想保存项目的目录运行。

```bash
git clone https://github.com/SyunWong/desktop-pet.git
cd desktop-pet
./scripts/setup.sh
./scripts/run-macos.sh
```

Setup 安装锁定版本的依赖，并在缺少配置文件时创建 `voice/.env.local`。启动脚本会编译并打开 `Desktop Pet.app`。你应该看到悬浮角色、互动按钮和 **Start Chat**。先尝试喂饭、炫饭、狗尾巴草的抓住和扑空，这些无需 API 密钥。拖动标题移动窗口，点 × 退出。

构建脚本会先将网页编译到 `voice/.next-desktop/`，再构建桌面 app。app 启动本地 Next.js 生产服务器，桌宠窗口不会显示开发模式的 Issues 提示。请保持 app 与 `voice/` 在同一个目录；再次运行启动脚本前先关闭旧窗口。修改源码、`voice/.env.local` 或 Node 路径后，请重新构建。运行 app 需要保留源码目录和已安装的 Node 依赖。

## 语音配置

下面的 STT、LLM 和 TTS 是作者录制 demo 时的个人选择。开发者可以选择自己的 Agora 集成支持的其他服务商，并按需求调整识别语言、模型和音色。

### 通过 Agora CLI 配置项目

运行 setup 后，使用 [Agora CLI](https://github.com/AgoraIO/cli) 选择项目并写入凭据，无需从 Console 手动复制 App ID 或 App Certificate。本仓库属于自定义应用，使用 `agora project env write` 指定 Next.js 变量名和文件路径。

尚未安装 CLI 时，在 macOS/Linux 上运行：

```bash
curl -fsSL https://dl.agora.io/cli/install.sh | sh
```

检查安装状态，再登录本例 `Area.US` 配置对应的国际站：

```bash
agora version
agora doctor --json
agora login --region global
agora project list --refresh-cache
```

以下命令已核对 CLI 0.2.9 的命令帮助。如果当前版本不支持 `project env write --template`，请先按官方安装说明更新 CLI。

从列表中选择已有项目；如果需要新项目，先通过 CLI 创建：

```bash
agora project create desktop-pet --feature rtc --feature convoai
```

在**仓库根目录**执行以下命令，将 `YOUR_PROJECT_ID_OR_NAME` 替换为所选项目的 ID 或完整名称：

```bash
agora project use "YOUR_PROJECT_ID_OR_NAME"
agora project feature enable convoai "YOUR_PROJECT_ID_OR_NAME"
agora project env write voice/.env.local --template nextjs --project "YOUR_PROJECT_ID_OR_NAME"
agora project doctor --feature convoai
```

显式传入 `--project`，可以避免仓库已有的本地绑定指向其他项目。CLI 将两项 Agora 凭据写入 `voice/.env.local`，并在 `.agora/project.json` 记录项目绑定。两份文件仅保留在本地。切换项目或刷新凭据时，再执行同一条 env-write 命令。不要加 `--overwrite`，默认更新会保留其他配置，包括已有服务商密钥。

### 可选服务商密钥

如需复现 DeepSeek 和 Fish Audio demo，用编辑器打开 `voice/.env.local`，按每行 `NAME=value` 填入这两个服务商的密钥。Agora 凭据由 CLI 管理。

- `NEXT_PUBLIC_AGORA_APP_ID` 和 `NEXT_AGORA_APP_CERTIFICATE` 由 CLI 从同一个 Agora 项目写入，项目需开通 Conversational AI。
- `DEEPSEEK_API_KEY` 用于 DeepSeek。
- `FISH_AUDIO_API_KEY` 用于 Fish Audio。填好两个可选 key 可复现英文语音版本。
- 不填可选 key 时，代码回退到 Agora 托管的 OpenAI / MiniMax，使用中文开场白。

保存配置后，从仓库根目录运行本地配置检查。

```bash
cd voice
pnpm doctor
cd ..
```

Doctor 检查本地环境和两项 Agora 变量是否已填写。密钥有效性和服务商访问权限需要通过实际通话确认。修改 `.env.local` 后，先关闭桌宠、运行 `./scripts/build-macos.sh` 重新构建，再打开桌宠，点 **Start Chat**，允许麦克风访问。应该能听到开场白，并在说话后收到回应。试一下静音、取消静音、挂断，再发起一次通话，确认能重新连接。语音调用需要网络，服务商可能收费。

### Demo 配置与替换位置

| 环节 | 作者的 demo 选择 | 可调整内容 |
| --- | --- | --- |
| 语音识别 STT | Deepgram `nova-3`，`zh-CN` | 服务商、识别模型、输入语言 |
| 对话模型 LLM | DeepSeek `deepseek-flash`，关闭 thinking | 服务商、模型、提示词、生成参数 |
| 语音合成 TTS | Fish Audio `s2-pro`，示例音色 | 服务商、语音模型、音色、输出语言 |

`voice/app/api/invite-agent/route.ts` 中的 `PET_SYSTEM_PROMPT` 定义桌宠性格，它是普通应用变量，不是 SDK 特殊名称。在该文件的 `.withStt(...)`、`.withLlm(...)` 和 `.withTts(...)` 中修改对应配置。更换服务商时，需要同步修改 SDK provider 配置和服务端环境变量；同一服务商内换模型或音色，可调整对应参数。具体可用范围以你的账号及 SDK 版本支持情况为准。

当前代码会在存在 Fish Audio key 时启用英文提示词和开场白。换成其他语音服务商或语言时，也请在同一文件中调整提示词和开场白。

## 浏览器预览

先运行 setup，再从仓库根目录运行以下命令。浏览器预览需要 Node.js 和 pnpm，Swift 构建用于 macOS 桌面窗口。

```bash
cd voice
pnpm dev --hostname 127.0.0.1
```

访问 http://127.0.0.1:3000。

## 让你的 AI 帮你复刻

让编程助手访问这个仓库，复制下面这段任务给它。

```text
请在我的电脑上安装并运行 Desktop Pet 仓库。
先读 README.zh-CN.md、scripts/setup.sh 和 scripts/run-macos.sh。
检查系统和依赖。macOS 按桌面安装步骤运行；其他系统先用浏览器预览，
并说明实际验证的平台和范围。使用项目现有 setup 脚本，密钥保存在
voice/.env.local 中。按 README 的 CLI 流程绑定 Agora 项目，使用
agora project env write 和 --template nextjs 写入 Agora 凭据。先验证喂饭、炫饭和玩草；能操作浏览器时，
检查狗尾巴草的抓住和扑空两种结果。
语音部分按我选择的 STT、LLM、TTS 配置。换服务商前阅读语音配置说明
及 invite-agent 路由。缺少第三方服务商密钥时让我在本地填写，服务商不可用时如实说明。
改代码后运行文档中的检查。最后列出已验证的启动、互动、真实通话结果，
以及还需要我手动确认的部分。
```

## 开发验证与排障

从仓库根目录运行以下检查，使用空白配置模板也可以执行。

```bash
cd voice
pnpm typecheck
pnpm verify:api
node scripts/verify-rtm-lifecycle.mjs
pnpm build:desktop
```

修改源码或配置后，先关闭 app，在仓库根目录运行 `./scripts/build-macos.sh`，再重新打开；脚本会重建网页和桌面程序。浏览器开发仍可使用 `pnpm dev` 热更新，其 `.next/` 目录与桌宠构建分开。文件职责和服务商配置入口见 [Recipe](docs/RECIPE.md)。替换角色图片后，还需要调整嘴、袖子、脚部遮罩等动画坐标。

- 启动失败时查看 `desktop.log`，确认 setup 已完成，Node 路径改变后重新构建。
- 麦克风无声时检查 macOS 隐私设置，再重新发起通话。
- 听不到声音时检查系统输出设备和音量，出现 **Enable Sound** 时点它。
- 聊天连接失败时检查两项 Agora 配置、Conversational AI 开通状态和服务商权限。

语音会传给 Agora 及配置的服务商，密钥保存在本地服务端环境中。示例 API 没有用户认证，请保持本地回环访问；对外部署需要补上鉴权和限流。

## 后续计划

以下是未来版本的探索方向，具体范围和时间还在规划中。

- **更多表情和反馈**：闭眼、开心、困倦、惊讶，以及更丰富的互动反应。
- **更多角色**：增加新角色，让形象、性格和音色更容易切换。
- **通过聊天交办任务**：直接告诉桌宠你想做什么，接入工具后，在同一段对话里听到进展和结果。例如总结文档、整理笔记，需要确认的操作由用户确认后执行。

欢迎通过 GitHub issue 和 PR 提想法或贡献，参见 [贡献说明](CONTRIBUTING.md)。

## 复刻和贡献

项目结构、排障方法和数据说明见 [英文 README](README.md)。可复用的 recipe 说明见 [docs/RECIPE.md](docs/RECIPE.md)。提交前运行类型检查、API 合约验证和构建，验证记录见 [docs/VALIDATION.md](docs/VALIDATION.md)。

请勿提交 `.env.local`、`.agora/`、日志、依赖目录或本机构建的 app。素材和上游代码署名见 [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md)。

### 桌面报错提示

桌宠如果出现红色 Issues 角标，说明运行的是 Next.js 开发模式，请重新构建并打开新版 app。真实的语音错误仍会显示在桌宠状态栏；可以点击收起提示，无法聊天时结束后重试。聊天初始化失败时会清理已创建的 RTM 连接，避免每次重试残留连接。
