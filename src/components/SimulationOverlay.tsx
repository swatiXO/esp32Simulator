'use client';

import React from 'react';
import type { Block } from '@/types';
import { BLOCK_COLOURS } from '@/lib/blockCatalogue';

const BG = '#04080f';
const PANEL = '#0a1422';
const CARD = '#0f1c30';
const LINE = 'rgba(255,255,255,0.08)';
const LINE_S = 'rgba(255,255,255,0.05)';
const TEXT = '#f0f4ff';
const MUTED = 'rgba(240,244,255,0.55)';
const FAINT = 'rgba(240,244,255,0.3)';
const GREEN = '#10b981';
const GREEN_LT = '#34d399';
const BLUE = '#3b82f6';
const SANS = '"Space Grotesk",sans-serif';
const INTER = '"Inter",system-ui,sans-serif';
const MONO = '"JetBrains Mono",monospace';

interface SimulationOverlayProps {
  isOpen: boolean;
  onContinue: () => void;
  blocks: Block[];
  title?: string;
  children: React.ReactNode;
}

export default function SimulationOverlay({
  isOpen,
  onContinue,
  blocks,
  title = 'See what your code does on the hardware',
  children,
}: SimulationOverlayProps) {
  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 50,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(6px)',
      animation: 'so-fade .2s ease both',
    }}>
      <style>{`
        @keyframes so-fade { from{opacity:0} to{opacity:1} }
        @keyframes so-rise { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:none} }
      `}</style>

      <div style={{
        position: 'relative', width: '90vw', maxWidth: 1024, maxHeight: '85vh',
        background: BG, borderRadius: 18, border: `1px solid ${LINE}`,
        boxShadow: '0 24px 70px rgba(0,0,0,0.6)',
        display: 'flex', flexDirection: 'column', overflow: 'hidden',
        animation: 'so-rise .3s cubic-bezier(0.16,1,0.3,1) both',
      }}>

        {/* Header */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          background: PANEL, borderBottom: `1px solid ${LINE}`, padding: '16px 22px', flexShrink: 0,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 11 }}>
            <span style={{
              width: 34, height: 34, borderRadius: 10, flexShrink: 0,
              background: 'rgba(16,185,129,0.14)', color: GREEN,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M4 12l5 5L20 6" /></svg>
            </span>
            <div>
              <h2 style={{ margin: '0 0 2px', fontSize: 15, fontWeight: 700, color: TEXT, fontFamily: SANS }}>Challenge Complete!</h2>
              <p style={{ margin: 0, fontSize: 11.5, color: MUTED, fontFamily: INTER }}>{title}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onContinue}
            onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = `0 8px 22px -6px ${BLUE}99`; }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = `0 4px 16px -6px ${BLUE}80`; }}
            style={{
              display: 'flex', alignItems: 'center', gap: 7,
              background: `linear-gradient(135deg,#1a3a8a,${BLUE})`, color: '#fff',
              fontSize: 13, fontWeight: 700, fontFamily: SANS,
              padding: '9px 20px', borderRadius: 10, border: 'none', cursor: 'pointer',
              boxShadow: `0 4px 16px -6px ${BLUE}80`, transition: 'transform .15s, box-shadow .15s',
            }}
          >
            Continue
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7" /></svg>
          </button>
        </div>

        {/* Body */}
        <div style={{ display: 'flex', flex: 1, gap: 16, padding: 20, overflow: 'hidden' }}>

          {/* Left: read-only blocks */}
          <div style={{ width: 220, flexShrink: 0, display: 'flex', flexDirection: 'column' }}>
            <p style={{
              margin: '0 0 10px', padding: '0 4px',
              fontSize: 9.5, fontWeight: 700, color: FAINT, fontFamily: MONO,
              textTransform: 'uppercase', letterSpacing: '0.12em',
            }}>
              Your Solution
            </p>
            <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 6 }}>
              {blocks.map((block) => {
                const colour = BLOCK_COLOURS[block.type] ?? '#64748b';
                const isHex = typeof colour === 'string' && colour.startsWith('#');
                return (
                  <div
                    key={block.id}
                    className={isHex ? undefined : colour}
                    style={{
                      ...(isHex ? { background: colour } : {}),
                      color: '#fff', padding: '9px 12px', borderRadius: 11,
                      fontSize: 12, fontWeight: 600, fontFamily: SANS,
                      display: 'flex', alignItems: 'center', gap: 8,
                    }}
                  >
                    <span>{block.icon}</span>
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {block.label.replace(/<[^>]+>/g, '…')}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Divider */}
          <div style={{ width: 1, background: LINE, flexShrink: 0 }} />

          {/* Right: simulation */}
          <div style={{ flex: 1, overflowY: 'auto' }}>
            {children}
          </div>

        </div>
      </div>
    </div>
  );
}