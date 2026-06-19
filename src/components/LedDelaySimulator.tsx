'use client';

import { useState, useEffect, useMemo, type SVGProps } from 'react';

/* ════════════════════════════════════════════════════════════════════════
   BUILD MIND — DELAY SIMULATOR
   Premium dark-themed explorer: drag the delay and watch how the LED and the
   human eye react. Deployment-safe (no external deps, cleaned-up interval).
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
const SANS = '"Space Grotesk",sans-serif';
const MONO = '"JetBrains Mono",monospace';

function hexA(hex: string, a: number): string {
  const h = hex.replace('#', '');
  const r = parseInt(h.slice(0, 2), 16), g = parseInt(h.slice(2, 4), 16), b = parseInt(h.slice(4, 6), 16);
  return `rgba(${r},${g},${b},${a})`;
}

type IconProps = SVGProps<SVGSVGElement>;
const BulbIcon = (p: IconProps) => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M9 18h6M10 21h4M12 3a6 6 0 0 0-4 10.5c.7.7 1 1.3 1 2.5h6c0-1.2.3-1.8 1-2.5A6 6 0 0 0 12 3z" /></svg>);
const BoltIcon = (p: IconProps) => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M13 2 4 14h7l-1 8 9-12h-7l1-8z" /></svg>);
const EyeIcon = (p: IconProps) => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7z" /><circle cx="12" cy="12" r="3" /></svg>);
const SparkIcon = (p: IconProps) => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M12 3v3M12 18v3M3 12h3M18 12h3M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M18.4 5.6l-2.1 2.1M7.7 16.3l-2.1 2.1" /></svg>);
const CheckIcon = (p: IconProps) => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M5 13l4 4L19 7" /></svg>);

// perception thresholds (ms of half-cycle)
const FLICKER_FUSION = 20;  // below this the eye fuses it into solid light
const COMFORTABLE = 120;    // at/above this the blink is clearly, comfortably visible

type Zone = 'instant' | 'tooFast' | 'borderline' | 'visible';

export default function LedDelaySimulator() {
  const [delay, setDelay] = useState(0);
  const [ledState, setLedState] = useState(false);

  // LED toggling — only when slow enough to actually toggle
  useEffect(() => {
    if (delay < FLICKER_FUSION) {
      setLedState(true); // perceived as solid ON
      return;
    }
    const id = setInterval(() => setLedState((p) => !p), delay);
    return () => clearInterval(id);
  }, [delay]);

  const zone: Zone = useMemo(() => {
    if (delay === 0) return 'instant';
    if (delay < FLICKER_FUSION) return 'tooFast';
    if (delay < COMFORTABLE) return 'borderline';
    return 'visible';
  }, [delay]);

  const loopsPerSecond = useMemo(() => {
    if (delay === 0) return '3,420,512';
    return Math.round(1000 / (delay * 2)).toLocaleString();
  }, [delay]);

  const cycleMs = delay * 2;

  // zone-driven content
  const zoneTone = zone === 'visible' ? GREEN : zone === 'borderline' ? BLUE : AMBER;
  const zoneToneLt = zone === 'visible' ? GREEN_LT : zone === 'borderline' ? BLUE_LT : AMBER_LT;

  const statusLabel =
    zone === 'instant' ? 'Millions of toggles per second' :
    zone === 'tooFast' ? 'Too fast, the eye sees solid light' :
    zone === 'borderline' ? 'A fast shimmer starts to appear' :
    'A clear, comfortable blink';

  const StatusIcon =
    zone === 'instant' ? BoltIcon :
    zone === 'tooFast' ? EyeIcon :
    zone === 'borderline' ? SparkIcon :
    CheckIcon;

  const explanation =
    zone === 'instant'
      ? 'At zero delay the ESP32 flips the LED on and off millions of times each second. Your eyes blend it into one steady glow, so it looks like the light never changes at all.'
      : zone === 'tooFast'
      ? 'Still faster than the eye can follow. Below about 20ms per state, separate flashes fuse into solid light. Slide further to watch a real blink appear.'
      : zone === 'borderline'
      ? `At ${delay}ms per state the LED flips every ${cycleMs}ms. You start to catch a quick shimmer, right at the edge of what the eye can resolve.`
      : `At ${delay}ms per state the LED finishes one full blink every ${cycleMs}ms. That is slow enough for a clear, easy to watch on and off rhythm.`;

  // slider fill %
  const fillPct = (delay / 1000) * 100;

  return (
    <div className="lds-card" style={{ width: '100%', fontFamily: '"Inter",system-ui,sans-serif' }}>
      <link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet" />

      <style>{`
        .lds-card{background:linear-gradient(160deg,${CARD},#0a1626);border:1px solid ${LINE};border-radius:20px;padding:22px;position:relative;overflow:hidden}
        @keyframes lds-ring{0%{transform:scale(1);opacity:.6}100%{transform:scale(2);opacity:0}}
        @keyframes lds-fade{from{opacity:0;transform:translateY(5px)}to{opacity:1;transform:none}}
        .lds-fade{animation:lds-fade .3s ease both}
        .lds-ring{animation:lds-ring 1.5s ease-out infinite}
        .lds-grid{display:grid;grid-template-columns:1fr 1fr;gap:18px}
        @media (max-width:600px){ .lds-grid{grid-template-columns:1fr} }

        /* custom range slider */
        .lds-range{ -webkit-appearance:none; appearance:none; width:100%; height:8px; border-radius:99px; outline:none; cursor:pointer; }
        .lds-range::-webkit-slider-thumb{
          -webkit-appearance:none; appearance:none; width:22px; height:22px; border-radius:50%;
          background:radial-gradient(circle at 35% 30%,#fff,${GREEN_LT} 60%,${GREEN});
          border:2px solid #fff; box-shadow:0 2px 10px ${hexA(GREEN, 0.6)}, 0 0 0 4px ${hexA(GREEN, 0.15)};
          cursor:pointer; transition:transform .15s;
        }
        .lds-range::-webkit-slider-thumb:hover{ transform:scale(1.12); }
        .lds-range::-moz-range-thumb{
          width:22px; height:22px; border-radius:50%; border:2px solid #fff;
          background:radial-gradient(circle at 35% 30%,#fff,${GREEN_LT} 60%,${GREEN});
          box-shadow:0 2px 10px ${hexA(GREEN, 0.6)}; cursor:pointer;
        }
        @media (prefers-reduced-motion: reduce){ .lds-ring,.lds-fade{animation:none!important} }
      `}</style>

      {/* ambient glow */}
      <div aria-hidden style={{ position: 'absolute', top: -50, right: -30, width: 200, height: 200, borderRadius: '50%', background: `radial-gradient(circle,${hexA(zoneTone, 0.12)},transparent 65%)`, pointerEvents: 'none', transition: 'background .4s' }} />

      {/* ── Header ── */}
      <div style={{ position: 'relative', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, paddingBottom: 16, marginBottom: 18, borderBottom: `1px solid ${LINE}` }}>
        <div style={{ minWidth: 0 }}>
          <h3 style={{ fontFamily: SANS, fontSize: 15, fontWeight: 700, color: TEXT, margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
            <BulbIcon width={16} height={16} style={{ color: AMBER_LT }} /> Delay Simulator
          </h3>
          <p style={{ fontSize: 12, color: MUTED, margin: '5px 0 0', lineHeight: 1.5 }}>
            Drag the delay and watch how the LED and your eye react.
          </p>
        </div>
        <div style={{ flexShrink: 0, textAlign: 'right', background: 'rgba(255,255,255,0.03)', border: `1px solid ${LINE}`, borderRadius: 12, padding: '8px 13px' }}>
          <span style={{ display: 'block', fontSize: 9, fontWeight: 700, color: FAINT, textTransform: 'uppercase', letterSpacing: '0.12em', fontFamily: MONO }}>Loops / sec</span>
          <span style={{ fontSize: 14, fontWeight: 800, fontFamily: SANS, color: GREEN_LT }}>{loopsPerSecond}</span>
        </div>
      </div>

      <div className="lds-grid">

        {/* ── Left: slider + status ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ background: 'rgba(255,255,255,0.03)', border: `1px solid ${LINE}`, borderRadius: 14, padding: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 14 }}>
              <label style={{ fontSize: 10, fontWeight: 700, color: MUTED, textTransform: 'uppercase', letterSpacing: '0.12em', fontFamily: MONO }}>Delay</label>
              <span style={{ background: hexA(GREEN, 0.14), color: GREEN_LT, border: `1px solid ${hexA(GREEN, 0.3)}`, fontFamily: MONO, fontSize: 13, fontWeight: 700, padding: '4px 10px', borderRadius: 9 }}>{delay} ms</span>
            </div>
            <input
              className="lds-range"
              type="range" min={0} max={1000} step={10}
              value={delay}
              onChange={(e) => setDelay(Number(e.target.value))}
              style={{ background: `linear-gradient(90deg, ${GREEN} ${fillPct}%, rgba(255,255,255,0.1) ${fillPct}%)` }}
              aria-label="LED delay in milliseconds"
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8, fontSize: 9.5, color: FAINT, fontFamily: MONO }}>
              <span>0 ms</span><span>1000 ms</span>
            </div>
          </div>

          {/* status */}
          <div className="lds-fade" key={zone} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, borderRadius: 11, padding: '11px 14px', fontSize: 12, fontWeight: 600, color: zoneToneLt, background: hexA(zoneTone, 0.1), border: `1px solid ${hexA(zoneTone, 0.28)}` }}>
            <StatusIcon width={14} height={14} style={{ flexShrink: 0 }} />
            {statusLabel}
          </div>

          {/* explanation */}
          <div className="lds-fade" key={`${zone}-exp`} style={{ borderRadius: 12, background: hexA(BLUE, 0.06), border: `1px solid ${hexA(BLUE, 0.18)}`, padding: '13px 15px' }}>
            <p style={{ fontSize: 12, color: BLUE_LT, lineHeight: 1.6, margin: 0, fontWeight: 500 }}>{explanation}</p>
          </div>
        </div>

        {/* ── Right: LED ── */}
        <div style={{ background: 'rgba(0,0,0,0.25)', border: `1px solid ${LINE}`, borderRadius: 14, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 22, gap: 16 }}>
          <p style={{ alignSelf: 'flex-start', fontSize: 9.5, fontWeight: 700, color: FAINT, textTransform: 'uppercase', letterSpacing: '0.12em', fontFamily: MONO, margin: 0 }}>Physical Output</p>

          <div style={{ position: 'relative', width: 84, height: 84, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {ledState && delay >= FLICKER_FUSION && (
              <span className="lds-ring" style={{ position: 'absolute', inset: 8, borderRadius: '50%', border: `2px solid ${AMBER}`, pointerEvents: 'none' }} />
            )}
            <div style={{
              width: 76, height: 76, borderRadius: '50%', border: '4px solid',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: delay < FLICKER_FUSION ? 'all .2s' : 'all 75ms linear',
              borderColor: ledState ? AMBER_LT : 'rgba(255,255,255,0.12)',
              background: ledState ? `radial-gradient(circle at 35% 30%,#fff6dd,${AMBER_LT} 45%,${AMBER})` : 'rgba(255,255,255,0.05)',
              boxShadow: ledState ? `0 0 46px ${hexA(AMBER, 0.75)}, 0 0 14px ${hexA(AMBER_LT, 0.9)}` : 'none',
            }}>
              <div style={{ width: 34, height: 16, borderRadius: 99, background: 'rgba(255,255,255,0.3)', filter: 'blur(1px)', marginTop: -14 }} />
            </div>
          </div>

          <span style={{ fontFamily: SANS, fontSize: 14, fontWeight: 800, color: ledState ? AMBER_LT : FAINT, letterSpacing: '0.04em', transition: 'color .2s' }}>
            {ledState ? 'LED ON' : 'LED OFF'}
          </span>

          {/* cycle readout */}
          <div style={{ width: '100%', borderTop: `1px solid ${LINE}`, paddingTop: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 9.5, color: FAINT, fontFamily: MONO, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Blink cycle</span>
            <span style={{ fontSize: 12.5, fontWeight: 700, fontFamily: MONO, color: delay < FLICKER_FUSION ? FAINT : zoneToneLt }}>
              {delay < FLICKER_FUSION ? 'none' : `${cycleMs} ms`}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}