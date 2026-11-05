'use client';

import { useEffect, useRef, useState, type PointerEvent, type CSSProperties, type ReactNode } from 'react';

const meals = { rice: { ms: 1300, bites: 3 }, turbo: { ms: 100, bites: 40 } };
type Activity = keyof typeof meals | 'grass';
const lines = { rice: 'Mmm, warm rice!', turbo: 'One more bowl, please!', grass: 'Tickle, tickle!' };

type SleepPhase = 'awake' | 'drowsy' | 'asleep' | 'waking';
const IDLE_SLEEP_MS = 5 * 60 * 1000;
const sleepLines = { drowsy: 'Getting sleepy…', asleep: 'Zzz… Tap me to wake up', waking: 'Hmm? I’m awake!' };

const poses = {
  'sleep-drowsy': { frames: 4, duration: 1800 },
  'sleep-asleep': { frames: 4, duration: 3200 },
  'sleep-waking': { frames: 4, duration: 1600 },
  rice: { frames: 4, duration: 1300 },
  turbo: { frames: 4, duration: 200 },
  'grass-ready': { frames: 1, duration: 1000 },
  'grass-tracking': { frames: 2, duration: 500 },
  'grass-pouncing': { frames: 3, duration: 380 },
  'grass-caught': { frames: 2, duration: 850 },
  'grass-missed': { frames: 2, duration: 750 },
};

function Pose({ name }: { name: keyof typeof poses }) {
  const pose = poses[name];
  return <span className="pose-strip" style={{
    '--pose-frames': pose.frames,
    '--pose-time': `${pose.duration}ms`,
  } as CSSProperties}>
    <img key={name} src={`/actions/${name}${name.startsWith('grass-') ? '-v2' : ''}.webp`} alt="" draggable={false}
      style={{ width: `${pose.frames * 100}%`, animation: pose.frames === 1 ? 'none' : undefined }}/>
  </span>;
}

function Foxtail() {
  return <img className="foxtail-art" src="/actions/foxtail-v2.webp" alt="" draggable={false}/>;
}

type Point = { x: number; y: number };
type Phase = 'ready' | 'tracking' | 'pouncing' | 'caught' | 'missed';
const initialTip = { x: 64, y: -27 };
const hints = { ready: 'Drag the grass near me!', tracking: 'Hold still…', pouncing: 'Hop!', caught: 'Got it!', missed: 'Almost! Try again?' };

function GrassGame() {
  const [tip, setTip] = useState<Point>(initialTip);
  const [phase, setPhase] = useState<Phase>('ready');
  const [target, setTarget] = useState<Point>(initialTip);
  const latest = useRef(tip);
  const pointer = useRef<number | null>(null);
  const stage = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (phase !== 'tracking' || Math.hypot(tip.x, tip.y) > 60) return;
    const timer = window.setTimeout(() => {
      setTarget(tip);
      setPhase('pouncing');
    }, 500);
    return () => window.clearTimeout(timer);
  }, [phase, tip]);
  useEffect(() => {
    if (phase === 'pouncing') {
      const timer = window.setTimeout(() => {
        const pos = latest.current;
        setPhase(Math.hypot(pos.x - target.x, pos.y - target.y) < 18 ? 'caught' : 'missed');
      }, 380);
      return () => window.clearTimeout(timer);
    }
    if (phase === 'caught' || phase === 'missed') {
      const timer = window.setTimeout(() => setPhase('ready'), phase === 'caught' ? 1700 : 750);
      return () => window.clearTimeout(timer);
    }
  }, [phase, target]);
  function move(event: PointerEvent<HTMLDivElement>) {
    const rect = stage.current?.getBoundingClientRect();
    if (!rect || pointer.current !== event.pointerId) return;
    const x = Math.max(10, Math.min(rect.width - 10, event.clientX - rect.left)) - rect.width / 2;
    const y = Math.max(10, Math.min(rect.height - 10, event.clientY - rect.top)) - rect.height / 2;
    latest.current = { x, y };
    setTip(latest.current);
    if (phase === 'ready') setPhase('tracking');
  }
  return <>
    <div ref={stage} className="grass-stage" data-phase={phase}
      onPointerDown={event => {
        if (phase === 'caught' || pointer.current !== null) return;
        event.currentTarget.setPointerCapture(event.pointerId);
        pointer.current = event.pointerId;
        move(event);
      }} onPointerMove={move} onLostPointerCapture={() => { pointer.current = null; }}>
      <div className="character grass-pet animated-character" style={{
        '--lean': `${tip.x / 14}deg`, '--hop-x': `${target.x * .65}px`, '--hop-y': `${target.y * .6 - 7}px`
      } as CSSProperties}>
        <Pose name={`grass-${phase}`}/>
      </div>
      {phase !== 'caught' && <div className="grass-lure" aria-hidden="true"
        style={{left: `calc(50% + ${tip.x}px)`, top: `calc(50% + ${tip.y}px)`}}><Foxtail/></div>}
    </div>
    <div className="badge" role="status">{phase === 'tracking' && Math.hypot(tip.x, tip.y) > 60 ? 'A little closer…' : hints[phase]}</div>
  </>;
}

