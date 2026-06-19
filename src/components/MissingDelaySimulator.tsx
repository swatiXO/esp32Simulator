'use client';

import { useState, useEffect, useMemo, useCallback, type SVGProps } from 'react';

/* ════════════════════════════════════════════════════════════════════════
   BUILD MIND — MISSING DELAY SIMULATOR
   Shows why an ON/OFF loop with no delay looks permanently lit: the ESP32
   toggles millions of times per second, faster than the eye can resolve.
   Premium dark theme, deployment-safe. Uses real WROOM pin (2), not 48.
   ════════════════════════════════════════════════════════════════════════ */

// ── tokens ──
const CARD = '#0f1c30';
const LINE = 'rgba(255,255,255,0.08)';
const TEXT = '#eaf0fa';
const MUTED = 'rgba(234,240,250,0.55)';
const FAINT = 'rgba(234,240,250,0.35)';
const AMBER = '#f59e0b';
const AMBER_LT = '#fbbf24';
const BLUE = '#3b82f6';
const BLUE_LT = '#93c5fd';
const GREEN = '#10b981';
const GREEN_LT = '#34d399';
const SLATE = '#64748b';
const SANS = '"Space Grotesk",sans-serif';
const MONO = '"JetBrains Mono",monospace';

// Real ESP32 WROOM-32 built-in LED pin (NOT 48 — that is ESP32-S3).
const LED_PIN = '2';

function hexA(hex: string, a: number): string {
  const h = hex.replace('#', '');
  const r = parseInt(h.slice(0, 2), 16), g = parseInt(h.slice(2, 4), 16), b = parseInt(h.slice(4, 6), 16);
  return `rgba(${r},${g},${b},${a})`;
}

type IconProps = SVGProps<SVGSVGElement>;
const PlayIcon = (p: IconProps) => (<svg viewBox="0 0 24 24" fill="currentColor" {...p}><path d="M8 5v14l11-7z" /></svg>);
const StopIcon = (p: IconProps) => (<svg viewBox="0 0 24 24" fill="currentColor" {...p}><rect x="5" y="5" width="14" height="14" rx="2" /></svg>);
const PinIcon = (p: IconProps) => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M12 2v6M12 8 9 5M12 8l3-3" /><rect x="4" y="8" width="16" height="13" rx="2" /></svg>);
const BulbIcon = (p: IconProps) => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M9 18h6M10 21h4M12 3a6 6 0 0 0-4 10.5c.7.7 1 1.3 1 2.5h6c0-1.2.3-1.8 1-2.5A6 6 0 0 0 12 3z" /></svg>);
const PowerOffIcon = (p: IconProps) => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M18.4 6.6a9 9 0 1 1-12.8 0M12 2v8" /></svg>);
const WarnIcon = (p: IconProps) => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z" /><path d="M12 9v4M12 17h.01" /></svg>);
const HandIcon = (p: IconProps) => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M18 11V6a2 2 0 0 0-4 0M14 10V4a2 2 0 0 0-4 0v2M10 10.5V6a2 2 0 0 0-4 0v8M18 8a2 2 0 1 1 4 0v6a8 8 0 0 1-8 8h-2c-2.8 0-4.5-.86-5.99-2.34l-3.6-3.6a2 2 0 0 1 2.83-2.82L7 15" /></svg>);

