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

// ── on-chain (Celo mainnet) ─────────────────────────────────────────────────
// Deposits go to the Vault in USDC (6dp). The off-chain ledger speaks µ$ (also 6dp),
// so for USDC base units == µ$. The live Vault is single-collateral USDC today;
// multi-collateral (USDT/USDm) lands once that backend deploy is cut over.
export const COLLATERAL_DECIMALS = 6;
export const CHAIN_ID = 42220;
export const VAULT = '0x2758255F9e373D878b98D31600F904EC3f96e72c';
export const USDC = '0xcebA9300f2b948710d2653dD7B07f33A8B32118C';
export const CELO_RPC = 'https://forno.celo.org';
export const CELOSCAN = 'https://celoscan.io';

// MiniPay native cash-in deep-link (mobile money / card, minimal KYC).
export const MINIPAY_ADD_CASH = 'https://link.minipay.xyz/add_cash?tokens=USDC';