export function Pet({label, action = 'idle', children}: { label?: string; action?: string; children?: ReactNode }) {
  const [sleepPhase, setSleepPhase] = useState<SleepPhase>('awake');
  const [lastInteraction, setLastInteraction] = useState(() => Date.now());
  const voiceActive = action !== 'idle';
  const [play, setPlay] = useState<{ kind: Activity; id: number } | null>(null);
  useEffect(() => {
    Object.keys(poses).forEach(name => {
      const image = new Image();
      image.src = `/actions/${name}${name.startsWith('grass-') ? '-v2' : ''}.webp`;
    });
  }, []);
  const meal = play && play.kind !== 'grass' ? meals[play.kind] : null;
  useEffect(() => {
    if (!meal) return;
    const timer = window.setTimeout(() => setPlay(null), meal.ms * meal.bites);
    return () => window.clearTimeout(timer);
  }, [play, meal]);
  useEffect(() => {
    if (voiceActive) {
      setSleepPhase('awake');
      setLastInteraction(Date.now());
    }
  }, [voiceActive]);
  useEffect(() => {
    if (voiceActive || meal || sleepPhase !== 'awake') return;
    const timer = window.setTimeout(() => {
      setPlay(null);
      setSleepPhase('drowsy');
    }, IDLE_SLEEP_MS);
    return () => window.clearTimeout(timer);
  }, [voiceActive, meal, sleepPhase, lastInteraction]);
  useEffect(() => {
    if (sleepPhase !== 'drowsy' && sleepPhase !== 'waking') return;
    const timer = window.setTimeout(() => {
      setSleepPhase(sleepPhase === 'drowsy' ? 'asleep' : 'awake');
    }, sleepPhase === 'drowsy' ? 1800 : 1600);
    return () => window.clearTimeout(timer);
  }, [sleepPhase]);
  function rest() {
    if (voiceActive) return;
    setPlay(null);
    setSleepPhase(sleepPhase === 'awake' ? 'drowsy' : 'waking');
  }
  function start(kind: Activity) {
    setSleepPhase('awake');
    setLastInteraction(Date.now());
    setPlay(previous => ({ kind, id: (previous?.id ?? 0) + 1 }));
  }
  return <main className="pet" data-action={action} data-sleep={sleepPhase}
    onPointerDownCapture={() => setLastInteraction(Date.now())}
    onKeyDownCapture={() => setLastInteraction(Date.now())}>
    {sleepPhase !== 'awake' ? <>
      <div className="sleep-stage">
        <button className="sleep-character" aria-label="Wake up" onClick={() => setSleepPhase('waking')}>
          <Pose name={`sleep-${sleepPhase}`}/>
        </button>
      </div>
      <div className="badge" role="status">{sleepLines[sleepPhase]}</div>
    </> : play?.kind === 'grass' ? <GrassGame key={play.id}/> : <>
    <div key={play?.id ?? 0} className={`character${meal ? ' animated-character' : ''}`} data-play={play?.kind} aria-hidden="true">
      {meal && play ? <Pose name={play.kind}/> : <>
        <img src="/whale.png" alt="" width="178" height="238" draggable={false}/>
        {action === 'talking' && <span className="mouth"/>}
      </>}
    </div>
    <div className="badge" role="status">{play ? lines[play.kind] : label}</div>
    </>}
    <nav aria-label="Playtime"><button onClick={() => start('rice')}>Feed Rice</button><button onClick={() => start('turbo')}>Rice Frenzy</button><button onClick={() => start('grass')}>Foxtail</button></nav>
    <nav aria-label="Voice chat">{children}<button onClick={rest} disabled={voiceActive || sleepPhase === 'waking'} title={voiceActive ? 'Finish your call before sleeping' : 'Also sleeps after 5 minutes without interaction'}>{sleepPhase === 'awake' ? 'Sleep' : 'Wake up'}</button></nav>
  </main>;
}
