// Typed REST client for the juzz backend. Money in/out is canonical µ$ (6dp strings).
import { API_URL, GAME_TYPE } from './config';
import type { GameSummary, MarketSummary, Balance, AssetInfo, Position } from './types';

class ApiError extends Error {
  status: number;
  code: string;
  constructor(status: number, code: string, message: string) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

async function req<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: { 'content-type': 'application/json', ...(init?.headers || {}) },
  });
  const text = await res.text();
  const body = text ? safeJson(text) : null;
  if (!res.ok) {
    throw new ApiError(res.status, (body as { code?: string })?.code || `HTTP_${res.status}`,
      (body as { message?: string })?.message || text || res.statusText);
  }
  return body as T;
}

function safeJson(t: string): unknown {
  try { return JSON.parse(t); } catch { return t; }
}

function bearer(token: string): Record<string, string> {
  return { authorization: `Bearer ${token}` };
}

export const api = {
  health: () => req<string>('/health'),

  // Reads (chess-only launch: filter every game list).
  async games(): Promise<GameSummary[]> {
    const all = await req<GameSummary[]>('/games');
    return all.filter(g => g.game_type === GAME_TYPE);
  },
  markets: (gameId: string) =>
    req<MarketSummary[]>(`/markets?game_id=${encodeURIComponent(gameId)}`),
  balance: (wallet: string) =>
    req<Balance>(`/balance?user=${encodeURIComponent(wallet)}`),
  positions: (wallet: string) =>
    req<Position[]>(`/positions?user=${encodeURIComponent(wallet)}`),
  assets: () => req<{ assets: AssetInfo[] }>('/assets').then(r => r.assets),

  // Email-OTP sign-in → login token (identifies the account; not a trading session).
  emailRequest: (email: string) =>
    req<{ ok: boolean }>('/auth/email/request', { method: 'POST', body: JSON.stringify({ email }) }),
  emailVerify: (email: string, code: string) =>
    req<{ login_token: string; account_id: string }>('/auth/email/verify',
      { method: 'POST', body: JSON.stringify({ email, code }) }),

  // Passkey login (no prior session — the assertion is the proof).
  passkeyLoginBegin: (email: string) =>
    req<{ ceremony_id: string; challenge: { publicKey: Record<string, unknown> } }>(
      '/auth/passkey/login/begin', { method: 'POST', body: JSON.stringify({ email }) }),
  passkeyLoginFinish: (ceremonyId: string, credential: Record<string, unknown>) =>
    req<{ login_token: string; account_id: string }>('/auth/passkey/login/finish',
      { method: 'POST', body: JSON.stringify({ ceremony_id: ceremonyId, credential }) }),

  // Passkey register — adds a credential to the signed-in account (login token required).
  passkeyRegisterBegin: (loginToken: string) =>
    req<{ ceremony_id: string; rp_id: string; challenge: { publicKey: Record<string, unknown> } }>(
      '/auth/passkey/register/begin', { method: 'POST', headers: bearer(loginToken) }),
  passkeyRegisterFinish: (loginToken: string, ceremonyId: string, credential: Record<string, unknown>) =>
    req<{ ok: boolean }>('/auth/passkey/register/finish',
      { method: 'POST', headers: bearer(loginToken), body: JSON.stringify({ ceremony_id: ceremonyId, credential }) }),

  // PWA juzz-managed Safe (funding). Login-token (email-OTP) gated; server-signed.
  walletRegister: (loginToken: string) =>
    req<{ safe: string; deployed: boolean }>('/wallet/register',
      { method: 'POST', headers: bearer(loginToken) }),
  walletDeposit: (loginToken: string, asset: string, amount: string, depositSecret: string) =>
    req<{ commitment: string }>('/wallet/deposit',
      { method: 'POST', headers: bearer(loginToken),
        body: JSON.stringify({ asset, amount, deposit_secret: depositSecret }) }),
  // Mint a trading session from a login token — handles all three server states.
  async walletSession(loginToken: string): Promise<
    | { status: 'ready';      token: string; wallet: string }
    | { status: 'depositing'; wallet: string; retry_after: number }
    | { status: 'unfunded';   deposit_address: string; wallet: string }
  > {
    const res  = await fetch(`${API_URL}/wallet/session`, {
      method: 'POST', headers: { 'content-type': 'application/json', ...bearer(loginToken) },
    });
    const body = await res.json().catch(() => ({})) as Record<string, unknown>;
    if (res.status === 200) return { status: 'ready',      token: body.token as string, wallet: body.wallet as string };
    if (res.status === 202) return { status: 'depositing', wallet: body.wallet as string, retry_after: (body.retry_after as number) ?? 15 };
    if (res.status === 402) return { status: 'unfunded',   deposit_address: (body.deposit_address as string) ?? '', wallet: (body.wallet as string) ?? '' };
    throw new ApiError(res.status, `HTTP_${res.status}`, JSON.stringify(body));
  },

  // Deposit-as-auth: reveal the deposit secret to mint a trading session bound to the wallet.
  session: (nonce: string) =>
    req<{ token: string; wallet: string }>('/session',
      { method: 'POST', body: JSON.stringify({ nonce }) }),

  // Withdraw juzz-held funds. amount is µ$; asset optional (defaults to primary deposit token).
  withdraw: (session: string, amount: string, asset?: AssetInfo['symbol']) =>
    req<{ withdrawal_id: string; status: string }>('/withdraw',
      { method: 'POST', body: JSON.stringify({ session, amount, ...(asset ? { asset } : {}) }) }),
};

export { ApiError };
