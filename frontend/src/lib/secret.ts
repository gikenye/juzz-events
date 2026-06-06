import { keccak256 } from 'viem';

// Deposit-as-auth: a fresh 32-byte secret is revealed at /session to mint the trading
// session; its keccak256 is the on-chain commitment (the public deposit can't be replayed
// without the secret).
export function newSecret(): `0x${string}` {
  const b = new Uint8Array(32);
  crypto.getRandomValues(b);
  return ('0x' + [...b].map(x => x.toString(16).padStart(2, '0')).join('')) as `0x${string}`;
}

export function commitmentOf(secret: `0x${string}`): `0x${string}` {
  return keccak256(secret);
}
