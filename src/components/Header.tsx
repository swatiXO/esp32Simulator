'use client';

import { useRouter, usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import { useActivityStore } from '@/store/useActivityStore';

export default function Header() {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<any>(null);
  const supabase = createClient();

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user);
    });

    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null);
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [supabase.auth]);
  const resetStore = useActivityStore((s) => s.resetStore);
  const handleSignOut = async () => {
    resetStore();
    await supabase.auth.signOut();
    router.push('/login');
    
  };

  const isActive = (path: string) =>
    pathname === path || (path !== '/playground' && pathname?.startsWith(path + '/'));

  const navItems = [
    { label: 'Playground', path: '/playground' },
    { label: 'Learn',       path: '/learn'       },
    { label: 'Activities',  path: '/activities'  },
    { label: 'Dashboard',   path: '/dashboard'   },
  ];

  return (
    <>
      {/* ── Fonts (mirrors landing page) ── */}
      <link
        href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;700&display=swap"
        rel="stylesheet"
      />

      <style suppressHydrationWarning>{`
        @keyframes pulse-dot {
          0%,100% { opacity:1; transform:scale(1);   }
          50%      { opacity:.4; transform:scale(.7); }
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
        .bm-signout:hover {
          background: rgba(255,255,255,0.08) !important;
          border-color: rgba(255,255,255,0.14) !important;
          color: #f0f4ff !important;
        }
        .bm-signin:hover {
          transform: translateY(-1px);
          box-shadow: 0 6px 20px rgba(37,99,235,0.45) !important;
        }
      `}</style>

      <header style={{
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
      }}>

        {/* ── Logo ── */}
        <div
          onClick={() => router.push('/playground')}
          style={{ display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer', flexShrink: 0 }}
        >
          <div style={{
            width: 36, height: 36, borderRadius: 10,
            background: 'linear-gradient(135deg,#1a3a8a,#2563eb)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 0 0 1px rgba(59,130,246,0.3), 0 6px 18px rgba(37,99,235,0.28)',
            position: 'relative', overflow: 'hidden', flexShrink: 0,
          }}>
            <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(135deg,rgba(255,255,255,0.1),transparent)' }} />
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2L2 7l10 5 10-5-10-5z" />
              <path d="M2 17l10 5 10-5" />
              <path d="M2 12l10 5 10-5" />
            </svg>
          </div>
          <div style={{ lineHeight: 1.15 }}>
            <p style={{ fontSize: 14, fontWeight: 700, color: '#f0f4ff', fontFamily: '"Space Grotesk",sans-serif', margin: 0 }}>Build Mind</p>
            <p style={{ fontSize: 9, color: 'rgba(240,244,255,0.5)', letterSpacing: '0.07em', textTransform: 'uppercase', margin: 0 }}>by Mediatiz Foundation</p>
          </div>
        </div>

        {/* ── Nav ── */}
        <nav style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          {navItems.map(item => (
            <button
              key={item.path}
              onClick={() => router.push(item.path)}
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
              {/* Online indicator + username */}
              <div style={{
                display: 'flex', alignItems: 'center', gap: 8,
                padding: '6px 14px', borderRadius: 99,
                background: 'rgba(16,185,129,0.08)',
                border: '1px solid rgba(16,185,129,0.18)',
              }}>
                <span style={{
                  width: 6, height: 6, borderRadius: '50%',
                  background: '#10b981', display: 'block',
                  animation: 'pulse-dot 2s infinite',
                }} />
                <span style={{
                  fontSize: 12, fontWeight: 600,
                  color: '#34d399',
                  fontFamily: '"JetBrains Mono", monospace',
                  letterSpacing: '0.03em',
                }}>
                  {user.email?.split('@')[0]}
                </span>
              </div>

              {/* Sign out */}
              <button
                onClick={handleSignOut}
                className="bm-signout"
                style={{
                  padding: '7px 16px', borderRadius: 99,
                  fontSize: 12, fontWeight: 600,
                  color: 'rgba(240,244,255,0.55)',
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  cursor: 'pointer', transition: 'all .18s',
                  fontFamily: '"Inter", sans-serif',
                }}
              >
                Sign out
              </button>
            </>
          ) : (
            <>
              {/* ESP32 badge */}
              <div style={{
                padding: '5px 13px', borderRadius: 99,
                background: 'rgba(59,130,246,0.1)',
                border: '1px solid rgba(59,130,246,0.2)',
                fontSize: 10, fontWeight: 700,
                color: '#60a5fa',
                fontFamily: '"JetBrains Mono", monospace',
                letterSpacing: '0.08em', textTransform: 'uppercase',
              }}>
                ESP32
              </div>

              {/* Sign in */}
              <button
                onClick={() => router.push('/login')}
                className="bm-signin"
                style={{
                  padding: '8px 20px', borderRadius: 99,
                  fontSize: 12.5, fontWeight: 700,
                  color: '#fff',
                  background: 'linear-gradient(135deg,#1a3a8a,#2563eb)',
                  border: 'none', cursor: 'pointer',
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