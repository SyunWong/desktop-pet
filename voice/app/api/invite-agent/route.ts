import { NextRequest, NextResponse } from 'next/server';
import {
  AgoraClient,
  Agent,
  Area,
  DeepgramSTT,
  CustomLLM,
  FishAudioTTS,
  ExpiresIn,
  MiniMaxTTS,
  OpenAI,
} from 'agora-agents';
import { ClientStartRequest, AgentResponse } from '@/types/conversation';
import { DEFAULT_AGENT_UID } from '@/lib/agora';

// System prompt that defines the agent's personality and behavior.
// Swap this out to change what the agent talks about.
const PET_SYSTEM_PROMPT = '你的名字是大肥鱼，英文自称 DeepSeek-chan。你是一位爱吃白饭和鱼片、喜欢冰奶茶的桌面伙伴。用自然的中文口语回复，每次一两句，不使用表情、括号或 Markdown。';
const GREETING = '嗨，我是大肥鱼！今天想聊什么呀？';

// agentUid identifies the AI in the RTC channel and shares its default with the client.
const agentUid = String(DEFAULT_AGENT_UID);

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing required environment variable: ${name}`);
  return value;
}

export async function POST(request: NextRequest) {
  try {
    // --- 1. Parse request ---

    const body: ClientStartRequest = await request.json();
    const { requester_id, channel_name } = body;

    // Validate required env vars on first request so misconfiguration surfaces
    // with a clear error message rather than a silent failure.
    const appId = requireEnv('NEXT_PUBLIC_AGORA_APP_ID');
    const appCertificate = requireEnv('NEXT_AGORA_APP_CERTIFICATE');

    if (!channel_name || !requester_id) {
      return NextResponse.json(
        { error: 'channel_name and requester_id are required' },
        { status: 400 },
      );
    }

    // --- 2. Build and start the agent ---

    // AgoraClient authenticates API calls to the Agora Conversational AI service.
    // area: change to Area.EU or Area.AP for European or Asia-Pacific deployments.
    const client = new AgoraClient({
      area: Area.US,
      appId,
      appCertificate,
    });

    const deepseekKey = process.env.DEEPSEEK_API_KEY?.trim();
    const fishKey = process.env.FISH_AUDIO_API_KEY?.trim();
    const useGigi = Boolean(fishKey);
    const greeting = useGigi ? "Hey, it's DeepSeek-chan! Did you bring me a bowl of rice?" : GREETING;
    const agent = new Agent({
      client,
      instructions: useGigi ? PET_SYSTEM_PROMPT.replace("用自然的中文口语回复", "听懂中文，用自然俏皮的英语口语回复") : PET_SYSTEM_PROMPT,
      greeting,
      failureMessage: 'Please wait a moment.',
      maxHistory: 50,
      // VAD controls how the agent detects the start and end of a user's turn.
      turnDetection: {
        config: {
          speech_threshold: 0.5,
          start_of_speech: {
            mode: 'vad',
            vad_config: {
              interrupt_duration_ms: 160, // ms of speech before interruption triggers
              prefix_padding_ms: 300, // audio captured before speech is detected
            },
          },
          end_of_speech: {
            mode: 'vad',
            vad_config: {
              silence_duration_ms: 480, // ms of silence before turn ends
            },
          },
        },
      },
      // RTM is required for transcript events in the browser client.
      // enable_tools is required for MCP tool invocation.
      advancedFeatures: { enable_rtm: true, enable_tools: true },
      // Required for browser RTM events:
      // - data_channel: 'rtm' enables RTM delivery path for state/metrics/errors
      // - enable_error_message emits AGENT_ERROR payloads
      // - enable_metrics emits AGENT_METRICS latency payloads
      parameters: {
        // web client → ultra-low-latency chorus profile
        audio_scenario: 'chorus',
        data_channel: 'rtm',
        enable_error_message: true,
        enable_metrics: true,
      },
    })
      .withStt(
        new DeepgramSTT({
          model: 'nova-3',
          language: 'zh-CN',
        }),
        // BYOK: uncomment the following block and set NEXT_DEEPGRAM_API_KEY
        // new DeepgramSTT({
        //   apiKey: requireEnv('NEXT_DEEPGRAM_API_KEY'),
        //   model: 'nova-3',
        //   language: 'zh-CN',
        // }),
      )
      .withLlm(deepseekKey
        ? new CustomLLM({
            url: 'https://api.deepseek.com/chat/completions',
            apiKey: deepseekKey,
            model: 'deepseek-flash',
            greetingMessage: greeting,
            maxHistory: 15,
            params: { thinking: { type: 'disabled' }, max_tokens: 160 },
          })
        : new OpenAI({ model: 'gpt-4o-mini', greetingMessage: greeting, maxHistory: 15 }))
      .withTts(fishKey
        ? new FishAudioTTS({
            key: fishKey,
            referenceId: '091cad5003ed4e90826a92e1fadde278',
            backend: 's2-pro',
          })
        : new MiniMaxTTS({ model: 'speech_2_6_turbo', voiceId: 'Chinese (Mandarin)_Warm_Girl' }));

    // remoteUids restricts the agent to only process audio from this user
    const session = agent.createSession({
      channel: channel_name,
      agentUid,
      remoteUids: [requester_id],
      idleTimeout: 30,
      expiresIn: ExpiresIn.hours(1),
      debug: false, // enable debug to show restful API calls in the console
    });

    const agentId = await session.start();

    return NextResponse.json({
      agent_id: agentId,
      create_ts: Math.floor(Date.now() / 1000),
      state: 'RUNNING',
    } as AgentResponse);
  } catch (error) {
    console.error('Error starting conversation:', error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : 'Failed to start conversation',
      },
      { status: 500 },
    );
  }
}
