import { useMarketStore } from '../../store/marketStore';
import { useGameStore } from '../../store/gameStore';
import { useTournamentStore } from '../../store/tournamentStore';
import { getAgent } from '../../lib/agents';
import { formatCountdown } from '../../lib/tournamentView';
import { OddsDisplay, type SlotView } from './OddsDisplay';
import { BetSlip } from './BetSlip';

const DRAW_COLOR = '#C9A227';

const shortLabel = (label: string) => label.replace(/^Agent\s+/, '');

export function MarketPanel() {
  const { isMarketOpen, slots, selected, selectOutcome } = useMarketStore();
  const startsAtMs = useGameStore(s => s.startsAtMs);
  const offset = useTournamentStore(s => s.serverOffsetMs);
  const now = useTournamentStore(s => s.now);

  // Two-outcome design: the draw market stays open server-side but is not a
  // visible pick — display probabilities renormalize over the two agents.
  const pair = slots.filter(s => s.key !== 'draw');
  const pairSum = pair.reduce((t, s) => t + s.prob, 0) || 1;
  const outcomes: SlotView[] = pair.map(s => ({
    key: s.key,
    label: shortLabel(s.label),
    color: s.agentId ? (getAgent(s.agentId)?.color ?? DRAW_COLOR) : DRAW_COLOR,
    prob: s.prob / pairSum,
  }));

  // The backend has no betting deadline — the pre-match window is the headline,
  // then a live open/closed chip.
  const startsIn = startsAtMs ? startsAtMs + offset - now : 0;
  const chip = !isMarketOpen ? 'Closed'
    : startsIn > 0 ? `Open · starts in ${formatCountdown(startsIn)}`
    : 'Open';

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
          {chip}
        </div>
      </div>

      {/* Win-probability cards */}
      <OddsDisplay outcomes={outcomes} onSelect={selectOutcome} selected={selected} />

      {/* Prediction slip */}
      <BetSlip outcomes={outcomes} />
    </div>
  );
}
