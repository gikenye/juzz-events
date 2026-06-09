import { lazy, Suspense, useState } from 'react';
import { onrampEnabled, ASSETS, assetBySymbol, type AssetSymbol } from '../../lib/config';
import { useAuthStore } from '../../store/authStore';
import { api } from '../../lib/api';
import { connectWallet } from '../../lib/celo';
import { Modal } from '../ui/Modal';

// thirdweb only loads when the modal opens (code-split chunk).
const BuyCrypto = lazy(() => import('./BuyCrypto'));

const short = (a: string) => `${a.slice(0, 6)}…${a.slice(-4)}`;

// "Buy with card or crypto" → resolves the user's juzz wallet (the receiver), then opens
// the themed Buy Widget. Hidden entirely until a thirdweb client id is configured.
export function BuyFunds({ loginToken }: { loginToken?: string }) {
  const { isMiniPay, wallet } = useAuthStore();
  const [open, setOpen] = useState(false);
  const [receiver, setReceiver] = useState<string>();
  const [asset, setAsset] = useState<AssetSymbol>('USDC');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string>();

  if (!onrampEnabled) return null;

  const openBuy = async () => {
    setErr(undefined);
    setBusy(true);
    try {
      let r = wallet || undefined;
      if (!r && isMiniPay) r = await connectWallet();
      else if (!r && loginToken) r = (await api.walletRegister(loginToken)).safe;
      if (!r) throw new Error('Sign in first to add funds.');
      setReceiver(r);
      setOpen(true);
    } catch (e) {
      setErr(e instanceof Error ? e.message : String(e));
    }
    setBusy(false);
  };

  return (
    <>
      <button
        onClick={openBuy}
        disabled={busy}
        className="w-full py-3 rounded-lg border border-border text-ivory text-sm font-medium hover:border-gold transition-colors disabled:opacity-50"
      >
        {busy ? 'Preparing…' : 'Buy with card or crypto'}
      </button>
      {err && <p className="text-red-400 text-xs mt-2">{err}</p>}

      <Modal open={open && !!receiver} onClose={() => setOpen(false)} title="Add funds">
        <div className="flex gap-2 mb-3">
          {ASSETS.map(a => (
            <button key={a.symbol} onClick={() => setAsset(a.symbol)}
              className={`flex-1 py-1.5 text-xs font-semibold rounded-lg border transition-colors ${
                asset === a.symbol ? 'border-gold text-gold bg-gold/10' : 'border-border text-muted hover:text-ivory'}`}>
              {a.symbol}
            </button>
          ))}
        </div>
        <p className="font-mono text-ivory text-sm mb-4">{receiver && short(receiver)}</p>
        <Suspense fallback={<p className="text-muted text-sm py-6 text-center">Loading…</p>}>
          {receiver && (
            <BuyCrypto key={asset} receiverAddress={receiver} tokenAddress={assetBySymbol(asset).address}
              onDone={() => setOpen(false)} />
          )}
        </Suspense>
      </Modal>
    </>
  );
}
