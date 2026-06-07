import { lazy, Suspense, useMemo, useState } from 'react';
import { onrampEnabled } from '../../lib/config';
import { detectCountry } from '../../lib/region';
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
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string>();
  const country = useMemo(() => detectCountry(), []);

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
        <p className="text-muted text-sm mb-1">Funds arrive in your juzz wallet:</p>
        <p className="font-mono text-ivory text-sm mb-4">{receiver && short(receiver)}</p>
        <Suspense fallback={<p className="text-muted text-sm py-6 text-center">Loading…</p>}>
          {receiver && <BuyCrypto receiverAddress={receiver} country={country} onDone={() => setOpen(false)} />}
        </Suspense>
        <p className="text-muted text-[11px] mt-3">
          After it arrives, tap Deposit to move funds into play. Winnings withdraw back to this wallet.
        </p>
      </Modal>
    </>
  );
}
