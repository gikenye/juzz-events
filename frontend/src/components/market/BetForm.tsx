// Shared bet form — the arena bet slip and the cup-futures pre-bet use the exact
// same amount inputs, error handling, odds/payout, and deposit routing so the two
// flows never diverge. Insufficient balance or no trading session → /wallet (it
// resolves MiniPay deposit vs email funding vs sign-in), never a dead error.
import { useNavigate } from 'react-router-dom';
import { impliedOdds, potentialPayout } from '../../lib/odds';

export interface BetFormProps {
  balance: number;
  tradingToken: string | null;
  stake: string;
  setStake: (s: string) => void;
  /** Selected outcome (label + win probability), or null when nothing is picked. */
  view: { label: string; prob: number } | null;
  error?: string | null;
  pending?: boolean;
  isOpen?: boolean;
  /** Place the bet — only called once funded with a sufficient balance. */
  onPlace: () => void;
  pickHint?: string;
  placeLabel?: string;
  /** Parimutuel: payout is an estimate at current pool odds, not locked at bet time. */
  projected?: boolean;
}

export function BetForm({
  balance, tradingToken, stake, setStake, view, error,
  pending = false, isOpen = true, onPlace,
  pickHint = '— pick a side above', placeLabel = 'Lock in prediction', projected = false,
}: BetFormProps) {
  const navigate = useNavigate();
  const amt = parseFloat(stake) || 0;
  const payout = view && amt > 0 ? potentialPayout(amt, impliedOdds(view.prob)) : 0;
  const insufficient = !!tradingToken && amt > balance;

  const handlePlace = () => {
    if (!tradingToken || insufficient) { navigate('/wallet'); return; }
    onPlace();
  };

  const btnDisabled = !isOpen || !view || !stake || pending;
  const btnLabel = !isOpen ? 'Predictions closed'
    : (!tradingToken || insufficient) ? 'Add funds to predict'
    : pending ? 'Placing…' : placeLabel;

  return (
    <div className="flex flex-col gap-3" style={{ borderTop: '1px solid rgba(255,60,0,0.18)', paddingTop: 12 }}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 flex-wrap">
          <h3 style={{ fontFamily: "'Inter', sans-serif", color: '#FFBE00', fontSize: 11, fontWeight: 700, letterSpacing: 2 }}>
            Your call
          </h3>
          {!view && (
            <span style={{ fontFamily: "'Inter', sans-serif", color: '#C07840', fontSize: 11, fontStyle: 'italic' }}>{pickHint}</span>
          )}
          {view && (
            <span style={{ fontFamily: "'Cinzel', serif", fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 1, background: 'rgba(255,100,0,0.15)', color: '#FF9944', border: '1px solid rgba(255,100,0,0.35)' }}>
              {view.label}
            </span>
          )}
        </div>
        <span style={{ fontFamily: "'Inter', sans-serif", color: '#C07840', fontSize: 12 }}>${balance.toFixed(2)}</span>
      </div>

      <div className="flex gap-1.5">
        {[0.5, 1, 2, 5].map(a => {
          const active = parseFloat(stake) === a;
          return (
            <button key={a} onClick={() => setStake(a.toFixed(2))} disabled={!isOpen}
              style={{
                flex: 1, padding: '7px 0', fontSize: 13, fontWeight: 700, fontFamily: "'Cinzel', serif", borderRadius: 1,
                border: active ? '1px solid rgba(255,190,0,0.80)' : '1px solid rgba(255,60,0,0.28)',
                background: active ? 'rgba(255,160,0,0.16)' : 'rgba(0,0,0,0.25)',
                color: active ? '#FFBE00' : '#C07840',
                boxShadow: active ? '0 0 12px rgba(255,120,0,0.30)' : 'none',
                transition: 'all 0.15s', opacity: !isOpen ? 0.4 : 1, cursor: !isOpen ? 'not-allowed' : 'pointer',
              }}>
              ${a}
            </button>
          );
        })}
      </div>

      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <span style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#C07840', fontSize: 13 }}>$</span>
          <input type="number" min="0.01" step="0.01" placeholder="0.00" value={stake}
            onChange={e => setStake(e.target.value)} disabled={!isOpen}
            style={{
              width: '100%', background: 'rgba(10,4,0,0.60)', border: '1px solid rgba(255,60,0,0.28)', borderRadius: 2,
              paddingLeft: 28, paddingRight: 10, paddingTop: 8, paddingBottom: 8,
              color: '#FFD0A0', fontSize: 13, fontFamily: "'Inter', sans-serif", fontWeight: 600, outline: 'none', opacity: !isOpen ? 0.5 : 1,
            }}
            onFocus={e => { e.target.style.borderColor = 'rgba(255,190,0,0.70)'; }}
            onBlur={e => { e.target.style.borderColor = 'rgba(255,60,0,0.28)'; }} />
        </div>
        {view && amt > 0 && (
          <div className="flex gap-3 shrink-0">
            <div className="text-right">
              <div style={{ color: '#C07840', fontSize: 11 }}>Odds</div>
              <div style={{ fontFamily: "'Cinzel', serif", color: '#FFD0A0', fontSize: 13, fontWeight: 700 }}>×{impliedOdds(view.prob).toFixed(2)}</div>
            </div>
            <div className="text-right">
              <div style={{ color: '#C07840', fontSize: 11 }}>{projected ? 'Projected' : 'To win'}</div>
              <div style={{ fontFamily: "'Cinzel', serif", color: '#FFBE00', fontSize: 13, fontWeight: 700 }}>${payout.toFixed(2)}</div>
            </div>
          </div>
        )}
      </div>

      {projected && view && (
        <p style={{ color: '#C07840', fontSize: 10 }}>Payout depends on the pool at close.</p>
      )}
      {error && <p style={{ color: '#FF4422', fontSize: 12 }}>{error}</p>}

      <button disabled={btnDisabled} onClick={handlePlace}
        style={{
          width: '100%', padding: '11px 0', fontFamily: "'Cinzel', serif", fontWeight: 700, letterSpacing: 3, fontSize: 13, borderRadius: 1, border: 'none',
          cursor: btnDisabled ? 'not-allowed' : 'pointer',
          background: btnDisabled ? 'rgba(60,20,0,0.50)' : 'linear-gradient(135deg, #FF3300, #FFBE00)',
          color: btnDisabled ? '#D09060' : '#0A0500',
          boxShadow: btnDisabled ? 'none' : '0 0 28px rgba(255,80,0,0.50)',
          transition: 'all 0.2s', opacity: btnDisabled ? 0.6 : 1,
        }}>
        {btnLabel}
      </button>
    </div>
  );
}
