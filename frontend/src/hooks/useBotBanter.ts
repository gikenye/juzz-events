import { useCallback, useEffect, useRef, useState } from 'react';
import { Chess } from 'chess.js';
import type { Side } from '../types';
import { pickTaunt, type TauntCategory } from '../lib/taunts';

export interface Utterance {
  speaker: Side;   // 'a' = white seat (bottom), 'b' = black seat (top)
  text: string;
}

interface Params {
  /** Resets all banter state when the watched game changes. */
  gameId: string | null;
  /** Ply counter from the live game store (moveNumber). */
  moveNumber: number;
  /** Current position FEN — used to detect check/mate and captures. */
  fen: string;
  /** Side to move now ('w' | 'b'); the *mover* is the other side. */
  turn: string;
  finished: boolean;
  /** Winning seat once the game ends, or null. */
  winnerSeat: Side | null;
  /** Seat-resolved agent ids (white seat = 'a', black seat = 'b'). */
  whiteAgentId: string;
  blackAgentId: string;
}

const VISIBLE_MS = 4200;      // how long a bubble stays up
const THROTTLE_MS = 3500;     // min gap between event taunts (checks/mate bypass)
const REPLY_DELAY_MS = 1600;  // opponent clap-back delay
const REPLY_CHANCE = 0.55;
const FILLER_IDLE_MS = 9000;  // speak filler after this much silence
const FILLER_TICK_MS = 1500;
const END_REPLY_MS = 2200;    // loser's cope after winner's gloat

const PIECE_VALUE: Record<string, number> = { p: 1, n: 3, b: 3, r: 5, q: 9 };

/** Total piece count in a FEN placement field (to detect captures cheaply). */
function pieceCount(fen: string): number {
  const placement = fen.split(' ')[0];
  let n = 0;
  for (const c of placement) if (/[a-zA-Z]/.test(c)) n++;
  return n;
}

/** White-minus-black material on the board, from the FEN. */
function materialBalance(fen: string): number {
  const placement = fen.split(' ')[0];
  let bal = 0;
  for (const c of placement) {
    const v = PIECE_VALUE[c.toLowerCase()];
    if (!v) continue;
    bal += c === c.toUpperCase() ? v : -v;
  }
  return bal;
}

/**
 * Live-arena trash talk for the two bots, driven entirely by the server game
 * stream. Watches ply transitions to fire event taunts (capture / check / mate),
 * schedules occasional opponent clap-backs flavored by who's ahead, emits idle
 * filler during quiet stretches, and a gloat/cope pair at game end.
 *
 * Capture/check are read off the live FEN (chess.js inCheck/isCheckmate; piece
 * count drop = capture) since the wire notation is bare UCI. Pure cosmetic flavor.
 */
export function useBotBanter({
  gameId, moveNumber, fen, turn, finished, winnerSeat, whiteAgentId, blackAgentId,
}: Params): Utterance | null {
  // The utterance carries the game it belongs to, so a game change makes it
  // stale on read — no setState in the reset effect.
  const [spoken, setSpoken] = useState<{ game: string | null; u: Utterance } | null>(null);

  const lastPlyRef = useRef(0);
  const lastFenRef = useRef(fen);
  const lastSpokeAtRef = useRef(0);
  const lastSpeakerRef = useRef<Side | null>(null);
  const lastLineRef = useRef<string | undefined>(undefined);
  const endHandledRef = useRef(false);
  const clearTimerRef = useRef<number | null>(null);
  const pendingTimersRef = useRef<number[]>([]);

  const speak = useCallback((speaker: Side, category: TauntCategory) => {
    const id = speaker === 'a' ? whiteAgentId : blackAgentId;
    const text = pickTaunt(id, category, lastLineRef.current);
    lastLineRef.current = text;
    lastSpeakerRef.current = speaker;
    lastSpokeAtRef.current = Date.now();
    setSpoken({ game: gameId, u: { speaker, text } });
    if (clearTimerRef.current) window.clearTimeout(clearTimerRef.current);
    clearTimerRef.current = window.setTimeout(() => setSpoken(null), VISIBLE_MS);
  }, [whiteAgentId, blackAgentId, gameId]);

  // Reset all per-game refs/timers when the watched game changes.
  useEffect(() => {
    lastPlyRef.current = 0;
    lastSpokeAtRef.current = 0;
    lastSpeakerRef.current = null;
    lastLineRef.current = undefined;
    endHandledRef.current = false;
    const pending = pendingTimersRef.current;
    return () => {
      pending.forEach(t => window.clearTimeout(t));
      pendingTimersRef.current = [];
      if (clearTimerRef.current) window.clearTimeout(clearTimerRef.current);
    };
  }, [gameId]);

  // Event taunts on each new ply.
  useEffect(() => {
    if (finished) return;
    const ply = moveNumber;
    if (ply <= lastPlyRef.current) { lastPlyRef.current = ply; lastFenRef.current = fen; return; }
    const prevFen = lastFenRef.current;
    lastPlyRef.current = ply;
    lastFenRef.current = fen;
    if (ply === 0) return;

    // The mover is the side that is NOT to move now.
    const moverSide: Side = turn === 'w' ? 'b' : 'a';

    let isCheck = false;
    try {
      const c = new Chess(fen);
      isCheck = c.inCheck() || c.isCheckmate();
    } catch { /* malformed fen — skip */ }
    const wasCapture = pieceCount(fen) < pieceCount(prevFen);

    let category: TauntCategory | null = null;
    if (isCheck) category = 'check';
    else if (wasCapture) category = 'capture';
    if (!category) return;

    const now = Date.now();
    if (now - lastSpokeAtRef.current < THROTTLE_MS && category !== 'check') return;

    speak(moverSide, category);

    // Occasional clap-back from the opponent, flavored by who's actually ahead.
    if (Math.random() < REPLY_CHANCE) {
      const bal = materialBalance(fen); // white − black
      const opponent: Side = moverSide === 'a' ? 'b' : 'a';
      const oppAhead = opponent === 'a' ? bal > 0 : bal < 0;
      const t = window.setTimeout(() => speak(opponent, oppAhead ? 'ahead' : 'behind'), REPLY_DELAY_MS);
      pendingTimersRef.current.push(t);
    }
  }, [moveNumber, finished, fen, turn, speak]);

  // Idle filler banter, alternating speakers.
  useEffect(() => {
    if (finished) return;
    const iv = window.setInterval(() => {
      if (Date.now() - lastSpokeAtRef.current < FILLER_IDLE_MS) return;
      const speaker: Side = lastSpeakerRef.current === 'a' ? 'b' : 'a';
      speak(speaker, 'filler');
    }, FILLER_TICK_MS);
    return () => window.clearInterval(iv);
  }, [finished, speak]);

  // End of game: winner gloats, loser copes — once.
  useEffect(() => {
    if (!finished || winnerSeat == null || endHandledRef.current) return;
    endHandledRef.current = true;
    const loser: Side = winnerSeat === 'a' ? 'b' : 'a';
    speak(winnerSeat, 'win');
    const t = window.setTimeout(() => speak(loser, 'lose'), END_REPLY_MS);
    pendingTimersRef.current.push(t);
  }, [finished, winnerSeat, speak]);

  return spoken && spoken.game === gameId ? spoken.u : null;
}
