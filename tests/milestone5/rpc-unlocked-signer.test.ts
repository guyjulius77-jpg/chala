
import assert from 'node:assert/strict'
import test from 'node:test'
import type { ExecutionSimulation } from '@mde/domain'
import { ExecutionEngine, RpcUnlockedExecutionSigner } from '@mde/execution'
import { encodeSwapPlanCall } from '@mde/protocols'

const VALID_TO = '0x1111111111111111111111111111111111111111'
const VALID_FROM = '0x2222222222222222222222222222222222222222'
const TX_HASH = '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa'

const payload = {
  chainKey: 'ethereum',
  to: VALID_TO,
  value: '0',
  method: 'executeSwapPlan',
  data: encodeSwapPlanCall({
    routeId: 'milestone5-rpc',
    deadline: Math.floor(Date.now() / 1000) + 120,
    atomic: false,
    swapSteps: [],
  }),
}

const job = {
  jobId: 'job:milestone5-rpc',
  intentId: 'intent:milestone5-rpc',
  routeId: 'route:milestone5-rpc',
  status: 'planned' as const,
  chainLocks: ['ethereum'],
  protocolLocks: ['uniswap_v3'],
  walletContext: 'ethereum:same_chain_atomic',
  gasBudget: '1000000',
  executionChainKey: 'ethereum',
}

test('rpc unlocked signer submits a tx and waits for receipt confirmation', async () => {
  const calls: Array<{ method: string; params: unknown[] }> = []
  const transport = {
    async request(method: string, params: unknown[] = []) {
      calls.push({ method, params })
      if (method === 'eth_estimateGas') return '0x5208'
      if (method === 'eth_call') return '0x'
      if (method === 'eth_chainId') return '0x1'
      if (method === 'eth_getTransactionCount') return '0x7'
      if (method === 'eth_gasPrice') return '0x77359400'
      if (method === 'eth_sendTransaction') return TX_HASH
      if (method === 'eth_getTransactionReceipt') {
        return {
          transactionHash: TX_HASH,
          blockHash: '0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb',
          blockNumber: '0x10',
          transactionIndex: '0x0',
          status: '0x1',
          gasUsed: '0x5208',
          cumulativeGasUsed: '0x5208',
          effectiveGasPrice: '0x77359400',
          logs: [],
        }
      }
      if (method === 'eth_blockNumber') return '0x10'
      throw new Error(`unexpected method ${method}`)
    },
  }

  const engine = new ExecutionEngine({
    signer: new RpcUnlockedExecutionSigner({
      mode: 'rpc_unlocked',
      defaultFrom: VALID_FROM,
      gasLimitMultiplierBps: 10_000,
      receiptPolicy: {
        waitForReceipt: true,
        confirmations: 1,
        pollIntervalMs: 0,
        timeoutMs: 100,
      },
    }),
    preflightPolicy: {
      requirePreflight: true,
      requireFromAddress: false,
      blockTag: 'latest',
    },
    simulatePayload: async (): Promise<ExecutionSimulation> => ({
      ok: true,
      chainKey: 'ethereum',
      from: VALID_FROM,
      to: VALID_TO,
      value: '0',
      blockTag: 'latest',
      gasEstimate: '21000',
      callResult: '0x',
      warnings: [],
    }),
  })

  const status = await engine.submit(job, payload, { transport, waitForReceipt: true })
  assert.equal(status.status, 'confirmed')
  assert.equal(status.submittedVia, 'rpc_sendTransaction')
  assert.equal(status.txHash, TX_HASH)
  assert.equal(status.transaction?.from, VALID_FROM)
  assert.equal(status.transaction?.nonce, 7)
  assert.equal(status.transaction?.gas, '21000')
  assert.equal(status.receipt?.success, true)
  assert.ok(calls.some((call) => call.method === 'eth_sendTransaction'))
})
