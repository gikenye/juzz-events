import { useMarketStore } from '../../store/marketStore';
import { OddsDisplay } from './OddsDisplay';
import { BetSlip } from './BetSlip';

export function MarketPanel() {
  const { isMarketOpen, selectedOutcome, selectOutcome } = useMarketStore();

  return (
    <div className="flex flex-col gap-4 h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-1">
        <h2 className="font-display text-ivory text-base font-semibold">Predict who wins?</h2>
        <div className={`flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full border ${
          isMarketOpen
            ? 'border-green-600 text-green-400 bg-green-900/20'
            : 'border-red-700 text-red-400 bg-red-900/20'
        }`}>
          <span className={`w-1.5 h-1.5 rounded-full ${isMarketOpen ? 'bg-green-400 animate-pulse' : 'bg-red-500'}`} />
          {isMarketOpen ? 'Live' : 'Closed'}
        </div>
      </div>

      {/* Odds */}
      <OddsDisplay onSelect={selectOutcome} selected={selectedOutcome} />

      {/* Bet slip */}
      <BetSlip />
    </div>
  );
}
