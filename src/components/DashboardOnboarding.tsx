
'use client';

import {
  useState,
  useEffect,
  useCallback,
  useLayoutEffect,
  useRef,
  useMemo,
  memo,
} from 'react';
import { createClient } from '@/utils/supabase/client';

/* ════════════════════════════════════════════════════════════════════════
   BUILD MIND — DASHBOARD ONBOARDING  (optimised + premium UI)
   ════════════════════════════════════════════════════════════════════════ */

// ── Design tokens ─────────────────────────────────────────────────────────
const T = {
  bg: '#04080f',
  card: '#0c1828',
  cardGlass: 'rgba(12,24,40,0.85)',
  line: 'rgba(255,255,255,0.08)',
  lineHover: 'rgba(255,255,255,0.14)',
  text: '#eaf0fa',
  muted: 'rgba(234,240,250,0.55)',
  faint: 'rgba(234,240,250,0.30)',
  blue: '#3b82f6',
  blueLt: '#93c5fd',
  amber: '#f59e0b',
  green: '#10b981',
  violet: '#8b5cf6',
  sans: '"Space Grotesk",sans-serif',
  inter: '"Inter",system-ui,sans-serif',
} as const;

const rgba = (hex: string, a: number): string => {
  const h = hex.replace('#', '');
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return `rgba(${r},${g},${b},${a})`;
};

// ── Types ──────────────────────────────────────────────────────────────────
type Phase = 'idle' | 'welcome' | 'tour' | 'done';

type TourStep = {
  selector: string;
  title: string;
  body: string;
  tone: string;
  icon: React.FC<React.SVGProps<SVGSVGElement>>;
};

// ── Icons (memoised to avoid new references each render) ──────────────────
const IcoBlocks = memo((p: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"
    strokeLinecap="round" strokeLinejoin="round" {...p}>
    <rect x="3" y="3" width="7" height="7" rx="1.5" />
    <rect x="14" y="3" width="7" height="7" rx="1.5" />
    <rect x="3" y="14" width="7" height="7" rx="1.5" />
    <rect x="14" y="14" width="7" height="7" rx="1.5" />
  </svg>
));
IcoBlocks.displayName = 'IcoBlocks';

const IcoBook = memo((p: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"
    strokeLinecap="round" strokeLinejoin="round" {...p}>
    <path d="M4 19V6a2 2 0 0 1 2-2h13v15M4 19a2 2 0 0 0 2 2h13M4 19a2 2 0 0 1 2-2h13" />
  </svg>
));
IcoBook.displayName = 'IcoBook';

const IcoBolt = memo((p: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"
    strokeLinecap="round" strokeLinejoin="round" {...p}>
    <path d="M13 2 4 14h7l-1 8 9-12h-7l1-8z" />
  </svg>
));
IcoBolt.displayName = 'IcoBolt';

const IcoArrow = memo((p: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"
    strokeLinecap="round" strokeLinejoin="round" {...p}>
    <path d="M5 12h14M12 5l7 7-7 7" />
  </svg>
));
IcoArrow.displayName = 'IcoArrow';

const IcoSpark = memo((p: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"
    strokeLinecap="round" strokeLinejoin="round" {...p}>
    <path d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5 18 18M18 6l-2.5 2.5M8.5 15.5 6 18" />
  </svg>
));
IcoSpark.displayName = 'IcoSpark';

const IcoChevronLeft = memo((p: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"
    strokeLinecap="round" strokeLinejoin="round" {...p}>
    <path d="M15 18l-6-6 6-6" />
  </svg>
));
IcoChevronLeft.displayName = 'IcoChevronLeft';

const IcoCheck = memo((p: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
    strokeLinecap="round" strokeLinejoin="round" {...p}>
    <polyline points="20 6 9 17 4 12" />
  </svg>
));
IcoCheck.displayName = 'IcoCheck';

