'use client';

import { useState, useEffect, useRef, useCallback, type SVGProps } from 'react';
import { useAppStore } from '@/store/useAppStore';

/* ════════════════════════════════════════════════════════════════════════
   BUILD MIND — SERIAL MONITOR SIMULATOR
   Reads the student's actual serial_print + delay blocks from the app store
   and shows what their ESP32 would print over Serial, live. Dark-themed,
   deployment-safe. The block-reading logic is unchanged.
   ════════════════════════════════════════════════════════════════════════ */

// ── tokens ──
const LINE = 'rgba(255,255,255,0.08)';
const TEXT = '#eaf0fa';
const MUTED = 'rgba(234,240,250,0.55)';
const FAINT = 'rgba(234,240,250,0.35)';
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
const TerminalIcon = (p: IconProps) => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><rect x="3" y="4" width="18" height="16" rx="2" /><path d="M7 9l3 3-3 3M13 15h4" /></svg>);
const PlayIcon = (p: IconProps) => (<svg viewBox="0 0 24 24" fill="currentColor" {...p}><path d="M8 5v14l11-7z" /></svg>);
const StopIcon = (p: IconProps) => (<svg viewBox="0 0 24 24" fill="currentColor" {...p}><rect x="5" y="5" width="14" height="14" rx="2" /></svg>);
const InfoIcon = (p: IconProps) => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><circle cx="12" cy="12" r="10" /><path d="M12 16v-4M12 8h.01" /></svg>);

