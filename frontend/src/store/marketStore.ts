import { create } from 'zustand';
import type { Bet, Outcome, Probabilities } from '../types';
import { probabilitiesToOdds, addNoise } from '../lib/odds';

const MARKET_DURATION = 300; // 5 minutes in seconds

interface MarketState {
  probabilities: Probabilities;
  isMarketOpen: boolean;
  timeRemaining: number;
  selectedOutcome: Outcome | null;
  stakeAmount: string;
  bets: Bet[];
  betError: string | null;

  updateProbabilities: (probs: Probabilities) => void;
  tickTimer: () => void;
  selectOutcome: (outcome: Outcome) => void;
  setStake: (amount: string) => void;
  placeBet: (balance: number, deductBalance: (n: number) => void) => void;
  clearBetError: () => void;
}

const initialProbs: Probabilities = { maxi: 0.35, draw: 0.15, gotham: 0.50 };

export const useMarketStore = create<MarketState>((set, get) => ({
  probabilities: initialProbs,
  isMarketOpen: true,
  timeRemaining: MARKET_DURATION,
  selectedOutcome: null,
  stakeAmount: '5',
  bets: [],
  betError: null,

  updateProbabilities(probs) {
    set({ probabilities: addNoise(probs) });
  },

  tickTimer() {
    const { timeRemaining } = get();
    const next = Math.max(0, timeRemaining - 1);
    set({ timeRemaining: next, isMarketOpen: next > 0 });
  },

  selectOutcome(outcome) {
    set({ selectedOutcome: outcome, betError: null });
  },

  setStake(amount) {
    set({ stakeAmount: amount, betError: null });
  },

  placeBet(balance, deductBalance) {
    const { selectedOutcome, stakeAmount, probabilities, isMarketOpen } = get();
    if (!isMarketOpen) {
      set({ betError: 'Market is closed.' });
      return;
    }
    if (!selectedOutcome) {
      set({ betError: 'Select an outcome first.' });
      return;
    }
    const stake = parseFloat(stakeAmount);
    if (!stake || stake <= 0) {
      set({ betError: 'Enter a valid stake.' });
      return;
    }
    if (stake > balance) {
      set({ betError: 'Insufficient balance.' });
      return;
    }
    const odds = probabilitiesToOdds(probabilities);
    const bet: Bet = {
      id: crypto.randomUUID(),
      outcome: selectedOutcome,
      stake,
      odds: odds[selectedOutcome],
      timestamp: Date.now(),
    };
    deductBalance(stake);
    set(s => ({ bets: [...s.bets, bet], stakeAmount: '', selectedOutcome: null, betError: null }));
  },

  clearBetError() {
    set({ betError: null });
  },
}));
