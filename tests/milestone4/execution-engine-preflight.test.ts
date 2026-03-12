import assert from 'node:assert/strict'
import test from 'node:test'
import type { ExecutionSimulation } from '@mde/domain'
import { ExecutionEngine } from '@mde/execution'
import { encodeSwapPlanCall } from '@mde/protocols'

const payload = {
  chainKey: 'ethereum',
  to: '0x1111111111111111111111111111111111111111',
  value: '0',
  method: 'executeSwapPlan',
  data: encodeSwapPlanCall({
    routeId: 'milestone4-engine',
    deadline: Math.floor(Date.now() / 1000) + 120,
    atomic: false,
    swapSteps: [],
  }),
}

const job = {
  jobId: 'job:milestone4-engine',
  intentId: 'intent:milestone4-engine',
  routeId: 'route:milestone4-engine',
  status: 'planned' as const,
  chainLocks: ['ethereum'],
  protocolLocks: ['uniswap_v3'],
  walletContext: 'ethereum:same_chain_atomic',
  gasBudget: '1000000',
}

test('submission fails when preflight is required and simulation fails', async () => {
  const engine = new ExecutionEngine({
    preflightPolicy: {
      requirePreflight: true,
      requireFromAddress: true,
      blockTag: 'latest',
    },
    simulatePayload: async (): Promise<ExecutionSimulation> => ({
      ok: false,
      chainKey: 'ethereum',
      from: undefined,
      to: payload.to,
      value: '0',
      blockTag: 'latest',
      errorReason: 'simulation_from_address_unavailable',
      warnings: [],
    }),
  })

  const status = await engine.submit(job, payload)
  assert.equal(status.status, 'failed')
  assert.equal(status.submittedVia, 'not_submitted')
  assert.ok(status.preflight)
  assert.equal(status.preflight?.approved, false)
})

test('submission stays mock-submitted when preflight is optional', async () => {
  const engine = new ExecutionEngine({
    preflightPolicy: {
      requirePreflight: false,
      requireFromAddress: false,
      blockTag: 'latest',
    },
    simulatePayload: async (): Promise<ExecutionSimulation> => ({
      ok: false,
      chainKey: 'ethereum',
      from: undefined,
      to: payload.to,
      value: '0',
      blockTag: 'latest',
      errorReason: 'rpc_unavailable',
      warnings: ['No RPC URL resolved'],
    }),
  })

  const status = await engine.submit(job, payload)
  assert.equal(status.status, 'submitted')
  assert.equal(status.submittedVia, 'mock')
  assert.equal(status.preflight?.approved, true)
  assert.ok(status.warnings?.some((warning) => warning.includes('rpc_unavailable')))
})
