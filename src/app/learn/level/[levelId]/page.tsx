'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';

import Header from '@/components/Header';
import { LEVELS } from '@/lib/lessonConfig';
import { useActivityStore } from '@/store/useActivityStore';
import CircuitCanvas from '@/components/CircuitCanvas';

const T = {
  bg:        '#04080f',
  bgCard:    'rgba(255,255,255,0.025)',
  border:    'rgba(255,255,255,0.07)',
  borderHov: 'rgba(255,255,255,0.13)',
  textPrimary: '#f0f4ff',
  textSec:     'rgba(240,244,255,0.55)',
  textMuted:   'rgba(240,244,255,0.3)',
  textTiny:    'rgba(240,244,255,0.18)',
  mono:    '"JetBrains Mono", monospace',
  sans:    '"Inter", sans-serif',
  display: '"Space Grotesk", sans-serif',
};

const LEVEL_ACCENTS = ['#3b82f6','#f59e0b','#10b981','#8b5cf6','#ef4444'];
const getAccent = (id: number) => LEVEL_ACCENTS[(id - 1) % LEVEL_ACCENTS.length];

const ChevronLeft = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="15 18 9 12 15 6"/>
  </svg>
);
const Check = () => (
  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12"/>
  </svg>
);
const Lock = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
  </svg>
);
const Clock = () => (
  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>
  </svg>
);
const ArrowRight = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M5 12h14M12 5l7 7-7 7"/>
  </svg>
);

/* ── Loading ── */
function LoadingScreen() {
  return (
    <main style={{ minHeight: '100vh', background: T.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: T.sans }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ width: 34, height: 34, borderRadius: '50%', margin: '0 auto 14px', border: '2.5px solid rgba(59,130,246,0.15)', borderTop: '2.5px solid #3b82f6', animation: 'lv-spin .8s linear infinite' }} />
        <p style={{ fontSize: 12, color: T.textMuted, fontFamily: T.mono, letterSpacing: '0.05em' }}>Loading level...</p>
      </div>
      <style>{`@keyframes lv-spin { to { transform: rotate(360deg); } }`}</style>
    </main>
  );
}

