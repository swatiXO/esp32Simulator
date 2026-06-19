'use client';

import { useEffect, useState, useCallback } from 'react';
import CertificateCanvas, { type CertificateFields } from '@/components/CertificateCanvas';

/* ════════════════════════════════════════════════════════════════════════
   BUILD MIND — CERTIFICATE PAGE   (src/app/certificate/page.tsx)
   States:
     loading  -> checking
     locked   -> show remaining lessons/activities
     eligible -> show the school/class form, then issue
     issued   -> render the certificate with download
   All gating is server-verified by /api/certificate.
   ════════════════════════════════════════════════════════════════════════ */

const BG = '#04080f';
const CARD = '#0f1c30';
const LINE = 'rgba(255,255,255,0.08)';
const TEXT = '#eaf0fa';
const MUTED = 'rgba(234,240,250,0.55)';
const FAINT = 'rgba(234,240,250,0.35)';
const BLUE = '#3b82f6';
const GREEN = '#10b981';
const GREEN_LT = '#34d399';
const SANS = '"Space Grotesk",sans-serif';
const MONO = '"JetBrains Mono",monospace';

type Eligibility = {
  eligible: boolean; missingLessons: string[]; missingActivities: string[];
  totalLessons: number; totalActivities: number; doneLessons: number; doneActivities: number;
};
type CertRow = {
  recipient_name: string; school: string; class: string; program: string;
  certificate_code: string; issued_at: string;
};
type Status = 'loading' | 'locked' | 'eligible' | 'issued' | 'error';

function fmtDate(iso: string): string {
  try { return new Date(iso).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }); }
  catch { return iso; }
}

export default function CertificatePage() {
  const [status, setStatus] = useState<Status>('loading');
  const [eligibility, setEligibility] = useState<Eligibility | null>(null);
  const [cert, setCert] = useState<CertRow | null>(null);
  const [school, setSchool] = useState('');
  const [klass, setKlass] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [formErr, setFormErr] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch('/api/certificate');
      if (!res.ok) { setStatus('error'); return; }
      const data = await res.json();
      if (data.status === 'issued') { setCert(data.certificate); setStatus('issued'); }
      else if (data.status === 'eligible') { setEligibility(data.eligibility); setStatus('eligible'); }
      else { setEligibility(data.eligibility); setStatus('locked'); }
    } catch { setStatus('error'); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const submit = useCallback(async () => {
    if (!school.trim() || !klass.trim()) { setFormErr('Please fill in both fields.'); return; }
    setSubmitting(true); setFormErr(null);
    try {
      const res = await fetch('/api/certificate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ school: school.trim(), class: klass.trim() }),
      });
      const data = await res.json();
      if (res.ok && data.status === 'issued') { setCert(data.certificate); setStatus('issued'); }
      else if (data.error === 'not_eligible') { setEligibility(data.eligibility); setStatus('locked'); }
      else setFormErr('Could not issue the certificate. Please try again.');
    } catch { setFormErr('Network error. Please try again.'); }
    finally { setSubmitting(false); }
  }, [school, klass]);

  const fields: CertificateFields | null = cert ? {
    name: cert.recipient_name, school: cert.school, class: cert.class,
    program: cert.program || 'Build Mind', awardedOn: fmtDate(cert.issued_at),
    certificateCode: cert.certificate_code,
  } : null;

  return (
    <main style={{ minHeight: '100vh', background: BG, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 24, fontFamily: '"Inter",system-ui,sans-serif' }}>
      <link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;700&display=swap" rel="stylesheet" />

      {status === 'loading' && (
        <p style={{ color: MUTED, fontFamily: MONO, fontSize: 13 }}>Checking your progress…</p>
      )}

      {status === 'error' && (
        <p style={{ color: '#fca5a5', fontFamily: MONO, fontSize: 13 }}>Something went wrong. Please refresh.</p>
      )}

      {status === 'locked' && eligibility && (
        <div style={card()}>
          <Badge tone={BLUE}>Almost there</Badge>
          <h1 style={h1()}>Your certificate is locked</h1>
          <p style={{ fontSize: 13.5, color: MUTED, lineHeight: 1.6, margin: '8px 0 18px' }}>
            Finish every lesson and activity to unlock your Build Mind Certificate of Completion.
          </p>
          <Progress label="Lessons" done={eligibility.doneLessons} total={eligibility.totalLessons} />
          <Progress label="Activities" done={eligibility.doneActivities} total={eligibility.totalActivities} />
        </div>
      )}

      {status === 'eligible' && (
        <div style={card()}>
          <Badge tone={GREEN}>Eligible</Badge>
          <h1 style={h1()}>Claim your certificate</h1>
          <p style={{ fontSize: 13.5, color: MUTED, lineHeight: 1.6, margin: '8px 0 18px' }}>
            You finished everything. Enter your details to generate your certificate. These cannot be changed once issued, so please check carefully.
          </p>
          <Field label="School" value={school} onChange={setSchool} placeholder="Your school name" max={80} />
          <Field label="Class" value={klass} onChange={setKlass} placeholder="e.g. Class 8" max={40} />
          {formErr && <p style={{ color: '#fca5a5', fontSize: 12.5, margin: '4px 0 0' }}>{formErr}</p>}
          <button onClick={submit} disabled={submitting} style={primaryBtn(submitting)}>
            {submitting ? 'Issuing…' : 'Generate my certificate'}
          </button>
        </div>
      )}

      {status === 'issued' && fields && (
        <div style={{ width: '100%', maxWidth: 960, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 18 }}>
          <Badge tone={GREEN}>Certificate issued</Badge>
          <h1 style={{ ...h1(), textAlign: 'center' }}>Congratulations, {fields.name.split(' ')[0]}</h1>
          <CertificateCanvas fields={fields} />
          <p style={{ fontSize: 11.5, color: FAINT, fontFamily: MONO }}>Certificate ID: {fields.certificateCode}</p>
        </div>
      )}
    </main>
  );

  function card(): React.CSSProperties {
    return { width: '100%', maxWidth: 460, background: `linear-gradient(160deg,${CARD},#0a1626)`, border: `1px solid ${LINE}`, borderRadius: 20, padding: 28, boxShadow: '0 40px 90px -30px rgba(0,0,0,0.9)' };
  }
  function h1(): React.CSSProperties {
    return { fontFamily: SANS, fontSize: 22, fontWeight: 700, color: TEXT, margin: 0, letterSpacing: -0.3 };
  }
}

