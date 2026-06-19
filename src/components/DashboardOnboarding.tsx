'use client';

import {
  useState,
  useEffect,
  useCallback,
  useMemo,
  useRef,
  useLayoutEffect,
} from 'react';
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

/* ── tokens (color scheme preserved) ── */
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
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return `rgba(${r},${g},${b},${a})`;
}

/* SSR-safe layout effect: useLayoutEffect on the client (no flicker),
   useEffect on the server (no React warning that breaks the build). */
const useIsoLayoutEffect =
  typeof window !== 'undefined' ? useLayoutEffect : useEffect;

type IconProps = React.SVGProps<SVGSVGElement>;
const Arrow = (p: IconProps) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" {...p}>
    <path d="M5 12h14M12 5l7 7-7 7" />
  </svg>
);
const Spark = (p: IconProps) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...p}>
    <path d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5 18 18M18 6l-2.5 2.5M8.5 15.5 6 18" />
  </svg>
);

/* ── public types ── */
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
type Placement = 'below' | 'above';

const PAD = 10;
const TT_MAXW = 360;
const TT_EST_H = 240; // estimated tooltip height for placement math
const GAP = 18;

export default function DashboardOnboarding({
  flagKey,
  steps,
  welcome,
  startDelayMs = 650,
}: Props) {
  const metaField = `onboarded_${flagKey}`;

  const [phase, setPhase] = useState<Phase>('idle');
  const [stepIdx, setStepIdx] = useState(0);
  const [rect, setRect] = useState<Rect | null>(null);

  // Latest values for stable event handlers (listeners bind once).
  const phaseRef = useRef(phase);
  const stepRef = useRef(stepIdx);
  phaseRef.current = phase;
  stepRef.current = stepIdx;

  /* ── Persist the flag (best-effort; never throws into the UI) ── */
  const markDone = useCallback(() => {
    try {
      const supabase = createClient();
      void supabase.auth
        .updateUser({ data: { [metaField]: true } })
        .catch(() => {});
    } catch {
      /* createClient failed (e.g. during prerender) — ignore */
    }
  }, [metaField]);

  /* ── Flow controls ── */
  const finish = useCallback(() => {
    setPhase('done');
    markDone();
  }, [markDone]);
  const startTour = useCallback(() => {
    setStepIdx(0);
    setPhase('tour');
  }, []);
  const nextStep = useCallback(() => {
    setStepIdx((i) => {
      if (i < steps.length - 1) return i + 1;
      finish();
      return i;
    });
  }, [steps.length, finish]);
  const prevStep = useCallback(() => {
    setStepIdx((i) => (i > 0 ? i - 1 : i));
  }, []);

  /* ── Decide whether to show on mount ── */
  useEffect(() => {
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | undefined;
    try {
      const supabase = createClient();
      supabase.auth
        .getUser()
        .then(({ data }) => {
          if (cancelled) return;
          const done = data.user?.user_metadata?.[metaField] === true;
          if (!done) {
            timer = setTimeout(() => {
              if (!cancelled) setPhase(welcome ? 'welcome' : 'tour');
            }, startDelayMs);
          }
        })
        .catch(() => {});
    } catch {
      /* ignore */
    }
    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
    };
  }, [metaField, welcome, startDelayMs]);

  /* ── Replay trigger (detail must match this flagKey, or be absent) ── */
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

  /* ── Lock body scroll while the overlay is open ──
     Set the lock only while open; clear it on every other phase and on
     unmount. We don't save/restore a "previous" value because re-runs can
     capture 'hidden' as the previous value and leave the page stuck. */
  useEffect(() => {
    const open = phase === 'welcome' || phase === 'tour';
    document.body.style.overflow = open ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [phase]);

  /* ── Measure the current target element ── */
  const measure = useCallback(() => {
    if (phaseRef.current !== 'tour') return;
    const sel = steps[stepRef.current]?.selector;
    const el = sel ? (document.querySelector(sel) as HTMLElement | null) : null;
    if (!el) {
      setRect(null);
      return;
    }
    const r = el.getBoundingClientRect();
    setRect({ top: r.top, left: r.left, width: r.width, height: r.height });
  }, [steps]);

  /* Scroll target into view, then measure across a few frames so a slow
     smooth-scroll can't leave the spotlight mid-flight. */
  useIsoLayoutEffect(() => {
    if (phase !== 'tour') return;
    const sel = steps[stepIdx]?.selector;
    const el = sel ? (document.querySelector(sel) as HTMLElement | null) : null;
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'nearest' });

    let raf = 0;
    const timers: ReturnType<typeof setTimeout>[] = [];
    measure();
    [120, 280, 460].forEach((ms) =>
      timers.push(setTimeout(() => { raf = requestAnimationFrame(measure); }, ms)),
    );
    return () => {
      timers.forEach(clearTimeout);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [phase, stepIdx, steps, measure]);

  /* Re-measure on resize / scroll while touring. */
  useEffect(() => {
    if (phase !== 'tour') return;
    window.addEventListener('resize', measure);
    window.addEventListener('scroll', measure, true);
    return () => {
      window.removeEventListener('resize', measure);
      window.removeEventListener('scroll', measure, true);
    };
  }, [phase, measure]);

  /* ── Keyboard nav (stable handler via refs) ── */
  useEffect(() => {
    if (phase === 'idle' || phase === 'done') return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        finish();
        return;
      }
      if (phaseRef.current !== 'tour') return;
      if (e.key === 'ArrowRight' || e.key === 'Enter') nextStep();
      else if (e.key === 'ArrowLeft') prevStep();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [phase, finish, nextStep, prevStep]);

  if (phase === 'idle' || phase === 'done') return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Getting started"
      style={{ position: 'fixed', inset: 0, zIndex: 9999, fontFamily: INTER }}
    >
      <style>{STYLES}</style>

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

/* ─── animations / keyframes (hoisted so they aren't rebuilt per render) ─── */
const STYLES = `
  @keyframes bmt-in{from{opacity:0;transform:translateY(16px) scale(.96)}to{opacity:1;transform:none}}
  @keyframes bmt-fade{from{opacity:0}to{opacity:1}}
  @keyframes bmt-sheen{from{transform:translateX(-120%)}to{transform:translateX(120%)}}
  @keyframes bmt-ring{0%{transform:scale(.6);opacity:.55}70%{opacity:0}100%{transform:scale(1.25);opacity:0}}
  @keyframes bmt-pointer{0%,100%{transform:var(--bmt-rot) translateY(0)}50%{transform:var(--bmt-rot) translateY(2px)}}
  @keyframes bmt-glow{0%,100%{opacity:.5}50%{opacity:.95}}
  .bmt-card{animation:bmt-in .46s cubic-bezier(0.16,1,0.3,1) both}
  .bmt-overlay{animation:bmt-fade .32s ease both}
  .bmt-pointer{animation:bmt-pointer 1.8s ease-in-out infinite}
  .bmt-primary{position:relative;overflow:hidden;transition:transform .18s, filter .2s, box-shadow .2s}
  .bmt-primary:hover{transform:translateY(-2px); filter:brightness(1.07)}
  .bmt-primary:active{transform:scale(.97)}
  .bmt-primary::after{content:'';position:absolute;top:0;left:0;width:55%;height:100%;background:linear-gradient(90deg,transparent,rgba(255,255,255,0.28),transparent);transform:translateX(-120%)}
  .bmt-primary:hover::after{animation:bmt-sheen .8s ease}
  .bmt-ghost{transition:background .18s, border-color .18s, color .18s}
  .bmt-ghost:hover{background:rgba(255,255,255,0.08); border-color:rgba(255,255,255,0.28); color:#fff}
  .bmt-skip{transition:color .15s, background .15s}
  .bmt-skip:hover{color:#fff; background:rgba(255,255,255,0.06)}
  .bmt-wcard{transition:transform .2s, border-color .2s, background .2s}
  .bmt-wcard:hover{transform:translateX(3px); border-color:rgba(255,255,255,0.16)}
  .bmt-focus:focus-visible{outline:2px solid ${BLUE_LT};outline-offset:2px}
  @media (prefers-reduced-motion: reduce){
    .bmt-card,.bmt-overlay,.bmt-pointer,.bmt-glow,.bmt-pulse{animation:none !important}
    .bmt-primary::after{display:none}
  }
`;

/* ─── Welcome modal ─────────────────────────────────────────────────────── */
function WelcomeModal({
  cfg,
  onStart,
  onSkip,
}: {
  cfg: WelcomeConfig;
  onStart: () => void;
  onSkip: () => void;
}) {
  const startRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    startRef.current?.focus();
  }, []);

  return (
    <>
      <div
        className="bmt-overlay"
        onClick={onSkip}
        style={{
          position: 'absolute',
          inset: 0,
          background: 'rgba(2,5,11,0.82)',
          backdropFilter: 'blur(6px)',
        }}
      />
      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 20,
          pointerEvents: 'none',
        }}
      >
        <div
          className="bmt-card"
          style={{
            pointerEvents: 'auto',
            position: 'relative',
            width: '100%',
            maxWidth: 470,
            borderRadius: 26,
            overflow: 'hidden',
            background: `linear-gradient(160deg,${BG} 0%,#060d19 50%,#081120 100%)`,
            border: `1px solid ${LINE}`,
            boxShadow: '0 40px 100px -28px rgba(0,0,0,0.95)',
          }}
        >
          {/* ambient corner glow */}
          <div
            className="bmt-glow"
            aria-hidden
            style={{
              position: 'absolute',
              top: -90,
              right: -70,
              width: 240,
              height: 240,
              borderRadius: '50%',
              background: `radial-gradient(circle,${hexA(BLUE, 0.4)},transparent 68%)`,
              filter: 'blur(14px)',
              animation: 'bmt-glow 5s ease-in-out infinite',
              pointerEvents: 'none',
            }}
          />
          {/* top accent */}
          <div style={{ height: 3, background: `linear-gradient(90deg,${BLUE},${VIOLET} 50%,${AMBER})` }} />

          <div style={{ position: 'relative', padding: '32px 30px 28px' }}>
            {/* faint grid */}
            <div
              aria-hidden
              style={{
                position: 'absolute',
                inset: 0,
                pointerEvents: 'none',
                backgroundImage:
                  'linear-gradient(rgba(59,130,246,0.05) 1px,transparent 1px),linear-gradient(90deg,rgba(59,130,246,0.05) 1px,transparent 1px)',
                backgroundSize: '34px 34px',
                maskImage: 'radial-gradient(ellipse 70% 60% at 80% 0%,black,transparent)',
                WebkitMaskImage: 'radial-gradient(ellipse 70% 60% at 80% 0%,black,transparent)',
              }}
            />
            <div style={{ position: 'relative' }}>
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 8,
                  background: hexA(BLUE, 0.1),
                  border: `1px solid ${hexA(BLUE, 0.2)}`,
                  borderRadius: 99,
                  padding: '5px 13px',
                  marginBottom: 18,
                }}
              >
                <span style={{ color: BLUE_LT, display: 'flex' }}>
                  <Spark width={13} height={13} />
                </span>
                <span
                  style={{
                    fontSize: 10,
                    fontWeight: 600,
                    letterSpacing: '0.12em',
                    textTransform: 'uppercase',
                    color: BLUE_LT,
                  }}
                >
                  {cfg.badge || 'Welcome'}
                </span>
              </div>
              <h2
                style={{
                  fontFamily: SANS,
                  fontSize: 26,
                  fontWeight: 700,
                  lineHeight: 1.16,
                  letterSpacing: -0.5,
                  color: TEXT,
                  margin: 0,
                }}
              >
                {cfg.title}
              </h2>
              <p style={{ marginTop: 11, fontSize: 14, lineHeight: 1.62, color: MUTED }}>{cfg.body}</p>

              {cfg.cards && cfg.cards.length > 0 && (
                <div style={{ marginTop: 22, display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {cfg.cards.map((c) => (
                    <div
                      key={c.title}
                      className="bmt-wcard"
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 13,
                        padding: '13px 15px',
                        borderRadius: 14,
                        background: CARD,
                        border: `1px solid ${LINE}`,
                        borderLeft: `3px solid ${c.tone}`,
                      }}
                    >
                      <span
                        className="bmt-glow"
                        style={{
                          width: 9,
                          height: 9,
                          flexShrink: 0,
                          borderRadius: '50%',
                          background: c.tone,
                          boxShadow: `0 0 12px ${hexA(c.tone, 0.8)}`,
                          animation: 'bmt-glow 3s ease-in-out infinite',
                        }}
                      />
                      <div style={{ minWidth: 0 }}>
                        <p style={{ fontFamily: SANS, fontSize: 14, fontWeight: 700, color: TEXT, margin: 0 }}>
                          {c.title}
                        </p>
                        <p style={{ fontSize: 12, color: MUTED, margin: '2px 0 0', lineHeight: 1.45 }}>{c.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div style={{ marginTop: 26, display: 'flex', gap: 10, alignItems: 'center' }}>
                <button
                  ref={startRef}
                  className="bmt-primary bmt-focus"
                  onClick={onStart}
                  style={{
                    flex: 1,
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 8,
                    borderRadius: 14,
                    background: 'linear-gradient(135deg,#1a3a8a,#2563eb)',
                    color: '#fff',
                    border: 'none',
                    padding: '14px 20px',
                    fontSize: 14,
                    fontWeight: 700,
                    cursor: 'pointer',
                    boxShadow: `0 14px 30px -10px ${hexA(BLUE, 0.6)}`,
                  }}
                >
                  {cfg.startLabel || 'Take a quick tour'} <Arrow width={15} height={15} />
                </button>
                <button
                  className="bmt-ghost bmt-focus"
                  onClick={onSkip}
                  style={{
                    borderRadius: 14,
                    background: 'rgba(255,255,255,0.04)',
                    color: MUTED,
                    border: `1px solid ${LINE}`,
                    padding: '14px 18px',
                    fontSize: 14,
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  Skip
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

/* ─── Tour layer: spotlight + tooltip ───────────────────────────────────── */
function TourLayer({
  step,
  stepIdx,
  total,
  rect,
  onNext,
  onPrev,
  onSkip,
}: {
  step: TourStep;
  stepIdx: number;
  total: number;
  rect: Rect | null;
  onNext: () => void;
  onPrev: () => void;
  onSkip: () => void;
}) {
  const tone = step.tone || BLUE;
  const isLast = stepIdx === total - 1;
  const nextRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    nextRef.current?.focus();
  }, [stepIdx]);

  const spot = rect
    ? {
        top: rect.top - PAD,
        left: rect.left - PAD,
        width: rect.width + PAD * 2,
        height: rect.height + PAD * 2,
      }
    : null;

  /* Placement math, memoised on the inputs that affect it. */
  const layout = useMemo(() => {
    const vw = typeof window !== 'undefined' ? window.innerWidth : 1024;
    const vh = typeof window !== 'undefined' ? window.innerHeight : 768;
    const TT_W = Math.min(TT_MAXW, vw - 32);

    let ttTop = vh / 2 - 100;
    let ttLeft = vw / 2 - TT_W / 2;
    let placement: Placement = 'below';
    let pointerLeft = TT_W / 2;

    if (spot) {
      const below = spot.top + spot.height + TT_EST_H < vh;
      placement = below ? 'below' : 'above';
      ttTop = below ? spot.top + spot.height + GAP : spot.top - GAP - TT_EST_H;
      const rawLeft = spot.left + spot.width / 2 - TT_W / 2;
      ttLeft = Math.min(Math.max(rawLeft, 16), vw - TT_W - 16);
      ttTop = Math.min(Math.max(ttTop, 16), vh - TT_EST_H - 16);
      const targetCenterX = spot.left + spot.width / 2;
      pointerLeft = Math.min(Math.max(targetCenterX - ttLeft, 24), TT_W - 24);
    }
    return { TT_W, ttTop, ttLeft, placement, pointerLeft };
  }, [spot?.top, spot?.left, spot?.width, spot?.height]); // eslint-disable-line react-hooks/exhaustive-deps

  const { TT_W, ttTop, ttLeft, placement, pointerLeft } = layout;

  const ringVars = {
    ['--bmt-ring' as never]: hexA(tone, 0.9),
    ['--bmt-rot' as never]: placement === 'below' ? 'rotate(45deg)' : 'rotate(225deg)',
  } as React.CSSProperties;

  const SPOT_TRANS =
    'top .42s cubic-bezier(0.16,1,0.3,1), left .42s cubic-bezier(0.16,1,0.3,1), width .42s cubic-bezier(0.16,1,0.3,1), height .42s cubic-bezier(0.16,1,0.3,1)';

  return (
    <>
      {/* Dimmer. With a spot we use an SVG mask so the target stays bright AND
          interactive-looking, with crisp edges and a soft inner vignette. */}
      <div className="bmt-overlay" onClick={onSkip} style={{ position: 'absolute', inset: 0 }}>
        {spot ? (
          <>
            {/* punched-out scrim */}
            <svg
              width="100%"
              height="100%"
              style={{ position: 'absolute', inset: 0, display: 'block' }}
              aria-hidden
            >
              <defs>
                <mask id="bmt-mask">
                  <rect x="0" y="0" width="100%" height="100%" fill="white" />
                  <rect
                    x={spot.left}
                    y={spot.top}
                    width={spot.width}
                    height={spot.height}
                    rx="16"
                    ry="16"
                    fill="black"
                    style={{ transition: SPOT_TRANS }}
                  />
                </mask>
              </defs>
              <rect
                x="0"
                y="0"
                width="100%"
                height="100%"
                fill="rgba(2,5,11,0.82)"
                mask="url(#bmt-mask)"
              />
            </svg>

            {/* animated focus ring around the target */}
            <div
              style={{
                position: 'absolute',
                top: spot.top,
                left: spot.left,
                width: spot.width,
                height: spot.height,
                borderRadius: 16,
                boxShadow: `0 0 0 2px ${hexA(tone, 0.95)}, 0 0 0 6px ${hexA(tone, 0.22)}, 0 0 40px ${hexA(tone, 0.45)}`,
                transition: SPOT_TRANS,
                pointerEvents: 'none',
              }}
            />
            {/* pulsing echo */}
            <div
              className="bmt-pulse"
              style={{
                position: 'absolute',
                top: spot.top,
                left: spot.left,
                width: spot.width,
                height: spot.height,
                borderRadius: 16,
                border: `2px solid ${hexA(tone, 0.6)}`,
                transformOrigin: 'center',
                animation: 'bmt-ring 2.2s ease-out infinite',
                transition: SPOT_TRANS,
                pointerEvents: 'none',
              }}
            />
          </>
        ) : (
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(2,5,11,0.82)' }} />
        )}
      </div>

      {/* Tooltip */}
      <div
        className="bmt-card"
        onClick={(e) => e.stopPropagation()}
        style={{
          position: 'absolute',
          top: ttTop,
          left: ttLeft,
          width: TT_W,
          borderRadius: 20,
          background: `linear-gradient(160deg,${CARD},#0a1626)`,
          border: `1px solid ${hexA(tone, 0.4)}`,
          boxShadow: `0 30px 70px -25px rgba(0,0,0,0.9), 0 0 0 1px ${hexA(tone, 0.08)}, inset 0 1px 0 ${hexA('#ffffff', 0.05)}`,
          padding: 22,
          pointerEvents: 'auto',
          transition: 'top .42s cubic-bezier(0.16,1,0.3,1), left .42s cubic-bezier(0.16,1,0.3,1)',
          ...ringVars,
        }}
      >
        {/* Directional pointer toward the target */}
        {spot && (
          <span
            className="bmt-pointer"
            aria-hidden
            style={{
              position: 'absolute',
              left: pointerLeft - 7,
              [placement === 'below' ? 'top' : 'bottom']: -7,
              width: 13,
              height: 13,
              background: CARD,
              borderLeft: `1px solid ${hexA(tone, 0.4)}`,
              borderTop: `1px solid ${hexA(tone, 0.4)}`,
              transform: placement === 'below' ? 'rotate(45deg)' : 'rotate(225deg)',
            }}
          />
        )}

        <div style={{ display: 'flex', alignItems: 'center', gap: 11, marginBottom: 10, paddingRight: 46 }}>
          <span
            style={{
              width: 28,
              height: 28,
              flexShrink: 0,
              borderRadius: 9,
              background: `linear-gradient(135deg,${hexA(tone, 0.28)},${hexA(tone, 0.12)})`,
              border: `1px solid ${hexA(tone, 0.4)}`,
              color: tone,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontFamily: SANS,
              fontSize: 13,
              fontWeight: 800,
            }}
          >
            {stepIdx + 1}
          </span>
          <h3
            style={{
              fontFamily: SANS,
              fontSize: 16,
              fontWeight: 700,
              color: TEXT,
              margin: 0,
              flex: 1,
              minWidth: 0,
            }}
          >
            {step.title}
          </h3>
          <span
            style={{
              fontSize: 10.5,
              fontWeight: 600,
              color: FAINT,
              fontFamily: '"JetBrains Mono",monospace',
              flexShrink: 0,
            }}
          >
            {stepIdx + 1}/{total}
          </span>
        </div>

        <p style={{ fontSize: 13.5, lineHeight: 1.64, color: MUTED, margin: 0 }}>{step.body}</p>

        <div
          style={{
            marginTop: 20,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 12,
          }}
        >
          {/* progress dots */}
          <div style={{ display: 'flex', gap: 5, alignItems: 'center' }}>
            {Array.from({ length: total }).map((_, i) => (
              <span
                key={i}
                style={{
                  height: 5,
                  borderRadius: 99,
                  width: i === stepIdx ? 22 : 6,
                  background:
                    i === stepIdx
                      ? tone
                      : i < stepIdx
                        ? hexA(tone, 0.45)
                        : 'rgba(255,255,255,0.14)',
                  boxShadow: i === stepIdx ? `0 0 10px ${hexA(tone, 0.6)}` : 'none',
                  transition: 'all .28s',
                  display: 'block',
                }}
              />
            ))}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {stepIdx > 0 && (
              <button
                className="bmt-ghost bmt-focus"
                onClick={onPrev}
                style={{
                  borderRadius: 10,
                  background: 'rgba(255,255,255,0.04)',
                  color: MUTED,
                  border: `1px solid ${LINE}`,
                  padding: '9px 14px',
                  fontSize: 12.5,
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                Back
              </button>
            )}
            <button
              ref={nextRef}
              className="bmt-primary bmt-focus"
              onClick={onNext}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                borderRadius: 10,
                background: `linear-gradient(135deg,${hexA(tone, 0.92)},${tone})`,
                color: '#fff',
                border: 'none',
                padding: '9px 17px',
                fontSize: 12.5,
                fontWeight: 700,
                cursor: 'pointer',
                boxShadow: `0 8px 20px -8px ${hexA(tone, 0.7)}`,
              }}
            >
              {isLast ? 'Done' : 'Next'} {!isLast && <Arrow width={13} height={13} />}
            </button>
          </div>
        </div>

        <button
          className="bmt-skip bmt-focus"
          onClick={onSkip}
          style={{
            position: 'absolute',
            top: 12,
            right: 12,
            background: 'none',
            border: 'none',
            color: FAINT,
            fontSize: 11.5,
            fontWeight: 600,
            cursor: 'pointer',
            padding: '4px 7px',
            borderRadius: 7,
          }}
        >
          Skip
        </button>
      </div>
    </>
  );
}