'use client';

import { useState, useEffect, useCallback, useLayoutEffect, useRef } from 'react';
import { createClient } from '@/utils/supabase/client';

/* ════════════════════════════════════════════════════════════════════════
   BUILD MIND — ONBOARDING / PRODUCT TOUR  (reusable)
   One component for every surface. Spotlight tour + optional welcome modal.
   Shows once per (user, flagKey), stored in Supabase user_metadata.

   USAGE — Dashboard:
     import DashboardOnboarding, { TourStep, WelcomeConfig } from '@/components/DashboardOnboarding';
     <DashboardOnboarding flagKey="dashboard" steps={DASHBOARD_TOUR} welcome={DASHBOARD_WELCOME} />

   USAGE — Playground (no modal, straight into the tour):
     import DashboardOnboarding, { TourStep } from '@/components/DashboardOnboarding';
     <DashboardOnboarding flagKey="playground" steps={PLAYGROUND_TOUR} />

   Add data-tour="..." to the elements you want highlighted (selectors live in steps).

   Replay later:
     window.dispatchEvent(new CustomEvent('bm-replay-tour', { detail: 'playground' }));
   ════════════════════════════════════════════════════════════════════════ */

// ── tokens ──
const BG = '#04080f';
const CARD = '#0f1c30';
const LINE = 'rgba(255,255,255,0.08)';
const TEXT = '#ffffff';
const MUTED = 'rgba(234,240,250,0.55)';
const FAINT = 'rgba(234,240,250,0.35)';
const BLUE = '#3b82f6';
const BLUE_LT = '#93c5fd';
const VIOLET = '#8b5cf6';
const AMBER = '#f59e0b';
const SANS = '"Space Grotesk",sans-serif';
const INTER = '"Inter",system-ui,sans-serif';

function hexA(hex: string, a: number): string {
  const h = hex.replace('#', '');
  const r = parseInt(h.slice(0, 2), 16), g = parseInt(h.slice(2, 4), 16), b = parseInt(h.slice(4, 6), 16);
  return `rgba(${r},${g},${b},${a})`;
}

type IconProps = React.SVGProps<SVGSVGElement>;
const Arrow = (p: IconProps) => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M5 12h14M12 5l7 7-7 7" /></svg>);
const Spark = (p: IconProps) => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5 18 18M18 6l-2.5 2.5M8.5 15.5 6 18" /></svg>);

// ── public types ──
export type TourStep = {
  selector: string;
  title: string;
  body: string;
  tone?: string;
};

export type WelcomeConfig = {
  title: string;
  body: string;
  badge?: string;
  cards?: { title: string; desc: string; tone: string }[];
  startLabel?: string;
};

type Props = {
  flagKey: string;
  steps: TourStep[];
  welcome?: WelcomeConfig;
  startDelayMs?: number;
};

type Phase = 'idle' | 'welcome' | 'tour' | 'done';
type Rect = { top: number; left: number; width: number; height: number };

const PAD = 10;

