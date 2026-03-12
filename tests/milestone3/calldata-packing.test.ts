import assert from 'node:assert/strict'
import test from 'node:test'
import { BridgeRouter } from '@mde/bridges'
import { createDefaultAdapters, decodeCalldataEnvelope } from '@mde/protocols'
import { ExecutionPlanner } from '@mde/routing'

test('Aave atomic route execution is packed as exact EVM calldata', async () => {
  const adapters = createDefaultAdapters()
  const planner = new ExecutionPlanner({
    bridgeRouter: new BridgeRouter(),
    adapters,
  })

  const routes = await planner.plan({
    intentId: 'milestone3-aave-calldata',
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
  const payload = await adapters[routes[0].protocolKeys[0]].buildExecution(routes[0])
  const envelope = decodeCalldataEnvelope(payload.data)

  assert.equal(payload.method, 'executeAtomicAavePlan')
  assert.equal(envelope?.method, 'executeAtomicAavePlan')
  assert.equal(envelope?.selector, '0xf3f77c9c')
  assert.ok((envelope?.bodyLengthBytes ?? 0) > 0)
})

test('direct swap routes are packed through executeSwapPlan(bytes)', async () => {
  const adapters = createDefaultAdapters()
  const planner = new ExecutionPlanner({
    bridgeRouter: new BridgeRouter(),
    adapters,
  })

  const routes = await planner.plan({
    intentId: 'milestone3-swap-calldata',
    strategyType: 'multi_hop_swap',
    sourceChain: 'ethereum',
    inputAssets: ['USDC'],
    outputAssets: ['WETH'],
    amountIn: '1000000',
    maxSlippageBps: 80,
    requireFlashLiquidity: false,
    allowedProtocols: ['pancakeswap'],
    deadlineMs: Date.now() + 120000,
  })

  assert.ok(routes.length > 0)
  const payload = await adapters[routes[0].protocolKeys[0]].buildExecution(routes[0])
  const envelope = decodeCalldataEnvelope(payload.data)

  assert.equal(payload.method, 'executeSwapPlan')
  assert.equal(envelope?.method, 'executeSwapPlan')
  assert.equal(envelope?.selector, '0x674b61a1')
})
