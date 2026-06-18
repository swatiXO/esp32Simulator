'use client';

import { useEffect, useRef, useState, useCallback } from 'react';

/* ════════════════════════════════════════════════════════════════════════
   BUILD MIND — CERTIFICATE CANVAS
   Draws the template PNG and overlays the dynamic fields at the exact blank
   positions, then offers PNG / PDF download. Coordinates are fractions of the
   template (4218 x 3007) so it stays correct at any output scale.
   ════════════════════════════════════════════════════════════════════════ */

const TEMPLATE_SRC = '/certificate/template.png'; // put the uploaded PNG here in /public/certificate/
const TPL_W = 4218;
const TPL_H = 3007;
const NAVY = '#16345c';
const INK = '#1f2937';

// Field anchors (fractions of template W/H), verified against the template's
// blank underlines. yf is the underline; text baseline is lifted above it.
const LIFT = 0.012; // fraction of H to raise the baseline above the line
const POS = {
  name:       { xf: 0.500, yf: 0.574, size: 92, color: NAVY, weight: '700', align: 'center' as const, font: 'Inter, system-ui, sans-serif' },
  school:     { xf: 0.341, yf: 0.651, size: 40, color: INK,  weight: '500', align: 'center' as const, font: 'Inter, system-ui, sans-serif' },
  klass:      { xf: 0.594, yf: 0.651, size: 40, color: INK,  weight: '500', align: 'center' as const, font: 'Inter, system-ui, sans-serif' },
  program:    { xf: 0.244, yf: 0.727, size: 46, color: NAVY, weight: '700', align: 'left' as const,  font: 'Inter, system-ui, sans-serif' },
  awardedOn:  { xf: 0.369, yf: 0.947, size: 38, color: INK,  weight: '500', align: 'center' as const, font: '"Courier New", monospace' },
  certId:     { xf: 0.626, yf: 0.947, size: 38, color: INK,  weight: '700', align: 'center' as const, font: '"Courier New", monospace' },
};

// Cover box over the printed "Media Mind" on line 3, so we can write "Build Mind".
const COVER = { xf: 0.238, yf: 0.700, wf: 0.089, hf: 0.030 };

export type CertificateFields = {
  name: string;
  school: string;
  class: string;
  program: string;       // "Build Mind"
  awardedOn: string;     // preformatted date string
  certificateCode: string;
};

export default function CertificateCanvas({ fields }: { fields: CertificateFields }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [ready, setReady] = useState(false);
  const [err, setErr] = useState(false);

  const draw = useCallback((img: HTMLImageElement) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.width = TPL_W;
    canvas.height = TPL_H;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.drawImage(img, 0, 0, TPL_W, TPL_H);

    // paint over the printed "Media Mind" then write the program name
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(COVER.xf * TPL_W, COVER.yf * TPL_H, COVER.wf * TPL_W, COVER.hf * TPL_H);

    const put = (text: string, p: typeof POS[keyof typeof POS]) => {
      ctx.fillStyle = p.color;
      ctx.font = `${p.weight} ${p.size}px ${p.font}`;
      ctx.textAlign = p.align;
      ctx.textBaseline = 'alphabetic';
      ctx.fillText(text, p.xf * TPL_W, p.yf * TPL_H - LIFT * TPL_H);
    };

    put(fields.name, POS.name);
    put(fields.school, POS.school);
    put(fields.class, POS.klass);
    put(fields.program, POS.program);
    put(fields.awardedOn, POS.awardedOn);
    put(fields.certificateCode, POS.certId);

    setReady(true);
  }, [fields]);

  useEffect(() => {
    let alive = true;
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => { if (alive) draw(img); };
    img.onerror = () => { if (alive) setErr(true); };
    img.src = TEMPLATE_SRC;
    return () => { alive = false; };
  }, [draw]);

  const downloadPNG = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const a = document.createElement('a');
    a.download = `BuildMind-Certificate-${fields.certificateCode}.png`;
    a.href = canvas.toDataURL('image/png');
    a.click();
  }, [fields.certificateCode]);

  const downloadPDF = useCallback(async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    // lazy-load jsPDF only when needed (keeps it out of the main bundle)
    const jsPDFModule = await import('jspdf' as any);
    const jsPDF = jsPDFModule.jsPDF;
    const pdf = new jsPDF({ orientation: 'landscape', unit: 'px', format: [TPL_W, TPL_H] });
    pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, 0, TPL_W, TPL_H);
    pdf.save(`BuildMind-Certificate-${fields.certificateCode}.pdf`);
  }, [fields.certificateCode]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, alignItems: 'center' }}>
      <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />

      {err ? (
        <div style={{ color: '#fca5a5', fontFamily: 'Inter, sans-serif', fontSize: 14 }}>
          Could not load the certificate template. Make sure it is at <code>/public{TEMPLATE_SRC}</code>.
        </div>
      ) : (
        <div style={{ width: '100%', maxWidth: 900, borderRadius: 16, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.08)', boxShadow: '0 30px 70px -30px rgba(0,0,0,0.8)' }}>
          <canvas ref={canvasRef} style={{ width: '100%', height: 'auto', display: 'block' }} />
        </div>
      )}

      {ready && !err && (
        <div style={{ display: 'flex', gap: 12 }}>
          <button onClick={downloadPNG} style={btn('linear-gradient(135deg,#1a3a8a,#2563eb)')}>Download PNG</button>
          <button onClick={downloadPDF} style={btn('linear-gradient(135deg,#065f46,#10b981)')}>Download PDF</button>
        </div>
      )}
    </div>
  );
}

function btn(bg: string): React.CSSProperties {
  return {
    padding: '12px 22px', borderRadius: 12, border: 'none', cursor: 'pointer',
    color: '#fff', fontFamily: 'Inter, sans-serif', fontSize: 14, fontWeight: 700,
    background: bg, boxShadow: '0 10px 24px -10px rgba(0,0,0,0.6)',
  };
}