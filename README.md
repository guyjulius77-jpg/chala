# Multi-Chain DeFi Engine Starter

Execution-oriented monorepo for the **multi-chain, multi-exchange DeFi trading engine** defined in your PRD and implementation spec.

## Current status

This repo is now at **Milestone 6**.

### Implemented through Milestone 6
- Aave V3 flash-loan route envelopes with live reserve discovery and reserve-eligibility gating
- Uniswap V3 seeded plus live-RPC pool discovery on Ethereum / Arbitrum / Base
- generalized same-chain atomic planning across:
  - flash sources: `aave_v3`, `dydx`
  - swap legs: `uniswap_v3`, `pancakeswap`, `sushiswap`, `curve`
- exact EVM calldata packing for RouteExecutor methods and a Solidity executor that decodes route plans into structured lifecycle events
- RPC preflight simulation using `eth_estimateGas` and `eth_call`
- signer abstraction for:
  - `mock`
  - `rpc_unlocked`
  - `raw`
  - `external` handoff mode
- transaction request population, raw submission, receipt polling, and confirmation tracking
- persistent file-backed execution storage via `EXECUTION_STORE_PATH`
- one-shot or looped receipt backfill worker for refreshing stored jobs across process restarts
- retry / replacement policy with configurable pending-age thresholds and gas bumping
- API endpoints for execution inspection, prepared transaction export, raw transaction submission, and manual backfill / replacement triggers
- milestone tests for seeded planning, live discovery, calldata packing, execution preflight, signer flows, persistence, backfill, and replacement policy
- Solidity unit and fork harnesses with live-address plus live-pool/token metadata assertions

### Still not production-complete
- local private-key signing inside this repo without a runtime signer callback or wallet/HSM adapter
- real onchain token transfers / approvals / router invocations inside the Solidity executor
- audited contracts and hardened approval surfaces
- bridge-provider execution settlement beyond the staged planner abstraction
- durable queueing / database-backed execution orchestration beyond the file snapshot layer

## Demo intents

### `GET /demo-intent`
Query params:
- `chainKey=arbitrum`
- `flashSource=aave_v3`
- `swapProtocols=uniswap_v3,pancakeswap`

### `GET /demo-live-intent`
Query params:
- `chainKey=ethereum`
- `flashSource=aave_v3`
- `swapProtocols=uniswap_v3`

Example:

```bash
curl 'http://localhost:3000/demo-intent?chainKey=ethereum&flashSource=dydx&swapProtocols=uniswap_v3,pancakeswap'
```

## API endpoints

- `GET /health`
- `GET /config/validate`
- `GET /supported-protocols`
- `GET /chains`
- `GET /deployments`
- `GET /demo-intent`
- `GET /demo-live-intent`
- `GET /discover/aave`
- `GET /discover/uniswap`
- `GET /store`
- `GET /executions`
- `GET /jobs/:jobId`
- `GET /jobs/:jobId/transaction`
- `GET /transactions/:txHash?chainKey=...`
- `POST /plan`
- `POST /simulate`
- `POST /execute`
- `POST /jobs/:jobId/replace`
- `POST /transactions/submit-raw`
- `POST /backfill`

## Monorepo layout

```text
apps/
  engine-api/
  planner-worker/
  executor-worker/
  analytics-worker/
  receipt-backfill-worker/
packages/
  domain/
  chains/
  protocols/
  routing/
  risk/
  bridges/
  execution/
  scheduler/
  analytics/
  storage/
  monitoring/
contracts/
  src/
  test/
docs/
  Implementation-Spec.md
  MILESTONE-1.md
  MILESTONE-2.md
  MILESTONE-3.md
  MILESTONE-4.md
  MILESTONE-5.md
  MILESTONE-6.md
  FORK-TESTING.md
tests/
  milestone1/
  milestone2/
  milestone3/
  milestone4/
  milestone5/
  milestone6/
```

## Quick start

```bash
pnpm install
cp .env.example .env
pnpm dev:api
```

Run TypeScript tests:

```bash
pnpm test
```

Run Solidity tests:

```bash
pnpm contracts:test
```

Run the receipt backfill worker:

```bash
pnpm dev:backfill
```
