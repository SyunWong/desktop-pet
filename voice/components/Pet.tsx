'use client';

import { useEffect, useRef, useState, type PointerEvent, type CSSProperties, type ReactNode } from 'react';

const meals = { rice: { ms: 1300, bites: 3 }, turbo: { ms: 100, bites: 40 } };
type Activity = keyof typeof meals | 'grass';
const lines = { rice: 'Mmm, warm rice!', turbo: 'One more bowl, please!', grass: 'Tickle, tickle!' };

function EatingSleeve({ ms, bites, offset = false }: typeof meals.rice & { offset?: boolean }) {
  return (
      <path d="M107 148 Q115 147 121 155 Q127 165 115 170 L110 161 Q115 158 105 155Z">
        <animate attributeName="d" begin={offset ? `-${ms / 2}ms` : "0s"} dur={`${ms}ms`} repeatCount={bites} keyTimes="0;.48;.62;1"
          values="M107 148 Q115 147 121 155 Q127 165 115 170 L110 161 Q115 158 105 155Z;M107 148 Q122 152 123 146 Q126 137 112 140 L107 148 Q115 147 105 155Z;M107 148 Q122 152 123 146 Q126 137 112 140 L107 148 Q115 147 105 155Z;M107 148 Q115 147 121 155 Q127 165 115 170 L110 161 Q115 158 105 155Z"/>
      </path>
  );
}

function RiceHand() {
  return (
    <g className="chopsticks" strokeLinecap="round">
      <path d="M126 158 L87 139 M124 162 L87 141" fill="none" stroke="#825438" strokeWidth="2.5"/>
      <path d="M110 154 Q112 150 115 152 L120 155 Q121 158 118 161 Q115 164 111 161 Q107 160 110 154Z" fill="#ffeadb" stroke="#523c48" strokeWidth="1.3"/>
      <path d="M111 155 Q115 155 116 158" fill="none" stroke="#c49487" strokeWidth="1"/>
      <g className="bite" fill="#fff8e5" stroke="#c6af91"><ellipse cx="86" cy="140" rx="4.5" ry="3"/></g>
    </g>
  );
}

function Rice({ ms, bites, turbo }: typeof meals.rice & { turbo: boolean }) {
  return <svg className="toy" viewBox="0 0 178 238" aria-hidden="true">
    {/* Repaint the resting sleeves with the hair and skirt behind them. */}
    <g fill="#435992">
      <path d="M57 148 Q52 155 41 164 Q35 169 36 181 Q38 188 45 185 L59 166Z"/>
      <path d="M112 147 Q125 155 135 170 Q141 181 134 187 Q126 192 119 181 L109 162Z"/>
    </g>
    <g fill="#252947" stroke="#181c36" strokeWidth="1.5">
      {!turbo && <path d="M60 148 Q51 151 48 165 Q46 175 53 175 L68 171 L66 161 L57 165 L65 152Z"/>}
      <EatingSleeve ms={turbo ? ms * 2 : ms} bites={turbo ? bites / 2 : bites}/>
      {turbo && <g transform="translate(166 0) scale(-1 1)"><EatingSleeve ms={ms * 2} bites={bites} offset/></g>}
    </g>
    <g transform="translate(82 151)">
      <g fill="#fffbef" stroke="#b6a894" strokeWidth="1.5">
        <path d="M-19 0 Q-21 -7 -13 -7 Q-10 -16 -4 -10 Q2 -16 7 -10 Q14 -13 16 -6 Q22 -5 20 0Z"/>
      </g>
      <path d="M-22 -1 Q-20 17 -4 19 L5 19 Q19 15 22 -1Z" fill="#edf7ff" stroke="#385680" strokeWidth="2"/>
      <path d="M-20 3 Q0 10 20 3 M-6 19 L6 19" fill="none" stroke="#608bc7" strokeWidth="3"/>
    </g>
    {!turbo && <path d="M58 166 Q63 161 65 164 L68 166 Q73 166 72 170 Q70 174 62 173Z" fill="#ffeadb" stroke="#5a4250" strokeWidth="1.2"/>}
    <RiceHand/>
    {turbo && <g transform="translate(166 0) scale(-1 1)" className="other-hand"><RiceHand/></g>}
  </svg>;
}

function Foxtail() {
  return <svg className="toy" viewBox="0 0 178 238" aria-hidden="true">
    <g className="foxtail">
      <path d="M131 179 Q148 121 137 71" stroke="#728c42" strokeWidth="2.4" fill="none"/>
      <g transform="translate(137 73) rotate(-15)">
        <ellipse cy="-15" rx="6" ry="21" fill="#b3c96b"/>
        {Array.from({length: 13}, (_, i) => <path key={i}
          d={`M0 ${-i*2.4} q-6 -2 -8 -9 M0 ${-i*2.4} q6 -2 8 -9`}
          stroke={i%2 ? '#d9e5a1' : '#9cb961'} strokeWidth="1.6" strokeLinecap="round" fill="none"/>)}
      </g>
    </g>
  </svg>;
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
      <div className="character grass-pet" style={{
        '--lean': `${tip.x / 14}deg`, '--hop-x': `${target.x * .65}px`, '--hop-y': `${target.y * .6 - 7}px`
      } as CSSProperties}>
        <img src="/whale.png" alt="DeepSeek-chan" draggable={false}/>
        {phase === 'caught' && <Foxtail/>}
      </div>
      {phase !== 'caught' && <div className="grass-lure" aria-hidden="true"
        style={{left: `calc(50% + ${tip.x}px)`, top: `calc(50% + ${tip.y}px)`}}><Foxtail/></div>}
    </div>
    <div className="badge" role="status">{phase === 'tracking' && Math.hypot(tip.x, tip.y) > 60 ? 'A little closer…' : hints[phase]}</div>
  </>;
}

export function Pet({label, action = 'idle', children}: { label?: string; action?: string; children?: ReactNode }) {
  const [play, setPlay] = useState<{ kind: Activity; id: number } | null>(null);
  const meal = play && play.kind !== 'grass' ? meals[play.kind] : null;
  useEffect(() => {
    if (!meal) return;
    const timer = window.setTimeout(() => setPlay(null), meal.ms * meal.bites);
    return () => window.clearTimeout(timer);
  }, [play, meal]);
  function start(kind: Activity) {
    setPlay(previous => ({ kind, id: (previous?.id ?? 0) + 1 }));
  }
  return <main className="pet" data-action={action}>
    {play?.kind === 'grass' ? <GrassGame key={play.id}/> : <>
    <div key={play?.id ?? 0} className="character" data-play={play?.kind} style={meal ? { '--bite-time': `${meal.ms}ms`, '--bites': meal.bites } as CSSProperties : undefined} aria-hidden="true">
      <img src="/whale.png" alt="" width="178" height="238" draggable={false}/>
      {play?.kind === 'turbo' && <>
        <span className="kick foot-left"/><span className="kick foot-right"/>
      </>}
      {(action === 'talking' || meal) && <span className="mouth"/>}
      {meal && <Rice {...meal} turbo={play?.kind === 'turbo'}/>}
    </div>
    <div className="badge" role="status">{play ? lines[play.kind] : label}</div>
    </>}
    <nav aria-label="Playtime"><button onClick={() => start('rice')}>Feed Rice</button><button onClick={() => start('turbo')}>Rice Frenzy</button><button onClick={() => start('grass')}>Foxtail</button></nav>
    <nav aria-label="Voice chat">{children}</nav>
  </main>;
}
