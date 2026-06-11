import type { Agent } from '../../types';
import { useMarketStore } from '../../store/marketStore';
import { OddsDisplay } from './OddsDisplay';
import { BetSlip } from './BetSlip';

function formatTime(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

interface MarketPanelProps {
  agentA: Agent;
  agentB: Agent;
}

export function MarketPanel({ agentA, agentB }: MarketPanelProps) {
  const { isMarketOpen, timeRemaining, selectedOutcome, selectOutcome, probabilities } = useMarketStore();

  return (
    <div className="flex flex-col gap-4 h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-1">
        <h2 className="font-display text-ivory text-base font-semibold">Who do you think wins?</h2>
        <div className={`flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full border ${
          isMarketOpen
            ? 'border-green-600 text-green-400 bg-green-900/20'
            : 'border-red-700 text-red-400 bg-red-900/20'
        }`}>
          <span className={`w-1.5 h-1.5 rounded-full ${isMarketOpen ? 'bg-green-400 animate-pulse' : 'bg-red-500'}`} />
          {isMarketOpen ? `Closes in ${formatTime(timeRemaining)}` : 'Closed'}
        </div>
      </div>

      {/* Win-probability cards */}
      <OddsDisplay agentA={agentA} agentB={agentB} probabilities={probabilities} onSelect={selectOutcome} selected={selectedOutcome} />

      {/* Prediction slip */}
      <BetSlip agentA={agentA} agentB={agentB} />
    </div>
  );
}
