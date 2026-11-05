'use client';

import { useState, useRef, Suspense, useEffect, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { Pet } from './Pet';
import type { RTMClient } from 'agora-rtm';
import type {
  AgoraTokenData,
  AgoraRenewalTokens,
} from '../types/conversation';
import { ErrorBoundary } from './ErrorBoundary';


// Dynamically import the ConversationComponent with ssr disabled
const ConversationComponent = dynamic(() => import('./ConversationComponent'), {
  ssr: false,
});

// Dynamically import AgoraRTCProvider (browser-only).
// The AgoraVoiceAI toolkit is initialized inside ConversationComponent after
// the RTC join succeeds, so this wrapper only needs to provide the RTC client.
const AgoraProvider = dynamic(
  async () => {
    const { AgoraRTCProvider, default: AgoraRTC } =
      await import('agora-rtc-react');
    return {
      default: function AgoraProviders({
        children,
      }: {
        children: React.ReactNode;
      }) {
        // useRef persists across StrictMode's simulated unmount/remount, so only
        // one RTC client is ever created per session (useMemo creates two in StrictMode).
        const clientRef = useRef<ReturnType<
          typeof AgoraRTC.createClient
        > | null>(null);
        if (!clientRef.current) {
          clientRef.current = AgoraRTC.createClient({
            mode: 'rtc',
            codec: 'vp8',
          });
        }
        return (
          <AgoraRTCProvider client={clientRef.current}>
            {children}
          </AgoraRTCProvider>
        );
      },
    };
  },
  { ssr: false },
);

export default function LandingPage() {
  const [showConversation, setShowConversation] = useState(false);

  // Preload heavy modules on mount so they're already cached when the user
  // clicks "Try it Now" — eliminates the ~1.8s dynamic-import delay.
  useEffect(() => {
    import('agora-rtc-react').catch(() => {});
    import('agora-rtm').catch(() => {});
  }, []);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [agoraData, setAgoraData] = useState<AgoraTokenData | null>(null);
  const [rtmClient, setRtmClient] = useState<RTMClient | null>(null);

  const activeRtm = useRef<RTMClient | null>(null);
  const starting = useRef(false);
  const mounted = useRef(false);
  const generation = useRef(0);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      generation.current += 1;
      starting.current = false;
      const rtm = activeRtm.current;
      activeRtm.current = null;
      void rtm?.logout().catch(() => console.warn('Could not close RTM connection'));
    };
  }, []);

  const handleStartConversation = async () => {
    // State updates do not synchronously disable the button: guard rapid clicks too.
    if (starting.current || activeRtm.current || !mounted.current) return;
    starting.current = true;
    const attempt = ++generation.current;
    const isCurrent = () => mounted.current && generation.current === attempt;
    let rtm: RTMClient | null = null;
    let connected = false;
    setIsLoading(true);
    setError(null);

    try {
      // 1. Fetch RTC token + channel
      // console.log('Fetching Agora token...');
      const agoraResponse = await fetch('/api/generate-agora-token');
      const responseData = await agoraResponse.json();
      // console.log('Agora token response: uid =', responseData.uid, 'channel =', responseData.channel);

      if (!agoraResponse.ok) {
        throw new Error(
          `Failed to generate Agora token: ${JSON.stringify(responseData)}`,
        );
      }

      if (!isCurrent()) return;
      const { default: AgoraRTM } = await import('agora-rtm');
      if (!isCurrent()) return;
      rtm = new AgoraRTM.RTM(process.env.NEXT_PUBLIC_AGORA_APP_ID!, responseData.uid);
      activeRtm.current = rtm;
      await rtm.login({ token: responseData.token });
      if (!isCurrent()) return;
      await rtm.subscribe(responseData.channel);
      if (!isCurrent()) return;
      connected = true;
      setRtmClient(rtm);
      setAgoraData(responseData);
      setShowConversation(true);
    } catch (err) {
      if (isCurrent()) {
        setError('Could not start the chat. Please try again.');
        console.warn('Voice chat startup failed:', err);
      }
    } finally {
      // A late login must also be logged out after unmount/cancellation.
      if (!connected && rtm) {
        if (activeRtm.current === rtm) activeRtm.current = null;
        await rtm.logout().catch(() => console.warn('Could not close failed RTM connection'));
      }
      if (isCurrent()) {
        starting.current = false;
        setIsLoading(false);
      }
    }
  };

  const handleTokenWillExpire = useCallback(
    async (uid: string): Promise<AgoraRenewalTokens> => {
      try {
        const channel = agoraData?.channel;
        if (!channel) {
          throw new Error('Missing channel for token renewal');
        }

        // RTC and RTM tokens are renewed independently:
        //   - RTC uses the browser client's assigned UID (passed in from ConversationComponent).
        //   - RTM uses the same UID that was used during RTM login (agoraData.uid).
        // Both are fetched in parallel to stay within the token-expiry grace-period window.
        const [rtcResponse, rtmResponse] = await Promise.all([
          fetch(`/api/generate-agora-token?channel=${channel}&uid=${uid}`),
          fetch(`/api/generate-agora-token?channel=${channel}&uid=${agoraData.uid}`),
        ]);
        const [rtcData, rtmData] = await Promise.all([
          rtcResponse.json(),
          rtmResponse.json(),
        ]);

        if (!rtcResponse.ok || !rtmResponse.ok) {
          throw new Error('Failed to generate renewal tokens');
        }

        return {
          rtcToken: rtcData.token,
          rtmToken: rtmData.token,
        };
      } catch (error) {
        console.error('Error renewing token:', error);
        throw error;
      }
    },
    [agoraData],
  );

  const handleEndConversation = async () => {
    // Tear down RTM — owned here since we created it here
    generation.current += 1;
    const rtm = activeRtm.current;
    activeRtm.current = null;
    starting.current = false;
    setRtmClient(null);
    setAgoraData(null);
    setShowConversation(false);
    await rtm?.logout().catch(() => console.warn('Could not close RTM connection'));
  };

  if (showConversation && agoraData && rtmClient) {
    return <Suspense fallback={<Pet label="Connecting…" />}><ErrorBoundary><AgoraProvider>
      <ConversationComponent agoraData={agoraData} rtmClient={rtmClient}
        onTokenWillExpire={handleTokenWillExpire} onEndConversation={handleEndConversation} />
    </AgoraProvider></ErrorBoundary></Suspense>;
  }
  return <Pet label={error || (isLoading ? 'Connecting…' : 'DeepSeek-chan')}>
    <button disabled={isLoading} onClick={handleStartConversation}>Start Chat</button>
  </Pet>;
}
