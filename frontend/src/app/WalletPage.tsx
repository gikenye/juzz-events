import { useState } from 'react';
import { motion } from 'framer-motion';
import { useAuthStore } from '../store/authStore';
import { useMarketStore } from '../store/marketStore';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';

export function WalletPage() {
  const { user, balance, addBalance, deductBalance } = useAuthStore();
  const { bets } = useMarketStore();
  const [showDeposit, setShowDeposit] = useState(false);
  const [showWithdraw, setShowWithdraw] = useState(false);
  const [amount, setAmount] = useState('');
  const [txMsg, setTxMsg] = useState('');

  const handleDeposit = () => {
    const n = parseFloat(amount);
    if (!n || n <= 0) return;
    addBalance(n);
    setTxMsg(`Deposited $${n.toFixed(2)}`);
    setAmount('');
    setShowDeposit(false);
  };

  const handleWithdraw = () => {
    const n = parseFloat(amount);
    if (!n || n <= 0) return;
    if (n > balance) { setTxMsg('Insufficient balance.'); return; }
    deductBalance(n);
    setTxMsg(`Withdrawn $${n.toFixed(2)}`);
    setAmount('');
    setShowWithdraw(false);
  };

  return (
    <div className="min-h-screen bg-bg-base">
      <div className="max-w-2xl mx-auto px-4 py-12">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="font-display text-ivory text-3xl font-bold mb-2">Wallet</h1>
          <p className="text-muted text-sm mb-8">{user ? user.email : 'Guest account'}</p>

          {/* Balance card */}
          <div
            className="rounded-2xl border border-gotham/30 p-8 mb-6 relative overflow-hidden"
            style={{ background: 'linear-gradient(135deg, #00B4A615 0%, #141418 60%)' }}
          >
            <div className="text-muted text-sm uppercase tracking-wider mb-2">Available Balance</div>
            <div className="font-display text-5xl font-bold text-ivory mb-1">
              {balance.toFixed(2)}
              <span className="text-gotham text-2xl ml-2">USD</span>
            </div>
            <div className="text-muted text-xs mt-2">Celo Dollar · Testnet</div>
          </div>

          {/* Actions */}
          <div className="grid grid-cols-2 gap-4 mb-8">
            <Button size="lg" variant="gotham" onClick={() => { setShowDeposit(true); setAmount(''); setTxMsg(''); }}>
              ↓ Deposit
            </Button>
            <Button size="lg" variant="ghost" onClick={() => { setShowWithdraw(true); setAmount(''); setTxMsg(''); }}>
              ↑ Withdraw
            </Button>
          </div>

          {txMsg && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6 py-3 px-4 rounded-lg bg-green-900/20 border border-green-700/50 text-green-400 text-sm"
            >
              ✓ {txMsg}
            </motion.div>
          )}

          {/* Bet history */}
          <div className="bg-bg-card border border-border rounded-xl p-6">
            <h2 className="font-display text-ivory font-semibold mb-4">Bet History</h2>
            {bets.length === 0 ? (
              <p className="text-muted text-sm">No bets placed yet.</p>
            ) : (
              <div className="flex flex-col gap-2">
                {[...bets].reverse().map(b => (
                  <div key={b.id} className="flex justify-between items-center py-2 border-b border-border last:border-0">
                    <div>
                      <span className="text-ivory text-sm capitalize">{b.outcome}</span>
                      <span className="text-muted text-xs ml-2">@ {b.odds.toFixed(2)}×</span>
                    </div>
                    <div className="text-right">
                      <div className="text-ivory text-sm">${b.stake.toFixed(2)}</div>
                      <div className="text-muted text-xs">{new Date(b.timestamp).toLocaleTimeString()}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </motion.div>
      </div>

      {/* Deposit modal */}
      <Modal open={showDeposit} onClose={() => setShowDeposit(false)} title="Deposit">
        <div className="flex flex-col gap-4">
          <p className="text-muted text-sm">Enter the amount you want to deposit (stub — no real transaction).</p>
          <input
            type="number"
            min="0.01"
            placeholder="0.00"
            value={amount}
            onChange={e => setAmount(e.target.value)}
            className="bg-bg-surface border border-border rounded-lg px-4 py-3 text-ivory outline-none focus:border-gold transition-colors"
          />
          <Button onClick={handleDeposit} className="w-full">Deposit</Button>
        </div>
      </Modal>

      {/* Withdraw modal */}
      <Modal open={showWithdraw} onClose={() => setShowWithdraw(false)} title="Withdraw">
        <div className="flex flex-col gap-4">
          <p className="text-muted text-sm">Available: ${balance.toFixed(2)}</p>
          <input
            type="number"
            min="0.01"
            max={balance}
            placeholder="0.00"
            value={amount}
            onChange={e => setAmount(e.target.value)}
            className="bg-bg-surface border border-border rounded-lg px-4 py-3 text-ivory outline-none focus:border-gold transition-colors"
          />
          <Button onClick={handleWithdraw} variant="ghost" className="w-full">Withdraw</Button>
        </div>
      </Modal>
    </div>
  );
}
