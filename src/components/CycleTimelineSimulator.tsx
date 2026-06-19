'use client';

import React, { useEffect, useState, useRef, useCallback } from 'react';

/* ════════════════════════════════════════════════════════════════════════
   BUILD MIND — CYCLE TIMELINE SIMULATOR
   A looping, kid-friendly explainer of how the ESP32 runs a blink program.
   Data-driven (each step declares its own LED state), pausable, dark-themed.
   ════════════════════════════════════════════════════════════════════════ */

type CycleStep = {
  label: string;
  tone: string;      // accent hex
  led: boolean;      // is the LED on during this step?
  description: string;
};

const CYCLE: CycleStep[] = [
  { label: 'HIGH', tone: '#f59e0b', led: true,
    description: 'The ESP32 runs the HIGH instruction. The LED turns ON right away.' },
  { label: 'WAIT', tone: '#3b82f6', led: true,
    description: 'The delay() instruction pauses the program. The LED stays ON while the chip waits.' },
  { label: 'LOW', tone: '#64748b', led: false,
    description: 'The ESP32 runs the LOW instruction. The LED turns OFF right away.' },
  { label: 'WAIT', tone: '#3b82f6', led: false,
    description: 'Another delay() pauses the program. The LED stays OFF. Then the cycle starts over.' },
];

const INSIGHTS = [
  'Each block is one instruction. The ESP32 finishes it fully before moving on.',
  'Order is everything. Swap HIGH and LOW and the behavior flips.',
  'Delay does not change what the LED does. It controls how long a state lasts.',
  'The program never stops. After the last instruction it jumps back to the first.',
];

const STEP_MS = 2500;

// ── tokens ──
const CARD = '#0f1c30';
const LINE = 'rgba(255,255,255,0.08)';
const TEXT = '#eaf0fa';
const MUTED = 'rgba(234,240,250,0.55)';
const FAINT = 'rgba(234,240,250,0.35)';
const AMBER = '#f59e0b';
const AMBER_LT = '#fbbf24';
const SANS = '"Space Grotesk",sans-serif';
const MONO = '"JetBrains Mono",monospace';

function hexA(hex: string, a: number): string {
  const h = hex.replace('#', '');
  const r = parseInt(h.slice(0, 2), 16), g = parseInt(h.slice(2, 4), 16), b = parseInt(h.slice(4, 6), 16);
  return `rgba(${r},${g},${b},${a})`;
}

