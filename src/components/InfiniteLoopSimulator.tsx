'use client';

import { useState, useRef, useEffect, useCallback, useMemo } from 'react';

/* ════════════════════════════════════════════════════════════════════════
   BUILD MIND — INFINITE LOOP SIMULATOR
   A build-your-own void loop() sandbox. Kids assemble instructions, run them
   on a simulated LED with a moving playhead, and get plain-language warnings
   for the classic beginner bugs. Dark-themed, deployment-safe.
   ════════════════════════════════════════════════════════════════════════ */

type BlockAction = 'Turn ON' | 'Turn OFF' | 'Delay (1s)' | 'Empty';
const BLOCK_OPTIONS: BlockAction[] = ['Turn ON', 'Turn OFF', 'Delay (1s)', 'Empty'];

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
const SLATE = '#64748b';
const SANS = '"Space Grotesk",sans-serif';
const MONO = '"JetBrains Mono",monospace';

function hexA(hex: string, a: number): string {
  const h = hex.replace('#', '');
  const r = parseInt(h.slice(0, 2), 16), g = parseInt(h.slice(2, 4), 16), b = parseInt(h.slice(4, 6), 16);
  return `rgba(${r},${g},${b},${a})`;
}

// per-action accent + label color
const ACTION_TONE: Record<BlockAction, string> = {
  'Turn ON': AMBER,
  'Turn OFF': SLATE,
  'Delay (1s)': BLUE,
  'Empty': '#475569',
};

const READ_SPEED = 320;
const DELAY_MS = 1000;
const LOOP_PAUSE = 180;

