import assert from 'node:assert/strict'
import test from 'node:test'
import { BridgeRouter } from '@mde/bridges'
import { createDefaultAdapters } from '@mde/protocols'
import { ExecutionPlanner } from '@mde/routing'

test('does not emit flash routes without a repayable cycle definition', async () => {
  const planner = new ExecutionPlanner({
    bridgeRouter: new BridgeRouter(),
    adapters: createDefaultAdapters(),
  })

  const routes = await planner.plan({
    intentId: 'test-no-cycle',
    strategyType: 'cross_exchange_arbitrage',
    sourceChain: 'arbitrum',
    inputAssets: ['USDC'],
    outputAssets: ['WETH'],
    amountIn: '1000000',
    maxSlippageBps: 50,
    requireFlashLiquidity: true,
    allowedProtocols: ['aave_v3', 'uniswap_v3'],
    deadlineMs: Date.now() + 120000,
  })

  assert.equal(routes.length, 0)
})
