import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { api, ApiError } from '../lib/api';
import { newSecret, commitmentOf } from '../lib/secret';
import { connectWallet, depositFromWallet } from '../lib/celo';
import { MINIPAY_ADD_CASH } from '../lib/config';
import type { Balance, Position } from '../lib/types';
import { assetBySymbol, type AssetSymbol } from '../lib/config';
import { Button } from '../components/ui/Button';
import { BuyFunds } from '../components/wallet/BuyFunds';

const toTokenBase = (usd: number, decimals: number) => BigInt(Math.round(usd * 10 ** decimals)).toString();
const money = (micro: string | number) => (Number(micro) / 1e6).toFixed(2);
const errText = (e: unknown) => (e instanceof Error ? e.message : String(e));
// Display form of the wire asset symbol (server speaks UPPERCASE, brand is "USDm").
const assetLabel = (wire: string) => (wire === 'USDM' ? 'USDm' : wire);
const isAddress = (s: string) => /^0x[0-9a-fA-F]{40}$/.test(s.trim());

// Poll deposit-as-auth for MiniPay: claim a trading session once the deposit confirms.
async function pollSession(secret: `0x${string}`, tries = 30): Promise<{ token: string; wallet: string }> {
  for (let i = 0; i < tries; i++) {
    try { return await api.session(secret); }
    catch (e) { if (!(e instanceof ApiError && e.status === 404)) throw e; }
    await new Promise(r => setTimeout(r, 3000));
  }
  throw new Error('Deposit not yet confirmed — it can take a minute. Tap "Check again" to retry.');
}

export function WalletPage() {
  const { user, loginToken, tradingToken, wallet, isMiniPay, detectMiniPay } = useAuthStore();
  useEffect(() => { detectMiniPay(); }, [detectMiniPay]);

  let body;
  if (tradingToken && wallet) body = <AccountHome />;
  else if (isMiniPay)          body = <MiniPayDeposit />;
  else if (user && loginToken) body = <EmailActivate loginToken={loginToken} />;
  else                         body = <SignInPrompt />;

  return (
    <div className="min-h-screen bg-bg-base">
      <div className="max-w-lg mx-auto px-4 py-10">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
          {body}
        </motion.div>
      </div>
    </div>
  );
}

