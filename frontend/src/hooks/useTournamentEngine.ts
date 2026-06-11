import { useEffect } from 'react';
import type { Side } from '../types';
import { deriveLiveState, winProbAtMove, isMatchRevealed, matchShortLabel } from '../lib/tournament';
import { getAgent } from '../lib/agents';
import { useTournamentStore } from '../store/tournamentStore';
import { useMarketStore } from '../store/marketStore';
import { useGameStore } from '../store/gameStore';
import { useAuthStore } from '../store/authStore';

const winningSideOf = (m: { winnerId: string | null; aId: string | null }): Side =>
  m.winnerId === m.aId ? 'a' : 'b';

/**
 * Single tournament engine, mounted once at the app root. Ticks `now` each second
 * and re-derives everything from (seed, startTime, now): the live board position,
 * the market win-probabilities + timer, bet settlement, and regeneration after a
 * champion is crowned. Runs on every route so the bracket always progresses.
 */
export function useTournamentEngine() {
  const tournament = useTournamentStore(s => s.tournament);

  // Reconcile bets for matches that already finished (e.g. after a reload).
  useEffect(() => {
    const now = Date.now();
    const { bets } = useMarketStore.getState();
    const settleBets = useMarketStore.getState().settleBets;
    const addBalance = useAuthStore.getState().addBalance;
    const unsettled = new Set(bets.filter(b => !b.settled).map(b => b.matchId));
    for (const m of tournament.matches) {
      if (unsettled.has(m.id) && isMatchRevealed(tournament, m.index, now)) {
        settleBets(m.id, winningSideOf(m), addBalance);
      }
    }
  }, [tournament]);

  useEffect(() => {
    const tick = () => {
      const now = Date.now();
      const store = useTournamentStore.getState();
      store.setNow(now);

      const t = store.tournament;
      const live = deriveLiveState(t, now);

      if (live.tournamentOver) {
        store.regenerate(now);
        return;
      }

      const m = live.match;
      if (!m) return;

      // Board reflects the current (or final) position of the current match.
      useGameStore.getState().setPosition(m.pgn, live.moveIndex);

      // Market for the current match.
      const probs = winProbAtMove(m, live.moveIndex);
      const closeAt = m.startTime + m.pgn.length * m.moveIntervalMs;
      const timeRemaining = Math.max(0, Math.round((closeAt - now) / 1000));
      const isOpen = live.phase === 'live' && !live.gameFinished;
      const meta = {
        aName: getAgent(m.aId)?.name ?? 'Agent A',
        bName: getAgent(m.bId)?.name ?? 'Agent B',
        matchLabel: matchShortLabel(m),
      };
      useMarketStore.getState().syncMarket(m.id, probs, isOpen, timeRemaining, meta);

      // Settle bets the moment the game finishes.
      if (live.gameFinished) {
        const market = useMarketStore.getState();
        if (market.bets.some(b => b.matchId === m.id && !b.settled)) {
          market.settleBets(m.id, winningSideOf(m), useAuthStore.getState().addBalance);
        }
      }
    };

    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, []);
}
