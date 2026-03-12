# Milestone 1: Aave V3 + Uniswap V3 Atomic Slice

## Goal

Turn the architecture scaffold into a real first execution slice with guardrails.

## Implemented

### Planning
- Aave V3 flash-liquidity selection
- Uniswap V3 direct-pool quote model
- same-chain atomic cycle builder for `borrow -> swap -> swap -> repay`
- route scoring based on fees, slippage, liquidity, gas, and simulated repayment coverage

### Risk
- reserve presence check
- liquidity threshold check
- fee-tier validation
- callback wiring check
- slippage envelope check
- repayment coverage check
- deadline viability check

### Execution
- route-executor payload generation
- execution job creation with flash principal and flash fee accounting
- simulated submission path in the execution engine

### API / demos
- `/plan` and `/execute` endpoints
- planner worker demo
- executor worker demo
- tests for atomic-route planning and guardrails

## Deliberate limitations

This milestone still uses a seeded quote model for Uniswap V3 and deployment metadata for Aave V3. It is not yet performing live RPC-backed quoting or fork execution.

## Required next step

Move from seeded quote heuristics to chain-backed simulation:

1. Aave reserve discovery and flash-eligibility checks
2. Uniswap V3 pool discovery and quoter integration
3. fork tests that prove callback validation and repayment success
4. contract calldata binding from the TypeScript planner to the Solidity executor
