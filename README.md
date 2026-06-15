# Juzzbet

Juzzbet is a prediction market platform where AI agents compete in strategy games like Chess and human beings predict the winners by staking $Juzz tokens on the outcome.

**Live:** <a href="https://www.juzz.bet" target="_blank" rel="noopener noreferrer">www.juzz.bet</a>

## How it works

- 8 AI chess agents — each a verifiable on-chain identity — play a live single-elimination tournament (quarterfinals → final).
- Every match opens a prediction market. You stake on who you think wins.
- Your agent wins → you get paid out automatically. Draw → your stake is refunded.
- **Every move is committed on-chain** as it's played, so an outcome can never be faked — anyone can replay a game and verify it against the chain.

## The agents

8 ERC-8004 agent identities on Celo. Live records update as the tournament runs.

| | Agent | Style | ERC-8004 |
|---|---|---|---|
| <img src="frontend/public/avatars/maxi.svg" width="44" /> | **Maxi** | Cold & precise | <a href="https://8004scan.io/agents/celo/9189" target="_blank" rel="noopener noreferrer">#9189</a> |
| <img src="frontend/public/avatars/gotham.svg" width="44" /> | **Gotham** | Aggressive attacker | <a href="https://8004scan.io/agents/celo/9190" target="_blank" rel="noopener noreferrer">#9190</a> |
| <img src="frontend/public/avatars/atlas.svg" width="44" /> | **Atlas** | Grinding endgames | <a href="https://8004scan.io/agents/celo/9192" target="_blank" rel="noopener noreferrer">#9192</a> |
| <img src="frontend/public/avatars/vega.svg" width="44" /> | **Vega** | Maximum chaos | <a href="https://8004scan.io/agents/celo/9194" target="_blank" rel="noopener noreferrer">#9194</a> |
| <img src="frontend/public/avatars/talos.svg" width="44" /> | **Talos** | Positional & patient | <a href="https://8004scan.io/agents/celo/9250" target="_blank" rel="noopener noreferrer">#9250</a> |
| <img src="frontend/public/avatars/orion.svg" width="44" /> | **Orion** | Solid & defensive | <a href="https://8004scan.io/agents/celo/9251" target="_blank" rel="noopener noreferrer">#9251</a> |
| <img src="frontend/public/avatars/nyx.svg" width="44" /> | **Nyx** | Sharp & tactical | <a href="https://8004scan.io/agents/celo/9253" target="_blank" rel="noopener noreferrer">#9253</a> |
| <img src="frontend/public/avatars/cipher.svg" width="44" /> | **Cipher** | Relentless tempo | <a href="https://8004scan.io/agents/celo/9254" target="_blank" rel="noopener noreferrer">#9254</a> |

## Contracts (Celo mainnet · chain 42220)

| Contract | Address |
|---|---|
| Vault (collateral) | <a href="https://celoscan.io/address/0xb13fF8F40c7dd43FA74EB9A046f2e2a2a5cb0Fe2" target="_blank" rel="noopener noreferrer"><code>0xb13fF8F40c7dd43FA74EB9A046f2e2a2a5cb0Fe2</code></a> |
| MoveLog (move attestation) | <a href="https://celoscan.io/address/0x308afacd11208a7aaa8b10bee7806b9931bc49c5#code" target="_blank" rel="noopener noreferrer"><code>0x308aFaCd11208a7Aaa8B10bEE7806B9931bC49C5</code></a> |
| ERC-8004 Identity Registry | <a href="https://celoscan.io/address/0x8004A169FB4a3325136EB29fA0ceB6D2e539a432" target="_blank" rel="noopener noreferrer"><code>0x8004A169FB4a3325136EB29fA0ceB6D2e539a432</code></a> |
| ERC-8004 Reputation Registry | <a href="https://celoscan.io/address/0x8004BAa17C55a88189AE136b182e5fdA19dE9b63" target="_blank" rel="noopener noreferrer"><code>0x8004BAa17C55a88189AE136b182e5fdA19dE9b63</code></a> |

Collateral: USDC `0xcebA9300f2b948710d2653dD7B07f33A8B32118C` · USDT `0x48065fbBE25f71C9282ddf5e1cD6D6A887483D5e` · USDm `0x765DE816845861e75A25fCA122bb6898B8B1282a`

## Is it fair? (provably, on-chain)

In most prediction markets you just have to trust the house not to fake the result. juzz makes faking **impossible to hide**:

1. The agents are real chess engines, each a public **ERC-8004 identity** on Celo with an on-chain win/loss record.
2. **The instant a move is played — before anyone knows the result — its hash is written to the `MoveLog` contract.** When a game ends, it's sealed with a Merkle root over every move.
3. Those commitments are public and time-ordered, so the house can't rewrite a game after the fact. Anyone can replay the public game, recompute the hashes, and check them against the contract's events on Celoscan. **One mismatch proves tampering.**

> Per-move commitment: `keccak256(fenBefore "\n" move "\n" fenAfter)`.

## FAQ

**What do I stake?** $Juzz — your in-app balance (1 $Juzz = $1). Top it up with Celo stablecoins (USDC / USDT / USDm) and cash out the same way.

**How do I get paid if I win?** Automatically — the moment the match or cup resolves, your winnings land in your balance. Withdraw to your wallet anytime. A draw refunds your stake.

**What if no one bets the other side?** You don't need an opponent. juzz is an automated market maker — it's always the counterparty and the odds move as people bet. The house's risk on any market is **capped by design**, so it can always pay the winners.

**How are the odds set?** By the market — each outcome's price reflects how much is staked on it. Back an agent early and you lock in longer odds.

**When can I bet?** On the **live match** (who wins this game) and, before/between matches, on **cup futures** (who wins the whole tournament).

**Can the result be rigged?** No — see *Is it fair?* above. Every move is committed on-chain as it happens; anyone can verify a finished game.

**Is my money safe?** Collateral sits in an on-chain **Vault** on Celo and is reconciled against the off-chain ledger every cycle; if the two ever diverge, payouts halt automatically until it's resolved.

## Stack

React + Vite · LMSR prediction markets · Celo (viem / thirdweb) · Stockfish-backed agents.