function Badge({ tone, children }: { tone: string; children: React.ReactNode }) {
  return <span style={{ display: 'inline-block', fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: tone, background: `${tone}1f`, border: `1px solid ${tone}55`, borderRadius: 99, padding: '5px 12px', marginBottom: 14, fontFamily: MONO }}>{children}</span>;
}

function Progress({ label, done, total }: { label: string; done: number; total: number }) {
  const pct = total > 0 ? Math.round((done / total) * 100) : 0;
  const complete = done >= total && total > 0;
  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
        <span style={{ fontSize: 12, color: MUTED, fontWeight: 600 }}>{label}</span>
        <span style={{ fontSize: 12, fontFamily: MONO, color: complete ? GREEN_LT : FAINT }}>{done}/{total}</span>
      </div>
      <div style={{ height: 7, borderRadius: 99, background: 'rgba(255,255,255,0.06)', overflow: 'hidden' }}>
        <div style={{ width: `${pct}%`, height: '100%', borderRadius: 99, background: complete ? GREEN : BLUE, transition: 'width .4s' }} />
      </div>
    </div>
  );
}

function Field({ label, value, onChange, placeholder, max }: { label: string; value: string; onChange: (v: string) => void; placeholder: string; max: number }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <label style={{ display: 'block', fontSize: 10, fontWeight: 700, color: FAINT, textTransform: 'uppercase', letterSpacing: '0.1em', fontFamily: MONO, marginBottom: 7 }}>{label}</label>
      <input
        value={value} maxLength={max}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        style={{ width: '100%', boxSizing: 'border-box', background: 'rgba(0,0,0,0.3)', border: `1px solid ${LINE}`, borderRadius: 11, padding: '12px 14px', color: '#fff', fontFamily: 'Inter, sans-serif', fontSize: 14, outline: 'none' }}
      />
    </div>
  );
}

function primaryBtn(loading: boolean): React.CSSProperties {
  return { width: '100%', marginTop: 6, padding: '13px', borderRadius: 12, border: 'none', cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.6 : 1, color: '#fff', fontFamily: SANS, fontSize: 14, fontWeight: 700, background: 'linear-gradient(135deg,#065f46,#10b981)', boxShadow: '0 12px 28px -10px rgba(16,185,129,0.5)' };
}