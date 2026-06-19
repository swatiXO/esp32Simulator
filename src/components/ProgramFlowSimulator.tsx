'use client';

import { useState, useRef, useEffect, useCallback, useMemo } from 'react';

/* ════════════════════════════════════════════════════════════════════════
   BUILD MIND — PROGRAM FLOW SIMULATOR  (interactive)
   The hands-on capstone: the learner PLACES blocks into setup() vs loop(),
   powers on the ESP32, and sees the consequence of their choices. Tap-to-place
   (touch-friendly), dark-themed, deployment-safe.
   ════════════════════════════════════════════════════════════════════════ */

type BlockId = 'pinmode' | 'on' | 'off' | 'wait';
type Zone = 'setup' | 'loop';

type BlockDef = { id: BlockId; label: string; tone: string; led?: 'on' | 'off' };

const BLOCKS: Record<BlockId, BlockDef> = {
  pinmode: { id: 'pinmode', label: 'Set Pin Mode: OUTPUT', tone: '#8b5cf6' },
  on:      { id: 'on',      label: 'Turn ON LED',          tone: '#f59e0b', led: 'on' },
  off:     { id: 'off',     label: 'Turn OFF LED',         tone: '#64748b', led: 'off' },
  wait:    { id: 'wait',    label: 'Wait 1s',              tone: '#3b82f6' },
};

// The arrangement that makes a proper blink (pinmode in setup; on/wait/off/wait in loop)
const IDEAL_SETUP: BlockId[] = ['pinmode'];
const IDEAL_LOOP: BlockId[] = ['on', 'wait', 'off', 'wait'];

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
const VIOLET = '#8b5cf6';
const SANS = '"Space Grotesk",sans-serif';
const MONO = '"JetBrains Mono",monospace';

function hexA(hex: string, a: number): string {
  const h = hex.replace('#', '');
  const r = parseInt(h.slice(0, 2), 16), g = parseInt(h.slice(2, 4), 16), b = parseInt(h.slice(4, 6), 16);
  return `rgba(${r},${g},${b},${a})`;
}

const SETUP_MS = 900;
const STATE_MS = 350;
const WAIT_MS = 900;
const LOOP_PAUSE = 150;

