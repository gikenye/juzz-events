import { useEffect, useState, type FormEvent } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthStore } from '../store/authStore';
import { Button } from '../components/ui/Button';

export function LoginPage() {
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState<'email' | 'otp'>('email');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const { requestOtp, verifyOtp, loginPasskey, passkeyAvailable, isMiniPay, detectMiniPay } = useAuthStore();
  const navigate = useNavigate();

  useEffect(() => { detectMiniPay(); }, [detectMiniPay]);

  const validEmail = /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email.trim());

  const sendCode = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    if (!validEmail) { setError('Enter a valid email.'); return; }
    setLoading(true);
    try {
      await requestOtp(email);
      setStep('otp');
    } catch {
      setError('Could not send the code. Try again.');
    } finally { setLoading(false); }
  };

  const verify = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    if (otp.length !== 6) { setError('Enter the 6-digit code.'); return; }
    setLoading(true);
    try {
      await verifyOtp(email, otp);
      navigate('/game');
    } catch {
      setError('That code is invalid or expired.');
    } finally { setLoading(false); }
  };

  const usePasskey = async () => {
    setError('');
    if (!validEmail) { setError('Enter your email, then use your passkey.'); return; }
    setLoading(true);
    try {
      await loginPasskey(email);
      navigate('/game');
    } catch (err) {
      const msg = (err as { code?: string }).code === 'HTTP_404'
        ? 'No passkey for this email — use the email code instead.'
        : 'Passkey sign-in failed. Use the email code instead.';
      setError(msg);
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen bg-bg-base flex items-center justify-center px-4">
      <div
        className="fixed inset-0 opacity-[0.025] pointer-events-none"
        style={{
          backgroundImage: `linear-gradient(45deg, #F0D9B5 25%, transparent 25%), linear-gradient(-45deg, #F0D9B5 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #F0D9B5 75%), linear-gradient(-45deg, transparent 75%, #F0D9B5 75%)`,
          backgroundSize: '48px 48px',
          backgroundPosition: '0 0, 0 24px, 24px -24px, -24px 0px',
        }}
      />

      <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} className="relative w-full max-w-md">
        <div className="text-center mb-8">
          <Link to="/" className="font-display text-gold text-2xl font-bold tracking-widest">
            JUZZ<span className="text-ivory">.BET</span>
          </Link>
          <p className="text-muted text-sm mt-2">AI Chess Prediction</p>
        </div>

        <div className="bg-bg-card border border-border rounded-2xl p-8 shadow-2xl">
          {isMiniPay && (
            <button
              onClick={() => navigate('/wallet')}
              className="w-full mb-5 py-3 rounded-lg bg-gotham text-bg-base font-semibold text-sm hover:bg-gotham-light transition-colors"
            >
              Continue with MiniPay
            </button>
          )}

          <AnimatePresence mode="wait">
            {step === 'email' ? (
              <motion.form key="email" initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 16 }} onSubmit={sendCode} className="flex flex-col gap-4">
                <div>
                  <label className="block text-muted text-xs mb-1.5 uppercase tracking-wider">Email</label>
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="w-full bg-bg-surface border border-border rounded-lg px-4 py-3 text-ivory outline-none focus:border-gold transition-colors placeholder:text-muted text-sm"
                    autoComplete="email"
                    autoFocus
                  />
                </div>

                {error && <p className="text-red-400 text-sm">{error}</p>}

                <Button type="submit" size="lg" className="w-full mt-1" loading={loading}>
                  Email me a code
                </Button>

                {passkeyAvailable() && (
                  <button
                    type="button"
                    onClick={usePasskey}
                    disabled={loading}
                    className="text-muted text-sm hover:text-ivory transition-colors text-center disabled:opacity-50"
                  >
                    Use a passkey instead
                  </button>
                )}
              </motion.form>
            ) : (
              <motion.form key="otp" initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -16 }} onSubmit={verify} className="flex flex-col gap-4">
                <div className="text-center mb-2">
                  <p className="text-ivory text-sm font-medium">Check your email</p>
                  <p className="text-muted text-xs mt-1">
                    We sent a 6-digit code to <span className="text-gold">{email}</span>
                  </p>
                </div>

                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  value={otp}
                  onChange={e => setOtp(e.target.value.replace(/\D/g, ''))}
                  placeholder="000000"
                  className="w-full bg-bg-surface border border-border rounded-lg px-4 py-3 text-ivory outline-none focus:border-gold transition-colors placeholder:text-muted text-sm text-center tracking-[0.5em] font-mono"
                  autoFocus
                />

                {error && <p className="text-red-400 text-sm">{error}</p>}

                <Button type="submit" size="lg" className="w-full mt-1" loading={loading}>
                  Verify & continue
                </Button>

                <button
                  type="button"
                  onClick={() => { setStep('email'); setError(''); setOtp(''); }}
                  className="text-muted text-sm hover:text-ivory transition-colors text-center"
                >
                  ← Use a different email
                </button>
              </motion.form>
            )}
          </AnimatePresence>

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
