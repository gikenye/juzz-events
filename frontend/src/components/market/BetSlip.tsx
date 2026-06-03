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

  return (
    <div className="bg-bg-card rounded-xl border border-border p-4 flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h3 className="font-display text-ivory text-sm font-semibold uppercase tracking-wider">Your Stake</h3>
        <span className="text-muted text-xs">${balance.toFixed(2)} available</span>
      </div>

      {/* Amount input */}
      <div className="relative">
        <input
          type="number"
          min="0.01"
          step="0.01"
          placeholder="0.00"
          value={stakeAmount}
          onChange={e => setStake(e.target.value)}
          disabled={!isMarketOpen}
          className="w-full bg-bg-surface border border-border rounded-lg px-4 py-3 pr-16 text-ivory text-lg font-semibold outline-none focus:border-gold transition-colors placeholder:text-muted disabled:opacity-50"
        />
        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-muted text-sm">$</span>
      </div>

      {/* Quick amounts */}
      <div className="flex gap-2">
        {[5, 10, 25, 50].map(amt => (
          <button
            key={amt}
            onClick={() => setStake(String(amt))}
            disabled={!isMarketOpen}
            className="flex-1 py-1.5 text-xs rounded border border-border text-muted hover:border-gold hover:text-gold transition-colors disabled:opacity-40"
          >
            {amt}
          </button>
        ))}
      </div>

      {/* Payout preview */}
      {payout > 0 && selectedOutcome && (
        <div className="flex justify-between text-sm bg-bg-surface rounded-lg px-4 py-3">
          <span className="text-muted">Potential win</span>
          <span className="text-gold font-semibold">${payout.toFixed(2)}</span>
        </div>
      )}

      {/* Error */}
      {betError && (
        <p className="text-red-400 text-xs">{betError}</p>
      )}

      <Button
        variant={selectedOutcome === 'maxi' ? 'maxi' : selectedOutcome === 'gotham' ? 'gotham' : 'gold'}
        size="lg"
        className="w-full"
        disabled={!isMarketOpen || !selectedOutcome || !stakeAmount}
        onClick={handlePlace}
      >
        {!isMarketOpen ? 'Market Closed' : !user ? 'Login to Bet' : 'Confirm Bet'}
      </Button>

      {/* Active bets */}
      {bets.length > 0 && (
        <div className="border-t border-border pt-3">
          <p className="text-muted text-xs mb-2">Your bets this round</p>
          {bets.map(b => (
            <div key={b.id} className="flex justify-between text-xs text-ivory py-1">
              <span className="capitalize">{b.outcome}</span>
              <span>{b.stake.toFixed(2)} @ {b.odds.toFixed(2)}×</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
