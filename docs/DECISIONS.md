# Architectural decisions

## ADR-0001 — Registry-first configuration
All chains, deployments, fee models, callback types, and bridge capabilities live in registries rather than business-logic conditionals.

## ADR-0002 — Atomic and non-atomic flows are different products
Same-chain flash routes and cross-chain bridge routes are modeled as different workflows and different job state machines.

## ADR-0003 — Per-trade isolation is mandatory
Each route/job has isolated repayment accounting, locks, logs, and retry policy.

## ADR-0004 — Risk gates happen before payload construction
The engine should reject unsafe routes before building calldata or reserving nonce/capital state.

## ADR-0005 — Analytics are advisory, not authoritative
Liquidity heatmaps and LP behavior inform route scoring, but cannot override hard safety checks like repayment viability or gas sufficiency.
