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

// Board piece-move animation length. Moves landing faster than this snap with
// no animation (see `animate`), so a time scramble or a reconnect catch-up
// burst can't pile up overlapping animations and freeze the board.
export const MOVE_ANIM_MS = 200;

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
  capturedPieces: { byBlack: string[]; byWhite: string[] };
  waiting: boolean;             // connected but no live chess game yet
  animate: boolean;             // animate the next board update (false during fast bursts)

  start: () => void;
  watch: (gameId: string) => void;
  stop: () => void;
}

let wired = false;
let pinned = false; // explicit-game mode (match routes): no auto-roll
let rollTimer: ReturnType<typeof setTimeout> | null = null;
let lastApplyAt = 0; // performance.now() of the last board update, for animate gating
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
  capturedPieces: { byBlack: [], byWhite: [] },
  waiting: true,
  animate: true,

  start() {
    pinned = false;
    if (!wired) {
      wired = true;
      unsub.push(socket.on('status', (s) => {
        set({ connected: s === 'open' });
        if (s === 'open' && !get().gameId) socket.listGames();
      }));
      unsub.push(socket.on('game_list', (games) => {
        if (pinned || get().gameId) return; // pinned to a match, or already watching one
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
      // The game we were watching vanished (ended + reaped, or a stale id after a
      // tournament rolled over). Drop it, stop the reconnect from re-subscribing,
      // and rediscover — otherwise we stay frozen on a dead board forever.
      unsub.push(socket.on('error', (err) => {
        if (err.code !== 'GAME_NOT_FOUND') return;
        socket.unsubscribeGame();
        set({ gameId: null, waiting: true, isFinished: false, result: null, lastMove: null });
        if (!pinned) socket.listGames();
      }));
    }
    // Boot with the persisted trading token — a reload landing here must NOT
    // demote a signed-in user to spectator (stale $0 balance broke trading).
    socket.connect(useAuthStore.getState().tradingToken);
    if (socket.getStatus() === 'open' && !get().gameId) socket.listGames();
  },

  /** Pin to one game (match routes): same stream wiring, no auto-roll. */
  watch(gameId: string) {
    get().start(); // idempotent wiring + socket connect
    pinned = true; // after start(), which resets it
    if (get().gameId === gameId) return;
    if (rollTimer) { clearTimeout(rollTimer); rollTimer = null; }
    socket.unsubscribeGame();
    set({ gameId, waiting: false, isFinished: false, result: null, lastMove: null });
    socket.subscribeGame(gameId, 0);
  },

  stop() {
    if (rollTimer) { clearTimeout(rollTimer); rollTimer = null; }
    while (unsub.length) unsub.pop()!();
    wired = false;
    pinned = false;
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
  if (pinned) return; // match routes follow the bracket, not the roll
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
  const now = performance.now();
  const animate = now - lastApplyAt > MOVE_ANIM_MS;
  lastApplyAt = now;
  set({
    ...(p.gameId ? { gameId: p.gameId } : {}),
    fen: p.fen,
    animate,
    clocksMs: p.clocks,
    clockAnchor: now,
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
