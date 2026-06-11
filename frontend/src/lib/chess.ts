import { Chess } from 'chess.js';

// The Immortal Game (Anderssen vs Kieseritzky, 1851) — White mates.
export const IMMORTAL_GAME_MOVES = [
  'e4', 'e5', 'f4', 'exf4', 'Bc4', 'Qh4+', 'Kf1', 'b5',
  'Bxb5', 'Nf6', 'Nf3', 'Qh6', 'd3', 'Nh5', 'Nh4', 'Qg5',
  'Nf5', 'c6', 'g4', 'Nf6', 'Rg1', 'cxb5', 'h4', 'Qg6',
  'h5', 'Qg5', 'Qf3', 'Ng8', 'Bxf4', 'Qf6', 'Nc3', 'Bc5',
  'Nd5', 'Qxb2', 'Bd6', 'Bxg1', 'e5', 'Qxa1+', 'Ke2', 'Na6',
  'Nxg7+', 'Kd8', 'Qf6+', 'Nxf6', 'Be7#',
];

// The Opera Game (Morphy vs Allies, 1858) — White mates.
const OPERA_GAME_MOVES = [
  'e4', 'e5', 'Nf3', 'd6', 'd4', 'Bg4', 'dxe5', 'Bxf3',
  'Qxf3', 'dxe5', 'Bc4', 'Nf6', 'Qb3', 'Qe7', 'Nc3', 'c6',
  'Bg5', 'b5', 'Nxb5', 'cxb5', 'Bxb5+', 'Nbd7', 'O-O-O', 'Rd8',
  'Rxd7', 'Rxd7', 'Rd1', 'Qe6', 'Bxd7+', 'Nxd7', 'Qb8+', 'Nxb8',
  'Rd8#',
];

// Scholar's Mate — White mates in 4.
const SCHOLARS_MATE_MOVES = ['e4', 'e5', 'Bc4', 'Nc6', 'Qh5', 'Nf6', 'Qxf7#'];

// Légal's Mate — White mates after the queen sacrifice.
const LEGAL_MATE_MOVES = [
  'e4', 'e5', 'Nf3', 'd6', 'Bc4', 'Bg4', 'Nc3', 'g6',
  'Nxe5', 'Bxd1', 'Bxf7+', 'Ke7', 'Nd5#',
];

export interface PgnEntry {
  id: string;
  label: string;
  moves: string[];
}

// Pool of games replayed for matches. Four end in checkmate (decisive);
// "attrition" is the Immortal Game cut off at the move cap before mate, so it
// resolves on captured material instead — exercising the tiebreaker path.
export const PGN_POOL: PgnEntry[] = [
  { id: 'immortal',  label: 'The Immortal Game', moves: IMMORTAL_GAME_MOVES },
  { id: 'opera',     label: 'The Opera Game',    moves: OPERA_GAME_MOVES },
  { id: 'scholars',  label: "Scholar's Mate",    moves: SCHOLARS_MATE_MOVES },
  { id: 'legal',     label: "Légal's Mate",      moves: LEGAL_MATE_MOVES },
  { id: 'attrition', label: 'War of Attrition',  moves: IMMORTAL_GAME_MOVES.slice(0, 40) },
];

// Hard cap on plies; a game reaching it ends and is decided by tiebreaker.
export const MAX_MOVES = 200;

export const PIECE_VALUE: Record<string, number> = {
  p: 1, n: 3, b: 3, r: 5, q: 9, k: 0,
};

export interface Captures {
  byWhite: string[]; // black pieces captured by white
  byBlack: string[]; // white pieces captured by black
}

/** Replay `moves[0..count)` and return the resulting Chess instance. */
export function chessAtMove(moves: string[], count: number): Chess {
  const chess = new Chess();
  const n = Math.min(count, moves.length);
  for (let i = 0; i < n; i++) chess.move(moves[i]);
  return chess;
}

/** Captured pieces for each side from a played-out Chess instance. */
export function capturesFrom(chess: Chess): Captures {
  const byWhite: string[] = [];
  const byBlack: string[] = [];
  for (const m of chess.history({ verbose: true })) {
    if (!m.captured) continue;
    if (m.color === 'w') byWhite.push(m.captured);
    else byBlack.push(m.captured);
  }
  return { byWhite, byBlack };
}

export function materialValue(pieces: string[]): number {
  return pieces.reduce((sum, p) => sum + (PIECE_VALUE[p] ?? 0), 0);
}
