'use client';

import { useRouter, usePathname } from 'next/navigation';
import { useEffect, useState, useCallback, useMemo } from 'react';
import type { User } from '@supabase/supabase-js';
import { createClient } from '@/utils/supabase/client';
import { useActivityStore } from '@/store/useActivityStore';


/* Pages that have a guided tour → the flagKey passed to <DashboardOnboarding />.
   Order matters only in that each is matched by prefix. */

const TOUR_KEYS = ['dashboard', 'playground'] as const;

const FONTS_HREF =
  'https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;700&display=swap';

/* ── nav config (hoisted: never re-created per render) ── */
const NAV_ITEMS = [
  { label: 'Playground', path: '/playground' },
  { label: 'Learn', path: '/learn' },
  { label: 'Activities', path: '/activities' },
  { label: 'Dashboard', path: '/dashboard' },
] as const;

/* Pages that have a guided tour → the flagKey passed to <DashboardOnboarding />.
   Order matters only in that each is matched by prefix. */

export default function Header() {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<User | null>(null);

  // createClient is memoised so the auth effect doesn't re-run every render.
  const supabase = useMemo(() => createClient(), []);

  useEffect(() => {
    let active = true;

    supabase.auth.getUser().then(({ data }) => {
      if (active) setUser(data.user ?? null);
    });

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => {
      active = false;
      authListener.subscription.unsubscribe();
    };
  }, [supabase]);
  const resetStore = useActivityStore((s) => s.resetStore);
  const handleSignOut = useCallback(async () => {
    resetStore();
    await supabase.auth.signOut();
    router.push('/login');
    
  }, [supabase, router]);

  const go = useCallback((path: string) => router.push(path), [router]);

  const isActive = useCallback(
    (path: string) =>
      pathname === path || (path !== '/playground' && !!pathname?.startsWith(path + '/')),
    [pathname],
  );

  // Which tour (if any) belongs to the current page.
  const tourKey = useMemo(
    () => TOUR_KEYS.find((k) => pathname?.startsWith(`/${k}`)) ?? null,
    [pathname],
  );

  const replayTour = useCallback(() => {
    if (tourKey) {
      window.dispatchEvent(new CustomEvent('bm-replay-tour', { detail: tourKey }));
    }
  }, [tourKey]);

  const username = user?.email?.split('@')[0];

  return (
    <>
      {/* ── Fonts (mirrors landing page) ── */}
      <link href={FONTS_HREF} rel="stylesheet" />

      <style suppressHydrationWarning>{STYLES}</style>

      <header
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 100,
          height: 64,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 28px',
          background: 'rgba(4,8,15,0.92)',
          borderBottom: '1px solid rgba(255,255,255,0.07)',
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
          fontFamily: '"Inter", system-ui, sans-serif',
        }}
      >
        {/* ── Logo ── */}
        <div
          onClick={() => go('/playground')}
          style={{ display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer', flexShrink: 0 }}
        >
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: 10,
              background: 'linear-gradient(135deg,#1a3a8a,#2563eb)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 0 0 1px rgba(59,130,246,0.3), 0 6px 18px rgba(37,99,235,0.28)',
              position: 'relative',
              overflow: 'hidden',
              flexShrink: 0,
            }}
          >
            <div
              style={{
                position: 'absolute',
                inset: 0,
                background: 'linear-gradient(135deg,rgba(255,255,255,0.1),transparent)',
              }}
            />
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2L2 7l10 5 10-5-10-5z" />
              <path d="M2 17l10 5 10-5" />
              <path d="M2 12l10 5 10-5" />
            </svg>
          </div>
          <div style={{ lineHeight: 1.15 }}>
            <p style={{ fontSize: 14, fontWeight: 700, color: '#f0f4ff', fontFamily: '"Space Grotesk",sans-serif', margin: 0 }}>
              Build Mind
            </p>
            <p style={{ fontSize: 9, color: 'rgba(240,244,255,0.5)', letterSpacing: '0.07em', textTransform: 'uppercase', margin: 0 }}>
              by Mediatiz Foundation
            </p>
          </div>
        </div>

        {/* ── Nav ── */}
        <nav style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          {NAV_ITEMS.map((item) => (
            <button
              key={item.path}
              onClick={() => go(item.path)}
              className={`bm-nav-btn${isActive(item.path) ? ' active' : ''}`}
            >
              {item.label}
            </button>
          ))}
        </nav>

        {/* ── Right: user / auth ── */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
          {user ? (
            <>
              {/* Guide / replay tour — only on pages that have a tour */}
              {tourKey && (
                <button
                  onClick={replayTour}
                  className="bm-guide"
                  aria-label="Replay the guided tour for this page"
                  title="Replay the guided tour"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 7,
                    padding: '7px 14px 7px 12px',
                    borderRadius: 99,
                    fontSize: 12,
                    fontWeight: 600,
                    letterSpacing: '0.01em',
                    color: '#93c5fd',
                    background: 'rgba(59,130,246,0.1)',
                    border: '1px solid rgba(59,130,246,0.22)',
                    cursor: 'pointer',
                    fontFamily: '"Inter", sans-serif',
                  }}
                >
                  <svg
                    className="bm-guide-ico"
                    width="15"
                    height="15"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <circle cx="12" cy="12" r="9.5" />
                    <polygon points="15.6 8.4 10.6 10.6 8.4 15.6 13.4 13.4" />
                  </svg>
                  Guide
                </button>
              )}

              {/* Online indicator + username */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '6px 14px',
                  borderRadius: 99,
                  background: 'rgba(16,185,129,0.08)',
                  border: '1px solid rgba(16,185,129,0.18)',
                }}
              >
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#10b981', display: 'block', animation: 'pulse-dot 2s infinite' }} />
                <span style={{ fontSize: 12, fontWeight: 600, color: '#34d399', fontFamily: '"JetBrains Mono", monospace', letterSpacing: '0.03em' }}>
                  {username}
                </span>
              </div>

              {/* Sign out */}
              <button
                onClick={handleSignOut}
                className="bm-signout"
                style={{
                  padding: '7px 16px',
                  borderRadius: 99,
                  fontSize: 12,
                  fontWeight: 600,
                  color: 'rgba(240,244,255,0.55)',
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  cursor: 'pointer',
                  transition: 'all .18s',
                  fontFamily: '"Inter", sans-serif',
                }}
              >
                Sign out
              </button>
            </>
          ) : (
            <>
              {/* ESP32 badge */}
              <div
                style={{
                  padding: '5px 13px',
                  borderRadius: 99,
                  background: 'rgba(59,130,246,0.1)',
                  border: '1px solid rgba(59,130,246,0.2)',
                  fontSize: 10,
                  fontWeight: 700,
                  color: '#60a5fa',
                  fontFamily: '"JetBrains Mono", monospace',
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                }}
              >
                ESP32
              </div>

              {/* Sign in */}
              <button
                onClick={() => go('/login')}
                className="bm-signin"
                style={{
                  padding: '8px 20px',
                  borderRadius: 99,
                  fontSize: 12.5,
                  fontWeight: 700,
                  color: '#fff',
                  background: 'linear-gradient(135deg,#1a3a8a,#2563eb)',
                  border: 'none',
                  cursor: 'pointer',
                  fontFamily: '"Inter", sans-serif',
                  boxShadow: '0 4px 16px rgba(37,99,235,0.35)',
                  transition: 'all .22s',
                }}
              >
                Sign in
              </button>
            </>
          )}
        </div>
      </header>
    </>
  );
}

