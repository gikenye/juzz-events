import { describe, it, expect } from 'vitest';
import { turnFromFen, uciSquares, capturedFromFen } from './chessFen';

const START = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';

describe('chessFen', () => {
  it('reads side to move', () => {
    expect(turnFromFen(START)).toBe('w');
    expect(turnFromFen('rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq - 0 1')).toBe('b');
  });

  it('splits UCI into squares', () => {
    expect(uciSquares('e2e4')).toEqual({ from: 'e2', to: 'e4' });
    expect(uciSquares('e7e8q')).toEqual({ from: 'e7', to: 'e8' }); // promotion suffix ignored
    expect(uciSquares('')).toBeNull();
    expect(uciSquares('e2')).toBeNull();
  });

  it('no captures at the start', () => {
    expect(capturedFromFen(START)).toEqual({ byMaxi: [], byGotham: [] });
  });

  it('derives captured pieces from missing material', () => {
    // black queen gone (d8), white down two pawns
    const fen = 'rnb1kbnr/pppppppp/8/8/8/8/PPPPPP2/RNBQKBNR w - - 0 1';
    const { byMaxi, byGotham } = capturedFromFen(fen);
    expect(byGotham).toEqual(['q']);       // white captured black's queen
    expect(byMaxi).toEqual(['p', 'p']);    // black captured two white pawns
  });
});
