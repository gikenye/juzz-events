// MiniPay (injected EOA) deposit-as-auth on Celo mainnet.
import {
  createWalletClient, createPublicClient, custom, http, parseAbi, type Address, type Hex,
} from 'viem';
import { celo } from 'viem/chains';
import { VAULT, USDC, CELO_RPC } from './config';

// CIP-64: MiniPay users hold no CELO — pay gas in USDC via its fee adapter.
const USDC_FEE_ADAPTER = '0x2F25deB3848C207fc8E0c34035B3Ba7fC157602B' as Address;

const ERC20 = parseAbi([
  'function approve(address spender, uint256 amount) returns (bool)',
  'function allowance(address owner, address spender) view returns (uint256)',
  'function balanceOf(address owner) view returns (uint256)',
]);
const VAULT_ABI = parseAbi(['function deposit(uint256 amount, bytes32 sessionNonce)']);

interface Eth { request: (a: { method: string; params?: unknown[] }) => Promise<unknown> }
function provider(): Eth {
  const eth = (window as unknown as { ethereum?: Eth }).ethereum;
  if (!eth) throw new Error('No wallet found. Open juzz inside MiniPay, or use email sign-in.');
  return eth;
}

const pub = () => createPublicClient({ chain: celo, transport: http(CELO_RPC) });

export async function connectWallet(): Promise<Address> {
  const accts = (await provider().request({ method: 'eth_requestAccounts' })) as Address[];
  if (!accts?.length) throw new Error('No account authorized.');
  return accts[0];
}

// Approve the Vault (if needed), then deposit carrying the commitment. Gas in USDC (CIP-64).
export async function depositFromWallet(account: Address, amount: bigint, commitment: Hex): Promise<Hex> {
  const wallet = createWalletClient({ account, chain: celo, transport: custom(provider()) });
  const opts = { account, chain: celo, feeCurrency: USDC_FEE_ADAPTER } as const;

  const allowance = (await pub().readContract({
    address: USDC, abi: ERC20, functionName: 'allowance', args: [account, VAULT as Address],
  })) as bigint;

  if (allowance < amount) {
    const approveTx = await wallet.writeContract({
      ...opts, address: USDC, abi: ERC20, functionName: 'approve', args: [VAULT as Address, amount],
    });
    await pub().waitForTransactionReceipt({ hash: approveTx });
  }

  const depositTx = await wallet.writeContract({
    ...opts, address: VAULT as Address, abi: VAULT_ABI, functionName: 'deposit', args: [amount, commitment],
  });
  await pub().waitForTransactionReceipt({ hash: depositTx });
  return depositTx;
}

export async function usdcBalance(account: Address): Promise<bigint> {
  return (await pub().readContract({
    address: USDC, abi: ERC20, functionName: 'balanceOf', args: [account],
  })) as bigint;
}
