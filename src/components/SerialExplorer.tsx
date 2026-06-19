'use client';

import { useState, useRef, useEffect, useCallback, type SVGProps, type ReactNode, type FC } from 'react';

/* ════════════════════════════════════════════════════════════════════════
   BUILD MIND — SERIAL EXPLORER
   A live data pipeline: your message travels Blocks -> Code -> Serial Monitor.
   Type a message, set a delay, run it, and watch the flow light up each stage.
   Dark-themed, deployment-safe (no external deps, no emojis).
   ════════════════════════════════════════════════════════════════════════ */

// ── tokens ──
const CARD = '#0f1c30';
const LINE = 'rgba(255,255,255,0.08)';
const TEXT = '#eaf0fa';
const MUTED = 'rgba(234,240,250,0.55)';
const FAINT = 'rgba(234,240,250,0.35)';
const BLUE = '#3b82f6';
const BLUE_LT = '#93c5fd';
const GREEN = '#10b981';
const GREEN_LT = '#34d399';
const AMBER = '#f59e0b';
const VIOLET = '#8b5cf6';
const VIOLET_LT = '#c4b5fd';
const SANS = '"Space Grotesk",sans-serif';
const MONO = '"JetBrains Mono",monospace';

function hexA(hex: string, a: number): string {
  const h = hex.replace('#', '');
  const r = parseInt(h.slice(0, 2), 16), g = parseInt(h.slice(2, 4), 16), b = parseInt(h.slice(4, 6), 16);
  return `rgba(${r},${g},${b},${a})`;
}

type IconProps = SVGProps<SVGSVGElement>;
const BlocksIcon = (p: IconProps) => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><rect x="3" y="3" width="7" height="7" rx="1.5" /><rect x="14" y="3" width="7" height="7" rx="1.5" /><rect x="14" y="14" width="7" height="7" rx="1.5" /><rect x="3" y="14" width="7" height="7" rx="1.5" /></svg>);
const CodeIcon = (p: IconProps) => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M16 18l6-6-6-6M8 6l-6 6 6 6" /></svg>);
const TerminalIcon = (p: IconProps) => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><rect x="3" y="4" width="18" height="16" rx="2" /><path d="M7 9l3 3-3 3M13 15h4" /></svg>);
const PlayIcon = (p: IconProps) => (<svg viewBox="0 0 24 24" fill="currentColor" {...p}><path d="M8 5v14l11-7z" /></svg>);
const StopIcon = (p: IconProps) => (<svg viewBox="0 0 24 24" fill="currentColor" {...p}><rect x="5" y="5" width="14" height="14" rx="2" /></svg>);
const PlugIcon = (p: IconProps) => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M9 2v6M15 2v6M7 8h10v3a5 5 0 0 1-10 0V8zM12 16v6" /></svg>);
const ChatIcon = (p: IconProps) => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M21 11.5a8.38 8.38 0 0 1-8.5 8.5 8.5 8.5 0 0 1-3.8-.9L3 21l1.9-5.7A8.5 8.5 0 1 1 21 11.5z" /></svg>);
const TimerIcon = (p: IconProps) => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><circle cx="12" cy="13" r="8" /><path d="M12 9v4l2 2M9 2h6" /></svg>);
const BulbIcon = (p: IconProps) => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M9 18h6M10 21h4M12 3a6 6 0 0 0-4 10.5c.7.7 1 1.3 1 2.5h6c0-1.2.3-1.8 1-2.5A6 6 0 0 0 12 3z" /></svg>);

type Panel = 'block' | 'code' | 'monitor' | null;
const DEFAULT_MSG = 'Hello ESP32!';
const STAGE_MS = 300;

