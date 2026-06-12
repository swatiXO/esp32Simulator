'use client';

import React from 'react';
import { PROJECT_TEMPLATES, type ProjectTemplate } from '@/lib/projectTemplates';
import { useAppStore } from '@/store/useAppStore';

/* ── Design tokens ── */
const PANEL    = '#0A1422';
const CARD     = '#0F1C30';
const LINE     = 'rgba(255,255,255,0.08)';
const TEXT     = '#EAF0FA';
const MUTED    = 'rgba(234,240,250,0.55)';
const FAINT    = 'rgba(234,240,250,0.35)';
const BLUE     = '#3B82F6';
const BLUE_LT  = '#93C5FD';
const AMBER    = '#F59E0B';
const GREEN    = '#10B981';
const GREEN_LT = '#34D399';
const VIOLET   = '#8B5CF6';
const SANS     = '"Space Grotesk",system-ui,sans-serif';
const INTER    = '"Inter",system-ui,sans-serif';
const MONO     = '"JetBrains Mono",monospace';

/* ── Per-template visual config ── */
type TemplateVisual = {
  color: string;
  bg: string;
  border: string;
  icon: React.ReactNode;
};

const TEMPLATE_VISUALS: Record<string, TemplateVisual> = {
  blink_led: {
    color: AMBER, bg: 'rgba(245,158,11,0.08)', border: 'rgba(245,158,11,0.2)',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="4" fill="currentColor" fillOpacity="0.3"/>
        <path d="M12 2v2M12 20v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M2 12h2M20 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/>
      </svg>
    ),
  },
  read_temperature: {
    color: '#38bdf8', bg: 'rgba(56,189,248,0.08)', border: 'rgba(56,189,248,0.2)',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 14.76V3.5a2.5 2.5 0 0 0-5 0v11.26a4.5 4.5 0 1 0 5 0z"/>
      </svg>
    ),
  },
  wifi_connect: {
    color: BLUE, bg: 'rgba(59,130,246,0.08)', border: 'rgba(59,130,246,0.2)',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M5 12.55a11 11 0 0 1 14.08 0"/>
        <path d="M1.42 9a16 16 0 0 1 21.16 0"/>
        <path d="M8.53 16.11a6 6 0 0 1 6.95 0"/>
        <circle cx="12" cy="20" r="1" fill="currentColor"/>
      </svg>
    ),
  },
  mqtt_temp: {
    color: VIOLET, bg: 'rgba(139,92,246,0.08)', border: 'rgba(139,92,246,0.2)',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M22 12h-4l-3 9L9 3l-3 9H2"/>
      </svg>
    ),
  },
  button_led: {
    color: GREEN, bg: 'rgba(16,185,129,0.08)', border: 'rgba(16,185,129,0.2)',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="9"/>
        <circle cx="12" cy="12" r="3" fill="currentColor" fillOpacity="0.4"/>
      </svg>
    ),
  },
  distance_meter: {
    color: '#f97316', bg: 'rgba(249,115,22,0.08)', border: 'rgba(249,115,22,0.2)',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
        <path d="M9 22V12h6v10"/>
      </svg>
    ),
  },
};

const DEFAULT_VISUAL: TemplateVisual = {
  color: BLUE_LT, bg: 'rgba(59,130,246,0.08)', border: 'rgba(59,130,246,0.2)',
  icon: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7" rx="1"/>
      <rect x="14" y="3" width="7" height="7" rx="1"/>
      <rect x="3" y="14" width="7" height="7" rx="1"/>
      <rect x="14" y="14" width="7" height="7" rx="1"/>
    </svg>
  ),
};

const getVisual = (id: string): TemplateVisual =>
  TEMPLATE_VISUALS[id] ?? DEFAULT_VISUAL;

/* ── Icons ── */
const IcoClose = () => (
  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true">
    <path d="M18 6 6 18M6 6l12 12"/>
  </svg>
);
const IcoCheck = () => (
  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" aria-hidden="true">
    <polyline points="20 6 9 17 4 12"/>
  </svg>
);
const IcoArrow = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M5 12h14M12 5l7 7-7 7"/>
  </svg>
);
const IcoWarn = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z"/>
    <path d="M12 9v4M12 17h.01"/>
  </svg>
);

