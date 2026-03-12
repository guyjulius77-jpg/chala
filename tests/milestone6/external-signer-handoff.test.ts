import assert from 'node:assert/strict'
import test from 'node:test'
import { ExecutionEngine, ExternalExecutionSigner } from '@mde/execution'
import { encodeSwapPlanCall } from '@mde/protocols'

const VALID_TO = '0x1111111111111111111111111111111111111111'
const VALID_FROM = '0x2222222222222222222222222222222222222222'

const payload = {
  chainKey: 'ethereum',
  to: VALID_TO,
  value: '0',
  method: 'executeSwapPlan',
  data: encodeSwapPlanCall({
    routeId: 'milestone6-external',
    deadline: Math.floor(Date.now() / 1000) + 120,
    atomic: false,
    swapSteps: [],
  }),
}

const job = {
  jobId: 'job:milestone6-external',
  intentId: 'intent:milestone6-external',
  routeId: 'route:milestone6-external',
  status: 'planned' as const,
  chainLocks: ['ethereum'],
  protocolLocks: ['uniswap_v3'],
  walletContext: 'ethereum:same_chain_atomic',
  gasBudget: '1000000',
  executionChainKey: 'ethereum',
}

test('external signer mode prepares a transaction without RPC submission', async () => {
  const transport = {
    async request(method: string, _params: unknown[] = []) {
      if (method === 'eth_estimateGas') return '0x5208'
      if (method === 'eth_call') return '0x'
      if (method === 'eth_chainId') return '0x1'
      if (method === 'eth_getTransactionCount') return '0x7'
      if (method === 'eth_gasPrice') return '0x64'
      throw new Error(`unexpected method ${method}`)
    },
  }

  const engine = new ExecutionEngine({
    signer: new ExternalExecutionSigner({
      mode: 'external',
      defaultFrom: VALID_FROM,
      gasLimitMultiplierBps: 11_000,
      receiptPolicy: {
        waitForReceipt: false,
        confirmations: 1,
        pollIntervalMs: 0,
        timeoutMs: 0,
      },
    }),
  })

  const status = await engine.submit(job, payload, { transport })

  assert.equal(status.status, 'prepared')
  assert.equal(status.submittedVia, 'external')
  assert.equal(status.transaction?.from, VALID_FROM)
  assert.equal(status.transaction?.nonce, 7)
  assert.ok(status.warnings?.includes('external_signer_submission_required'))
})
