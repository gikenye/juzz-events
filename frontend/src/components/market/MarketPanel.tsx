import { useMarketStore } from '../../store/marketStore';
import { getAgent } from '../../lib/agents';
import { OddsDisplay, type SlotView } from './OddsDisplay';
import { BetSlip } from './BetSlip';

const DRAW_COLOR = '#C9A227';
const shortLabel = (label: string) => label.replace(/^Agent\s+/, '');

export function MarketPanel() {
  const { slots, selected, selectOutcome } = useMarketStore();

  // Two-outcome design: the draw market stays open server-side but is not a
  // visible pick — display probabilities renormalize over the two agents.
  const pair = slots.filter(s => s.key !== 'draw');
  const pairSum = pair.reduce((t, s) => t + s.prob, 0) || 1;
  const outcomes: SlotView[] = pair.map(s => {
    const agent = s.agentId ? getAgent(s.agentId) : null;
    return {
      key: s.key,
      label: shortLabel(s.label),
      color: agent?.color ?? DRAW_COLOR,
      prob: s.prob / pairSum,
      agent,
    };
  });

  return (
    <div className="flex flex-col gap-0 relative" style={{
      background: 'rgba(18,6,2,0.88)',
      border: '1px solid rgba(255,60,0,0.30)',
      borderRadius: 2,
      boxShadow: '0 0 40px rgba(255,60,0,0.15), inset 0 0 60px rgba(0,0,0,0.4)',
    }}>
      {/* top fire accent line */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: 'linear-gradient(90deg, transparent, #FF3300AA, #FFBE0088, transparent)', borderRadius: '2px 2px 0 0' }} />

      <div className="flex flex-col gap-4 p-4 pt-5">
        <h2 style={{ fontFamily: "'Inter', sans-serif", color: '#FFBE00', fontSize: 13, fontWeight: 700, letterSpacing: 2, textShadow: '0 0 20px rgba(255,120,0,0.6)' }}>
          Who will survive?
        </h2>

        <OddsDisplay outcomes={outcomes} onSelect={selectOutcome} selected={selected} />

        <BetSlip outcomes={outcomes} />
      </div>
    </div>
  );
}