export default function ProgramFlowSimulator() {
  // placement
  const [setupZone, setSetupZone] = useState<BlockId[]>([]);
  const [loopZone, setLoopZone] = useState<BlockId[]>([]);

  // run state
  const [isRunning, setIsRunning] = useState(false);
  const [activeZone, setActiveZone] = useState<Zone | null>(null);
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [ledOn, setLedOn] = useState(false);
  const [setupCount, setSetupCount] = useState(0);
  const [loopCount, setLoopCount] = useState(0);

  const isRunningRef = useRef(false);
  const setupRef = useRef(setupZone); setupRef.current = setupZone;
  const loopRef = useRef(loopZone); loopRef.current = loopZone;

  useEffect(() => () => { isRunningRef.current = false; }, []);

  const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

  // blocks not yet placed (each block can be placed once)
  const placed = useMemo(() => new Set([...setupZone, ...loopZone]), [setupZone, loopZone]);
  const tray = (Object.keys(BLOCKS) as BlockId[]).filter((id) => !placed.has(id));

  // which zone a tray block is "selected" toward — simple tap model:
  // tap a tray block → it drops into the zone you last tapped, default loop.
  const [target, setTarget] = useState<Zone>('loop');

  const placeBlock = useCallback((id: BlockId) => {
    if (isRunningRef.current) return;
    if (target === 'setup') setSetupZone((z) => [...z, id]);
    else setLoopZone((z) => [...z, id]);
  }, [target]);

  const removeBlock = useCallback((zone: Zone, index: number) => {
    if (isRunningRef.current) return;
    if (zone === 'setup') setSetupZone((z) => z.filter((_, i) => i !== index));
    else setLoopZone((z) => z.filter((_, i) => i !== index));
  }, []);

  const clearAll = useCallback(() => {
    if (isRunningRef.current) return;
    setSetupZone([]); setLoopZone([]);
  }, []);

  // ── correctness (for the success state) ──
  const isCorrect = useMemo(() => {
    const eq = (a: BlockId[], b: BlockId[]) => a.length === b.length && a.every((v, i) => v === b[i]);
    return eq(setupZone, IDEAL_SETUP) && eq(loopZone, IDEAL_LOOP);
  }, [setupZone, loopZone]);

  // ── diagnostics: explain consequences of the current arrangement ──
  const diagnostics = useMemo(() => {
    const msgs: { tone: string; text: string }[] = [];
    if (loopZone.includes('pinmode')) {
      msgs.push({ tone: VIOLET, text: 'Set Pin Mode is in loop() — it will wastefully re-run every cycle. It only needs to happen once, so it belongs in setup().' });
    }
    if (setupZone.includes('on') && !setupZone.includes('off') && !loopZone.includes('on')) {
      msgs.push({ tone: AMBER, text: 'Turn ON is in setup() — the LED switches on once and never blinks, because setup() never runs again.' });
    }
    if ((loopZone.includes('on') || loopZone.includes('off')) && !loopZone.includes('wait')) {
      msgs.push({ tone: AMBER, text: 'No Wait in loop() — the LED switches so fast your eyes only see one state. Add a Wait between ON and OFF.' });
    }
    if (loopZone.length === 0 && setupZone.length > 0) {
      msgs.push({ tone: BLUE, text: 'Nothing in loop() — the program does its setup, then sits idle forever. Put the repeating actions in loop().' });
    }
    return msgs;
  }, [setupZone, loopZone]);

  const togglePower = useCallback(async () => {
    if (isRunningRef.current) {
      isRunningRef.current = false;
      setIsRunning(false);
      setActiveZone(null); setActiveIndex(null);
      setLedOn(false); setSetupCount(0); setLoopCount(0);
      return;
    }

    setIsRunning(true);
    isRunningRef.current = true;
    setSetupCount(0); setLoopCount(0); setLedOn(false);

    // Setup phase — runs each placed setup block once
    const sBlocks = setupRef.current;
    if (sBlocks.length) {
      setActiveZone('setup');
      for (let i = 0; i < sBlocks.length; i++) {
        if (!isRunningRef.current) return;
        setActiveIndex(i);
        const b = BLOCKS[sBlocks[i]];
        if (b.led === 'on') setLedOn(true);
        else if (b.led === 'off') setLedOn(false);
        await sleep(SETUP_MS / Math.max(sBlocks.length, 1));
      }
      setSetupCount(1);
      setActiveIndex(null);
      await sleep(250);
    }

    // Loop phase — forever
    let cycles = 0;
    while (isRunningRef.current) {
      const lBlocks = loopRef.current;
      if (lBlocks.length === 0) { await sleep(300); continue; }

      setActiveZone('loop');
      for (let i = 0; i < lBlocks.length; i++) {
        if (!isRunningRef.current) break;
        setActiveIndex(i);
        const b = BLOCKS[lBlocks[i]];
        if (b.led === 'on') { setLedOn(true); await sleep(STATE_MS); }
        else if (b.led === 'off') { setLedOn(false); await sleep(STATE_MS); }
        else if (b.id === 'wait') { await sleep(WAIT_MS); }
        else { await sleep(STATE_MS); }
      }
      if (!isRunningRef.current) break;
      cycles++;
      setLoopCount(cycles);
      setActiveIndex(-1);
      await sleep(LOOP_PAUSE);
    }
  }, []);

  const canRun = setupZone.length > 0 || loopZone.length > 0;

  return (
    <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 16, fontFamily: '"Inter",system-ui,sans-serif' }}>
      <link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet" />

      <style>{`
        @keyframes pf-pulse{0%,100%{opacity:1;transform:scale(1)}50%{opacity:.45;transform:scale(.7)}}
        @keyframes pf-ring{0%{transform:scale(1);opacity:.6}100%{transform:scale(1.9);opacity:0}}
        @keyframes pf-pop{0%{transform:scale(.6);opacity:0}60%{transform:scale(1.06)}100%{transform:scale(1);opacity:1}}
        @keyframes pf-in{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:none}}
        @keyframes pf-confetti{0%{transform:translateY(0) rotate(0);opacity:1}100%{transform:translateY(60px) rotate(220deg);opacity:0}}
        .pf-card{background:${CARD};border:1px solid ${LINE};border-radius:18px;position:relative}
        .pf-chip{transition:transform .15s, box-shadow .2s, opacity .2s, background .2s; cursor:pointer}
        .pf-chip:hover{transform:translateY(-2px)}
        .pf-chip:active{transform:scale(.95)}
        .pf-dot{animation:pf-pulse 1s ease-in-out infinite}
        .pf-ring{animation:pf-ring 1.6s ease-out infinite}
        .pf-pop{animation:pf-pop .35s cubic-bezier(0.34,1.56,0.64,1) both}
        .pf-in{animation:pf-in .3s cubic-bezier(0.16,1,0.3,1) both}
        .pf-btn{transition:filter .18s, transform .15s, box-shadow .2s, opacity .2s}
        .pf-btn:not(:disabled):hover{filter:brightness(1.08);transform:translateY(-1px)}
        .pf-btn:not(:disabled):active{transform:scale(.98)}
        .pf-btn:disabled{opacity:.4;cursor:not-allowed}
        .pf-conf{position:absolute;top:8px;width:7px;height:9px;border-radius:1px;animation:pf-confetti 1s ease-out forwards}
        @media (prefers-reduced-motion: reduce){ .pf-dot,.pf-ring,.pf-pop,.pf-in,.pf-conf{animation:none!important} }
        @media (max-width:600px){ .pf-main{flex-direction:column !important} .pf-side{width:100% !important} }
      `}</style>

      {/* ── Header ── */}
      <div className="pf-card" style={{ padding: 20, overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: -40, right: -30, width: 150, height: 150, borderRadius: '50%', background: `radial-gradient(circle,${hexA(BLUE, 0.1)},transparent 65%)`, pointerEvents: 'none' }} />
        <div style={{ position: 'relative' }}>
          <h3 style={{ fontFamily: SANS, fontSize: 15, fontWeight: 700, color: TEXT, margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={GREEN_LT} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2v10" /><path d="M18.4 6.6a9 9 0 1 1-12.77.04" /></svg>
            Build the program, then power it on
          </h3>
          <p style={{ fontSize: 12, color: MUTED, margin: '8px 0 0', lineHeight: 1.55 }}>
            Pick a zone, tap blocks to drop them in, then Power ON. <strong style={{ color: TEXT }}>setup() runs once; loop() runs forever</strong> — so where each block goes changes everything.
          </p>
        </div>
      </div>

      <div className="pf-main" style={{ display: 'flex', gap: 14 }}>

        {/* LEFT: zones + tray */}
        <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 14 }}>

          {/* zone target toggle */}
          <div className="pf-card" style={{ padding: 14 }}>
            <p style={{ fontSize: 10, fontWeight: 700, color: FAINT, textTransform: 'uppercase', letterSpacing: '0.12em', fontFamily: MONO, margin: '0 0 10px' }}>
              Tap a block below to add it to:
            </p>
            <div style={{ display: 'flex', gap: 8 }}>
              {(['setup', 'loop'] as Zone[]).map((z) => {
                const on = target === z;
                const tone = z === 'setup' ? AMBER : GREEN;
                return (
                  <button key={z} onClick={() => setTarget(z)} className="pf-btn" disabled={isRunning} style={{
                    flex: 1, padding: '9px', borderRadius: 10, fontFamily: MONO, fontSize: 12.5, fontWeight: 700, cursor: 'pointer',
                    color: on ? '#fff' : MUTED,
                    background: on ? hexA(tone, 0.9) : 'rgba(255,255,255,0.04)',
                    border: `1px solid ${on ? tone : LINE}`,
                  }}>
                    void {z}()
                  </button>
                );
              })}
            </div>
            {/* tray */}
            <div style={{ marginTop: 12, display: 'flex', flexWrap: 'wrap', gap: 7 }}>
              {tray.length === 0 ? (
                <span style={{ fontSize: 11.5, color: FAINT, fontFamily: MONO }}>All blocks placed. Power on to test, or remove one to change it.</span>
              ) : tray.map((id) => {
                const b = BLOCKS[id];
                return (
                  <button key={id} className="pf-chip pf-in" onClick={() => placeBlock(id)} disabled={isRunning} style={{
                    display: 'inline-flex', alignItems: 'center', gap: 7, padding: '8px 12px', borderRadius: 10,
                    fontSize: 12, fontWeight: 700, fontFamily: SANS, color: '#fff',
                    background: hexA(b.tone, 0.16), border: `1.5px solid ${hexA(b.tone, 0.5)}`,
                  }}>
                    <span style={{ width: 8, height: 8, borderRadius: 3, background: b.tone, flexShrink: 0 }} />
                    {b.label}
                    <span style={{ color: hexA('#ffffff', 0.5), fontSize: 13, marginLeft: 2 }}>+</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* SETUP zone */}
          <Zone
            title="void setup()" sub="Runs once at startup" tone={AMBER} toneLt={AMBER_LT}
            active={activeZone === 'setup'} done={setupCount > 0} looping={false}
            blocks={setupZone} activeIndex={activeZone === 'setup' ? activeIndex : null}
            running={isRunning} onRemove={(i) => removeBlock('setup', i)} emptyHint="Tap blocks here for one-time setup (like Set Pin Mode)."
          />

          {/* LOOP zone */}
          <Zone
            title="void loop()" sub="Repeats forever" tone={GREEN} toneLt={GREEN_LT}
            active={activeZone === 'loop'} done={false} looping={activeZone === 'loop'}
            blocks={loopZone} activeIndex={activeZone === 'loop' ? activeIndex : null}
            running={isRunning} onRemove={(i) => removeBlock('loop', i)} emptyHint="Tap blocks here for actions that repeat (ON, Wait, OFF, Wait)."
          />

          {/* controls */}
          <div style={{ display: 'flex', gap: 10 }}>
            <button type="button" onClick={togglePower} disabled={!canRun} className="pf-btn" style={{
              flex: 1, padding: '12px', borderRadius: 12, fontSize: 13.5, fontWeight: 800, fontFamily: SANS, letterSpacing: '0.02em',
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8, cursor: 'pointer', border: 'none', color: '#fff',
              background: isRunning ? 'linear-gradient(135deg,#b91c1c,#ef4444)' : 'linear-gradient(135deg,#065f46,#10b981)',
              boxShadow: isRunning ? '0 10px 24px -10px rgba(239,68,68,0.6)' : '0 10px 24px -10px rgba(16,185,129,0.6)',
            }}>
              {isRunning
                ? (<><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12a9 9 0 1 0 9-9" /><path d="M3 4v5h5" /></svg> Reset</>)
                : (<><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2v10" /><path d="M18.4 6.6a9 9 0 1 1-12.77.04" /></svg> Power ON ESP32</>)}
            </button>
            <button type="button" onClick={clearAll} disabled={isRunning || !canRun} className="pf-btn" style={{
              padding: '12px 16px', borderRadius: 12, fontSize: 13, fontWeight: 700, fontFamily: SANS, cursor: 'pointer',
              color: MUTED, background: 'rgba(255,255,255,0.04)', border: `1px solid ${LINE}`,
            }}>
              Clear
            </button>
          </div>
        </div>

        {/* RIGHT: state + LED */}
        <div className="pf-side" style={{ width: 180, flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div className="pf-card" style={{ padding: 16 }}>
            <p style={{ fontSize: 9.5, fontWeight: 700, color: FAINT, textTransform: 'uppercase', letterSpacing: '0.1em', fontFamily: MONO, margin: '0 0 10px' }}>System State</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <StateRow label="Setup ran" value={`${setupCount}x`} tone={AMBER_LT} check={setupCount > 0} />
              <StateRow label="Loop cycles" value={`${loopCount}`} tone={GREEN_LT} />
            </div>
          </div>

          <div className="pf-card" style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12, padding: 16, minHeight: 150 }}>
            <p style={{ fontSize: 9.5, fontWeight: 700, color: FAINT, textTransform: 'uppercase', letterSpacing: '0.1em', fontFamily: MONO, alignSelf: 'flex-start', margin: 0 }}>LED</p>
            <div style={{ position: 'relative', width: 56, height: 56 }}>
              {ledOn && <span className="pf-ring" style={{ position: 'absolute', inset: 0, borderRadius: '50%', border: `2px solid ${AMBER}`, pointerEvents: 'none' }} />}
              <div style={{
                width: 56, height: 56, borderRadius: '50%', border: '4px solid', transition: 'all .2s cubic-bezier(0.16,1,0.3,1)',
                borderColor: ledOn ? AMBER_LT : 'rgba(255,255,255,0.12)',
                background: ledOn ? `radial-gradient(circle at 35% 30%,${AMBER_LT},${AMBER})` : 'rgba(255,255,255,0.05)',
                boxShadow: ledOn ? `0 0 30px ${hexA(AMBER, 0.65)}` : 'none',
              }} />
            </div>
            <span style={{ fontFamily: SANS, fontSize: 15, fontWeight: 800, color: ledOn ? AMBER_LT : FAINT, transition: 'color .2s' }}>{ledOn ? 'ON' : 'OFF'}</span>
          </div>
        </div>
      </div>

      {/* ── Diagnostics (only when something's off and not the perfect build) ── */}
      {!isCorrect && diagnostics.map((d, i) => (
        <div key={i} className="pf-card pf-in" style={{ display: 'flex', gap: 11, alignItems: 'flex-start', padding: '13px 15px', background: hexA(d.tone, 0.08), borderColor: hexA(d.tone, 0.25) }}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={d.tone} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: 1 }}><path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z" /><path d="M12 9v4M12 17h.01" /></svg>
          <p style={{ fontSize: 12, color: MUTED, margin: 0, lineHeight: 1.55 }}>{d.text}</p>
        </div>
      ))}

      {/* ── Success ── */}
      {isCorrect && (
        <div className="pf-card pf-pop" style={{ position: 'relative', overflow: 'hidden', display: 'flex', alignItems: 'center', gap: 13, padding: '15px 16px', background: hexA(GREEN, 0.08), borderColor: hexA(GREEN, 0.3) }}>
          {!isRunning && [GREEN_LT, AMBER, BLUE, VIOLET, AMBER_LT, GREEN].map((c, i) => (
            <span key={i} className="pf-conf" style={{ left: `${12 + i * 15}%`, background: c, animationDelay: `${i * 0.06}s` }} />
          ))}
          <div style={{ width: 38, height: 38, flexShrink: 0, borderRadius: 11, background: hexA(GREEN, 0.15), color: GREEN_LT, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M5 13l4 4L19 7" /></svg>
          </div>
          <div>
            <p style={{ fontFamily: SANS, fontSize: 14, fontWeight: 700, color: GREEN_LT, margin: 0 }}>Perfect blink program!</p>
            <p style={{ fontSize: 12, color: MUTED, margin: '3px 0 0', lineHeight: 1.5 }}>
              Pin mode is set once in setup(), and the ON / Wait / OFF / Wait cycle repeats forever in loop(). Power it on and watch it blink.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── Zone (setup or loop) ─────────────────────────────────────────────── */
function Zone({ title, sub, tone, toneLt, active, done, looping, blocks, activeIndex, running, onRemove, emptyHint }: {
  title: string; sub: string; tone: string; toneLt: string;
  active: boolean; done: boolean; looping: boolean;
  blocks: BlockId[]; activeIndex: number | null; running: boolean;
  onRemove: (i: number) => void; emptyHint: string;
}) {
  return (
    <div className="pf-card" style={{
      padding: 16, transition: 'border-color .4s, background .4s, opacity .4s',
      borderColor: active ? hexA(tone, 0.45) : LINE,
      background: active ? hexA(tone, 0.06) : CARD,
      opacity: done && !active ? 0.82 : 1,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <div>
          <p style={{ fontFamily: MONO, fontSize: 12.5, fontWeight: 700, color: toneLt, margin: 0 }}>{title}</p>
          <p style={{ fontSize: 10, color: FAINT, margin: '3px 0 0' }}>{sub}</p>
        </div>
        {looping && (
          <span className="pf-pop" style={{ display: 'inline-flex', alignItems: 'center', gap: 5, background: hexA(tone, 0.14), border: `1px solid ${hexA(tone, 0.3)}`, borderRadius: 99, padding: '3px 9px' }}>
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke={toneLt} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 2l4 4-4 4" /><path d="M3 11V9a4 4 0 0 1 4-4h14" /><path d="M7 22l-4-4 4-4" /><path d="M21 13v2a4 4 0 0 1-4 4H3" /></svg>
            <span style={{ fontSize: 9.5, fontWeight: 700, color: toneLt, fontFamily: MONO }}>Looping</span>
          </span>
        )}
        {done && !looping && (
          <span className="pf-pop" style={{ display: 'inline-flex', alignItems: 'center', gap: 5, background: 'rgba(255,255,255,0.05)', border: `1px solid ${LINE}`, borderRadius: 99, padding: '3px 9px' }}>
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke={FAINT} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="4" y="11" width="16" height="9" rx="2" /><path d="M8 11V7a4 4 0 0 1 8 0v4" /></svg>
            <span style={{ fontSize: 9.5, fontWeight: 700, color: FAINT, fontFamily: MONO }}>Locked</span>
          </span>
        )}
      </div>

      {blocks.length === 0 ? (
        <div style={{ borderRadius: 11, border: `1.5px dashed ${hexA(tone, 0.3)}`, padding: '16px 14px', textAlign: 'center' }}>
          <p style={{ fontSize: 11.5, color: FAINT, margin: 0, lineHeight: 1.5 }}>{emptyHint}</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, position: 'relative', paddingLeft: 16 }}>
          <div style={{ position: 'absolute', left: 5, top: 8, bottom: 8, width: 2, background: 'rgba(255,255,255,0.08)', borderRadius: 99 }} />
          {blocks.map((id, i) => {
            const b = BLOCKS[id];
            const isAct = activeIndex === i;
            return (
              <div key={`${id}-${i}`} style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ position: 'absolute', left: -11, width: 10, height: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', background: active ? hexA(tone, 0.06) : CARD, borderRadius: '50%' }}>
                  {isAct
                    ? <span className="pf-dot" style={{ width: 9, height: 9, borderRadius: '50%', background: tone, boxShadow: `0 0 7px ${hexA(tone, 0.8)}` }} />
                    : <span style={{ width: 5, height: 5, borderRadius: '50%', background: 'rgba(255,255,255,0.2)' }} />}
                </div>
                <div className="pf-chip" onClick={() => onRemove(i)} title={running ? '' : 'Tap to remove'} style={{
                  flex: 1, minWidth: 0, borderRadius: 10, padding: '9px 12px', fontSize: 12, fontWeight: 700, fontFamily: SANS,
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8,
                  border: `2px solid ${isAct ? b.tone : 'transparent'}`,
                  background: hexA(b.tone, isAct ? 0.22 : 0.13), color: '#fff', opacity: isAct ? 1 : 0.78,
                  transform: isAct ? 'scale(1.02)' : 'none',
                  boxShadow: isAct ? `0 6px 18px -8px ${hexA(b.tone, 0.7)}` : 'none',
                  cursor: running ? 'default' : 'pointer', transition: 'all .15s',
                }}>
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{b.label}</span>
                  {!running && <span style={{ color: 'rgba(255,255,255,0.45)', fontSize: 14, flexShrink: 0 }}>×</span>}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ─── State row ────────────────────────────────────────────────────────── */
function StateRow({ label, value, tone, check }: { label: string; value: string; tone: string; check?: boolean }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.03)', border: `1px solid ${LINE}`, borderRadius: 10, padding: '8px 12px' }}>
      <span style={{ fontSize: 10, color: MUTED, fontFamily: MONO }}>{label}</span>
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
        <span style={{ fontSize: 14, fontWeight: 800, fontFamily: SANS, color: tone }}>{value}</span>
        {check && <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={tone} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 13l4 4L19 7" /></svg>}
      </span>
    </div>
  );
}