import type { Agent } from '../../types';
import { useAuthStore } from '../../store/authStore';
import { useMarketStore } from '../../store/marketStore';
import { impliedOdds, potentialPayout } from '../../lib/odds';
import { Button } from '../ui/Button';
import { useNavigate } from 'react-router-dom';

interface BetSlipProps {
  agentA: Agent;
  agentB: Agent;
}

export function BetSlip({ agentA, agentB }: BetSlipProps) {
  const { user, balance, deductBalance } = useAuthStore();
  const { selectedOutcome, stakeAmount, probabilities, isMarketOpen, betError, setStake, placeBet, bets, matchId } = useMarketStore();
  const navigate = useNavigate();

  const stake = parseFloat(stakeAmount) || 0;
  const selectedAgent = selectedOutcome === 'a' ? agentA : selectedOutcome === 'b' ? agentB : null;
  const selectedProb = selectedOutcome ? probabilities[selectedOutcome] : null;
  const payout = selectedProb && stake > 0 ? potentialPayout(stake, impliedOdds(selectedProb)) : 0;

  const handlePlace = () => {
    if (!user) { navigate('/login'); return; }
    placeBet(balance, deductBalance);
  };

  const matchBets = bets.filter(b => b.matchId === matchId);

  return (
    <div className="bg-bg-card rounded-xl border border-border p-3 flex flex-col gap-3">
      {/* Header row */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h3 className="font-display text-ivory text-xs font-semibold uppercase tracking-wider">Your call</h3>
          {!selectedAgent && (
            <span className="text-[11px] italic text-muted/60 tracking-wide">— pick a side above</span>
          )}
          {selectedAgent && (
            <span
              className="text-xs font-semibold px-2 py-0.5 rounded-full"
              style={{ background: selectedAgent.color + '33', color: selectedAgent.color }}
            >
              {selectedAgent.name}
            </span>
          )}
        </div>
        <span className="text-muted text-xs">${balance.toFixed(2)}</span>
      </div>

      {/* Quick amounts */}
      <div className="flex gap-1.5">
        {[1, 2, 5, 10].map(amt => (
          <button
            key={amt}
            onClick={() => setStake(amt.toFixed(2))}
            disabled={!isMarketOpen}
            className={`flex-1 py-2 text-sm font-semibold rounded-lg border transition-colors disabled:opacity-40 ${
              parseFloat(stakeAmount) === amt
                ? 'border-gold text-gold bg-gold/10'
                : 'border-border text-ivory hover:border-gold hover:text-gold'
            }`}
          >
            ${amt}
          </button>
        ))}
      </div>

      {/* Input + payout inline */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted text-sm">$</span>
          <input
            type="number"
            min="0.01"
            step="0.01"
            placeholder="0.00"
            value={stakeAmount}
            onChange={e => setStake(e.target.value)}
            disabled={!isMarketOpen}
            className="w-full bg-bg-surface border border-border rounded-lg pl-7 pr-3 py-2 text-ivory text-sm font-semibold outline-none focus:border-gold transition-colors placeholder:text-muted disabled:opacity-50"
          />
        </div>
        {selectedProb && stake > 0 && (
          <div className="flex gap-3 shrink-0">
            <div className="text-right">
              <div className="text-xs text-muted">Odds</div>
              <div className="text-sm font-semibold text-ivory">×{impliedOdds(selectedProb).toFixed(2)}</div>
            </div>
            <div className="text-right">
              <div className="text-xs text-muted">To win</div>
              <div className="text-sm font-semibold text-gold">${payout.toFixed(2)}</div>
            </div>
          </div>
        )}
      </div>

      {/* Error */}
      {betError && <p className="text-red-400 text-xs">{betError}</p>}

      <Button
        variant="gold"
        size="md"
        className="w-full"
        disabled={!isMarketOpen || !selectedOutcome || !stakeAmount}
        onClick={handlePlace}
      >
        {!isMarketOpen ? 'Predictions Closed' : !user ? 'Login to Predict' : 'Lock In Prediction'}
      </Button>

      {/* This match's predictions */}
      {matchBets.length > 0 && (
        <div className="border-t border-border pt-2">
          <p className="text-muted text-xs mb-1.5">Your predictions this match</p>
          {matchBets.map(b => (
            <div key={b.id} className="flex justify-between text-xs py-0.5">
              <span className="text-ivory">{b.pick}</span>
              <span className="text-muted">
                ${b.stake.toFixed(2)}
                {b.settled && (b.won ? <span className="text-green-400 ml-1">won</span> : <span className="text-red-400 ml-1">lost</span>)}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
