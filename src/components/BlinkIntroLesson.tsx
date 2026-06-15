'use client';

import React, { useState } from 'react';

/* ─── Types ─────────────────────────────────────────────── */
interface SectionProps {
  number: string;
  title: string;
  icon: string;
  children: React.ReactNode;
  accent: string;
}

interface QuizQuestion {
  question: string;
  options: string[];
  correct: number;
  explanation: string;
}

/* ─── Collapsible section card ───────────────────────────── */
function Section({ number, title, icon, children, accent }: SectionProps) {
  const [open, setOpen] = useState(true);

  return (
    <div
      className="rounded-2xl border border-gray-100 bg-white shadow-sm overflow-hidden transition-all"
      style={{ borderLeft: `4px solid ${accent}` }}
    >
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center gap-3 px-5 py-4 text-left hover:bg-gray-50 transition-colors"
      >
        <span
          className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold"
          style={{ background: accent }}
        >
          {number}
        </span>
        <span className="text-lg mr-1">{icon}</span>
        <span className="flex-1 font-semibold text-[#2E4862] text-sm">{title}</span>
        <span className="text-gray-400 text-xs">{open ? '▲' : '▼'}</span>
      </button>

      {open && (
        <div className="px-5 pb-5 pt-1 text-sm text-gray-700 leading-relaxed space-y-3 animate-fadeIn">
          {children}
        </div>
      )}
    </div>
  );
}

/* ─── Bullet pill ────────────────────────────────────────── */
function Pill({ children, color = '#2E4862' }: { children: React.ReactNode; color?: string }) {
  return (
    <div className="flex items-start gap-2">
      <span
        className="mt-1 flex-shrink-0 w-2 h-2 rounded-full"
        style={{ background: color }}
      />
      <span>{children}</span>
    </div>
  );
}

/* ─── Highlight callout ─────────────────────────────────── */
function Callout({
  icon,
  children,
  bg = '#EFF6FF',
  border = '#BFDBFE',
  text = '#1E40AF',
}: {
  icon: string;
  children: React.ReactNode;
  bg?: string;
  border?: string;
  text?: string;
}) {
  return (
    <div
      className="flex items-start gap-3 rounded-xl px-4 py-3 text-sm"
      style={{ background: bg, border: `1px solid ${border}`, color: text }}
    >
      <span className="text-base flex-shrink-0">{icon}</span>
      <span>{children}</span>
    </div>
  );
}

