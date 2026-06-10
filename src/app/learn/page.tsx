'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

import Header from '@/components/Header';
import { LEVELS } from '@/lib/lessonConfig';
import { useActivityStore } from '@/store/useActivityStore';
import CircuitCanvas from '@/components/CircuitCanvas';

/* ─────────────────────────────────────────
   SVG icons
───────────────────────────────────────── */
const ChevronDown = ({ open }: { open: boolean }) => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
    style={{ transition: 'transform .3s cubic-bezier(0.16,1,0.3,1)', transform: open ? 'rotate(180deg)' : 'none', flexShrink: 0 }}>
    <polyline points="6 9 12 15 18 9" />
  </svg>
);
const CheckIcon = ({ size = 10 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12" />
  </svg>
);
const LockIcon = ({ size = 9 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="11" width="18" height="11" rx="2" />
    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
  </svg>
);
const ClockIcon = () => (
  <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" />
  </svg>
);
const ArrowRight = () => (
  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M5 12h14M12 5l7 7-7 7" />
  </svg>
);
const BoltIcon = ({ size = 9 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M13 2 4 14h7l-1 8 9-12h-7l1-8z" />
  </svg>
);
const PlayIcon = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
    <polygon points="5 3 19 12 5 21 5 3" />
  </svg>
);

/* ─────────────────────────────────────────
   Constants
───────────────────────────────────────── */
const LEVEL_ACCENTS = ['#3b82f6', '#f59e0b', '#10b981', '#8b5cf6', '#ef4444'];
const XP_PER_LESSON = 50;
const BG = '#04080f';
const LINE = 'rgba(59,130,246,0.12)';
const MONO = '"JetBrains Mono",monospace';
const SANS = '"Space Grotesk",sans-serif';

/* ─────────────────────────────────────────
   Animated circuit canvas background
───────────────────────────────────────── */

/* ─────────────────────────────────────────
   Main page
───────────────────────────────────────── */
export default function LearnPage() {
  const router = useRouter();
  const {
    hasAccess, isLessonCompleted, canAccessLevel,
    canAccessLesson, isLevelCompleted, initialize, isCheckingSub,
  } = useActivityStore();

  const hasEsp32       = hasAccess('esp32');
  const [mounted, setMounted] = useState(false);
  const [openLevels, setOpenLevels] = useState<Set<number>>(new Set());

  useEffect(() => {
    initialize().then(() => setMounted(true));
  }, [initialize]);

  const toggleLevel = (id: number) => {
    setOpenLevels(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const totalXP = mounted
    ? LEVELS.reduce((acc, level) =>
        acc + level.lessons.filter(l => isLessonCompleted(l.id)).length * XP_PER_LESSON, 0)
    : 0;

  const completedLessons = mounted
    ? LEVELS.reduce((acc, level) => acc + level.lessons.filter(l => isLessonCompleted(l.id)).length, 0)
    : 0;

  const totalLessons = LEVELS.reduce((acc, level) => acc + level.lessons.length, 0);

  /* first incomplete accessible lesson */
  const nextLesson = mounted ? (() => {
    for (const level of LEVELS) {
      for (const lesson of level.lessons) {
        if (canAccessLesson(level.id, lesson.id) && !isLessonCompleted(lesson.id)) {
          return { level, lesson };
        }
      }
    }
    return null;
  })() : null;

  /* ── Loading ── */
  if (!mounted || isCheckingSub) {
    return (
      <>
        <GoogleFonts />
        <main style={{ minHeight: '100vh', background: BG, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: MONO }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ width: 36, height: 36, borderRadius: '50%', border: '2.5px solid rgba(59,130,246,0.15)', borderTop: '2.5px solid #3b82f6', animation: 'lp-spin 0.8s linear infinite', margin: '0 auto' }} />
            <p style={{ marginTop: 14, fontSize: 13, color: 'rgba(240,244,255,0.4)', letterSpacing: '0.05em' }}>Loading learning path…</p>
          </div>
          <style>{`@keyframes lp-spin { to { transform: rotate(360deg); } }`}</style>
        </main>
      </>
    );
  }

  return (
    <>
      <GoogleFonts />
      <PageStyles />

      <div style={{ minHeight: '100vh', background: BG, position: 'relative' }}>
        <CircuitCanvas />

        <main style={{ position: 'relative', zIndex: 1, color: '#f0f4ff', fontFamily: SANS }}>
          <Header />

          <div style={{ maxWidth: 900, margin: '0 auto', padding: '32px 24px 80px' }}>

            {/* ── Back ── */}
            <button
              type="button"
              onClick={() => router.push('/dashboard')}
              className="lp-back-btn"
              style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 13, color: 'rgba(240,244,255,0.38)', fontFamily: SANS, display: 'flex', alignItems: 'center', gap: 6, padding: 0, transition: 'color .15s', marginBottom: 28 }}
            >
              ← Dashboard
            </button>

            {/* ══════════════════════════════
                HERO
            ══════════════════════════════ */}
            <div style={{
              borderRadius: 20, overflow: 'hidden', marginBottom: 24,
              border: `1px solid ${LINE}`,
              background: 'linear-gradient(160deg,#050c1a 0%,#060d19 60%,#050c1a 100%)',
              position: 'relative',
            }}>
              {/* Grid overlay */}
              <div style={{
                position: 'absolute', inset: 0, pointerEvents: 'none',
                backgroundImage: `linear-gradient(rgba(59,130,246,0.04) 1px,transparent 1px),linear-gradient(90deg,rgba(59,130,246,0.04) 1px,transparent 1px)`,
                backgroundSize: '48px 48px',
                maskImage: 'radial-gradient(ellipse 65% 100% at 70% 0%,black,transparent)',
                WebkitMaskImage: 'radial-gradient(ellipse 65% 100% at 70% 0%,black,transparent)',
              }} />

              {/* Glow orb */}
              <div style={{ position: 'absolute', top: -90, right: -30, width: 300, height: 300, borderRadius: '50%', background: 'radial-gradient(circle,rgba(59,130,246,0.1),transparent 60%)', pointerEvents: 'none' }} />

              <div style={{ padding: '26px 30px 28px', position: 'relative', display: 'flex', flexWrap: 'wrap', alignItems: 'flex-end', justifyContent: 'space-between', gap: 20 }}>

                {/* Left: title + CTA */}
                <div>
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '3px 10px', borderRadius: 99, marginBottom: 12, background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.18)' }}>
                    <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#f59e0b', animation: 'lp-pulse 2s infinite', display: 'inline-block' }} />
                    <span style={{ fontSize: 9, fontWeight: 600, letterSpacing: '0.14em', textTransform: 'uppercase' as const, color: '#93c5fd', fontFamily: MONO }}>Structured Learning</span>
                  </div>

                  <h1 style={{ margin: '0 0 6px', fontSize: 'clamp(1.8rem,3.5vw,2.4rem)', fontWeight: 900, color: '#f0f4ff', letterSpacing: '-0.025em', lineHeight: 1.05, fontFamily: SANS }}>
                    Learning Path
                  </h1>
                  <p style={{ margin: '0 0 18px', fontSize: 13, color: 'rgba(240,244,255,0.48)', fontFamily: MONO, lineHeight: 1.65, maxWidth: 400 }}>
                    Master ESP32 from bare metal to full IoT cloud deployments.
                  </p>

                  {nextLesson && (
                    <button
                      type="button"
                      className="lp-hero-cta"
                      onClick={() => router.push(`/learn/level/${nextLesson.level.id}/lesson/${nextLesson.lesson.id}`)}
                      style={{
                        display: 'inline-flex', alignItems: 'center', gap: 8,
                        padding: '10px 20px', borderRadius: 11,
                        background:  'rgba(91, 150, 245, 0.6)',
                        border: 'none', cursor: 'pointer', color: '#fff',
                        fontSize: 13, fontWeight: 700, fontFamily: SANS,
                        boxShadow: '0 6px 20px -6px rgba(59,130,246,0.6)',
                        transition: 'transform .2s, box-shadow .2s',
                      }}
                    >
                      <PlayIcon />
                      {completedLessons > 0 ? `Continue — ${nextLesson.lesson.title}` : `Start — ${nextLesson.lesson.title}`}
                    </button>
                  )}
                </div>

                {/* Right: XP ring + stats */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10, alignItems: 'flex-end' }}>
                  {/* XP ring card */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '12px 16px', borderRadius: 14, background: 'rgba(255,255,255,0.03)', border: `1px solid ${LINE}` }}>
                    <XpRing xp={totalXP} />
                    <div>
                      <p style={{ margin: '0 0 2px', fontSize: 9, color: 'rgba(240,244,255,0.3)', fontFamily: MONO, textTransform: 'uppercase' as const, letterSpacing: '0.08em' }}>XP Earned</p>
                      <p style={{ margin: '0 0 6px', fontSize: 17, fontWeight: 900, color: '#f0f4ff', fontFamily: SANS }}>
                        {totalXP.toLocaleString()}
                        <span style={{ fontSize: 10, color: 'rgba(240,244,255,0.3)', fontWeight: 400 }}> / {totalLessons * XP_PER_LESSON}</span>
                      </p>
                      <div style={{ width: 100, height: 3, borderRadius: 99, background: 'rgba(255,255,255,0.06)', overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${Math.round((totalXP / (totalLessons * XP_PER_LESSON)) * 100)}%`, borderRadius: 99, background: 'linear-gradient(90deg,#f59e0b,#fbbf24)', transition: 'width 1.2s ease' }} />
                      </div>
                    </div>
                  </div>

                  {/* Stat pills */}
                  <div style={{ display: 'flex', gap: 6 }}>
                    {[
                      { val: completedLessons,              label: 'Done',   color: '#10b981' },
                      { val: totalLessons,                  label: 'Total',  color: '#3b82f6' },
                      { val: LEVELS.filter(l => isLevelCompleted(l.id)).length + 1, label: 'Levels', color: '#8b5cf6' },
                      { val: completedLessons * 4,          label: 'Skills', color: '#f59e0b' },
                    ].map(s => (
                      <div key={s.label} style={{ padding: '8px 10px', borderRadius: 10, background: 'rgba(255,255,255,0.03)', border: `1px solid ${LINE}`, textAlign: 'center', minWidth: 50 }}>
                        <p style={{ margin: '0 0 1px', fontSize: 16, fontWeight: 900, color: s.color, fontFamily: SANS, lineHeight: 1 }}>{s.val}</p>
                        <p style={{ margin: 0, fontSize: 8, color: 'rgba(240,244,255,0.3)', fontFamily: MONO, textTransform: 'uppercase' as const, letterSpacing: '0.06em' }}>{s.label}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* ── Unlock banner ── */}
            {!hasEsp32 && (
              <div style={{ marginBottom: 20, borderRadius: 16, padding: '16px 20px', background: 'linear-gradient(135deg,rgba(245,158,11,0.07),rgba(217,119,6,0.05))', border: '1px solid rgba(245,158,11,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                    <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#f59e0b', display: 'inline-block' }} />
                    <p style={{ fontSize: 13, fontWeight: 700, color: '#fbbf24', fontFamily: SANS }}>Limited Preview Mode</p>
                  </div>
                  <p style={{ fontSize: 12.5, color: 'rgba(245,158,11,0.65)', lineHeight: 1.6 }}>Only Lesson 1-1 is available. Activate your hardware kit to unlock all levels.</p>
                </div>
                <Link href="/redeem" className="lp-unlock-link" style={{ flexShrink: 0, borderRadius: 11, padding: '10px 22px', background: 'linear-gradient(135deg,#d97706,#f59e0b)', fontSize: 12.5, fontWeight: 700, color: '#fff', boxShadow: '0 4px 18px rgba(245,158,11,0.25)', textDecoration: 'none', display: 'inline-block', transition: 'all .22s' }}>
                  Unlock Full Access →
                </Link>
              </div>
            )}

            {/* ══════════════════════════════
                LEVEL CARDS
            ══════════════════════════════ */}
            <section style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {LEVELS.map((level, idx) => {
                const levelAccessible = canAccessLevel(level.id);
                const levelDone       = isLevelCompleted(level.id);
                const completedCount  = level.lessons.filter(l => isLessonCompleted(l.id)).length;
                const levelProgress   = level.lessons.length > 0 ? Math.round((completedCount / level.lessons.length) * 100) : 0;
                const levelXP         = completedCount * XP_PER_LESSON;
                const accent          = LEVEL_ACCENTS[(level.id - 1) % LEVEL_ACCENTS.length];
                const isOpen          = openLevels.has(level.id);

                return (
                  <div
                    key={level.id}
                    className={`lp-level-card ${levelAccessible ? 'accessible' : 'locked'} ${isOpen ? 'open' : ''}`}
                    style={{ animationDelay: `${idx * 55}ms` }}
                  >
                    {/* Accent bar */}
                    <div style={{ position: 'absolute', top: 0, left: 0, width: 3, height: '100%', borderRadius: '18px 0 0 18px', background: levelAccessible ? accent : 'rgba(255,255,255,0.08)' }} />

                    {/* Header button */}
                    <button
                      type="button"
                      disabled={!levelAccessible}
                      onClick={() => levelAccessible && toggleLevel(level.id)}
                      className="lp-header-btn"
                      style={{background:'rgba(30, 81, 169, 0.1)'}}

                    >
                      {/* Number badge */}
                      <div style={{ width: 40, height: 40, borderRadius: 12, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: levelAccessible ? `${accent}18` : 'rgba(255,255,255,0.04)', border: `1px solid ${levelAccessible ? `${accent}28` : 'rgba(255,255,255,0.07)'}`, fontFamily: SANS, fontSize: 16, fontWeight: 700, color: levelAccessible ? accent : 'rgba(240,244,255,0.25)', transition: 'all .3s' }}>
                        {level.id}
                      </div>

                      {/* Text block */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 5, flexWrap: 'wrap' }}>
                          <span style={{ fontSize: 9.5, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase' as const, fontFamily: MONO, color: levelAccessible ? accent : 'rgba(240,244,255,0.2)' }}>
                            Level {level.id}
                          </span>
                          {levelDone && (
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '2px 9px', borderRadius: 99, background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.18)', fontSize: 10, fontWeight: 600, color: '#6ee7b7', fontFamily: MONO }}>
                              <CheckIcon /> Completed
                            </span>
                          )}
                          {!levelAccessible && (
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '2px 9px', borderRadius: 99, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', fontSize: 10, fontWeight: 500, color: 'rgba(240,244,255,0.28)', fontFamily: MONO }}>
                              <LockIcon /> Locked
                            </span>
                          )}
                          {levelAccessible && levelXP > 0 && (
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '2px 8px', borderRadius: 99, background: `${accent}12`, border: `1px solid ${accent}28`, fontSize: 9.5, fontWeight: 700, color: accent, fontFamily: MONO }}>
                              <BoltIcon size={8} /> {levelXP} XP
                            </span>
                          )}
                        </div>

                        <h2 style={{ fontFamily: SANS, fontSize: 16, fontWeight: 700, color: levelAccessible ? '#f0f4ff' : 'rgba(240,244,255,0.3)', letterSpacing: -0.3, margin: '0 0 4px', lineHeight: 1.2, transition: 'color .3s' }}>
                          {level.title}
                        </h2>
                        <p style={{ fontSize: 12.5, lineHeight: 1.6, margin: 0, color: levelAccessible ? 'rgba(240,244,255,0.42)' : 'rgba(240,244,255,0.18)', transition: 'color .3s' }}>
                          {level.description}
                        </p>

                        {levelAccessible && completedCount > 0 && (
                          <div style={{ marginTop: 12, maxWidth: 300 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                              <span style={{ fontSize: 10, color: 'rgba(240,244,255,0.35)', fontFamily: MONO }}>{completedCount} / {level.lessons.length} lessons</span>
                              <span style={{ fontSize: 10, color: accent, fontFamily: MONO, fontWeight: 700 }}>{levelProgress}%</span>
                            </div>
                            <div style={{ height: 3, borderRadius: 99, background: 'rgba(255,255,255,0.05)' }}>
                              <div style={{ height: 3, borderRadius: 99, background: accent, width: `${levelProgress}%`, transition: 'width .7s cubic-bezier(0.16,1,0.3,1)', opacity: 0.85 }} />
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Right: counts + chevron */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
                        <div style={{ textAlign: 'right' }}>
                          <p style={{ margin: '0 0 2px', fontSize: 10, color: 'rgba(255, 255, 255, 0.6)', fontFamily: MONO, whiteSpace: 'nowrap' }}>{level.lessons.length} lessons</p>
                          <p style={{ margin: 0, fontSize: 9.5, color: 'rgba(245,158,11,0.9)', fontFamily: MONO, whiteSpace: 'nowrap' }}>{level.lessons.length * XP_PER_LESSON} XP total</p>
                        </div>
                        {levelAccessible && (
                          <div style={{ color: isOpen ? accent : 'rgba(240,244,255,0.28)', transition: 'color .2s' }}>
                            <ChevronDown open={isOpen} />
                          </div>
                        )}
                      </div>
                    </button>

                    {/* ── Lesson dropdown ── */}
                    {isOpen && levelAccessible && (
                      <div style={{ padding: '0 16px 16px', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                        <div style={{ paddingTop: 12, display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(300px,1fr))', gap: 8 }}>
                          {level.lessons.map((lesson, li) => {
                            const accessible      = canAccessLesson(level.id, lesson.id);
                            const done            = isLessonCompleted(lesson.id);
                            const toneColor       =levelAccessible ? accent : 'rgba(255,255,255,0.08)'

                            return (
                              <div
                                key={lesson.id}
                                className={`lp-lesson-card ${accessible ? 'clickable' : ''}`}
                                onClick={() => accessible && router.push(`/learn/level/${level.id}/lesson/${lesson.id}`)}
                                style={{
                                  background: done ? 'linear-gradient(135deg,$),rgba(16,185,129,0.03))' : 'linear-gradient(135deg,#0a1422,#0f1c30)',
                                  border: `1px solid ${done ? 'rgba(16, 185, 129, 0.1)' : 'rgba(255,255,255,0.07)'}`,
                                  opacity: !accessible ? 0.5 : 1,
                                  animationDelay: `${li * 35}ms`,
                                  padding: 18,
                                  display: 'flex', gap: 14, alignItems: 'flex-start',
                                }}
                              >
                                {/* Left accent bar */}
                                <span style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 3, background: toneColor, opacity: done ? 0.7 : 0.5, borderRadius: '16px 0 0 16px' }} />

                                {/* Hover glow */}
                                <div className="lp-lesson-glow" style={{ position: 'absolute', top: -30, right: -20, width: 120, height: 120, borderRadius: '50%', background: `radial-gradient(circle,${toneColor}40,transparent 65%)`, opacity: 0, transition: 'opacity .35s', pointerEvents: 'none' }} />

                                {/* Icon */}
                                <div className="lp-lesson-icon" style={{ width: 40, height: 40, flexShrink: 0, borderRadius: 12, background: done ? accent : `${accent}18`, border: `1px solid ${done ? 'rgba(16,185,129,0.25)' : `${accent}28`}`, color: done ? '#090909' : accent, display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'transform .35s cubic-bezier(0.16,1,0.3,1)', position: 'relative' }}>
                                  {done ? <CheckIcon size={16} /> : !accessible ? <LockIcon size={14} /> : (
                                    <span style={{ fontSize: 13, fontWeight: 700, fontFamily: SANS }}>{li + 1}</span>
                                  )}
                                </div>

                                {/* Body */}
                                <div style={{ flex: 1, minWidth: 0, position: 'relative' }}>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 6 }}>
                                    <h3 style={{ fontFamily: SANS, fontSize: 14, fontWeight: 700, color: accessible ? '#f0f4ff' : 'rgba(240,244,255,0.35)', margin: 0, letterSpacing: -0.2, lineHeight: 1.2 }}>
                                      {lesson.title}
                                    </h3>
                                    {done && (
                                      <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.08em', fontFamily: MONO, padding: '2px 8px', borderRadius: 99, background: accent, border: '1px solid rgba(16,185,129,0.22)', color: '#090909', textTransform: 'uppercase' as const, flexShrink: 0 }}>Done</span>
                                    )}
                                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 9.5, color: 'rgba(240,244,255,0.8)', fontFamily: MONO, padding: '2px 7px', borderRadius: 99, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)', flexShrink: 0 }}>
                                      <ClockIcon /> {lesson.estimatedMinutes}m
                                    </span>
                                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 9.5, fontWeight: 700, fontFamily: MONO, padding: '2px 7px', borderRadius: 99, background: done ? `${accent}` : 'rgba(245,158,11,0.07)', border: `1px solid ${done ? 'rgba(245,158,11,0.3)' : 'rgba(245,158,11,0.15)'}`, color: done ? '#000000' : 'rgba(245,158,11,0.55)', flexShrink: 0 }}>
                                      <BoltIcon size={8} /> +{XP_PER_LESSON} XP
                                    </span>
                                  </div>

                                  <p style={{ fontSize: 12, color: 'rgba(240,244,255,0.45)', lineHeight: 1.65, margin: '0 0 12px' }}>
                                    {lesson.description}
                                  </p>

                                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                    <div style={{ flex: 1 }}>
                                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                                        <span style={{ fontSize: 9.5, color: 'rgb(240, 244, 255)', fontFamily: MONO }}>{lesson.steps.length} steps</span>
                                        {done && <span style={{ fontSize: 9.5, color: accent, fontFamily: MONO }}>100%</span>}
                                      </div>
                                      <div style={{ height: 2, borderRadius: 99, background: 'rgba(255,255,255,0.06)' }}>
                                        <div style={{ height: 2, borderRadius: 99, background: done ? accent: accent, width: done ? '100%' : '0%', transition: 'width .5s ease' }} />
                                      </div>
                                    </div>
                                    {accessible && (
                                      <div className="lp-lesson-arrow" style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 11.5, fontWeight: 700, color: done ? accent: accent, opacity: 0, transform: 'translateX(-4px)', transition: 'opacity .22s, transform .22s', flexShrink: 0 }}>
                                        {done ? 'Review' : 'Start'} <ArrowRight />
                                      </div>
                                    )}
                                  </div>

                                  {!accessible && (
                                    <div style={{ marginTop: 10 }}>
                                      {!hasEsp32 ? (
                                        <Link href="/redeem" className="lp-unlock-sm" onClick={e => e.stopPropagation()} style={{ display: 'inline-flex', alignItems: 'center', gap: 5, borderRadius: 8, padding: '5px 12px', background: 'rgba(245,158,11,0.07)', border: '1px solid rgba(245,158,11,0.18)', fontSize: 11, fontWeight: 600, color: '#fbbf24', textDecoration: 'none', transition: 'all .2s' }}>
                                          <LockIcon /> Unlock →
                                        </Link>
                                      ) : (
                                        <p style={{ fontSize: 10, color: 'rgba(240,244,255,0.22)', fontFamily: MONO, margin: 0 }}>Complete previous lesson first</p>
                                      )}
                                    </div>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Locked level footer */}
                    {!levelAccessible && (
                      <div style={{ padding: '0 30px 18px' }}>
                        {!hasEsp32 ? (
                          <Link href="/redeem" className="lp-unlock-sm" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, borderRadius: 10, padding: '7px 16px', background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)', fontSize: 12, fontWeight: 600, color: '#fbbf24', textDecoration: 'none', transition: 'all .2s' }}>
                            <LockIcon size={11} /> Unlock Full Access →
                          </Link>
                        ) : (
                          <p style={{ fontSize: 11, color: 'rgba(240,244,255,0.28)', fontFamily: MONO, margin: 0 }}>Complete the previous level to unlock</p>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </section>
          </div>
        </main>
      </div>
    </>
  );
}

/* ─────────────────────────────────────────
   XP ring (animated on mount)
───────────────────────────────────────── */
function XpRing({ xp }: { xp: number }) {
  const MAX_XP   = 1050; // adjust to your actual max
  const pct      = Math.min(xp / MAX_XP, 1);
  const R        = 26;
  const CIRC     = 2 * Math.PI * R;
  const lvl      = Math.floor(xp / 210) + 1;
  const lvlNames = ['NOVICE','MAKER','HACKER','BUILDER','WIZARD','GURU'];
  const lvlName  = lvlNames[Math.min(lvl - 1, lvlNames.length - 1)];

  const [offset, setOffset] = useState(CIRC);
  useEffect(() => {
    const t = setTimeout(() => setOffset(CIRC * (1 - pct)), 120);
    return () => clearTimeout(t);
  }, [pct, CIRC]);

  return (
    <div style={{ position: 'relative', width: 64, height: 64, flexShrink: 0 }}>
      <svg width="64" height="64" viewBox="0 0 64 64" style={{ transform: 'rotate(-90deg)', display: 'block' }}>
        <circle cx="32" cy="32" r={R} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="5" />
        <circle cx="32" cy="32" r={R} fill="none" stroke="#f59e0b" strokeWidth="5" strokeLinecap="round"
          strokeDasharray={CIRC} strokeDashoffset={offset}
          style={{ transition: 'stroke-dashoffset 1.4s ease' }} />
      </svg>
      <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <span style={{ fontSize: 16, fontWeight: 900, color: '#f0f4ff', fontFamily: SANS, lineHeight: 1 }}>{lvl}</span>
        <span style={{ fontSize: 7, fontWeight: 700, color: '#f59e0b', fontFamily: MONO, textTransform: 'uppercase' as const, letterSpacing: '0.05em' }}>{lvlName}</span>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────
   Helpers
───────────────────────────────────────── */
function GoogleFonts() {
  return <link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700;900&family=JetBrains+Mono:wght@400;500;700&display=swap" rel="stylesheet" />;
}

function PageStyles() {
  return (
    <style suppressHydrationWarning>{`
      * { box-sizing: border-box; margin: 0; padding: 0; }

      @keyframes lp-spin   { to { transform: rotate(360deg); } }
      @keyframes lp-fadein { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:none} }
      @keyframes lp-drop   { from{opacity:0;transform:translateY(-6px)} to{opacity:1;transform:none} }
      @keyframes lp-pulse  { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:.4;transform:scale(.7)} }

      .lp-back-btn:hover { color: #f0f4ff !important; }

      .lp-hero-cta:hover {
        transform: translateY(-2px) !important;
        box-shadow: 0 10px 26px -6px rgba(59,130,246,0.75) !important;
      }

      .lp-level-card {
        border-radius: 18px;
        position: relative;
        overflow: hidden;
        animation: lp-fadein .5s ease both;
        transition: border-color .25s, box-shadow .3s;
      }
      .lp-level-card.accessible {
        background: rgba(255,255,255,0.025);
        border: 1px solid rgba(255,255,255,0.08);
      }
      .lp-level-card.locked {
        background: rgba(255,255,255,0.01);
        border: 1px solid rgba(255,255,255,0.05);
      }
      .lp-level-card.open { box-shadow: 0 20px 56px rgba(0,0,0,.45); }

      .lp-header-btn {
        width: 100%; background: none; border: none; cursor: pointer;
        padding: 22px 26px 22px 30px; text-align: left;
        display: flex; align-items: center; gap: 18px;
        transition: background .18s;
      }
      .lp-header-btn:hover:not(:disabled) { background: rgba(255,255,255,0.015); }
      .lp-header-btn:disabled { cursor: not-allowed; }

      .lp-lesson-card {
        border-radius: 16px; overflow: hidden; position: relative;
        transition: transform .3s cubic-bezier(0.16,1,0.3,1), border-color .25s, box-shadow .3s, background .2s;
        animation: lp-drop .3s ease both;
      }
      .lp-lesson-card.clickable { cursor: pointer; }
      .lp-lesson-card.clickable:hover {
        transform: translateY(-4px);
        box-shadow: 0 20px 48px -18px rgba(0,0,0,.85);
        border-color: rgba(255,255,255,0.16) !important;
      }
      .lp-lesson-card.clickable:hover .lp-lesson-arrow  { opacity: 1 !important; transform: translateX(0) !important; }
      .lp-lesson-card.clickable:hover .lp-lesson-icon   { transform: scale(1.08) rotate(-4deg) !important; }
      .lp-lesson-card.clickable:hover .lp-lesson-glow   { opacity: 1 !important; }

      .lp-unlock-link:hover { transform: translateY(-2px); box-shadow: 0 8px 28px rgba(245,158,11,0.35) !important; }
      .lp-unlock-sm:hover   { background: rgba(245,158,11,0.13) !important; border-color: rgba(245,158,11,0.3) !important; }
    `}</style>
  );
}