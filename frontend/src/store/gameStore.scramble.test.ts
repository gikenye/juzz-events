// Store-level stress test: drive the real ws event path (handleEvent →
// applyState) through a fake socket and assert the board/clock state stays
// consistent through a time scramble, game-over finals, and a reconnect
// catch-up replay — the endgame cases that were fatal in production.
import { describe, it, expect, vi, afterEach } from 'vitest';
import { Chess } from 'chess.js';

// gameStore boots a trading session from authStore; stub it (its real deps need
// the browser). The socket is faked so the test can pump events synchronously.
vi.mock('./authStore', () => ({
  useAuthStore: { getState: () => ({ tradingToken: null }) },
}));

vi.mock('../lib/ws', () => {
  const handlers = new Map<string, Set<(p: unknown) => void>>();
  const socket = {
    on(type: string, fn: (p: unknown) => void) {
      let s = handlers.get(type);
      if (!s) { s = new Set(); handlers.set(type, s); }
      s.add(fn);
      return () => handlers.get(type)?.delete(fn);
    },
    emitTest(type: string, payload: unknown) { handlers.get(type)?.forEach((fn) => fn(payload)); },
    connect() {}, getStatus() { return 'open'; }, listGames() {},
    subscribeGame() {}, unsubscribeGame() {},
  };
  return { socket };
});

import { useGameStore } from './gameStore';
import { socket } from '../lib/ws';

const START = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
const emit = (t: string, p: unknown) =>
  (socket as unknown as { emitTest: (t: string, p: unknown) => void }).emitTest(t, p);

function snapshot() {
  emit('subscribed', {
    snapshot: {
      id: 'g1', state: START, clocks_ms: [30000, 30000], move_number: 0,
      players: [
        { seat: 'white', name: 'W', agent_id: 'a' },
        { seat: 'black', name: 'B', agent_id: 'b' },
      ],
      now_ms: Date.now(), starts_at_ms: 0,
    },
  });
}

afterEach(() => { useGameStore.getState().stop(); });

describe('endgame ws/board stress', () => {
  it('tracks every move of a rapid scramble and lands on the checkmate position', () => {
    const g = useGameStore.getState;
    g().watch('g1'); // pinned: no auto-roll
    snapshot();
    expect(g().gameId).toBe('g1');
    expect(g().fen).toBe(START);

    const c = new Chess();
    const moves = ['e4', 'e5', 'Bc4', 'Nc6', 'Qh5', 'Nf6', 'Qxf7']; // 7. Qxf7#
    let seq = 1;
    let clocks: [number, number] = [30000, 30000];

    for (const san of moves) {
      const mv = c.move(san);
      clocks = mv.color === 'w' ? [clocks[0] - 50, clocks[1]] : [clocks[0], clocks[1] - 50];
      emit('event', {
        type: 'move_played', seq: seq++, game_type: 'chess',
        move_number: c.moveNumber(), clocks_ms: clocks, state: c.fen(),
        notation: mv.from + mv.to, ts_ms: Date.now(),
      });
      // Board never lags the WS authority.
      expect(g().fen).toBe(c.fen());
      expect(g().turn).toBe(c.turn());
      expect(g().clocksMs).toEqual(clocks);
    }
    // Synchronous burst → moves land far under the animation length → no
    // animation pile-up that would freeze the board (and starve the clock).
    expect(g().animate).toBe(false);
    expect(c.isCheckmate()).toBe(true);

    // game-over finals override and freeze the state.
    emit('event', {
      type: 'game_over', seq, game_type: 'chess', move_number: c.moveNumber(),
      clocks_ms: clocks, state: c.fen(), result: 'white_wins',
    });
    expect(g().isFinished).toBe(true);
    expect(g().result).toBe('white_wins');
    expect(g().clocksMs).toEqual(clocks);
    expect(g().fen).toBe(c.fen());
  });

  it('survives a reconnect catch-up replay and ends on the latest position', () => {
    const g = useGameStore.getState;
    g().watch('g1');
    snapshot();

    // Play a few live moves.
    const c = new Chess();
    let seq = 1;
    const live = ['e4', 'c5', 'Nf3'];
    for (const san of live) {
      const mv = c.move(san);
      emit('event', {
        type: 'move_played', seq: seq++, game_type: 'chess', move_number: c.moveNumber(),
        clocks_ms: [29000, 29500], state: c.fen(), notation: mv.from + mv.to, ts_ms: Date.now(),
      });
    }
    const reconnectOffset = g().serverOffsetMs;

    // Reconnect catch-up: the backend re-snapshots then replays buffered moves
    // carrying OLD ts_ms (8s..2s ago), in one synchronous burst.
    snapshot(); // re-subscribe resets to the snapshot baseline
    const c2 = new Chess();
    const replay = ['e4', 'c5', 'Nf3', 'd6', 'd4', 'cxd4', 'Nxd4'];
    let age = 8000;
    for (const san of replay) {
      const mv = c2.move(san);
      emit('event', {
        type: 'move_played', seq: seq++, game_type: 'chess', move_number: c2.moveNumber(),
        clocks_ms: [27000, 27500], state: c2.fen(), notation: mv.from + mv.to,
        ts_ms: Date.now() - age,
      });
      age = Math.max(2000, age - 1000);
    }

    // Board ends on the last replayed position, and the stale burst did not
    // drag the server offset (which is what desynced the clock at flag fall).
    expect(g().fen).toBe(c2.fen());
    expect(g().turn).toBe(c2.turn());
    expect(g().clocksMs).toEqual([27000, 27500]);
    expect(Math.abs(g().serverOffsetMs - reconnectOffset)).toBeLessThan(250);
  });
});
