// Turn raw wallet / viem / RPC errors into one short, human line. Without this
// the UI surfaced the full viem error dump (stack, request args, version) — which
// reads as a dead end. Every on-chain interaction routes its catch through here.
import { BaseError, UserRejectedRequestError } from 'viem';

export interface TxError {
  message: string;            // short, user-facing
  kind: 'rejected' | 'funds' | 'gas' | 'network' | 'revert' | 'wallet' | 'unknown';
}

const has = (s: string, ...needles: string[]) => {
  const l = s.toLowerCase();
  return needles.some(n => l.includes(n));
};

export function toTxError(e: unknown): TxError {
  // viem wraps causes — walk to the most specific known error first.
  if (e instanceof BaseError) {
    if (e.walk(err => err instanceof UserRejectedRequestError)) {
      return { kind: 'rejected', message: 'You cancelled the transaction.' };
    }
    const short = e.shortMessage || e.message;
    if (has(short, 'insufficient funds', 'exceeds balance', 'transfer amount exceeds')) {
      return { kind: 'funds', message: 'Not enough balance for this amount.' };
    }
    if (has(short, 'gas required exceeds', 'intrinsic gas', 'cannot estimate gas', 'fee', 'feecurrency')) {
      return { kind: 'gas', message: "Couldn't cover the network fee — top up a little more stablecoin and retry." };
    }
    if (has(short, 'reverted', 'execution reverted')) {
      return { kind: 'revert', message: 'The network rejected the transaction. Please try again.' };
    }
    if (has(short, 'chain', 'network', 'http request', 'fetch', 'timed out', 'timeout')) {
      return { kind: 'network', message: 'Network hiccup reaching Celo. Check your connection and retry.' };
    }
    return { kind: 'unknown', message: short.replace(/\s+/g, ' ').slice(0, 140) };
  }

  const msg = e instanceof Error ? e.message : String(e);
  if (has(msg, 'user rejected', 'user denied', 'rejected the request', 'cancell')) {
    return { kind: 'rejected', message: 'You cancelled the transaction.' };
  }
  if (has(msg, 'no wallet', 'no account', 'ethereum')) {
    return { kind: 'wallet', message: 'No wallet detected. Open juzz inside MiniPay or a wallet browser.' };
  }
  if (has(msg, 'insufficient', 'balance')) {
    return { kind: 'funds', message: 'Not enough balance for this amount.' };
  }
  if (has(msg, 'network', 'fetch', 'timeout', 'timed out')) {
    return { kind: 'network', message: 'Network hiccup. Check your connection and retry.' };
  }
  return { kind: 'unknown', message: msg.replace(/\s+/g, ' ').slice(0, 140) || 'Something went wrong. Please retry.' };
}

/** Short message only — drop-in replacement for the old `e.message`. */
export const txErrorMessage = (e: unknown): string => toTxError(e).message;
