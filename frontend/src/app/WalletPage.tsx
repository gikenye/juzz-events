import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { api, ApiError } from '../lib/api';
import { newSecret, commitmentOf } from '../lib/secret';
import { connectWallet, depositFromWallet } from '../lib/celo';
import { MINIPAY_ADD_CASH } from '../lib/config';
import type { Balance, Position } from '../lib/types';
import { assetBySymbol, type AssetSymbol } from '../lib/config';
import { Button } from '../components/ui/Button';
import { usePositionsStore, type SettledPrediction } from '../store/positionsStore';
import { BuyFunds } from '../components/wallet/BuyFunds';
import { TokenIcon } from '../components/ui/TokenIcon';
import { txErrorMessage } from '../lib/txErrors';
import { BattleBackdrop } from '../components/layout/BattleBackdrop';

const toTokenBase = (usd: number, decimals: number) => BigInt(Math.round(usd * 10 ** decimals)).toString();
const money = (micro: string | number) => (Number(micro) / 1e6).toFixed(2);
// Backend ApiError messages are already user-facing; everything else (wallet /
// chain / RPC) goes through the tx-error translator so we never dump a raw blob.
const errText = (e: unknown): string =>
  e instanceof ApiError ? e.message : txErrorMessage(e);
// Display form of the wire asset symbol (server speaks UPPERCASE, brand is "USDm").
const assetLabel = (wire: string) => (wire === 'USDM' ? 'USDm' : wire);
const isAddress = (s: string) => /^0x[0-9a-fA-F]{40}$/.test(s.trim());
const short = (a: string) => `${a.slice(0, 6)}…${a.slice(-4)}`;

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
    <BattleBackdrop>
      <div className="max-w-lg mx-auto px-4 pb-10">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
          {body}
        </motion.div>
      </div>
    </BattleBackdrop>
  );
}

// ── Funded account: one surface, one decision at a time ──────────────────────
type PanelKind = 'none' | 'add' | 'send' | 'history';

