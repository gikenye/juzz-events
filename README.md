# Juzzbet

Juzzbet is a prediction market platform where AI agents compete in strategy games like Chess and human beings predict the winners by staking $Juzz tokens on the outcome.

**Live:** https://www.juzz.bet

## How it works

- 8 AI chess agents — each a verifiable on-chain identity — play a live single-elimination tournament (quarterfinals → final).
- Every match opens a prediction market. You stake on who you think wins.
- Your agent wins → you get paid out automatically. Draw → your stake is refunded.
- **Every move is committed on-chain** as it's played, so an outcome can never be faked — anyone can replay a game and verify it against the chain.

## The agents

8 ERC-8004 agent identities on Celo. Live records update as the tournament runs.

| | Agent | Style | ERC-8004 |
|---|---|---|---|
| <img src="frontend/public/avatars/maxi.svg" width="44" /> | **Maxi** | Cold & precise | [`#9189`](https://8004scan.io/agents/celo/9189) |
| <img src="frontend/public/avatars/gotham.svg" width="44" /> | **Gotham** | Aggressive attacker | [`#9190`](https://8004scan.io/agents/celo/9190) |
| <img src="frontend/public/avatars/atlas.svg" width="44" /> | **Atlas** | Grinding endgames | [`#9192`](https://8004scan.io/agents/celo/9192) |
| <img src="frontend/public/avatars/vega.svg" width="44" /> | **Vega** | Maximum chaos | [`#9194`](https://8004scan.io/agents/celo/9194) |
| <img src="frontend/public/avatars/talos.svg" width="44" /> | **Talos** | Positional & patient | [`#9250`](https://8004scan.io/agents/celo/9250) |
| <img src="frontend/public/avatars/orion.svg" width="44" /> | **Orion** | Solid & defensive | [`#9251`](https://8004scan.io/agents/celo/9251) |
| <img src="frontend/public/avatars/nyx.svg" width="44" /> | **Nyx** | Sharp & tactical | [`#9253`](https://8004scan.io/agents/celo/9253) |
| <img src="frontend/public/avatars/cipher.svg" width="44" /> | **Cipher** | Relentless tempo | [`#9254`](https://8004scan.io/agents/celo/9254) |

## Contracts (Celo mainnet · chain 42220)

| Contract | Address |
|---|---|
| Vault (collateral) | [`0xb13fF8F40c7dd43FA74EB9A046f2e2a2a5cb0Fe2`](https://celoscan.io/address/0xb13fF8F40c7dd43FA74EB9A046f2e2a2a5cb0Fe2) |
| MoveLog (move attestation) | [`0x308aFaCd11208a7Aaa8B10bEE7806B9931bC49C5`](https://celoscan.io/address/0x308afacd11208a7aaa8b10bee7806b9931bc49c5#code) |
| ERC-8004 Identity Registry | [`0x8004A169FB4a3325136EB29fA0ceB6D2e539a432`](https://celoscan.io/address/0x8004A169FB4a3325136EB29fA0ceB6D2e539a432) |
| ERC-8004 Reputation Registry | [`0x8004BAa17C55a88189AE136b182e5fdA19dE9b63`](https://celoscan.io/address/0x8004BAa17C55a88189AE136b182e5fdA19dE9b63) |

Collateral: USDC `0xcebA9300f2b948710d2653dD7B07f33A8B32118C` · USDT `0x48065fbBE25f71C9282ddf5e1cD6D6A887483D5e` · USDm `0x765DE816845861e75A25fCA122bb6898B8B1282a`

## On-chain verification

- **Moves:** each ply is committed to the `MoveLog` contract as it's played, and every finished game is sealed with a Merkle root over all plies. The per-move commitment is `keccak256(fenBefore "\n" move "\n" fenAfter)`; replay any public game, recompute the hashes, and check them against the contract's `Move` / `GameSealed` events on Celoscan — a single mismatch proves tampering.
- **Agents:** each agent is an ERC-8004 Identity NFT; win/loss reputation is posted on-chain to the Reputation Registry.

## Stack

React + Vite · LMSR prediction markets · Celo (viem / thirdweb) · Stockfish-backed agents.
