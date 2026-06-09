'use client';

import React from 'react';
import { useParams, useRouter } from 'next/navigation';

import Canvas from '@/components/Canvas';
import CodePanel from '@/components/CodePanel';
import Header from '@/components/Header';
import PDFViewer from '@/components/PDFViewer';
import Sidebar from '@/components/Sidebar';
import SimulationOverlay from '@/components/SimulationOverlay';
import StaticCodePanel from '@/components/StaticCodePanel';
import { MAPPING_PANEL_REGISTRY } from '@/lib/mappingPanelRegistry';
import { BLOCK_CATALOGUE } from '@/lib/blockCatalogue';
import { LEVELS } from '@/lib/lessonConfig';
import { SIMULATION_REGISTRY } from '@/lib/simulationRegistry';
import { useAppStore } from '@/store/useAppStore';
import InteractiveLecture from '@/components/InteractiveLecture';
import { useActivityStore } from '@/store/useActivityStore';
import { LECTURES_STRUCTURED_DATA } from '@/lib/lecturesStructuredData';

/* ── shared design tokens ── */
const T = {
  bg: '#04080f',
  bgSidebar: '#060d19',
  bgCard: 'rgba(255,255,255,0.025)',
  bgCardHov: 'rgba(255,255,255,0.04)',
  border: 'rgba(255,255,255,0.07)',
  borderHov: 'rgba(255,255,255,0.13)',
  textPrimary: '#f0f4ff',
  textSec: 'rgba(240,244,255,0.55)',
  textMuted: 'rgba(240,244,255,0.3)',
  textTiny: 'rgba(240,244,255,0.18)',
  blue: '#3b82f6',
  amber: '#f59e0b',
  green: '#10b981',
  mono: '"JetBrains Mono", monospace',
  sans: '"Inter", sans-serif',
  display: '"Space Grotesk", sans-serif',
};

const LEVEL_ACCENTS = ['#3b82f6', '#f59e0b', '#10b981', '#8b5cf6', '#ef4444'];
const getAccent = (id: number) => LEVEL_ACCENTS[(id - 1) % LEVEL_ACCENTS.length];

const STEP_TYPE_LABEL: Record<string, string> = {
  content: 'Read',
  concept: 'Concept',
  explore: 'Explore',
  challenge: 'Challenge',
  mapping: 'Mapping',
};

/* ── inline SVG icons ── */
const ChevronLeft = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="15 18 9 12 15 6" />
  </svg>
);
const Check = ({ size = 12 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12" />
  </svg>
);
const Lock = () => (
  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" />
  </svg>
);
const ArrowRight = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M5 12h14M12 5l7 7-7 7" />
  </svg>
);

/* ════════════════════════════════════════════════════════════
   LOADING / ERROR SCREENS
   ════════════════════════════════════════════════════════════ */
function LoadingScreen({ label }: { label: string }) {
  return (
    <main style={{ minHeight: '100vh', background: T.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: T.sans }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{
          width: 34, height: 34, borderRadius: '50%', margin: '0 auto 14px',
          border: `2.5px solid rgba(59,130,246,0.15)`,
          borderTop: `2.5px solid ${T.blue}`,
          animation: 'lp-spin .8s linear infinite',
        }} />
        <p style={{ fontSize: 12, color: T.textMuted, fontFamily: T.mono, letterSpacing: '0.05em' }}>{label}</p>
      </div>
      <style>{`@keyframes lp-spin { to { transform: rotate(360deg); } }`}</style>
    </main>
  );
}

