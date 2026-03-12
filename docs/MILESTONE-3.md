# Milestone 3

Milestone 3 finishes the next major implementation block on top of Milestone 2:

## What changed

- added exact EVM calldata packing helpers for executor calls
- replaced JSON-hex execution envelopes on the main path with selector + ABI-bytes calldata
- upgraded `contracts/src/RouteExecutor.sol` to decode packed route plans
- generalized atomic routing beyond Aave + Uniswap to support:
  - flash sources: `aave_v3`, `dydx`
  - swap legs: `uniswap_v3`, `pancakeswap`, `sushiswap`, `curve`
- completed the previously TODO protocol adapters for PancakeSwap, SushiSwap, Curve, and dYdX
- added standalone flash-envelope planning for flash-only intents
- generalized risk checks so they no longer assume every flash route is Aave and every swap leg is Uniswap
- exposed supported protocol metadata and milestone 3 health info through the API

## Executor plan surface

The Solidity route executor now accepts three exact calldata entrypoints:

- `executeAtomicAavePlan(bytes)`
- `executeSwapPlan(bytes)`
- `executeAtomicDydxPlan(bytes)`

The `bytes` bodies are ABI-encoded plan structs produced off-chain by `packages/protocols/src/executor-encoding.ts`.

## Why this matters

Before Milestone 3, execution payloads were mostly structured JSON wrapped in hex for simulation. After Milestone 3, the primary execution path now resembles real EVM calldata and can be inspected, logged, replayed, and fork-tested with much less glue code.

## Remaining production work

- fork tests against live protocol deployments
- real token approvals/transfers/router interactions in Solidity
- bridge settlement and recovery logic
- signer and treasury hardening
- audit pass