function AccountHome() {
  const { user, wallet, tradingToken, loginToken, isMiniPay, balance, refreshBalance, logout } = useAuthStore();
  const [fullBalance, setFullBalance] = useState<Balance | null>(null);
  const [pos, setPos]                 = useState<Position[]>([]);
  const [panel, setPanel]             = useState<PanelKind>('none');
  const autoOpened = useRef(false); // open Add money for a brand-new empty account, once

  const refresh = () => {
    if (!wallet) return;
    void refreshBalance();
    api.balance(wallet).then(b => {
      setFullBalance(b);
      if (!autoOpened.current && Number(b.available) <= 0) {
        autoOpened.current = true;
        setPanel(cur => (cur === 'none' ? 'add' : cur));
      }
    }).catch(() => {});
    api.positions(wallet).then(setPos).catch(() => {});
  };
  // Live balance: settlements and top-up sweeps land server-side on their own
  // schedule, so poll while the page is open instead of only refreshing on mount.
  useEffect(() => {
    refresh();
    const t = setInterval(refresh, 15_000);
    return () => clearInterval(t);
  }, [wallet]); // eslint-disable-line react-hooks/exhaustive-deps

  // Email accounts: tokens that landed in the Safe while away (e.g. a card
  // purchase) are only swept into the balance when /wallet/session runs.
  const [topup, setTopup] = useState<string>();
  const sweep = () => {
    if (isMiniPay || !loginToken) return;
    api.walletSession(loginToken).then(r => {
      if (r.status === 'depositing') setTopup('Adding your new money — it lands in about a minute.');
    }).catch(() => {});
  };
  useEffect(sweep, []); // eslint-disable-line react-hooks/exhaustive-deps

  const gasOwed   = Number(fullBalance?.gas_owed ?? 0);
  const available = Number(fullBalance?.available ?? 0);
  const sendable  = Math.max(0, available - gasOwed); // µ$
  const payoutIn  = assetLabel(fullBalance?.primary_asset ?? 'USDC');

  const toggle = (p: PanelKind) => setPanel(cur => (cur === p ? 'none' : p));

  return (
    <div className="rounded-2xl border overflow-hidden bg-bg-card" style={{ borderColor: 'rgba(0,180,166,0.30)' }}>
      {/* Hero — identity + the number that matters (leakey gotham card) */}
      <div className="p-6 pb-5" style={{ background: 'linear-gradient(135deg, #00B4A615 0%, #141418 60%)' }}>
        <div className="flex items-center justify-between mb-5">
          <span className="text-muted text-sm truncate">{user?.email ?? 'MiniPay'}</span>
          <button onClick={logout} className="text-muted text-xs hover:text-ivory transition-colors shrink-0 ml-3">sign out</button>
        </div>
        <div className="flex items-end gap-2.5">
          <span className="font-display text-5xl font-bold text-ivory leading-none">${balance.toFixed(2)}</span>
          {balance > 0 && fullBalance?.primary_asset && (
            <span className="mb-0.5 px-2 py-0.5 rounded-full border border-gold/40 bg-gold/10 text-gold text-xs font-semibold inline-flex items-center gap-1">
              <TokenIcon symbol={payoutIn} size={14} />{payoutIn}
            </span>
          )}
        </div>
        <div className="text-muted text-xs mt-2">available to play</div>
        {pos.length > 0 && (
          <Link to="/game" className="inline-flex items-center gap-1 text-gotham text-xs mt-2 hover:underline">
            {pos.length} live forecast{pos.length > 1 ? 's' : ''} →
          </Link>
        )}
        {topup && <p className="text-gold text-xs mt-2">{topup}</p>}
      </div>

      {/* Action row — segmented, mutually exclusive disclosure */}
      <div className="grid grid-cols-3 border-t border-border">
        {([['add', 'Add money'], ['send', 'Send'], ['history', 'Predictions']] as [PanelKind, string][]).map(([p, label], idx) => (
          <button key={p} onClick={() => toggle(p)}
            className={`py-3.5 text-sm font-semibold transition-colors ${
              panel === p
                ? 'text-gold bg-gold/5 shadow-[inset_0_-2px_0_#C9A227]'
                : 'text-ivory hover:text-gold'
            } ${idx > 0 ? 'border-l border-border' : ''}`}>
            {label}
          </button>
        ))}
      </div>

      <AnimatePresence initial={false}>
        {panel !== 'none' && (
          <motion.div key={panel}
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22, ease: 'easeInOut' }}
            className="overflow-hidden border-t border-border">
            <div className="p-5">
              {panel === 'add'
                ? <AddMoneyPanel onSwept={() => { setTopup('Adding your new money — it lands in about a minute.'); sweep(); }} />
                : panel === 'history'
                ? <PredictionsPanel />
                : <SendPanel
                    sendable={sendable} gasOwed={gasOwed} payoutIn={payoutIn}
                    isMiniPay={isMiniPay} tradingToken={tradingToken} loginToken={loginToken}
                    userEmail={user?.email} onSent={() => setTimeout(refresh, 2000)} />}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {pos.length === 0 && sendable <= 0 && panel === 'none' && (
        <p className="text-center text-muted text-sm py-4 border-t border-border">
          Nothing here yet. <Link to="/game" className="text-gold">Watch a game →</Link>
        </p>
      )}
    </div>
  );
}

// ── My predictions: settled history, server truth ─────────────────────────────
const STATE_BADGE: Record<SettledPrediction['state'], { label: string; cls: string }> = {
  won:      { label: 'Won',      cls: 'text-gold bg-gold/10 border-gold/40' },
  lost:     { label: 'Lost',     cls: 'text-muted bg-bg-base border-border' },
  refunded: { label: 'Refunded', cls: 'text-gotham bg-gotham/10 border-gotham/40' },
};

