// Typed REST client for the juzz backend. Money in/out is canonical µ$ (6dp strings).
import { API_URL, GAME_TYPE } from './config';
import type { GameSummary, MarketSummary, Balance, AssetInfo } from './types';

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
  assets: () => req<{ assets: AssetInfo[] }>('/assets').then(r => r.assets),

  // Email-OTP sign-in → login token (identifies the account; not a trading session).
  emailRequest: (email: string) =>
    req<{ ok: boolean }>('/auth/email/request', { method: 'POST', body: JSON.stringify({ email }) }),
  emailVerify: (email: string, code: string) =>
    req<{ login_token: string; account_id: string }>('/auth/email/verify',
      { method: 'POST', body: JSON.stringify({ email, code }) }),

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