export default function SerialExplorer() {
  const [message, setMessage] = useState(DEFAULT_MSG);
  const [delay, setDelay] = useState(1000);
  const [isRunning, setIsRunning] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);
  const [activePanel, setActivePanel] = useState<Panel>(null);
  const [lineCount, setLineCount] = useState(0);

  const isRunningRef = useRef(false);
  const logEndRef = useRef<HTMLDivElement>(null);
  // live values so the async loop never runs on stale message/delay
  const msgRef = useRef(message); msgRef.current = message;
  const delayRef = useRef(delay); delayRef.current = delay;

  useEffect(() => { logEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [logs]);
  useEffect(() => () => { isRunningRef.current = false; }, []);

  const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

  const handleRun = useCallback(async () => {
    if (isRunningRef.current) {
      isRunningRef.current = false;
      setIsRunning(false);
      setActivePanel(null);
      return;
    }

    setIsRunning(true);
    isRunningRef.current = true;
    setLogs([]);
    setLineCount(0);
    let count = 0;

    while (isRunningRef.current) {
      setActivePanel('block');
      await sleep(STAGE_MS);
      if (!isRunningRef.current) break;

      setActivePanel('code');
      await sleep(STAGE_MS);
      if (!isRunningRef.current) break;

      setActivePanel('monitor');
      count++;
      setLineCount(count);
      const msg = msgRef.current.trim() || DEFAULT_MSG;
      setLogs((prev) => [...prev.slice(-19), msg]);
      await sleep(delayRef.current);
      if (!isRunningRef.current) break;
    }
    setActivePanel(null);
  }, []);

  const liveMsg = message.trim() || DEFAULT_MSG;
  const fillPct = ((delay - 300) / (3000 - 300)) * 100;

  return (
    <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 16, fontFamily: '"Inter",system-ui,sans-serif' }}>
      <link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;700&display=swap" rel="stylesheet" />

      <style>{`
        @keyframes se-fade{from{opacity:0;transform:translateY(4px)}to{opacity:1;transform:none}}
        @keyframes se-line{from{opacity:0;transform:translateX(-6px)}to{opacity:1;transform:none}}
        @keyframes se-blink{0%,100%{opacity:1}50%{opacity:.25}}
        .se-card{background:${CARD};border:1px solid ${LINE};border-radius:18px;position:relative}
        .se-fade{animation:se-fade .3s ease both}
        .se-logline{animation:se-line .2s ease both}
        .se-cursor{animation:se-blink 1s step-end infinite}
        .se-btn{transition:filter .18s, transform .15s, box-shadow .2s, opacity .2s}
        .se-btn:not(:disabled):hover{filter:brightness(1.08);transform:translateY(-1px)}
        .se-btn:not(:disabled):active{transform:scale(.98)}
        .se-btn:disabled{opacity:.5;cursor:not-allowed}
        .se-input{transition:border-color .2s, box-shadow .2s, background .2s}
        .se-input:focus{border-color:${BLUE} !important; box-shadow:0 0 0 3px ${hexA(BLUE, 0.14)}; background:rgba(59,130,246,0.04) !important}
        .se-input::placeholder{color:rgba(234,240,250,0.3)}
        .se-range{-webkit-appearance:none;appearance:none;height:7px;border-radius:99px;outline:none;cursor:pointer;width:100%}
        .se-range::-webkit-slider-thumb{-webkit-appearance:none;appearance:none;width:18px;height:18px;border-radius:50%;background:radial-gradient(circle at 35% 30%,#fff,${BLUE_LT} 60%,${BLUE});border:2px solid #fff;box-shadow:0 2px 8px ${hexA(BLUE, 0.6)};cursor:pointer}
        .se-range::-moz-range-thumb{width:18px;height:18px;border-radius:50%;background:${BLUE};border:2px solid #fff;cursor:pointer}
        .se-range:disabled{opacity:.5}
        @media (max-width:760px){ .se-pipe{grid-template-columns:1fr !important} .se-controls{flex-direction:column !important} .se-delay{width:100% !important} }
        @media (prefers-reduced-motion: reduce){ .se-fade,.se-logline,.se-cursor{animation:none!important} }
      `}</style>

      {/* ── Header ── */}
      <div className="se-card" style={{ padding: 20, overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: -40, right: -30, width: 150, height: 150, borderRadius: '50%', background: `radial-gradient(circle,${hexA(VIOLET, 0.1)},transparent 65%)`, pointerEvents: 'none' }} />
        <div style={{ position: 'relative' }}>
          <h3 style={{ fontFamily: SANS, fontSize: 15, fontWeight: 700, color: TEXT, margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
            <TerminalIcon width={16} height={16} style={{ color: VIOLET_LT }} />
            Serial Pipeline, see how data flows
          </h3>
          <p style={{ fontSize: 12, color: MUTED, margin: '7px 0 0', lineHeight: 1.55 }}>
            Type a message, set a delay, then press Run. Watch your message travel from the block, through the code, and into the Serial Monitor.
          </p>
        </div>
      </div>

      {/* ── Controls ── */}
      <div className="se-card" style={{ padding: 18, display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div className="se-controls" style={{ display: 'flex', gap: 16 }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <label style={{ display: 'block', fontSize: 10, fontWeight: 700, color: FAINT, textTransform: 'uppercase', letterSpacing: '0.12em', fontFamily: MONO, marginBottom: 8 }}>Your message</label>
            <input
              className="se-input"
              type="text" value={message} maxLength={40}
              onChange={(e) => setMessage(e.target.value)}
              disabled={isRunning}
              placeholder={DEFAULT_MSG}
              style={{ width: '100%', boxSizing: 'border-box', background: 'rgba(0,0,0,0.3)', border: `1px solid ${LINE}`, borderRadius: 11, padding: '11px 14px', color: '#fff', fontFamily: 'Inter, sans-serif', fontSize: 14, outline: 'none' }}
            />
          </div>
          <div className="se-delay" style={{ width: 200, flexShrink: 0 }}>
            <label style={{ display: 'block', fontSize: 10, fontWeight: 700, color: FAINT, textTransform: 'uppercase', letterSpacing: '0.12em', fontFamily: MONO, marginBottom: 8 }}>
              Delay <span style={{ color: BLUE_LT }}>{delay}ms</span>
            </label>
            <input
              className="se-range" type="range" min={300} max={3000} step={100}
              value={delay} disabled={isRunning}
              onChange={(e) => setDelay(Number(e.target.value))}
              style={{ background: `linear-gradient(90deg, ${BLUE} ${fillPct}%, rgba(255,255,255,0.1) ${fillPct}%)` }}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 7, fontSize: 9.5, color: FAINT, fontFamily: MONO }}>
              <span>300ms</span><span>3000ms</span>
            </div>
          </div>
        </div>

        <button type="button" onClick={handleRun} className="se-btn" style={{
          width: '100%', padding: '12px', borderRadius: 12, fontSize: 13.5, fontWeight: 800, fontFamily: SANS,
          letterSpacing: '0.02em', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          cursor: 'pointer', border: 'none', color: '#fff',
          background: isRunning ? 'linear-gradient(135deg,#b91c1c,#ef4444)' : 'linear-gradient(135deg,#1a3a8a,#2563eb)',
          boxShadow: isRunning ? '0 10px 24px -10px rgba(239,68,68,0.6)' : '0 10px 24px -10px rgba(37,99,235,0.6)',
        }}>
          {isRunning ? (<><StopIcon width={13} height={13} /> Stop</>) : (<><PlayIcon width={13} height={13} /> Run</>)}
        </button>
      </div>

      {/* ── Pipeline ── */}
      <div className="se-pipe" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>

        {/* Blocks */}
        <Stage label="Your Blocks" Icon={BlocksIcon} tone={BLUE} active={activePanel === 'block'}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
            <Block tone={BLUE} active={activePanel === 'block'} Icon={PlugIcon}>Start Serial</Block>
            <Block tone={BLUE} active={activePanel === 'block'} Icon={ChatIcon}>Print &quot;{liveMsg}&quot;</Block>
            <Block tone={AMBER} active={activePanel === 'block'} Icon={TimerIcon}>Delay {delay}ms</Block>
          </div>
          {activePanel === 'block' && <Executing tone={BLUE_LT} />}
        </Stage>

        {/* Code */}
        <div className="se-card" style={{ overflow: 'hidden', display: 'flex', flexDirection: 'column', transition: 'border-color .25s', borderColor: activePanel === 'code' ? hexA(GREEN, 0.45) : LINE }}>
          <StageHead label="Arduino Code" Icon={CodeIcon} tone={GREEN} active={activePanel === 'code'} />
          <div style={{ flex: 1, background: '#070b12', padding: 13, fontFamily: MONO, fontSize: 10.5, lineHeight: 1.7, color: '#c9d1d9', whiteSpace: 'pre' }}>
            <span style={{ color: '#ff7b72' }}>void</span> <span style={{ color: '#d2a8ff' }}>setup</span>() {'{'}{'\n'}
            {'  '}<span style={{ color: '#79c0ff' }}>Serial</span>.begin(<span style={{ color: '#f0883e' }}>115200</span>);{'\n'}
            {'}'}{'\n\n'}
            <span style={{ color: '#ff7b72' }}>void</span> <span style={{ color: '#d2a8ff' }}>loop</span>() {'{'}{'\n'}
            {'  '}
            <span style={{ background: activePanel === 'code' ? hexA(GREEN, 0.3) : 'transparent', borderRadius: 3, padding: '0 2px', transition: 'background .2s' }}>
              <span style={{ color: '#79c0ff' }}>Serial</span>.print(<span style={{ color: '#a5d6ff' }}>&quot;{liveMsg}&quot;</span>);
            </span>{'\n'}
            {'  '}<span style={{ color: '#d2a8ff' }}>delay</span>(<span style={{ color: '#f0883e' }}>{delay}</span>);{'\n'}
            {'}'}
          </div>
        </div>

        {/* Serial Monitor */}
        <div className="se-card" style={{ overflow: 'hidden', display: 'flex', flexDirection: 'column', transition: 'border-color .25s', borderColor: activePanel === 'monitor' ? hexA(VIOLET, 0.45) : LINE }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '9px 13px', transition: 'background .25s', background: activePanel === 'monitor' ? hexA(VIOLET, 0.9) : 'rgba(255,255,255,0.04)' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 7, fontFamily: MONO, fontSize: 11, fontWeight: 700, color: '#fff' }}>
              <TerminalIcon width={12} height={12} /> Serial Monitor
            </span>
            {lineCount > 0 && <span style={{ fontSize: 9.5, color: 'rgba(255,255,255,0.7)', fontFamily: MONO }}>{lineCount} lines</span>}
          </div>
          <div style={{ flex: 1, minHeight: 150, background: '#070b12', padding: 13, fontFamily: MONO, fontSize: 11, color: GREEN_LT, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 3 }}>
            {logs.length === 0 ? (
              <span style={{ color: FAINT, fontStyle: 'italic', fontSize: 10.5 }}>
                Waiting for data<span className="se-cursor">_</span>
              </span>
            ) : (
              logs.map((log, i) => {
                const last = i === logs.length - 1 && activePanel === 'monitor';
                return (
                  <div key={i} className="se-logline" style={{ color: last ? GREEN_LT : hexA(GREEN_LT, 0.6), fontWeight: last ? 700 : 400 }}>
                    <span style={{ color: hexA(GREEN_LT, 0.4) }}>&gt;</span> {log}
                  </div>
                );
              })
            )}
            <div ref={logEndRef} />
          </div>
        </div>
      </div>

      {/* ── Insight ── */}
      {lineCount >= 3 && (
        <div className="se-card se-fade" style={{ display: 'flex', gap: 11, alignItems: 'flex-start', padding: '13px 15px', background: hexA(VIOLET, 0.08), borderColor: hexA(VIOLET, 0.25) }}>
          <BulbIcon width={15} height={15} style={{ color: VIOLET_LT, flexShrink: 0, marginTop: 1 }} />
          <p style={{ fontSize: 12, color: MUTED, margin: 0, lineHeight: 1.55 }}>
            Your message has printed <strong style={{ color: TEXT }}>{lineCount} times</strong>. That is <code style={{ fontFamily: MONO, color: VIOLET_LT }}>loop()</code> in action. The delay you set controls how fast it prints, so try changing it and watch the speed change.
          </p>
        </div>
      )}
    </div>
  );
}

