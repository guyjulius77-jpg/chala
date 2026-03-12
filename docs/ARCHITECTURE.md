# Architecture

## Core split

This codebase intentionally separates:

1. **Planning** — route generation, scoring, bridge option enumeration
2. **Risk** — pre-trade rejection and warning pipeline
3. **Execution** — payload building, submission, monitoring, repayment tracking
4. **Analytics** — concentrated liquidity replay and LP intelligence
5. **Scheduling** — concurrency, locks, nonce/capital isolation
6. **Persistence** — route, job, quote, and analytics state

## Execution modes

### Same-chain atomic
Used for Aave flash loans, Uniswap flash swaps, Pancake flash swaps, BentoBox flash loans, Curve flash liquidity, and dYdX Solo Margin patterns where repayment must happen in the same transaction.

### Cross-chain asynchronous
Used when a bridge hop is required. This workflow is **not atomic** across chains and must be treated as a separate lifecycle:
- source-chain submission
- bridge pending / relay monitoring
- destination settlement
- destination trade execution
- final reconciliation

## Safety boundaries

- no shared mutable per-trade route state in contracts
- per-wallet nonce isolation
- route locks only for shared capital buckets and bridge balances
- all callback flows must validate the caller and repayment path
- stale quotes must fail closed

## Recommended milestone order

- milestone 1: Ethereum / Arbitrum / Base / Optimism with Aave + Uniswap + Curve
- milestone 2: bridge router + scheduler + Pancake + Sushi + dYdX Solo
- milestone 3: full chain matrix
- milestone 4: analytics-assisted routing
