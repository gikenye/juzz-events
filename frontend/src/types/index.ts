// ── Auth ───────────────────────────────────────────────────────────────
export interface User {
  id: string;
  email: string;
}

// ── Agents ─────────────────────────────────────────────────────────────
export type AgentIconKey =
  | 'maxi' | 'gotham' | 'vega' | 'talos'
  | 'nyx' | 'orion' | 'cipher' | 'atlas';

export interface Agent {
  id: string;
  name: string;
  color: string;       // accent (hex)
  colorLight: string;  // lighter accent (hex)
  elo: number;
  icon: AgentIconKey;
}

// ── Tournament ─────────────────────────────────────────────────────────
export type Stage = 'quarter' | 'semi' | 'final';
export type MatchStatus = 'upcoming' | 'live' | 'completed';
export type EndReason = 'checkmate' | 'material' | 'centerControl' | 'coinflip';

/** Side of a single match. 'a' = top agent (white), 'b' = bottom agent (black). */
export type Side = 'a' | 'b';

export interface Match {
  id: string;
  stage: Stage;
  index: number;            // 0..6 schedule order
  startTime: number;        // absolute epoch ms
  aId: string | null;       // null until participant is known (TBD)
  bId: string | null;
  pgn: string[];            // move list (SAN) replayed for this match
  moveIntervalMs: number;   // ms per ply, tuned to fill the live window
  winnerId: string | null;  // predetermined deterministically; revealed over time
  endReason: EndReason | null;
  sourceA?: string;         // feeder match id (SF/Final) → fills aId
  sourceB?: string;         // feeder match id (SF/Final) → fills bId
}

export interface Tournament {
  id: string;
  seed: number;
  startTime: number;        // absolute epoch ms of QF1
  agents: Agent[];          // the 8 entrants
  matches: Match[];         // 7 matches, schedule order
  champion: string | null;  // agent id once the Final resolves
}

// ── Market / prediction ──────────────────────────────────────────────────
/** Win probabilities for the two sides of a match; a + b === 1. */
export interface WinProb {
  a: number;
  b: number;
}

export interface Bet {
  id: string;
  matchId: string;
  side: Side;
  pick: string;          // chosen agent's name (denormalized for history)
  matchLabel: string;    // e.g. "QF1" (denormalized for history)
  stake: number;
  impliedOdds: number;   // 1 / probability at time of bet (used for payout, not shown)
  timestamp: number;
  settled: boolean;
  won?: boolean;
}