/* ─── Mini quiz ─────────────────────────────────────────── */
function MiniQuiz({ questions }: { questions: QuizQuestion[] }) {
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [revealed, setRevealed] = useState<Record<number, boolean>>({});

  const pick = (qIdx: number, oIdx: number) => {
    if (revealed[qIdx]) return;
    setAnswers((a) => ({ ...a, [qIdx]: oIdx }));
  };

  const check = (qIdx: number) => {
    if (answers[qIdx] === undefined) return;
    setRevealed((r) => ({ ...r, [qIdx]: true }));
  };

  const score = Object.entries(revealed).filter(
    ([idx, done]) => done && answers[Number(idx)] === questions[Number(idx)].correct,
  ).length;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
          Quick Check 🧠
        </p>
        {Object.keys(revealed).length === questions.length && (
          <span className="bg-green-100 text-green-700 text-xs font-bold px-3 py-1 rounded-full">
            Score: {score}/{questions.length}
          </span>
        )}
      </div>

      {questions.map((q, qIdx) => {
        const chosen = answers[qIdx];
        const done = revealed[qIdx];
        const correct = questions[qIdx].correct;

        return (
          <div key={qIdx} className="rounded-xl border border-gray-200 bg-gray-50 p-4 space-y-3">
            <p className="font-medium text-[#2E4862] text-sm">{q.question}</p>
            <div className="grid gap-2">
              {q.options.map((opt, oIdx) => {
                let style =
                  'border border-gray-200 bg-white text-gray-700 hover:border-[#2E4862] hover:bg-blue-50';
                if (done) {
                  if (oIdx === correct)
                    style = 'border-2 border-green-400 bg-green-50 text-green-700 font-semibold';
                  else if (oIdx === chosen)
                    style = 'border-2 border-red-400 bg-red-50 text-red-700';
                  else style = 'border border-gray-200 bg-white text-gray-400 opacity-60';
                } else if (oIdx === chosen) {
                  style = 'border-2 border-[#2E4862] bg-blue-50 text-[#2E4862] font-semibold';
                }

                return (
                  <button
                    key={oIdx}
                    type="button"
                    onClick={() => pick(qIdx, oIdx)}
                    disabled={done}
                    className={`w-full text-left rounded-lg px-4 py-2.5 text-sm transition-all ${style}`}
                  >
                    {opt}
                  </button>
                );
              })}
            </div>

            {!done ? (
              <button
                type="button"
                onClick={() => check(qIdx)}
                disabled={chosen === undefined}
                className="mt-1 text-xs font-semibold px-4 py-1.5 rounded-lg bg-[#2E4862] text-white disabled:opacity-40 disabled:cursor-not-allowed transition-opacity"
              >
                Check Answer →
              </button>
            ) : (
              <Callout
                icon={chosen === correct ? '✅' : '❌'}
                bg={chosen === correct ? '#F0FDF4' : '#FEF2F2'}
                border={chosen === correct ? '#86EFAC' : '#FECACA'}
                text={chosen === correct ? '#166534' : '#991B1B'}
              >
                {q.explanation}
              </Callout>
            )}
          </div>
        );
      })}
    </div>
  );
}

/**
 * Renders an interactive lesson page about ESP32 sensors with collapsible sections, progress tracking, and an embedded mini-quiz.
 *
 * Completion is indicated when all 9 lesson sections are marked as read.
 */
