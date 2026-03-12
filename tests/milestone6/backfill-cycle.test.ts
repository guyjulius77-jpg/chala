import assert from 'node:assert/strict'
import test from 'node:test'
import { ExecutionEngine, backfillExecutionStatuses } from '@mde/execution'
import { InMemoryStore } from '@mde/storage'

const TX_HASH = '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa'

test('backfillExecutionStatuses refreshes pending jobs to confirmed', async () => {
  const store = new InMemoryStore()
  store.saveJob({
    jobId: 'job:backfill',
    intentId: 'intent:backfill',
    routeId: 'route:backfill',
    status: 'pending',
    chainLocks: ['ethereum'],
    protocolLocks: ['uniswap_v3'],
    walletContext: 'ethereum:same_chain_atomic',
    gasBudget: '1000000',
    executionChainKey: 'ethereum',
    submittedTxHash: TX_HASH,
    submitAttempts: 1,
    lastSubmittedMs: Date.now() - 1000,
    lastUpdatedMs: Date.now() - 1000,
  })
  store.saveExecutionStatus('job:backfill', {
    txHash: TX_HASH,
    status: 'pending',
    observedAtMs: Date.now() - 1000,
  })

  const engine = new ExecutionEngine()
  const results = await backfillExecutionStatuses(store, engine, {
    transport: {
      async request(method: string, _params: unknown[] = []) {
        if (method === 'eth_getTransactionReceipt') {
          return {
            transactionHash: TX_HASH,
            blockHash: '0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb',
            blockNumber: '0x64',
            transactionIndex: '0x0',
            gasUsed: '0x5208',
            cumulativeGasUsed: '0x5208',
            effectiveGasPrice: '0x64',
            status: '0x1',
            logs: [],
          }
        }
        if (method === 'eth_blockNumber') return '0x64'
        throw new Error(`unexpected method ${method}`)
      },
    },
    requiredConfirmations: 1,
  })

  assert.equal(results.length, 1)
  assert.equal(results[0].afterStatus, 'confirmed')
  assert.equal(store.getExecutionStatus('job:backfill')?.status, 'confirmed')
})
