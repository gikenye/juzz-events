import { useState, FormEvent } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuthStore } from '../store/authStore';
import { Button } from '../components/ui/Button';

export function LoginPage() {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { login, register } = useAuthStore();
  const navigate = useNavigate();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    if (!email || !password) { setError('Please fill in all fields.'); return; }
    if (password.length < 6) { setError('Password must be at least 6 characters.'); return; }
    setLoading(true);
    try {
      if (mode === 'login') await login(email, password);
      else await register(email, password);
      navigate('/game');
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-bg-base flex items-center justify-center px-4">
      {/* Background pattern */}
      <div
        className="fixed inset-0 opacity-[0.025] pointer-events-none"
        style={{
          backgroundImage: `linear-gradient(45deg, #F0D9B5 25%, transparent 25%), linear-gradient(-45deg, #F0D9B5 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #F0D9B5 75%), linear-gradient(-45deg, transparent 75%, #F0D9B5 75%)`,
          backgroundSize: '48px 48px',
          backgroundPosition: '0 0, 0 24px, 24px -24px, -24px 0px',
        }}
      />

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative w-full max-w-md"
      >
        {/* Logo */}
        <div className="text-center mb-8">
          <Link to="/" className="font-display text-gold text-2xl font-bold tracking-widest">
            JUZZ<span className="text-ivory">.BET</span>
          </Link>
          <p className="text-muted text-sm mt-2">AI Chess Prediction</p>
        </div>

        <div className="bg-bg-card border border-border rounded-2xl p-8 shadow-2xl">
          {/* Mode toggle */}
          <div className="flex rounded-lg bg-bg-surface p-1 mb-6">
            {(['login', 'register'] as const).map(m => (
              <button
                key={m}
                onClick={() => { setMode(m); setError(''); }}
                className={`flex-1 py-2 rounded-md text-sm font-medium transition-all ${
                  mode === m ? 'bg-gold text-bg-base' : 'text-muted hover:text-ivory'
                }`}
              >
                {m === 'login' ? 'Login' : 'Register'}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div>
              <label className="block text-muted text-xs mb-1.5 uppercase tracking-wider">Email</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full bg-bg-surface border border-border rounded-lg px-4 py-3 text-ivory outline-none focus:border-gold transition-colors placeholder:text-muted text-sm"
                autoComplete="email"
              />
            </div>
            <div>
              <label className="block text-muted text-xs mb-1.5 uppercase tracking-wider">Password</label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-bg-surface border border-border rounded-lg px-4 py-3 text-ivory outline-none focus:border-gold transition-colors placeholder:text-muted text-sm"
                autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
              />
            </div>

            {error && <p className="text-red-400 text-sm">{error}</p>}

            <Button type="submit" size="lg" className="w-full mt-2" loading={loading}>
              {mode === 'login' ? 'Login' : 'Create Account'}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <Link to="/game" className="text-muted text-sm hover:text-ivory transition-colors">
              Continue without account →
            </Link>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
