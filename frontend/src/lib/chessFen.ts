// Pure FEN helpers for the live board — no chess.js, no engine.

export function turnFromFen(fen: string): 'w' | 'b' {
  return fen.split(' ')[1] === 'b' ? 'b' : 'w';
}

export function uciSquares(uci: string): { from: string; to: string } | null {
  if (!uci || uci.length < 4) return null;
  return { from: uci.slice(0, 2), to: uci.slice(2, 4) };
}

const FULL: Record<string, number> = { p: 8, n: 2, b: 2, r: 2, q: 1, k: 1 };

// Captured pieces derived from the FEN piece-placement field.
// byBlack = white pieces captured by black; byWhite = black pieces captured by white.
// Returned as lowercase type chars, heaviest first.
export function capturedFromFen(fen: string): { byBlack: string[]; byWhite: string[] } {
  const placement = fen.split(' ')[0];
  const white: Record<string, number> = {};
  const black: Record<string, number> = {};
  for (const ch of placement) {
    if (ch >= 'A' && ch <= 'Z') white[ch.toLowerCase()] = (white[ch.toLowerCase()] || 0) + 1;
    else if (ch >= 'a' && ch <= 'z') black[ch] = (black[ch] || 0) + 1;
  }
  const byBlack: string[] = [];
  const byWhite: string[] = [];
  for (const t of ['q', 'r', 'b', 'n', 'p']) {
    for (let i = 0; i < FULL[t] - (white[t] || 0); i++) byBlack.push(t);
    for (let i = 0; i < FULL[t] - (black[t] || 0); i++) byWhite.push(t);
  }
  return { byBlack, byWhite };
}
