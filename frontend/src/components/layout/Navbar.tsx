import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useState } from 'react';
import { useAuthStore } from '../../store/authStore';

const NAV_LINKS = [
  { label: 'Home', to: '/' },
  { label: 'Tournament', to: '/games' },
  { label: 'Live match', to: '/game' },
];

export function Navbar() {
  const { user, balance, logout, isMiniPay, walletAddress } = useAuthStore();
  // Wallet-native users (MiniPay / injected) have no email account — they're
  // "in" without sign-in, so show their balance and never an email Login button.
  const walletUser = isMiniPay || !!walletAddress;
  const funded = !!user || walletUser;
  const navigate = useNavigate();
  // Home shows the dev banner above the navbar; drop the bar to clear it there.
  const onHome = useLocation().pathname === '/';
  const [open, setOpen] = useState(false);
  const [userMenu, setUserMenu] = useState(false);

  return (
    <>
      <header className={`fixed ${onHome ? 'top-12' : 'top-4'} left-0 right-0 z-40 flex justify-center px-4`}>
        <nav
          className="w-full flex items-center justify-between h-14 px-5 rounded-2xl"
          style={{
            maxWidth: 960,
            background: 'rgba(8,8,12,0.80)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            border: '1px solid rgba(255,100,0,0.18)',
            boxShadow: '0 8px 32px rgba(0,0,0,0.60), 0 0 0 1px rgba(255,80,0,0.06) inset',
          }}
        >
          {/* Logo */}
          <Link to="/" style={{ fontFamily: "'Cinzel', serif", color: '#FFAA40', fontSize: 18, fontWeight: 700, letterSpacing: 3, textDecoration: 'none' }}>
            JUZZ<span style={{ color: '#F5F0E8' }}>.BET</span>
          </Link>

          {/* Desktop links */}
          <div className="hidden sm:flex items-center gap-1">
            {NAV_LINKS.map((l) => (
              <Link key={l.to} to={l.to}
                className="px-4 py-1.5 rounded-xl text-sm transition-all"
                style={{ color: 'rgba(245,240,232,0.65)', fontWeight: 500, textDecoration: 'none' }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = '#FFAA40'; (e.currentTarget as HTMLElement).style.background = 'rgba(255,100,0,0.10)'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = 'rgba(245,240,232,0.65)'; (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
              >{l.label}</Link>
            ))}
          </div>

          {/* Right side */}
          <div className="flex items-center gap-3">
            {/* Wallet balance — desktop */}
            {funded && (
              <button
                onClick={() => navigate('/wallet')}
                className="hidden sm:flex items-center gap-2 text-sm transition-all px-3 py-1.5 rounded-xl"
                style={{ color: 'rgba(245,240,232,0.65)', background: 'rgba(255,100,0,0.07)', border: '1px solid rgba(255,100,0,0.12)' }}
                onMouseEnter={e => (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,100,0,0.30)'}
                onMouseLeave={e => (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,100,0,0.12)'}
              >
                <span className="w-2 h-2 rounded-full animate-pulse" style={{ background: '#00D4C4' }} />
                ${balance.toFixed(2)}
              </button>
            )}

            {/* Auth — desktop. Email accounts get the avatar menu; wallet-native
                users are already in (balance chip above); only true visitors see Login. */}
            {user ? (
              <div className="relative hidden sm:block">
                <button
                  onClick={() => setUserMenu(!userMenu)}
                  className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold transition-all"
                  style={{ background: 'rgba(255,100,0,0.15)', border: '1px solid rgba(255,100,0,0.30)', color: '#FFAA40' }}
                >
                  {user.email[0].toUpperCase()}
                </button>
                {userMenu && (
                  <div className="absolute right-0 top-10 py-1 min-w-[140px] z-50"
                    style={{ background: 'rgba(8,8,12,0.98)', backdropFilter: 'blur(16px)', border: '1px solid rgba(255,100,0,0.18)', borderRadius: 12, boxShadow: '0 8px 32px rgba(0,0,0,0.6)' }}>
                    <button
                      onClick={() => { logout(); setUserMenu(false); }}
                      className="w-full text-left px-4 py-2 text-sm transition-colors"
                      style={{ color: 'rgba(245,240,232,0.6)' }}
                      onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = '#FFAA40'}
                      onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = 'rgba(245,240,232,0.6)'}
                    >
                      Sign out
                    </button>
                  </div>
                )}
              </div>
            ) : walletUser ? null : (
              <button
                onClick={() => navigate('/login')}
                className="hidden sm:block text-sm font-semibold px-4 py-1.5 rounded-xl transition-all"
                style={{ background: 'linear-gradient(135deg, #FF6A00, #FFAA40)', color: '#0A0400', letterSpacing: 0.5 }}
              >
                Login
              </button>
            )}

            {/* Hamburger — mobile */}
            <button className="sm:hidden flex flex-col gap-1.5 p-2" onClick={() => setOpen(true)} aria-label="Open menu">
              {[0, 1, 2].map(i => (
                <span key={i} className="block rounded-full" style={{ width: 22, height: 2, background: '#FFAA40' }} />
              ))}
            </button>
          </div>
        </nav>
      </header>

      {/* Mobile overlay */}
      {open && (
        <div
          className="fixed inset-0 z-50 flex flex-col"
          style={{ background: 'rgba(6,6,10,0.98)', backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)' }}
        >
          <div className="flex items-center justify-between px-6 h-20" style={{ borderBottom: '1px solid rgba(255,100,0,0.12)' }}>
            <span style={{ fontFamily: "'Cinzel', serif", color: '#FFAA40', fontSize: 18, fontWeight: 700, letterSpacing: 3 }}>
              JUZZ<span style={{ color: '#F5F0E8' }}>.BET</span>
            </span>
            <button onClick={() => setOpen(false)} style={{ color: '#FFAA40', fontSize: 24, lineHeight: 1 }}>✕</button>
          </div>

          <div className="flex flex-col gap-1 p-6 mt-4">
            {NAV_LINKS.map((l) => (
              <Link key={l.to} to={l.to} onClick={() => setOpen(false)}
                className="px-5 py-4 rounded-xl text-lg font-medium transition-all"
                style={{ color: 'rgba(245,240,232,0.75)', borderBottom: '1px solid rgba(255,100,0,0.08)', textDecoration: 'none' }}>
                {l.label}
              </Link>
            ))}

            {user ? (
              <>
                <button
                  onClick={() => { navigate('/wallet'); setOpen(false); }}
                  className="px-5 py-4 rounded-xl text-lg font-medium text-left transition-all"
                  style={{ color: 'rgba(245,240,232,0.75)', borderBottom: '1px solid rgba(255,100,0,0.08)' }}>
                  Wallet · ${balance.toFixed(2)}
                </button>
                <button
                  onClick={() => { logout(); setOpen(false); }}
                  className="mt-6 text-center py-4 rounded-xl font-semibold text-lg"
                  style={{ border: '1px solid rgba(255,100,0,0.25)', color: 'rgba(245,240,232,0.5)' }}>
                  Sign out
                </button>
              </>
            ) : walletUser ? (
              <button
                onClick={() => { navigate('/wallet'); setOpen(false); }}
                className="px-5 py-4 rounded-xl text-lg font-medium text-left transition-all"
                style={{ color: 'rgba(245,240,232,0.75)', borderBottom: '1px solid rgba(255,100,0,0.08)' }}>
                Wallet · ${balance.toFixed(2)}
              </button>
            ) : (
              <button
                onClick={() => { navigate('/login'); setOpen(false); }}
                className="mt-6 text-center py-4 rounded-xl font-semibold text-lg"
                style={{ background: 'linear-gradient(135deg, #FF6A00, #FFAA40)', color: '#0A0400' }}>
                Login
              </button>
            )}
          </div>

          <div className="flex-1 flex items-end justify-center pb-10">
            <p style={{ color: 'rgba(255,100,0,0.3)', fontSize: 11, letterSpacing: 4, textTransform: 'uppercase' }}>◈ AI Chess Prediction ◈</p>
          </div>
        </div>
      )}

    </>
  );
}
