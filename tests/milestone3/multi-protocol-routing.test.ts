import assert from 'node:assert/strict'
import test from 'node:test'
import { BridgeRouter } from '@mde/bridges'
import { createDefaultAdapters } from '@mde/protocols'
import { RiskEngine } from '@mde/risk'
import { ExecutionPlanner } from '@mde/routing'

test('plans an approved Aave->PancakeSwap atomic cycle on Ethereum', async () => {
  const planner = new ExecutionPlanner({
    bridgeRouter: new BridgeRouter(),
    adapters: createDefaultAdapters(),
  })
  const risk = new RiskEngine()

  const routes = await planner.plan({
    intentId: 'test-aave-pancake-atomic',
    strategyType: 'cross_exchange_arbitrage',
    sourceChain: 'ethereum',
    inputAssets: ['USDC'],
    outputAssets: ['USDC'],
    amountIn: '1000000',
    maxSlippageBps: 60,
    requireFlashLiquidity: true,
    allowedProtocols: ['aave_v3', 'pancakeswap'],
    deadlineMs: Date.now() + 120000,
    metadata: {
      cycleAssets: ['USDC', 'WETH', 'USDC'],
    },
  })

  assert.ok(routes.length > 0)
  assert.ok(routes[0].protocolKeys.includes('aave_v3'))
  assert.ok(routes[0].protocolKeys.includes('pancakeswap'))
  assert.equal(routes[0].steps.filter((step) => step.type === 'swap').length, 2)

  const evaluation = await risk.evaluate(routes[0])
  assert.equal(evaluation.approved, true)
})

test('plans a dYdX standalone flash envelope on Ethereum', async () => {
  const planner = new ExecutionPlanner({
    bridgeRouter: new BridgeRouter(),
    adapters: createDefaultAdapters(),
  })
  const risk = new RiskEngine()

  const routes = await planner.plan({
    intentId: 'test-dydx-envelope',
    strategyType: 'cross_exchange_arbitrage',
    sourceChain: 'ethereum',
    inputAssets: ['USDC'],
    outputAssets: ['USDC'],
    amountIn: '1000000',
    maxSlippageBps: 50,
    requireFlashLiquidity: true,
    allowedProtocols: ['dydx'],
    deadlineMs: Date.now() + 120000,
  })

  assert.ok(routes.length > 0)
  assert.equal(routes[0].steps.filter((step) => step.type === 'flash_borrow').length, 1)
  assert.equal(routes[0].steps.filter((step) => step.type === 'repay').length, 1)

  const evaluation = await risk.evaluate(routes[0])
  assert.equal(evaluation.approved, true)
})