// ── Funded account ────────────────────────────────────────────────────────────
function AccountHome() {
  const { user, wallet, tradingToken, loginToken, isMiniPay, balance, refreshBalance, logout } = useAuthStore();
  const [fullBalance, setFullBalance] = useState<Balance | null>(null);
  const [pos, setPos]                 = useState<Position[]>([]);
  const [dest, setDest]               = useState('');
  const [code, setCode]               = useState('');
  // idle → (email accounts) code emailed, waiting for it → sent
  const [phase, setPhase]             = useState<'idle' | 'code' | 'sent'>('idle');
  const [busy, setBusy]               = useState(false);
  const [err, setErr]                 = useState<string>();
  const [copied, setCopied]           = useState(false);
  const [topup, setTopup]             = useState<string>();
  const [showDeposit, setShowDeposit] = useState(false);

  const refresh = () => {
    if (!wallet) return;
    void refreshBalance();
    api.balance(wallet).then(setFullBalance).catch(() => {});
    api.positions(wallet).then(setPos).catch(() => {});
  };
  // Live balance: settlements and top-up sweeps land server-side on their own
  // schedule, so poll while the page is open instead of only refreshing on mount.
  useEffect(() => {
    refresh();
    const t = setInterval(refresh, 15_000);
    return () => clearInterval(t);
  }, [wallet]); // eslint-disable-line react-hooks/exhaustive-deps

  // Email accounts: any tokens that landed in the Safe while away (e.g. a card
  // purchase) are only swept into the balance when /wallet/session runs — fire it.
  const sweep = () => {
    if (isMiniPay || !loginToken) return;
    api.walletSession(loginToken).then(r => {
      if (r.status === 'depositing') setTopup('Adding your new money — it lands in about a minute.');
    }).catch(() => {});
  };
  useEffect(sweep, []); // eslint-disable-line react-hooks/exhaustive-deps

  const copyAddr = () => {
    if (!wallet) return;
    navigator.clipboard?.writeText(wallet);
    setCopied(true); setTimeout(() => setCopied(false), 1500);
  };

  const gasOwed   = Number(fullBalance?.gas_owed ?? 0);
  const available = Number(fullBalance?.available ?? 0);
  const sendable  = Math.max(0, available - gasOwed); // µ$
  const sendUsd   = (sendable / 1e6).toFixed(2);
  const hasGasFee = gasOwed > 0;
  const payoutIn  = assetLabel(fullBalance?.primary_asset ?? 'USDC');
  // MiniPay: the session wallet IS the user's wallet — money goes straight back to it.
  // Email accounts: the session wallet is juzz-managed, so a destination is required.
  const needsDest = !isMiniPay;
  const destOk    = isAddress(dest);

  const fail = (e: unknown) => { setErr(errText(e)); setBusy(false); };

  // MiniPay: one tap. Email: first tap emails the code, second confirms it.
  const send = async () => {
    if (!tradingToken || sendable <= 0) return;
    setBusy(true); setErr(undefined);
    try {
      if (!needsDest) {
        await api.withdraw(tradingToken, sendable.toString());
      } else if (phase === 'idle') {
        if (!loginToken) throw new Error('Sign in again to send your money.');
        await api.confirmCode(loginToken);
        setPhase('code'); setBusy(false);
        return;
      } else {
        await api.withdraw(tradingToken, sendable.toString(), { to: dest.trim(), otp: code.trim() });
      }
      setPhase('sent');
      setTimeout(refresh, 2000);
    } catch (e) { fail(e); return; }
    setBusy(false);
  };

  const resend = async () => {
    if (!loginToken) return;
    setErr(undefined);
    try { await api.confirmCode(loginToken); } catch (e) { setErr(errText(e)); }
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Identity + balance */}
      <div className="rounded-2xl border border-gotham/30 p-6" style={{ background: 'linear-gradient(135deg, #00B4A615 0%, #141418 60%)' }}>
        <div className="flex items-center justify-between mb-4">
          <span className="text-muted text-sm">{user?.email ?? 'MiniPay'}</span>
          <button onClick={logout} className="text-muted text-xs hover:text-ivory transition-colors">sign out</button>
        </div>
        <div className="font-display text-5xl font-bold text-ivory">
          ${balance.toFixed(2)}
        </div>
        <div className="text-muted text-xs mt-1">
          available to bet
          {pos.length > 0 && ` · ${pos.length} active bet${pos.length > 1 ? 's' : ''}`}
        </div>
      </div>

      {/* Add money — funded users top up too; never a dead end */}
      <div className="bg-bg-card border border-border rounded-xl p-5">
        <h2 className="font-display text-ivory font-semibold mb-3">Add money</h2>
        <BuyFunds loginToken={loginToken ?? undefined}
          onPurchased={() => { setTopup('Adding your new money — it lands in about a minute.'); sweep(); }} />
        {!isMiniPay && wallet && (
          <div className="mt-3">
            <p className="text-muted text-xs uppercase tracking-wider mb-1">Or send stablecoins on Celo to</p>
            <button onClick={copyAddr}
              className="font-mono text-ivory text-xs break-all text-left w-full hover:text-gold transition-colors">
              {wallet} <span className="text-gold ml-1">{copied ? '✓ copied' : 'copy'}</span>
            </button>
            <button onClick={sweep} className="text-gold text-xs mt-2 hover:underline">I've sent it — check now</button>
          </div>
        )}
        {isMiniPay && (
          <button onClick={() => setShowDeposit(v => !v)}
            className="mt-3 w-full py-3 rounded-lg border border-border text-ivory text-sm font-medium hover:border-gold transition-colors">
            {showDeposit ? 'Hide' : 'Deposit from MiniPay'}
          </button>
        )}
        {topup && <p className="text-gold text-xs mt-2">{topup}</p>}
      </div>
      {isMiniPay && showDeposit && <MiniPayDeposit />}

      {/* Send earnings */}
      <div className="bg-bg-card border border-border rounded-xl p-5">
        <h2 className="font-display text-ivory font-semibold mb-1">Send earnings</h2>

        {phase === 'sent' ? (
          <div className="py-4 text-center">
            <p className="text-gold font-semibold">On its way ✓</p>
            <p className="text-muted text-xs mt-1">
              {needsDest
                ? `$${sendUsd} in ${payoutIn} is being sent to ${dest.slice(0, 6)}…${dest.slice(-4)}`
                : `$${sendUsd} in ${payoutIn} is being sent to your MiniPay wallet.`}
            </p>
            <button onClick={() => { setPhase('idle'); setCode(''); }} className="text-muted text-xs mt-3 hover:text-ivory">Done</button>
          </div>
        ) : (
          <>
            {/* Amount + fee */}
            <div className="flex items-center justify-between py-3 border-b border-border mb-3">
              <div>
                <div className="text-ivory font-semibold text-lg">${sendUsd} <span className="text-muted text-xs font-normal">in {payoutIn}</span></div>
                <div className="text-muted text-xs">you receive</div>
              </div>
              {hasGasFee && (
                <div className="text-right">
                  <div className="text-muted text-sm">${money(gasOwed)}</div>
                  <div className="text-muted text-xs">network fee</div>
                </div>
              )}
            </div>

            {hasGasFee && (
              <p className="text-muted text-xs mb-3">
                The network fee covered setting up your secure account. It's charged once.
              </p>
            )}

            {needsDest && phase === 'idle' && (
              <div className="mb-4">
                <label className="text-muted text-xs uppercase tracking-wider">Send to</label>
                <input
                  type="text" inputMode="text" autoComplete="off" spellCheck={false}
                  placeholder="0x… Celo address"
                  value={dest} onChange={e => setDest(e.target.value)} disabled={busy}
                  className="mt-1 w-full bg-bg-base border border-border rounded-lg px-3 py-2 font-mono text-sm text-ivory outline-none focus:border-gold transition-colors placeholder:text-muted disabled:opacity-40"
                />
                <p className="text-muted text-xs mt-1.5">
                  Paste the Celo address of your MiniPay or exchange account. Open MiniPay → Receive to copy yours.
                </p>
                {dest.length > 0 && !destOk && <p className="text-red-400 text-xs mt-1">That doesn't look like a Celo address.</p>}
              </div>
            )}

            {needsDest && phase === 'code' && (
              <div className="mb-4">
                <label className="text-muted text-xs uppercase tracking-wider">Confirmation code</label>
                <input
                  type="text" inputMode="numeric" autoComplete="one-time-code" maxLength={6}
                  placeholder="6-digit code"
                  value={code} onChange={e => setCode(e.target.value.replace(/\D/g, ''))} disabled={busy}
                  className="mt-1 w-full bg-bg-base border border-border rounded-lg px-3 py-2 text-center tracking-[0.4em] text-lg text-ivory outline-none focus:border-gold transition-colors placeholder:text-muted placeholder:tracking-normal disabled:opacity-40"
                />
                <p className="text-muted text-xs mt-1.5">
                  We emailed a code to {user?.email}. Enter it to confirm sending to {dest.slice(0, 6)}…{dest.slice(-4)}.
                </p>
                <button onClick={resend} className="text-gold text-xs mt-1 hover:underline">Resend code</button>
              </div>
            )}

            <Button onClick={send} loading={busy} className="w-full"
              disabled={busy || sendable <= 0
                || (needsDest && phase === 'idle' && !destOk)
                || (needsDest && phase === 'code' && code.length !== 6)}>
              {sendable <= 0 ? 'Nothing to send yet'
                : !needsDest ? `Send $${sendUsd} to your MiniPay wallet`
                : phase === 'idle' ? `Send $${sendUsd}`
                : 'Confirm and send'}
            </Button>
            {err && <p className="text-red-400 text-xs mt-2">{err}</p>}
          </>
        )}
      </div>

      {/* Active bets */}
      {pos.length > 0 && (
        <div className="bg-bg-card border border-border rounded-xl p-5">
          <h2 className="font-display text-ivory font-semibold mb-3">Active bets</h2>
          <div className="flex flex-col gap-2">
            {pos.map(p => (
              <div key={p.market_id} className="flex justify-between text-sm border-b border-border pb-2 last:border-0">
                <span className="text-muted font-mono text-xs">{p.market_id.slice(0, 8)}…</span>
                <span className="text-ivory">
                  {p.yes_shares > 0 && <span className="text-gotham mr-2">{p.yes_shares.toFixed(0)} YES</span>}
                  {p.no_shares  > 0 && <span className="text-maxi">{p.no_shares.toFixed(0)} NO</span>}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {pos.length === 0 && sendable <= 0 && (
        <p className="text-center text-muted text-sm pt-2">
          No balance yet. <Link to="/game" className="text-gold">Watch a game and place a bet →</Link>
        </p>
      )}
    </div>
  );
}

// ── MiniPay: one-tap deposit from injected wallet ────────────────────────────
function MiniPayDeposit() {
  const { setTradingSession } = useAuthStore();
  const [amt, setAmt]   = useState(2);
  const [asset, setAsset] = useState<AssetSymbol>('USDm');
  const [step, setStep] = useState<string>();
  const [busy, setBusy] = useState(false);
  const [err, setErr]   = useState<string>();

  const deposit = async () => {
    setBusy(true); setErr(undefined);
    try {
      const a = assetBySymbol(asset);
      setStep('Connecting…');
      const account = await connectWallet();
      const secret = newSecret();
      setStep('Confirm in your wallet…');
      await depositFromWallet(account, a, BigInt(toTokenBase(amt, a.decimals)), commitmentOf(secret));
      setStep('Confirming on Celo…');
      const sess = await pollSession(secret);
      setTradingSession(sess.token, sess.wallet);
    } catch (e) { setErr(errText(e)); setStep(undefined); }
    setBusy(false);
  };

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="font-display text-ivory text-2xl font-bold mb-1">Add digital dollars</h1>
        <p className="text-muted text-sm">Deposit once to start betting. Your balance is ready after the transaction confirms.</p>
      </div>

      <div className="bg-bg-card border border-border rounded-xl p-5">
        <div className="flex gap-2 mb-4">
          {(['USDm', 'USDC', 'USDT'] as AssetSymbol[]).map(s => (
            <button key={s} onClick={() => setAsset(s)} disabled={busy}
              className={`flex-1 py-1.5 text-xs font-semibold rounded-lg border transition-colors disabled:opacity-40 ${
                asset === s ? 'border-gold text-gold bg-gold/10' : 'border-border text-muted hover:text-ivory'}`}>
              {s}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2 mb-4 bg-bg-base border border-border rounded-lg px-3 py-2 focus-within:border-gold transition-colors">
          <span className="text-gold text-xl font-semibold">$</span>
          <input type="number" inputMode="decimal" min={1} step={1} value={amt} disabled={busy}
            onChange={e => setAmt(Math.max(1, Number(e.target.value) || 1))}
            className="flex-1 bg-transparent text-ivory text-xl font-semibold outline-none w-full disabled:opacity-40" />
        </div>

        <div className="flex gap-2 mb-4">
          {[1, 2, 5, 10].map(p => (
            <button key={p} onClick={() => setAmt(p)} disabled={busy}
              className={`flex-1 py-2 text-sm font-semibold rounded-lg border transition-colors disabled:opacity-30 ${
                amt === p ? 'border-gold text-gold bg-gold/10' : 'border-border text-ivory hover:border-gold'}`}>
              ${p}
            </button>
          ))}
        </div>

        <Button onClick={deposit} loading={busy} className="w-full">
          Deposit ${amt} in {asset}
        </Button>
        {step && <p className="text-gold text-sm mt-3">{step}</p>}
        {err  && <p className="text-red-400 text-sm mt-3">{err}</p>}
      </div>

      <a href={MINIPAY_ADD_CASH} target="_blank" rel="noopener"
        className="block text-center text-muted text-sm hover:text-ivory transition-colors">
        Top up with mobile money →
      </a>
    </div>
  );
}

// ── Email / PWA: auto-activate from loginToken ────────────────────────────────
function EmailActivate({ loginToken }: { loginToken: string }) {
  const { setTradingSession } = useAuthStore();
  type Phase = 'checking' | 'activating' | 'unfunded' | 'error';
  const [phase, setPhase]       = useState<Phase>('checking');
  const [addr, setAddr]         = useState<string>();
  const [copied, setCopied]     = useState(false);
  const [err, setErr]           = useState<string>();

  const activate = async () => {
    setPhase('checking'); setErr(undefined);
    try {
      const r = await api.walletSession(loginToken);
      if (r.status === 'ready') { setTradingSession(r.token, r.wallet); return; }
      if (r.status === 'depositing') {
        setPhase('activating');
        setTimeout(activate, (r.retry_after ?? 15) * 1000);
        return;
      }
      setAddr(r.deposit_address || r.wallet);
      setPhase('unfunded');
    } catch (e) { setErr(errText(e)); setPhase('error'); }
  };

  useEffect(() => { void activate(); }, [loginToken]); // eslint-disable-line react-hooks/exhaustive-deps

  const copy = () => {
    if (addr) { navigator.clipboard?.writeText(addr); setCopied(true); setTimeout(() => setCopied(false), 1500); }
  };

  if (phase === 'checking' || phase === 'activating') {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3">
        <div className="w-8 h-8 rounded-full border-2 border-gold border-t-transparent animate-spin" />
        <p className="text-muted text-sm">
          {phase === 'checking' ? 'Checking your account…' : 'Setting up your balance…'}
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="font-display text-ivory text-2xl font-bold mb-1">Add digital dollars</h1>
        <p className="text-muted text-sm">Send USDC, USDT, or USDm on Celo to your account address below.</p>
      </div>

      <BuyFunds loginToken={loginToken} onPurchased={activate} />

      <div className="bg-bg-card border border-border rounded-xl p-5">
        <p className="text-muted text-xs uppercase tracking-wider mb-2">Your Celo account address</p>
        {addr ? (
          <button onClick={copy}
            className="font-mono text-ivory text-sm break-all text-left w-full hover:text-gold transition-colors leading-relaxed">
            {addr} <span className="text-gold ml-1">{copied ? '✓ copied' : 'copy'}</span>
          </button>
        ) : <p className="text-muted text-sm">Setting up…</p>}
      </div>

      {err && <p className="text-red-400 text-sm">{err}</p>}
      <Button onClick={activate} variant="ghost" className="w-full">Check again</Button>
    </div>
  );
}

function SignInPrompt() {
  const navigate = useNavigate();
  return (
    <div className="flex flex-col items-center justify-center py-20 gap-4 text-center">
      <h1 className="font-display text-ivory text-2xl font-bold">Your account</h1>
      <p className="text-muted text-sm max-w-xs">Sign in with your email to see your balance and send earnings.</p>
      <Button onClick={() => navigate('/login')} className="w-full max-w-xs">Sign in</Button>
    </div>
  );
}
