// Pure ws → board/clock synchronization core.
//
// No DOM, socket, store, or React deps, so the endgame behaviour that matters
// most — rapid move bursts, flag fall, and reconnect catch-up replays — is
// deterministically unit-testable (see liveSync.test.ts). gameStore and
// useLiveClocks delegate here so there is one audited source of truth.
import { turnFromFen, capturedFromFen } from './chessFen';

// Board piece-move animation length. Moves landing faster than this snap with
// no animation, so a scramble or catch-up burst can't pile up overlapping
// animations and freeze the board (which also starves the clock interval).
export const MOVE_ANIM_MS = 200;

// ── server-time sync ─────────────────────────────────────────────────────────
// offset = wall clock − server ts (the steady client↔server skew).
// lag = how stale THIS event was on arrival (network transit), bounded.
//
// The true offset is the FLOOR of (wall − ts): network transit is always >= 0,
// so the smallest sample seen is the closest to the real skew. This matters in
// the endgame: the catch-up burst the backend replays after a reconnect carries
// old ts_ms (large samples), and a naive average would let it drag the offset
// and desync the clock by seconds right at flag fall. A min-tracking estimator
// ignores those larger samples automatically; the next live event (small
// sample) pulls the floor straight back down. A small creep lets the estimate
// follow genuine slow clock drift without chasing latency spikes.
//
// `prevOffset` is assumed already seeded (the caller seeds it from the first
// event / snapshot timestamp) — 0 is a perfectly valid offset, not a sentinel.
const LAG_CAP_MS = 2000;
const OFFSET_CREEP_MS = 25;

export function nextServerSync(
  prevOffset: number,
  tsMs: number | undefined,
  nowWall: number,
): { offset: number; lag: number } {
  if (!tsMs) return { offset: prevOffset, lag: 0 };
  const sample = nowWall - tsMs;
  const offset = Math.min(sample, prevOffset + OFFSET_CREEP_MS);
  const lag = Math.min(LAG_CAP_MS, Math.max(0, sample - offset));
  return { offset, lag };
}

// ── clock display ────────────────────────────────────────────────────────────
export interface ClockInputs {
  clocksMs: [number, number]; // [white, black] authoritative at the anchor
  clockAnchor: number;        // performance.now() when those values arrived
  turn: 'w' | 'b';            // side to move (ticks down)
  eventLagMs: number;         // staleness of the anchoring event on arrival
  isFinished: boolean;
  countdown: boolean;         // pre-game countdown active (clocks frozen)
  now: number;                // performance.now() sample; 0 = not sampled yet
}

/**
 * Displayed clocks: the side to move counts down from the anchor in real time;
 * the idle side is frozen; both freeze when finished or in countdown. Never
 * negative, and never ticks up between anchors.
 */
export function liveClock(i: ClockInputs): { white: number; black: number } {
  const elapsed = i.isFinished || i.countdown || i.now === 0
    ? 0
    : Math.max(0, i.now - i.clockAnchor) + i.eventLagMs;
  return {
    white: Math.max(0, i.clocksMs[0] - (i.turn === 'w' ? elapsed : 0)),
    black: Math.max(0, i.clocksMs[1] - (i.turn === 'b' ? elapsed : 0)),
  };
}

// ── board position reducer ───────────────────────────────────────────────────
export interface PositionInput {
  gameId?: string;
  fen: string;
  clocks: [number, number];
  moveNumber: number;
  lastMove: { from: string; to: string } | null;
  finished?: boolean;
}

export interface PositionPatch {
  gameId?: string;
  fen: string;
  clocksMs: [number, number];
  clockAnchor: number;
  moveNumber: number;
  turn: 'w' | 'b';
  lastMove: { from: string; to: string } | null;
  capturedPieces: { byBlack: string[]; byWhite: string[] };
  animate: boolean;
  waiting: boolean;
  isFinished?: boolean;
}

/**
 * Derive the board state for a new position. `now`/`lastApplyAt` are
 * performance.now() of this and the previous apply; a gap shorter than the
 * animation length disables animation so bursts don't thrash the board.
 */
export function applyPosition(p: PositionInput, now: number, lastApplyAt: number): PositionPatch {
  return {
    ...(p.gameId ? { gameId: p.gameId } : {}),
    fen: p.fen,
    clocksMs: p.clocks,
    clockAnchor: now,
    moveNumber: p.moveNumber,
    turn: turnFromFen(p.fen),
    lastMove: p.lastMove,
    capturedPieces: capturedFromFen(p.fen),
    animate: now - lastApplyAt > MOVE_ANIM_MS,
    waiting: false,
    ...(p.finished !== undefined ? { isFinished: p.finished } : {}),
  };
}
