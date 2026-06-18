'use client';

import { useState, useCallback, type SVGProps, type CSSProperties, type ReactNode } from 'react';

/* ════════════════════════════════════════════════════════════════════════
   BUILD MIND — VARIABLE MEMORY EXPLORER
   Create typed variables (int / float / string), update them, and watch the
   value change in its "memory box" with a running history. Dark-themed,
   deployment-safe (no external deps, no emojis). Logic unchanged.
   ════════════════════════════════════════════════════════════════════════ */

type VarType = 'int' | 'float' | 'string';

interface VariableBox {
  name: string;
  type: VarType;
  value: string | number;
  history: (string | number)[];
}

// ── tokens ──
const CARD = '#0f1c30';
const LINE = 'rgba(255,255,255,0.08)';
const TEXT = '#eaf0fa';
const MUTED = 'rgba(234,240,250,0.55)';
const FAINT = 'rgba(234,240,250,0.35)';
const BLUE = '#3b82f6';
const GREEN = '#10b981';
const VIOLET = '#8b5cf6';
const SANS = '"Space Grotesk",sans-serif';
const MONO = '"JetBrains Mono",monospace';

// per-type accent
const TYPE_TONE: Record<VarType, string> = { int: BLUE, float: VIOLET, string: GREEN };
const TYPE_LABEL: Record<VarType, string> = {
  int: 'Integer (whole number)',
  float: 'Decimal number',
  string: 'Text',
};

const INSIGHTS = [
  'A variable is like a labelled box. It holds one value at a time.',
  'When you update a variable, the old value is replaced by the new one.',
  'Each variable has a type: int for whole numbers, float for decimals, string for text.',
  'The program can read or change the value at any point while it runs.',
];

function hexA(hex: string, a: number): string {
  const h = hex.replace('#', '');
  const r = parseInt(h.slice(0, 2), 16), g = parseInt(h.slice(2, 4), 16), b = parseInt(h.slice(4, 6), 16);
  return `rgba(${r},${g},${b},${a})`;
}

type IconProps = SVGProps<SVGSVGElement>;
const PlusIcon = (p: IconProps) => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M12 5v14M5 12h14" /></svg>);
const ResetIcon = (p: IconProps) => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M3 12a9 9 0 1 0 9-9" /><path d="M3 4v5h5" /></svg>);
const BoxIcon = (p: IconProps) => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M21 8l-9-5-9 5 9 5 9-5zM3 8v8l9 5 9-5V8M12 13v8" /></svg>);

