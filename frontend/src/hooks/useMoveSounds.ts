// Plays a board cue for each fresh live move (and the game-over cue) on the
// screen that's driving the live game store. Mount once per live view.
//
// Only single-step advances from a focused tab make sound: a reconnect
// catch-up burst (move number jumps by >1) and game switches (reset) are
// silent, so the board never turns into a wall of clicks.
import { useEffect, useRef } from 'react';
import { useGameStore } from '../store/gameStore';
import { playSound, wireAudioUnlock } from '../lib/sound';
import { classifyMove } from '../lib/chessCheck';

export function useMoveSounds(): void {
  const moveNumber = useGameStore((s) => s.moveNumber);
  const isFinished = useGameStore((s) => s.isFinished);

  // Baseline starts at the current state so the initial snapshot is silent.
  const prev = useRef<{ moveNumber: number; fen: string; finished: boolean } | null>(null);
  if (prev.current === null) {
    const s = useGameStore.getState();
    prev.current = { moveNumber: s.moveNumber, fen: s.fen, finished: s.isFinished };
  }

  useEffect(() => { wireAudioUnlock(); }, []);

  useEffect(() => {
    const s = useGameStore.getState();
    const p = prev.current!;
    if (s.isFinished && !p.finished) {
      playSound('end');
    } else if (
      !s.isFinished &&
      s.moveNumber === p.moveNumber + 1 &&
      s.lastMove &&
      !document.hidden
    ) {
      playSound(classifyMove(p.fen, s.fen, s.lastMove));
    }
    prev.current = { moveNumber: s.moveNumber, fen: s.fen, finished: s.isFinished };
  }, [moveNumber, isFinished]);
}
