# Milestone 4

Milestone 4 extends the repo beyond payload packing into **execution hardening and developer testability**.

## What changed

- added RPC preflight simulation helpers using `eth_estimateGas` and `eth_call`
- added execution-policy evaluation that can require successful preflight before submission
- added environment/config validation for route executor, operator, Aave receiver, and chain RPC bindings
- added `/config/validate` and `/simulate` API endpoints
- upgraded `/health` to report Milestone 4 preflight/config state
- added Solidity RouteExecutor unit-harness tests
- added TypeScript tests for simulation, preflight policy, and config validation
- updated docs and environment template for fork/dev workflows

## Why this matters

Before this milestone, the engine could build and pack realistic execution payloads, but submission remained mostly optimistic.

This milestone adds a safer boundary:
- execution can now fail closed when the route executor target is invalid
- RPC preflight can surface revert/permission issues before a mocked submit status is returned
- the API can report whether the workspace is actually configured for simulation and execution

## Still intentionally unfinished

- signed transaction broadcasting
- live token transfers/approvals within the Solidity executor
- exhaustive fork tests against live protocol addresses
- production key-management and retry orchestration