export default function MissingDelaySimulator() {
  const [isRunning, setIsRunning] = useState(false);
  const [activeBlock, setActiveBlock] = useState<number | null>(null);
  const [loopsPerSec, setLoopsPerSec] = useState(0);

  useEffect(() => {
    if (!isRunning) { setActiveBlock(null); setLoopsPerSec(0); return; }
    const id = setInterval(() => {
      setActiveBlock((prev) => (prev === 1 ? 2 : 1));
      const base = 3_420_000;
      const jitter = Math.floor(Math.random() * 50_000) - 25_000;
      setLoopsPerSec(base + jitter);
    }, 50);
    return () => clearInterval(id);
  }, [isRunning]);

  const toggle = useCallback(() => setIsRunning((r) => !r), []);

  const blocks = useMemo(() => ([
    { id: 0, Icon: PinIcon, tone: VIOLET_TONE, label: <>Set Pin <PinChip pin={LED_PIN} /> as OUTPUT</>, dim: true },
    { id: 1, Icon: BulbIcon, tone: AMBER, label: <>Turn ON LED on Pin <PinChip pin={LED_PIN} /></> },
    { id: 2, Icon: PowerOffIcon, tone: SLATE, label: <>Turn OFF LED on Pin <PinChip pin={LED_PIN} /></> },
  ]), []);

  return (
    <div style={{ width: '100%', fontFamily: '"Inter",system-ui,sans-serif' }}>
      <link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet" />

      <style>{`
        @keyframes md-pulse{0%,100%{opacity:1;transform:scale(1)}50%{opacity:.4;transform:scale(.7)}}
        @keyframes md-buzz{0%,100%{transform:translate(0,0)}25%{transform:translate(0.5px,-0.5px)}75%{transform:translate(-0.5px,0.5px)}}
        @keyframes md-fade{from{opacity:0;transform:translateY(5px)}to{opacity:1;transform:none}}
        .md-shell{background:linear-gradient(160deg,${CARD},#0a1626);border:1px solid ${LINE};border-radius:20px;padding:22px;display:flex;gap:20px}
        .md-fade{animation:md-fade .3s ease both}
        .md-dot{animation:md-pulse .4s ease-in-out infinite}
        .md-buzz{animation:md-buzz .12s linear infinite}
        .md-btn{transition:filter .18s, transform .15s, box-shadow .2s}
        .md-btn:hover{filter:brightness(1.08);transform:translateY(-1px)}
        .md-btn:active{transform:scale(.98)}
        @media (max-width:680px){ .md-shell{flex-direction:column} }
        @media (prefers-reduced-motion: reduce){ .md-dot,.md-buzz,.md-fade{animation:none!important} }
      `}</style>

      <div className="md-shell">

        {/* ── Left: program ── */}
        <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
          <div style={{ paddingBottom: 14, marginBottom: 16, borderBottom: `1px solid ${LINE}` }}>
            <h3 style={{ fontFamily: SANS, fontSize: 15, fontWeight: 700, color: TEXT, margin: 0 }}>Your Program</h3>
            <p style={{ fontSize: 12, color: MUTED, margin: '4px 0 0' }}>No delays, so it runs at full CPU speed.</p>
          </div>

          {/* blocks with execution wire */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, position: 'relative', paddingLeft: 20 }}>
            <div style={{ position: 'absolute', left: 7, top: 12, bottom: 12, width: 2, background: 'rgba(255,255,255,0.08)', borderRadius: 99 }} />
            {blocks.map((b) => {
              const active = activeBlock === b.id;
              return (
                <div key={b.id} style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ position: 'absolute', left: -13, width: 12, height: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', background: CARD, borderRadius: '50%' }}>
                    {active
                      ? <span className="md-dot" style={{ width: 10, height: 10, borderRadius: '50%', background: GREEN, boxShadow: `0 0 8px ${hexA(GREEN, 0.9)}` }} />
                      : <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'rgba(255,255,255,0.2)' }} />}
                  </div>
                  <div style={{
                    flex: 1, minWidth: 0, display: 'flex', alignItems: 'center', gap: 9, borderRadius: 12, padding: '10px 13px',
                    fontSize: 12, fontWeight: 700, fontFamily: SANS, color: '#fff',
                    background: hexA(b.tone, active ? 0.28 : b.dim ? 0.13 : 0.18),
                    border: `2px solid ${active ? b.tone : 'transparent'}`,
                    opacity: b.dim && !active ? 0.62 : 1,
                    transform: active ? 'scale(1.02)' : 'none',
                    boxShadow: active ? `0 8px 20px -10px ${hexA(b.tone, 0.7)}` : 'none',
                    transition: 'all 75ms linear',
                  }}>
                    <b.Icon width={15} height={15} style={{ flexShrink: 0, opacity: 0.9 }} />
                    <span style={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>{b.label}</span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* speed counter */}
          <div style={{ marginTop: 16, display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(255,255,255,0.03)', border: `1px solid ${LINE}`, borderRadius: 11, padding: '11px 14px' }}>
            <span style={{ fontSize: 11.5, color: MUTED, fontWeight: 600 }}>CPU Speed</span>
            <div style={{ textAlign: 'right' }}>
              <span style={{ display: 'block', fontSize: 9, color: FAINT, fontFamily: MONO, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Loops per second</span>
              <span className={isRunning ? 'md-buzz' : ''} style={{ display: 'inline-block', fontSize: 15, fontWeight: 800, fontFamily: MONO, color: isRunning ? GREEN_LT : FAINT }}>
                {loopsPerSec > 0 ? loopsPerSec.toLocaleString() : '0'}
              </span>
            </div>
          </div>

          {/* run button */}
          <button type="button" onClick={toggle} className="md-btn" style={{
            marginTop: 14, width: '100%', padding: '12px', borderRadius: 12, fontSize: 13.5, fontWeight: 800,
            fontFamily: SANS, letterSpacing: '0.02em', display: 'inline-flex', alignItems: 'center',
            justifyContent: 'center', gap: 8, cursor: 'pointer', border: 'none', color: '#fff',
            background: isRunning ? 'linear-gradient(135deg,#b91c1c,#ef4444)' : 'linear-gradient(135deg,#065f46,#10b981)',
            boxShadow: isRunning ? '0 10px 24px -10px rgba(239,68,68,0.6)' : '0 10px 24px -10px rgba(16,185,129,0.6)',
          }}>
            {isRunning ? (<><StopIcon width={13} height={13} /> Stop</>) : (<><PlayIcon width={13} height={13} /> Run Simulation</>)}
          </button>
        </div>

        {/* ── Right: LED output ── */}
        <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ flex: 1, minHeight: 168, borderRadius: 14, background: 'rgba(0,0,0,0.25)', border: `1px solid ${LINE}`, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden' }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
              <div style={{ position: 'relative', width: 84, height: 84, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div className={isRunning ? 'md-buzz' : ''} style={{
                  width: 80, height: 80, borderRadius: '50%', border: '4px solid',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  transition: 'all 75ms linear',
                  borderColor: isRunning ? AMBER_LT : 'rgba(255,255,255,0.12)',
                  background: isRunning ? `radial-gradient(circle at 35% 30%,#fff6dd,${AMBER_LT} 45%,${AMBER})` : 'rgba(255,255,255,0.05)',
                  boxShadow: isRunning ? `0 0 48px ${hexA(AMBER, 0.8)}, 0 0 16px ${hexA(AMBER_LT, 0.9)}` : 'none',
                }}>
                  <BulbIcon width={34} height={34} style={{ color: isRunning ? '#7c4a03' : FAINT }} />
                </div>
              </div>
              <span style={{ fontFamily: SANS, fontSize: 13, fontWeight: 800, color: isRunning ? AMBER_LT : FAINT, letterSpacing: '0.03em' }}>
                {isRunning ? 'Appears always ON' : 'LED off'}
              </span>
            </div>
          </div>

          {isRunning ? (
            <div className="md-fade" style={{ display: 'flex', gap: 10, borderRadius: 12, background: hexA(AMBER, 0.08), border: `1px solid ${hexA(AMBER, 0.25)}`, padding: '13px 15px' }}>
              <WarnIcon width={15} height={15} style={{ color: AMBER_LT, flexShrink: 0, marginTop: 1 }} />
              <div>
                <p style={{ fontSize: 12.5, fontWeight: 700, color: AMBER_LT, margin: 0 }}>Why does it look always on?</p>
                <p style={{ fontSize: 12, color: MUTED, margin: '4px 0 0', lineHeight: 1.55 }}>
                  The LED is really blinking millions of times every second, far too fast for your eyes to follow. It looks solid, but the code is running perfectly. Next, you will learn how to slow it down so the blink becomes visible.
                </p>
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', gap: 10, borderRadius: 12, background: hexA(BLUE, 0.06), border: `1px solid ${hexA(BLUE, 0.18)}`, padding: '13px 15px' }}>
              <HandIcon width={15} height={15} style={{ color: BLUE_LT, flexShrink: 0, marginTop: 1 }} />
              <p style={{ fontSize: 12, color: BLUE_LT, margin: 0, lineHeight: 1.55 }}>
                Press <strong style={{ color: '#fff' }}>Run Simulation</strong> to see what happens when you turn an LED on and off with no delay in between.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

const VIOLET_TONE = '#8b5cf6';

/* ─── pin chip ─────────────────────────────────────────────────────────── */
function PinChip({ pin }: { pin: string }) {
  return (
    <span style={{ display: 'inline-block', background: 'rgba(0,0,0,0.28)', borderRadius: 5, padding: '1px 6px', margin: '0 2px', fontFamily: MONO, fontWeight: 700 }}>{pin}</span>
  );
}