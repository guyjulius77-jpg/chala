# Milestone 2: Live RPC Discovery Layer

## Goal

Move the repo beyond purely seeded quote metadata by adding live-read infrastructure for the first execution slice.

## Implemented

### Aave V3
- live reserve configuration discovery through `Pool.getReserveData(address)`
- parsing of reserve configuration bits for:
  - decimals
  - active/frozen state
  - borrowing enabled
  - paused
  - flash-loan enabled
  - borrow cap
  - supply cap
- quote suppression when live state proves a reserve is not flash-eligible

### Uniswap V3
- live factory lookup through `getPool(tokenA, tokenB, fee)`
- live pool-state lookup through `slot0()` and `liquidity()`
- heuristic live quote generation from slot0 price plus fee/liquidity-derived confidence
- fallback to seeded direct-pool model when RPC or address resolution is unavailable

### API
- `GET /demo-live-intent`
- `GET /discover/aave`
- `GET /discover/uniswap`
- `/health` now reports milestone 2 and visible live-RPC chains

### Risk / Planner
- route metadata now carries discovery provenance and state timestamps
- stale-state risk logic now prefers state age from live discovery metadata
- atomic route metadata preserves mixed seeded/live provenance for operator visibility

## Operator usage

1. set chain RPC URLs in `.env`
2. call `GET /demo-live-intent?chainKey=ethereum`
3. `POST /plan` with that intent or your own symbol-based intent plus `metadata.assetAddresses`
4. use `/discover/aave` and `/discover/uniswap` to validate live state independently

## Current limitation

Quotes are still **heuristic** even when live, because the engine reads pool state directly rather than using the full Uniswap quoter path or a forked EVM simulation.

## Next step

- fork tests
- exact calldata packing
- execution dry-runs against mainnet forks
- signer controls and retry policies