export default function InfiniteLoopSimulator() {
  const [slots, setSlots] = useState<BlockAction[]>(['Turn ON', 'Delay (1s)', 'Turn OFF', 'Delay (1s)']);
  const [activeSlot, setActiveSlot] = useState<number | null>(null);
  const [ledOn, setLedOn] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [cycleCount, setCycleCount] = useState(0);

  const isRunningRef = useRef(false);
  const slotsRef = useRef(slots);
  slotsRef.current = slots; // always read the latest slots inside the async loop

  // Stop the loop if the component unmounts mid-run.
  useEffect(() => () => { isRunningRef.current = false; }, []);

  const handleSlotChange = useCallback((index: number, value: BlockAction) => {
    setSlots((prev) => {
      const next = [...prev];
      next[index] = value;
      return next;
    });
  }, []);

  const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

  const toggleLoop = useCallback(async () => {
    if (isRunningRef.current) {
      setIsRunning(false);
      isRunningRef.current = false;
      setActiveSlot(null);
      return;
    }

    setIsRunning(true);
    isRunningRef.current = true;
    setCycleCount(0);
    setLedOn(false);

    let currentSlot = 0;
    let cycles = 0;

    while (isRunningRef.current) {
      const current = slotsRef.current;
      if (currentSlot >= current.length) currentSlot = 0;

      setActiveSlot(currentSlot);
      const action = current[currentSlot];

      if (action === 'Turn ON') { setLedOn(true); await sleep(READ_SPEED); }
      else if (action === 'Turn OFF') { setLedOn(false); await sleep(READ_SPEED); }
      else if (action === 'Delay (1s)') { await sleep(DELAY_MS); }
      else { await sleep(0); }

      if (!isRunningRef.current) break;

      currentSlot++;
      if (currentSlot >= current.length) {
        currentSlot = 0;
        cycles++;
        setCycleCount(cycles);
        setActiveSlot(-1);
        await sleep(LOOP_PAUSE);
      }
    }
  }, []);

  // ── Diagnostics (memoised) ──
  const { hasMissingDelay, hasNoOffState } = useMemo(() => {
    const onCount = slots.filter((s) => s === 'Turn ON').length;
    const offCount = slots.filter((s) => s === 'Turn OFF').length;
    const delayCount = slots.filter((s) => s === 'Delay (1s)').length;
    return {
      hasMissingDelay: onCount > 0 && offCount > 0 && delayCount < 1,
      hasNoOffState: onCount > 0 && offCount === 0,
    };
  }, [slots]);

  return (
    <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 16, fontFamily: '"Inter",system-ui,sans-serif' }}>
      <link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet" />

      <style>{`
        @keyframes lp-pulse{0%,100%{opacity:1;transform:scale(1)}50%{opacity:.45;transform:scale(.7)}}
        @keyframes lp-ring{0%{transform:scale(1);opacity:.6}100%{transform:scale(1.9);opacity:0}}
        @keyframes lp-pop{0%{transform:scale(.6);opacity:0}60%{transform:scale(1.06)}100%{transform:scale(1);opacity:1}}
        @keyframes lp-flow{to{stroke-dashoffset:-12}}
        .lp-card{background:${CARD};border:1px solid ${LINE};border-radius:18px;position:relative}
        .lp-slot{transition:transform .18s cubic-bezier(0.16,1,0.3,1), box-shadow .2s, border-color .2s, background .2s}
        .lp-select{appearance:none;-webkit-appearance:none;background:transparent;border:none;outline:none;width:100%;cursor:pointer;font-weight:700;font-family:${SANS};font-size:13px;letter-spacing:0.02em}
        .lp-select:disabled{cursor:not-allowed}
        .lp-select option{background:#0a1626;color:#eaf0fa;font-weight:600}
        .lp-btn{transition:filter .18s, transform .15s, box-shadow .2s}
        .lp-btn:hover{filter:brightness(1.08);transform:translateY(-1px)}
        .lp-btn:active{transform:scale(.98)}
        .lp-dot{animation:lp-pulse 1s ease-in-out infinite}
        .lp-ring{animation:lp-ring 1.6s ease-out infinite}
        .lp-diag{animation:lp-pop .35s cubic-bezier(0.34,1.56,0.64,1) both}
        .lp-exec{animation:lp-pop .3s cubic-bezier(0.34,1.56,0.64,1) both}
        @media (prefers-reduced-motion: reduce){
          .lp-dot,.lp-ring,.lp-diag,.lp-exec,.lp-slot{animation:none!important}
        }
      `}</style>

      {/* ── Header ── */}
      <div className="lp-card" style={{ padding: 20, overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: -40, right: -30, width: 160, height: 160, borderRadius: '50%', background: `radial-gradient(circle,${hexA(GREEN, 0.08)},transparent 65%)`, pointerEvents: 'none' }} />
        <div style={{ position: 'relative' }}>
          <h3 style={{ fontFamily: SANS, fontSize: 15, fontWeight: 700, color: TEXT, margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={GREEN_LT} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 2l4 4-4 4" /><path d="M3 11V9a4 4 0 0 1 4-4h14" /><path d="M7 22l-4-4 4-4" /><path d="M21 13v2a4 4 0 0 1-4 4H3" /></svg>
            <code style={{ fontFamily: MONO, fontSize: 14, color: GREEN_LT }}>void loop()</code> — build your own sequence
          </h3>
          <p style={{ fontSize: 12, color: MUTED, margin: '8px 0 0', lineHeight: 1.55 }}>
            Each block is a slot in your program. <strong style={{ color: TEXT }}>Tap a slot to change what it does</strong>, build your sequence, then press Run to watch it execute.
          </p>
          <div style={{ marginTop: 12, display: 'flex', alignItems: 'center', gap: 7, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 9.5, fontWeight: 700, color: FAINT, textTransform: 'uppercase', letterSpacing: '0.1em', fontFamily: MONO }}>Try:</span>
            {[
              { t: 'Swap ON and OFF', c: AMBER },
              { t: 'Remove a Delay', c: '#ef4444' },
              { t: 'Set a slot to Empty', c: SLATE },
            ].map((chip) => (
              <span key={chip.t} style={{ fontSize: 10, fontWeight: 600, color: chip.c, background: hexA(chip.c, 0.1), border: `1px solid ${hexA(chip.c, 0.25)}`, borderRadius: 7, padding: '3px 9px' }}>{chip.t}</span>
            ))}
          </div>
        </div>
      </div>

      {/* ── Builder + LED ── */}
      <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>

        {/* Builder */}
        <div className="lp-card" style={{ flex: '1 1 320px', minWidth: 0, padding: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <p style={{ fontSize: 10, fontWeight: 700, color: FAINT, textTransform: 'uppercase', letterSpacing: '0.14em', fontFamily: MONO, margin: 0 }}>Instructions</p>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(255,255,255,0.03)', border: `1px solid ${LINE}`, borderRadius: 10, padding: '5px 12px' }}>
              <span style={{ fontSize: 9, color: FAINT, textTransform: 'uppercase', letterSpacing: '0.1em', fontFamily: MONO }}>Cycles</span>
              <span style={{ fontSize: 15, fontWeight: 800, fontFamily: SANS, color: GREEN_LT, lineHeight: 1, minWidth: 18, textAlign: 'right' }}>{cycleCount}</span>
            </div>
          </div>

          {/* slots with execution wire */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, position: 'relative', paddingLeft: 22 }}>
            {/* vertical wire */}
            <div style={{ position: 'absolute', left: 8, top: 12, bottom: 12, width: 2, background: 'rgba(255,255,255,0.08)', borderRadius: 99 }} />
            {/* loop-return bracket */}
            <div style={{ position: 'absolute', left: -4, top: 12, bottom: 12, width: 12, borderLeft: '2px solid', borderTop: '2px solid', borderBottom: '2px solid', borderColor: activeSlot === -1 ? GREEN : 'rgba(255,255,255,0.08)', borderRadius: '8px 0 0 8px', transition: 'border-color .25s' }} />

            {slots.map((block, index) => {
              const active = activeSlot === index;
              const tone = ACTION_TONE[block];
              return (
                <div key={index} style={{ display: 'flex', alignItems: 'center', gap: 12, position: 'relative' }}>
                  {/* playhead dot */}
                  <div style={{ position: 'absolute', left: -17, width: 12, height: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', background: CARD, borderRadius: '50%' }}>
                    {active ? (
                      <span className="lp-dot" style={{ width: 10, height: 10, borderRadius: '50%', background: GREEN, boxShadow: `0 0 8px ${hexA(GREEN, 0.8)}` }} />
                    ) : (
                      <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'rgba(255,255,255,0.2)' }} />
                    )}
                  </div>

                  {/* slot */}
                  <div className="lp-slot" style={{
                    flex: 1, minWidth: 0, borderRadius: 12, padding: '11px 14px',
                    border: `2px solid ${active ? tone : hexA(tone, 0.35)}`,
                    background: block === 'Empty' ? 'rgba(255,255,255,0.03)' : hexA(tone, active ? 0.22 : 0.13),
                    boxShadow: active ? `0 8px 22px -10px ${hexA(tone, 0.7)}` : 'none',
                    transform: active ? 'scale(1.02)' : 'none',
                  }}>
                    <select
                      value={block}
                      onChange={(e) => handleSlotChange(index, e.target.value as BlockAction)}
                      disabled={isRunning}
                      className="lp-select"
                      style={{ color: block === 'Empty' ? FAINT : '#fff' }}
                    >
                      {BLOCK_OPTIONS.map((opt) => (<option key={opt} value={opt}>{opt}</option>))}
                    </select>
                  </div>
                </div>
              );
            })}
          </div>

          {/* run / stop */}
          <button
            type="button"
            onClick={toggleLoop}
            className="lp-btn"
            style={{
              marginTop: 18, width: '100%', padding: '12px', borderRadius: 12,
              fontSize: 13.5, fontWeight: 800, fontFamily: SANS, letterSpacing: '0.02em',
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              cursor: 'pointer', border: 'none', color: '#fff',
              background: isRunning ? 'linear-gradient(135deg,#b91c1c,#ef4444)' : 'linear-gradient(135deg,#065f46,#10b981)',
              boxShadow: isRunning ? '0 10px 24px -10px rgba(239,68,68,0.6)' : '0 10px 24px -10px rgba(16,185,129,0.6)',
            }}
          >
            {isRunning ? (
              <><svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><rect x="5" y="5" width="14" height="14" rx="2" /></svg> Stop</>
            ) : (
              <><svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z" /></svg> Run Loop</>
            )}
          </button>
        </div>

        {/* LED + status */}
        <div style={{ width: 188, flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div className="lp-card" style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 14, padding: 18 }}>
            <p style={{ fontSize: 9.5, fontWeight: 700, color: FAINT, textTransform: 'uppercase', letterSpacing: '0.12em', fontFamily: MONO, alignSelf: 'flex-start', margin: 0 }}>LED Output</p>
            <div style={{ position: 'relative', width: 64, height: 64 }}>
              {ledOn && <span className="lp-ring" style={{ position: 'absolute', inset: 0, borderRadius: '50%', border: `2px solid ${AMBER}`, pointerEvents: 'none' }} />}
              <div style={{
                width: 64, height: 64, borderRadius: '50%', border: '4px solid',
                transition: 'all .2s cubic-bezier(0.16,1,0.3,1)',
                borderColor: ledOn ? AMBER_LT : 'rgba(255,255,255,0.12)',
                background: ledOn ? `radial-gradient(circle at 35% 30%,${AMBER_LT},${AMBER})` : 'rgba(255,255,255,0.05)',
                boxShadow: ledOn ? `0 0 34px ${hexA(AMBER, 0.65)}` : 'none',
              }} />
            </div>
            <span style={{ fontFamily: SANS, fontSize: 16, fontWeight: 800, color: ledOn ? AMBER_LT : FAINT, transition: 'color .2s' }}>{ledOn ? 'ON' : 'OFF'}</span>
          </div>

          {isRunning && activeSlot !== null && activeSlot >= 0 && (
            <div key={activeSlot} className="lp-exec lp-card" style={{ padding: 13 }}>
              <p style={{ fontSize: 9, color: FAINT, textTransform: 'uppercase', letterSpacing: '0.1em', fontFamily: MONO, margin: '0 0 4px' }}>Executing</p>
              <p style={{ fontSize: 12, fontWeight: 700, color: TEXT, margin: 0, fontFamily: SANS }}>
                Slot {activeSlot + 1}: <span style={{ color: ACTION_TONE[slots[activeSlot]] === '#475569' ? FAINT : '#fff' }}>{slots[activeSlot]}</span>
              </p>
            </div>
          )}
        </div>
      </div>

      {/* ── Diagnostics ── */}
      {hasMissingDelay && (
        <Diagnostic
          tone={AMBER}
          title="Missing delay — the LED may look always ON"
          body="With no delay between ON and OFF, the ESP32 switches so fast your eyes only catch the final state. Add a Delay slot between them."
        />
      )}
      {hasNoOffState && (
        <Diagnostic
          tone={BLUE}
          title="No OFF instruction"
          body="Your loop only turns the LED ON, never OFF — so it stays lit no matter how many cycles run. Add a Turn OFF slot to make it blink."
        />
      )}
    </div>
  );
}

/* ─── Diagnostic card ─────────────────────────────────────────────────── */
function Diagnostic({ tone, title, body }: { tone: string; title: string; body: string }) {
  return (
    <div className="lp-card lp-diag" style={{ display: 'flex', gap: 11, alignItems: 'flex-start', padding: '13px 15px', background: hexA(tone, 0.08), borderColor: hexA(tone, 0.25) }}>
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={tone} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: 1 }}><path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z" /><path d="M12 9v4M12 17h.01" /></svg>
      <div>
        <p style={{ fontSize: 12.5, fontWeight: 700, color: tone, margin: 0 }}>{title}</p>
        <p style={{ fontSize: 12, color: MUTED, margin: '3px 0 0', lineHeight: 1.55 }}>{body}</p>
      </div>
    </div>
  );
}