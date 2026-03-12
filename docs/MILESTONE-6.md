# Milestone 6

Milestone 6 upgrades the repo from a **single-process tx lifecycle demo** into a **restart-tolerant execution operations layer**.

## What changed

- added persistent file-backed execution storage via `EXECUTION_STORE_PATH`
- added execution payload persistence so jobs can be retried or externally signed after the initial request
- added receipt backfill helpers and a dedicated `receipt-backfill-worker`
- added replacement / retry policy with configurable:
  - pending-age threshold
  - max submit attempts
  - gas bump basis points
  - timeout-driven retry behavior
- added external-signing handoff flow:
  - `EXECUTION_SIGNER_MODE=external`
  - `GET /jobs/:jobId/transaction`
  - `POST /transactions/submit-raw`
- added manual API control surfaces for:
  - `POST /jobs/:jobId/replace`
  - `POST /backfill`
- added deeper fork assertions for live token metadata and a canonical Uniswap V3 pool state check on Ethereum

## Why this matters

Before this milestone, execution state existed only in-memory inside one process. That made tx monitoring fragile across restarts and forced replacement logic to stay manual.

This milestone moves the repo closer to operator reality:
- jobs and payloads can survive process restarts
- a separate worker can refresh receipts and confirmations later
- stale pending txs can be replaced under explicit policy
- external wallets / HSMs can sign prepared transactions out-of-process while the engine keeps the job context

## Still intentionally unfinished

- database-backed job queueing and distributed worker coordination
- private-key material management inside the repo
- nonce management across multiple concurrent operators
- live asset movement assertions through protocol routers on a fork
- production-safe replacement heuristics for every RPC/client edge case
