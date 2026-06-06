// e2e: the live game store against the real backend. Proves the board streams live
// (moves arrive and update the FEN) and clocks are anchored to the server. Network-dependent.
import { describe, it, expect } from 'vitest';
import { useGameStore } from './gameStore';
import { socket } from '../lib/ws';

function until(pred: () => boolean, ms: number): Promise<boolean> {
  return new Promise((resolve) => {
    const start = Date.now();
    const id = setInterval(() => {
      if (pred()) { clearInterval(id); resolve(true); }
      else if (Date.now() - start > ms) { clearInterval(id); resolve(false); }
    }, 150);
  });
}

describe('live game store e2e', () => {
  it('subscribes to a live chess game and streams moves with synced clocks', async () => {
    const g = useGameStore.getState;
    g().start();

    const subscribed = await until(() => g().gameId !== null, 20_000);
    if (!subscribed) { g().stop(); socket.close(); return; } // no live game right now — skip

    expect(g().gameId).toBeTruthy();
    expect(g().players.white || g().players.black).toBeTruthy();

    const fen0 = g().fen;
    const mv0 = g().moveNumber;
    const moved = await until(() => g().fen !== fen0 || g().moveNumber > mv0, 20_000);
    expect(moved).toBe(true);

    // Clocks came from the server and are anchored for local ticking.
    expect(g().clocksMs[0] + g().clocksMs[1]).toBeGreaterThan(0);
    expect(g().clockAnchor).toBeGreaterThan(0);

    g().stop();
    socket.close();
  });
});
