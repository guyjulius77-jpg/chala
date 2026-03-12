import assert from 'node:assert/strict'
import test from 'node:test'
import { simulateExecutionPayload } from '@mde/execution'
import { encodeSwapPlanCall } from '@mde/protocols'

const VALID_TO = '0x1111111111111111111111111111111111111111'
const VALID_FROM = '0x2222222222222222222222222222222222222222'

function buildPayload() {
  return {
    chainKey: 'ethereum',
    to: VALID_TO,
    value: '0',
    method: 'executeSwapPlan',
    data: encodeSwapPlanCall({
      routeId: 'milestone4-sim',
      deadline: Math.floor(Date.now() / 1000) + 120,
      atomic: false,
      swapSteps: [],
    }),
  }
}

test('simulates calldata through eth_estimateGas and eth_call', async () => {
  const calls: Array<{ method: string; params?: unknown[] }> = []
  const transport = {
    async request(method: string, params: unknown[] = []) {
      calls.push({ method, params })
      if (method === 'eth_estimateGas') return '0x5208'
      if (method === 'eth_call') return '0x'
      throw new Error(`unexpected method ${method}`)
    },
  }

  const simulation = await simulateExecutionPayload(buildPayload(), {
    transport,
    from: VALID_FROM,
    blockTag: 'latest',
  })

  assert.equal(simulation.ok, true)
  assert.equal(simulation.from, VALID_FROM)
  assert.equal(simulation.method, 'executeSwapPlan')
  assert.equal(simulation.gasEstimate, '21000')
  assert.equal(calls.length, 2)
  assert.equal(calls[0].method, 'eth_estimateGas')
  assert.equal(calls[1].method, 'eth_call')
})

test('fails closed when no simulation from address is available', async () => {
  const simulation = await simulateExecutionPayload(buildPayload(), {
    transport: {
      async request() {
        throw new Error('should not be called when from is missing')
      },
    },
  })

  assert.equal(simulation.ok, false)
  assert.equal(simulation.errorReason, 'simulation_from_address_unavailable')
})
