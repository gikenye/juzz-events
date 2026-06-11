import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { useMarketStore } from '../../store/marketStore';
import { usePositionsStore } from '../../store/positionsStore';
import { impliedOdds, potentialPayout } from '../../lib/odds';
import { Button } from '../ui/Button';
import type { SlotView } from './OddsDisplay';

export function BetSlip({ outcomes }: { outcomes: SlotView[] }) {
  const { user, balance, tradingToken } = useAuthStore();
  const { selected, stakeAmount, slots, isMarketOpen, betError, pending, setStake, placeBet } = useMarketStore();
  const openPositions = usePositionsStore(s => s.open);
  const navigate = useNavigate();

  const stake = parseFloat(stakeAmount) || 0;
  const view = selected ? outcomes.find(o => o.key === selected) ?? null : null;
  const payout = view && stake > 0 ? potentialPayout(stake, impliedOdds(view.prob)) : 0;

  const insufficient = !!tradingToken && stake > balance;
  const handlePlace = () => {
    if (!user) { navigate('/login'); return; }
    if (!tradingToken) { navigate('/wallet'); return; } // sign-in alone isn't a trading session
    if (insufficient) { navigate('/wallet'); return; }  // route to Add money, not a dead end
    placeBet();
  };

  // Open positions on this game's markets — the server is the bookkeeper.
  const slotByMarket = new Map(slots.map(s => [s.marketId, s]));
  const gamePositions = openPositions.filter(p => slotByMarket.has(p.market_id));

  return (
    <div className="bg-bg-card rounded-xl border border-border p-3 flex flex-col gap-3">
      {/* Header row */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h3 className="font-display text-ivory text-xs font-semibold uppercase tracking-wider">Your call</h3>
          {!view && (
            <span className="text-[11px] italic text-muted/60 tracking-wide">— pick a side above</span>
          )}
          {view && (
            <span
              className="text-xs font-semibold px-2 py-0.5 rounded-full"
              style={{ background: view.color + '33', color: view.color }}
            >
              {view.label}
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
        {view && stake > 0 && (
          <div className="flex gap-3 shrink-0">
            <div className="text-right">
              <div className="text-xs text-muted">Odds</div>
              <div className="text-sm font-semibold text-ivory">×{impliedOdds(view.prob).toFixed(2)}</div>
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
        disabled={!isMarketOpen || !selected || !stakeAmount || pending}
        onClick={handlePlace}
      >
        {!isMarketOpen ? 'Predictions Closed'
          : !user ? 'Login to Predict'
          : !tradingToken ? 'Add Funds to Predict'
          : pending ? 'Placing…' : 'Lock In Prediction'}
      </Button>

      {/* This game's open positions (server truth) */}
      {gamePositions.length > 0 && (
        <div className="border-t border-border pt-2">
          <p className="text-muted text-xs mb-1.5">Your predictions this match</p>
          {gamePositions.map(p => {
            const slot = slotByMarket.get(p.market_id)!;
            return (
              <div key={p.market_id} className="flex justify-between text-xs py-0.5">
                <span className="text-ivory">{slot.label}</span>
                <span className="text-muted">{p.yes_shares.toFixed(1)} shares</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