export default function DashboardOnboarding({ flagKey, steps, welcome, startDelayMs = 650 }: Props) {
  const metaField = `onboarded_${flagKey}`;

  const [phase, setPhase] = useState<Phase>('idle');
  const [stepIdx, setStepIdx] = useState(0);
  const [rect, setRect] = useState<Rect | null>(null);

  // Keep latest values for stable event handlers (avoids re-binding listeners each step).
  const phaseRef = useRef(phase);
  const stepRef = useRef(stepIdx);
  phaseRef.current = phase;
  stepRef.current = stepIdx;

  // ── Persist the flag (best-effort; never throws into the UI) ──
  const markDone = useCallback(() => {
    try {
      const supabase = createClient();
      void supabase.auth.updateUser({ data: { [metaField]: true } }).catch(() => { /* non-fatal */ });
    } catch {
      /* createClient failed (e.g. during prerender) — ignore */
    }
  }, [metaField]);

  // ── Flow controls (declared before effects that reference them) ──
  const finish = useCallback(() => { setPhase('done'); markDone(); }, [markDone]);
  const startTour = useCallback(() => { setStepIdx(0); setPhase('tour'); }, []);
  const nextStep = useCallback(() => {
    setStepIdx(i => {
      if (i < steps.length - 1) return i + 1;
      finish();
      return i;
    });
  }, [steps.length, finish]);
  const prevStep = useCallback(() => { setStepIdx(i => (i > 0 ? i - 1 : i)); }, []);

  // ── Decide whether to show on mount ──
  useEffect(() => {
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | undefined;
    try {
      const supabase = createClient();
      supabase.auth.getUser().then(({ data }) => {
        if (cancelled) return;
        const done = data.user?.user_metadata?.[metaField] === true;
        if (!done) {
          timer = setTimeout(() => { if (!cancelled) setPhase(welcome ? 'welcome' : 'tour'); }, startDelayMs);
        }
      }).catch(() => { /* not signed in / network — show nothing */ });
    } catch {
      /* ignore */
    }
    return () => { cancelled = true; if (timer) clearTimeout(timer); };
  }, [metaField, welcome, startDelayMs]);

  // ── Replay trigger (detail must match this flagKey, or be absent) ──
  useEffect(() => {
    const replay = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (detail && detail !== flagKey) return;
      setStepIdx(0);
      setPhase(welcome ? 'welcome' : 'tour');
    };
    window.addEventListener('bm-replay-tour', replay);
    return () => window.removeEventListener('bm-replay-tour', replay);
  }, [flagKey, welcome]);

  // ── Measure the current target element ──
  const measure = useCallback(() => {
    if (phaseRef.current !== 'tour') return;
    const sel = steps[stepRef.current]?.selector;
    const el = sel ? (document.querySelector(sel) as HTMLElement | null) : null;
    if (!el) { setRect(null); return; }
    const r = el.getBoundingClientRect();
    setRect({ top: r.top, left: r.left, width: r.width, height: r.height });
  }, [steps]);

  // Scroll target into view, then measure (after smooth scroll settles).
  useLayoutEffect(() => {
    if (phase !== 'tour') return;
    const sel = steps[stepIdx]?.selector;
    const el = sel ? (document.querySelector(sel) as HTMLElement | null) : null;
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'center' });
    const t = setTimeout(measure, 320);
    return () => clearTimeout(t);
  }, [phase, stepIdx, steps, measure]);

  // Re-measure on resize / scroll while touring.
  useEffect(() => {
    if (phase !== 'tour') return;
    window.addEventListener('resize', measure);
    window.addEventListener('scroll', measure, true);
    return () => {
      window.removeEventListener('resize', measure);
      window.removeEventListener('scroll', measure, true);
    };
  }, [phase, measure]);

  // ── Keyboard nav (stable handler via refs) ──
  useEffect(() => {
    if (phase === 'idle' || phase === 'done') return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { finish(); return; }
      if (phaseRef.current !== 'tour') return;
      if (e.key === 'ArrowRight' || e.key === 'Enter') nextStep();
      else if (e.key === 'ArrowLeft') prevStep();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [phase, finish, nextStep, prevStep]);

  if (phase === 'idle' || phase === 'done') return null;

  return (
    <div role="dialog" aria-modal="true" aria-label="Getting started" style={{ position: 'fixed', inset: 0, zIndex: 9999, fontFamily: INTER }}>
      <style>{`
        @keyframes bmt-in{from{opacity:0;transform:translateY(14px) scale(.98)}to{opacity:1;transform:none}}
        @keyframes bmt-fade{from{opacity:0}to{opacity:1}}
        .bmt-card{animation:bmt-in .4s cubic-bezier(0.16,1,0.3,1) both}
        .bmt-overlay{animation:bmt-fade .3s ease both}
        .bmt-primary{transition:transform .18s, filter .2s}
        .bmt-primary:hover{transform:translateY(-2px); filter:brightness(1.08)}
        .bmt-ghost{transition:background .18s, border-color .18s, color .18s}
        .bmt-ghost:hover{background:rgba(255,255,255,0.08); border-color:rgba(255,255,255,0.28); color:#fff}
        @media (prefers-reduced-motion: reduce){ .bmt-card,.bmt-overlay{animation:none} }
      `}</style>

      {phase === 'welcome' && welcome && (
        <WelcomeModal cfg={welcome} onStart={startTour} onSkip={finish} />
      )}

      {phase === 'tour' && steps[stepIdx] && (
        <TourLayer
          step={steps[stepIdx]}
          stepIdx={stepIdx}
          total={steps.length}
          rect={rect}
          onNext={nextStep}
          onPrev={prevStep}
          onSkip={finish}
        />
      )}
    </div>
  );
}

