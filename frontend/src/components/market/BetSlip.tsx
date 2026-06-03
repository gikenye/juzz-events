import { useAuthStore } from '../../store/authStore';
import { useMarketStore } from '../../store/marketStore';
import { probabilitiesToOdds, potentialPayout } from '../../lib/odds';
import { Button } from '../ui/Button';
import { useNavigate } from 'react-router-dom';

export function BetSlip() {
  const { user, balance, deductBalance } = useAuthStore();
  const { selectedOutcome, stakeAmount, probabilities, isMarketOpen, betError, setStake, placeBet, bets } = useMarketStore();
  const navigate = useNavigate();

  const odds = probabilitiesToOdds(probabilities);
  const stake = parseFloat(stakeAmount) || 0;
  const payout = selectedOutcome && stake > 0 ? potentialPayout(stake, odds[selectedOutcome]) : 0;

  const handlePlace = () => {
    if (!user) { navigate('/login'); return; }
    placeBet(balance, deductBalance);
  };

  const outcomeLabel: Record<string, string> = { maxi: 'Agent Maxi', draw: 'Draw', gotham: 'Agent Gotham' };
  const selectedOdds = selectedOutcome ? odds[selectedOutcome] : null;

  return (
    <div className="bg-bg-card rounded-xl border border-border p-3 flex flex-col gap-3">
      {/* Header row */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h3 className="font-display text-ivory text-xs font-semibold uppercase tracking-wider">Stake</h3>
          {selectedOutcome && (
            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
              selectedOutcome === 'maxi' ? 'bg-maxi/20 text-maxi' :
              selectedOutcome === 'gotham' ? 'bg-gotham/20 text-gotham' :
              'bg-gold/20 text-gold'
            }`}>
              {outcomeLabel[selectedOutcome]}
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
            onClick={() => setStake(String(amt))}
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

      {/* Input + odds/payout inline */}
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
        {selectedOdds && stake > 0 && (
          <div className="text-right shrink-0">
            <div className="text-xs text-muted">×{selectedOdds.toFixed(2)}</div>
            <div className="text-sm font-semibold text-gold">${payout.toFixed(2)}</div>
          </div>
        )}
      </div>

      {/* Error */}
      {betError && <p className="text-red-400 text-xs">{betError}</p>}

      <Button
        variant={selectedOutcome === 'maxi' ? 'maxi' : selectedOutcome === 'gotham' ? 'gotham' : 'gold'}
        size="md"
        className="w-full"
        disabled={!isMarketOpen || !selectedOutcome || !stakeAmount}
        onClick={handlePlace}
      >
        {!isMarketOpen ? 'Market Closed' : !user ? 'Login to Bet' : 'Confirm Bet'}
      </Button>

      {/* Active bets */}
      {bets.length > 0 && (
        <div className="border-t border-border pt-2">
          <p className="text-muted text-xs mb-1.5">Your bets this round</p>
          {bets.map(b => (
            <div key={b.id} className="flex justify-between text-xs text-ivory py-0.5">
              <span className="capitalize">{outcomeLabel[b.outcome] ?? b.outcome}</span>
              <span className="text-muted">${b.stake.toFixed(2)} @ ×{b.odds.toFixed(2)}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
