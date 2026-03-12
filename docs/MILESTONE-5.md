
# Milestone 5

Milestone 5 upgrades the repo from **mock-only execution** into a **transaction lifecycle framework**.

## What changed

- added signer abstraction with three modes:
  - `mock`
  - `rpc_unlocked`
  - `raw`
- added transaction-request creation and RPC serialization helpers
- added real JSON-RPC submission paths for:
  - `eth_sendTransaction`
  - `eth_sendRawTransaction`
- added transaction monitoring helpers for:
  - `eth_getTransactionReceipt`
  - `eth_getTransactionByHash`
  - receipt-confirmation tracking
- added receipt wait policy with configurable polling, timeout, and confirmation depth
- added job/status persistence for tx hash, nonce, confirmations, and receipt block
- added API endpoints to inspect job state and refresh tx state
- added a fork harness that validates the executor against live-address context on an Ethereum fork

## Why this matters

Before this milestone, the repo could encode realistic execution payloads and preflight them, but submission remained intentionally mocked.

This milestone creates the next production boundary:
- routes can move through a real RPC submission path when the operator account is available on the connected node
- the engine can track pending, confirmed, or reverted execution state
- the API and worker can expose tx lifecycle information instead of only returning a fire-and-forget placeholder

## Still intentionally unfinished

- local private-key signing inside this repo without an external signer callback
- token approvals/transfers and callback settlement logic inside the Solidity executor
- full protocol integration assertions that move assets on a fork
- persistent durable job queue / receipt backfill across process restarts
