'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

import Header from '@/components/Header';
import { LEVELS } from '@/lib/lessonConfig';
import { useActivityStore } from '@/store/useActivityStore';

/* ── SVG icons ── */
const ChevronDown = ({ open }: { open: boolean }) => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
    style={{ transition: 'transform .3s cubic-bezier(0.16,1,0.3,1)', transform: open ? 'rotate(180deg)' : 'none', flexShrink: 0 }}>
    <polyline points="6 9 12 15 18 9" />
  </svg>
);
const CheckIcon = ({ size = 10 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12" />
  </svg>
);
const LockIcon = ({ size = 9 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
  </svg>
);
const ClockIcon = () => (
  <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>
  </svg>
);
const ArrowRight = () => (
  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M5 12h14M12 5l7 7-7 7"/>
  </svg>
);

const LEVEL_ACCENTS = ['#3b82f6', '#f59e0b', '#10b981', '#8b5cf6', '#ef4444'];

export default function LearnPage() {
  const router = useRouter();
  const {
    hasAccess, isLessonCompleted, canAccessLevel,
    canAccessLesson, isLevelCompleted, initialize, isCheckingSub,
  } = useActivityStore();
  const hasEsp32 = hasAccess('esp32');
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

  if (!mounted || isCheckingSub) {
    return (
      <>
        <link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;700&display=swap" rel="stylesheet" />
        <main style={{ minHeight: '100vh', background: '#04080f', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: '"Inter",sans-serif' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ width: 36, height: 36, borderRadius: '50%', border: '2.5px solid rgba(59,130,246,0.15)', borderTop: '2.5px solid #3b82f6', animation: 'lp-spin 0.8s linear infinite', margin: '0 auto' }} />
            <p style={{ marginTop: 14, fontSize: 13, color: 'rgba(240,244,255,0.45)', fontFamily: '"JetBrains Mono",monospace', letterSpacing: '0.05em' }}>Loading learning path...</p>
          </div>
          <style>{`@keyframes lp-spin { to { transform: rotate(360deg); } }`}</style>
        </main>
      </>
    );
  }

  return (
    <>
      <link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;700&display=swap" rel="stylesheet" />

      <style suppressHydrationWarning>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }
        @keyframes lp-spin   { to { transform: rotate(360deg); } }
        @keyframes lp-fadein { from{opacity:0;transform:translateY(18px)} to{opacity:1;transform:none} }
        @keyframes lp-drop   { from{opacity:0;transform:translateY(-6px)} to{opacity:1;transform:none} }
        @keyframes pulse-dot { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:.4;transform:scale(.7)} }

        .lp-level-card {
          border-radius: 18px; position: relative; overflow: hidden;
          animation: lp-fadein .5s ease both;
          transition: border-color .25s, box-shadow .3s;
        }
        .lp-level-card.accessible { background: rgba(255,255,255,0.025); border: 1px solid rgba(255,255,255,0.08); }
        .lp-level-card.locked     { background: rgba(255,255,255,0.01);  border: 1px solid rgba(255,255,255,0.05); }
        .lp-level-card.open       { box-shadow: 0 20px 56px rgba(0,0,0,.4); }

        .lp-accent-bar { position: absolute; top: 0; left: 0; width: 3px; height: 100%; border-radius: 18px 0 0 18px; }

        .lp-header-btn {
          width: 100%; background: none; border: none; cursor: pointer;
          padding: 22px 26px 22px 30px; text-align: left;
          display: flex; align-items: center; gap: 18px;
          transition: background .18s;
        }
        .lp-header-btn:hover:not(:disabled) { background: rgba(255,255,255,0.015); }
        .lp-header-btn:disabled { cursor: not-allowed; }

        .lp-lesson-card {
          border-radius: 13px; overflow: hidden; position: relative;
          transition: transform .3s cubic-bezier(0.16,1,0.3,1), border-color .2s, box-shadow .3s;
          animation: lp-drop .3s ease both;
        }
        .lp-lesson-card.clickable:hover {
          transform: translateY(-3px);
          box-shadow: 0 14px 40px rgba(0,0,0,.45);
          border-color: rgba(255,255,255,0.13) !important;
        }
        .lp-lesson-card.clickable:hover .lp-lesson-arrow { opacity: 1 !important; transform: translateX(0) !important; }

        .lp-back-btn:hover    { color: #f0f4ff !important; }
        .lp-unlock-link:hover { transform: translateY(-2px); box-shadow: 0 8px 28px rgba(245,158,11,0.35) !important; }
        .lp-unlock-sm:hover   { background: rgba(245,158,11,0.13) !important; border-color: rgba(245,158,11,0.3) !important; }
      `}</style>

      <main style={{ minHeight: '100vh', background: '#04080f', color: '#f0f4ff', fontFamily: '"Inter",sans-serif' }}>
        <Header />

        <div style={{ maxWidth: 860, margin: '0 auto', padding: '40px 28px 80px' }}>

          {/* Back */}
          <button type="button" onClick={() => router.push('/dashboard')} className="lp-back-btn"
            style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 13, color: 'rgba(240,244,255,0.4)', fontFamily: '"Inter",sans-serif', display: 'flex', alignItems: 'center', gap: 6, transition: 'color .15s', padding: 0 }}>
            ← Dashboard
          </button>

          {/* Heading */}
          <div style={{ marginTop: 28, marginBottom: 8 }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.15)', borderRadius: 99, padding: '5px 15px', marginBottom: 16 }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#f59e0b', animation: 'pulse-dot 2s infinite', display: 'inline-block' }} />
              <span style={{ fontSize: 10, fontWeight: 600, color: '#fbbf24', letterSpacing: '0.14em', textTransform: 'uppercase', fontFamily: '"JetBrains Mono",monospace' }}>Structured Learning</span>
            </div>
            <h1 style={{ fontFamily: '"Space Grotesk",sans-serif', fontSize: 32, fontWeight: 700, letterSpacing: -1, lineHeight: 1.1, color: '#f0f4ff' }}>Learning Path</h1>
            <p style={{ marginTop: 8, fontSize: 14, color: 'rgba(240,244,255,0.45)', lineHeight: 1.6 }}>Master ESP32 from basics to IoT cloud projects</p>
          </div>

          {/* Unlock banner */}
          {!hasEsp32 && (
            <div style={{ marginTop: 28, borderRadius: 16, padding: '18px 22px', background: 'linear-gradient(135deg,rgba(245,158,11,0.08),rgba(217,119,6,0.06))', border: '1px solid rgba(245,158,11,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 5 }}>
                  <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#f59e0b' }} />
                  <p style={{ fontSize: 13, fontWeight: 700, color: '#fbbf24', fontFamily: '"Space Grotesk",sans-serif' }}>Limited Preview Mode</p>
                </div>
                <p style={{ fontSize: 12.5, color: 'rgba(245,158,11,0.7)', lineHeight: 1.6 }}>Only Lesson 1-1 is available. Activate your hardware kit to unlock all levels and lessons.</p>
              </div>
              <Link href="/redeem" className="lp-unlock-link" style={{ flexShrink: 0, borderRadius: 11, padding: '10px 22px', background: 'linear-gradient(135deg,#d97706,#f59e0b)', fontSize: 12.5, fontWeight: 700, color: '#fff', boxShadow: '0 4px 18px rgba(245,158,11,0.28)', textDecoration: 'none', display: 'inline-block', transition: 'all .22s' }}>
                Unlock Full Access →
              </Link>
            </div>
          )}

          {/* Level cards */}
          <section style={{ marginTop: 32, display: 'flex', flexDirection: 'column', gap: 10 }}>
            {LEVELS.map((level, idx) => {
              const levelAccessible = canAccessLevel(level.id);
              const levelDone       = isLevelCompleted(level.id);
              const completedCount  = level.lessons.filter(l => isLessonCompleted(l.id)).length;
              const levelProgress   = level.lessons.length > 0 ? Math.round((completedCount / level.lessons.length) * 100) : 0;
              const accent          = LEVEL_ACCENTS[(level.id - 1) % LEVEL_ACCENTS.length];
              const isOpen          = openLevels.has(level.id);

              return (
                <div
                  key={level.id}
                  className={`lp-level-card ${levelAccessible ? 'accessible' : 'locked'} ${isOpen ? 'open' : ''}`}
                  style={{ animationDelay: `${idx * 55}ms` }}
                >
                  <div className="lp-accent-bar" style={{ background: levelAccessible ? accent : 'rgba(255,255,255,0.08)' }} />

                  {/* ── Header row (click to expand) ── */}
                  <button
                    type="button"
                    disabled={!levelAccessible}
                    onClick={() => levelAccessible && toggleLevel(level.id)}
                    className="lp-header-btn"
                  >
                    {/* Number badge */}
                    <div style={{ width: 40, height: 40, borderRadius: 12, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: levelAccessible ? (accent + '18') : 'rgba(255,255,255,0.04)', border: `1px solid ${levelAccessible ? (accent + '28') : 'rgba(255,255,255,0.07)'}`, fontFamily: '"Space Grotesk",sans-serif', fontSize: 16, fontWeight: 700, color: levelAccessible ? accent : 'rgba(240,244,255,0.25)', transition: 'all .3s' }}>
                      {level.id}
                    </div>

                    {/* Text block */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 5 }}>
                        <span style={{ fontSize: 9.5, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', fontFamily: '"JetBrains Mono",monospace', color: levelAccessible ? accent : 'rgba(240,244,255,0.2)' }}>
                          Level {level.id}
                        </span>
                        {levelDone && (
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '2px 9px', borderRadius: 99, background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.18)', fontSize: 10, fontWeight: 600, color: '#6ee7b7', fontFamily: '"JetBrains Mono",monospace' }}>
                            <CheckIcon /> Completed
                          </span>
                        )}
                        {!levelAccessible && (
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '2px 9px', borderRadius: 99, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', fontSize: 10, fontWeight: 500, color: 'rgba(240,244,255,0.28)', fontFamily: '"JetBrains Mono",monospace' }}>
                            <LockIcon /> Locked
                          </span>
                        )}
                      </div>

                      <h2 style={{ fontFamily: '"Space Grotesk",sans-serif', fontSize: 16, fontWeight: 700, color: levelAccessible ? '#f0f4ff' : 'rgba(240,244,255,0.3)', letterSpacing: -0.3, margin: '0 0 4px', lineHeight: 1.2, transition: 'color .3s' }}>
                        {level.title}
                      </h2>
                      <p style={{ fontSize: 12.5, lineHeight: 1.6, margin: 0, color: levelAccessible ? 'rgba(240,244,255,0.42)' : 'rgba(240,244,255,0.18)', transition: 'color .3s' }}>
                        {level.description}
                      </p>

                      {levelAccessible && completedCount > 0 && (
                        <div style={{ marginTop: 12, maxWidth: 300 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                            <span style={{ fontSize: 10, color: 'rgba(240,244,255,0.35)', fontFamily: '"JetBrains Mono",monospace' }}>{completedCount} / {level.lessons.length} lessons</span>
                            <span style={{ fontSize: 10, color: accent, fontFamily: '"JetBrains Mono",monospace', fontWeight: 700 }}>{levelProgress}%</span>
                          </div>
                          <div style={{ height: 3, borderRadius: 99, background: 'rgba(255,255,255,0.05)' }}>
                            <div style={{ height: 3, borderRadius: 99, background: accent, width: `${levelProgress}%`, transition: 'width .7s cubic-bezier(0.16,1,0.3,1)', opacity: 0.85 }} />
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Right: count + chevron */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
                      <span style={{ fontSize: 10, color: 'rgba(240,244,255,0.28)', fontFamily: '"JetBrains Mono",monospace', whiteSpace: 'nowrap' }}>
                        {level.lessons.length} lessons
                      </span>
                      {levelAccessible && (
                        <div style={{ color: isOpen ? accent : 'rgba(240,244,255,0.28)', transition: 'color .2s' }}>
                          <ChevronDown open={isOpen} />
                        </div>
                      )}
                    </div>
                  </button>

                  {/* ── Lesson dropdown ── */}
                  {isOpen && levelAccessible && (
                    <div style={{ padding: '0 16px 16px 16px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                      <div style={{ paddingTop: 12, display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 8 }}>
                        {level.lessons.map((lesson, li) => {
                          const accessible = canAccessLesson(level.id, lesson.id);
                          const done       = isLessonCompleted(lesson.id);

                          return (
                            <div
                              key={lesson.id}
                              className={`lp-lesson-card ${accessible ? 'clickable' : ''}`}
                              style={{
                                background: done ? 'rgba(16,185,129,0.05)' : 'rgba(255,255,255,0.025)',
                                border: `1px solid ${done ? 'rgba(16,185,129,0.18)' : 'rgba(255,255,255,0.07)'}`,
                                opacity: !accessible ? 0.5 : 1,
                                animationDelay: `${li * 35}ms`,
                              }}
                            >
                              {/* Top colour sliver */}
                              <div style={{ height: 2, background: done ? 'rgba(16,185,129,0.5)' : `linear-gradient(90deg,${accent}80,transparent)` }} />

                              <button
                                type="button"
                                disabled={!accessible}
                                onClick={() => accessible && router.push(`/learn/level/${level.id}/lesson/${lesson.id}`)}
                                style={{ width: '100%', background: 'none', border: 'none', cursor: accessible ? 'pointer' : 'not-allowed', padding: '14px 16px', textAlign: 'left', display: 'block' }}
                              >
                                {/* Badge row */}
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                                  <div style={{ width: 28, height: 28, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', background: done ? 'rgba(16,185,129,0.14)' : (accent + '14'), border: `1px solid ${done ? 'rgba(16,185,129,0.24)' : (accent + '24')}`, color: done ? '#34d399' : accent, flexShrink: 0 }}>
                                    {done ? <CheckIcon size={11} /> : !accessible ? <LockIcon size={10} /> : (
                                      <span style={{ fontSize: 10, fontWeight: 700, fontFamily: '"JetBrains Mono",monospace' }}>{li + 1}</span>
                                    )}
                                  </div>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                    {done && (
                                      <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.08em', fontFamily: '"JetBrains Mono",monospace', padding: '2px 8px', borderRadius: 99, background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.22)', color: '#34d399', textTransform: 'uppercase' }}>Done</span>
                                    )}
                                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 9.5, color: 'rgba(240,244,255,0.3)', fontFamily: '"JetBrains Mono",monospace', padding: '2px 7px', borderRadius: 99, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
                                      <ClockIcon /> {lesson.estimatedMinutes}m
                                    </span>
                                  </div>
                                </div>

                                <p style={{ fontFamily: '"Space Grotesk",sans-serif', fontSize: 13.5, fontWeight: 700, color: accessible ? '#f0f4ff' : 'rgba(240,244,255,0.35)', margin: '0 0 4px', letterSpacing: -0.2, lineHeight: 1.25 }}>
                                  {lesson.title}
                                </p>
                                <p style={{ fontSize: 11.5, color: 'rgba(240,244,255,0.4)', lineHeight: 1.6, margin: '0 0 12px' }}>
                                  {lesson.description}
                                </p>

                                {/* Steps progress + arrow */}
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
                                  <div style={{ flex: 1 }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                                      <span style={{ fontSize: 9.5, color: 'rgba(240,244,255,0.22)', fontFamily: '"JetBrains Mono",monospace' }}>{lesson.steps.length} steps</span>
                                      {done && <span style={{ fontSize: 9.5, color: '#34d399', fontFamily: '"JetBrains Mono",monospace' }}>100%</span>}
                                    </div>
                                    <div style={{ height: 2, borderRadius: 99, background: 'rgba(255,255,255,0.06)' }}>
                                      <div style={{ height: 2, borderRadius: 99, background: done ? '#10b981' : accent, width: done ? '100%' : '0%' }} />
                                    </div>
                                  </div>
                                  {accessible && (
                                    <div className="lp-lesson-arrow" style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 10.5, fontWeight: 700, color: done ? '#34d399' : accent, opacity: 0, transform: 'translateX(-5px)', transition: 'opacity .2s, transform .2s', flexShrink: 0 }}>
                                      {done ? 'Review' : 'Start'} <ArrowRight />
                                    </div>
                                  )}
                                </div>
                              </button>

                              {/* Locked lesson CTA */}
                              {!accessible && (
                                <div style={{ padding: '0 16px 12px' }}>
                                  {!hasEsp32 ? (
                                    <Link href="/redeem" className="lp-unlock-sm" style={{ display: 'inline-flex', alignItems: 'center', gap: 5, borderRadius: 8, padding: '5px 12px', background: 'rgba(245,158,11,0.07)', border: '1px solid rgba(245,158,11,0.18)', fontSize: 11, fontWeight: 600, color: '#fbbf24', textDecoration: 'none', transition: 'all .2s' }}>
                                      <LockIcon /> Unlock →
                                    </Link>
                                  ) : (
                                    <p style={{ fontSize: 10, color: 'rgba(240,244,255,0.22)', fontFamily: '"JetBrains Mono",monospace', margin: 0 }}>Complete previous lesson first</p>
                                  )}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Locked level CTA */}
                  {!levelAccessible && (
                    <div style={{ padding: '0 30px 18px' }}>
                      {!hasEsp32 ? (
                        <Link href="/redeem" className="lp-unlock-sm" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, borderRadius: 10, padding: '7px 16px', background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)', fontSize: 12, fontWeight: 600, color: '#fbbf24', textDecoration: 'none', transition: 'all .2s' }}>
                          <LockIcon size={11} /> Unlock Full Access →
                        </Link>
                      ) : (
                        <p style={{ fontSize: 11, color: 'rgba(240,244,255,0.28)', fontFamily: '"JetBrains Mono",monospace', margin: 0 }}>Complete the previous level to unlock</p>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </section>
        </div>
      </main>
    </>
  );
}