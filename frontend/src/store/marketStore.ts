// Live LMSR markets for the current chess game, as outcome slots.
//
// Tournament games run TWO match-winner markets (one per agent) → slots a/b,
// mapped via player-name→seat→agent so colour swaps on draw-rematches stay
// correct. Exhibition games run the three system markets (white/black/draw) →
// slots a/b/draw. Prices come from the WS market stream and a per-move
// re-list; a bet is an off-chain `buy YES` on the slot's market (needs a
// trading session — minted by a deposit).
import { create } from 'zustand';
import { socket } from '../lib/ws';
import { useGameStore } from './gameStore';
import { useAuthStore } from './authStore';
import type { MarketSummary } from '../lib/types';

export type SlotKey = 'a' | 'b' | 'draw';

export interface OutcomeSlot {
  key: SlotKey;
  marketId: string;
  agentId: string | null;   // null for the draw slot
  label: string;            // agent display name | 'Draw'
  yesPrice: number;
  prob: number;             // yesPrice normalized over open slots
  resolved: boolean;
}

interface MarketState {
  gameId: string | null;
  mode: 'match' | 'exhibition';
  slots: OutcomeSlot[];
  isMarketOpen: boolean;
  selected: SlotKey | null;
  stakeAmount: string;
  betError: string | null;
  pending: boolean;

  bind: () => void;
  unbind: () => void;
  selectOutcome: (k: SlotKey) => void;
  setStake: (amount: string) => void;
  placeBet: () => void;
  clearBetError: () => void;
}

function normalize(slots: OutcomeSlot[]): OutcomeSlot[] {
  const sum = slots.reduce((s, x) => s + x.yesPrice, 0);
  return slots.map(s => ({ ...s, prob: sum > 0 ? s.yesPrice / sum : 1 / slots.length }));
}

/** Build slots from the game's market list + the current players. */
function slotsOf(markets: MarketSummary[]): { mode: 'match' | 'exhibition'; slots: OutcomeSlot[] } {
  const { players } = useGameStore.getState();
  const white = players.white, black = players.black;

  const matchMarkets = markets.filter(m => m.question.toLowerCase().includes('win the match'));
  if (matchMarkets.length === 2 && white && black) {
    // "Will {name} win the match?" — resolve the embedded name to a seat.
    const slots = matchMarkets.flatMap<OutcomeSlot>(m => {
      const q = m.question;
      const p = q.includes(white.name) ? white : q.includes(black.name) ? black : null;
      if (!p) return [];
      return [{
        // slot 'a' is the white seat this game; the UI colours by agent id, not slot
        key: p.seat === 'white' ? 'a' as const : 'b' as const,
        marketId: m.market_id,
        agentId: p.agent_id,
        label: p.name,
        yesPrice: m.yes_price,
        prob: 0.5,
        resolved: m.resolved,
      }];
    });
    if (slots.length === 2) {
      return { mode: 'match', slots: normalize(slots.sort(s => (s.key === 'a' ? -1 : 1))) };
    }
  }

  const bySystem = (needle: string) =>
    markets.find(m => m.question.toLowerCase().includes(needle)) ?? null;
  const w = bySystem('white'), b = bySystem('black'), d = bySystem('draw');
  const slots: OutcomeSlot[] = [];
  if (w) slots.push({ key: 'a', marketId: w.market_id, agentId: white?.agent_id ?? null,
                      label: white?.name ?? 'White', yesPrice: w.yes_price, prob: 0, resolved: w.resolved });
  if (b) slots.push({ key: 'b', marketId: b.market_id, agentId: black?.agent_id ?? null,
                      label: black?.name ?? 'Black', yesPrice: b.yes_price, prob: 0, resolved: b.resolved });
  if (d) slots.push({ key: 'draw', marketId: d.market_id, agentId: null,
                      label: 'Draw', yesPrice: d.yes_price, prob: 0, resolved: d.resolved });
  return { mode: 'exhibition', slots: normalize(slots) };
}

let wired = false;
const unsub: Array<() => void> = [];

export const useMarketStore = create<MarketState>((set, get) => ({
  gameId: null,
  mode: 'exhibition',
  slots: [],
  isMarketOpen: false,
  selected: null,
  stakeAmount: '5.00',
  betError: null,
  pending: false,

  bind() {
    if (wired) return;
    wired = true;

    // Full market snapshot on bind and on every move.
    unsub.push(socket.on('market_list', (markets) => {
      const { mode, slots } = slotsOf(markets);
      const open = slots.length > 0 && !slots.every(s => s.resolved);
      set({ mode, slots, isMarketOpen: open });
    }));

    // Fine-grained price ticks for individual markets.
    unsub.push(socket.on('market_event', (ev) => {
      if (!('yes_price' in ev)) return;
      const cur = get().slots;
      if (!cur.some(s => s.marketId === ev.market_id)) return;
      set({
        slots: normalize(cur.map(s => s.marketId === ev.market_id
          ? { ...s, yesPrice: ev.yes_price, resolved: ev.resolved }
          : s)),
      });
    }));

    // Confirmed buy → clear the slip; the position itself arrives on the user
    // channel (positionsStore) — the server is the only bookkeeper.
    unsub.push(socket.on('trade_confirmed', () => {
      set({ pending: false, betError: null, stakeAmount: '', selected: null });
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

  selectOutcome(k) { set({ selected: k, betError: null }); },
  setStake(amount) { set({ stakeAmount: amount, betError: null }); },
  clearBetError() { set({ betError: null }); },

  placeBet() {
    const { selected, stakeAmount, slots, isMarketOpen, pending } = get();
    if (pending) return;
    if (!isMarketOpen) { set({ betError: 'Market is closed.' }); return; }
    if (!selected) { set({ betError: 'Pick an outcome first.' }); return; }
    const slot = slots.find(s => s.key === selected);
    if (!slot) { set({ betError: 'Market not available yet.' }); return; }
    const stake = parseFloat(stakeAmount);
    if (!stake || stake <= 0) { set({ betError: 'Enter a valid stake.' }); return; }

    const auth = useAuthStore.getState();
    if (!auth.tradingToken) { set({ betError: 'Add funds to place a bet.' }); return; }
    if (stake > auth.balance) { set({ betError: 'Insufficient balance.' }); return; }

    // $ stake → YES shares at the current price; the engine returns the exact cost.
    const shares = +(stake / Math.max(slot.yesPrice, 0.02)).toFixed(2);
    if (shares <= 0) { set({ betError: 'Minimum bet is $0.01.' }); return; }
    set({ pending: true, betError: null });
    socket.trade('buy', slot.marketId, shares, 'yes');
  },
}));
