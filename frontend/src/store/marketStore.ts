// Live LMSR markets for the current chess game.
//
// The backend runs three binary YES/NO system markets per game (white / black / draw).
// The design's 3-way outcome maps onto them: gotham=white wins, maxi=black wins, draw.
// Prices come from the WS market stream and a per-move re-list; a bet is an off-chain
// `buy YES` on the mapped market (needs a trading session — minted by a deposit).
import { create } from 'zustand';
import { socket } from '../lib/ws';
import { useGameStore } from './gameStore';
import { useAuthStore } from './authStore';
import type { MarketSummary } from '../lib/types';
import type { Outcome, Probabilities } from '../types';

type OutcomeMarkets = { maxi: MarketSummary | null; draw: MarketSummary | null; gotham: MarketSummary | null };

interface MarketState {
  gameId: string | null;
  markets: OutcomeMarkets;
  probabilities: Probabilities;
  selectedOutcome: Outcome | null;
  stakeAmount: string;
  betError: string | null;
  pending: boolean;
  isMarketOpen: boolean;

  bind: () => void;
  unbind: () => void;
  selectOutcome: (o: Outcome) => void;
  setStake: (amount: string) => void;
  placeBet: () => void;
  clearBetError: () => void;
}

const EVEN: Probabilities = { maxi: 1 / 3, draw: 1 / 3, gotham: 1 / 3 };

// Which design outcome a market belongs to, from its question text.
function outcomeOf(m: MarketSummary): Outcome | null {
  const q = m.question.toLowerCase();
  if (q.includes('draw')) return 'draw';
  if (q.includes('white')) return 'gotham';
  if (q.includes('black')) return 'maxi';
  return null;
}

function pricesToProbabilities(m: OutcomeMarkets): Probabilities {
  const raw = { maxi: m.maxi?.yes_price ?? 0, draw: m.draw?.yes_price ?? 0, gotham: m.gotham?.yes_price ?? 0 };
  const sum = raw.maxi + raw.draw + raw.gotham;
  if (sum <= 0) return EVEN;
  return { maxi: raw.maxi / sum, draw: raw.draw / sum, gotham: raw.gotham / sum };
}

let wired = false;
const unsub: Array<() => void> = [];

export const useMarketStore = create<MarketState>((set, get) => ({
  gameId: null,
  markets: { maxi: null, draw: null, gotham: null },
  probabilities: EVEN,
  selectedOutcome: null,
  stakeAmount: '5.00',
  betError: null,
  pending: false,
  isMarketOpen: false,

  bind() {
    if (wired) return;
    wired = true;

    // Full market snapshot (all three prices) on bind and on every move.
    unsub.push(socket.on('market_list', (markets) => {
      const next: OutcomeMarkets = { maxi: null, draw: null, gotham: null };
      for (const m of markets) {
        const o = outcomeOf(m);
        if (o) next[o] = m;
      }
      const open = !!(next.maxi || next.draw || next.gotham) &&
        ![next.maxi, next.draw, next.gotham].every(m => m?.resolved);
      set({ markets: next, probabilities: pricesToProbabilities(next), isMarketOpen: open });
    }));

    // Fine-grained price ticks for individual markets.
    unsub.push(socket.on('market_event', (ev) => {
      if (!('yes_price' in ev)) return;
      const cur = get().markets;
      let touched: OutcomeMarkets | null = null;
      for (const key of ['maxi', 'draw', 'gotham'] as Outcome[]) {
        const m = cur[key];
        if (m && m.market_id === ev.market_id) {
          touched = { ...cur, [key]: { ...m, yes_price: ev.yes_price, no_price: ev.no_price, resolved: ev.resolved } };
          break;
        }
      }
      if (touched) set({ markets: touched, probabilities: pricesToProbabilities(touched) });
    }));

    // Confirmed buy → clear the slip; the position itself arrives on the user
    // channel (positionsStore) — the server is the only bookkeeper.
    unsub.push(socket.on('trade_confirmed', () => {
      set({ pending: false, betError: null, stakeAmount: '', selectedOutcome: null });
      void useAuthStore.getState().refreshBalance();
    }));

    unsub.push(socket.on('error', (err) => {
      if (!get().pending) return;
      const insufficient = (err.message || '').includes('insufficient');
      if (insufficient) void useAuthStore.getState().refreshBalance(); // UI was stale
      set({
        pending: false,
        betError: err.code === 'WALLET_REQUIRED' ? 'Add funds to place a bet.'
          : insufficient ? 'Not enough in your balance.'
          : (err.message || 'Trade failed.'),
      });
    }));

    // Re-list markets whenever the game advances (prices move on moves) or rolls over.
    const onGame = (gameId: string | null) => {
      set({ gameId });
      if (gameId) socket.listMarkets(gameId);
    };
    onGame(useGameStore.getState().gameId);
    let lastGame = useGameStore.getState().gameId;
    let lastMove = useGameStore.getState().moveNumber;
    unsub.push(useGameStore.subscribe((gs) => {
      if (gs.gameId !== lastGame) { lastGame = gs.gameId; onGame(gs.gameId); }
      else if (gs.moveNumber !== lastMove && gs.gameId) { lastMove = gs.moveNumber; socket.listMarkets(gs.gameId); }
    }));
  },

  unbind() {
    while (unsub.length) unsub.pop()!();
    wired = false;
  },

  selectOutcome(outcome) { set({ selectedOutcome: outcome, betError: null }); },
  setStake(amount) { set({ stakeAmount: amount, betError: null }); },
  clearBetError() { set({ betError: null }); },

  placeBet() {
    const { selectedOutcome, stakeAmount, markets, isMarketOpen, pending } = get();
    if (pending) return;
    if (!isMarketOpen) { set({ betError: 'Market is closed.' }); return; }
    if (!selectedOutcome) { set({ betError: 'Pick an outcome first.' }); return; }
    const market = markets[selectedOutcome];
    if (!market) { set({ betError: 'Market not available yet.' }); return; }
    const stake = parseFloat(stakeAmount);
    if (!stake || stake <= 0) { set({ betError: 'Enter a valid stake.' }); return; }

    const auth = useAuthStore.getState();
    if (!auth.tradingToken) { set({ betError: 'Add funds to place a bet.' }); return; }
    if (stake > auth.balance) { set({ betError: 'Insufficient balance.' }); return; }

    // $ stake → YES shares at the current price; the engine returns the exact cost.
    const shares = +(stake / Math.max(market.yes_price, 0.02)).toFixed(2);
    if (shares <= 0) { set({ betError: 'Minimum bet is $0.01.' }); return; }
    set({ pending: true, betError: null });
    socket.trade('buy', market.market_id, shares, 'yes');
  },
}));
