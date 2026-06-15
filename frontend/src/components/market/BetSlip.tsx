import { useAuthStore } from '../../store/authStore';
import { useMarketStore } from '../../store/marketStore';
import { usePositionsStore } from '../../store/positionsStore';
import type { SlotView } from './OddsDisplay';
import { BetForm } from './BetForm';

export function BetSlip({ outcomes }: { outcomes: SlotView[] }) {
  const { balance, tradingToken } = useAuthStore();
  const { selected, stakeAmount, slots, isMarketOpen, betError, pending, setStake, placeBet } = useMarketStore();
  const openPositions = usePositionsStore(s => s.open);

  const view = selected ? outcomes.find(o => o.key === selected) ?? null : null;

  // Open positions on this game's markets — the server is the bookkeeper.
  const slotByMarket = new Map(slots.map(s => [s.marketId, s]));
  const gamePositions = openPositions.filter(p => slotByMarket.has(p.market_id));

  return (
    <>
      <BetForm
        balance={balance}
        tradingToken={tradingToken}
        stake={stakeAmount}
        setStake={setStake}
        view={view ? { label: view.label, prob: view.prob } : null}
        error={betError}
        pending={pending}
        isOpen={isMarketOpen}
        onPlace={placeBet}
        projected={slots.find(s => s.key === selected)?.parimutuel ?? false}
      />

      {gamePositions.length > 0 && (
        <div style={{ borderTop: '1px solid rgba(255,60,0,0.15)', paddingTop: 8, marginTop: 12 }}>
          <p style={{ color: '#C07840', fontSize: 11, marginBottom: 6, letterSpacing: 1, fontFamily: "'Inter', sans-serif" }}>Your predictions</p>
          {gamePositions.map(p => {
            const slot = slotByMarket.get(p.market_id)!;
            return (
              <div key={p.market_id} className="flex justify-between" style={{ fontSize: 12, paddingBottom: 3 }}>
                <span style={{ color: '#FFD0A0' }}>{slot.label.replace(/^Agent\s+/, '')}</span>
                <span style={{ color: '#C07840' }}>{p.yes_shares.toFixed(1)} shares</span>
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}
