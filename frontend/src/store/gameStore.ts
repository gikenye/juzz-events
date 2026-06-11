// Live chess game state, driven entirely by the backend WS.
//
// One subscription at a time to the current chess game. Moves arrive as `move_played`
// events and update the board immediately (no local replay → never stale). Clocks are
// anchored to the server's `clocks_ms` at each event and ticked locally between them
// (see useLiveClocks). On `game_over` the store auto-rolls to the next live chess game
// on the same screen — no navigation, no per-game URL.
import { create } from 'zustand';
import { useAuthStore } from './authStore';
import { socket } from '../lib/ws';
import { GAME_TYPE } from '../lib/config';
import { turnFromFen, uciSquares, capturedFromFen } from '../lib/chessFen';
import type { GameSummary, GameEvent, Player, GameResult } from '../lib/types';

const START_FEN = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
const ROLL_DELAY_MS = 4500; // pause on the result before rolling to the next game

interface Players { white: Player | null; black: Player | null; }

interface GameState {
  connected: boolean;
  gameId: string | null;
  fen: string;
  lastMove: { from: string; to: string } | null;
  turn: 'w' | 'b';
  moveNumber: number;
  players: Players;
  // Clock anchor: server values + the local timestamp they were received.
  clocksMs: [number, number];   // [white, black]
  clockAnchor: number;          // performance.now() at last clock update
  isFinished: boolean;
  result: GameResult | null;
  // Server-time sync: offset = Date.now() − server ts (EMA); lag = how stale the
  // last anchor was on arrival. Both 0 against an old backend.
  serverOffsetMs: number;
  eventLagMs: number;
  startsAtMs: number;
  joinedMidGame: boolean;
  capturedPieces: { byMaxi: string[]; byGotham: string[] };
  waiting: boolean;             // connected but no live chess game yet

  start: () => void;
  stop: () => void;
}

let wired = false;
let rollTimer: ReturnType<typeof setTimeout> | null = null;
const unsub: Array<() => void> = [];

export const useGameStore = create<GameState>((set, get) => ({
  connected: false,
  gameId: null,
  fen: START_FEN,
  lastMove: null,
  turn: 'w',
  moveNumber: 0,
  players: { white: null, black: null },
  clocksMs: [0, 0],
  clockAnchor: 0,
  isFinished: false,
  result: null,
  serverOffsetMs: 0,
  eventLagMs: 0,
  startsAtMs: 0,
  joinedMidGame: false,
  capturedPieces: { byMaxi: [], byGotham: [] },
  waiting: true,

  start() {
    if (!wired) {
      wired = true;
      unsub.push(socket.on('status', (s) => {
        set({ connected: s === 'open' });
        if (s === 'open' && !get().gameId) socket.listGames();
      }));
      unsub.push(socket.on('game_list', (games) => {
        if (get().gameId) return; // already watching one
        const next = pickChess(games, null);
        if (next) subscribeTo(next, set);
        else set({ waiting: true });
      }));
      unsub.push(socket.on('subscribed', ({ snapshot }) => {
        if (snapshot.now_ms) set({ serverOffsetMs: Date.now() - snapshot.now_ms });
        set({
          startsAtMs: snapshot.starts_at_ms ?? 0,
          joinedMidGame: snapshot.move_number > 0,
        });
        applyState(set, {
          gameId: snapshot.id,
          fen: snapshot.state,
          clocks: snapshot.clocks_ms,
          moveNumber: snapshot.move_number,
          players: seatPlayers(snapshot.players),
          lastMove: null,
          finished: false,
          result: null,
        });
      }));
      unsub.push(socket.on('event', (ev) => handleEvent(ev, set, get)));
    }
    // Boot with the persisted trading token — a reload landing here must NOT
    // demote a signed-in user to spectator (stale $0 balance broke trading).
    socket.connect(useAuthStore.getState().tradingToken);
    if (socket.getStatus() === 'open' && !get().gameId) socket.listGames();
  },

  stop() {
    if (rollTimer) { clearTimeout(rollTimer); rollTimer = null; }
    while (unsub.length) unsub.pop()!();
    wired = false;
    socket.unsubscribeGame();
  },
}));