function PredictionsPanel() {
  const { settled, hydrated, bind, hydrate } = usePositionsStore();
  useEffect(() => { bind(); if (!hydrated) void hydrate(); }, [bind, hydrate, hydrated]);

  if (!hydrated) return <p className="text-muted text-sm text-center py-4">Loading…</p>;
  if (settled.length === 0) {
    return (
      <p className="text-muted text-sm text-center py-4">
        No predictions yet. <Link to="/game" className="text-gold">Watch a game →</Link>
      </p>
    );
  }
  return (
    <div className="flex flex-col">
      {settled.map(sp => (
        <div key={sp.settlement_id} className="flex items-center justify-between py-2.5 border-b border-border last:border-0 gap-3">
          <div className="min-w-0">
            <p className="text-ivory text-sm truncate">{sp.question ?? 'Prediction'}</p>
            <p className="text-muted text-xs">{new Date(sp.ts_ms).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {sp.payout > 0 && <span className="text-ivory text-sm tabular-nums">+${sp.payout.toFixed(2)}</span>}
            <span className={`px-2 py-0.5 rounded-full border text-xs font-semibold ${STATE_BADGE[sp.state].cls}`}>
              {STATE_BADGE[sp.state].label}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Add money: card purchase, direct send, or MiniPay deposit ─────────────────
function AddMoneyPanel({ onSwept }: { onSwept: () => void }) {
  const { wallet, isMiniPay, loginToken } = useAuthStore();
  const [copied, setCopied] = useState(false);
  const copy = () => {
    if (!wallet) return;
    navigator.clipboard?.writeText(wallet);
    setCopied(true); setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="flex flex-col gap-4">
      <BuyFunds loginToken={loginToken ?? undefined} onPurchased={onSwept} />

      {isMiniPay
        ? <MiniPayDepositForm />
        : wallet && (
          <div>
            <p className="text-muted text-xs uppercase tracking-wider mb-1.5">Or send stablecoins on Celo to</p>
            <button onClick={copy}
              className="font-mono text-ivory text-xs break-all text-left w-full hover:text-gold transition-colors leading-relaxed">
              {wallet} <span className="text-gold ml-1">{copied ? '✓ copied' : 'copy'}</span>
            </button>
            <button onClick={onSwept} className="text-gold text-xs mt-2 hover:underline">I've sent it — check now</button>
          </div>
        )}
    </div>
  );
}

// ── Send: MiniPay one tap; email accounts pick a destination + confirm a code ─
function SendPanel({ sendable, gasOwed, payoutIn, isMiniPay, tradingToken, loginToken, userEmail, onSent }: {
  sendable: number; gasOwed: number; payoutIn: string;
  isMiniPay: boolean; tradingToken: string | null; loginToken: string | null;
  userEmail?: string; onSent: () => void;
}) {
  const [dest, setDest]   = useState('');
  const [code, setCode]   = useState('');
  const [phase, setPhase] = useState<'idle' | 'code' | 'sent'>('idle');
  const [busy, setBusy]   = useState(false);
  const [err, setErr]     = useState<string>();

  const sendUsd   = (sendable / 1e6).toFixed(2);
  const needsDest = !isMiniPay; // the MiniPay session wallet IS the user's wallet
  const destOk    = isAddress(dest);

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
      onSent();
    } catch (e) { setErr(errText(e)); setBusy(false); return; }
    setBusy(false);
  };

  const resend = async () => {
    if (!loginToken) return;
    setErr(undefined);
    try { await api.confirmCode(loginToken); } catch (e) { setErr(errText(e)); }
  };

  if (phase === 'sent') {
    return (
      <div className="py-3 text-center">
        <p className="text-gold font-semibold">On its way ✓</p>
        <p className="text-muted text-xs mt-1.5">
          {needsDest ? `$${sendUsd} ${payoutIn} → ${short(dest)}` : `$${sendUsd} ${payoutIn} → your MiniPay wallet`}
        </p>
        <button onClick={() => { setPhase('idle'); setCode(''); }}
          className="text-muted text-xs mt-3 hover:text-ivory">Done</button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {/* What leaves, what it costs */}
      <div className="flex items-baseline justify-between">
        <div>
          <span className="text-ivory font-semibold text-2xl">${sendUsd}</span>
          <span className="text-muted text-xs ml-2">in {payoutIn} · you receive</span>
        </div>
        {gasOwed > 0 && (
          <span className="text-muted text-xs">${money(gasOwed)} network fee</span>
        )}
      </div>
      {needsDest && phase === 'idle' && (
        <div>
          <label className="text-muted text-xs uppercase tracking-wider">Send to</label>
          <input
            type="text" inputMode="text" autoComplete="off" spellCheck={false}
            placeholder="0x… Celo address (MiniPay → Receive)"
            value={dest} onChange={e => setDest(e.target.value)} disabled={busy}
            className="mt-1.5 w-full bg-bg-base border border-border rounded-lg px-3 py-2.5 font-mono text-sm text-ivory outline-none focus:border-gold transition-colors placeholder:text-muted disabled:opacity-40"
          />
          {dest.length > 0 && !destOk && <p className="text-red-400 text-xs mt-1">That doesn't look like a Celo address.</p>}
        </div>
      )}

      {needsDest && phase === 'code' && (
        <div>
          <label className="text-muted text-xs uppercase tracking-wider">Confirmation code</label>
          <input
            type="text" inputMode="numeric" autoComplete="one-time-code" maxLength={6}
            placeholder="6-digit code"
            value={code} onChange={e => setCode(e.target.value.replace(/\D/g, ''))} disabled={busy}
            className="mt-1.5 w-full bg-bg-base border border-border rounded-lg px-3 py-2.5 text-center tracking-[0.4em] text-lg text-ivory outline-none focus:border-gold transition-colors placeholder:text-muted placeholder:tracking-normal disabled:opacity-40"
          />
          <p className="text-muted text-xs mt-1.5">Code sent to {userEmail} · confirms {short(dest)}</p>
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
      {err && <p className="text-red-400 text-xs">{err}</p>}
    </div>
  );
}

// ── MiniPay deposit form (shared: first-funding page + funded Add money panel) ─
const MIN_DEPOSIT = 0.2; // low bar so MiniPay users with <$1 can still get in

function MiniPayDepositForm() {
  const { setTradingSession, chainBalances, walletAddress, connectInjected, refreshChainBalances } = useAuthStore();
  const [amt, setAmt]     = useState('1');   // string for smooth decimal entry
  const [asset, setAsset] = useState<AssetSymbol>('USDm');
  const [step, setStep]   = useState<string>();
  const [busy, setBusy]   = useState(false);
  const [err, setErr]     = useState<string>();
  const n = parseFloat(amt) || 0;

  // Detect what they hold up front and default to their richest stablecoin —
  // these users are guaranteed to have one of the three.
  const didInit = useRef(false);
  useEffect(() => {
    if (didInit.current) return;
    didInit.current = true;
    (async () => {
      if (!walletAddress) await connectInjected(true);
      await refreshChainBalances();
      const bals = useAuthStore.getState().chainBalances;
      if (bals) {
        const richest = (Object.entries(bals) as [AssetSymbol, number][])
          .sort((a, b) => b[1] - a[1])[0];
        if (richest && richest[1] > 0) setAsset(richest[0]);
      }
    })();
  }, [walletAddress, connectInjected, refreshChainBalances]);

  const held = chainBalances?.[asset] ?? null;

  const deposit = async () => {
    setBusy(true); setErr(undefined);
    try {
      const a = assetBySymbol(asset);
      setStep('Connecting…');
      const account = await connectWallet();
      const secret = newSecret();
      setStep('Confirm in your wallet…');
      await depositFromWallet(account, a, BigInt(toTokenBase(n, a.decimals)), commitmentOf(secret));
      setStep('Confirming on Celo…');
      const sess = await pollSession(secret);
      setTradingSession(sess.token, sess.wallet);
    } catch (e) { setErr(errText(e)); setStep(undefined); }
    setBusy(false);
  };

  const over     = held !== null && n > held;
  const tooSmall = n < MIN_DEPOSIT;

  return (
    <div className="flex flex-col gap-3">
      <div className="flex gap-2">
        {(['USDm', 'USDC', 'USDT'] as AssetSymbol[]).map(s => {
          const bal = chainBalances?.[s];
          return (
            <button key={s} onClick={() => setAsset(s)} disabled={busy}
              className={`flex-1 py-1.5 rounded-lg border transition-colors disabled:opacity-40 flex flex-col items-center gap-0.5 ${
                asset === s ? 'border-gold text-gold bg-gold/10' : 'border-border text-muted hover:text-ivory'}`}>
              <span className="flex items-center gap-1 text-xs font-semibold"><TokenIcon symbol={s} size={14} />{s}</span>
              {bal !== undefined && <span className="text-[10px] opacity-70 block">${bal.toFixed(2)}</span>}
            </button>
          );
        })}
      </div>

      <div className="flex items-center gap-2 bg-bg-base border border-border rounded-lg px-3 py-2 focus-within:border-gold transition-colors">
        <span className="text-gold text-xl font-semibold">$</span>
        <input type="number" inputMode="decimal" min={MIN_DEPOSIT} step={0.1} value={amt} disabled={busy}
          onChange={e => setAmt(e.target.value)}
          className="flex-1 bg-transparent text-ivory text-xl font-semibold outline-none w-full disabled:opacity-40" />
        {held !== null && held >= MIN_DEPOSIT && (
          <button onClick={() => setAmt(held.toFixed(2))} disabled={busy}
            className="text-xs text-gold font-semibold shrink-0 disabled:opacity-30">MAX</button>
        )}
      </div>

      <div className="flex gap-2">
        {[0.2, 0.5, 1, 5].map(p => (
          <button key={p} onClick={() => setAmt(String(p))} disabled={busy}
            className={`flex-1 py-2 text-sm font-semibold rounded-lg border transition-colors disabled:opacity-30 ${
              n === p ? 'border-gold text-gold bg-gold/10' : 'border-border text-ivory hover:border-gold'}`}>
            ${p}
          </button>
        ))}
      </div>

      <Button onClick={deposit} loading={busy} disabled={over || tooSmall} className="w-full">
        {over ? `Only $${held!.toFixed(2)} in ${asset}`
          : tooSmall ? `Minimum $${MIN_DEPOSIT.toFixed(2)}`
          : `Deposit $${n} in ${asset}`}
      </Button>
      {step && <p className="text-gold text-sm">{step}</p>}
      {err  && <p className="text-red-400 text-sm">{err}</p>}

      <a href={MINIPAY_ADD_CASH} target="_blank" rel="noopener"
        className="block text-center text-muted text-sm hover:text-ivory transition-colors">
        Top up with mobile money →
      </a>
    </div>
  );
}

// ── MiniPay: first deposit page (no balance yet) ──────────────────────────────
function MiniPayDeposit() {
  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="font-display text-ivory text-2xl font-bold mb-1">Add digital dollars</h1>
        <p className="text-muted text-sm">Deposit once to start playing.</p>
      </div>
      <div className="bg-bg-card border border-border rounded-xl p-5">
        <MiniPayDepositForm />
      </div>
    </div>
  );
}

// ── Email / PWA: auto-activate from loginToken ────────────────────────────────
function EmailActivate({ loginToken }: { loginToken: string }) {
  const { setTradingSession } = useAuthStore();
  type Phase = 'checking' | 'activating' | 'unfunded' | 'error';
  const [phase, setPhase]   = useState<Phase>('checking');
  const [addr, setAddr]     = useState<string>();
  const [copied, setCopied] = useState(false);
  const [err, setErr]       = useState<string>();

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
        <p className="text-muted text-sm">Buy with a card, or send stablecoins on Celo.</p>
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
      <p className="text-muted text-sm max-w-xs">Sign in with your email to see your balance and send your money.</p>
      <Button onClick={() => navigate('/login')} className="w-full max-w-xs">Sign in</Button>
    </div>
  );
}
