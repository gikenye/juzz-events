// e2e: auth endpoints against the real backend. Can't complete OTP/passkey without a
// real inbox/authenticator, but proves the routes are live and behave per the contract.
import { describe, it, expect } from 'vitest';
import { api, ApiError } from './api';

describe('auth e2e', () => {
  it('email OTP request succeeds (no account enumeration)', async () => {
    const res = await api.emailRequest('mzee@duck.com');
    expect(res.ok).toBe(true);
  });

  it('passkey login for an unknown email returns 404', async () => {
    await expect(api.passkeyLoginBegin(`nobody-${Date.now()}@example.com`))
      .rejects.toMatchObject({ status: 404 });
    // ApiError carries the status for the UI fallback to email-OTP.
    const err = await api.passkeyLoginBegin('still-nobody@example.com').catch(e => e);
    expect(err).toBeInstanceOf(ApiError);
  });
});