/* ─── Stage wrapper (Blocks) ───────────────────────────────────────────── */
function Stage({ label, Icon, tone, active, children }: { label: string; Icon: FC<IconProps>; tone: string; active: boolean; children: ReactNode }) {
  return (
    <div className="se-card" style={{ padding: 14, transition: 'border-color .25s, background .25s', borderColor: active ? hexA(tone, 0.45) : LINE, background: active ? hexA(tone, 0.05) : CARD }}>
      <p style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, fontWeight: 700, color: active ? tone : MUTED, fontFamily: SANS, margin: '0 0 12px', transition: 'color .2s' }}>
        <Icon width={13} height={13} /> {label}
      </p>
      {children}
    </div>
  );
}

function StageHead({ label, Icon, tone, active }: { label: string; Icon: FC<IconProps>; tone: string; active: boolean }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '9px 13px', transition: 'background .25s', background: active ? hexA(tone, 0.9) : 'rgba(255,255,255,0.04)' }}>
      <Icon width={12} height={12} style={{ color: '#fff' }} />
      <span style={{ fontFamily: MONO, fontSize: 11, fontWeight: 700, color: '#fff' }}>{label}</span>
    </div>
  );
}

function Block({ tone, active, Icon, children }: { tone: string; active: boolean; Icon: FC<IconProps>; children: ReactNode }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 7, borderRadius: 9, padding: '8px 11px',
      fontSize: 11.5, fontWeight: 700, fontFamily: SANS, color: '#fff',
      border: `1.5px solid ${active ? tone : hexA(tone, 0.35)}`,
      background: hexA(tone, active ? 0.28 : 0.14),
      transform: active ? 'scale(1.02)' : 'none',
      boxShadow: active ? `0 6px 16px -8px ${hexA(tone, 0.7)}` : 'none',
      transition: 'all .2s', overflow: 'hidden',
    }}>
      <Icon width={13} height={13} style={{ flexShrink: 0, opacity: 0.9 }} />
      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{children}</span>
    </div>
  );
}

function Executing({ tone }: { tone: string }) {
  return (
    <p style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 10, fontWeight: 600, color: tone, margin: '10px 0 0', fontFamily: MONO }}>
      <PlayIcon width={9} height={9} /> Executing
    </p>
  );
}