type Setter = (partial: Partial<GameState>) => void;

function syncServerTime(ev: { ts_ms?: number }, set: Setter, get: () => GameState) {
  if (!ev.ts_ms) return;
  const sample = Date.now() - ev.ts_ms;
  const prev = get().serverOffsetMs;
  const offset = prev === 0 ? sample : prev + 0.2 * (sample - prev);
  // Anchor staleness: transit time of THIS event beyond the steady offset.
  const lag = Math.min(2000, Math.max(0, sample - offset));
  set({ serverOffsetMs: offset, eventLagMs: lag });
}

function handleEvent(ev: GameEvent, set: Setter, get: () => GameState) {
  if ('ts_ms' in ev) syncServerTime(ev, set, get);
  switch (ev.type) {
    case 'started':
      set({ startsAtMs: ev.starts_at_ms ?? 0, joinedMidGame: false });
      applyState(set, {
        fen: ev.state, clocks: ev.clocks_ms, moveNumber: ev.move_number,
        players: ev.players ? seatPlayers(ev.players) : get().players,
        lastMove: null, finished: false, result: null,
      });
      return;
    case 'move_played':
      applyState(set, {
        fen: ev.state, clocks: ev.clocks_ms, moveNumber: ev.move_number,
        lastMove: uciSquares(ev.notation),
      });
      return;
    case 'game_over':
      set({ isFinished: true, result: ev.result });
      if (ev.clocks_ms?.length === 2) {
        // Authoritative finals (clamped server-side): a flag fall reads 0:00.
        set({ clocksMs: [ev.clocks_ms[0], ev.clocks_ms[1]], clockAnchor: performance.now() });
      }
      scheduleRoll(set, get);
      return;
    case 'engine_error':
      // Treat an aborted game like a finished one: roll to the next.
      set({ isFinished: true, result: 'aborted' });
      scheduleRoll(set, get);
      return;
  }
}

function scheduleRoll(set: Setter, get: () => GameState) {
  if (rollTimer) clearTimeout(rollTimer);
  rollTimer = setTimeout(function poll() {
    const current = get().gameId;
    const off = socket.on('game_list', (games) => {
      off();
      const next = pickChess(games, current);
      if (next) { socket.unsubscribeGame(); subscribeTo(next, set); }
      else rollTimer = setTimeout(poll, 2000); // none live yet — keep polling
    });
    socket.listGames();
  }, ROLL_DELAY_MS);
}

function subscribeTo(game: GameSummary, set: Setter) {
  set({
    gameId: game.id, waiting: false, isFinished: false, result: null,
    players: seatPlayers(game.players),
    startsAtMs: game.starts_at_ms ?? 0,
  });
  socket.subscribeGame(game.id, 0);
}

function applyState(set: Setter, p: {
  gameId?: string; fen: string; clocks: [number, number]; moveNumber: number;
  players?: Players; lastMove: { from: string; to: string } | null;
  finished?: boolean; result?: GameResult | null;
}) {
  set({
    ...(p.gameId ? { gameId: p.gameId } : {}),
    fen: p.fen,
    clocksMs: p.clocks,
    clockAnchor: performance.now(),
    moveNumber: p.moveNumber,
    turn: turnFromFen(p.fen),
    lastMove: p.lastMove,
    capturedPieces: capturedFromFen(p.fen),
    waiting: false,
    ...(p.players ? { players: p.players } : {}),
    ...(p.finished !== undefined ? { isFinished: p.finished } : {}),
    ...(p.result !== undefined ? { result: p.result } : {}),
  });
}

// ── pure helpers ──────────────────────────────────────────────────────────────

function pickChess(games: GameSummary[], exclude: string | null): GameSummary | null {
  return games.find(g => g.game_type === GAME_TYPE && g.id !== exclude) ?? null;
}

function seatPlayers(players: Player[] | undefined): Players {
  const white = players?.find(p => p.seat === 'white') ?? null;
  const black = players?.find(p => p.seat === 'black') ?? null;
  return { white, black };
}
