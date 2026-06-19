// chess.js-backed helper for the live board: which king (if any) is in check,
// so the board can flag it. Kept apart from chessFen.ts, which stays engine-free.
import { Chess } from 'chess.js';

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
