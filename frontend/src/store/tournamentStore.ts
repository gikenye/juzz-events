// Tournament feed — bracket over WS when a cup is live, league overview over
// REST between cups (NO_TOURNAMENT → poll /league until the next one starts).
import { create } from 'zustand';
import { socket } from '../lib/ws';
import { api } from '../lib/api';
import type { TournamentSnapshot, LeagueOverview } from '../lib/types';

interface TournamentState {
  snapshot: TournamentSnapshot | null;
  league: LeagueOverview | null;
  nextMatchStartsAtMs: number;
  serverOffsetMs: number;

  bind: () => void;
  unbind: () => void;
}

let wired = false;
let pollTimer: ReturnType<typeof setTimeout> | null = null;
const unsub: Array<() => void> = [];

export const useTournamentStore = create<TournamentState>((set) => ({
  snapshot: null,
  league: null,
  nextMatchStartsAtMs: 0,
  serverOffsetMs: 0,

  bind() {
    if (wired) return;
    wired = true;

    const fetchLeague = async () => {
      try {
        const league = await api.league();
        set({ league, serverOffsetMs: Date.now() - league.now_ms });
        if (league.tournament) {
          set({ snapshot: league.tournament });
          socket.subscribeTournament();
          return;
        }
      } catch { /* server may predate /league */ }
      set({ snapshot: null });
      if (pollTimer) clearTimeout(pollTimer);
      pollTimer = setTimeout(fetchLeague, 15_000);
    };

    unsub.push(socket.on('status', (s) => {
      if (s === 'open') { socket.subscribeTournament(); void fetchLeague(); }
    }));

    unsub.push(socket.on('tournament_subscribed', (snapshot) => {
      set({ snapshot });
    }));

    unsub.push(socket.on('tournament_event', (ev) => {
      switch (ev.type) {
        case 'tournament_match_started':
          set({ nextMatchStartsAtMs: ev.starts_at_ms });
          // Patch the bracket: record the game on the match.
          set(st => {
            if (!st.snapshot) return st;
            const rounds = st.snapshot.rounds.map((r, ri) => ri !== ev.round ? r : {
              ...r,
              matches: r.matches.map((m, mi) => mi !== ev.match_index ? m : {
                ...m, games: m.games.includes(ev.game_id) ? m.games : [...m.games, ev.game_id],
              }),
            });
            return { snapshot: { ...st.snapshot, rounds, current: { round: ev.round, match_index: ev.match_index } } };
          });
          return;
        case 'tournament_match_decided':
          set(st => {
            if (!st.snapshot) return st;
            const rounds = st.snapshot.rounds.map((r, ri) => ri !== ev.round ? r : {
              ...r,
              matches: r.matches.map((m, mi) => mi !== ev.match_index ? m : { ...m, winner: ev.winner }),
            });
            return { snapshot: { ...st.snapshot, rounds } };
          });
          return;
        case 'tournament_complete':
          set(st => st.snapshot
            ? { snapshot: { ...st.snapshot, status: { state: 'complete', champion: ev.champion }, current: null } }
            : st);
          void fetchLeague();
          return;
        case 'tournament_round_complete':
          return;
      }
    }));

    unsub.push(socket.on('error', (err) => {
      if (err.code === 'NO_TOURNAMENT') void fetchLeague();
    }));

    if (socket.getStatus() === 'open') { socket.subscribeTournament(); void fetchLeague(); }
  },

  unbind() {
    while (unsub.length) unsub.pop()!();
    if (pollTimer) { clearTimeout(pollTimer); pollTimer = null; }
    socket.unsubscribeTournament();
    wired = false;
  },
}));