interface TemplatesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

/* ── Template card ── */
const TemplateCard = React.memo(function TemplateCard({
  template, isLoaded, onLoad,
}: {
  template: ProjectTemplate;
  isLoaded: boolean;
  onLoad: () => void;
}) {
  const [hovered, setHovered] = React.useState(false);
  const v = getVisual(template.id);
  const primaryTag = template.tags?.[0];

  return (
    <button
      type="button"
      onClick={onLoad}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: 'flex', flexDirection: 'column',
        padding: 0, borderRadius: 16, textAlign: 'left',
        cursor: 'pointer', width: '100%', overflow: 'hidden',
        background: CARD,
        border: `1px solid ${hovered ? v.color + '55' : LINE}`,
        transition: 'transform 0.2s cubic-bezier(0.16,1,0.3,1), border-color 0.2s, box-shadow 0.2s',
        transform: hovered ? 'translateY(-3px)' : 'none',
        boxShadow: hovered ? `0 14px 36px rgba(0,0,0,0.5), 0 0 0 1px ${v.color}25` : 'none',
        position: 'relative',
      }}
    >
      {/* Left accent rail */}
      <span style={{
        position: 'absolute', left: 0, top: 0, bottom: 0, width: 3,
        background: v.color,
        opacity: hovered ? 0.9 : 0.35,
        transition: 'opacity 0.2s',
      }}/>

      <div style={{ padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: 12, height: '100%' }}>
        {/* Header: icon + title */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{
            width: 42, height: 42, borderRadius: 12, flexShrink: 0,
            background: v.bg, border: `1px solid ${v.border}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: v.color,
            transition: 'box-shadow 0.2s',
            boxShadow: hovered ? `0 0 18px ${v.color}35` : 'none',
          }}>
            {v.icon}
          </span>
          <div style={{ minWidth: 0, flex: 1 }}>
            <h3 style={{
              margin: 0, fontSize: 14.5, fontWeight: 700,
              color: TEXT, fontFamily: SANS, lineHeight: 1.25,
              whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
            }}>
              {template.title}
            </h3>
            {primaryTag && (
              <span style={{
                display: 'block', marginTop: 2,
                fontSize: 9.5, fontWeight: 700, fontFamily: INTER,
                letterSpacing: '0.1em', textTransform: 'uppercase',
                color: v.color, opacity: 0.85,
              }}>
                {primaryTag}
              </span>
            )}
          </div>
        </div>

        {/* Description — clamped to 2 clean lines */}
        <p style={{
          margin: 0, fontSize: 12, color: MUTED,
          fontFamily: INTER, lineHeight: 1.6,
          display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
          overflow: 'hidden',
        }}>
          {template.description}
        </p>

        {/* Component chips */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginTop: 'auto' }}>
          {template.components.map(c => (
            <span key={c} style={{
              padding: '2px 9px', borderRadius: 6,
              fontSize: 10, fontWeight: 600, fontFamily: MONO,
              background: v.bg, border: `1px solid ${v.border}`, color: v.color,
            }}>
              {c}
            </span>
          ))}
        </div>

        {/* Footer */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          paddingTop: 11, borderTop: `1px solid ${LINE}`,
        }}>
          <span style={{ fontSize: 10, color: FAINT, fontFamily: INTER }}>
            {template.blocks.length} blocks
          </span>
          {isLoaded ? (
            <span style={{
              display: 'inline-flex', alignItems: 'center', gap: 5,
              padding: '3px 10px', borderRadius: 99,
              fontSize: 10, fontWeight: 700, fontFamily: INTER,
              background: 'rgba(16,185,129,0.14)', border: '1px solid rgba(16,185,129,0.28)',
              color: GREEN_LT,
            }}>
              <IcoCheck /> Loaded
            </span>
          ) : (
            <span style={{
              display: 'inline-flex', alignItems: 'center', gap: 5,
              fontSize: 11, fontWeight: 700, fontFamily: SANS,
              color: hovered ? v.color : FAINT, transition: 'color 0.15s',
            }}>
              Use template <IcoArrow />
            </span>
          )}
        </div>
      </div>
    </button>
  );
});

export default function TemplatesModal({ isOpen, onClose }: TemplatesModalProps) {
  const blocks      = useAppStore((s) => s.blocks);
  const addBlock    = useAppStore((s) => s.addBlock);
  const clearBlocks = useAppStore((s) => s.clearBlocks);

  const [loadedTemplateId, setLoadedTemplateId] = React.useState<string | null>(null);
  const [pendingTemplate, setPendingTemplate]   = React.useState<ProjectTemplate | null>(null);

  /* actual load: clear + add blocks */
  const loadTemplate = React.useCallback((template: ProjectTemplate) => {
    clearBlocks();
    template.blocks.forEach(block => addBlock(block));
    setLoadedTemplateId(template.id);
    window.setTimeout(() => setLoadedTemplateId(null), 1200);
    setPendingTemplate(null);
    onClose();
  }, [clearBlocks, addBlock, onClose]);

  /* on click: confirm if blocks exist, else load directly */
  const handleLoad = React.useCallback((template: ProjectTemplate) => {
    if (blocks.length > 0) {
      setPendingTemplate(template);
      return;
    }
    loadTemplate(template);
  }, [blocks.length, loadTemplate]);

  /* Escape closes; body-scroll lock while open */
  React.useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      if (pendingTemplate) setPendingTemplate(null);
      else onClose();
    };
    window.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [isOpen, pendingTemplate, onClose]);

  if (!isOpen) return null;

  return (
    <>
      <style suppressHydrationWarning>{`
        @keyframes tm-in {
          from { opacity:0; transform:scale(0.96) translateY(12px); }
          to   { opacity:1; transform:scale(1)    translateY(0);    }
        }
        .tm-scroll::-webkit-scrollbar { width:3px; }
        .tm-scroll::-webkit-scrollbar-track { background:transparent; }
        .tm-scroll::-webkit-scrollbar-thumb { background:rgba(59,130,246,0.2); border-radius:99px; }
        .tm-close {
          width:30px; height:30px; border-radius:8px;
          border:1px solid ${LINE}; background:rgba(255,255,255,0.04);
          display:flex; align-items:center; justify-content:center;
          cursor:pointer; color:${MUTED}; transition:all .15s; flex-shrink:0;
        }
        .tm-close:hover { background:rgba(239,68,68,0.12); color:#fca5a5; border-color:rgba(239,68,68,0.2); }
        @media (max-width: 560px) { .tm-grid { grid-template-columns: 1fr !important; } }
      `}</style>

      {/* Backdrop */}
      <div
        onClick={onClose}
        role="dialog"
        aria-modal="true"
        aria-label="Starter templates"
        style={{
          position: 'fixed', inset: 0, zIndex: 50,
          background: 'rgba(0,0,0,0.78)',
          backdropFilter: 'blur(10px)', WebkitBackdropFilter: 'blur(10px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: '0 16px',
        }}
      >
        {/* Modal */}
        <div
          onClick={e => e.stopPropagation()}
          style={{
            position: 'relative',
            width: '100%', maxWidth: 720, maxHeight: '92vh',
            borderRadius: 22, background: PANEL, border: `1px solid ${LINE}`,
            boxShadow: '0 40px 100px rgba(0,0,0,0.9), 0 0 0 1px rgba(59,130,246,0.07)',
            display: 'flex', flexDirection: 'column', overflow: 'hidden',
            animation: 'tm-in 0.24s cubic-bezier(0.16,1,0.3,1)',
          }}
        >
          {/* Top accent */}
          <div style={{ height: 3, flexShrink: 0, background: `linear-gradient(90deg,${BLUE},${VIOLET} 50%,${AMBER})` }}/>

          {/* Header */}
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '20px 22px 18px', flexShrink: 0, borderBottom: `1px solid ${LINE}`,
          }}>
            <div>
              <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: TEXT, fontFamily: SANS, lineHeight: 1.2 }}>
                Starter Templates
              </h2>
              <p style={{ margin: '4px 0 0', fontSize: 12.5, color: MUTED, fontFamily: INTER }}>
                Pick a ready-made project and start building right away
              </p>
            </div>
            <button type="button" onClick={onClose} className="tm-close" aria-label="Close templates">
              <IcoClose />
            </button>
          </div>

          {/* Grid */}
          <div
            className="tm-scroll tm-grid"
            style={{
              flex: 1, overflowY: 'auto', padding: '18px',
              display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 14,
              alignContent: 'start', alignItems: 'stretch',
            }}
          >
            {PROJECT_TEMPLATES.map(template => (
              <TemplateCard
                key={template.id}
                template={template}
                isLoaded={loadedTemplateId === template.id}
                onLoad={() => handleLoad(template)}
              />
            ))}
          </div>

          {/* Footer */}
          <div style={{
            padding: '12px 22px 16px', flexShrink: 0, borderTop: `1px solid ${LINE}`,
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          }}>
            <span style={{ fontSize: 11, color: FAINT, fontFamily: INTER }}>
              {PROJECT_TEMPLATES.length} templates available
            </span>
            <span style={{ fontSize: 11, color: FAINT, fontFamily: INTER }}>
              Click any card to load it
            </span>
          </div>

          {/* Replace-blocks confirm */}
          {pendingTemplate && (
            <div
              onClick={() => setPendingTemplate(null)}
              style={{
                position: 'absolute', inset: 0, zIndex: 5,
                background: 'rgba(4,8,15,0.82)',
                backdropFilter: 'blur(4px)', WebkitBackdropFilter: 'blur(4px)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20,
              }}
            >
              <div
                onClick={e => e.stopPropagation()}
                role="alertdialog"
                aria-modal="true"
                aria-label="Replace current blocks"
                style={{
                  width: '100%', maxWidth: 340, borderRadius: 16,
                  background: CARD, border: `1px solid ${LINE}`,
                  boxShadow: '0 24px 60px rgba(0,0,0,0.7)',
                  padding: 22, textAlign: 'center',
                  animation: 'tm-in 0.2s cubic-bezier(0.16,1,0.3,1)',
                }}
              >
                <span style={{
                  width: 44, height: 44, margin: '0 auto 14px', borderRadius: 12,
                  background: 'rgba(245,158,11,0.12)', border: '1px solid rgba(245,158,11,0.25)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', color: AMBER,
                }}>
                  <IcoWarn />
                </span>
                <h3 style={{ margin: '0 0 6px', fontSize: 15, fontWeight: 700, color: TEXT, fontFamily: SANS }}>
                  Replace current blocks?
                </h3>
                <p style={{ margin: '0 0 18px', fontSize: 12.5, color: MUTED, fontFamily: INTER, lineHeight: 1.6 }}>
                  Loading “{pendingTemplate.title}” clears your current blocks. This can’t be undone.
                </p>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button
                    type="button"
                    onClick={() => setPendingTemplate(null)}
                    style={{
                      flex: 1, padding: '10px', borderRadius: 10, cursor: 'pointer',
                      background: 'rgba(255,255,255,0.04)', border: `1px solid ${LINE}`,
                      color: MUTED, fontSize: 12.5, fontWeight: 700, fontFamily: SANS,
                    }}
                  >
                    Keep mine
                  </button>
                  <button
                    type="button"
                    onClick={() => loadTemplate(pendingTemplate)}
                    style={{
                      flex: 1, padding: '10px', borderRadius: 10, cursor: 'pointer', border: 'none',
                      background: `linear-gradient(135deg,#92400e,${AMBER})`,
                      color: '#1a0f00', fontSize: 12.5, fontWeight: 800, fontFamily: SANS,
                    }}
                  >
                    Replace
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}