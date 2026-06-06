// e2e: wallet REST surface against the real backend. The on-chain deposit/withdraw happy
// path needs a real wallet + funds (manual browser test); here we verify the routes are
// live, shaped right, and session-gated. Network-dependent.
import { describe, it, expect } from 'vitest';
import { api, ApiError } from './api';

const ZERO = '0x0000000000000000000000000000000000000001';
const randSecret = () => {
  const b = new Uint8Array(32);
  crypto.getRandomValues(b);
  return ('0x' + [...b].map(x => x.toString(16).padStart(2, '0')).join('')) as string;
};

describe('wallet e2e', () => {
  it('balance + positions return well-formed data for an unfunded wallet', async () => {
    const bal = await api.balance(ZERO);
    expect(bal).toHaveProperty('available');
    expect(bal).toHaveProperty('locked');
    const pos = await api.positions(ZERO);
    expect(Array.isArray(pos)).toBe(true);
  });

  it('session reveal with an unknown secret returns 404 (no confirmed deposit)', async () => {
    await expect(api.session(randSecret())).rejects.toMatchObject({ status: 404 });
  });

  it('withdraw with an invalid session is rejected (not authorized)', async () => {
    const err = await api.withdraw('v1.not-a-real-session.0.deadbeef', '1000000').catch(e => e);
    expect(err).toBeInstanceOf(ApiError);
    expect(err.status).toBeGreaterThanOrEqual(400);
    expect(err.status).toBeLessThan(500);
  });
});
