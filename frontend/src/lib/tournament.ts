import { Chess } from 'chess.js';
import type { Agent, Tournament, Match, Side, EndReason, WinProb, Stage } from '../types';
import { AGENTS, getAgent } from './agents';
import { PGN_POOL, MAX_MOVES, chessAtMove, capturesFrom, materialValue } from './chess';

// ── Timing constants (user-chosen pacing) ───────────────────────────────
export const MATCH_DURATION_MS = 5 * 60_000;                 // 5-min live window
export const BREAK_MS = 60_000;                              // 60s between matches
export const CYCLE_MS = MATCH_DURATION_MS + BREAK_MS;        // 360s per match slot
export const CHAMPION_MS = 90_000;                           // champion celebration
export const NUM_MATCHES = 7;

const MIN_INTERVAL = 2200;
const MAX_INTERVAL = 6000;
const FILL = 0.82; // longer games fill ~82% of the window; short games finish early

function moveIntervalFor(plies: number): number {
  if (plies <= 0) return MAX_INTERVAL;
  const raw = (MATCH_DURATION_MS * FILL) / plies;
  return Math.round(Math.max(MIN_INTERVAL, Math.min(MAX_INTERVAL, raw)));
}

// ── Deterministic helpers ────────────────────────────────────────────────
export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function hashStr(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function shuffle<T>(arr: T[], rnd: () => number): T[] {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/** Elo expected score: probability that A beats B. */
export function eloExpected(eloA: number, eloB: number): number {
  return 1 / (1 + Math.pow(10, (eloB - eloA) / 400));
}

// ── Decisive-result / tiebreaker logic ────────────────────────────────────
function centerControl(chess: Chess): { white: number; black: number } {
  const squares = ['d4', 'e4', 'd5', 'e5'];
  let white = 0;
  let black = 0;
  const anyc = chess as unknown as { attackers?: (sq: string, color: string) => string[] };
  for (const sq of squares) {
    const p = chess.get(sq as never);
    if (p) p.color === 'w' ? white++ : black++;
    if (typeof anyc.attackers === 'function') {
      try {
        white += anyc.attackers(sq, 'w').length;
        black += anyc.attackers(sq, 'b').length;
      } catch {
        /* attackers unsupported for this position */
      }
    }
  }
  return { white, black };
}

/**
 * Resolve a played-out move list to a decisive winning side. 'a' = white, 'b' = black.
 * Checkmate → mating side; else greater captured material; else center control; else coin flip.
 */
export function resolveSide(moves: string[], coinHash: number): { side: Side; reason: EndReason } {
  const capped = moves.slice(0, MAX_MOVES);
  const chess = chessAtMove(capped, capped.length);

  if (chess.isCheckmate()) {
    return { side: chess.turn() === 'w' ? 'b' : 'a', reason: 'checkmate' };
  }
  const caps = capturesFrom(chess);
  const mw = materialValue(caps.byWhite);
  const mb = materialValue(caps.byBlack);
  if (mw !== mb) return { side: mw > mb ? 'a' : 'b', reason: 'material' };

  const cc = centerControl(chess);
  if (cc.white !== cc.black) return { side: cc.white > cc.black ? 'a' : 'b', reason: 'centerControl' };

  return { side: (coinHash & 1) === 0 ? 'a' : 'b', reason: 'coinflip' };
}

/** Convenience: resolve a match to a concrete winner id (the contract the backend would honor). */
export function resolveMatch(match: Match): { winnerId: string | null; reason: EndReason } {
  const { side, reason } = resolveSide(match.pgn, hashStr(match.id));
  return { winnerId: side === 'a' ? match.aId : match.bId, reason };
}

// ── Generation ─────────────────────────────────────────────────────────
function buildMatch(
  tournamentId: string,
  stage: Stage,
  index: number,
  tournamentStart: number,
  x: Agent,
  y: Agent,
  rnd: () => number,
): Match {
  const code = stage === 'quarter' ? `qf${index + 1}` : stage === 'semi' ? `sf${index - 3}` : 'final';
  const id = `${tournamentId}-${code}`; // unique across tournaments (safe for URLs & bet keys)

  // Predetermined winner: Elo-weighted, so upsets happen but favourites usually advance.
  const pX = eloExpected(x.elo, y.elo);
  const winnerAgent = rnd() < pX ? x : y;
  const loserAgent = winnerAgent === x ? y : x;

  // Pick a game; map the predetermined winner onto that game's natural winning side.
  const entry = PGN_POOL[Math.floor(rnd() * PGN_POOL.length)];
  const { side: pgnSide, reason } = resolveSide(entry.moves, hashStr(id));
  const aAgent = pgnSide === 'a' ? winnerAgent : loserAgent;
  const bAgent = pgnSide === 'a' ? loserAgent : winnerAgent;

  return {
    id,
    stage,
    index,
    startTime: tournamentStart + index * CYCLE_MS,
    aId: aAgent.id,
    bId: bAgent.id,
    pgn: entry.moves,
    moveIntervalMs: moveIntervalFor(entry.moves.length),
    winnerId: winnerAgent.id,
    endReason: reason,
  };
}

export function generateTournament(seed: number, startTime: number): Tournament {
  const rnd = mulberry32(seed);
  const tournamentId = `t-${seed}`;
  const entrants = shuffle([...AGENTS], rnd).slice(0, 8);
  const matches: Match[] = [];

  // Quarter-Finals (indices 0..3)
  const qfPairs = [[0, 1], [2, 3], [4, 5], [6, 7]];
  qfPairs.forEach((pair, i) => {
    matches.push(buildMatch(tournamentId, 'quarter', i, startTime, entrants[pair[0]], entrants[pair[1]], rnd));
  });

  // Semi-Finals (indices 4,5) — feed from QFs
  const sfFeeders = [[0, 1], [2, 3]];
  sfFeeders.forEach((pair, i) => {
    const idx = 4 + i;
    const wa = getAgent(matches[pair[0]].winnerId)!;
    const wb = getAgent(matches[pair[1]].winnerId)!;
    const m = buildMatch(tournamentId, 'semi', idx, startTime, wa, wb, rnd);
    m.sourceA = matches[pair[0]].id;
    m.sourceB = matches[pair[1]].id;
    matches.push(m);
  });

  // Final (index 6) — feed from SFs
  const fa = getAgent(matches[4].winnerId)!;
  const fb = getAgent(matches[5].winnerId)!;
  const fin = buildMatch(tournamentId, 'final', 6, startTime, fa, fb, rnd);
  fin.sourceA = matches[4].id;
  fin.sourceB = matches[5].id;
  matches.push(fin);

  return { id: tournamentId, seed, startTime, agents: entrants, matches, champion: fin.winnerId };
}

/** Seed for the next tournament, derived deterministically from the current one. */
export function nextSeed(seed: number): number {
  return (Math.imul(seed, 1103515245) + 12345) >>> 0;
}

// ── Live derivation (pure function of now) ────────────────────────────────
export type Phase = 'pre' | 'live' | 'break' | 'champion';

export interface LiveState {
  phase: Phase;
  currentIndex: number;
  match: Match | null;
  moveIndex: number;
  gameFinished: boolean;
  tournamentOver: boolean;
}

export function deriveLiveState(t: Tournament, now: number): LiveState {
  const elapsed = now - t.startTime;
  const finalIdx = NUM_MATCHES - 1;

  if (elapsed < 0) {
    return { phase: 'pre', currentIndex: 0, match: t.matches[0], moveIndex: 0, gameFinished: false, tournamentOver: false };
  }

  const finalEnd = finalIdx * CYCLE_MS + MATCH_DURATION_MS;
  if (elapsed >= finalEnd) {
    const fm = t.matches[finalIdx];
    return {
      phase: 'champion',
      currentIndex: finalIdx,
      match: fm,
      moveIndex: fm.pgn.length,
      gameFinished: true,
      tournamentOver: elapsed >= finalEnd + CHAMPION_MS,
    };
  }

  const idx = Math.floor(elapsed / CYCLE_MS);
  const match = t.matches[idx];
  const within = elapsed - idx * CYCLE_MS;
  const plies = match.pgn.length;
  const finishMs = plies * match.moveIntervalMs;

  if (within < MATCH_DURATION_MS) {
    const moveIndex = Math.min(plies, Math.floor(within / match.moveIntervalMs));
    return { phase: 'live', currentIndex: idx, match, moveIndex, gameFinished: within >= finishMs, tournamentOver: false };
  }
  // 60s break before the next match
  return { phase: 'break', currentIndex: idx, match, moveIndex: plies, gameFinished: true, tournamentOver: false };
}

/** A match's winner is revealed once its game has finished replaying. */
export function isMatchRevealed(t: Tournament, matchIdx: number, now: number): boolean {
  const m = t.matches[matchIdx];
  const finishMs = m.pgn.length * m.moveIntervalMs;
  return now - t.startTime >= matchIdx * CYCLE_MS + finishMs;
}

/** Whether both participants of a match are known to the viewer yet. */
export function participantsKnown(t: Tournament, m: Match, now: number): boolean {
  if (m.stage === 'quarter') return true;
  const a = t.matches.find(x => x.id === m.sourceA);
  const b = t.matches.find(x => x.id === m.sourceB);
  return !!a && !!b && isMatchRevealed(t, a.index, now) && isMatchRevealed(t, b.index, now);
}

export function matchStatus(m: Match, now: number): MatchStatusLite {
  const liveEnd = m.startTime + MATCH_DURATION_MS;
  if (now < m.startTime) return 'upcoming';
  if (now < liveEnd) return 'live';
  return 'completed';
}
export type MatchStatusLite = 'upcoming' | 'live' | 'completed';

// ── Win probability ──────────────────────────────────────────────────────
export function winProbAtMove(match: Match, moveIndex: number): WinProb {
  const a = getAgent(match.aId);
  const b = getAgent(match.bId);
  if (!a || !b) return { a: 0.5, b: 0.5 };

  const baseA = eloExpected(a.elo, b.elo);
  const total = match.pgn.length || 1;
  const progress = Math.min(1, moveIndex / total);
  const winnerIsA = match.winnerId === match.aId;
  const targetA = winnerIsA ? 0.94 : 0.06;
  const ease = Math.pow(progress, 1.3);

  let pa = baseA + (targetA - baseA) * ease;
  pa += Math.sin(moveIndex * 1.7) * 0.012 * (1 - ease); // deterministic, reload-stable wobble
  pa = Math.max(0.04, Math.min(0.96, pa));
  return { a: pa, b: 1 - pa };
}

/** Pre-match win probability (Elo only), shown on upcoming cards. */
export function preMatchProb(match: Match): WinProb {
  return winProbAtMove(match, 0);
}

// ── Labels / formatting ──────────────────────────────────────────────────
export function stageLabel(stage: Stage): string {
  return stage === 'quarter' ? 'Quarter-Finals' : stage === 'semi' ? 'Semi-Finals' : 'Final';
}
export function matchShortLabel(m: Match): string {
  if (m.stage === 'quarter') return `QF${m.index + 1}`;
  if (m.stage === 'semi') return `SF${m.index - 3}`;
  return 'Final';
}
export function matchLongLabel(m: Match): string {
  if (m.stage === 'quarter') return `Quarter-Final ${m.index + 1}`;
  if (m.stage === 'semi') return `Semi-Final ${m.index - 3}`;
  return 'Final';
}
export function feederLabel(t: Tournament, matchId?: string): string {
  const m = matchId ? t.matches.find(x => x.id === matchId) : null;
  return m ? `Winner of ${matchShortLabel(m)}` : 'TBD';
}

export function formatLocalTime(epoch: number): string {
  return new Date(epoch).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
}
export function formatCountdown(ms: number): string {
  const s = Math.max(0, Math.floor(ms / 1000));
  const hh = Math.floor(s / 3600);
  const mm = Math.floor((s % 3600) / 60);
  const ss = s % 60;
  const p = (n: number) => String(n).padStart(2, '0');
  return hh > 0 ? `${hh}:${p(mm)}:${p(ss)}` : `${p(mm)}:${p(ss)}`;
}
