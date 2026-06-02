import { create } from 'zustand';
import { Chess } from 'chess.js';
import { IMMORTAL_GAME_MOVES } from '../lib/chess';

interface CapturedPieces {
  byMaxi: string[];   // white pieces captured by black (Maxi)
  byGotham: string[]; // black pieces captured by white (Gotham)
}

interface GameState {
  fen: string;
  moveIndex: number;
  capturedPieces: CapturedPieces;
  lastMove: { from: string; to: string } | null;
  isFinished: boolean;
  maxiPoints: number;
  gothamPoints: number;
  nextMove: () => void;
  resetGame: () => void;
}

function freshChess() {
  return new Chess();
}

export const useGameStore = create<GameState>((set, get) => ({
  fen: new Chess().fen(),
  moveIndex: 0,
  capturedPieces: { byMaxi: [], byGotham: [] },
  lastMove: null,
  isFinished: false,
  maxiPoints: 0,
  gothamPoints: 0,

  nextMove() {
    const { moveIndex, isFinished } = get();
    if (isFinished) return;

    const chess = freshChess();
    const moves = IMMORTAL_GAME_MOVES.slice(0, moveIndex + 1);
    let lastMoveVerbose = null;

    for (const san of moves) {
      lastMoveVerbose = chess.move(san);
    }

    const history = chess.history({ verbose: true });
    const byGotham: string[] = []; // white captures black
    const byMaxi: string[] = [];   // black captures white

    for (const m of history) {
      if (m.captured) {
        if (m.color === 'w') byGotham.push(m.captured);
        else byMaxi.push(m.captured);
      }
    }

    const finished = moveIndex + 1 >= IMMORTAL_GAME_MOVES.length;

    set({
      fen: chess.fen(),
      moveIndex: moveIndex + 1,
      capturedPieces: { byMaxi, byGotham },
      lastMove: lastMoveVerbose ? { from: lastMoveVerbose.from, to: lastMoveVerbose.to } : null,
      isFinished: finished,
      gothamPoints: finished ? get().gothamPoints + 1 : get().gothamPoints,
    });
  },

  resetGame() {
    set({
      fen: new Chess().fen(),
      moveIndex: 0,
      capturedPieces: { byMaxi: [], byGotham: [] },
      lastMove: null,
      isFinished: false,
    });
  },
}));