// ── Tour steps (stable reference — defined outside component) ─────────────
const TOUR_STEPS: TourStep[] = [
  {
    selector: '[data-tour="hero-cta"]',
    title: '"Start first project" button',
    body: 'That blue button in the hero — tap it to kick off your first guided project. Each one walks you through wiring and code, step by step.',
    tone: T.blue,
    icon: IcoBlocks as unknown as React.FC<React.SVGProps<SVGSVGElement>>,

  },
  {
    selector: '[data-tour="features"]',
    title: 'Three ways to build',
    body: 'Playground to experiment freely, Learn for a structured path, and Activities for guided real-world projects. All share the same simulator.',
    tone: T.violet,
    icon: IcoBlocks as unknown as React.FC<React.SVGProps<SVGSVGElement>>,
  },
  {
    selector: '[data-tour="progress"]',
    title: 'Track your progress',
    body: 'Your completed projects, streak, and XP show up here as you go. Come back anytime to pick up where you left off.',
    tone: T.amber,
    icon: IcoBolt as unknown as React.FC<React.SVGProps<SVGSVGElement>>,
  },
];

// ── Global styles (injected once, not per-render) ─────────────────────────
const GLOBAL_STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=Inter:wght@400;500;600;700&display=swap');

  @keyframes bmo-rise  { from { opacity:0; transform:translateY(20px) scale(.97) } to { opacity:1; transform:none } }
  @keyframes bmo-fade  { from { opacity:0 } to { opacity:1 } }
  @keyframes bmo-slide { from { opacity:0; transform:translateX(12px) } to { opacity:1; transform:none } }
  @keyframes bmo-pulse-ring {
    0%   { box-shadow: 0 0 0 0 var(--pulse-color); }
    70%  { box-shadow: 0 0 0 10px transparent; }
    100% { box-shadow: 0 0 0 0 transparent; }
  }
  .bmo-overlay  { animation: bmo-fade .35s ease both; }
  .bmo-welcome  { animation: bmo-rise  .45s cubic-bezier(0.16,1,0.3,1) both; }
  .bmo-tooltip  { animation: bmo-slide .35s cubic-bezier(0.16,1,0.3,1) both; }
  .bmo-spotlight { animation: bmo-pulse-ring 2s ease-out infinite; }

  .bmo-btn-primary {
    transition: transform .2s cubic-bezier(0.16,1,0.3,1), filter .2s, box-shadow .2s;
    will-change: transform;
  }
  .bmo-btn-primary:hover  { transform: translateY(-2px); filter: brightness(1.1); }
  .bmo-btn-primary:active { transform: translateY(0) scale(.97); filter: brightness(.95); }

  .bmo-btn-ghost {
    transition: background .18s, color .18s, border-color .18s;
  }
  .bmo-btn-ghost:hover { background: rgba(255,255,255,0.08) !important; }

  .bmo-feature-card {
    transition: background .2s, border-color .2s, transform .2s cubic-bezier(0.16,1,0.3,1);
  }
  .bmo-feature-card:hover {
    transform: translateX(4px);
    border-color: rgba(255,255,255,0.16) !important;
  }

  @media (prefers-reduced-motion: reduce) {
    .bmo-overlay, .bmo-welcome, .bmo-tooltip, .bmo-spotlight,
    .bmo-btn-primary, .bmo-btn-ghost, .bmo-feature-card {
      animation: none !important;
      transition: none !important;
    }
  }
