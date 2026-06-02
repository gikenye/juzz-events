import { Link, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { useAuthStore } from '../../store/authStore';
import { Button } from '../ui/Button';

export function Navbar() {
  const { user, balance, logout } = useAuthStore();
  const navigate = useNavigate();
  const [showMenu, setShowMenu] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-bg-base/90 backdrop-blur-md">
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">

        {/* Logo */}
        <Link to="/" className="font-display text-gold text-xl font-bold tracking-widest hover:text-gold-light transition-colors shrink-0">
          JUZZ<span className="text-ivory">.BET</span>
        </Link>

        {/* Nav links */}
        <div className="hidden sm:flex items-center gap-6">
          <Link to="/" className="text-muted hover:text-ivory text-sm transition-colors">Home</Link>
          <Link to="/game" className="text-muted hover:text-ivory text-sm transition-colors">Live Game</Link>
        </div>

        {/* Right side */}
        <div className="flex items-center gap-3">
          {/* Wallet balance */}
          <button
            onClick={() => navigate('/wallet')}
            className="hidden sm:flex items-center gap-2 border border-border rounded-full px-4 py-1.5 text-sm text-ivory hover:border-gold transition-colors"
          >
            <span className="w-2 h-2 rounded-full bg-gotham animate-pulse" />
            {balance.toFixed(2)} cUSD
          </button>

          {/* Auth */}
          {user ? (
            <div className="relative">
              <button
                onClick={() => setShowMenu(!showMenu)}
                className="flex items-center gap-2 text-sm text-ivory hover:text-gold transition-colors"
              >
                <span className="w-8 h-8 rounded-full bg-bg-surface border border-border flex items-center justify-center text-gold font-semibold text-xs">
                  {user.email[0].toUpperCase()}
                </span>
              </button>
              {showMenu && (
                <div className="absolute right-0 top-10 bg-bg-card border border-border rounded-lg shadow-xl py-1 min-w-[140px] z-50">
                  <button
                    onClick={() => { logout(); setShowMenu(false); }}
                    className="w-full text-left px-4 py-2 text-sm text-muted hover:text-ivory hover:bg-bg-surface transition-colors"
                  >
                    Sign out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <Button size="sm" onClick={() => navigate('/login')}>Login</Button>
          )}
        </div>
      </nav>
    </header>
  );
}
