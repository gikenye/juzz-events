// e2e: live market slots for the current chess game + the trade guard. Network-dependent.
import { describe, it, expect } from 'vitest';
import { useGameStore } from './gameStore';
import { useMarketStore } from './marketStore';
import { socket } from '../lib/ws';
import type { WsError } from '../lib/types';

function until(pred: () => boolean, ms: number): Promise<boolean> {
  return new Promise((resolve) => {
    const start = Date.now();
    const id = setInterval(() => {
      if (pred()) { clearInterval(id); resolve(true); }
      else if (Date.now() - start > ms) { clearInterval(id); resolve(false); }
    }, 150);
  });
}

describe('live markets e2e', () => {
  it('builds outcome slots and rejects a spectator trade', async () => {
    useGameStore.getState().start();
    useMarketStore.getState().bind();

    // 2 slots for a tournament match, 3 for an exhibition game.
    const ready = await until(() => useMarketStore.getState().slots.length >= 2, 25_000);
    if (!ready) { useMarketStore.getState().unbind(); useGameStore.getState().stop(); socket.close(); return; }

    const ms = useMarketStore.getState();
    expect(ms.slots.length).toBe(ms.mode === 'match' ? 2 : 3);
    const total = ms.slots.reduce((s, x) => s + x.prob, 0);
    expect(total).toBeCloseTo(1, 5);
    expect(ms.isMarketOpen).toBe(true);
    if (ms.mode === 'exhibition') {
      expect(ms.slots.map(s => s.key)).toEqual(['a', 'b', 'draw']);
    }

    // A spectator (no trading session) buy must be rejected by the backend.
    const market = ms.slots[0];
    const err = await new Promise<WsError | null>((resolve) => {
      const off = socket.on('error', (e) => { off(); resolve(e); });
      socket.trade('buy', market.marketId, 1, 'yes');
      setTimeout(() => { off(); resolve(null); }, 10_000);
    });
    expect(err?.code).toBe('WALLET_REQUIRED');

    useMarketStore.getState().unbind();
    useGameStore.getState().stop();
    socket.close();
  });
});
