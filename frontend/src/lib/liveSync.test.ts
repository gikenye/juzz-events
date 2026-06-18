// Stress tests for the ws → board/clock synchronization core, focused on the
// very last moments of a game: time scrambles (rapid move bursts), flag fall,
// game-over finals, and reconnect catch-up replays. These are the cases that
// were fatal in production.
import { describe, it, expect } from 'vitest';
import { Chess } from 'chess.js';
import { liveClock, nextServerSync, applyPosition, MOVE_ANIM_MS } from './liveSync';
import { turnFromFen } from './chessFen';

const START = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';

describe('liveClock', () => {
  const base = { clockAnchor: 1000, eventLagMs: 0, isFinished: false, countdown: false };

  it('counts down only the side to move; idle side frozen', () => {
    const w = liveClock({ ...base, clocksMs: [60000, 60000], turn: 'w', now: 1000 + 5000 });
    expect(w.white).toBe(55000);
    expect(w.black).toBe(60000);
    const b = liveClock({ ...base, clocksMs: [60000, 60000], turn: 'b', now: 1000 + 5000 });
    expect(b.black).toBe(55000);
    expect(b.white).toBe(60000);
  });

  it('never goes negative at flag fall', () => {
    const c = liveClock({ ...base, clocksMs: [300, 40000], turn: 'w', now: 1000 + 9999 });
    expect(c.white).toBe(0);
    expect(c.black).toBe(40000);
  });

  it('freezes at the authoritative finals when finished', () => {
    const c = liveClock({ ...base, isFinished: true, clocksMs: [12345, 0], turn: 'b', now: 1000 + 99999 });
    expect(c).toEqual({ white: 12345, black: 0 });
  });

  it('freezes during the pre-game countdown and before the first now sample', () => {
    expect(liveClock({ ...base, countdown: true, clocksMs: [60000, 60000], turn: 'w', now: 9e9 }))
      .toEqual({ white: 60000, black: 60000 });
    expect(liveClock({ ...base, clocksMs: [60000, 60000], turn: 'w', now: 0 }))
      .toEqual({ white: 60000, black: 60000 });
  });

  it('adds the arrival lag of the anchoring event', () => {
    const c = liveClock({ ...base, eventLagMs: 800, clocksMs: [60000, 60000], turn: 'w', now: 1000 + 2000 });
    expect(c.white).toBe(60000 - 2000 - 800);
  });

  it('is monotonic non-increasing for the ticking side as time advances', () => {
    let prev = Infinity;
    for (let t = 0; t <= 6000; t += 200) {
      const { white } = liveClock({ ...base, clocksMs: [6000, 60000], turn: 'w', now: 1000 + t });
      expect(white).toBeLessThanOrEqual(prev);
      expect(white).toBeGreaterThanOrEqual(0);
      prev = white;
    }
  });
});

describe('nextServerSync', () => {
  it('holds steady when a sample matches the current offset', () => {
    expect(nextServerSync(300, 1_000_000, 1_000_300)).toEqual({ offset: 300, lag: 0 });
  });

  it('tracks the transit floor: a higher-latency event does not inflate the offset', () => {
    // Steady floor 300; this event took 500ms transit. Offset stays at the floor
    // (creeps at most OFFSET_CREEP_MS), and the extra transit shows up as lag.
    const { offset, lag } = nextServerSync(300, 1_000_000, 1_000_500);
    expect(offset).toBeLessThanOrEqual(300 + 25);
    expect(offset).toBeGreaterThanOrEqual(300);
    expect(lag).toBeGreaterThanOrEqual(0);
    expect(lag).toBeLessThanOrEqual(2000);
  });

  it('caps lag at 2000ms for a very stale anchor', () => {
    const { lag } = nextServerSync(300, 1_000_000, 1_000_000 + 300 + 9999);
    expect(lag).toBe(2000);
  });

  it('does not let a stale/replayed event drag the steady offset (reconnect catch-up)', () => {
    // Steady offset ~300ms. A replayed event carries ts_ms from 10s ago.
    const steady = 300;
    const replay = nextServerSync(steady, 1_000_000, 1_000_000 + steady + 10_000);
    expect(replay.offset).toBeLessThanOrEqual(steady + 25); // floor barely creeps
    expect(replay.offset).toBeGreaterThanOrEqual(steady);
  });

  it('does nothing without a server timestamp', () => {
    expect(nextServerSync(300, undefined, 1_000_500)).toEqual({ offset: 300, lag: 0 });
  });
});

