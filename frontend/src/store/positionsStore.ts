// The user's positions — server is the single source of truth.
//
// Hydrates from REST (/positions + /settlements) whenever a trading session is
// live, then stays current over the WS user channel: `fill` and
// `position_update` mutate open rows, `settlement` moves a row to history and
// raises the payout banner. Reload-safe and multi-tab-safe by construction —
// nothing here is invented client-side.
import { create } from 'zustand';
import { api } from '../lib/api';
import { socket } from '../lib/ws';
import { useAuthStore } from './authStore';
import type { Position, Settlement } from '../lib/types';

export type SettleState = 'won' | 'lost' | 'refunded';

export interface SettledPrediction {
  settlement_id: string;
  market_id:     string;
  question:      string | null; // resolved lazily from the market archive
  state:         SettleState;
  payout:        number;        // dollars
  shares:        number;
  ts_ms:         number;
}

export interface PayoutBanner {
  state:  SettleState;
  payout: number;  // aggregated dollars for the settling batch
  count:  number;  // settlements aggregated into this banner
}

interface PositionsState {
  open:      Position[];
  settled:   SettledPrediction[];
  banner:    PayoutBanner | null;
  hydrated:  boolean;

  bind: () => void;
  hydrate: () => Promise<void>;
  dismissBanner: () => void;
}

function settleState(s: Settlement): SettleState {
  if (s.winning_side === null) return 'refunded'; // voided market — stake returned
  return s.payout > 0 ? 'won' : 'lost';
}

// market_id → question, cached across the session (archived markets included).
const questionCache = new Map<string, string | null>();
async function questionOf(marketId: string): Promise<string | null> {
  if (questionCache.has(marketId)) return questionCache.get(marketId)!;
  try {
    const m = await api.market(marketId);
    questionCache.set(marketId, m.question);
    return m.question;
  } catch {
    questionCache.set(marketId, null);
    return null;
  }
}

async function toSettled(s: Settlement): Promise<SettledPrediction> {
  return {
    settlement_id: s.settlement_id,
    market_id:     s.market_id,
    question:      await questionOf(s.market_id),
    state:         settleState(s),
    payout:        s.payout,
    shares:        s.yes_shares + s.no_shares,
    ts_ms:         s.ts_ms,
  };
}

let wired = false;

export const usePositionsStore = create<PositionsState>((set, get) => ({
  open:     [],
  settled:  [],
  banner:   null,
  hydrated: false,

  bind() {
    if (wired) return;
    wired = true;

    // Hydrate whenever an authenticated socket comes up (incl. reconnects —
    // anything missed while away is re-read from the server).
    socket.on('status', (s) => {
      if (s === 'open' && useAuthStore.getState().tradingToken) void get().hydrate();
    });

    socket.on('user_event', (e) => {
      switch (e.type) {
        case 'fill':
        case 'position_update': {
          // Positions changed server-side — re-read them (cheap, exact).
          const wallet = useAuthStore.getState().wallet;
          if (wallet) api.positions(wallet).then(open => set({ open })).catch(() => {});
          return;
        }
        case 'settlement': {
          void (async () => {
            const row = await toSettled({
              settlement_id: e.settlement_id, market_id: e.market_id,
              payout: e.payout, winning_side: e.winning_side,
              yes_shares: 0, no_shares: 0, ts_ms: e.ts_ms,
            } as Settlement);
            set(st => {
              if (st.settled.some(x => x.settlement_id === row.settlement_id)) return st; // durable replays dedupe
              const sameState = st.banner?.state === row.state ? st.banner : null;
              return {
                open:    st.open.filter(p => p.market_id !== e.market_id),
                settled: [row, ...st.settled].slice(0, 100),
                // Aggregate a batch settling together (e.g. game end) into one banner.
                banner: {
                  state:  row.state,
                  payout: (sameState?.payout ?? 0) + row.payout,
                  count:  (sameState?.count ?? 0) + 1,
                },
              };
            });
          })();
          return;
        }
      }
    });
  },

  async hydrate() {
    const wallet = useAuthStore.getState().wallet;
    if (!wallet) return;
    try {
      const [open, settlements] = await Promise.all([
        api.positions(wallet),
        api.settlements(wallet),
      ]);
      const settled = await Promise.all(
        settlements.sort((a, b) => b.ts_ms - a.ts_ms).slice(0, 50).map(toSettled),
      );
      set({ open, settled, hydrated: true });
    } catch { /* next reconnect retries */ }
  },

  dismissBanner() { set({ banner: null }); },
}));
