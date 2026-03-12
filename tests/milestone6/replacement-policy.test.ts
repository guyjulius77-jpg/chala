import assert from 'node:assert/strict'
import test from 'node:test'
import { createReplacementSubmitOptions, shouldReplaceExecution } from '@mde/execution'

const TX_HASH = '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa'

test('shouldReplaceExecution allows replacement after the pending age threshold', () => {
  const decision = shouldReplaceExecution(
    {
      jobId: 'job:replace',
      intentId: 'intent:replace',
      routeId: 'route:replace',
      status: 'pending',
      chainLocks: ['ethereum'],
      protocolLocks: ['uniswap_v3'],
      walletContext: 'ethereum:same_chain_atomic',
      gasBudget: '1000000',
      executionChainKey: 'ethereum',
      submittedTxHash: TX_HASH,
      submitAttempts: 1,
      lastSubmittedMs: 1,
      lastUpdatedMs: 1,
    },
    {
      txHash: TX_HASH,
      status: 'pending',
      observedAtMs: 1,
      transaction: {
        chainKey: 'ethereum',
        chainId: 1,
        from: '0x2222222222222222222222222222222222222222',
        to: '0x1111111111111111111111111111111111111111',
        nonce: 7,
        gas: '21000',
        gasPrice: '100',
        value: '0',
        data: '0xdeadbeef',
      },
    },
    {
      enabled: true,
      maxAttempts: 3,
      minPendingMs: 10,
      gasBumpBps: 12000,
      retryOnTimeout: true,
    },
    1000
  )

  assert.equal(decision.replace, true)
  assert.equal(decision.reason, 'pending_age_threshold_met')
})

test('createReplacementSubmitOptions bumps both legacy and eip1559 fee fields', () => {
  const legacy = createReplacementSubmitOptions(
    {
      txHash: TX_HASH,
      status: 'pending',
      transaction: {
        chainKey: 'ethereum',
        chainId: 1,
        from: '0x2222222222222222222222222222222222222222',
        to: '0x1111111111111111111111111111111111111111',
        nonce: 7,
        gas: '21000',
        gasPrice: '100',
        value: '0',
        data: '0xdeadbeef',
      },
    },
    {
      enabled: true,
      maxAttempts: 3,
      minPendingMs: 10,
      gasBumpBps: 12000,
      retryOnTimeout: true,
    }
  )

  const eip1559 = createReplacementSubmitOptions(
    {
      txHash: TX_HASH,
      status: 'pending',
      transaction: {
        chainKey: 'ethereum',
        chainId: 1,
        from: '0x2222222222222222222222222222222222222222',
        to: '0x1111111111111111111111111111111111111111',
        nonce: 8,
        gas: '21000',
        maxPriorityFeePerGas: '10',
        maxFeePerGas: '20',
        value: '0',
        data: '0xdeadbeef',
      },
    },
    {
      enabled: true,
      maxAttempts: 3,
      minPendingMs: 10,
      gasBumpBps: 12000,
      retryOnTimeout: true,
    }
  )

  assert.equal(legacy.nonce, 7)
  assert.equal(legacy.gasPrice, '120')
  assert.equal(eip1559.maxPriorityFeePerGas, '12')
  assert.equal(eip1559.maxFeePerGas, '24')
})