`;

// ── Inject global styles once ──────────────────────────────────────────────
let stylesInjected = false;
function ensureStyles() {
  if (stylesInjected || typeof document === 'undefined') return;
  const tag = document.createElement('style');
  tag.setAttribute('data-bmo', '1');
  tag.textContent = GLOBAL_STYLES;
  document.head.appendChild(tag);
  stylesInjected = true;
}

// ── Hook: stable viewport size ─────────────────────────────────────────────
function useViewport() {
  const [size, setSize] = useState<{ vw: number; vh: number }>({ vw: 1024, vh: 768 });

  useLayoutEffect(() => {
    const update = () =>
      setSize({ vw: window.innerWidth, vh: window.innerHeight });
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);

  return size;
}

// ── Hook: spotlight rect ───────────────────────────────────────────────────
// Waits for smooth-scroll to fully settle before measuring the target element.
// Uses native 'scrollend' when available; falls back to a scroll-event debounce.
function useSpotlightRect(selector: string | null, phase: Phase) {
  const [rect, setRect] = useState<DOMRect | null>(null);
  const rafRef = useRef<number>(0);
  const scrollTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const measure = useCallback(() => {
    if (!selector || phase !== 'tour') { setRect(null); return; }
    const el = document.querySelector<HTMLElement>(selector);
    setRect(el ? el.getBoundingClientRect() : null);
  }, [selector, phase]);

  const scheduleMeasure = useCallback(() => {
    cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(measure);
  }, [measure]);

  // Scroll target into view, then wait for scroll to fully settle before measuring.
  useLayoutEffect(() => {
    if (phase !== 'tour' || !selector) return;

    const el = document.querySelector<HTMLElement>(selector);
    if (!el) { setRect(null); return; }

    el.scrollIntoView({ behavior: 'smooth', block: 'center' });

    const supportsScrollEnd = 'onscrollend' in window;
    let cleanup: (() => void) | undefined;

    if (supportsScrollEnd) {
      // 'scrollend' fires once the scroll animation is fully complete
      const onScrollEnd = () => scheduleMeasure();
      const t = setTimeout(() => {
        window.addEventListener('scrollend', onScrollEnd, { once: true });
      }, 80);
      // safety net: measure anyway after 700ms if scrollend never fires
      const safety = setTimeout(scheduleMeasure, 700);
      cleanup = () => {
        clearTimeout(t);
        clearTimeout(safety);
        window.removeEventListener('scrollend', onScrollEnd);
      };
    } else {
      // Fallback: debounce on scroll events; measure 150ms after last scroll event
      const onScroll = () => {
        if (scrollTimerRef.current) clearTimeout(scrollTimerRef.current);
        scrollTimerRef.current = setTimeout(scheduleMeasure, 150);
      };
      window.addEventListener('scroll', onScroll, { passive: true });
      // also measure after 600ms in case the element is already in view (no scroll)
      const t = setTimeout(scheduleMeasure, 600);
      cleanup = () => {
        clearTimeout(t);
        if (scrollTimerRef.current) clearTimeout(scrollTimerRef.current);
        window.removeEventListener('scroll', onScroll);
      };
    }

    return cleanup;
  }, [phase, selector, scheduleMeasure]);

  // Watch for layout shifts after initial measure
  useEffect(() => {
    if (phase !== 'tour') return;
    const ro = new ResizeObserver(scheduleMeasure);
    ro.observe(document.documentElement);
    window.addEventListener('resize', scheduleMeasure);
    return () => {
      ro.disconnect();
      window.removeEventListener('resize', scheduleMeasure);
      cancelAnimationFrame(rafRef.current);
    };
  }, [phase, scheduleMeasure]);

  return rect;
}

// ── Hook: focus trap ───────────────────────────────────────────────────────
function useFocusTrap(active: boolean) {
  const ref = useRef<HTMLDivElement>(null);
  const prev = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!active) return;
    prev.current = document.activeElement as HTMLElement;

    const onKey = (e: KeyboardEvent) => {
      const el = ref.current;
      if (!el) return;
      const nodes = el.querySelectorAll<HTMLElement>(
        'button,[href],input,select,textarea,[tabindex]:not([tabindex="-1"])'
      );
      const first = nodes[0];
      const last = nodes[nodes.length - 1];
      if (e.key !== 'Tab') return;
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last?.focus(); }
      else if (!e.shiftKey && document.activeElement === last)  { e.preventDefault(); first?.focus(); }
    };

    document.addEventListener('keydown', onKey);
    const t = setTimeout(() => ref.current?.querySelector<HTMLElement>('button')?.focus(), 80);
    return () => {
      clearTimeout(t);
      document.removeEventListener('keydown', onKey);
      prev.current?.focus();
    };
  }, [active]);

  return ref;
}

// ══════════════════════════════════════════════════════════════════════════
//  ROOT COMPONENT
// ══════════════════════════════════════════════════════════════════════════
export default function DashboardOnboarding() {
  // Stable supabase client — never recreated
  const supabase = useMemo(() => createClient(), []);

  const [phase, setPhase] = useState<Phase>('idle');
  const [stepIdx, setStepIdx] = useState(0);

  // Inject styles once on mount
  useEffect(() => { ensureStyles(); }, []);

  // Check onboarding status
  useEffect(() => {
    let cancelled = false;
    supabase.auth.getUser().then(({ data }) => {
      if (cancelled) return;
      if (data.user?.user_metadata?.has_onboarded !== true) {
        setTimeout(() => setPhase('welcome'), 650);
      }
    });
    return () => { cancelled = true; };
  }, [supabase]);

  // Replay support
  useEffect(() => {
    const replay = () => { setStepIdx(0); setPhase('welcome'); };
    window.addEventListener('bm-replay-tour', replay);
    return () => window.removeEventListener('bm-replay-tour', replay);
  }, []);

  const markDone = useCallback(() => {
    supabase.auth.updateUser({ data: { has_onboarded: true } }).catch(console.warn);
  }, [supabase]);

  const finish = useCallback(() => { setPhase('done'); markDone(); }, [markDone]);
  const startTour = useCallback(() => { setStepIdx(0); setPhase('tour'); }, []);

  const nextStep = useCallback(() => {
    setStepIdx(i => {
      if (i < TOUR_STEPS.length - 1) return i + 1;
      finish();
      return i;
    });
  }, [finish]);

  const prevStep = useCallback(() => setStepIdx(i => Math.max(0, i - 1)), []);

  // Global keyboard shortcuts
  useEffect(() => {
    if (phase === 'idle' || phase === 'done') return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') finish();
      if (phase === 'tour') {
        if (e.key === 'ArrowRight' || e.key === 'Enter') nextStep();
        if (e.key === 'ArrowLeft') prevStep();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [phase, nextStep, prevStep, finish]);

  const trapRef = useFocusTrap(phase === 'welcome' || phase === 'tour');

  if (phase === 'idle' || phase === 'done') return null;

  return (
    <div
      ref={trapRef}
      role="dialog"
      aria-modal="true"
      aria-label="Getting started with Build Mind"
      style={{ position: 'fixed', inset: 0, zIndex: 9999, fontFamily: T.inter }}
    >
      {phase === 'welcome' && (
        <WelcomeModal onStart={startTour} onSkip={finish} />
      )}
      {phase === 'tour' && (
        <TourLayer
          stepIdx={stepIdx}
          onNext={nextStep}
          onPrev={prevStep}
          onSkip={finish}
        />
      )}
    </div>
  );
}

/* ─── Welcome Modal ──────────────────────────────────────────────────────── */
const FEATURE_CARDS = [
  { icon: IcoBlocks, title: 'Playground', tone: T.blue,   desc: 'Drag blocks, see real code, run it live.' },
  { icon: IcoBook,   title: 'Learn',       tone: T.amber,  desc: 'A guided path from first LED to IoT.' },
  { icon: IcoBolt,   title: 'Activities',  tone: T.green,  desc: 'Wire up real projects, step by step.' },
] as const;

const WelcomeModal = memo(({ onStart, onSkip }: { onStart: () => void; onSkip: () => void }) => (
  <>
    {/* Backdrop */}
    <div
      className="bmo-overlay"
      onClick={onSkip}
      style={{
        position: 'absolute', inset: 0,
        background: 'rgba(2,5,11,0.82)',
        backdropFilter: 'blur(6px)',
        WebkitBackdropFilter: 'blur(6px)',
      }}
    />

    {/* Centre-stage card */}
    <div style={{
      position: 'absolute', inset: 0,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 20, pointerEvents: 'none',
    }}>
      <div
        className="bmo-welcome"
        style={{
          pointerEvents: 'auto',
          width: '100%', maxWidth: 500,
          borderRadius: 28,
          background: `linear-gradient(160deg,#091422 0%,#070f1d 55%,#050c18 100%)`,
          border: `1px solid rgba(255,255,255,0.09)`,
          boxShadow: '0 50px 100px -30px rgba(0,0,0,0.98), 0 0 0 1px rgba(255,255,255,0.04) inset',
          overflow: 'hidden',
          position: 'relative',
        }}
      >
        {/* Top rainbow bar */}
        <div style={{ height: 3, background: `linear-gradient(90deg,${T.blue},${T.violet} 48%,${T.amber})` }} />

        {/* Ambient glow mesh */}
        <div style={{
          position: 'absolute', top: -60, right: -40, width: 240, height: 240,
          borderRadius: '50%',
          background: `radial-gradient(circle,${rgba(T.violet, 0.12)} 0%,transparent 70%)`,
          pointerEvents: 'none',
        }} />
        <div style={{
          position: 'absolute', bottom: -40, left: -30, width: 200, height: 200,
          borderRadius: '50%',
          background: `radial-gradient(circle,${rgba(T.blue, 0.1)} 0%,transparent 70%)`,
          pointerEvents: 'none',
        }} />

        <div style={{ padding: '30px 28px 28px', position: 'relative' }}>

          {/* Badge */}
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 7,
            background: rgba(T.blue, 0.10),
            border: `1px solid ${rgba(T.blue, 0.22)}`,
            borderRadius: 99, padding: '5px 13px', marginBottom: 20,
          }}>
            <span style={{ color: T.blueLt, display: 'flex' }}><IcoSpark width={12} height={12} /></span>
            <span style={{
              fontSize: 10, fontWeight: 700, letterSpacing: '0.13em',
              textTransform: 'uppercase', color: T.blueLt, fontFamily: T.sans,
            }}>Welcome to Build Mind</span>
          </div>

          {/* Headline */}
          <h2 style={{
            fontFamily: T.sans, fontSize: 26, fontWeight: 700,
            lineHeight: 1.2, letterSpacing: -0.6, color: T.text, margin: 0,
          }}>
            Build real ESP32 hardware,<br />
            <span style={{
              background: `linear-gradient(90deg,${T.blueLt},${rgba(T.violet, 0.9)})`,
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
            }}>the easy way.</span>
          </h2>

          <p style={{ marginTop: 10, fontSize: 14, lineHeight: 1.65, color: T.muted, maxWidth: 400 }}>
            Code with blocks, test on a live simulator, and flash to a real board — here is what you can explore.
          </p>

          {/* Feature cards */}
          <div style={{ marginTop: 20, display: 'flex', flexDirection: 'column', gap: 9 }}>
            {FEATURE_CARDS.map(({ icon: Icon, title, tone, desc }) => (
              <div
                key={title}
                className="bmo-feature-card"
                style={{
                  display: 'flex', alignItems: 'center', gap: 14,
                  padding: '13px 15px', borderRadius: 16,
                  background: 'rgba(255,255,255,0.028)',
                  border: `1px solid ${T.line}`,
                }}
              >
                <span style={{
                  width: 42, height: 42, flexShrink: 0, borderRadius: 13,
                  background: rgba(tone, 0.13),
                  border: `1px solid ${rgba(tone, 0.2)}`,
                  color: tone,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <Icon width={20} height={20} />
                </span>
                <div style={{ minWidth: 0 }}>
                  <p style={{ fontFamily: T.sans, fontSize: 14, fontWeight: 700, color: T.text, margin: 0 }}>
                    {title}
                  </p>
                  <p style={{ fontSize: 12.5, color: T.muted, margin: '2px 0 0', lineHeight: 1.45 }}>
                    {desc}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* CTA row */}
          <div style={{ marginTop: 24, display: 'flex', gap: 10, alignItems: 'center' }}>
            <button
              className="bmo-btn-primary"
              onClick={onStart}
              style={{
                flex: 1, display: 'inline-flex', alignItems: 'center',
                justifyContent: 'center', gap: 8,
                borderRadius: 14, border: 'none', cursor: 'pointer',
                padding: '14px 22px', fontSize: 14, fontWeight: 700,
                fontFamily: T.sans, color: '#fff',
                background: `linear-gradient(135deg,#1a3a8a,#2563eb 60%,#3b82f6)`,
                boxShadow: `0 14px 32px -10px ${rgba(T.blue, 0.6)}, 0 0 0 1px ${rgba(T.blue, 0.25)} inset`,
              }}
            >
              Take a quick tour <IcoArrow width={15} height={15} />
            </button>
            <button
              className="bmo-btn-ghost"
              onClick={onSkip}
              style={{
                borderRadius: 14, cursor: 'pointer',
                background: 'rgba(255,255,255,0.04)',
                color: T.muted, border: `1px solid ${T.line}`,
                padding: '14px 20px', fontSize: 14, fontWeight: 600,
                fontFamily: T.sans,
              }}
            >
              Skip
            </button>
          </div>

          {/* Keyboard hint */}
          <p style={{ marginTop: 14, fontSize: 11, color: T.faint, textAlign: 'center' }}>
            Press <kbd style={{ background: 'rgba(255,255,255,0.07)', borderRadius: 4, padding: '1px 5px', fontFamily: 'monospace', fontSize: 10.5 }}>Esc</kbd> anytime to dismiss
          </p>
        </div>
      </div>
    </div>
  </>
));
WelcomeModal.displayName = 'WelcomeModal';

/* ─── Tour Layer ─────────────────────────────────────────────────────────── */
const PAD = 12;

const TourLayer = memo(({
  stepIdx, onNext, onPrev, onSkip,
}: {
  stepIdx: number;
  onNext: () => void;
  onPrev: () => void;
  onSkip: () => void;
}) => {
  const step   = TOUR_STEPS[stepIdx];
  const isLast = stepIdx === TOUR_STEPS.length - 1;
  const { vw, vh } = useViewport();

  // Only pass the current selector so the hook stays stable
  const rawRect = useSpotlightRect(step.selector, 'tour');

  const spot = useMemo(() => {
    if (!rawRect) return null;
    return {
      top: rawRect.top - PAD,
      left: rawRect.left - PAD,
      width: rawRect.width + PAD * 2,
      height: rawRect.height + PAD * 2,
    };
  }, [rawRect]);

  const tooltipStyle = useMemo(() => {
    const TT_W = Math.min(340, vw - 32);
    const TT_H = 220; // approximate tooltip height
    const GAP  = 16;
    let top  = vh / 2 - TT_H / 2;
    let left = vw / 2 - TT_W / 2;

    if (spot) {
      // Prefer placing below; fall back to above if no room
      const roomBelow = spot.top + spot.height + GAP + TT_H < vh;
      const roomAbove = spot.top - GAP - TT_H > 0;

      if (roomBelow) {
        top = spot.top + spot.height + GAP;
      } else if (roomAbove) {
        top = spot.top - GAP - TT_H;
      } else {
        // Neither fits cleanly — center vertically and offset horizontally
        top  = Math.max(GAP, Math.min(vh / 2 - TT_H / 2, vh - TT_H - GAP));
        left = spot.left > vw / 2
          ? Math.max(GAP, spot.left - TT_W - GAP)           // place left of spot
          : Math.min(spot.left + spot.width + GAP, vw - TT_W - GAP); // place right
        return { top, left, width: TT_W };
      }

      // Horizontal: centre on the spotlight, clamped to viewport
      left = spot.left + spot.width / 2 - TT_W / 2;
      left = Math.min(Math.max(left, GAP), vw - TT_W - GAP);
      top  = Math.min(Math.max(top, GAP), vh - TT_H - GAP);
    }

    return { top, left, width: TT_W };
  }, [spot, vw, vh]);

  const Icon = step.icon;

  return (
    <>
      {/* Scrim + spotlight cutout */}
      <div
        className="bmo-overlay"
        onClick={onSkip}
        style={{ position: 'absolute', inset: 0 }}
      >
        {spot ? (
          <div
            className="bmo-spotlight"
            style={{
              position: 'absolute',
              top: spot.top, left: spot.left,
              width: spot.width, height: spot.height,
              borderRadius: 18,
              /* Spotlight cutout via large outer shadow */
              boxShadow: `0 0 0 9999px rgba(2,5,11,0.82), 0 0 0 2px ${rgba(step.tone, 0.8)}`,
              transition: 'top .38s cubic-bezier(0.16,1,0.3,1), left .38s cubic-bezier(0.16,1,0.3,1), width .38s cubic-bezier(0.16,1,0.3,1), height .38s cubic-bezier(0.16,1,0.3,1)',
              pointerEvents: 'none',
              '--pulse-color': rgba(step.tone, 0.45),
            } as React.CSSProperties}
          />
        ) : (
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(2,5,11,0.82)' }} />
        )}
      </div>

      {/* Tooltip card */}
      <div
        key={stepIdx}           /* key forces re-animation on step change */
        className="bmo-tooltip"
        onClick={e => e.stopPropagation()}
        style={{
          position: 'absolute',
          ...tooltipStyle,
          borderRadius: 20,
          background: `linear-gradient(155deg,#091422 0%,#06101e 100%)`,
          border: `1px solid ${rgba(step.tone, 0.30)}`,
          boxShadow: `0 32px 72px -24px rgba(0,0,0,0.95), 0 0 0 1px ${rgba(step.tone, 0.08)} inset`,
          padding: '20px 20px 18px',
          pointerEvents: 'auto',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
        }}
      >
        {/* Step badge */}
        <div style={{
          position: 'absolute', top: 16, right: 42,
          fontSize: 10.5, fontWeight: 700, fontFamily: T.sans,
          color: T.faint, letterSpacing: '0.08em',
        }}>
          {stepIdx + 1} / {TOUR_STEPS.length}
        </div>

        {/* Close */}
        <button
          onClick={onSkip}
          aria-label="Skip tour"
          style={{
            position: 'absolute', top: 12, right: 12,
            width: 26, height: 26, borderRadius: 8,
            background: 'rgba(255,255,255,0.05)',
            border: `1px solid ${T.line}`,
            color: T.faint, cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 13, fontWeight: 700, lineHeight: 1,
          }}
        >
          ✕
        </button>

        {/* Icon + title */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 11 }}>
          <span style={{
            width: 40, height: 40, flexShrink: 0, borderRadius: 12,
            background: rgba(step.tone, 0.13),
            border: `1px solid ${rgba(step.tone, 0.22)}`,
            color: step.tone,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: `0 6px 18px -6px ${rgba(step.tone, 0.5)}`,
          }}>
            <Icon width={20} height={20} />
          </span>
          <h3 style={{
            fontFamily: T.sans, fontSize: 16, fontWeight: 700,
            color: T.text, margin: 0, letterSpacing: -0.2,
          }}>
            {step.title}
          </h3>
        </div>

        {/* Body */}
        <p style={{ fontSize: 13.5, lineHeight: 1.65, color: T.muted, margin: 0 }}>
          {step.body}
        </p>

        {/* Footer */}
        <div style={{
          marginTop: 18, display: 'flex',
          alignItems: 'center', justifyContent: 'space-between', gap: 10,
        }}>
          {/* Dot progress */}
          <div style={{ display: 'flex', gap: 5, alignItems: 'center' }}>
            {TOUR_STEPS.map((_, i) => (
              <span
                key={i}
                style={{
                  height: 5, borderRadius: 99, display: 'block',
                  width: i === stepIdx ? 20 : 6,
                  background: i === stepIdx ? step.tone : 'rgba(255,255,255,0.14)',
                  transition: 'width .25s cubic-bezier(0.16,1,0.3,1), background .25s',
                }}
              />
            ))}
          </div>

          {/* Nav buttons */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {stepIdx > 0 && (
              <button
                className="bmo-btn-ghost"
                onClick={onPrev}
                aria-label="Previous step"
                style={{
                  borderRadius: 11, cursor: 'pointer',
                  background: 'rgba(255,255,255,0.04)',
                  color: T.muted, border: `1px solid ${T.line}`,
                  padding: '8px 10px', display: 'flex', alignItems: 'center',
                }}
              >
                <IcoChevronLeft width={14} height={14} />
              </button>
            )}
            <button
              className="bmo-btn-primary"
              onClick={onNext}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                borderRadius: 11, border: 'none', cursor: 'pointer',
                padding: isLast ? '9px 16px' : '9px 14px',
                fontSize: 13, fontWeight: 700, fontFamily: T.sans, color: '#fff',
                background: isLast
                  ? `linear-gradient(135deg,${rgba(T.green, 0.9)},${T.green})`
                  : `linear-gradient(135deg,${rgba(step.tone, 0.85)},${step.tone})`,
                boxShadow: `0 8px 22px -8px ${rgba(isLast ? T.green : step.tone, 0.7)}`,
              }}
            >
              {isLast
                ? <><IcoCheck width={13} height={13} /> Done</>
                : <>Next <IcoArrow width={13} height={13} /></>}
            </button>
          </div>
        </div>
      </div>
    </>
  );
});
TourLayer.displayName = 'TourLayer';