export default function BlinkIntroLesson() {
  const [progress, setProgress] = useState<Set<number>>(new Set());

  const total = 9;
  const pct = Math.round((progress.size / total) * 100);

  const mark = (n: number) =>
    setProgress((prev) => {
      const next = new Set(prev);
      if (next.has(n)) {
        next.delete(n);
      } else {
        next.add(n);
      }
      return next;
    });

  return (
    <div className="min-h-full bg-gradient-to-br from-[#f0f4ff] to-[#e8f5e9] px-4 py-6 overflow-y-auto">
      <style>{`
        @keyframes fadeIn { from { opacity:0; transform:translateY(-4px); } to { opacity:1; transform:none; } }
        .animate-fadeIn { animation: fadeIn 0.2s ease; }
        @keyframes pulse-slow { 0%,100%{opacity:1} 50%{opacity:.6} }
        .pulse-slow { animation: pulse-slow 2s infinite; }
      `}</style>

      {/* ── Hero ── */}
      <div className="max-w-3xl mx-auto mb-6 rounded-3xl bg-[#2E4862] px-8 py-7 text-white shadow-lg relative overflow-hidden">
        <div className="absolute top-0 right-0 w-48 h-48 rounded-full bg-white/5 -translate-y-12 translate-x-12" />
        <div className="absolute bottom-0 left-0 w-32 h-32 rounded-full bg-white/5 translate-y-8 -translate-x-8" />
        <p className="text-xs font-bold uppercase tracking-widest text-blue-200 mb-2">
          Level 1 · Your First Blink · Introduction
        </p>
        <h1 className="text-2xl font-extrabold mb-2 leading-tight">
          How Does the ESP32 Read the World? 🌍
        </h1>
        <p className="text-sm text-blue-100 max-w-xl leading-relaxed">
          In this lesson you'll discover what sensors are, how the ESP32 processes real-world data,
          and why that makes your projects come alive.
        </p>

        {/* progress bar */}
        <div className="mt-5">
          <div className="flex justify-between text-xs text-blue-200 mb-1">
            <span>Reading progress</span>
            <span>{pct}%</span>
          </div>
          <div className="h-2 rounded-full bg-white/20">
            <div
              className="h-2 rounded-full bg-green-400 transition-all duration-500"
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>
      </div>

      {/* ── Sections ── */}
      <div className="max-w-3xl mx-auto space-y-4">

        {/* 3.1 */}
        <Section number="3.1" title="What is a Sensor?" icon="🔬" accent="#6366F1">
          <p>
            A <strong>sensor</strong> is a component that reads information from the physical world
            and converts it into data that the ESP32 can understand.
          </p>
          <p>
            Instead of you manually providing input (like a slider), the system now receives input
            from the <em>environment itself</em>.
          </p>
          <Callout icon="📡" bg="#EEF2FF" border="#C7D2FE" text="#3730A3">
            In this lesson the sensor measures:
            <br />
            🌡️ <strong>Temperature</strong> (heat level) &nbsp;·&nbsp; 💧 <strong>Humidity</strong>{' '}
            (moisture in air)
          </Callout>
          <div className="rounded-xl overflow-hidden border border-gray-100 shadow-sm">
            <img src="/lecs/3.1.png" alt="What is a sensor?" className="w-full object-contain" />
          </div>
          <button
            type="button"
            onClick={() => mark(1)}
            className={`text-xs px-3 py-1.5 rounded-full border transition-all mt-1 ${
              progress.has(1)
                ? 'bg-green-500 text-white border-green-500'
                : 'text-gray-400 border-gray-300 hover:border-green-400 hover:text-green-600'
            }`}
          >
            {progress.has(1) ? '✓ Got it!' : 'Mark as read'}
          </button>
        </Section>

        {/* 3.2 */}
        <Section number="3.2" title="What is the DHT Sensor Doing?" icon="🌡️" accent="#F59E0B">
          <p>
            The <strong>DHT sensor</strong> continuously monitors the environment and sends updated
            values to the ESP32. It does <strong>not</strong> give a single fixed value.
          </p>
          <div className="grid grid-cols-3 gap-3 mt-2">
            {[
              { icon: '🔄', label: 'Keeps measuring', color: '#FEF3C7', border: '#FCD34D', text: '#92400E' },
              { icon: '📊', label: 'Keeps updating', color: '#ECFDF5', border: '#6EE7B7', text: '#065F46' },
              { icon: '🌍', label: 'Reflects real-world changes', color: '#EFF6FF', border: '#93C5FD', text: '#1E40AF' },
            ].map((item) => (
              <div
                key={item.label}
                className="flex flex-col items-center text-center rounded-xl p-3 text-xs font-semibold"
                style={{ background: item.color, border: `1px solid ${item.border}`, color: item.text }}
              >
                <span className="text-2xl mb-1">{item.icon}</span>
                {item.label}
              </div>
            ))}
          </div>
          <Callout icon="💡" bg="#FFFBEB" border="#FDE68A" text="#92400E">
            The input is now <strong>external and dynamic</strong>, not manually controlled.
          </Callout>
          <div className="rounded-xl overflow-hidden border border-gray-100 shadow-sm">
            <img src="/lecs/3.2.png" alt="DHT sensor diagram" className="w-full object-contain" />
          </div>
          <button
            type="button"
            onClick={() => mark(2)}
            className={`text-xs px-3 py-1.5 rounded-full border transition-all mt-1 ${
              progress.has(2)
                ? 'bg-green-500 text-white border-green-500'
                : 'text-gray-400 border-gray-300 hover:border-green-400 hover:text-green-600'
            }`}
          >
            {progress.has(2) ? '✓ Got it!' : 'Mark as read'}
          </button>
        </Section>

        {/* 3.3 */}
        <Section number="3.3" title="Why Do Values Change Over Time?" icon="📈" accent="#10B981">
          <p>
            Temperature and humidity values are <strong>never perfectly stable</strong>. This
            happens because:
          </p>
          <div className="space-y-1.5 pl-1">
            <Pill color="#10B981">The environment is always changing slightly</Pill>
            <Pill color="#10B981">Air movement affects readings</Pill>
            <Pill color="#10B981">Heat sources affect temperature</Pill>
            <Pill color="#10B981">Humidity varies naturally</Pill>
          </div>
          <Callout icon="🧪" bg="#F0FDF4" border="#86EFAC" text="#166534">
            So even if nothing seems to change, the sensor may still show small variations —
            that's totally normal!
          </Callout>
          <div className="rounded-xl overflow-hidden border border-gray-100 shadow-sm">
            <img src="/lecs/3.3.png" alt="Why values change over time" className="w-full object-contain" />
          </div>
          <button
            type="button"
            onClick={() => mark(3)}
            className={`text-xs px-3 py-1.5 rounded-full border transition-all mt-1 ${
              progress.has(3)
                ? 'bg-green-500 text-white border-green-500'
                : 'text-gray-400 border-gray-300 hover:border-green-400 hover:text-green-600'
            }`}
          >
            {progress.has(3) ? '✓ Got it!' : 'Mark as read'}
          </button>
        </Section>

        {/* 3.4 */}
        <Section number="3.4" title="Understanding Real-World Input" icon="🔀" accent="#EF4444">
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl bg-gray-50 border border-gray-200 p-4 text-center">
              <p className="text-xs uppercase tracking-wide font-bold text-gray-400 mb-2">Before</p>
              <span className="text-3xl">🎮</span>
              <p className="text-sm font-semibold text-gray-600 mt-2">You controlled the input manually</p>
            </div>
            <div className="rounded-xl bg-blue-50 border border-blue-200 p-4 text-center">
              <p className="text-xs uppercase tracking-wide font-bold text-blue-400 mb-2">Now</p>
              <span className="text-3xl">🌿</span>
              <p className="text-sm font-semibold text-blue-700 mt-2">The environment controls the input</p>
            </div>
          </div>
          <Callout icon="🚀" bg="#FEF2F2" border="#FECACA" text="#991B1B">
            This is a <strong>major shift</strong>. The system is no longer just reacting to user
            input — it is reacting to <em>real conditions</em>.
          </Callout>
          <div className="rounded-xl overflow-hidden border border-gray-100 shadow-sm">
            <img src="/lecs/3.4.png" alt="Real-world input diagram" className="w-full object-contain" />
          </div>
          <button
            type="button"
            onClick={() => mark(4)}
            className={`text-xs px-3 py-1.5 rounded-full border transition-all mt-1 ${
              progress.has(4)
                ? 'bg-green-500 text-white border-green-500'
                : 'text-gray-400 border-gray-300 hover:border-green-400 hover:text-green-600'
            }`}
          >
            {progress.has(4) ? '✓ Got it!' : 'Mark as read'}
          </button>
        </Section>

        {/* 3.5 */}
        <Section number="3.5" title="Why Sensors Are Important" icon="⭐" accent="#8B5CF6">
          <p>Sensors allow systems to:</p>
          <div className="space-y-1.5 pl-1">
            <Pill color="#8B5CF6">Understand their surroundings</Pill>
            <Pill color="#8B5CF6">Make decisions based on real conditions</Pill>
            <Pill color="#8B5CF6">React to changes without human input</Pill>
          </div>
          <p className="font-semibold text-[#2E4862]">This is the foundation of all smart systems:</p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-xs">
            {[
              { icon: '🏠', label: 'Smart Homes' },
              { icon: '🌤️', label: 'Weather Stations' },
              { icon: '🏭', label: 'Industrial Monitoring' },
              { icon: '📡', label: 'IoT Devices' },
            ].map((item) => (
              <div
                key={item.label}
                className="flex flex-col items-center gap-1 rounded-xl bg-purple-50 border border-purple-100 py-3 px-2 font-medium text-purple-700"
              >
                <span className="text-2xl">{item.icon}</span>
                {item.label}
              </div>
            ))}
          </div>
          <div className="rounded-xl overflow-hidden border border-gray-100 shadow-sm">
            <img src="/lecs/3.5.png" alt="Why sensors are important" className="w-full object-contain" />
          </div>
          <button
            type="button"
            onClick={() => mark(5)}
            className={`text-xs px-3 py-1.5 rounded-full border transition-all mt-1 ${
              progress.has(5)
                ? 'bg-green-500 text-white border-green-500'
                : 'text-gray-400 border-gray-300 hover:border-green-400 hover:text-green-600'
            }`}
          >
            {progress.has(5) ? '✓ Got it!' : 'Mark as read'}
          </button>
        </Section>

        {/* 3.6 */}
        <Section number="3.6" title="How the ESP32 Reads Sensor Data" icon="⚙️" accent="#0EA5E9">
          <p>The process is simple and repeating:</p>
          <div className="flex flex-col gap-2 mt-2">
            {[
              { step: '1', label: 'Sensor measures temperature & humidity', icon: '🌡️' },
              { step: '2', label: 'Sends the data to the ESP32', icon: '📶' },
              { step: '3', label: 'ESP32 reads the values', icon: '🧠' },
              { step: '4', label: 'Values are used in your program', icon: '💻' },
            ].map(({ step, label, icon }) => (
              <div key={step} className="flex items-center gap-3 bg-sky-50 border border-sky-100 rounded-xl px-4 py-2.5">
                <span className="w-6 h-6 rounded-full bg-[#0EA5E9] text-white text-xs font-bold flex items-center justify-center flex-shrink-0">
                  {step}
                </span>
                <span className="text-base">{icon}</span>
                <span className="text-sm text-sky-800">{label}</span>
              </div>
            ))}
          </div>
          <Callout icon="🔁" bg="#F0F9FF" border="#BAE6FD" text="#0C4A6E">
            This happens <strong>repeatedly in a loop</strong>, so the system always stays updated.
          </Callout>
          <button
            type="button"
            onClick={() => mark(6)}
            className={`text-xs px-3 py-1.5 rounded-full border transition-all mt-1 ${
              progress.has(6)
                ? 'bg-green-500 text-white border-green-500'
                : 'text-gray-400 border-gray-300 hover:border-green-400 hover:text-green-600'
            }`}
          >
            {progress.has(6) ? '✓ Got it!' : 'Mark as read'}
          </button>
        </Section>

        {/* 3.7 */}
        <Section number="3.7" title="Why Serial is Important Here" icon="📟" accent="#F97316">
          <p>Since sensor values change over time, you need a way to <strong>observe</strong> them.</p>
          <p>Serial output allows you to:</p>
          <div className="space-y-1.5 pl-1">
            <Pill color="#F97316">👁️ See live data</Pill>
            <Pill color="#F97316">📉 Track changes over time</Pill>
            <Pill color="#F97316">🧠 Understand environmental behavior</Pill>
          </div>
          <Callout icon="⚠️" bg="#FFF7ED" border="#FED7AA" text="#9A3412">
            Without Serial, the data would exist but remain <strong>invisible</strong>.
          </Callout>
          <div className="rounded-xl overflow-hidden border border-gray-100 shadow-sm">
            <img src="/lecs/3.7.png" alt="Why Serial is important" className="w-full object-contain" />
          </div>
          <button
            type="button"
            onClick={() => mark(7)}
            className={`text-xs px-3 py-1.5 rounded-full border transition-all mt-1 ${
              progress.has(7)
                ? 'bg-green-500 text-white border-green-500'
                : 'text-gray-400 border-gray-300 hover:border-green-400 hover:text-green-600'
            }`}
          >
            {progress.has(7) ? '✓ Got it!' : 'Mark as read'}
          </button>
        </Section>

        {/* 3.8 */}
        <Section number="3.8" title="Understanding Real-Time Environmental Systems" icon="🌐" accent="#14B8A6">
          <p>Now your system behaves like a <strong>real monitoring device</strong>. It:</p>
          <div className="space-y-1.5 pl-1">
            <Pill color="#14B8A6">Continuously reads environmental data</Pill>
            <Pill color="#14B8A6">Updates values in real time</Pill>
            <Pill color="#14B8A6">Reflects changes in surroundings</Pill>
          </div>
          <Callout icon="🚀" bg="#F0FDFA" border="#99F6E4" text="#134E4A">
            This is the <strong>first step toward building real IoT systems</strong>.
          </Callout>
          <button
            type="button"
            onClick={() => mark(8)}
            className={`text-xs px-3 py-1.5 rounded-full border transition-all mt-1 ${
              progress.has(8)
                ? 'bg-green-500 text-white border-green-500'
                : 'text-gray-400 border-gray-300 hover:border-green-400 hover:text-green-600'
            }`}
          >
            {progress.has(8) ? '✓ Got it!' : 'Mark as read'}
          </button>
        </Section>

        {/* 3.9 Key Insights */}
        <Section number="3.9" title="Key Insights of This Lesson" icon="🔑" accent="#2E4862">
          <div className="space-y-2">
            {[
              'Sensors read data from the physical world',
              'DHT measures temperature and humidity',
              'Values change based on real environmental conditions',
              'The ESP32 continuously reads updated data in a loop',
              'Systems react to reality — not just user input',
            ].map((insight, i) => (
              <div
                key={i}
                className="flex items-start gap-3 bg-[#f8faff] border border-[#dbeafe] rounded-xl px-4 py-2.5"
              >
                <span className="w-5 h-5 rounded-full bg-[#2E4862] text-white text-[10px] font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                  {i + 1}
                </span>
                <span className="text-sm text-[#1e3a5f]">{insight}</span>
              </div>
            ))}
          </div>
          <button
            type="button"
            onClick={() => mark(9)}
            className={`text-xs px-3 py-1.5 rounded-full border transition-all mt-1 ${
              progress.has(9)
                ? 'bg-green-500 text-white border-green-500'
                : 'text-gray-400 border-gray-300 hover:border-green-400 hover:text-green-600'
            }`}
          >
            {progress.has(9) ? '✓ Got it!' : 'Mark as read'}
          </button>
        </Section>

        {/* ── Mini Quiz ── */}
        <div className="rounded-2xl border border-indigo-100 bg-white shadow-sm p-5">
          <MiniQuiz
            questions={[
              {
                question: 'What does a sensor do?',
                options: [
                  'It stores data in memory',
                  'It reads information from the physical world and converts it for the ESP32',
                  'It sends Wi-Fi signals',
                  'It displays data on a screen',
                ],
                correct: 1,
                explanation:
                  'A sensor converts real-world physical data (like temperature) into signals the ESP32 can read and use in code.',
              },
              {
                question: 'Why do sensor values keep changing even when nothing seems different?',
                options: [
                  'Because the ESP32 has a bug',
                  'Because sensors only work sometimes',
                  'Because the environment is always changing slightly',
                  'Because the battery is low',
                ],
                correct: 2,
                explanation:
                  'The environment never stands perfectly still — air moves, heat shifts, humidity varies. Sensors pick up all of this.',
              },
              {
                question: 'What does Serial output help you do with sensor data?',
                options: [
                  'Delete the data permanently',
                  'See live data and track changes over time',
                  'Send data to another country',
                  'Make the sensor stop measuring',
                ],
                correct: 1,
                explanation:
                  'Without Serial, the data exists inside the ESP32 but you have no way to see it. Serial makes it visible.',
              },
            ]}
          />
        </div>

        {/* Completion banner */}
        {progress.size === total && (
          <div className="rounded-2xl bg-gradient-to-r from-green-400 to-emerald-500 p-6 text-white text-center shadow-lg animate-fadeIn">
            <div className="text-4xl mb-2">🎉</div>
            <h2 className="text-xl font-extrabold">Section Complete!</h2>
            <p className="text-sm text-green-100 mt-1">
              You've read all 9 sections. Click <strong>Next →</strong> to continue.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