describe('applyPosition', () => {
  it('derives turn / captures / clocks from a move and re-anchors', () => {
    const c = new Chess();
    c.move('e4'); c.move('d5'); c.move('exd5'); // white captures a pawn
    const patch = applyPosition(
      { fen: c.fen(), clocks: [58000, 59000], moveNumber: 3, lastMove: { from: 'e4', to: 'd5' } },
      5000, 0,
    );
    expect(patch.turn).toBe(turnFromFen(c.fen()));
    expect(patch.clocksMs).toEqual([58000, 59000]);
    expect(patch.clockAnchor).toBe(5000);
    expect(patch.capturedPieces.byWhite).toContain('p'); // black pawn captured
    expect(patch.waiting).toBe(false);
  });

  it('animates a paced move but snaps a burst move', () => {
    const slow = applyPosition({ fen: START, clocks: [60000, 60000], moveNumber: 1, lastMove: null }, 1000, 0);
    expect(slow.animate).toBe(true);
    const fast = applyPosition({ fen: START, clocks: [60000, 60000], moveNumber: 2, lastMove: null }, 1000 + MOVE_ANIM_MS - 50, 1000);
    expect(fast.animate).toBe(false);
  });

  it('passes the finished flag through, and sets gameId only when given', () => {
    expect(applyPosition({ fen: START, clocks: [0, 0], moveNumber: 1, lastMove: null, finished: true }, 1, 0).isFinished).toBe(true);
    expect('isFinished' in applyPosition({ fen: START, clocks: [0, 0], moveNumber: 1, lastMove: null }, 1, 0)).toBe(false);
    expect(applyPosition({ gameId: 'g1', fen: START, clocks: [0, 0], moveNumber: 1, lastMove: null }, 1, 0).gameId).toBe('g1');
    expect('gameId' in applyPosition({ fen: START, clocks: [0, 0], moveNumber: 1, lastMove: null }, 1, 0)).toBe(false);
  });
});

describe('endgame scenario', () => {
  it('stays board/turn-consistent through a rapid move burst then game over', () => {
    // Drive a real game; blast its moves in a sub-animation-length burst.
    const c = new Chess();
    const SCHOLAR = ['e4', 'e5', 'Bc4', 'Nc6', 'Qh5', 'Nf6', 'Qxf7']; // 7. Qxf7# mate
    let t = 10_000;        // performance.now()-style clock
    let last = 0;          // previous apply time
    let clocks: [number, number] = [30000, 30000];
    let patch = applyPosition({ fen: c.fen(), clocks, moveNumber: 0, lastMove: null }, t, last);
    last = t;

    for (const san of SCHOLAR) {
      const before = c.fen();
      const mv = c.move(san);
      t += 80; // moves 80ms apart — a real scramble, well under MOVE_ANIM_MS
      // mover's clock drops a little each move
      clocks = mv.color === 'w' ? [clocks[0] - 60, clocks[1]] : [clocks[0], clocks[1] - 60];
      patch = applyPosition(
        { fen: c.fen(), clocks, moveNumber: c.moveNumber(), lastMove: { from: mv.from, to: mv.to } },
        t, last,
      );
      last = t;
      // Board never lags the authority: turn always matches the FEN just applied.
      expect(patch.turn).toBe(turnFromFen(c.fen()));
      expect(patch.fen).toBe(c.fen());
      // Burst moves snap (no animation pile-up that would freeze the board).
      expect(patch.animate).toBe(false);
      expect(before).not.toBe(c.fen());
    }

    expect(c.isCheckmate()).toBe(true);
    // Game-over finals arrive and freeze the clock at the authoritative values.
    const finals: [number, number] = [clocks[0], clocks[1]];
    const display = liveClock({
      clocksMs: finals, clockAnchor: t, turn: patch.turn,
      eventLagMs: 0, isFinished: true, countdown: false, now: t + 5_000,
    });
    expect(display).toEqual({ white: finals[0], black: finals[1] });
  });

  it('keeps the clock stable across a reconnect catch-up replay near flag fall', () => {
    // Steady offset established by live play.
    let offset = nextServerSync(0, 1_000_000, 1_000_280).offset; // seed ~280
    ({ offset } = nextServerSync(offset, 1_000_500, 1_000_790));  // still live, ~290
    const beforeReplay = offset;

    // Reconnect: a burst of replayed events carrying ts_ms from up to 8s ago.
    for (let age = 8000; age >= 2000; age -= 1000) {
      ({ offset } = nextServerSync(offset, 2_000_000 - age, 2_000_000));
    }
    // The stale burst can only creep the offset a little — never lurch by the
    // seconds a naive average would have, which is what desynced the clock.
    expect(Math.abs(offset - beforeReplay)).toBeLessThan(200);

    // And a single fresh live event pulls the floor straight back to the truth.
    ({ offset } = nextServerSync(offset, 2_100_000, 2_100_000 + beforeReplay));
    expect(offset).toBeCloseTo(beforeReplay, 5);
  });
});
