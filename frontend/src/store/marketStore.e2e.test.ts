// e2e: live markets for the current chess game + the trade guard. Network-dependent.
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
  it('loads the 3 system markets and rejects a spectator trade', async () => {
    useGameStore.getState().start();
    useMarketStore.getState().bind();

    const ready = await until(() => {
      const m = useMarketStore.getState().markets;
      return !!(m.maxi && m.gotham && m.draw);
    }, 25_000);
    if (!ready) { useMarketStore.getState().unbind(); useGameStore.getState().stop(); socket.close(); return; }

    const ms = useMarketStore.getState();
    expect(ms.markets.gotham?.question.toLowerCase()).toContain('white');
    const p = ms.probabilities;
    expect(p.maxi + p.draw + p.gotham).toBeCloseTo(1, 5);
    expect(ms.isMarketOpen).toBe(true);

    // A spectator (no trading session) buy must be rejected by the backend.
    const market = ms.markets.gotham!;
    const err = await new Promise<WsError | null>((resolve) => {
      const off = socket.on('error', (e) => { off(); resolve(e); });
      socket.trade('buy', market.market_id, 1, 'yes');
      setTimeout(() => { off(); resolve(null); }, 10_000);
    });
    expect(err?.code).toBe('WALLET_REQUIRED');

    useMarketStore.getState().unbind();
    useGameStore.getState().stop();
    socket.close();
  });
});