export default function SerialMonitorSimulator() {
  const blocks = useAppStore((state) => state.blocks);
  const [logs, setLogs] = useState<string[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const isRunningRef = useRef(false);
  const logEndRef = useRef<HTMLDivElement>(null);

  // ── Extract message and delay from the student's blocks (unchanged logic) ──
  const printBlock = blocks.find((b) => b.type === 'serial_print');
  const delayBlock = blocks.find((b) => b.type === 'delay_ms' || b.type === 'delay_sec');

  const message = printBlock ? String(printBlock.values?.msg ?? 'Hello ESP32!') : 'Hello ESP32!';

  const delayMs = delayBlock
    ? delayBlock.type === 'delay_sec'
      ? Number(delayBlock.values?.sec ?? 1) * 1000
      : Number(delayBlock.values?.ms ?? 1000)
    : 1000;

  useEffect(() => { logEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [logs]);
  useEffect(() => () => { isRunningRef.current = false; }, []);

  useEffect(() => {
    if (!isRunning) return;
    isRunningRef.current = true;
    setLogs([]);

    const interval = setInterval(() => {
      if (!isRunningRef.current) return;
      setLogs((prev) => [...prev.slice(-24), message]);
    }, Math.max(delayMs, 300));

    return () => {
      clearInterval(interval);
      isRunningRef.current = false;
    };
  }, [isRunning, message, delayMs]);

  const toggle = useCallback(() => {
    setIsRunning((running) => {
      if (running) { isRunningRef.current = false; setLogs([]); return false; }
      return true;
    });
  }, []);

  const delayLabel = delayMs >= 1000 ? `${delayMs / 1000}s` : `${delayMs}ms`;

  return (
    <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 14, fontFamily: '"Inter",system-ui,sans-serif' }}>
      <link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;700&display=swap" rel="stylesheet" />

      <style>{`
        @keyframes sm-line{from{opacity:0;transform:translateX(-6px)}to{opacity:1;transform:none}}
        @keyframes sm-blink{0%,100%{opacity:1}50%{opacity:.2}}
        @keyframes sm-pulse{0%,100%{opacity:1;transform:scale(1)}50%{opacity:.4;transform:scale(.7)}}
        .sm-card{background:#0f1c30;border:1px solid ${LINE};border-radius:18px;position:relative}
        .sm-logline{animation:sm-line .2s ease both}
        .sm-cursor{animation:sm-blink 1s step-end infinite}
        .sm-dot{animation:sm-pulse 1.4s ease-in-out infinite}
        .sm-btn{transition:filter .18s, transform .15s, box-shadow .2s}
        .sm-btn:hover{filter:brightness(1.08);transform:translateY(-1px)}
        .sm-btn:active{transform:scale(.97)}
        @media (prefers-reduced-motion: reduce){ .sm-logline,.sm-cursor,.sm-dot{animation:none!important} }
      `}</style>

      {/* ── Header ── */}
      <div className="sm-card" style={{ padding: 18, overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: -40, right: -30, width: 150, height: 150, borderRadius: '50%', background: `radial-gradient(circle,${hexA(GREEN, 0.08)},transparent 65%)`, pointerEvents: 'none' }} />
        <div style={{ position: 'relative' }}>
          <h3 style={{ fontFamily: SANS, fontSize: 15, fontWeight: 700, color: TEXT, margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
            <TerminalIcon width={16} height={16} style={{ color: GREEN_LT }} />
            Serial Monitor, your program running
          </h3>
          <p style={{ fontSize: 12, color: MUTED, margin: '7px 0 0', lineHeight: 1.55 }}>
            This is what the Serial Monitor would show when your ESP32 runs the program you just built. Your message{' '}
            <span style={{ color: TEXT, fontWeight: 600, fontFamily: MONO }}>&quot;{message}&quot;</span> prints every{' '}
            <span style={{ color: GREEN_LT, fontWeight: 700, fontFamily: MONO }}>{delayLabel}</span>.
          </p>
        </div>
      </div>

      {/* ── Monitor ── */}
      <div className="sm-card" style={{ overflow: 'hidden', padding: 0 }}>
        {/* title bar */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', background: 'rgba(255,255,255,0.04)', borderBottom: `1px solid ${LINE}` }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
            <TerminalIcon width={13} height={13} style={{ color: GREEN_LT }} />
            <span style={{ fontSize: 12, fontWeight: 700, color: TEXT, fontFamily: SANS }}>Serial Monitor</span>
            <span style={{ fontSize: 10, color: FAINT, fontFamily: MONO }}>115200 baud</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {isRunning && (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 10, fontWeight: 600, color: GREEN_LT, fontFamily: MONO }}>
                <span className="sm-dot" style={{ width: 6, height: 6, borderRadius: '50%', background: GREEN, display: 'inline-block' }} />
                Connected
              </span>
            )}
            <button type="button" onClick={toggle} className="sm-btn" style={{
              fontSize: 11, fontWeight: 700, fontFamily: SANS, padding: '6px 14px', borderRadius: 8, border: 'none', cursor: 'pointer',
              display: 'inline-flex', alignItems: 'center', gap: 6, color: '#fff',
              background: isRunning ? 'linear-gradient(135deg,#b91c1c,#ef4444)' : 'linear-gradient(135deg,#1a3a8a,#2563eb)',
            }}>
              {isRunning ? (<><StopIcon width={10} height={10} /> Stop</>) : (<><PlayIcon width={10} height={10} /> Run</>)}
            </button>
          </div>
        </div>

        {/* terminal body */}
        <div style={{ background: '#070b12', padding: 14, fontFamily: MONO, fontSize: 11.5, color: GREEN_LT, height: 256, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 3 }}>
          {!isRunning && logs.length === 0 ? (
            <span style={{ color: FAINT, fontStyle: 'italic' }}>Press Run to simulate your program<span className="sm-cursor">_</span></span>
          ) : logs.length === 0 ? (
            <span style={{ color: FAINT, fontStyle: 'italic' }}>Starting<span className="sm-cursor">_</span></span>
          ) : (
            logs.map((log, i) => {
              const last = i === logs.length - 1;
              return (
                <div key={i} className="sm-logline" style={{ color: last ? GREEN_LT : hexA(GREEN_LT, 0.55), fontWeight: last ? 700 : 400 }}>
                  <span style={{ color: hexA(GREEN_LT, 0.4) }}>&gt;</span> {log}
                </div>
              );
            })
          )}
          <div ref={logEndRef} />
        </div>
      </div>

      {/* ── Insight ── */}
      <div className="sm-card" style={{ display: 'flex', gap: 11, alignItems: 'flex-start', padding: '13px 15px', background: hexA(BLUE, 0.06), borderColor: hexA(BLUE, 0.18) }}>
        <InfoIcon width={15} height={15} style={{ color: BLUE_LT, flexShrink: 0, marginTop: 1 }} />
        <p style={{ fontSize: 12, color: MUTED, margin: 0, lineHeight: 1.55 }}>
          <strong style={{ color: TEXT }}>When connected to real hardware</strong>, this is exactly what you would see in the Serial Monitor of your development environment. The message your ESP32 sends over Serial appears here in real time.
        </p>
      </div>
    </div>
  );
}