export default function CycleTimelineSimulator() {
  const [step, setStep] = useState(0);
  const [paused, setPaused] = useState(false);
  const pausedRef = useRef(paused);
  pausedRef.current = paused;

  // Single interval; respects pause via ref so we don't re-create it each toggle.
  useEffect(() => {
    const id = setInterval(() => {
      if (pausedRef.current) return;
      setStep((prev) => (prev + 1) % CYCLE.length);
    }, STEP_MS);
    return () => clearInterval(id);
  }, []);

  const current = CYCLE[step];
  const isOn = current.led;

  const goTo = useCallback((i: number) => {
    setStep(i);
    setPaused(true); // tapping a step pauses so a child can study it
  }, []);

  return (
    <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 18, fontFamily: '"Inter",system-ui,sans-serif' }}>
      <link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet" />

      <style>{`
        @keyframes ct-bounce{0%,100%{transform:translateY(0)}50%{transform:translateY(-4px)}}
        @keyframes ct-pop{0%{transform:scale(.6);opacity:0}60%{transform:scale(1.08)}100%{transform:scale(1);opacity:1}}
        @keyframes ct-flow{to{stroke-dashoffset:-12}}
        @keyframes ct-glow{0%,100%{opacity:.55}50%{opacity:1}}
        @keyframes ct-ring{0%{transform:scale(1);opacity:.6}100%{transform:scale(1.9);opacity:0}}
        @keyframes ct-spin{to{transform:rotate(360deg)}}
        .ct-card{background:${CARD};border:1px solid ${LINE};border-radius:18px;position:relative;overflow:hidden}
        .ct-pill{transition:transform .35s cubic-bezier(0.34,1.56,0.64,1), opacity .3s, box-shadow .3s, background .3s; cursor:pointer}
        .ct-pill:hover{transform:translateY(-2px) scale(1.04)}
        .ct-dot{animation:ct-bounce 1s ease-in-out infinite}
        .ct-desc{animation:ct-pop .4s cubic-bezier(0.34,1.56,0.64,1) both}
        .ct-led-ring{animation:ct-ring 1.6s ease-out infinite}
        .ct-arrow{stroke-dasharray:4 4;animation:ct-flow .6s linear infinite}
        .ct-insight{transition:background .3s, border-color .3s, transform .25s}
        .ct-btn{transition:background .18s, border-color .18s, color .18s, transform .15s}
        .ct-btn:hover{transform:translateY(-1px)}
        .ct-btn:active{transform:scale(.96)}
        @media (prefers-reduced-motion: reduce){
          .ct-dot,.ct-desc,.ct-led-ring,.ct-arrow,.ct-pill{animation:none!important}
        }
      `}</style>

      {/* ── Header ── */}
      <div className="ct-card" style={{ padding: 20 }}>
        <div style={{ position: 'absolute', top: -40, right: -30, width: 160, height: 160, borderRadius: '50%', background: `radial-gradient(circle,${hexA(AMBER, 0.1)},transparent 65%)`, pointerEvents: 'none' }} />
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 40, height: 40, flexShrink: 0, borderRadius: 11, background: hexA(AMBER, 0.14), color: AMBER_LT, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="ct-loop-ico"><path d="M17 2l4 4-4 4" /><path d="M3 11V9a4 4 0 0 1 4-4h14" /><path d="M7 22l-4-4 4-4" /><path d="M21 13v2a4 4 0 0 1-4 4H3" /></svg>
          </div>
          <div style={{ minWidth: 0 }}>
            <h3 style={{ fontFamily: SANS, fontSize: 15, fontWeight: 700, color: TEXT, margin: 0 }}>How the ESP32 runs your program</h3>
            <p style={{ fontSize: 12, color: MUTED, margin: '3px 0 0', lineHeight: 1.5 }}>
              Watch the pointer move through each instruction. It never skips, never reorders, and never stops.
            </p>
          </div>
        </div>
      </div>

      {/* ── Timeline ── */}
      <div className="ct-card" style={{ padding: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <p style={{ fontSize: 10, fontWeight: 700, color: FAINT, textTransform: 'uppercase', letterSpacing: '0.14em', fontFamily: MONO, margin: 0 }}>Execution Timeline</p>
          <button
            className="ct-btn"
            onClick={() => setPaused((p) => !p)}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '5px 12px', borderRadius: 99, fontSize: 11, fontWeight: 700, fontFamily: '"Inter",sans-serif', cursor: 'pointer', color: paused ? AMBER_LT : MUTED, background: paused ? hexA(AMBER, 0.12) : 'rgba(255,255,255,0.04)', border: `1px solid ${paused ? hexA(AMBER, 0.3) : LINE}` }}
          >
            {paused ? (
              <><svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z" /></svg> Play</>
            ) : (
              <><svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="5" width="4" height="14" rx="1" /><rect x="14" y="5" width="4" height="14" rx="1" /></svg> Pause</>
            )}
          </button>
        </div>

        {/* pills */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          {CYCLE.map((c, i) => {
            const active = i === step;
            return (
              <React.Fragment key={i}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                  <button
                    className="ct-pill"
                    onClick={() => goTo(i)}
                    aria-label={`${c.label} step`}
                    style={{
                      padding: '9px 16px', borderRadius: 11, fontSize: 12.5, fontWeight: 800,
                      fontFamily: SANS, letterSpacing: '0.03em', color: '#fff',
                      border: `2px solid ${active ? c.tone : hexA(c.tone, 0.4)}`,
                      background: active ? `linear-gradient(135deg,${hexA(c.tone, 0.95)},${c.tone})` : hexA(c.tone, 0.14),
                      opacity: active ? 1 : 0.5,
                      transform: active ? 'scale(1.06)' : 'scale(1)',
                      boxShadow: active ? `0 8px 22px -8px ${hexA(c.tone, 0.7)}` : 'none',
                    }}
                  >
                    {c.label}
                  </button>
                  <span className={active ? 'ct-dot' : ''} style={{ width: 5, height: 5, borderRadius: '50%', background: active ? c.tone : 'transparent' }} />
                </div>
                {i < CYCLE.length - 1 && (
                  <svg width="22" height="10" viewBox="0 0 22 10" style={{ flexShrink: 0, opacity: 0.5 }}>
                    <line className={active ? 'ct-arrow' : ''} x1="0" y1="5" x2="16" y2="5" stroke={FAINT} strokeWidth="1.6" strokeLinecap="round" />
                    <path d="M14 1 L20 5 L14 9" fill="none" stroke={FAINT} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
              </React.Fragment>
            );
          })}
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, marginLeft: 4, fontSize: 11, fontWeight: 600, color: FAINT, fontFamily: MONO }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12a9 9 0 1 0 9-9" /><path d="M3 4v5h5" /></svg>
            loops
          </span>
        </div>

        {/* current description */}
        <div key={step} className="ct-desc" style={{ marginTop: 16, display: 'flex', alignItems: 'flex-start', gap: 9, borderRadius: 12, background: hexA(current.tone, 0.08), border: `1px solid ${hexA(current.tone, 0.22)}`, padding: '12px 14px' }}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill={current.tone} style={{ flexShrink: 0, marginTop: 2 }}><path d="M8 5v14l11-7z" /></svg>
          <p style={{ fontSize: 12.5, lineHeight: 1.55, color: hexA(current.tone === '#64748b' ? '#cbd5e1' : current.tone, 1), margin: 0, fontWeight: 500 }}>{current.description}</p>
        </div>
      </div>

      {/* ── LED + state ── */}
      <div className="ct-card" style={{ padding: 20, display: 'flex', alignItems: 'center', gap: 22 }}>
        <div style={{ position: 'relative', width: 64, height: 64, flexShrink: 0 }}>
          {isOn && <span className="ct-led-ring" style={{ position: 'absolute', inset: 0, borderRadius: '50%', border: `2px solid ${AMBER}`, pointerEvents: 'none' }} />}
          <div style={{
            width: 64, height: 64, borderRadius: '50%', border: '4px solid',
            transition: 'all .35s cubic-bezier(0.16,1,0.3,1)',
            borderColor: isOn ? AMBER_LT : 'rgba(255,255,255,0.12)',
            background: isOn ? `radial-gradient(circle at 35% 30%,${AMBER_LT},${AMBER})` : 'rgba(255,255,255,0.05)',
            boxShadow: isOn ? `0 0 34px ${hexA(AMBER, 0.6)}` : 'none',
          }} />
        </div>
        <div>
          <p style={{ fontSize: 10, fontWeight: 700, color: FAINT, textTransform: 'uppercase', letterSpacing: '0.12em', margin: 0, fontFamily: MONO }}>Current LED State</p>
          <p style={{ fontFamily: SANS, fontSize: 22, fontWeight: 800, color: isOn ? AMBER_LT : FAINT, margin: '4px 0 0', transition: 'color .3s' }}>
            {isOn ? 'ON' : 'OFF'}
          </p>
          <p style={{ fontSize: 11.5, color: MUTED, margin: '4px 0 0', fontFamily: MONO }}>
            Step {step + 1} of {CYCLE.length} — {current.label}
          </p>
        </div>
      </div>

      {/* ── Key insights ── */}
      <div className="ct-card" style={{ padding: 20 }}>
        <p style={{ fontSize: 10, fontWeight: 700, color: FAINT, textTransform: 'uppercase', letterSpacing: '0.14em', margin: '0 0 12px', fontFamily: MONO }}>Key Insights</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {INSIGHTS.map((insight, i) => {
            const active = i === step;
            return (
              <div key={i} className="ct-insight" style={{
                display: 'flex', gap: 11, alignItems: 'flex-start', borderRadius: 11, padding: '11px 13px',
                background: active ? hexA(AMBER, 0.08) : 'rgba(255,255,255,0.02)',
                border: `1px solid ${active ? hexA(AMBER, 0.25) : 'transparent'}`,
                transform: active ? 'translateX(3px)' : 'none',
              }}>
                <span style={{
                  width: 18, height: 18, flexShrink: 0, marginTop: 1, borderRadius: '50%',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 10, fontWeight: 800, fontFamily: SANS,
                  background: active ? AMBER : 'rgba(255,255,255,0.08)',
                  color: active ? '#1a1206' : FAINT, transition: 'all .3s',
                }}>{i + 1}</span>
                <p style={{ fontSize: 12, lineHeight: 1.55, color: active ? TEXT : MUTED, margin: 0, transition: 'color .3s' }}>{insight}</p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}