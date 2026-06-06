// Backend endpoints. Defaults to the live funnel; override per-deploy with
// VITE_API_URL / VITE_WS_URL (api.juzz.bet once the domain is cut over).
const DEFAULT_API = 'https://sofiav2.tail4f6cc6.ts.net';

export const API_URL: string =
  import.meta.env.VITE_API_URL?.replace(/\/$/, '') || DEFAULT_API;

export const WS_URL: string =
  import.meta.env.VITE_WS_URL || `${API_URL.replace(/^http/, 'ws')}/ws`;

// Launch scope: chess only. Other games exist on the backend but are filtered out
// of every list/stream until liquidity is proven (see PRD).
export const GAME_TYPE = 'chess' as const;

// Protocol version the client speaks; mismatched frames are rejected.
export const PROTOCOL_V = 1;