/* ─── Welcome modal ─────────────────────────────────────────────────────── */
function WelcomeModal({ cfg, onStart, onSkip }: { cfg: WelcomeConfig; onStart: () => void; onSkip: () => void }) {
  return (
    <>
      <div className="bmt-overlay" onClick={onSkip} style={{ position: 'absolute', inset: 0, background: 'rgba(2,5,11,0.78)', backdropFilter: 'blur(4px)' }} />
      <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, pointerEvents: 'none' }}>
        <div className="bmt-card" style={{ pointerEvents: 'auto', width: '100%', maxWidth: 480, borderRadius: 24, overflow: 'hidden', background: `linear-gradient(160deg,${BG} 0%,#060d19 50%,#081120 100%)`, border: `1px solid ${LINE}`, boxShadow: '0 40px 90px -30px rgba(0,0,0,0.95)' }}>
          <div style={{ height: 3, background: `linear-gradient(90deg,${BLUE},${VIOLET} 50%,${AMBER})` }} />
          <div style={{ padding: '30px 28px 26px' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: hexA(BLUE, 0.1), border: `1px solid ${hexA(BLUE, 0.2)}`, borderRadius: 99, padding: '5px 13px', marginBottom: 18 }}>
              <span style={{ color: BLUE_LT, display: 'flex' }}><Spark width={13} height={13} /></span>
              <span style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', color: BLUE_LT }}>{cfg.badge || 'Welcome'}</span>
            </div>
            <h2 style={{ fontFamily: SANS, fontSize: 25, fontWeight: 700, lineHeight: 1.18, letterSpacing: -0.5, color: TEXT, margin: 0 }}>{cfg.title}</h2>
            <p style={{ marginTop: 10, fontSize: 14, lineHeight: 1.6, color: MUTED }}>{cfg.body}</p>

            {cfg.cards && cfg.cards.length > 0 && (
              <div style={{ marginTop: 22, display: 'flex', flexDirection: 'column', gap: 10 }}>
                {cfg.cards.map(c => (
                  <div key={c.title} style={{ display: 'flex', alignItems: 'center', gap: 13, padding: '12px 14px', borderRadius: 14, background: CARD, border: `1px solid ${LINE}` }}>
                    <span style={{ width: 8, height: 8, flexShrink: 0, borderRadius: '50%', background: c.tone, boxShadow: `0 0 10px ${hexA(c.tone, 0.7)}` }} />
                    <div style={{ minWidth: 0 }}>
                      <p style={{ fontFamily: SANS, fontSize: 14, fontWeight: 700, color: TEXT, margin: 0 }}>{c.title}</p>
                      <p style={{ fontSize: 12, color: MUTED, margin: '2px 0 0', lineHeight: 1.4 }}>{c.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div style={{ marginTop: 24, display: 'flex', gap: 10, alignItems: 'center' }}>
              <button className="bmt-primary" onClick={onStart} style={{ flex: 1, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8, borderRadius: 13, background: 'linear-gradient(135deg,#1a3a8a,#2563eb)', color: '#fff', border: 'none', padding: '13px 20px', fontSize: 14, fontWeight: 700, cursor: 'pointer', boxShadow: `0 12px 28px -10px ${hexA(BLUE, 0.6)}` }}>
                {cfg.startLabel || 'Take a quick tour'} <Arrow width={15} height={15} />
              </button>
              <button className="bmt-ghost" onClick={onSkip} style={{ borderRadius: 13, background: 'rgba(255,255,255,0.04)', color: MUTED, border: `1px solid ${LINE}`, padding: '13px 18px', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>
                Skip
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

/* ─── Tour layer: spotlight + tooltip ───────────────────────────────────── */
function TourLayer({ step, stepIdx, total, rect, onNext, onPrev, onSkip }: {
  step: TourStep; stepIdx: number; total: number; rect: Rect | null;
  onNext: () => void; onPrev: () => void; onSkip: () => void;
}) {
  const tone = step.tone || BLUE;
  const isLast = stepIdx === total - 1;
  const spot = rect
    ? { top: rect.top - PAD, left: rect.left - PAD, width: rect.width + PAD * 2, height: rect.height + PAD * 2 }
    : null;

  const vw = typeof window !== 'undefined' ? window.innerWidth : 1024;
  const vh = typeof window !== 'undefined' ? window.innerHeight : 768;
  const TT_W = Math.min(340, vw - 32);
  let ttTop = vh / 2 - 90;
  let ttLeft = vw / 2 - TT_W / 2;

  if (spot) {
    const below = spot.top + spot.height + 210 < vh;
    ttTop = below ? spot.top + spot.height + 14 : spot.top - 14 - 200;
    ttLeft = Math.min(Math.max(spot.left + spot.width / 2 - TT_W / 2, 16), vw - TT_W - 16);
    ttTop = Math.min(Math.max(ttTop, 16), vh - 220);
  }

  return (
    <>
      <div className="bmt-overlay" onClick={onSkip} style={{ position: 'absolute', inset: 0 }}>
        {spot ? (
          <div style={{
            position: 'absolute',
            top: spot.top, left: spot.left, width: spot.width, height: spot.height,
            borderRadius: 16,
            boxShadow: `0 0 0 9999px rgba(2,5,11,0.78), 0 0 0 2px ${hexA(tone, 0.7)}`,
            transition: 'all .35s cubic-bezier(0.16,1,0.3,1)',
            pointerEvents: 'none',
          }} />
        ) : (
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(2,5,11,0.78)' }} />
        )}
      </div>

      <div className="bmt-card" style={{
        position: 'absolute', top: ttTop, left: ttLeft, width: TT_W,
        borderRadius: 18, background: `linear-gradient(160deg,${CARD},#0a1626)`,
        border: `1px solid ${hexA(tone, 0.35)}`,
        boxShadow: '0 30px 70px -25px rgba(0,0,0,0.9)',
        padding: 20, pointerEvents: 'auto',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 9 }}>
          <span style={{ width: 24, height: 24, flexShrink: 0, borderRadius: 7, background: hexA(tone, 0.16), color: tone, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: SANS, fontSize: 12, fontWeight: 800 }}>
            {stepIdx + 1}
          </span>
          <h3 style={{ fontFamily: SANS, fontSize: 16, fontWeight: 700, color: TEXT, margin: 0 }}>{step.title}</h3>
        </div>

        <p style={{ fontSize: 13, lineHeight: 1.6, color: MUTED, margin: 0 }}>{step.body}</p>

        <div style={{ marginTop: 18, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
          <div style={{ display: 'flex', gap: 5, alignItems: 'center' }}>
            {Array.from({ length: total }).map((_, i) => (
              <span key={i} style={{ height: 5, borderRadius: 99, width: i === stepIdx ? 18 : 6, background: i === stepIdx ? tone : 'rgba(255,255,255,0.16)', transition: 'all .25s', display: 'block' }} />
            ))}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {stepIdx > 0 && (
              <button className="bmt-ghost" onClick={onPrev} style={{ borderRadius: 10, background: 'rgba(255,255,255,0.04)', color: MUTED, border: `1px solid ${LINE}`, padding: '8px 13px', fontSize: 12.5, fontWeight: 700, cursor: 'pointer' }}>Back</button>
            )}
            <button className="bmt-primary" onClick={onNext} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, borderRadius: 10, background: `linear-gradient(135deg,${hexA(tone, 0.9)},${tone})`, color: '#fff', border: 'none', padding: '8px 15px', fontSize: 12.5, fontWeight: 700, cursor: 'pointer', boxShadow: `0 8px 20px -8px ${hexA(tone, 0.7)}` }}>
              {isLast ? 'Done' : 'Next'} {!isLast && <Arrow width={13} height={13} />}
            </button>
          </div>
        </div>

        <button onClick={onSkip} style={{ position: 'absolute', top: 14, right: 14, background: 'none', border: 'none', color: FAINT, fontSize: 11.5, fontWeight: 600, cursor: 'pointer', padding: 4 }}>Skip</button>
      </div>
    </>
  );
}