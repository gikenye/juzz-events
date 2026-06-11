// Cup-winner futures — the tradable surface between cups (and through the cup).
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { socket } from '../../lib/ws';
import { api } from '../../lib/api';
import type { FuturesRow } from '../../lib/types';
import { useAuthStore } from '../../store/authStore';
import { useTournamentStore } from '../../store/tournamentStore';
import { potentialPayout } from '../../lib/odds';
import { Button } from '../ui/Button';
import { useAgentNames } from './useAgentNames';

export function CupFuturesCard({ rows, title }: { rows: FuturesRow[]; title: string }) {
  const { user, balance, tradingToken } = useAuthStore();
  const nameOf = useAgentNames();
  const navigate = useNavigate();

  const [selected, setSelected] = useState<string | null>(null);
  const [stake, setStake] = useState('5.00');
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!pending) return;
    const off = [
      socket.on('trade_confirmed', () => {
        setPending(false);
        setError(null);
        setSelected(null);
        void useAuthStore.getState().refreshBalance();
        api.league().then(league => useTournamentStore.setState({ league })).catch(() => {});
      }),
      socket.on('error', (err) => {
        setPending(false);
        setError(err.code === 'WALLET_REQUIRED' ? 'Add funds to place a bet.'
          : (err.message || '').includes('insufficient') ? 'Not enough in your balance.'
          : (err.message || 'Trade failed.'));
      }),
    ];
    return () => off.forEach(f => f());
  }, [pending]);

  const open = rows.filter(r => !r.market.resolved);
  if (open.length === 0) return null;

  const place = (row: FuturesRow) => {
    if (!user) { navigate('/login'); return; }
    if (!tradingToken) { navigate('/wallet'); return; }
    const amount = parseFloat(stake) || 0;
    if (amount <= 0) { setError('Enter a valid stake.'); return; }
    if (amount > balance) { navigate('/wallet'); return; }
    const shares = +(amount / Math.max(row.market.yes_price, 0.02)).toFixed(2);
    if (shares <= 0) { setError('Minimum bet is $0.01.'); return; }
    setPending(true);
    setError(null);
    socket.trade('buy', row.market.market_id, shares, 'yes');
  };

  return (
    <div className="bg-bg-card border border-border rounded-xl p-4">
      <div className="flex items-baseline justify-between mb-2">
        <h3 className="font-display text-ivory text-sm font-semibold">Cup winner</h3>
        <span className="text-muted text-xs">{title}</span>
      </div>
      <div className="flex flex-col">
        {open.map(row => {
          const odds = +(1 / Math.max(row.market.yes_price, 0.01)).toFixed(2);
          const isSel = selected === row.agent_id;
          return (
            <div key={row.agent_id} className="border-b border-border last:border-0">
              <button
                className="w-full flex items-center justify-between py-2 text-sm"
                onClick={() => { setSelected(isSel ? null : row.agent_id); setError(null); }}
              >
                <span className="text-ivory">{nameOf(row.agent_id)}</span>
                <span className={`font-semibold tabular-nums px-2 py-0.5 rounded ${
                  isSel ? 'bg-gold/25 text-gold' : 'bg-black/30 text-gold'}`}>
                  {odds.toFixed(2)}x
                </span>
              </button>
              {isSel && (
                <div className="flex items-center gap-2 pb-3">
                  <div className="flex items-center bg-black/30 rounded-lg px-2 py-1.5 flex-1">
                    <span className="text-muted text-sm mr-1">$</span>
                    <input
                      value={stake}
                      onChange={e => { setStake(e.target.value); setError(null); }}
                      inputMode="decimal"
                      className="bg-transparent text-ivory text-sm w-full outline-none tabular-nums"
                    />
                  </div>
                  <Button size="sm" disabled={pending} onClick={() => place(row)}>
                    {pending ? '…' : `Win $${potentialPayout(parseFloat(stake) || 0, odds).toFixed(2)}`}
                  </Button>
                </div>
              )}
            </div>
          );
        })}
      </div>
      {error && <p className="text-red-400 text-xs mt-2">{error}</p>}
    </div>
  );
}
