'use client';

import { useState, useCallback, type SVGProps } from 'react';

/* ════════════════════════════════════════════════════════════════════════
   BUILD MIND — BUTTON SIGNAL EXPLORER  (circuit layout)
   Press a real wired button; current flows along the trace into the ESP32,
   the pin reads HIGH/LOW, and the code updates live. Dark-themed, SVG-only,
   deployment-safe, no emojis.
   ════════════════════════════════════════════════════════════════════════ */

const INSIGHTS = [
  'A button is an input device. It sends a signal to the ESP32 when pressed.',
  'When pressed, the button completes a circuit and the pin reads HIGH (1).',
  'When released, the circuit is open and the pin reads LOW (0).',
  'The ESP32 stores this reading as a number: 1 for pressed, 0 for not pressed.',
];

const LED_PIN = '4';

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
const ClickIcon = (p: IconProps) => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M9 9l5 12 1.8-5.2L21 14 9 9z" /><path d="M7.2 2.2 8 5.1M5.1 8 2.2 7.2M14 4.1 12 6M6 12l-2 2" /></svg>);

export default function ButtonSignalExplorer() {
  const [pressed, setPressed] = useState(false);
  const [insightIndex, setInsightIndex] = useState(0);
  const [pressCount, setPressCount] = useState(0);

  const handlePress = useCallback(() => {
    setPressed(true);
    setPressCount((prev) => {
      const next = prev + 1;
      if (next === 1) setInsightIndex((idx) => Math.max(idx, 1));
      if (next === 2) setInsightIndex((idx) => Math.max(idx, 2));
      return next;
    });
  }, []);

  const handleRelease = useCallback(() => {
    setPressed(false);
    setPressCount((c) => { if (c >= 1) setInsightIndex((idx) => Math.max(idx, 3)); return c; });
  }, []);

  const signal = pressed ? 1 : 0;
  const wireColor = pressed ? GREEN : 'rgba(255,255,255,0.12)';

  return (
    <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 16, fontFamily: '"Inter",system-ui,sans-serif' }}>
      <link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;700&display=swap" rel="stylesheet" />

      <style>{`
        @keyframes bs-flow{to{stroke-dashoffset:-32}}
        @keyframes bs-fade{from{opacity:0;transform:translateY(4px)}to{opacity:1;transform:none}}
        @keyframes bs-pinglow{0%,100%{opacity:.7}50%{opacity:1}}
        .bs-card{background:${CARD};border:1px solid ${LINE};border-radius:18px;position:relative}
        .bs-fade{animation:bs-fade .25s ease both}
        .bs-flow{stroke-dasharray:9 7;animation:bs-flow .55s linear infinite}
        .bs-pinglow{animation:bs-pinglow 1.2s ease-in-out infinite}
        .bs-press{user-select:none;-webkit-user-select:none;touch-action:manipulation;cursor:pointer;transition:transform .07s}
        .bs-press:active{transform:translateY(2px)}
        .bs-insight{transition:background .3s, border-color .3s, opacity .3s}
        .bs-stage{transition:border-color .25s, background .25s}
        .bs-code-wrap{flex:1 1 280px;min-width:0}
        .bs-circuit-wrap{flex:2 1 420px;min-width:0}
        @media (max-width:720px){ .bs-main{flex-direction:column !important} }
        @media (prefers-reduced-motion: reduce){ .bs-flow,.bs-fade,.bs-pinglow{animation:none!important} }
      `}</style>

      {/* ── Header ── */}
      <div className="bs-card" style={{ padding: 20, overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: -40, right: -30, width: 150, height: 150, borderRadius: '50%', background: `radial-gradient(circle,${hexA(BLUE, 0.1)},transparent 65%)`, pointerEvents: 'none' }} />
        <div style={{ position: 'relative' }}>
          <h3 style={{ fontFamily: SANS, fontSize: 15, fontWeight: 700, color: TEXT, margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
            <ClickIcon width={16} height={16} style={{ color: BLUE_LT }} />
            How a button sends a signal
          </h3>
          <p style={{ fontSize: 12, color: MUTED, margin: '7px 0 0', lineHeight: 1.55 }}>
            Press and hold the button. Watch the current flow along the wire into the ESP32, where the pin reads your press as a number.
          </p>
        </div>
      </div>

      <div className="bs-main" style={{ display: 'flex', gap: 14, alignItems: 'stretch' }}>

        {/* ── Circuit board ── */}
        <div className="bs-circuit-wrap bs-card bs-stage" style={{ padding: 18, overflow: 'hidden', borderColor: pressed ? hexA(GREEN, 0.35) : LINE, background: pressed ? hexA(GREEN, 0.04) : CARD }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
            <p style={{ fontSize: 10, fontWeight: 700, color: FAINT, textTransform: 'uppercase', letterSpacing: '0.14em', fontFamily: MONO, margin: 0 }}>Live Circuit</p>
            <span className="bs-fade" key={signal} style={{ fontSize: 10, fontWeight: 700, fontFamily: MONO, color: pressed ? GREEN_LT : FAINT, background: pressed ? hexA(GREEN, 0.12) : 'rgba(255,255,255,0.04)', border: `1px solid ${pressed ? hexA(GREEN, 0.3) : LINE}`, borderRadius: 99, padding: '3px 10px' }}>
              {pressed ? 'CIRCUIT CLOSED' : 'CIRCUIT OPEN'}
            </span>
          </div>

          {/* SVG circuit */}
          <div style={{ position: 'relative', width: '100%' }}>
            <svg viewBox="0 0 460 260" width="100%" style={{ display: 'block' }} aria-hidden>
              <defs>
                <pattern id="bsgrid" width="22" height="22" patternUnits="userSpaceOnUse">
                  <path d="M22 0H0V22" fill="none" stroke="rgba(255,255,255,0.03)" strokeWidth="1" />
                </pattern>
                <radialGradient id="bschip" cx="50%" cy="40%" r="70%">
                  <stop offset="0%" stopColor="#1c2c48" />
                  <stop offset="100%" stopColor="#0a1422" />
                </radialGradient>
              </defs>
              <rect x="0" y="0" width="460" height="260" fill="url(#bsgrid)" />

              {/* button sits at (95,80). Wire leaves its BOTTOM at (95,124) → down to
                  junction (95,170) → right to (300,170) → into chip IN pin.
                  3.3V feeds into button TOP at (95,36). */}

              {/* 3.3V feed into the top of the button */}
              <circle cx="95" cy="32" r="4" fill={pressed ? GREEN : 'rgba(255,255,255,0.3)'} style={{ transition: 'fill .2s' }} />
              <text x="103" y="28" fill={FAINT} fontSize="11" fontFamily="JetBrains Mono, monospace">3.3V</text>
              <path d="M95 36 V52" stroke={wireColor} strokeWidth="3.5" strokeLinecap="round" style={{ transition: 'stroke .25s' }} />

              {/* base (unlit) wire: button bottom → junction → chip */}
              <path d="M95 124 V170 H300" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
              {/* branch up to the signal readout chip at (210,170)→(210,128) */}
              <path d="M210 170 V128" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="3" strokeLinecap="round" />

              {/* lit overlay + animated current when pressed */}
              {pressed && (
                <>
                  <path d="M95 124 V170 H300" fill="none" stroke={hexA(GREEN, 0.5)} strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
                  <path className="bs-flow" d="M95 124 V170 H300" fill="none" stroke={GREEN_LT} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M210 170 V128" fill="none" stroke={hexA(GREEN, 0.5)} strokeWidth="3" strokeLinecap="round" />
                </>
              )}

              {/* junction node */}
              <circle cx="95" cy="170" r="5" fill={pressed ? GREEN : '#2a3a56'} stroke={pressed ? GREEN_LT : 'rgba(255,255,255,0.2)'} strokeWidth="1.5" style={{ transition: 'all .2s' }} />
              {/* branch tap node */}
              <circle cx="210" cy="170" r="4" fill={pressed ? GREEN : '#2a3a56'} style={{ transition: 'fill .2s' }} />

              {/* ── ESP32 chip ── */}
              <g style={{ transition: 'all .25s' }}>
                {[330, 352, 374, 396].map((x) => (<rect key={`t${x}`} x={x} y="98" width="10" height="10" rx="1.5" fill="rgba(255,255,255,0.18)" />))}
                {[330, 352, 374, 396].map((x) => (<rect key={`b${x}`} x={x} y="192" width="10" height="10" rx="1.5" fill="rgba(255,255,255,0.18)" />))}
                {/* active input pin (left side, aligned to wire at y=170) */}
                <rect x="300" y="162" width="16" height="16" rx="2" fill={pressed ? GREEN : 'rgba(255,255,255,0.25)'} className={pressed ? 'bs-pinglow' : ''} style={{ transition: 'fill .15s' }} />
                <text x="308" y="156" fill={FAINT} fontSize="8.5" fontFamily="JetBrains Mono, monospace" textAnchor="middle">IN</text>

                {/* chip body */}
                <rect x="318" y="106" width="104" height="88" rx="10" fill="url(#bschip)" stroke={pressed ? hexA(VIOLET, 0.6) : 'rgba(255,255,255,0.12)'} strokeWidth="2" style={{ transition: 'stroke .25s' }} />
                <text x="370" y="144" fill={pressed ? VIOLET_LT : MUTED} fontSize="13" fontWeight="700" fontFamily="Space Grotesk, sans-serif" textAnchor="middle" style={{ transition: 'fill .25s' }}>ESP32</text>
                <text x="370" y="162" fill={FAINT} fontSize="9" fontFamily="JetBrains Mono, monospace" textAnchor="middle">PIN {LED_PIN}</text>
                <text x="370" y="180" fill={pressed ? GREEN_LT : FAINT} fontSize="11" fontWeight="700" fontFamily="JetBrains Mono, monospace" textAnchor="middle" style={{ transition: 'fill .15s' }}>reads {signal}</text>
              </g>
            </svg>

            {/* the real tactile button, anchored exactly over SVG node (95,80) */}
            <div style={{ position: 'absolute', left: `${(95 / 460) * 100}%`, top: `${(100 / 260) * 100}%`, transform: 'translate(-50%,-50%)' }}>
              <button
                type="button"
                className="bs-press"
                onMouseDown={handlePress}
                onMouseUp={handleRelease}
                onMouseLeave={handleRelease}
                onTouchStart={(e) => { e.preventDefault(); handlePress(); }}
                onTouchEnd={(e) => { e.preventDefault(); handleRelease(); }}
                style={{
                  width: 76, height: 76, borderRadius: '50%', position: 'relative',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontFamily: SANS, fontSize: 10.5, fontWeight: 800, letterSpacing: '0.05em',
                  border: 'none', cursor: 'pointer', color: pressed ? '#fff' : BLUE_LT,
                  background: pressed
                    ? `radial-gradient(circle at 42% 34%, ${BLUE_LT}, ${BLUE} 70%)`
                    : `radial-gradient(circle at 42% 34%, #2a4a86, #16284a 72%)`,
                  boxShadow: pressed
                    ? `inset 0 2px 6px ${hexA('#0a1830', 0.6)}, 0 0 0 5px ${hexA(BLUE, 0.18)}, 0 0 26px ${hexA(BLUE, 0.55)}`
                    : `0 0 0 5px rgba(255,255,255,0.04), 0 7px 0 #0c1830, 0 12px 20px rgba(0,0,0,0.45)`,
                  transform: pressed ? 'translateY(5px)' : 'none',
                  transition: 'transform .08s ease, background .12s, box-shadow .12s, color .12s',
                }}
              >
                {/* glossy rim */}
                <span aria-hidden style={{ position: 'absolute', inset: 4, borderRadius: '50%', border: `1.5px solid ${pressed ? hexA('#ffffff', 0.4) : hexA('#ffffff', 0.12)}`, pointerEvents: 'none' }} />
                {/* top sheen */}
                <span aria-hidden style={{ position: 'absolute', top: 8, left: 16, right: 16, height: 18, borderRadius: '50%', background: `linear-gradient(${hexA('#ffffff', pressed ? 0.35 : 0.22)},transparent)`, pointerEvents: 'none' }} />
                {pressed ? 'PRESSED' : 'PRESS'}
              </button>
            </div>

            {/* signal readout chip — sits ABOVE the wire on the branch tap (210,108), so the wire never cuts through it */}
            <div style={{ position: 'absolute', left: `${(210 / 460) * 100}%`, top: `${(108 / 260) * 100}%`, transform: 'translate(-50%,-50%)', pointerEvents: 'none' }}>
              <div className="bs-fade" key={`sig${signal}`} style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                width: 52, height: 52, borderRadius: 13,
                background: pressed ? hexA(GREEN, 0.18) : 'rgba(10,20,34,0.95)',
                border: `1.5px solid ${pressed ? hexA(GREEN, 0.55) : 'rgba(255,255,255,0.14)'}`,
                boxShadow: pressed ? `0 0 20px ${hexA(GREEN, 0.45)}` : '0 4px 12px rgba(0,0,0,0.4)', transition: 'all .15s',
              }}>
                <span style={{ fontFamily: MONO, fontSize: 19, fontWeight: 700, lineHeight: 1, color: pressed ? GREEN_LT : FAINT }}>{signal}</span>
                <span style={{ fontFamily: MONO, fontSize: 8, fontWeight: 700, color: pressed ? GREEN_LT : FAINT, marginTop: 2 }}>{pressed ? 'HIGH' : 'LOW'}</span>
              </div>
            </div>
          </div>

          <p style={{ fontSize: 11, color: FAINT, lineHeight: 1.5, margin: '6px 4px 0', textAlign: 'center' }}>
            {pressed ? 'Current flows from 3.3V through the closed button into the pin.' : 'Hold the button to close the circuit and energize the wire.'}
          </p>
        </div>

        {/* ── Code panel ── */}
        <div className="bs-code-wrap bs-card bs-stage" style={{ overflow: 'hidden', display: 'flex', flexDirection: 'column', borderColor: pressed ? hexA(VIOLET, 0.4) : LINE }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '11px 15px', transition: 'background .2s', background: pressed ? hexA(VIOLET, 0.9) : 'rgba(255,255,255,0.04)' }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="7" y="7" width="10" height="10" rx="1.5" /><path d="M10 7V4M14 7V4M10 20v-3M14 20v-3M7 10H4M7 14H4M20 10h-3M20 14h-3" /></svg>
            <span style={{ fontFamily: MONO, fontSize: 11, fontWeight: 700, color: '#fff', letterSpacing: '0.03em' }}>ESP32 Reading</span>
          </div>
          <div style={{ flex: 1, background: '#070b12', padding: 15, fontFamily: MONO, fontSize: 12, lineHeight: 1.7 }}>
            <div><span style={{ color: '#ff7b72' }}>int</span> <span style={{ color: '#79c0ff' }}>btnState</span> <span style={{ color: '#c9d1d9' }}>=</span> <span style={{ color: '#d2a8ff' }}>digitalRead</span><span style={{ color: '#c9d1d9' }}>(</span><span style={{ color: '#79c0ff' }}>{LED_PIN}</span><span style={{ color: '#c9d1d9' }}>);</span></div>
            <div className="bs-fade" key={signal} style={{ marginTop: 14, borderRadius: 10, padding: '11px 13px', border: '1px solid', transition: 'all .15s', background: pressed ? hexA(GREEN, 0.14) : 'rgba(255,255,255,0.04)', borderColor: pressed ? hexA(GREEN, 0.35) : 'rgba(255,255,255,0.08)' }}>
              <p style={{ fontSize: 10, color: FAINT, margin: 0 }}>btnState is now</p>
              <p style={{ fontSize: 24, fontWeight: 700, fontFamily: MONO, margin: '4px 0 0', color: pressed ? GREEN_LT : FAINT }}>{signal} <span style={{ fontSize: 13 }}>({pressed ? 'HIGH' : 'LOW'})</span></p>
            </div>
            <p style={{ fontSize: 10.5, marginTop: 12, marginBottom: 0, color: pressed ? VIOLET_LT : 'rgba(201,209,217,0.35)' }}>
              {pressed ? '\u25B6 button detected as pressed' : '// waiting for input'}
            </p>
          </div>
        </div>
      </div>

      {/* ── Press counter ── */}
      {pressCount > 0 && (
        <div className="bs-card bs-fade" style={{ padding: '13px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: 11.5, color: MUTED, fontWeight: 600 }}>Times pressed</span>
          <span style={{ fontSize: 17, fontWeight: 800, fontFamily: SANS, color: BLUE_LT }}>{pressCount}</span>
        </div>
      )}

      {/* ── Insights ── */}
      <div className="bs-card" style={{ padding: 20 }}>
        <p style={{ fontSize: 10, fontWeight: 700, color: FAINT, textTransform: 'uppercase', letterSpacing: '0.14em', fontFamily: MONO, margin: '0 0 12px' }}>Key Concepts</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {INSIGHTS.map((insight, i) => {
            const on = i <= insightIndex;
            return (
              <div key={i} className="bs-insight" style={{
                display: 'flex', gap: 11, alignItems: 'flex-start', borderRadius: 11, padding: '11px 13px',
                background: on ? hexA(BLUE, 0.08) : 'rgba(255,255,255,0.02)',
                border: `1px solid ${on ? hexA(BLUE, 0.22) : 'transparent'}`, opacity: on ? 1 : 0.4,
              }}>
                <span style={{ width: 18, height: 18, flexShrink: 0, marginTop: 1, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 800, fontFamily: SANS, background: on ? BLUE : 'rgba(255,255,255,0.08)', color: on ? '#fff' : FAINT, transition: 'all .3s' }}>{i + 1}</span>
                <p style={{ fontSize: 12, lineHeight: 1.55, color: on ? TEXT : MUTED, margin: 0 }}>{insight}</p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}