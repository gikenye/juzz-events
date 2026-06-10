import { useAuthStore } from '../../store/authStore';
import { useMarketStore } from '../../store/marketStore';
import { useGameStore } from '../../store/gameStore';
import { probabilitiesToOdds, potentialPayout } from '../../lib/odds';
import { Button } from '../ui/Button';
import { useNavigate } from 'react-router-dom';

export function BetSlip() {
  const { user, balance, tradingToken } = useAuthStore();
  const { selectedOutcome, stakeAmount, probabilities, isMarketOpen, betError, pending, setStake, placeBet, bets, markets } = useMarketStore();
  const players = useGameStore(s => s.players);
  const navigate = useNavigate();

  const odds = probabilitiesToOdds(probabilities);
  const stake = parseFloat(stakeAmount) || 0;
  const payout = selectedOutcome && stake > 0 ? potentialPayout(stake, odds[selectedOutcome]) : 0;
  const selectedMarket = selectedOutcome ? markets[selectedOutcome] : null;
  const shares = selectedMarket && stake > 0 ? +(stake / Math.max(selectedMarket.yes_price, 0.02)).toFixed(2) : 0;
  const tooSmall = !!tradingToken && stake > 0 && stake <= balance && shares <= 0;

  const handlePlace = () => {
    if (!user) { navigate('/login'); return; }
    if (!tradingToken) { navigate('/wallet'); return; } // sign-in alone isn't a trading session
    placeBet();
  };

  const outcomeLabel: Record<string, string> = {
    maxi: players.black?.name ?? 'Black',
    draw: 'Draw',
    gotham: players.white?.name ?? 'White',
  };
  const selectedOdds = selectedOutcome ? odds[selectedOutcome] : null;

  return (
    <div className="bg-bg-card rounded-xl border border-border p-3 flex flex-col gap-3">
      {/* Header row */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h3 className="font-display text-ivory text-xs font-semibold uppercase tracking-wider">Stake</h3>
          {!selectedOutcome && (
            <span className="text-[11px] italic text-muted/60 tracking-wide">— please pick an outcome</span>
          )}
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

      {/* Quick amounts — capped to balance so users can't stake what they don't have. */}
      <div className="flex gap-1.5">
        {[1, 2, 5, 10].map(amt => (
          <button
            key={amt}
            onClick={() => setStake(amt.toFixed(2))}
            disabled={!isMarketOpen || amt > balance}
            className={`flex-1 py-2 text-sm font-semibold rounded-lg border transition-colors disabled:opacity-30 disabled:cursor-not-allowed ${
              parseFloat(stakeAmount) === amt
                ? 'border-gold text-gold bg-gold/10'
                : 'border-border text-ivory hover:border-gold hover:text-gold'
            }`}
          >
            ${amt}
          </button>
        ))}
        {balance > 0 && (
          <button onClick={() => setStake(balance.toFixed(2))} disabled={!isMarketOpen}
            className="flex-1 py-2 text-sm font-semibold rounded-lg border border-border text-gold hover:border-gold transition-colors disabled:opacity-30">
            Max
          </button>
        )}
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
          <div className="flex gap-3 shrink-0">
            <div className="text-right">
              <div className="text-xs text-muted">Odds</div>
              <div className="text-sm font-semibold text-ivory">×{selectedOdds.toFixed(2)}</div>
            </div>
            <div className="text-right">
              <div className="text-xs text-muted">To win</div>
              <div className="text-sm font-semibold text-gold">${payout.toFixed(2)}</div>
            </div>
          </div>
        )}
      </div>

      {/* Client-side guards — prevent doomed bets from ever hitting the server. */}
      {tradingToken && stake > balance && <p className="text-red-400 text-xs">Insufficient balance.</p>}
      {tooSmall && <p className="text-red-400 text-xs">Minimum bet is $0.01.</p>}
      {betError && <p className="text-red-400 text-xs">{betError}</p>}

      <Button
        variant={selectedOutcome === 'maxi' ? 'maxi' : selectedOutcome === 'gotham' ? 'gotham' : 'gold'}
        size="md"
        className="w-full"
        loading={pending}
        disabled={!isMarketOpen || !selectedOutcome || !stakeAmount || pending
          || (!!tradingToken && (stake <= 0 || stake > balance || tooSmall))}
        onClick={handlePlace}
      >
        {!isMarketOpen ? 'Market Closed'
          : !user ? 'Sign in to bet'
          : !tradingToken ? 'Sign in to bet'
          : stake > balance ? 'Insufficient balance'
          : tooSmall ? 'Minimum bet is $0.01'
          : 'Confirm Bet'}
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
