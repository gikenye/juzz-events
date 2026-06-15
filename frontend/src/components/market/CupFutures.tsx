// Pre-bet the cup: stake on who wins the whole tournament before/while matches
// play. These are real LMSR "Will Agent X win the cup?" markets from /league —
// a YES buy is a server trade; payout lands via the global settlement banner.
import { useEffect, useState } from 'react';
import { useTournamentStore } from '../../store/tournamentStore';
import { useAuthStore } from '../../store/authStore';
import { getAgent, fallbackAgent } from '../../lib/agents';
import { impliedOdds, potentialPayout } from '../../lib/odds';
import { socket } from '../../lib/ws';
import { AgentAvatar } from '../chess/AgentAvatar';

const AMOUNTS = [1, 5, 10, 25];
const short = (n: string) => n.replace(/^Agent\s+/i, '');

export function CupFutures() {
  const futures = useTournamentStore(s => s.league?.futures) ?? [];
  const { balance, tradingToken } = useAuthStore();
  const [picked, setPicked] = useState<string | null>(null); // market_id
  const [stake, setStake] = useState('5');
  const [phase, setPhase] = useState<'idle' | 'pending' | 'placed'>('idle');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const offOk = socket.on('trade_confirmed', () => setPhase(p => (p === 'pending' ? 'placed' : p)));
    const offErr = socket.on('error', (e: { message?: string }) =>
      setPhase(p => { if (p === 'pending') { setError(e?.message ?? 'Bet failed'); return 'idle'; } return p; }));
    return () => { offOk?.(); offErr?.(); };
  }, []);

  if (!futures || futures.length === 0) return null;

  const rows = futures
    .map(f => ({ ...f, agent: getAgent(f.agent_id) ?? fallbackAgent(f.agent_id) }))
    .sort((a, b) => b.market.yes_price - a.market.yes_price);
  const sel = rows.find(r => r.market.market_id === picked) ?? null;

  const place = () => {
    setError(null);
    if (!sel) { setError('Pick an agent first.'); return; }
    if (!tradingToken) { setError('Add funds to place a bet.'); return; }
    const amt = parseFloat(stake);
    if (!amt || amt <= 0) { setError('Enter a stake.'); return; }
    if (amt > balance) { setError('Insufficient balance.'); return; }
    const shares = +(amt / Math.max(sel.market.yes_price, 0.02)).toFixed(2);
    setPhase('pending');
    socket.trade('buy', sel.market.market_id, shares, 'yes');
  };

  const win = sel ? potentialPayout(parseFloat(stake) || 0, impliedOdds(sel.market.yes_price)) : 0;

  return (
    <div className="flex flex-col gap-0 relative" style={{
      background: 'rgba(18,6,2,0.88)', border: '1px solid rgba(255,60,0,0.30)', borderRadius: 2,
      boxShadow: '0 0 40px rgba(255,60,0,0.15), inset 0 0 60px rgba(0,0,0,0.4)',
    }}>
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: 'linear-gradient(90deg, transparent, #FF3300AA, #FFBE0088, transparent)' }} />
      <div className="flex flex-col gap-4 p-4 pt-5">
        <div>
          <h2 style={{ fontFamily: "'Inter', sans-serif", color: '#FFBE00', fontSize: 13, fontWeight: 700, letterSpacing: 2, textShadow: '0 0 20px rgba(255,120,0,0.6)' }}>
            Who lifts the trophy?
          </h2>
          <p className="text-muted text-[11px] mt-1">Pre-bet the cup winner — pays out when the final ends.</p>
        </div>

        {phase === 'placed' ? (
          <div className="text-center py-3">
            <div className="text-gold font-display font-semibold">Bet placed ♛</div>
            <p className="text-muted text-xs mt-1">You're in on {short(sel?.agent.name ?? '')} to win the cup. Track it in your wallet.</p>
            <button onClick={() => { setPhase('idle'); setPicked(null); }} className="mt-3 text-xs text-gold hover:underline">Place another →</button>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-2">
              {rows.map(r => {
                const on = r.market.market_id === picked;
                return (
                  <button key={r.market.market_id} onClick={() => setPicked(r.market.market_id)}
                    className="flex items-center gap-2 rounded-lg px-2.5 py-2 transition-all text-left"
                    style={{
                      background: on ? 'rgba(255,60,0,0.12)' : 'rgba(255,255,255,0.03)',
                      border: `1px solid ${on ? 'rgba(255,120,0,0.55)' : 'rgba(255,255,255,0.07)'}`,
                    }}>
                    <AgentAvatar agent={r.agent} className="w-7 h-7 shrink-0" />
                    <div className="min-w-0 flex-1">
                      <div className="text-ivory text-xs font-semibold truncate">{short(r.agent.name)}</div>
                      <div className="text-[10px]" style={{ color: on ? '#FFBE00' : '#9A9AAF' }}>×{impliedOdds(r.market.yes_price).toFixed(2)}</div>
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="flex gap-2">
              {AMOUNTS.map(a => (
                <button key={a} onClick={() => setStake(String(a))}
                  className="flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all"
                  style={{
                    background: stake === String(a) ? 'rgba(255,60,0,0.14)' : 'rgba(255,255,255,0.03)',
                    border: `1px solid ${stake === String(a) ? 'rgba(255,120,0,0.5)' : 'rgba(255,255,255,0.08)'}`,
                    color: stake === String(a) ? '#FFBE00' : '#C8B48A',
                  }}>${a}</button>
              ))}
            </div>

            {error && <p className="text-red-400 text-xs">{error}</p>}

            <button onClick={place} disabled={!sel || phase === 'pending'}
              className="py-3 rounded-lg font-display font-semibold uppercase tracking-wider text-sm transition-all disabled:opacity-50"
              style={{ background: sel ? 'linear-gradient(135deg, #9B1C1C, #FF6A00)' : 'rgba(80,60,28,0.5)', color: sel ? '#0C0805' : '#A08B6A' }}>
              {phase === 'pending' ? 'Placing…'
                : sel ? `Bet $${stake || 0} on ${short(sel.agent.name)} · win $${win.toFixed(2)}`
                : 'Pick an agent'}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
