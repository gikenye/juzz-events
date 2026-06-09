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
// The off-chain ledger speaks canonical micro-dollars (µ$, 6dp). On-chain collateral is
// any of the three Celo stablecoins, each in its own base units (USDC/USDT 6dp, USDm 18dp).
export const CHAIN_ID = 42220;
export const VAULT = '0xb13fF8F40c7dd43FA74EB9A046f2e2a2a5cb0Fe2'; // multi-collateral Vault
export const CELO_RPC = 'https://forno.celo.org';
export const CELOSCAN = 'https://celoscan.io';

export type AssetSymbol = 'USDC' | 'USDT' | 'USDm';
export interface Asset {
  symbol: AssetSymbol;
  address: `0x${string}`;
  decimals: number;
}

// The supported collateral tokens — used everywhere money moves (deposit, onramp, withdraw).
export const ASSETS: Asset[] = [
  { symbol: 'USDC', address: '0xcebA9300f2b948710d2653dD7B07f33A8B32118C', decimals: 6 },
  { symbol: 'USDT', address: '0x48065fbBE25f71C9282ddf5e1cD6D6A887483D5e', decimals: 6 },
  { symbol: 'USDm', address: '0x765DE816845861e75A25fCA122bb6898B8B1282a', decimals: 18 },
];
export const assetBySymbol = (s: AssetSymbol): Asset => ASSETS.find(a => a.symbol === s)!;
export const USDC = ASSETS[0].address; // default collateral

// MiniPay native cash-in deep-link (mobile money / card, minimal KYC).
export const MINIPAY_ADD_CASH = 'https://link.minipay.xyz/add_cash?tokens=USDC,USDT';

// Thirdweb onramp (Buy Widget) — buy a Celo stablecoin with card/crypto by region.
// Needs a client id from the thirdweb dashboard. Kept as a plain string here (no thirdweb
// import) so the main bundle stays light; the SDK is code-split into the Buy modal.
// Public client id (security is domain-allowlisting on thirdweb's dashboard); override per
// deploy with VITE_THIRDWEB_CLIENT_ID.
export const THIRDWEB_CLIENT_ID: string =
  import.meta.env.VITE_THIRDWEB_CLIENT_ID || 'efc4dfe9081901f6b442c1df79e1c7b0';
export const onrampEnabled = THIRDWEB_CLIENT_ID.length > 0;
