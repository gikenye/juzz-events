import { useMarketStore } from '../../store/marketStore';
import { OddsDisplay } from './OddsDisplay';
import { BetSlip } from './BetSlip';

function formatTime(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export function MarketPanel() {
  const { isMarketOpen, timeRemaining, selectedOutcome, selectOutcome } = useMarketStore();

  return (
    <div className="flex flex-col gap-4 h-full">
      {/* Header */}
      <div className="bg-bg-card rounded-xl border border-border p-4">
        <div className="flex items-center justify-between mb-1">
          <h2 className="font-display text-ivory text-base font-semibold">Match Prediction</h2>
          <div className={`flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full border ${
            isMarketOpen
              ? 'border-green-600 text-green-400 bg-green-900/20'
              : 'border-red-700 text-red-400 bg-red-900/20'
          }`}>
            <span className={`w-1.5 h-1.5 rounded-full ${isMarketOpen ? 'bg-green-400 animate-pulse' : 'bg-red-500'}`} />
            {isMarketOpen ? 'Open' : 'Closed'}
          </div>
        </div>
        <p className="text-muted text-xs">Agent Maxi Wins · Draw · Agent Gotham Wins</p>
        <div className="mt-3 flex items-center gap-2 text-xs text-muted">
          <span>⏱</span>
          <span className={timeRemaining < 60 ? 'text-red-400 font-semibold' : ''}>
            {isMarketOpen ? `Closes in ${formatTime(timeRemaining)}` : 'Market locked'}
          </span>
        </div>
      </div>

      {/* Odds */}
      <OddsDisplay onSelect={selectOutcome} selected={selectedOutcome} />

      {/* Bet slip */}
      <BetSlip />
    </div>
  );
}
