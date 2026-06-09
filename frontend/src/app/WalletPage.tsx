import { useEffect, useState, type ReactNode } from 'react';
import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { api, ApiError } from '../lib/api';
import { newSecret, commitmentOf } from '../lib/secret';
import { connectWallet, depositFromWallet, tokenBalance } from '../lib/celo';
import { MINIPAY_ADD_CASH } from '../lib/config';
import type { Position } from '../lib/types';
import { ASSETS, assetBySymbol, type Asset, type AssetSymbol } from '../lib/config';
import { Button } from '../components/ui/Button';

const PRESETS = [1, 2, 5, 10]; // dollars
// Ledger amounts (balance, withdraw) are canonical µ$ (6dp); on-chain deposit amounts are
// in the chosen token's own base units.
const toMicro = (usd: number) => BigInt(Math.round(usd * 1e6)).toString();
const toTokenBase = (usd: number, decimals: number) => BigInt(Math.round(usd * 10 ** decimals)).toString();
const money = (micro: string) => (Number(micro) / 1e6).toFixed(2);
const short = (a: string) => `${a.slice(0, 6)}…${a.slice(-4)}`;
const apiAsset = (a: Asset) => a.symbol.toUpperCase() as 'USDC' | 'USDT' | 'USDM';
const errText = (e: unknown) => (e instanceof Error ? e.message : String(e));

// Celo stablecoin marks — brand colours, no external image deps (reliable + instant).
const TOKEN_MARK: Record<string, { bg: string; fg: string; glyph: string }> = {
  USDC: { bg: '#2775CA', fg: '#fff', glyph: '$' },   // Circle blue
  USDT: { bg: '#26A17B', fg: '#fff', glyph: '₮' },   // Tether green
  USDm: { bg: '#FCFF52', fg: '#000', glyph: 'm' },   // Celo yellow
};
function TokenIcon({ symbol, size = 18 }: { symbol: string; size?: number }) {
  const m = TOKEN_MARK[symbol] ?? { bg: '#5b5b6b', fg: '#fff', glyph: symbol[0] };
  return (
    <span style={{ width: size, height: size, background: m.bg, color: m.fg, fontSize: size * 0.6 }}
      className="inline-flex items-center justify-center rounded-full font-bold leading-none shrink-0">
      {m.glyph}
    </span>
  );
}

// Stablecoin picker. `only` restricts the choices.
function AssetTabs({ value, onChange, only, disabled }: {
  value: AssetSymbol; onChange: (s: AssetSymbol) => void; only?: AssetSymbol[]; disabled?: boolean;
}) {
  const opts = only ? ASSETS.filter(a => only.includes(a.symbol)) : ASSETS;
  if (opts.length < 2) return null;
  return (
    <div className="flex gap-2 mb-3">
      {opts.map(a => (
        <button key={a.symbol} onClick={() => onChange(a.symbol)} disabled={disabled}
          className={`flex-1 py-1.5 text-xs font-semibold rounded-lg border transition-colors disabled:opacity-40 flex items-center justify-center gap-1.5 ${
            value === a.symbol ? 'border-gold text-gold bg-gold/10' : 'border-border text-muted hover:text-ivory'}`}>
          <TokenIcon symbol={a.symbol} size={16} /> {a.symbol}
        </button>
      ))}
    </div>
  );
}

// Poll deposit-as-auth: the secret claims a trading session once the deposit confirms.
async function pollSession(secret: `0x${string}`, tries = 30): Promise<{ token: string; wallet: string }> {
  for (let i = 0; i < tries; i++) {
    try { return await api.session(secret); }
    catch (e) { if (!(e instanceof ApiError && e.status === 404)) throw e; }
    await new Promise(r => setTimeout(r, 3000));
  }
  throw new Error('Deposit not yet confirmed — it can take a minute. Check back shortly.');
}

