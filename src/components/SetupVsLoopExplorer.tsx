'use client';

import { useState, useRef, useEffect, useCallback } from 'react';

/* ════════════════════════════════════════════════════════════════════════
   BUILD MIND — SETUP vs LOOP EXPLORER
   A side-by-side discovery animation: setup() runs once and locks, loop()
   repeats forever. Progressive discovery questions. Dark-themed, kid-friendly,
   deployment-safe (no external icon deps, cleaned-up async loop).
   ════════════════════════════════════════════════════════════════════════ */

const DISCOVERY_QUESTIONS = [
  'Notice anything different about the two sides?',
  'The left side stopped. Why might that be useful?',
  'Can you predict which of your blocks belong on each side?',
];

const LOOP_BLOCKS = [
  { label: 'Turn ON LED', tone: '#f59e0b', led: 'on' as const },
  { label: 'Wait 1s', tone: '#3b82f6', led: null },
  { label: 'Turn OFF LED', tone: '#64748b', led: 'off' as const },
  { label: 'Wait 1s', tone: '#3b82f6', led: null },
];

// ── tokens ──
const CARD = '#0f1c30';
const LINE = 'rgba(255,255,255,0.08)';
const TEXT = '#eaf0fa';
const MUTED = 'rgba(234,240,250,0.55)';
const FAINT = 'rgba(234,240,250,0.35)';
const AMBER = '#f59e0b';
const AMBER_LT = '#fbbf24';
const BLUE = '#3b82f6';
const GREEN = '#10b981';
const GREEN_LT = '#34d399';
const SANS = '"Space Grotesk",sans-serif';
const MONO = '"JetBrains Mono",monospace';

function hexA(hex: string, a: number): string {
  const h = hex.replace('#', '');
  const r = parseInt(h.slice(0, 2), 16), g = parseInt(h.slice(2, 4), 16), b = parseInt(h.slice(4, 6), 16);
  return `rgba(${r},${g},${b},${a})`;
}

const SETUP_MS = 1200;
const AFTER_SETUP_MS = 800;
const STATE_MS = 350;
const WAIT_MS = 900;
const LOOP_PAUSE = 150;