/* ── styles (hoisted to module scope so the string isn't rebuilt each render) ── */
const STYLES = `
  @keyframes pulse-dot {
    0%,100% { opacity:1; transform:scale(1); }
    50%     { opacity:.4; transform:scale(.7); }
  }
  .bm-nav-btn {
    position: relative;
    padding: 7px 14px;
    border-radius: 9px;
    font-size: 12.5px;
    font-weight: 600;
    font-family: 'Inter', sans-serif;
    border: 1px solid transparent;
    background: transparent;
    color: rgba(240,244,255,0.5);
    cursor: pointer;
    transition: color .18s, background .18s, border-color .18s;
    white-space: nowrap;
    letter-spacing: 0.01em;
  }
  .bm-nav-btn:hover {
    color: #f0f4ff;
    background: rgba(255,255,255,0.05);
  }
  .bm-nav-btn.active {
    color: #f0f4ff;
    background: rgba(59,130,246,0.12);
    border-color: rgba(59,130,246,0.22);
  }
  .bm-nav-btn.active::after {
    content: '';
    position: absolute;
    bottom: -1px;
    left: 50%;
    transform: translateX(-50%);
    width: 18px;
    height: 2px;
    border-radius: 99px;
    background: #3b82f6;
  }
  .bm-guide {
  transition: background .18s, border-color .18s, color .18s, transform .18s, box-shadow .18s;
}
.bm-guide:hover {
  background: rgba(59,130,246,0.18) !important;
  border-color: rgba(59,130,246,0.45) !important;
  color: #bfdbfe !important;
  transform: translateY(-1px);
  box-shadow: 0 4px 16px rgba(59,130,246,0.28);
}
.bm-guide:active { transform: scale(.96); }
.bm-guide-ico {
  transition: transform .5s cubic-bezier(0.34,1.56,0.64,1);
  transform-origin: center;
}
.bm-guide:hover .bm-guide-ico {
  transform: rotate(72deg);
}
  .bm-signin:hover {
   transform: translateY(-1px);
   box-shadow: 0 6px 20px rgba(37,99,235,0.45) !important;
  }
`;