export default function VariableBoxExplorer() {
  const [boxes, setBoxes] = useState<VariableBox[]>([]);
  const [name, setName] = useState('counter');
  const [type, setType] = useState<VarType>('int');
  const [initVal, setInitVal] = useState('0');
  const [step, setStep] = useState('1');
  const [error, setError] = useState('');
  const [activeInsight, setActiveInsight] = useState(0);

  const handleCreate = useCallback(() => {
    const trimmed = name.trim();
    if (!trimmed) { setError('Variable needs a name.'); return; }
    if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(trimmed)) {
      setError('Name must start with a letter and contain only letters, numbers, or underscores.');
      return;
    }
    if (boxes.find((b) => b.name === trimmed)) {
      setError(`Variable "${trimmed}" already exists.`);
      return;
    }
    setError('');
    const val = type === 'string' ? initVal : type === 'int' ? Math.trunc(Number(initVal)) : Number(initVal);
    setBoxes((prev) => [...prev, { name: trimmed, type, value: val, history: [val] }]);
    setActiveInsight(0);
  }, [name, type, initVal, boxes]);

  const handleUpdate = useCallback((boxName: string) => {
    setBoxes((prev) => prev.map((b) => {
      if (b.name !== boxName) return b;
      let newVal: string | number;
      if (b.type === 'string') newVal = String(b.value) + step;
      else if (b.type === 'int') newVal = Math.trunc(Number(b.value) + Number(step));
      else newVal = Number((Number(b.value) + Number(step)).toFixed(2));
      return { ...b, value: newVal, history: [...b.history.slice(-4), newVal] };
    }));
    setActiveInsight((i) => Math.max(i, 1));
  }, [step]);

  const handleReset = useCallback((boxName: string) => {
    setBoxes((prev) => prev.map((b) =>
      b.name === boxName ? { ...b, value: b.history[0], history: [b.history[0]] } : b
    ));
  }, []);

  return (
    <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 16, fontFamily: '"Inter",system-ui,sans-serif' }}>
      <link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;700&display=swap" rel="stylesheet" />

      <style>{`
        @keyframes vb-pop{0%{transform:scale(.9);opacity:0}60%{transform:scale(1.03)}100%{transform:scale(1);opacity:1}}
        @keyframes vb-flash{0%{transform:scale(1)}40%{transform:scale(1.08)}100%{transform:scale(1)}}
        .vb-card{background:${CARD};border:1px solid ${LINE};border-radius:18px}
        .vb-box{animation:vb-pop .35s cubic-bezier(0.34,1.56,0.64,1) both}
        .vb-input{transition:border-color .2s, box-shadow .2s, background .2s}
        .vb-input:focus{border-color:${BLUE} !important; box-shadow:0 0 0 3px ${hexA(BLUE, 0.14)}; background:rgba(59,130,246,0.04) !important}
        .vb-input::placeholder{color:rgba(234,240,250,0.3)}
        .vb-btn{transition:filter .18s, transform .15s, box-shadow .2s}
        .vb-btn:hover{filter:brightness(1.08);transform:translateY(-1px)}
        .vb-btn:active{transform:scale(.97)}
        .vb-icon-btn{transition:color .15s, background .15s}
        select.vb-input option{background:#0a1626;color:#eaf0fa}
        @media (prefers-reduced-motion: reduce){ .vb-box{animation:none!important} }
      `}</style>

      {/* ── Header ── */}
      <div className="vb-card" style={{ padding: 20, position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: -40, right: -30, width: 150, height: 150, borderRadius: '50%', background: `radial-gradient(circle,${hexA(VIOLET, 0.1)},transparent 65%)`, pointerEvents: 'none' }} />
        <div style={{ position: 'relative' }}>
          <h3 style={{ fontFamily: SANS, fontSize: 15, fontWeight: 700, color: TEXT, margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
            <BoxIcon width={16} height={16} style={{ color: '#c4b5fd' }} />
            Variable Memory Explorer
          </h3>
          <p style={{ fontSize: 12, color: MUTED, margin: '7px 0 0', lineHeight: 1.55 }}>
            A variable is a <strong style={{ color: TEXT }}>named container</strong> that stores a value your program can use and update. Create one below and watch how the ESP32 stores and changes it in memory.
          </p>
        </div>
      </div>

      {/* ── Creator ── */}
      <div className="vb-card" style={{ padding: 18 }}>
        <p style={{ fontSize: 10, fontWeight: 700, color: FAINT, textTransform: 'uppercase', letterSpacing: '0.14em', fontFamily: MONO, margin: '0 0 14px' }}>Create a Variable</p>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <Field label="Name" width={130}>
            <input className="vb-input" type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="counter" style={inputStyle} />
          </Field>
          <Field label="Type" width={170}>
            <select className="vb-input" value={type} onChange={(e) => setType(e.target.value as VarType)} style={{ ...inputStyle, cursor: 'pointer' }}>
              <option value="int">int (whole number)</option>
              <option value="float">float (decimal)</option>
              <option value="string">string (text)</option>
            </select>
          </Field>
          <Field label="Starting value" width={110}>
            <input className="vb-input" type="text" value={initVal} onChange={(e) => setInitVal(e.target.value)} placeholder="0" style={inputStyle} />
          </Field>
          <Field label={type === 'string' ? 'Append text' : 'Add step'} width={90}>
            <input className="vb-input" type="text" value={step} onChange={(e) => setStep(e.target.value)} placeholder="1" style={inputStyle} />
          </Field>
          <button type="button" onClick={handleCreate} className="vb-btn" style={{
            display: 'inline-flex', alignItems: 'center', gap: 7, padding: '11px 18px', borderRadius: 11,
            fontSize: 13, fontWeight: 700, fontFamily: SANS, color: '#fff', border: 'none', cursor: 'pointer',
            background: 'linear-gradient(135deg,#1a3a8a,#2563eb)', boxShadow: `0 10px 24px -10px ${hexA(BLUE, 0.6)}`,
          }}>
            <PlusIcon width={14} height={14} /> Store
          </button>
        </div>
        {error && <p style={{ fontSize: 12, color: '#fca5a5', margin: '12px 0 0' }}>{error}</p>}
      </div>

      {/* ── Variable boxes ── */}
      {boxes.length > 0 ? (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 14 }}>
          {boxes.map((box) => {
            const tone = TYPE_TONE[box.type];
            return (
              <div key={box.name} className="vb-card vb-box" style={{ flex: '1 1 220px', minWidth: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                {/* header */}
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', padding: '11px 14px', background: hexA(tone, 0.9) }}>
                  <div>
                    <p style={{ color: '#fff', fontSize: 13, fontWeight: 800, fontFamily: MONO, margin: 0 }}>{box.name}</p>
                    <p style={{ color: 'rgba(255,255,255,0.75)', fontSize: 9.5, margin: '2px 0 0' }}>{TYPE_LABEL[box.type]}</p>
                  </div>
                  <button type="button" onClick={() => handleReset(box.name)} className="vb-icon-btn" aria-label="Reset to initial value" title="Reset to initial value" style={{ background: 'rgba(255,255,255,0.15)', border: 'none', borderRadius: 7, width: 26, height: 26, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', cursor: 'pointer' }}>
                    <ResetIcon width={13} height={13} />
                  </button>
                </div>

                {/* current value */}
                <div style={{ padding: '16px 14px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
                  <p style={{ fontSize: 9, color: FAINT, textTransform: 'uppercase', letterSpacing: '0.12em', fontFamily: MONO, margin: 0 }}>Current Value</p>
                  <div key={String(box.value)} style={{
                    width: '100%', borderRadius: 12, padding: '16px 12px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    border: `2px solid ${hexA(tone, 0.4)}`, background: hexA(tone, 0.1),
                    animation: 'vb-flash .3s ease',
                  }}>
                    <span style={{ fontSize: 26, fontWeight: 800, fontFamily: MONO, color: '#fff', wordBreak: 'break-all', textAlign: 'center', lineHeight: 1.1 }}>{String(box.value)}</span>
                  </div>
                  <p style={{ fontSize: 9.5, color: FAINT, fontStyle: 'italic', margin: 0 }}>
                    memory address <span style={{ fontFamily: MONO, color: MUTED }}>&amp;{box.name}</span>
                  </p>
                </div>

                {/* history */}
                {box.history.length > 1 && (
                  <div style={{ padding: '0 14px 12px' }}>
                    <p style={{ fontSize: 9, color: FAINT, textTransform: 'uppercase', letterSpacing: '0.1em', fontFamily: MONO, margin: '0 0 7px' }}>Value History</p>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 5, flexWrap: 'wrap' }}>
                      {box.history.map((h, i) => {
                        const last = i === box.history.length - 1;
                        return (
                          <span key={i} style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                            <span style={{ fontSize: 11, fontFamily: MONO, padding: '2px 8px', borderRadius: 6, border: `1px solid ${last ? tone : LINE}`, background: last ? hexA(tone, 0.25) : 'rgba(255,255,255,0.03)', color: last ? '#fff' : FAINT, fontWeight: last ? 700 : 400 }}>{String(h)}</span>
                            {i < box.history.length - 1 && <span style={{ color: FAINT, fontSize: 11 }}>&rarr;</span>}
                          </span>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* update */}
                <div style={{ padding: '0 14px 14px', marginTop: 'auto' }}>
                  <button type="button" onClick={() => handleUpdate(box.name)} className="vb-btn" style={{
                    width: '100%', padding: '9px', borderRadius: 10, fontSize: 12, fontWeight: 700, fontFamily: SANS,
                    color: '#fff', border: 'none', cursor: 'pointer',
                    background: `linear-gradient(135deg,${hexA(tone, 0.85)},${tone})`,
                    boxShadow: `0 8px 18px -8px ${hexA(tone, 0.6)}`,
                  }}>
                    {box.type === 'string' ? `Append "${step}"` : `Add ${step} to ${box.name}`}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="vb-card" style={{ padding: '40px 24px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, textAlign: 'center' }}>
          <div style={{ width: 48, height: 48, borderRadius: 13, background: hexA(VIOLET, 0.12), color: '#c4b5fd', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <BoxIcon width={24} height={24} />
          </div>
          <p style={{ fontSize: 13, fontWeight: 700, color: MUTED, margin: 0, fontFamily: SANS }}>No variables created yet</p>
          <p style={{ fontSize: 12, color: FAINT, margin: 0, maxWidth: 280, lineHeight: 1.5 }}>Fill in the form above and click Store to create your first variable.</p>
        </div>
      )}

      {/* ── Insights ── */}
      <div className="vb-card" style={{ padding: 20 }}>
        <p style={{ fontSize: 10, fontWeight: 700, color: FAINT, textTransform: 'uppercase', letterSpacing: '0.14em', fontFamily: MONO, margin: '0 0 12px' }}>Key Concepts</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {INSIGHTS.map((insight, i) => {
            const on = i <= activeInsight;
            return (
              <div key={i} style={{
                display: 'flex', gap: 11, alignItems: 'flex-start', borderRadius: 11, padding: '11px 13px',
                background: on ? hexA(VIOLET, 0.08) : 'rgba(255,255,255,0.02)',
                border: `1px solid ${on ? hexA(VIOLET, 0.22) : 'transparent'}`,
                opacity: on ? 1 : 0.4, transition: 'background .3s, border-color .3s, opacity .3s',
              }}>
                <span style={{ width: 18, height: 18, flexShrink: 0, marginTop: 1, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 800, fontFamily: SANS, background: on ? VIOLET : 'rgba(255,255,255,0.08)', color: on ? '#fff' : FAINT, transition: 'all .3s' }}>{i + 1}</span>
                <p style={{ fontSize: 12, lineHeight: 1.55, color: on ? TEXT : MUTED, margin: 0 }}>{insight}</p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

const inputStyle: CSSProperties = {
  width: '100%', boxSizing: 'border-box', background: 'rgba(0,0,0,0.3)',
  border: `1px solid ${LINE}`, borderRadius: 10, padding: '10px 12px',
  color: '#fff', fontFamily: 'Inter, sans-serif', fontSize: 13.5, outline: 'none',
};

function Field({ label, width, children }: { label: string; width: number; children: ReactNode }) {
  return (
    <div style={{ width }}>
      <label style={{ display: 'block', fontSize: 9, color: FAINT, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', fontFamily: MONO, marginBottom: 6 }}>{label}</label>
      {children}
    </div>
  );
}