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
    <rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" />
  </svg>
);
const ClockIcon = () => (
  <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" />
  </svg>
);
const ArrowRight = () => (
  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M5 12h14M12 5l7 7-7 7" />
  </svg>
);
const BoltIcon = ({ size = 9 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M13 2 4 14h7l-1 8 9-12h-7l1-8z" />
  </svg>
);

const LEVEL_ACCENTS = ['#3b82f6', '#f59e0b', '#10b981', '#8b5cf6', '#ef4444'];
const XP_PER_LESSON = 50;

function CircuitBg() {
  return (
    <div aria-hidden style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0, overflow: 'hidden' }}>
      <svg width="100%" height="100%" preserveAspectRatio="xMidYMid slice" viewBox="0 0 800 600" style={{
        position: 'absolute', inset: 0, width: '100%', height: '100%',
        maskImage: 'linear-gradient(180deg, black 0%, rgba(0,0,0,0.5) 45%, transparent 85%)',
        WebkitMaskImage: 'linear-gradient(180deg, black 0%, rgba(0,0,0,0.5) 45%, transparent 85%)',
      }}>
        <defs>
          <pattern id="bm-circuit" width="200" height="200" patternUnits="userSpaceOnUse" patternTransform="rotate(0)">
            <g fill="none" stroke="#3b82f6" strokeWidth="1.4" strokeLinecap="round" strokeOpacity="0.16">
              <path d="M10 30 H70 a10 10 0 0 0 10 -10 V0" />
              <path d="M0 90 H50 a12 12 0 0 1 12 12 V150" />
              <path d="M200 40 H150 a10 10 0 0 1 -10 10 V120 a14 14 0 0 0 14 14 H200" />
              <path d="M30 200 V150 a10 10 0 0 1 10 -10 H110" />
              <path d="M120 0 V40 a10 10 0 0 0 10 10 H180 a12 12 0 0 1 12 12 V120" />
              <path d="M70 200 V170 H140 a10 10 0 0 0 10 -10 V110" />
              <path d="M0 150 H30" />
              <path d="M160 200 V175 a8 8 0 0 1 8 -8 H200" />
            </g>
            <g fill="#3b82f6">
              {[
                [10, 30], [80, 0], [0, 90], [62, 150], [150, 40], [200, 134],
                [30, 200], [110, 140], [120, 0], [192, 120], [70, 200], [150, 110],
                [0, 150], [160, 200], [200, 167],
              ].map(([x, y], i) => (
                <g key={i} style={{ animation: `bm-pad ${5 + (i % 5)}s ease-in-out ${i * 0.4}s infinite` }}>
                  <circle cx={x} cy={y} r="3.4" fillOpacity="0.22" />
                  <circle cx={x} cy={y} r="1.5" fillOpacity="0.5" />
                </g>
              ))}
            </g>
          </pattern>
        </defs>
        <rect width="8000" height="6000" fill="url(#bm-circuit)" />
      </svg>
    </div>
  );
}

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

  const totalXP = mounted
    ? LEVELS.reduce((acc, level) =>
      acc + level.lessons.filter(l => isLessonCompleted(l.id)).length * XP_PER_LESSON, 0)
    : 0;

  if (!mounted || isCheckingSub) {
    return (
      <>
        <link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;700&display=swap" rel="stylesheet" />
        <div style={{ minHeight: '100vh', background: '#04080f', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: '"Inter",sans-serif' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ width: 36, height: 36, borderRadius: '50%', border: '2.5px solid rgba(59,130,246,0.15)', borderTop: '2.5px solid #3b82f6', animation: 'lp-spin 0.8s linear infinite', margin: '0 auto' }} />
            <p style={{ marginTop: 14, fontSize: 13, color: 'rgba(240,244,255,0.45)', fontFamily: '"Inter", system-ui, sans-serif', letterSpacing: '0.05em' }}>Loading learning path...</p>
          </div>
          <style>{`@keyframes lp-spin { to { transform: rotate(360deg); } }`}
            
          </style>
        </div>
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
        @keyframes lp-pad    { 0%,100%{opacity:.25} 50%{opacity:.9} }
        @keyframes bm-pad    { 0%,100%{opacity:.25} 50%{opacity:.9} }
        @keyframes bm-pulse { 0%,100%{opacity:1} 50%{opacity:.35} }

        .lp-level-card {
          border-radius: 18px; position: relative; overflow: hidden;
          animation: lp-fadein .5s ease both;
          transition: border-color .25s, box-shadow .3s;
        }
        .lp-level-card.accessible { background: linear-gradient(135deg,#0a1422,#0f1c30); border: 1px solid rgba(255,255,255,0.08); }
        .lp-level-card.locked     { background: linear-gradient(135deg,#0a1422,#0f1c30); border: 1px solid rgba(255,255,255,0.05); }
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
          border-radius: 16px; overflow: hidden; position: relative;
          transition: transform .3s cubic-bezier(0.16,1,0.3,1), border-color .25s, box-shadow .3s, background .2s;
          animation: lp-drop .3s ease both;
        }
        .lp-lesson-card.clickable { cursor: pointer; }
        .lp-lesson-card.clickable:hover {
          transform: translateY(-5px);
          box-shadow: 0 24px 56px -20px rgba(0,0,0,0.8);
          border-color: rgba(255,255,255,0.16) !important;
        }
        .lp-lesson-card.clickable:hover .lp-lesson-arrow { opacity: 1 !important; transform: translateX(4px) !important; }
        .lp-lesson-card.clickable:hover .lp-lesson-icon { transform: scale(1.08) rotate(-4deg) !important; }
        .lp-lesson-card.clickable:hover .lp-lesson-glow { opacity: 1 !important; }

        .lp-back-btn:hover    { color: #f0f4ff !important; }
        .lp-unlock-link:hover { transform: translateY(-2px); box-shadow: 0 8px 28px rgba(245,158,11,0.35) !important; }
        .lp-unlock-sm:hover   { background: rgba(245,158,11,0.13) !important; border-color: rgba(245,158,11,0.3) !important; }
         body { background: #04080f; }
      `}</style>

      {/* CircuitBg is fixed/zIndex:0, outer div has the bg color, main is transparent with zIndex:1 */}
      <CircuitBg />
      <div style={{ minHeight: '100vh', position: 'relative', zIndex: 1 }}>
        <main style={{ minHeight: '100vh', background: 'transparent', color: '#f0f4ff', fontFamily: '"Inter",sans-serif' }}>
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
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#f59e0b', animation: 'bm-pulse 2s infinite', display: 'inline-block' }} />
                <span style={{ fontSize: 10, fontWeight: 600, color: '#fbbf24', letterSpacing: '0.14em', textTransform: 'uppercase', fontFamily: '"Inter", system-ui, sans-serif' }}>Structured Learning</span>
              </div>

              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
                <div>
                  <h1 style={{ fontFamily: '"Space Grotesk",sans-serif', fontSize: 32, fontWeight: 700, letterSpacing: -1, lineHeight: 1.1, color: '#f0f4ff' }}>Learning Path</h1>
                  <p style={{ marginTop: 8, fontSize: 14, color: 'rgba(240,244,255,0.45)', lineHeight: 1.6 }}>Master ESP32 from basics to IoT cloud projects</p>
                </div>
                {mounted && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 16px', borderRadius: 14, background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)', flexShrink: 0 }}>
                    <span style={{ width: 32, height: 32, borderRadius: 9, background: 'rgba(245,158,11,0.14)', color: '#f59e0b', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <BoltIcon size={15} />
                    </span>
                    <div>
                      <p style={{ margin: '0 0 1px', fontSize: 17, fontWeight: 700, color: '#fbbf24', fontFamily: '"Space Grotesk",sans-serif', lineHeight: 1 }}>{totalXP}</p>
                      <p style={{ margin: 0, fontSize: 9, color: 'rgba(245,158,11,0.6)', fontFamily: '"Inter", system-ui, sans-serif', textTransform: 'uppercase', letterSpacing: '0.08em' }}>XP Earned</p>
                    </div>
                  </div>
                )}
              </div>
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
                const levelDone = isLevelCompleted(level.id);
                const completedCount = level.lessons.filter(l => isLessonCompleted(l.id)).length;
                const levelProgress = level.lessons.length > 0 ? Math.round((completedCount / level.lessons.length) * 100) : 0;
                const levelXP = completedCount * XP_PER_LESSON;
                const accent = LEVEL_ACCENTS[(level.id - 1) % LEVEL_ACCENTS.length];
                const isOpen = openLevels.has(level.id);

                return (
                  <div
                    key={level.id}
                    className={`lp-level-card ${levelAccessible ? 'accessible' : 'locked'} ${isOpen ? 'open' : ''}`}
                    style={{ animationDelay: `${idx * 55}ms` }}
                  >
                    <div className="lp-accent-bar" style={{ background: levelAccessible ? accent : 'rgba(255,255,255,0.08)' }} />

                    <button
                      type="button"
                      disabled={!levelAccessible}
                      onClick={() => levelAccessible && toggleLevel(level.id)}
                      className="lp-header-btn"
                    >
                      <div style={{ width: 40, height: 40, borderRadius: 12, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: levelAccessible ? (accent + '18') : 'rgba(255,255,255,0.04)', border: `1px solid ${levelAccessible ? (accent + '28') : 'rgba(255,255,255,0.07)'}`, fontFamily: '"Space Grotesk",sans-serif', fontSize: 16, fontWeight: 700, color: levelAccessible ? accent : 'rgba(240,244,255,0.25)', transition: 'all .3s' }}>
                        {level.id}
                      </div>

                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 5 }}>
                          <span style={{ fontSize: 9.5, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', fontFamily: '"Inter", system-ui, sans-serif', color: levelAccessible ? accent : 'rgba(240,244,255,0.2)' }}>
                            Level {level.id}
                          </span>
                          {levelDone && (
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '2px 9px', borderRadius: 99, background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.18)', fontSize: 10, fontWeight: 600, color: '#6ee7b7', fontFamily: '"Inter", system-ui, sans-serif' }}>
                              <CheckIcon /> Completed
                            </span>
                          )}
                          {!levelAccessible && (
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '2px 9px', borderRadius: 99, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', fontSize: 10, fontWeight: 500, color: 'rgba(240,244,255,0.28)', fontFamily: '"Inter", system-ui, sans-serif' }}>
                              <LockIcon /> Locked
                            </span>
                          )}
                          {levelAccessible && levelXP > 0 && (
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '2px 8px', borderRadius: 99, background: `${accent}12`, border: `1px solid ${accent}28`, fontSize: 9.5, fontWeight: 700, color: accent, fontFamily: '"Inter", system-ui, sans-serif' }}>
                              <BoltIcon size={8} /> {levelXP} XP
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
                              <span style={{ fontSize: 10, color: 'rgba(240,244,255,0.35)', fontFamily: '"Inter", system-ui, sans-serif' }}>{completedCount} / {level.lessons.length} lessons</span>
                              <span style={{ fontSize: 10, color: accent, fontFamily: '"Inter", system-ui, sans-serif', fontWeight: 700 }}>{levelProgress}%</span>
                            </div>
                            <div style={{ height: 3, borderRadius: 99, background: 'rgba(255,255,255,0.05)' }}>
                              <div style={{ height: 3, borderRadius: 99, background: accent, width: `${levelProgress}%`, transition: 'width .7s cubic-bezier(0.16,1,0.3,1)', opacity: 0.85 }} />
                            </div>
                          </div>
                        )}
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
                        <div style={{ textAlign: 'right' }}>
                          <p style={{ margin: '0 0 2px', fontSize: 10, color: 'rgba(240,244,255,0.28)', fontFamily: '"Inter", system-ui, sans-serif', whiteSpace: 'nowrap' }}>
                            {level.lessons.length} lessons
                          </p>
                          <p style={{ margin: 0, fontSize: 9.5, color: 'rgba(245,158,11,0.5)', fontFamily: '"Inter", system-ui, sans-serif', whiteSpace: 'nowrap' }}>
                            {level.lessons.length * XP_PER_LESSON} XP total
                          </p>
                        </div>
                        {levelAccessible && (
                          <div style={{ color: isOpen ? accent : 'rgba(240,244,255,0.28)', transition: 'color .2s' }}>
                            <ChevronDown open={isOpen} />
                          </div>
                        )}
                      </div>
                    </button>

                    {/* Lesson dropdown */}
                    {isOpen && levelAccessible && (
                      <div style={{ padding: '0 16px 16px 16px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                        <div style={{ paddingTop: 12, display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 8 }}>
                          {level.lessons.map((lesson, li) => {
                            const accessible = canAccessLesson(level.id, lesson.id);
                            const done = isLessonCompleted(lesson.id);
                            const lessonToneColor = done ? '#10b981' : accessible ? accent : 'rgba(255,255,255,0.15)';

                            return (
                              <div
                                key={lesson.id}
                                className={`lp-lesson-card ${accessible ? 'clickable' : ''}`}
                                onClick={() => accessible && router.push(`/learn/level/${level.id}/lesson/${lesson.id}`)}
                                style={{
                                  background: done
                                    ? 'linear-gradient(135deg,rgba(16,185,129,0.06),rgba(16,185,129,0.03))'
                                    : 'linear-gradient(135deg,#0a1422,#0f1c30)',
                                  border: `1px solid ${done ? 'rgba(16,185,129,0.2)' : 'rgba(255,255,255,0.07)'}`,
                                  opacity: !accessible ? 0.5 : 1,
                                  animationDelay: `${li * 35}ms`,
                                  padding: 18,
                                  display: 'flex', gap: 14, alignItems: 'flex-start',
                                }}
                              >
                                <span style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 3, background: lessonToneColor, opacity: done ? 0.7 : 0.5, borderRadius: '16px 0 0 16px' }} />
                                <div className="lp-lesson-glow" style={{ position: 'absolute', top: -30, right: -20, width: 120, height: 120, borderRadius: '50%', background: `radial-gradient(circle,${lessonToneColor}40,transparent 65%)`, opacity: 0, transition: 'opacity .35s', pointerEvents: 'none' }} />

                                <div className="lp-lesson-icon" style={{ width: 40, height: 40, flexShrink: 0, borderRadius: 12, background: done ? 'rgba(16,185,129,0.15)' : (accent + '18'), border: `1px solid ${done ? 'rgba(16,185,129,0.25)' : (accent + '28')}`, color: done ? '#34d399' : accent, display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'transform .35s cubic-bezier(0.16,1,0.3,1)', position: 'relative' }}>
                                  {done ? <CheckIcon size={16} /> : !accessible ? <LockIcon size={14} /> : (
                                    <span style={{ fontSize: 13, fontWeight: 700, fontFamily: '"Space Grotesk",sans-serif' }}>{li + 1}</span>
                                  )}
                                </div>

                                <div style={{ flex: 1, minWidth: 0, position: 'relative' }}>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 6 }}>
                                    <h3 style={{ fontFamily: '"Space Grotesk",sans-serif', fontSize: 14, fontWeight: 700, color: accessible ? '#f0f4ff' : 'rgba(240,244,255,0.35)', margin: 0, letterSpacing: -0.2, lineHeight: 1.2 }}>
                                      {lesson.title}
                                    </h3>
                                    {done && (
                                      <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.08em', fontFamily: '"Inter", system-ui, sans-serif', padding: '2px 8px', borderRadius: 99, background: 'rgba(16,185,129,0.12)', border: '1px solid rgba(16,185,129,0.22)', color: '#34d399', textTransform: 'uppercase', flexShrink: 0 }}>Done</span>
                                    )}
                                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 9.5, color: 'rgba(240,244,255,0.3)', fontFamily: '"Inter", system-ui, sans-serif', padding: '2px 7px', borderRadius: 99, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)', flexShrink: 0 }}>
                                      <ClockIcon /> {lesson.estimatedMinutes}m
                                    </span>
                                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 9.5, fontWeight: 700, fontFamily: '"Inter", system-ui, sans-serif', padding: '2px 7px', borderRadius: 99, background: done ? 'rgba(245,158,11,0.12)' : 'rgba(245,158,11,0.07)', border: `1px solid ${done ? 'rgba(245,158,11,0.3)' : 'rgba(245,158,11,0.15)'}`, color: done ? '#fbbf24' : 'rgba(245,158,11,0.55)', flexShrink: 0 }}>
                                      <BoltIcon size={8} /> +{XP_PER_LESSON} XP
                                    </span>
                                  </div>

                                  <p style={{ fontSize: 12, color: 'rgba(240,244,255,0.45)', lineHeight: 1.65, margin: '0 0 12px' }}>
                                    {lesson.description}
                                  </p>

                                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                    <div style={{ flex: 1 }}>
                                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                                        <span style={{ fontSize: 9.5, color: 'rgba(240,244,255,0.22)', fontFamily: '"Inter", system-ui, sans-serif' }}>{lesson.steps.length} steps</span>
                                        {done && <span style={{ fontSize: 9.5, color: '#34d399', fontFamily: '"Inter", system-ui, sans-serif' }}>100%</span>}
                                      </div>
                                      <div style={{ height: 2, borderRadius: 99, background: 'rgba(255,255,255,0.06)' }}>
                                        <div style={{ height: 2, borderRadius: 99, background: done ? '#10b981' : accent, width: done ? '100%' : '0%', transition: 'width .5s ease' }} />
                                      </div>
                                    </div>
                                    {accessible && (
                                      <div className="lp-lesson-arrow" style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 11.5, fontWeight: 700, color: done ? '#34d399' : accent, opacity: 0, transform: 'translateX(-4px)', transition: 'opacity .22s, transform .22s', flexShrink: 0 }}>
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
                                        <p style={{ fontSize: 10, color: 'rgba(240,244,255,0.22)', fontFamily: '"Inter", system-ui, sans-serif', margin: 0 }}>Complete previous lesson first</p>
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

                    {/* Locked level CTA */}
                    {!levelAccessible && (
                      <div style={{ padding: '0 30px 18px' }}>
                        {!hasEsp32 ? (
                          <Link href="/redeem" className="lp-unlock-sm" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, borderRadius: 10, padding: '7px 16px', background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)', fontSize: 12, fontWeight: 600, color: '#fbbf24', textDecoration: 'none', transition: 'all .2s' }}>
                            <LockIcon size={11} /> Unlock Full Access →
                          </Link>
                        ) : (
                          <p style={{ fontSize: 11, color: 'rgba(240,244,255,0.28)', fontFamily: '"Inter", system-ui, sans-serif', margin: 0 }}>Complete the previous level to unlock</p>
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