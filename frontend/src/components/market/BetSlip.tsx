import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { useMarketStore } from '../../store/marketStore';
import { usePositionsStore } from '../../store/positionsStore';
import { impliedOdds, potentialPayout } from '../../lib/odds';
import type { SlotView } from './OddsDisplay';

export function BetSlip({ outcomes }: { outcomes: SlotView[] }) {
  const { balance, tradingToken } = useAuthStore();
  const { selected, stakeAmount, slots, isMarketOpen, betError, pending, setStake, placeBet } = useMarketStore();
  const openPositions = usePositionsStore(s => s.open);
  const navigate = useNavigate();

  const stake = parseFloat(stakeAmount) || 0;
  const view = selected ? outcomes.find(o => o.key === selected) ?? null : null;
  const payout = view && stake > 0 ? potentialPayout(stake, impliedOdds(view.prob)) : 0;

  const insufficient = !!tradingToken && stake > balance;
  // No trading session yet → /wallet (it figures out MiniPay deposit vs email
  // funding vs sign-in). Never send a wallet user to email login.
  const handlePlace = () => {
    if (!tradingToken || insufficient) { navigate('/wallet'); return; }
    placeBet();
  };

  // Open positions on this game's markets — the server is the bookkeeper.
  const slotByMarket = new Map(slots.map(s => [s.marketId, s]));
  const gamePositions = openPositions.filter(p => slotByMarket.has(p.market_id));

  const btnDisabled = !isMarketOpen || !selected || !stakeAmount || pending;
  const btnLabel = !isMarketOpen ? 'Predictions closed'
    : !tradingToken ? 'Add funds to predict'
    : pending ? 'Placing…' : 'Lock in prediction';

  return (
    <div className="flex flex-col gap-3" style={{ borderTop: '1px solid rgba(201,162,39,0.18)', paddingTop: 12 }}>
      {/* Header row */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 flex-wrap">
          <h3 style={{ fontFamily: "'Inter', sans-serif", color: '#E2C547', fontSize: 11, fontWeight: 700, letterSpacing: 2 }}>
            Your call
          </h3>
          {!view && (
            <span style={{ fontFamily: "'Inter', sans-serif", color: '#C07840', fontSize: 11, fontStyle: 'italic' }}>— pick a side above</span>
          )}
          {view && (
            <span style={{ fontFamily: "'Cinzel', serif", fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 1, background: 'rgba(201,162,39,0.15)', color: '#C9A227', border: '1px solid rgba(201,162,39,0.35)' }}>
              {view.label}
            </span>
          )}
        </div>
        <span style={{ fontFamily: "'Inter', sans-serif", color: '#C07840', fontSize: 12 }}>${balance.toFixed(2)}</span>
      </div>

      {/* Quick amounts */}
      <div className="flex gap-1.5">
        {[0.5, 1, 2, 5].map(amt => {
          const active = parseFloat(stakeAmount) === amt;
          return (
            <button
              key={amt}
              onClick={() => setStake(amt.toFixed(2))}
              disabled={!isMarketOpen}
              style={{
                flex: 1, padding: '7px 0', fontSize: 13, fontWeight: 700,
                fontFamily: "'Cinzel', serif", borderRadius: 1,
                border: active ? '1px solid rgba(226,197,71,0.80)' : '1px solid rgba(201,162,39,0.28)',
                background: active ? 'rgba(201,162,39,0.16)' : 'rgba(0,0,0,0.25)',
                color: active ? '#E2C547' : '#C07840',
                boxShadow: active ? '0 0 12px rgba(201,162,39,0.30)' : 'none',
                transition: 'all 0.15s',
                opacity: !isMarketOpen ? 0.4 : 1,
                cursor: !isMarketOpen ? 'not-allowed' : 'pointer',
              }}
            >
              ${amt}
            </button>
          );
        })}
      </div>

      {/* Input + payout */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <span style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#C07840', fontSize: 13 }}>$</span>
          <input
            type="number" min="0.01" step="0.01" placeholder="0.00"
            value={stakeAmount}
            onChange={e => setStake(e.target.value)}
            disabled={!isMarketOpen}
            style={{
              width: '100%', background: 'rgba(10,4,0,0.60)',
              border: '1px solid rgba(201,162,39,0.28)', borderRadius: 2,
              paddingLeft: 28, paddingRight: 10, paddingTop: 8, paddingBottom: 8,
              color: '#E8D4A0', fontSize: 13, fontFamily: "'Inter', sans-serif",
              fontWeight: 600, outline: 'none', opacity: !isMarketOpen ? 0.5 : 1,
            }}
            onFocus={e => { e.target.style.borderColor = 'rgba(226,197,71,0.70)'; }}
            onBlur={e => { e.target.style.borderColor = 'rgba(201,162,39,0.28)'; }}
          />
        </div>
        {view && stake > 0 && (
          <div className="flex gap-3 shrink-0">
            <div className="text-right">
              <div style={{ color: '#C07840', fontSize: 11 }}>Odds</div>
              <div style={{ fontFamily: "'Cinzel', serif", color: '#E8D4A0', fontSize: 13, fontWeight: 700 }}>×{impliedOdds(view.prob).toFixed(2)}</div>
            </div>
            <div className="text-right">
              <div style={{ color: '#C07840', fontSize: 11 }}>To win</div>
              <div style={{ fontFamily: "'Cinzel', serif", color: '#E2C547', fontSize: 13, fontWeight: 700 }}>${payout.toFixed(2)}</div>
            </div>
          </div>
        )}
      </div>

      {/* Error */}
      {betError && <p style={{ color: '#C9A227', fontSize: 12 }}>{betError}</p>}

      {/* Submit */}
      <button
        disabled={btnDisabled}
        onClick={handlePlace}
        style={{
          width: '100%', padding: '11px 0', fontFamily: "'Cinzel', serif",
          fontWeight: 700, letterSpacing: 3, fontSize: 13, borderRadius: 1, border: 'none',
          cursor: btnDisabled ? 'not-allowed' : 'pointer',
          background: btnDisabled ? 'rgba(60,20,0,0.50)' : 'linear-gradient(135deg, #C9A227, #E2C547)',
          color: btnDisabled ? '#D09060' : '#0A0500',
          boxShadow: btnDisabled ? 'none' : '0 0 28px rgba(201,162,39,0.50)',
          transition: 'all 0.2s', opacity: btnDisabled ? 0.6 : 1,
        }}
        onMouseEnter={e => { if (!btnDisabled) (e.target as HTMLButtonElement).style.boxShadow = '0 0 40px rgba(201,162,39,0.75)'; }}
        onMouseLeave={e => { if (!btnDisabled) (e.target as HTMLButtonElement).style.boxShadow = '0 0 28px rgba(201,162,39,0.50)'; }}
      >
        {btnLabel}
      </button>

      {/* This game's open positions (server truth) */}
      {gamePositions.length > 0 && (
        <div style={{ borderTop: '1px solid rgba(201,162,39,0.15)', paddingTop: 8 }}>
          <p style={{ color: '#C07840', fontSize: 11, marginBottom: 6, letterSpacing: 1, fontFamily: "'Inter', sans-serif" }}>Your predictions</p>
          {gamePositions.map(p => {
            const slot = slotByMarket.get(p.market_id)!;
            return (
              <div key={p.market_id} className="flex justify-between" style={{ fontSize: 12, paddingBottom: 3 }}>
                <span style={{ color: '#E8D4A0' }}>{slot.label.replace(/^Agent\s+/, '')}</span>
                <span style={{ color: '#C07840' }}>{p.yes_shares.toFixed(1)} shares</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
