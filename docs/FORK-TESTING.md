# Fork Testing Guide

This repo now includes:

- `contracts/test/RouteExecutor.t.sol` for unit-style lifecycle checks
- `contracts/test/RouteExecutorFork.t.sol` for fork-aware live-address and live-state checks

## Suggested workflow

```bash
cd contracts
forge test
forge test --match-test testFork -vvvv
forge test --fork-url "$ETHEREUM_RPC_URL" --fork-block-number 18000000 -vvvv
```

You can also drive the fork harness through environment variables:

```bash
export FOUNDRY_FORK_URL="$ETHEREUM_RPC_URL"
export FOUNDRY_FORK_BLOCK_NUMBER=18000000
pnpm contracts:test:fork
```

## What the fork harness currently verifies

- the configured fork can be created successfully
- the canonical Ethereum Uniswap router, USDC, WETH, and Aave V3 pool addresses have bytecode on the selected fork
- known ERC-20 metadata and supply surfaces for USDC and WETH resolve correctly on the fork
- the canonical Ethereum USDC/WETH 0.05% Uniswap V3 pool exposes the expected token pair, fee tier, and non-zero liquidity
- `RouteExecutor` can still decode and complete a route lifecycle while using those live addresses in the route plan

## Best practices

- pin fork block numbers for reproducible tests
- isolate fork tests from unit tests in CI
- keep fork RPC credentials out of the repo
- use the fork harness for code-existence and interface-shape validation before adding stateful token-flow assertions