export default function LevelPage() {
  const router = useRouter();
  const params = useParams<{ levelId: string }>();
  const { hasAccess, isLessonCompleted, canAccessLevel, canAccessLesson, initialize, isCheckingSub } = useActivityStore();
  const hasEsp32 = hasAccess('esp32');
  const [mounted, setMounted] = useState(false);

  if (!params) return <LoadingScreen />;

  const levelId = Number(params.levelId);
  const level   = LEVELS.find((l) => l.id === levelId);
  const accent  = getAccent(levelId);

  useEffect(() => { initialize().then(() => setMounted(true)); }, [initialize]);

  if (!mounted || isCheckingSub) return <LoadingScreen />;

  /* ── Level not found ── */
  if (!level) {
    return (
      <main style={{ minHeight: '100vh', background: T.bg, fontFamily: T.sans }}>
        <Header />
        <div style={{ maxWidth: 480, margin: '80px auto', padding: '0 24px' }}>
          <div style={{ borderRadius: 18, background: T.bgCard, border: `1px solid ${T.border}`, padding: '32px 28px' }}>
            <p style={{ fontSize: 16, fontWeight: 700, color: T.textPrimary, fontFamily: T.display, margin: '0 0 8px' }}>Level not found</p>
            <button type="button" onClick={() => router.push('/learn')} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 13, color: T.textSec, fontFamily: T.sans, display: 'flex', alignItems: 'center', gap: 5, padding: 0 }}>
              <ChevronLeft /> Learning Path
            </button>
          </div>
        </div>
      </main>
    );
  }

  /* ── Level locked ── */
  if (!canAccessLevel(levelId)) {
    return (
      <main style={{ minHeight: '100vh', background: T.bg, fontFamily: T.sans }}>
        <Header />
        <div style={{ maxWidth: 480, margin: '80px auto', padding: '0 24px' }}>
          <div style={{ borderRadius: 18, background: T.bgCard, border: `1px solid ${T.border}`, padding: '36px 32px', textAlign: 'center' }}>
            <div style={{ width: 52, height: 52, borderRadius: 15, margin: '0 auto 18px', background: 'rgba(255,255,255,0.04)', border: `1px solid ${T.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Lock />
            </div>
            <p style={{ fontSize: 17, fontWeight: 700, color: T.textPrimary, fontFamily: T.display, margin: '0 0 8px' }}>Level {levelId} is locked</p>
            {!hasEsp32 ? (
              <>
                <p style={{ fontSize: 13, color: T.textSec, margin: '0 0 20px', lineHeight: 1.6 }}>Activate your hardware kit to unlock this level.</p>
                <Link href="/redeem" style={{
                  display: 'inline-block', padding: '10px 24px', borderRadius: 11,
                  background: 'linear-gradient(135deg,#d97706,#f59e0b)',
                  fontSize: 13, fontWeight: 700, color: '#fff', textDecoration: 'none',
                  boxShadow: '0 4px 18px rgba(245,158,11,0.28)', marginBottom: 16,
                }}>
                  Unlock Full Access →
                </Link>
              </>
            ) : (
              <p style={{ fontSize: 13, color: T.textSec, margin: '0 0 20px', lineHeight: 1.6 }}>Complete previous levels to unlock this one.</p>
            )}
            <button type="button" onClick={() => router.push('/learn')} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 12, color: T.textMuted, fontFamily: T.sans, display: 'inline-flex', alignItems: 'center', gap: 5 }}>
              <ChevronLeft /> Learning Path
            </button>
          </div>
        </div>
      </main>
    );
  }

  const completedCount = level.lessons.filter(l => isLessonCompleted(l.id)).length;
  const levelProgress  = level.lessons.length > 0 ? Math.round((completedCount / level.lessons.length) * 100) : 0;

  return (
    <>
      <link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;700&display=swap" rel="stylesheet" />
      <style suppressHydrationWarning>{`
        @keyframes lv-spin   { to { transform: rotate(360deg); } }
        @keyframes lv-fadein { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:none} }
        .lv-lesson-card { transition: transform .35s cubic-bezier(0.16,1,0.3,1), border-color .25s, box-shadow .35s; }
        .lv-lesson-card.accessible:hover { transform: translateY(-4px) !important; border-color: rgba(255,255,255,0.13) !important; box-shadow: 0 20px 56px rgba(0,0,0,.5) !important; }
        .lv-lesson-card.accessible:hover .lv-card-arrow { opacity: 1 !important; transform: translateX(0) !important; }
        .lv-back-btn:hover { color: #f0f4ff !important; }
      `}</style>

      <main style={{ minHeight: '100vh', background: T.bg, color: T.textPrimary, fontFamily: T.sans }}>
        <Header />
<CircuitCanvas/>
        <div style={{ maxWidth: 900, margin: '0 auto', padding: '36px 28px 80px' }}>

          {/* Back */}
          <button
            type="button"
            onClick={() => router.push('/learn')}
            className="lv-back-btn"
            style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 12, color: T.textMuted, fontFamily: T.sans, padding: 0, transition: 'color .15s', marginBottom: 28 }}
          >
            <ChevronLeft /> Learning Path
          </button>

          {/* Level header */}
          <div style={{
            borderRadius: 18, padding: '24px 26px', marginBottom: 28,
            background: accent + '0d', border: `1px solid ${accent}22`,
            position: 'relative', overflow: 'hidden',
            animation: 'lv-fadein .5s ease both',
          }}>
            {/* grid texture */}
            <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', backgroundImage: `linear-gradient(${accent}06 1px,transparent 1px),linear-gradient(90deg,${accent}06 1px,transparent 1px)`, backgroundSize: '40px 40px' }} />

            <div style={{ position: 'relative', zIndex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16 }}>
                  {/* Level number */}
                  <div style={{
                    width: 52, height: 52, borderRadius: 15, flexShrink: 0,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: accent + '18', border: `1px solid ${accent}30`,
                    fontFamily: T.display, fontSize: 22, fontWeight: 700, color: accent,
                  }}>
                    {level.id}
                  </div>
                  <div>
                    <span style={{ fontSize: 9.5, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', fontFamily: T.mono, color: accent }}>
                      Level {level.id}
                    </span>
                    <h1 style={{ fontFamily: T.display, fontSize: 24, fontWeight: 700, letterSpacing: -0.8, margin: '5px 0 6px', color: T.textPrimary, lineHeight: 1.15 }}>
                      {level.title}
                    </h1>
                    <p style={{ fontSize: 13.5, color: T.textSec, lineHeight: 1.65, margin: 0, maxWidth: 520 }}>
                      {level.description}
                    </p>
                  </div>
                </div>

                {/* Progress */}
                {completedCount > 0 && (
                  <div style={{ flexShrink: 0, textAlign: 'right' }}>
                    <p style={{ fontSize: 11, fontWeight: 700, color: accent, fontFamily: T.mono, margin: '0 0 6px' }}>
                      {completedCount}/{level.lessons.length} lessons
                    </p>
                    <div style={{ width: 120, height: 3, borderRadius: 99, background: 'rgba(255,255,255,0.07)' }}>
                      <div style={{ height: 3, borderRadius: 99, background: accent, width: `${levelProgress}%`, transition: 'width .6s cubic-bezier(0.16,1,0.3,1)' }} />
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Lesson cards grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(380px,1fr))', gap: 12 }}>
            {level.lessons.map((lesson, idx) => {
              const accessible = canAccessLesson(levelId, lesson.id);
              const done       = isLessonCompleted(lesson.id);

              return (
                <div
                  key={lesson.id}
                  className={`lv-lesson-card ${accessible ? 'accessible' : ''}`}
                  style={{
                    borderRadius: 16, position: 'relative', overflow: 'hidden',
                    background: done ? 'rgba(16,185,129,0.05)' : T.bgCard,
                    border: `1px solid ${done ? 'rgba(16,185,129,0.18)' : T.border}`,
                    opacity: !accessible ? 0.5 : 1,
                    animation: `lv-fadein .45s ease ${idx * 60}ms both`,
                  }}
                >
                  {/* accent top bar */}
                  <div style={{ height: 2, background: done ? '#10b981' : `linear-gradient(90deg,${accent},transparent)`, opacity: done ? 0.6 : 0.35 }} />

                  <button
                    type="button"
                    disabled={!accessible}
                    onClick={() => { if (accessible) router.push(`/learn/level/${level.id}/lesson/${lesson.id}`); }}
                    style={{ width: '100%', background: 'none', border: 'none', cursor: accessible ? 'pointer' : 'not-allowed', padding: '20px 22px', textAlign: 'left', display: 'block' }}
                  >
                    {/* Top row */}
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 14 }}>
                      {/* Status badge */}
                      <div style={{
                        width: 36, height: 36, borderRadius: 11,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        background: done ? 'rgba(16,185,129,0.15)' : (accent + '15'),
                        border: `1px solid ${done ? 'rgba(16,185,129,0.25)' : (accent + '25')}`,
                        color: done ? '#34d399' : accent,
                        flexShrink: 0,
                      }}>
                        {done ? <Check /> : (
                          <span style={{ fontSize: 11, fontWeight: 700, fontFamily: T.mono }}>{idx + 1}</span>
                        )}
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        {done && (
                          <span style={{
                            fontSize: 9.5, fontWeight: 700, letterSpacing: '0.08em', fontFamily: T.mono,
                            padding: '3px 9px', borderRadius: 99,
                            background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.22)',
                            color: '#34d399', textTransform: 'uppercase',
                          }}>Done</span>
                        )}
                        <span style={{
                          display: 'inline-flex', alignItems: 'center', gap: 4,
                          fontSize: 10, color: T.textMuted, fontFamily: T.mono,
                          padding: '3px 8px', borderRadius: 99,
                          background: 'rgba(255,255,255,0.04)', border: `1px solid ${T.border}`,
                        }}>
                          <Clock /> {lesson.estimatedMinutes}m
                        </span>
                      </div>
                    </div>

                    {/* Title + description */}
                    <h2 style={{ fontFamily: T.display, fontSize: 15.5, fontWeight: 700, color: accessible ? T.textPrimary : T.textSec, margin: '0 0 6px', letterSpacing: -0.2, lineHeight: 1.25 }}>
                      {lesson.title}
                    </h2>
                    <p style={{ fontSize: 12.5, color: T.textSec, lineHeight: 1.65, margin: '0 0 16px' }}>
                      {lesson.description}
                    </p>

                    {/* Steps + progress */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                          <span style={{ fontSize: 10, color: T.textTiny, fontFamily: T.mono }}>{lesson.steps.length} steps</span>
                          {done && <span style={{ fontSize: 10, color: '#34d399', fontFamily: T.mono }}>100%</span>}
                        </div>
                        <div style={{ height: 3, borderRadius: 99, background: 'rgba(255,255,255,0.06)' }}>
                          <div style={{ height: 3, borderRadius: 99, background: done ? '#10b981' : accent, width: done ? '100%' : '0%', transition: 'width .5s ease' }} />
                        </div>
                      </div>

                      {accessible && (
                        <div className="lv-card-arrow" style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, fontWeight: 700, color: done ? '#34d399' : accent, opacity: 0, transform: 'translateX(-6px)', transition: 'opacity .25s, transform .25s', flexShrink: 0 }}>
                          {done ? 'Review' : 'Start'} <ArrowRight />
                        </div>
                      )}
                    </div>
                  </button>

                  {/* Locked overlay — inline, not floating */}
                  {!accessible && (
                    <div style={{ padding: '0 22px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
                      {!hasEsp32 ? (
                        <Link href="/redeem" style={{
                          display: 'inline-flex', alignItems: 'center', gap: 6,
                          borderRadius: 9, padding: '7px 16px',
                          background: 'rgba(245,158,11,0.09)', border: '1px solid rgba(245,158,11,0.2)',
                          fontSize: 11.5, fontWeight: 600, color: '#fbbf24',
                          textDecoration: 'none', transition: 'all .2s',
                        }}>
                          <Lock /> Unlock Full Access →
                        </Link>
                      ) : (
                        <p style={{ fontSize: 11, color: T.textTiny, fontFamily: T.mono, margin: 0 }}>
                          Complete previous lesson first
                        </p>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </main>
    </>
  );
}