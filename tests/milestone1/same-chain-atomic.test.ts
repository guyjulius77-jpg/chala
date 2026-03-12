import assert from 'node:assert/strict'
import test from 'node:test'
import { BridgeRouter } from '@mde/bridges'
import { createDefaultAdapters } from '@mde/protocols'
import { RiskEngine } from '@mde/risk'
import { ExecutionPlanner } from '@mde/routing'

test('plans an approved Aave->Uniswap atomic cycle on Arbitrum', async () => {
  const planner = new ExecutionPlanner({
    bridgeRouter: new BridgeRouter(),
    adapters: createDefaultAdapters(),
  })
  const risk = new RiskEngine()

  const routes = await planner.plan({
    intentId: 'test-atomic',
    strategyType: 'cross_exchange_arbitrage',
    sourceChain: 'arbitrum',
    inputAssets: ['USDC'],
    outputAssets: ['USDC'],
    amountIn: '1000000',
    maxSlippageBps: 50,
    requireFlashLiquidity: true,
    allowedProtocols: ['aave_v3', 'uniswap_v3'],
    deadlineMs: Date.now() + 120000,
    metadata: {
      cycleAssets: ['USDC', 'WETH', 'USDC'],
    },
  })

  assert.ok(routes.length > 0)
  assert.equal(routes[0].executionModel, 'same_chain_atomic')
  assert.equal(routes[0].steps.filter((step) => step.type === 'swap').length, 2)

  const evaluation = await risk.evaluate(routes[0])
  assert.equal(evaluation.approved, true)
})
