// chess.js-backed analysis for the live board: which king is in check (for the
// on-board warning) and what kind of move just happened (for the right sound).
// Kept apart from chessFen.ts, which stays engine-free.
import { Chess } from 'chess.js';
import type { SoundKind } from './sound';

/** Algebraic square of the side-to-move's king if it's in check, else null. */
export function kingInCheckSquare(fen: string): string | null {
  try {
    const c = new Chess(fen);
    if (!c.inCheck()) return null;
    const turn = c.turn();
    for (const row of c.board()) {
      for (const cell of row) {
        if (cell && cell.type === 'k' && cell.color === turn) return cell.square;
      }
    }
  } catch { /* malformed fen — no highlight */ }
  return null;
}

// ── move classification (no engine needed beyond the check probe) ──────────────

function ranks(fen: string): string[] {
  // 8 rows, rank 8 → rank 1, each expanded to 8 chars ('.' = empty).
  return fen.split(' ')[0].split('/').map((row) => {
    let out = '';
    for (const ch of row) out += ch >= '1' && ch <= '8' ? '.'.repeat(+ch) : ch;
    return out;
  });
}

function pieceAt(fen: string, square: string): string | null {
  const file = square.charCodeAt(0) - 97; // a→0
  const rank = Number(square[1]);          // 1→8
  const ch = ranks(fen)[8 - rank]?.[file];
  return ch && ch !== '.' ? ch : null;
}

function pieceCount(fen: string): number {
  return (fen.split(' ')[0].match(/[a-zA-Z]/g) ?? []).length;
}

/**
 * The sound a move warrants. Checkmate is handled by the caller via the
 * game-over flag, so this never returns 'end'.
 */
export function classifyMove(
  prevFen: string,
  newFen: string,
  move: { from: string; to: string },
): SoundKind {
  let check = false;
  try { check = new Chess(newFen).inCheck(); } catch { /* ignore */ }

  const toPiece = (pieceAt(newFen, move.to) ?? '').toLowerCase();
  const fromWasPawn = (pieceAt(prevFen, move.from) ?? '').toLowerCase() === 'p';
  const fileDelta = Math.abs(move.from.charCodeAt(0) - move.to.charCodeAt(0));

  if (check) return 'check';
  if (fromWasPawn && toPiece !== 'p') return 'promote';
  if (toPiece === 'k' && fileDelta >= 2) return 'castle';
  if (pieceCount(prevFen) > pieceCount(newFen)) return 'capture';
  return 'move';
}
