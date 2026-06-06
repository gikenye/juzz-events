// e2e smoke against the live juzz backend (funnel). Proves the REST + WS client
// actually talk to the server: health, chess game list, and a live event stream.
// Network-dependent by design — run with `npm run e2e`.
import { describe, it, expect } from 'vitest';
import { api } from './api';
import { JuzzSocket } from './ws';
import type { GameEvent } from './types';

describe('juzz backend e2e', () => {
  it('health returns ok', async () => {
    const h = await api.health();
    expect(String(h)).toContain('juzz ok');
  });

  it('lists chess games (filtered)', async () => {
    const games = await api.games();
    expect(Array.isArray(games)).toBe(true);
    for (const g of games) expect(g.game_type).toBe('chess');
  });

  it('streams a live game: subscribe → snapshot → event', async () => {
    const games = await api.games();
    if (games.length === 0) return; // nothing live right now — skip rather than fail
    const game = games[0];

    const sock = new JuzzSocket();
    const got = await new Promise<{ snapshot: boolean; event: GameEvent | null }>((resolve) => {
      let snapshot = false;
      const done = (event: GameEvent | null) => { sock.close(); resolve({ snapshot, event }); };
      const timer = setTimeout(() => done(null), 20_000);

      sock.on('status', (s) => { if (s === 'open') { sock.listGames(); sock.subscribeGame(game.id, 0); } });
      sock.on('subscribed', (m) => { snapshot = m.snapshot.id === game.id; });
      sock.on('event', (ev) => { clearTimeout(timer); done(ev); });
      sock.connect();
    });

    expect(got.snapshot).toBe(true);
    // A blitz game plays a move every ~2s, so an event should arrive well within the window.
    expect(got.event).not.toBeNull();
    expect(['started', 'move_played', 'game_over', 'engine_error']).toContain(got.event!.type);
  });
});
