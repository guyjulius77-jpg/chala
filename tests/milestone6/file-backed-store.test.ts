import assert from 'node:assert/strict'
import { mkdtempSync, readFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import test from 'node:test'
import { FileBackedStore } from '@mde/storage'

const TX_HASH = '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa'

test('FileBackedStore persists and restores execution records', () => {
  const tempDir = mkdtempSync(join(tmpdir(), 'mde-store-'))
  const filePath = join(tempDir, 'execution-store.json')

  try {
    const store = new FileBackedStore(filePath)
    store.saveJob({
      jobId: 'job:file-store',
      intentId: 'intent:file-store',
      routeId: 'route:file-store',
      status: 'planned',
      chainLocks: ['ethereum'],
      protocolLocks: ['uniswap_v3'],
      walletContext: 'ethereum:same_chain_atomic',
      gasBudget: '1000000',
      executionChainKey: 'ethereum',
      lastUpdatedMs: 1,
    })
    store.saveExecutionPayload('job:file-store', {
      chainKey: 'ethereum',
      to: '0x1111111111111111111111111111111111111111',
      data: '0xdeadbeef',
      value: '0',
    })
    store.saveExecutionStatus('job:file-store', {
      txHash: TX_HASH,
      status: 'submitted',
      observedAtMs: 2,
      submittedVia: 'rpc_sendTransaction',
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
    })

    const restored = new FileBackedStore(filePath)
    assert.equal(restored.getJob('job:file-store')?.submittedTxHash, TX_HASH)
    assert.equal(restored.getExecutionPayload('job:file-store')?.to, '0x1111111111111111111111111111111111111111')
    assert.equal(restored.getExecutionStatus('job:file-store')?.transaction?.nonce, 7)
    assert.equal(restored.findJobIdByTxHash(TX_HASH), 'job:file-store')
    assert.match(readFileSync(filePath, 'utf8'), /job:file-store/)
  } finally {
    rmSync(tempDir, { recursive: true, force: true })
  }
})