export default function SetupVsLoopExplorer() {
  const [isRunning, setIsRunning] = useState(false);
  const [setupDone, setSetupDone] = useState(false);
  const [setupActive, setSetupActive] = useState(false);
  const [loopIndex, setLoopIndex] = useState<number | null>(null);
  const [ledOn, setLedOn] = useState(false);
  const [loopCycles, setLoopCycles] = useState(0);
  const [questionIndex, setQuestionIndex] = useState(-1);

  const isRunningRef = useRef(false);
  const cyclesRef = useRef(0);

  useEffect(() => () => { isRunningRef.current = false; }, []);

  const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

  const reset = useCallback(() => {
    isRunningRef.current = false;
    cyclesRef.current = 0;
    setIsRunning(false);
    setSetupDone(false);
    setSetupActive(false);
    setLoopIndex(null);
    setLedOn(false);
    setLoopCycles(0);
    setQuestionIndex(-1);
  }, []);

  const handleRun = useCallback(async () => {
    if (isRunningRef.current) { reset(); return; }

    setIsRunning(true);
    isRunningRef.current = true;
    setSetupDone(false);
    setLoopCycles(0);
    setQuestionIndex(-1);
    cyclesRef.current = 0;

    // Setup phase — runs once
    setSetupActive(true);
    await sleep(SETUP_MS);
    if (!isRunningRef.current) return;
    setSetupActive(false);
    setSetupDone(true);

    await sleep(AFTER_SETUP_MS);
    if (!isRunningRef.current) return;
    setQuestionIndex(0);

    // Loop phase — forever
    while (isRunningRef.current) {
      for (let i = 0; i < LOOP_BLOCKS.length; i++) {
        if (!isRunningRef.current) break;
        setLoopIndex(i);
        const b = LOOP_BLOCKS[i];
        if (b.led === 'on') { setLedOn(true); await sleep(STATE_MS); }
        else if (b.led === 'off') { setLedOn(false); await sleep(STATE_MS); }
        else { await sleep(WAIT_MS); }
      }
      if (!isRunningRef.current) break;

      cyclesRef.current += 1;
      setLoopCycles(cyclesRef.current);
      setLoopIndex(-1);
      await sleep(LOOP_PAUSE);

      if (cyclesRef.current === 1) setQuestionIndex(1);
      if (cyclesRef.current === 3) setQuestionIndex(2);
    }
  }, [reset]);

  const looping = isRunning && setupDone;

  return (
    <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 16, fontFamily: '"Inter",system-ui,sans-serif' }}>
      <link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet" />

      <style>{`
        @keyframes sv-pulse{0%,100%{opacity:1;transform:scale(1)}50%{opacity:.45;transform:scale(.7)}}
        @keyframes sv-ring{0%{transform:scale(1);opacity:.6}100%{transform:scale(1.9);opacity:0}}
        @keyframes sv-pop{0%{transform:scale(.6);opacity:0}60%{transform:scale(1.06)}100%{transform:scale(1);opacity:1}}
        @keyframes sv-slidein{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:none}}
        .sv-card{background:${CARD};border:1px solid ${LINE};border-radius:18px;position:relative}
        .sv-dot{animation:sv-pulse 1s ease-in-out infinite}
        .sv-ring{animation:sv-ring 1.6s ease-out infinite}
        .sv-q{animation:sv-slidein .35s cubic-bezier(0.16,1,0.3,1) both}
        .sv-badge{animation:sv-pop .35s cubic-bezier(0.34,1.56,0.64,1) both}
        .sv-btn{transition:filter .18s, transform .15s, box-shadow .2s}
        .sv-btn:hover{filter:brightness(1.08);transform:translateY(-1px)}
        .sv-btn:active{transform:scale(.98)}
        @media (prefers-reduced-motion: reduce){
          .sv-dot,.sv-ring,.sv-q,.sv-badge{animation:none!important}
        }
      `}</style>

      {/* ── Header ── */}
      <div className="sv-card" style={{ padding: 20, overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: -40, right: -30, width: 150, height: 150, borderRadius: '50%', background: `radial-gradient(circle,${hexA(BLUE, 0.1)},transparent 65%)`, pointerEvents: 'none' }} />
        <div style={{ position: 'relative' }}>
          <h3 style={{ fontFamily: SANS, fontSize: 15, fontWeight: 700, color: TEXT, margin: 0 }}>Setup vs Loop — spot the difference</h3>
          <p style={{ fontSize: 12, color: MUTED, margin: '6px 0 0', lineHeight: 1.55 }}>
            Press Run and watch both sides. One stops after a moment; the other keeps going forever. Try to figure out why before reading on.
          </p>
        </div>
      </div>

      {/* ── Two panels ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }} className="sv-grid">

        {/* Setup */}
        <div className="sv-card" style={{
          padding: 16, transition: 'border-color .5s, background .5s, opacity .5s',
          borderColor: setupActive ? hexA(AMBER, 0.5) : LINE,
          background: setupActive ? hexA(AMBER, 0.06) : CARD,
          opacity: setupDone ? 0.78 : 1,
        }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 14 }}>
            <div>
              <p style={{ fontFamily: MONO, fontSize: 12.5, fontWeight: 700, color: AMBER_LT, margin: 0 }}>void setup()</p>
              <p style={{ fontSize: 10, color: FAINT, margin: '3px 0 0' }}>Runs once at startup</p>
            </div>
            {setupActive && (
              <span className="sv-badge" style={{ display: 'inline-flex', alignItems: 'center', gap: 5, background: hexA(AMBER, 0.14), border: `1px solid ${hexA(AMBER, 0.3)}`, borderRadius: 99, padding: '3px 9px' }}>
                <span className="sv-dot" style={{ width: 5, height: 5, borderRadius: '50%', background: AMBER, display: 'inline-block' }} />
                <span style={{ fontSize: 9.5, fontWeight: 700, color: AMBER_LT, fontFamily: MONO }}>Running</span>
              </span>
            )}
            {setupDone && (
              <span className="sv-badge" style={{ display: 'inline-flex', alignItems: 'center', gap: 5, background: 'rgba(255,255,255,0.05)', border: `1px solid ${LINE}`, borderRadius: 99, padding: '3px 9px' }}>
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke={FAINT} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="4" y="11" width="16" height="9" rx="2" /><path d="M8 11V7a4 4 0 0 1 8 0v4" /></svg>
                <span style={{ fontSize: 9.5, fontWeight: 700, color: FAINT, fontFamily: MONO }}>Locked</span>
              </span>
            )}
          </div>

          <div style={{
            borderRadius: 11, padding: '11px 13px', display: 'flex', alignItems: 'center', gap: 9,
            fontSize: 12.5, fontWeight: 700, fontFamily: SANS,
            transition: 'all .25s', color: setupDone ? FAINT : '#fff',
            border: `2px solid ${setupActive ? AMBER : 'transparent'}`,
            background: setupDone ? 'rgba(255,255,255,0.04)' : hexA(AMBER, setupActive ? 0.95 : 0.85),
            transform: setupActive ? 'scale(1.02)' : 'none',
            boxShadow: setupActive ? `0 8px 22px -10px ${hexA(AMBER, 0.7)}` : 'none',
          }}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2v6M12 8 9 5M12 8l3-3" /><rect x="4" y="8" width="16" height="13" rx="2" /></svg>
            Set Pin Mode: OUTPUT
          </div>

          {setupDone && (
            <p style={{ fontSize: 10, color: FAINT, margin: '12px 0 0', fontStyle: 'italic', textAlign: 'center' }}>
              Executed once — never runs again
            </p>
          )}

          <div style={{ marginTop: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.03)', border: `1px solid ${LINE}`, borderRadius: 10, padding: '8px 12px' }}>
            <span style={{ fontSize: 9.5, color: FAINT, fontFamily: MONO, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Times executed</span>
            <span style={{ fontSize: 15, fontWeight: 800, fontFamily: SANS, color: AMBER_LT }}>{setupDone ? 1 : 0}</span>
          </div>
        </div>

        {/* Loop */}
        <div className="sv-card" style={{
          padding: 16, transition: 'border-color .5s, background .5s',
          borderColor: looping ? hexA(GREEN, 0.4) : LINE,
          background: looping ? hexA(GREEN, 0.05) : CARD,
        }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 14 }}>
            <div>
              <p style={{ fontFamily: MONO, fontSize: 12.5, fontWeight: 700, color: GREEN_LT, margin: 0 }}>void loop()</p>
              <p style={{ fontSize: 10, color: FAINT, margin: '3px 0 0' }}>Repeats forever</p>
            </div>
            {looping && (
              <span className="sv-badge" style={{ display: 'inline-flex', alignItems: 'center', gap: 5, background: hexA(GREEN, 0.14), border: `1px solid ${hexA(GREEN, 0.3)}`, borderRadius: 99, padding: '3px 9px' }}>
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke={GREEN_LT} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 2l4 4-4 4" /><path d="M3 11V9a4 4 0 0 1 4-4h14" /><path d="M7 22l-4-4 4-4" /><path d="M21 13v2a4 4 0 0 1-4 4H3" /></svg>
                <span style={{ fontSize: 9.5, fontWeight: 700, color: GREEN_LT, fontFamily: MONO }}>Looping</span>
              </span>
            )}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, position: 'relative', paddingLeft: 16 }}>
            <div style={{ position: 'absolute', left: 5, top: 8, bottom: 8, width: 2, background: 'rgba(255,255,255,0.08)', borderRadius: 99 }} />
            {LOOP_BLOCKS.map((block, i) => {
              const active = loopIndex === i;
              return (
                <div key={i} style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ position: 'absolute', left: -11, width: 10, height: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', background: looping ? hexA(GREEN, 0.05) : CARD, borderRadius: '50%' }}>
                    {active
                      ? <span className="sv-dot" style={{ width: 9, height: 9, borderRadius: '50%', background: GREEN, boxShadow: `0 0 7px ${hexA(GREEN, 0.8)}` }} />
                      : <span style={{ width: 5, height: 5, borderRadius: '50%', background: 'rgba(255,255,255,0.2)' }} />}
                  </div>
                  <div style={{
                    flex: 1, minWidth: 0, borderRadius: 10, padding: '9px 12px', fontSize: 12, fontWeight: 700, fontFamily: SANS,
                    border: `2px solid ${active ? block.tone : 'transparent'}`,
                    background: hexA(block.tone, active ? 0.22 : 0.13),
                    color: '#fff', opacity: active ? 1 : 0.72,
                    transform: active ? 'scale(1.02)' : 'none',
                    boxShadow: active ? `0 6px 18px -8px ${hexA(block.tone, 0.7)}` : 'none',
                    transition: 'all .15s',
                  }}>
                    {block.label}
                  </div>
                </div>
              );
            })}
          </div>

          <div style={{ marginTop: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.03)', border: `1px solid ${LINE}`, borderRadius: 10, padding: '8px 12px' }}>
            <span style={{ fontSize: 9.5, color: FAINT, fontFamily: MONO, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Cycles completed</span>
            <span style={{ fontSize: 15, fontWeight: 800, fontFamily: SANS, color: GREEN_LT }}>{loopCycles}</span>
          </div>
        </div>
      </div>

      {/* ── LED output ── */}
      <div className="sv-card" style={{ padding: 18, display: 'flex', alignItems: 'center', gap: 20 }}>
        <div style={{ position: 'relative', width: 56, height: 56, flexShrink: 0 }}>
          {ledOn && <span className="sv-ring" style={{ position: 'absolute', inset: 0, borderRadius: '50%', border: `2px solid ${AMBER}`, pointerEvents: 'none' }} />}
          <div style={{
            width: 56, height: 56, borderRadius: '50%', border: '4px solid',
            transition: 'all .2s cubic-bezier(0.16,1,0.3,1)',
            borderColor: ledOn ? AMBER_LT : 'rgba(255,255,255,0.12)',
            background: ledOn ? `radial-gradient(circle at 35% 30%,${AMBER_LT},${AMBER})` : 'rgba(255,255,255,0.05)',
            boxShadow: ledOn ? `0 0 30px ${hexA(AMBER, 0.65)}` : 'none',
          }} />
        </div>
        <div>
          <p style={{ fontSize: 10, fontWeight: 700, color: FAINT, textTransform: 'uppercase', letterSpacing: '0.12em', margin: 0, fontFamily: MONO }}>LED State</p>
          <p style={{ fontFamily: SANS, fontSize: 18, fontWeight: 800, color: ledOn ? AMBER_LT : FAINT, margin: '3px 0 0', transition: 'color .2s' }}>{ledOn ? 'ON' : 'OFF'}</p>
          <p style={{ fontSize: 10.5, color: MUTED, margin: '3px 0 0' }}>
            {looping ? 'Controlled by void loop()' : isRunning ? 'Waiting for setup to finish…' : 'Press Run to start'}
          </p>
        </div>
      </div>

      {/* ── Discovery questions ── */}
      {questionIndex >= 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {DISCOVERY_QUESTIONS.slice(0, questionIndex + 1).map((q, i) => {
            const active = i === questionIndex;
            return (
              <div key={i} className="sv-q" style={{
                display: 'flex', alignItems: 'flex-start', gap: 9, borderRadius: 11, padding: '11px 14px', fontSize: 12, lineHeight: 1.55,
                background: active ? hexA(BLUE, 0.08) : 'rgba(255,255,255,0.02)',
                border: `1px solid ${active ? hexA(BLUE, 0.25) : 'transparent'}`,
                color: active ? TEXT : MUTED, fontWeight: active ? 500 : 400,
              }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={active ? '#93c5fd' : FAINT} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: 1 }}><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" /><path d="M12 17h.01" /><circle cx="12" cy="12" r="10" /></svg>
                {q}
              </div>
            );
          })}
        </div>
      )}

      {/* ── Run / Stop ── */}
      <button
        type="button"
        onClick={handleRun}
        className="sv-btn"
        style={{
          width: '100%', padding: '12px', borderRadius: 12, fontSize: 13.5, fontWeight: 800,
          fontFamily: SANS, letterSpacing: '0.02em', display: 'inline-flex', alignItems: 'center',
          justifyContent: 'center', gap: 8, cursor: 'pointer', border: 'none', color: '#fff',
          background: isRunning ? 'linear-gradient(135deg,#b91c1c,#ef4444)' : 'linear-gradient(135deg,#1a3a8a,#2563eb)',
          boxShadow: isRunning ? '0 10px 24px -10px rgba(239,68,68,0.6)' : '0 10px 24px -10px rgba(37,99,235,0.6)',
        }}
      >
        {isRunning
          ? (<><svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><rect x="5" y="5" width="14" height="14" rx="2" /></svg> Stop</>)
          : (<><svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z" /></svg> Run</>)}
      </button>

      <style>{`@media (max-width:560px){ .sv-grid{ grid-template-columns:1fr !important } }`}</style>
    </div>
  );
}