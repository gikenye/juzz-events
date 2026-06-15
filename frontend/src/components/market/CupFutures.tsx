// Pre-bet the cup: stake on who wins the whole tournament before/while matches
// play. Real LMSR "Will Agent X win the cup?" markets from /league, placed via
// socket.trade — and it reuses the arena BetForm so amount inputs, error handling
// and the deposit flow are identical to the live arena bet slip.
import { useEffect, useState } from 'react';
import { useTournamentStore } from '../../store/tournamentStore';
import { useAuthStore } from '../../store/authStore';
import { getAgent, fallbackAgent } from '../../lib/agents';
import { impliedOdds } from '../../lib/odds';
import { socket } from '../../lib/ws';
import { AgentAvatar } from '../chess/AgentAvatar';
import { BetForm } from './BetForm';

const short = (n: string) => n.replace(/^Agent\s+/i, '');

export function CupFutures() {
  const futures = useTournamentStore(s => s.league?.futures) ?? [];
  const { balance, tradingToken } = useAuthStore();
  const [picked, setPicked] = useState<string | null>(null); // market_id
  const [stake, setStake] = useState('1.00');
  const [pending, setPending] = useState(false);
  const [placedName, setPlacedName] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const offOk = socket.on('trade_confirmed', () =>
      setPending(p => { if (p) { setPlacedName(n => n); } return false; }));
    const offErr = socket.on('error', (e: { message?: string }) =>
      setPending(p => { if (p) setError(e?.message ?? 'Bet failed'); return false; }));
    return () => { offOk?.(); offErr?.(); };
  }, []);

  if (!futures || futures.length === 0) return null;

  const rows = futures
    .map(f => ({ ...f, agent: getAgent(f.agent_id) ?? fallbackAgent(f.agent_id) }))
    .sort((a, b) => b.market.yes_price - a.market.yes_price);
  const sel = rows.find(r => r.market.market_id === picked) ?? null;
  const view = sel ? { label: short(sel.agent.name), prob: sel.market.yes_price } : null;

  const place = () => {
    if (!sel) return;
    const amt = parseFloat(stake);
    if (!amt || amt <= 0) { setError('Enter a stake.'); return; }
    const shares = +(amt / Math.max(sel.market.yes_price, 0.02)).toFixed(2);
    setError(null);
    setPlacedName(short(sel.agent.name));
    setPending(true);
    socket.trade('buy', sel.market.market_id, shares, 'yes');
  };

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

        {placedName && !pending && !error ? (
          <div className="text-center py-3">
            <div className="font-display font-semibold" style={{ color: '#FFBE00' }}>Bet placed ♛</div>
            <p className="text-muted text-xs mt-1">You're in on {placedName} to win the cup. Track it in your wallet.</p>
            <button onClick={() => { setPlacedName(null); setPicked(null); }} className="mt-3 text-xs hover:underline" style={{ color: '#FFBE00' }}>Place another →</button>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-2">
              {rows.map(r => {
                const on = r.market.market_id === picked;
                return (
                  <button key={r.market.market_id} onClick={() => { setPicked(r.market.market_id); setError(null); }}
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

            <BetForm
              balance={balance}
              tradingToken={tradingToken}
              stake={stake}
              setStake={setStake}
              view={view}
              error={error}
              pending={pending}
              onPlace={place}
              pickHint="— pick an agent above"
              placeLabel="Back to win the cup"
            />
          </>
        )}
      </div>
    </div>
  );
}