function NotFoundScreen({ onBack }: { onBack: () => void }) {
  return (
    <main style={{ minHeight: '100vh', background: T.bg, fontFamily: T.sans }}>
      <div style={{ maxWidth: 480, margin: '80px auto', padding: '0 24px' }}>
        <div style={{ borderRadius: 18, background: T.bgCard, border: `1px solid ${T.border}`, padding: '32px 28px' }}>
          <p style={{ fontSize: 16, fontWeight: 700, color: T.textPrimary, fontFamily: T.display, margin: '0 0 8px' }}>Lesson not found</p>
          <p style={{ fontSize: 13, color: T.textSec, margin: '0 0 20px' }}>This lesson doesn't exist or may have moved.</p>
          <button
            type="button"
            onClick={onBack}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              padding: '8px 18px', borderRadius: 10, cursor: 'pointer',
              fontSize: 13, fontWeight: 600, fontFamily: T.sans,
              background: 'rgba(255,255,255,0.04)', border: `1px solid ${T.border}`,
              color: T.textSec, transition: 'all .18s',
            }}
          >
            <ChevronLeft /> Back to Learning Path
          </button>
        </div>
      </div>
    </main>
  );
}

/* ════════════════════════════════════════════════════════════
   MAIN PAGE
   ════════════════════════════════════════════════════════════ */
