// MiniPay (injected EOA) deposit-as-auth on Celo mainnet — multi-collateral.
import {
  createWalletClient, createPublicClient, custom, http, parseAbi, type Address, type Hex,
} from 'viem';
import { celo } from 'viem/chains';
import { VAULT, CELO_RPC, type Asset } from './config';

// CIP-64 fee adapters (pay gas in the stablecoin; MiniPay users hold no CELO). Keyed by
// lowercased token address. USDm is its own fee adapter.
const FEE_ADAPTER: Record<string, Address> = {
  '0xceba9300f2b948710d2653dd7b07f33a8b32118c': '0x2F25deB3848C207fc8E0c34035B3Ba7fC157602B', // USDC
  '0x48065fbbe25f71c9282ddf5e1cd6d6a887483d5e': '0x0e2a3e05bc9a16f5292a6170456a710cb89c6f72', // USDT
  '0x765de816845861e75a25fca122bb6898b8b1282a': '0x765DE816845861e75A25fCA122bb6898B8B1282a', // USDm
};

const ERC20 = parseAbi([
  'function approve(address spender, uint256 amount) returns (bool)',
  'function allowance(address owner, address spender) view returns (uint256)',
  'function balanceOf(address owner) view returns (uint256)',
]);
const VAULT_ABI = parseAbi(['function deposit(address token, uint256 amount, bytes32 sessionNonce)']);

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

// Approve the Vault (if needed), then deposit `asset` carrying the commitment. The token,
// amount (in the asset's own base units) and commitment all go to the multi-token Vault.
// Gas is paid in the same stablecoin via its CIP-64 adapter.
export async function depositFromWallet(account: Address, asset: Asset, amount: bigint, commitment: Hex): Promise<Hex> {
  const token = asset.address;
  const feeCurrency = FEE_ADAPTER[token.toLowerCase()];
  const wallet = createWalletClient({ account, chain: celo, transport: custom(provider()) });
  const opts = { account, chain: celo, ...(feeCurrency ? { feeCurrency } : {}) } as const;
  const vault = VAULT as Address;

  const allowance = (await pub().readContract({
    address: token, abi: ERC20, functionName: 'allowance', args: [account, vault],
  })) as bigint;

  if (allowance < amount) {
    const approveTx = await wallet.writeContract({
      ...opts, address: token, abi: ERC20, functionName: 'approve', args: [vault, amount],
    });
    await pub().waitForTransactionReceipt({ hash: approveTx });
  }

  const depositTx = await wallet.writeContract({
    ...opts, address: vault, abi: VAULT_ABI, functionName: 'deposit', args: [token, amount, commitment],
  });
  await pub().waitForTransactionReceipt({ hash: depositTx });
  return depositTx;
}

export async function tokenBalance(account: Address, token: Address): Promise<bigint> {
  return (await pub().readContract({
    address: token, abi: ERC20, functionName: 'balanceOf', args: [account],
  })) as bigint;
}