export function WalletPage() {
  const { user, loginToken, tradingToken, wallet, isMiniPay, detectMiniPay } = useAuthStore();
  useEffect(() => { detectMiniPay(); }, [detectMiniPay]);

  let body;
  if (tradingToken && wallet) body = <WalletHome />;
  else if (isMiniPay) body = <MiniPayFund />;
  else if (user && loginToken) body = <EmailFund loginToken={loginToken} />;
  else body = <SignInPrompt />;

  return (
    <div className="min-h-screen bg-bg-base">
      <div className="max-w-2xl mx-auto px-4 py-12">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="font-display text-ivory text-3xl font-bold mb-2">Wallet</h1>
          <p className="text-muted text-sm mb-8">{user ? user.email : 'Guest'}</p>
          {body}
        </motion.div>
      </div>
    </div>
  );
}

// ── funded: balance · withdraw · positions ──────────────────────────────────
function WalletHome() {
  const { wallet, tradingToken, balance, refreshBalance, logout } = useAuthStore();
  const [locked, setLocked] = useState('0');
  const [pos, setPos] = useState<Position[]>([]);
  const [amt, setAmt] = useState(5);
  const [asset, setAsset] = useState<AssetSymbol>('USDC');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string>();

  const refresh = () => {
    if (!wallet) return;
    void refreshBalance();
    api.balance(wallet).then(b => setLocked(b.locked)).catch(() => {});
    api.positions(wallet).then(setPos).catch(() => {});
  };
  useEffect(refresh, [wallet]); // eslint-disable-line react-hooks/exhaustive-deps

  const withdraw = async () => {
    if (!tradingToken) return;
    setBusy(true); setMsg(undefined);
    try {
      await api.withdraw(tradingToken, toMicro(amt), apiAsset(assetBySymbol(asset)));
      setMsg(`Withdrawal of $${amt} in ${asset} is on its way to your wallet.`);
      setTimeout(refresh, 1500);
    } catch (e) { setMsg(errText(e)); }
    setBusy(false);
  };

  return (
    <div className="flex flex-col gap-5">
      <div className="rounded-2xl border border-gotham/30 p-8" style={{ background: 'linear-gradient(135deg, #00B4A615 0%, #141418 60%)' }}>
        <div className="flex items-center justify-between">
          <div className="text-muted text-sm uppercase tracking-wider">Available</div>
          <button onClick={logout} className="text-muted text-xs hover:text-ivory transition-colors">sign out</button>
        </div>
        <div className="font-display text-5xl font-bold text-ivory mt-2">
          {balance.toFixed(2)}<span className="text-gotham text-2xl ml-2">USD</span>
        </div>
        <div className="text-muted text-xs mt-2">
          {wallet && short(wallet)}{Number(locked) > 0 ? ` · $${money(locked)} in play` : ''}
        </div>
      </div>

      <div className="bg-bg-card border border-border rounded-xl p-6">
        <h2 className="font-display text-ivory font-semibold mb-3">Cash out</h2>
        <AssetTabs value={asset} onChange={setAsset} disabled={busy} />
        <div className="grid grid-cols-4 gap-2 mb-4">
          {PRESETS.map(p => (
            <button key={p} onClick={() => setAmt(p)}
              className={`py-2 text-sm font-semibold rounded-lg border transition-colors ${amt === p ? 'border-gold text-gold bg-gold/10' : 'border-border text-ivory hover:border-gold'}`}>
              ${p}
            </button>
          ))}
        </div>
        <Button onClick={withdraw} disabled={busy} variant="ghost" className="w-full" loading={busy}>
          {busy ? 'Requesting…' : `Withdraw $${amt} in ${asset}`}
        </Button>
        {msg && <p className="text-gold text-sm mt-2">{msg}</p>}
      </div>

      <div className="bg-bg-card border border-border rounded-xl p-6">
        <h2 className="font-display text-ivory font-semibold mb-3">Open positions</h2>
        {pos.length ? (
          <div className="flex flex-col gap-2">
            {pos.map(p => (
              <div key={p.market_id} className="flex justify-between border-b border-border pb-2 text-sm last:border-0">
                <span className="text-muted">{short(p.market_id)}</span>
                <span className="text-ivory">
                  {p.yes_shares > 0 && <span className="text-gotham">{p.yes_shares.toFixed(0)} YES</span>}
                  {p.no_shares > 0 && <span className="text-maxi"> {p.no_shares.toFixed(0)} NO</span>}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-muted text-sm">No open positions yet. <Link to="/game" className="text-gold">Watch a game →</Link></p>
        )}
      </div>
    </div>
  );
}

// ── MiniPay: connect injected wallet → deposit-as-auth ───────────────────────
function MiniPayFund() {
  const { setTradingSession } = useAuthStore();
  const [amt, setAmt] = useState(2);
  const [asset, setAsset] = useState<AssetSymbol>('USDC');
  const [step, setStep] = useState<string>();
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string>();

  const fund = async () => {
    setBusy(true); setErr(undefined);
    try {
      const a = assetBySymbol(asset);
      setStep('Connecting…');
      const account = await connectWallet();
      const secret = newSecret();
      setStep(`Confirm the ${asset} deposit in your wallet…`);
      await depositFromWallet(account, a, BigInt(toTokenBase(amt, a.decimals)), commitmentOf(secret));
      setStep('Confirming on Celo…');
      const sess = await pollSession(secret);
      setTradingSession(sess.token, sess.wallet);
    } catch (e) { setErr(errText(e)); setStep(undefined); }
    setBusy(false);
  };

  return (
    <div className="flex flex-col gap-3">
      <FundCard amt={amt} setAmt={setAmt} busy={busy} step={step} err={err}
        top={<AssetTabs value={asset} onChange={setAsset} disabled={busy} />}
        cta={`Deposit $${amt} in ${asset}`} onFund={fund} />
      <a href={MINIPAY_ADD_CASH} target="_blank" rel="noopener"
        className="block text-center text-muted text-sm hover:text-ivory transition-colors">
        Top up with mobile money →
      </a>
    </div>
  );
}

// ── PWA: juzz-managed Safe → server-signed deposit (email-OTP authorized) ─────
function EmailFund({ loginToken }: { loginToken: string }) {
  const { setTradingSession } = useAuthStore();
  const [safe, setSafe] = useState<string>();
  const [bal, setBal] = useState<Record<string, bigint>>({});
  const [copied, setCopied] = useState(false);
  const [amt, setAmt] = useState(2);
  const [asset, setAsset] = useState<AssetSymbol>('USDC');
  const [step, setStep] = useState<string>();
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string>();

  // Provision the deposit Safe and read its on-chain token balances.
  const loadBalances = async (addr: string) => {
    const entries = await Promise.all(ASSETS.map(async a =>
      [a.symbol, await tokenBalance(addr as `0x${string}`, a.address as `0x${string}`)] as const));
    const b = Object.fromEntries(entries);
    setBal(b);
    // Default the deposit to whichever token the wallet actually holds.
    const funded = ASSETS.find(a => (b[a.symbol] ?? 0n) > 0n);
    if (funded) setAsset(funded.symbol);
  };
  useEffect(() => {
    let live = true;
    (async () => {
      try {
        const { safe } = await api.walletRegister(loginToken);
        if (!live) return;
        setSafe(safe);
        await loadBalances(safe);
      } catch (e) { if (live) setErr(errText(e)); }
    })();
    return () => { live = false; };
  }, [loginToken]);

  const balOf = (sym: AssetSymbol) =>
    (Number(bal[sym] ?? 0n) / 10 ** assetBySymbol(sym).decimals).toFixed(2);

  const copy = () => { if (safe) { navigator.clipboard?.writeText(safe); setCopied(true); setTimeout(() => setCopied(false), 1500); } };

  const fund = async () => {
    setBusy(true); setErr(undefined);
    try {
      const secret = newSecret();
      setStep('Depositing…');
      await api.walletDeposit(loginToken, asset, toTokenBase(amt, assetBySymbol(asset).decimals), secret);
      setStep('Confirming on Celo…');
      const sess = await pollSession(secret);
      setTradingSession(sess.token, sess.wallet);
    } catch (e) { setErr(errText(e)); setStep(undefined); }
    setBusy(false);
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="bg-bg-card border border-border rounded-xl p-5">
        <div className="text-muted text-xs uppercase tracking-wider mb-2">Your deposit address · Celo</div>
        {safe ? (
          <button onClick={copy} className="font-mono text-ivory text-sm break-all text-left hover:text-gold transition-colors">
            {safe} <span className="text-gold">{copied ? '✓' : '⧉'}</span>
          </button>
        ) : <p className="text-muted text-sm">Setting up…</p>}
        {safe && (
          <div className="flex gap-4 mt-3 text-xs">
            {ASSETS.map(a => (
              <span key={a.symbol} className="flex items-center gap-1.5">
                <TokenIcon symbol={a.symbol} size={14} />
                <span className="text-ivory font-semibold">{balOf(a.symbol)}</span>
              </span>
            ))}
          </div>
        )}
      </div>

      <FundCard amt={amt} setAmt={setAmt} busy={busy || !safe} step={step} err={err}
        top={<AssetTabs value={asset} onChange={setAsset} disabled={busy} />}
        cta={`Add $${amt} in ${asset}`} onFund={fund} />
    </div>
  );
}

function SignInPrompt() {
  const navigate = useNavigate();
  return (
    <div className="bg-bg-card border border-border rounded-xl p-8 text-center">
      <p className="text-ivory mb-1 font-medium">Sign in to fund your wallet</p>
      <p className="text-muted text-sm mb-5">Email a code or use a passkey — no deposit needed to sign in.</p>
      <Button onClick={() => navigate('/login')} className="w-full">Sign in</Button>
    </div>
  );
}

function FundCard({ amt, setAmt, busy, step, err, cta, onFund, disabled, top }: {
  amt: number; setAmt: (n: number) => void; busy: boolean; step?: string; err?: string;
  cta: string; onFund: () => void; disabled?: boolean; top?: ReactNode;
}) {
  return (
    <div className="bg-bg-card border border-border rounded-xl p-6">
      <h2 className="font-display text-ivory font-semibold mb-3">Add funds</h2>
      {top}
      <div className="flex items-center gap-2 mb-3 bg-bg-base border border-border rounded-lg px-3 py-2 focus-within:border-gold transition-colors">
        <span className="text-gold text-xl font-semibold">$</span>
        <input type="number" inputMode="decimal" min={0.01} step={0.01} value={amt} disabled={busy}
          onChange={e => setAmt(Math.max(0, Number(e.target.value) || 0))}
          className="flex-1 bg-transparent text-ivory text-xl font-semibold outline-none w-full disabled:opacity-40" />
      </div>
      <div className="grid grid-cols-4 gap-2 mb-4">
        {PRESETS.map(p => (
          <button key={p} onClick={() => setAmt(p)} disabled={busy}
            className={`py-2 text-sm font-semibold rounded-lg border transition-colors disabled:opacity-40 ${amt === p ? 'border-gold text-gold bg-gold/10' : 'border-border text-ivory hover:border-gold'}`}>
            ${p}
          </button>
        ))}
      </div>
      <Button onClick={onFund} disabled={busy || disabled} loading={busy} className="w-full">{cta}</Button>
      {step && <p className="text-gold text-sm mt-3">{step}</p>}
      {err && <p className="text-red-400 text-sm mt-3">{err}</p>}
    </div>
  );
}