export default function LessonPage() {
  const router = useRouter();
  const params = useParams<{ levelId: string; lessonId: string }>();
  const blocks = useAppStore((s) => s.blocks);
  const clearBlocks = useAppStore((s) => s.clearBlocks);

  const levelId = Number(params.levelId);
  const lessonId = params.lessonId;
  const accent = getAccent(levelId);

  const { hasAccess, isCheckingSub, initialize, markLessonComplete } = useActivityStore();
  const hasEsp32 = hasAccess('esp32');
  const isFreePreview = levelId === 1 && lessonId === '1-1';

  React.useEffect(() => { initialize(); }, [initialize]);

  React.useEffect(() => {
    if (!isCheckingSub && !isFreePreview) {
      if (!hasEsp32 && (levelId > 1 || lessonId !== '1-1')) {
        router.push('/redeem');
      }
    }
  }, [isCheckingSub, hasEsp32, levelId, lessonId, isFreePreview, router]);

  const level = LEVELS.find((l) => l.id === levelId);
  const lesson = level?.lessons.find((l) => l.id === lessonId);

  const [currentStepIndex, setCurrentStepIndex] = React.useState(0);
  const [completedSteps, setCompletedSteps] = React.useState<Set<number>>(new Set());
  const [challengeError, setChallengeError] = React.useState<string | null>(null);
  const [challengePassed, setChallengePassed] = React.useState(false);
  const [contentReady, setContentReady] = React.useState(false);
  const [contentWarning, setContentWarning] = React.useState(false);
  const [quizReady, setQuizReady] = React.useState(false);

  const totalSteps = lesson?.steps.length ?? 0;
  const currentStep = lesson?.steps[currentStepIndex];

  const lectureKey = `${levelId}-${lessonId}-${currentStep?.id}`;
  const stepLecture = LECTURES_STRUCTURED_DATA[lectureKey];
  const hasQuiz = !!(stepLecture?.quiz && stepLecture.quiz.length > 0);
  const progressPct = totalSteps > 0 ? ((currentStepIndex + 1) / totalSteps) * 100 : 0;

  React.useEffect(() => {
    if (currentStep?.type !== 'mapping') clearBlocks();
    setChallengeError(null);
    setChallengePassed(false);
    setContentReady(false);
    setContentWarning(false);
    setQuizReady(false);
  }, [clearBlocks, currentStepIndex, currentStep?.type]);

  React.useEffect(() => {
    const onLecture = () => setContentReady(true);
    const onQuiz = () => setQuizReady(true);
    window.addEventListener('lecture-complete', onLecture);
    window.addEventListener('quiz-complete', onQuiz);
    return () => {
      window.removeEventListener('lecture-complete', onLecture);
      window.removeEventListener('quiz-complete', onQuiz);
    };
  }, []);

  /* guards */
  if (isCheckingSub && !isFreePreview) return <LoadingScreen label="Verifying kit activation..." />;
  if (!level || !lesson || !currentStep) return <NotFoundScreen onBack={() => router.push('/learn')} />;

  /* ── handlers ── */
  const handlePrev = () => { if (currentStepIndex > 0) setCurrentStepIndex(p => p - 1); };

  const validateChallenge = (): boolean => {
    if (!currentStep.challengeBlocks) return true;
    const studentTypes = blocks.map((b) => b.type);
    const requiredTypes = currentStep.challengeBlocks;
    setChallengePassed(false);

    if (studentTypes.length === 0) { setChallengeError('Add some blocks to complete this challenge!'); return false; }

    if (currentStep.challengeStrict) {
      const ok = studentTypes.length === requiredTypes.length && requiredTypes.every((t, i) => studentTypes[i] === t);
      if (!ok) { setChallengeError('Good start! Try reordering your blocks — check the hint for the right sequence.'); return false; }
    } else {
      const blockNames: Record<string, string> = { pinMode: 'Set Pin Mode', dw_high: 'Turn ON LED', dw_low: 'Turn OFF LED', delay_ms: 'Wait (ms)', delay_sec: 'Wait (seconds)', serial_begin: 'Start Serial', btn_read: 'Read Button', if_block: 'If condition', end_if: 'End If' };
      const missing = requiredTypes.filter(r => {
        if (r === 'delay_ms' || r === 'delay_sec') return !studentTypes.includes('delay_ms') && !studentTypes.includes('delay_sec');
        return !studentTypes.includes(r);
      });
      if (missing.length > 0) { setChallengeError(`Almost there! You still need: ${missing.map(b => blockNames[b] || b).join(', ')}.`); return false; }
    }

    if (currentStep.challengePinValues) {
      for (const [bt, ep] of Object.entries(currentStep.challengePinValues)) {
        const b = blocks.find(b => b.type === bt);
        if (b && Number(b.values.pin) !== ep) { setChallengeError(`Check the pin number on your ${bt} block — expected Pin ${ep}`); return false; }
      }
    }
    setChallengeError(null); setChallengePassed(true); return true;
  };

  const handleAdvance = async () => {
    setCompletedSteps(prev => { const n = new Set(prev); n.add(currentStepIndex); return n; });
    if (currentStepIndex >= totalSteps - 1) { await markLessonComplete(lessonId); router.push(`/learn/level/${levelId}`); return; }
    setCurrentStepIndex(p => p + 1);
  };

  const handleNext = () => {
    if (currentStep.type === 'content' || currentStep.type === 'concept') {
      if (!currentStep.pdfUrl && !contentReady) { setContentWarning(true); return; }
      if (currentStep.type === 'concept' && hasQuiz && !quizReady) { setContentWarning(true); return; }
    }
    setContentWarning(false);
    if (currentStep.type === 'challenge') {
      if (currentStep.challengeSimulationId) { handleAdvance(); return; }
      if (!challengePassed) { if (!validateChallenge()) return; return; }
      handleAdvance(); return;
    }
    handleAdvance();
  };

  const allowedBlocks = currentStep.allowedBlocks
    ? currentStep.allowedBlocks.filter(t => BLOCK_CATALOGUE.some(b => b.type === t))
    : undefined;
  const SimComp = currentStep.simulationId ? SIMULATION_REGISTRY[currentStep.simulationId] ?? null : null;

  const isLastStep = currentStepIndex === totalSteps - 1;

  return (
    <>
      <link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;700&display=swap" rel="stylesheet" />

      <style suppressHydrationWarning>{`
        * { box-sizing: border-box; }
        @keyframes lp-spin    { to { transform: rotate(360deg); } }
        @keyframes lp-fadein  { from{opacity:0;transform:translateY(6px)} to{opacity:1;transform:none} }
        .lp-step-btn:hover:not(:disabled) { background: rgba(255,255,255,0.05) !important; border-color: rgba(255,255,255,0.1) !important; }
        .lp-back-btn:hover    { color: #f0f4ff !important; }
        .lp-next-btn:hover    { transform: translateY(-1px); box-shadow: 0 8px 24px rgba(59,130,246,0.35) !important; }
        .lp-prev-btn:hover:not(:disabled) { color: rgba(240,244,255,0.7) !important; }
        .lp-map-panel         { background: rgba(255,255,255,0.025); border: 1px solid rgba(255,255,255,0.07); border-radius: 14px; overflow: hidden; }
      `}</style>

      <main style={{ minHeight: '100vh', background: T.bg, color: T.textPrimary, fontFamily: T.sans }}>
        <Header />

        <div style={{ display: 'flex', height: 'calc(100vh - 64px)', overflow: 'hidden' }}>

          {/* ══════════════ SIDEBAR ══════════════ */}
          <aside style={{
            width: 264, flexShrink: 0, display: 'flex', flexDirection: 'column',
            background: T.bgSidebar,
            borderRight: `1px solid ${T.border}`,
          }}>
            {/* Lesson meta */}
            <div style={{ padding: '16px 16px 16px', borderBottom: `1px solid ${T.border}` }}>
              <button
                type="button"
                onClick={() => router.push('/learn')}
                className="lp-back-btn"
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 6,
                  background: 'rgba(255,255,255,0.02)', border: `1px solid ${T.border}`,
                  cursor: 'pointer', padding: '8px 11px', borderRadius: 10, marginBottom: 16,
                  fontSize: 11.5, fontWeight: 600, color: T.textSec, fontFamily: T.sans, transition: 'background .15s, color .15s',
                }}
              >
                <ChevronLeft /> All levels
              </button>

              <p style={{ margin: '0 0 4px', fontSize: 9, fontWeight: 700, color: accent, fontFamily: T.mono, textTransform: 'uppercase', letterSpacing: '0.14em' }}>Lesson</p>
              <h2 style={{ fontFamily: T.display, fontSize: 15, fontWeight: 700, color: T.textPrimary, margin: '0 0 6px', letterSpacing: -0.2, lineHeight: 1.3 }}>
                {lesson.title}
              </h2>
              <p style={{ fontSize: 11.5, color: T.textSec, margin: '0 0 14px', lineHeight: 1.55 }}>
                {lesson.description}
              </p>

              {/* Progress card */}
              <div style={{ padding: '11px 12px', borderRadius: 12, background: 'rgba(255,255,255,0.02)', border: `1px solid ${T.border}` }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                  <span style={{ fontSize: 9.5, fontWeight: 600, color: T.textMuted, fontFamily: T.mono, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Progress</span>
                  <span style={{ fontSize: 12.5, fontWeight: 800, color: accent, fontFamily: T.display, lineHeight: 1 }}>{Math.round(progressPct)}%</span>
                </div>
                <div style={{ height: 5, borderRadius: 99, background: 'rgba(255,255,255,0.06)', overflow: 'hidden' }}>
                  <div style={{
                    height: '100%', borderRadius: 99, background: accent,
                    width: `${progressPct}%`, transition: 'width .5s cubic-bezier(0.16,1,0.3,1)',
                    boxShadow: `0 0 8px ${accent}80`,
                  }} />
                </div>
                <p style={{ margin: '7px 0 0', fontSize: 9.5, color: T.textMuted, fontFamily: T.mono }}>
                  {currentStepIndex + 1} / {totalSteps} steps
                </p>
              </div>
            </div>

            {/* Step list */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '14px 14px' }}>
              {lesson.steps.map((step, i) => {
                const isActive = i === currentStepIndex;
                const isCompleted = completedSteps.has(i);
                const isLocked = i > completedSteps.size;

                return (
                  <div key={step.id} style={{ display: 'flex', flexDirection: 'column' }}>
                    <button
                      type="button"
                      disabled={isLocked}
                      onClick={() => setCurrentStepIndex(i)}
                      className="lp-step-btn"
                      style={{
                        width: '100%', display: 'flex', alignItems: 'center', gap: 11,
                        padding: '8px 9px', borderRadius: 11, textAlign: 'left',
                        cursor: isLocked ? 'not-allowed' : 'pointer',
                        border: 'none',
                        boxShadow: isActive ? `inset 0 0 0 1px ${accent}40` : 'none',
                        background: isActive ? (accent + '14') : 'transparent',
                        opacity: isLocked ? 0.4 : 1,
                        transition: 'background .18s, box-shadow .18s',
                      }}
                    >
                      {/* Round icon badge */}
                      <div style={{
                        width: 30, height: 30, borderRadius: '50%', flexShrink: 0,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        background: isActive ? accent
                          : isCompleted ? '#10b981'
                            : 'rgba(255,255,255,0.06)',
                        border: isActive || isCompleted ? 'none' : `1px solid ${T.border}`,
                        color: isActive ? '#fff' : isCompleted ? '#fff' : T.textTiny,
                        boxShadow: isActive ? `0 0 12px ${accent}55` : 'none',
                        transition: 'all .18s',
                      }}>
                        {isCompleted && !isActive ? <Check size={13} /> : isLocked ? <Lock /> : (
                          <span style={{ fontSize: 11, fontWeight: 800, fontFamily: T.mono }}>{i + 1}</span>
                        )}
                      </div>

                      <div style={{ minWidth: 0, flex: 1 }}>
                        <p style={{
                          fontSize: 12.5, fontWeight: 700, margin: 0, lineHeight: 1.3,
                          color: isActive ? T.textPrimary : isCompleted ? '#6ee7b7' : T.textSec,
                          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                          transition: 'color .18s',
                        }}>{step.title}</p>
                        <p style={{
                          fontSize: 9.5, margin: '2px 0 0', fontFamily: T.mono,
                          letterSpacing: '0.07em', textTransform: 'uppercase',
                          color: isActive ? accent : T.textTiny,
                          transition: 'color .18s',
                        }}>{STEP_TYPE_LABEL[step.type] ?? step.type}</p>
                      </div>

                      {isActive && <span style={{ width: 6, height: 6, borderRadius: '50%', background: accent, flexShrink: 0, animation: 'bm-pulse 1.5s infinite' }} />}
                    </button>

                    {/* Connecting line */}
                    {i < lesson.steps.length - 1 && (
                      <div style={{
                        marginLeft: 24, width: 2, height: 12, borderRadius: 1,
                        background: isCompleted ? 'rgba(16,185,129,0.6)' : 'rgba(255,255,255,0.07)',
                        transition: 'background .3s',
                      }} />
                    )}
                  </div>
                );
              })}
            </div>
          </aside>

          {/* ══════════════ MAIN CONTENT ══════════════ */}
          <section style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0 }}>

            {/* Step header (not shown for PDF steps) */}
            {!currentStep.pdfUrl && (
              <div style={{
                padding: '16px 28px', borderBottom: `1px solid ${T.border}`,
                background: 'rgba(6,13,25,0.8)', flexShrink: 0,
                display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16,
              }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 5 }}>
                    <span style={{
                      fontSize: 9, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase',
                      fontFamily: T.mono, color: accent,
                      padding: '2px 9px', borderRadius: 99, background: accent + '14', border: `1px solid ${accent}28`,
                    }}>
                      {STEP_TYPE_LABEL[currentStep.type] ?? currentStep.type}
                    </span>
                  </div>
                  <h1 style={{ fontFamily: T.display, fontSize: 17, fontWeight: 700, color: T.textPrimary, margin: 0, letterSpacing: -0.3 }}>
                    {currentStep.title}
                  </h1>
                  {currentStep.description && (
                    <p style={{ fontSize: 12.5, color: T.textSec, margin: '4px 0 0', lineHeight: 1.5 }}>
                      {currentStep.description}
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Content warning banner */}
            {contentWarning && (currentStep.type === 'content' || currentStep.type === 'concept') && (
              <div style={{
                margin: '12px 24px 0', padding: '10px 16px', borderRadius: 10, flexShrink: 0,
                background: 'rgba(245,158,11,0.07)', border: '1px solid rgba(245,158,11,0.2)',
                display: 'flex', alignItems: 'center', gap: 10, animation: 'lp-fadein .3s ease both',
              }}>
                <div style={{ width: 5, height: 5, borderRadius: '50%', background: T.amber, flexShrink: 0 }} />
                <span style={{ fontSize: 12.5, color: 'rgba(251,191,36,0.85)', fontWeight: 600 }}>
                  {currentStep.type === 'concept' && hasQuiz && !quizReady
                    ? 'Complete the reading and quiz before continuing.'
                    : 'Mark all sections as read before continuing.'}
                </span>
              </div>
            )}

            {/* ── Scrollable body ── */}
            <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>

              {/* CONTENT / CONCEPT */}
              {(currentStep.type === 'content' || currentStep.type === 'concept') && (
                <div style={{ flex: 1, padding: '20px 28px', overflowY: 'auto', minHeight: 0 }}>
                  {currentStep.pdfUrl
                    ? <PDFViewer url={currentStep.pdfUrl} title={currentStep.pdfLabel} />
                    : <InteractiveLecture levelId={levelId} lessonId={lessonId} stepId={currentStep.id} />
                  }
                </div>
              )}

              {/* EXPLORE / CHALLENGE */}
              {(currentStep.type === 'explore' || currentStep.type === 'challenge') && (
                <div style={{ flex: 1, padding: '12px', overflow: 'hidden', display: 'flex', flexDirection: 'column', gap: 8 }}>

                  {/* Hint / feedback banners */}
                  {(currentStep.hint || contentWarning || challengeError || challengePassed) && (
                    <div style={{ flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 6 }}>
                      {currentStep.hint && (
                        <div style={{
                          padding: '9px 14px', borderRadius: 10,
                          background: 'rgba(245,158,11,0.07)', border: '1px solid rgba(245,158,11,0.18)',
                          display: 'flex', gap: 10, alignItems: 'flex-start',
                        }}>
                          <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', fontFamily: T.mono, color: T.amber, flexShrink: 0, marginTop: 2 }}>Hint</span>
                          <span style={{ fontSize: 12.5, color: 'rgba(251,191,36,0.75)', lineHeight: 1.6 }}>{currentStep.hint}</span>
                        </div>
                      )}
                      {challengeError && (
                        <div style={{
                          padding: '9px 14px', borderRadius: 10,
                          background: 'rgba(239,68,68,0.07)', border: '1px solid rgba(239,68,68,0.18)',
                          display: 'flex', gap: 10, alignItems: 'flex-start',
                        }}>
                          <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', fontFamily: T.mono, color: '#f87171', flexShrink: 0, marginTop: 2 }}>Error</span>
                          <span style={{ fontSize: 12.5, color: 'rgba(252,165,165,0.75)', lineHeight: 1.6 }}>{challengeError}</span>
                        </div>
                      )}
                      {challengePassed && (
                        <div style={{
                          padding: '9px 14px', borderRadius: 10,
                          background: 'rgba(16,185,129,0.07)', border: '1px solid rgba(16,185,129,0.2)',
                          display: 'flex', gap: 10, alignItems: 'center',
                        }}>
                          <Check size={11} />
                          <span style={{ fontSize: 12.5, color: '#6ee7b7', fontWeight: 600 }}>Solution looks correct — hit Next to continue.</span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Simulation or block canvas */}
                  <div style={{ flex: 1, overflow: 'hidden', borderRadius: 14, minHeight: 0 }}>
                    {currentStep.type === 'explore' && currentStep.explorationSimulationId ? (
                      <div style={{ height: '100%', overflowY: 'auto' }}>
                        {(() => { const C = SIMULATION_REGISTRY[currentStep.explorationSimulationId] ?? null; return C ? <C /> : null; })()}
                      </div>
                    ) : currentStep.type === 'challenge' && currentStep.challengeSimulationId ? (
                      <div style={{ height: '100%', overflowY: 'auto' }}>
                        {(() => { const C = SIMULATION_REGISTRY[currentStep.challengeSimulationId] ?? null; return C ? <C /> : null; })()}
                      </div>
                    ) : (
                      <div style={{ display: 'flex', height: '100%', gap: 10, overflow: 'hidden' }}>
                        <div style={{ width: 240, flexShrink: 0, borderRadius: 14, overflow: 'hidden', background: T.bgSidebar, border: `1px solid ${T.border}` }}>
                          <Sidebar allowedBlocks={allowedBlocks} />
                        </div>
                        <div style={{ flex: 1, overflow: 'hidden', borderRadius: 14, border: `1px solid ${T.border}` }}>
                          <Canvas showAIButton={false} />
                        </div>
                      </div>
                    )}
                  </div>

                  {currentStep.type === 'challenge' && SimComp && !currentStep.challengeSimulationId && (
                    <SimulationOverlay isOpen={challengePassed} onContinue={handleAdvance} blocks={blocks} title="See what your code does on the hardware">
                      <SimComp />
                    </SimulationOverlay>
                  )}
                </div>
              )}

              {/* MAPPING */}
              {currentStep.type === 'mapping' && (
                <div style={{ flex: 1, padding: '14px 16px', display: 'flex', flexDirection: 'column', overflow: 'hidden', gap: 10 }}>
                  <p style={{ fontSize: 11.5, color: T.textMuted, fontFamily: T.mono, letterSpacing: '0.04em', flexShrink: 0, margin: 0 }}>
                    See how each block maps to real Arduino C++ code
                  </p>

                  <div style={{ flex: 1, display: 'flex', gap: 10, overflow: 'hidden', minHeight: 0 }}>
                    {/* Left panel */}
                    <div className="lp-map-panel" style={{ flexShrink: 0, overflow: 'hidden', width: currentStep.mappingSimulationId ? undefined : 360, flex: currentStep.mappingSimulationId ? 1 : undefined }}>
                      {currentStep.mappingSimulationId ? (
                        <div style={{ height: '100%', overflowY: 'auto', padding: 12 }}>
                          {(() => { const C = SIMULATION_REGISTRY[currentStep.mappingSimulationId] ?? null; return C ? <C /> : null; })()}
                        </div>
                      ) : (
                        <>
                          <div style={{ padding: '10px 14px', borderBottom: `1px solid ${T.border}`, background: accent + '10' }}>
                            <p style={{ margin: 0, fontSize: 11, fontWeight: 700, fontFamily: T.mono, letterSpacing: '0.08em', textTransform: 'uppercase', color: accent }}>
                              {lesson.steps.find(s => s.type === 'challenge')?.challengeSimulationId ? 'Example Program' : 'Your Blocks'}
                            </p>
                          </div>
                          <div style={{ overflowY: 'auto', height: 'calc(100% - 38px)', pointerEvents: 'none' }}>
                            {lesson.steps.find(s => s.type === 'challenge')?.challengeSimulationId ? (
                              <div style={{ padding: '14px 14px', display: 'flex', flexDirection: 'column', gap: 6 }}>
                                <p style={{ fontSize: 10.5, color: T.textMuted, marginBottom: 8, lineHeight: 1.6 }}>
                                  This lesson used an interactive simulator. Below is a representative program showing the concept.
                                </p>
                                {[
                                  { label: 'Set Pin 2 as OUTPUT', color: '#f97316' },
                                  { label: 'Turn ON LED on Pin 2', color: '#f97316' },
                                  { label: 'Wait 1000 ms', color: '#eab308' },
                                  { label: 'Turn OFF LED on Pin 2', color: '#f97316' },
                                  { label: 'Wait 1000 ms', color: '#eab308' },
                                ].map((b, i) => (
                                  <div key={i} style={{
                                    padding: '9px 13px', borderRadius: 10,
                                    background: b.color + '18', border: `1px solid ${b.color}30`,
                                    fontSize: 12, fontWeight: 600, color: b.color,
                                    display: 'flex', alignItems: 'center', gap: 8,
                                    borderLeft: `3px solid ${b.color}`,
                                  }}>
                                    {b.label}
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <Canvas showAIButton={false} />
                            )}
                          </div>
                        </>
                      )}
                    </div>

                    {/* Arrow connector */}
                    <div style={{ flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 4, padding: '0 4px' }}>
                      <div style={{ width: 24, height: 1, background: `linear-gradient(90deg,transparent,${T.border})` }} />
                      <ArrowRight />
                      <p style={{ fontSize: 9, color: T.textTiny, fontFamily: T.mono, letterSpacing: '0.06em', margin: 0 }}>generates</p>
                      <div style={{ width: 24, height: 1, background: `linear-gradient(90deg,${T.border},transparent)` }} />
                    </div>

                    {/* Right panel — code */}
                    <div className="lp-map-panel" style={{ overflow: 'hidden', width: currentStep.mappingSimulationId ? 380 : undefined, flexShrink: currentStep.mappingSimulationId ? 0 : undefined, flex: currentStep.mappingSimulationId ? undefined : 1 }}>
                      {(() => {
                        if (currentStep.mappingCodeComponent) {
                          const Panel = MAPPING_PANEL_REGISTRY[currentStep.mappingCodeComponent] ?? null;
                          if (Panel) return <Panel />;
                        }
                        if (lesson.steps.find(s => s.type === 'challenge')?.challengeSimulationId) return <StaticCodePanel />;
                        return <CodePanel showLiveOutput={currentStep.showSerialOutput === true} />;
                      })()}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* ══════════════ BOTTOM NAV ══════════════ */}
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '12px 24px', borderTop: `1px solid ${T.border}`,
              background: 'rgba(6,13,25,0.9)', flexShrink: 0,
            }}>
              {/* Prev */}
              <button
                type="button"
                onClick={handlePrev}
                disabled={currentStepIndex === 0}
                className="lp-prev-btn"
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 6,
                  background: 'none', border: 'none', cursor: currentStepIndex === 0 ? 'not-allowed' : 'pointer',
                  fontSize: 13, color: currentStepIndex === 0 ? T.textTiny : T.textMuted,
                  fontFamily: T.sans, fontWeight: 500, transition: 'color .15s',
                  opacity: currentStepIndex === 0 ? 0.4 : 1,
                }}
              >
                <ChevronLeft /> Back
              </button>

              {/* Step dots */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                {lesson.steps.map((_, i) => {
                  const isActive = i === currentStepIndex;
                  const isCompleted = completedSteps.has(i);
                  return (
                    <span key={i} style={{
                      display: 'block',
                      width: isActive ? 20 : 6, height: 6, borderRadius: 99,
                      background: isActive ? accent : isCompleted ? T.green : 'rgba(255,255,255,0.1)',
                      transition: 'all .3s cubic-bezier(0.16,1,0.3,1)',
                    }} />
                  );
                })}
              </div>

              {/* Next */}
              <button
                type="button"
                onClick={handleNext}
                className="lp-next-btn"
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 8,
                  padding: '9px 22px', borderRadius: 10, cursor: 'pointer',
                  fontSize: 13, fontWeight: 700, fontFamily: T.sans,
                  background: `linear-gradient(135deg,${accent}cc,${accent})`,
                  border: 'none', color: '#fff',
                  boxShadow: `0 4px 16px ${accent}30`,
                  transition: 'all .22s',
                }}
              >
                {isLastStep ? (
                  <><Check size={12} /> Complete lesson</>
                ) : (
                  <>Next <ArrowRight /></>
                )}
              </button>
            </div>

          </section>
        </div>
      </main>
    </>
  );
}