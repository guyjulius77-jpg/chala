
import assert from 'node:assert/strict'
import test from 'node:test'
import { monitorExecutionTransaction, waitForExecutionReceipt } from '@mde/execution'

const TX_HASH = '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa'
const VALID_FROM = '0x2222222222222222222222222222222222222222'
const VALID_TO = '0x1111111111111111111111111111111111111111'

test('monitorExecutionTransaction reports pending state when tx exists without receipt', async () => {
  const status = await monitorExecutionTransaction('ethereum', TX_HASH, {
    transport: {
      async request(method: string, _params: unknown[] = []) {
        if (method === 'eth_getTransactionReceipt') return null
        if (method === 'eth_getTransactionByHash') {
          return {
            from: VALID_FROM,
            to: VALID_TO,
            nonce: '0x5',
            gas: '0x5208',
            gasPrice: '0x77359400',
            value: '0x0',
            input: '0xdeadbeef',
            type: '0x0',
            chainId: '0x1',
          }
        }
        throw new Error(`unexpected method ${method}`)
      },
    },
  })

  assert.equal(status.status, 'pending')
  assert.equal(status.transaction?.nonce, 5)
  assert.equal(status.transaction?.from, VALID_FROM)
})

test('waitForExecutionReceipt returns pending timeout when receipt never arrives', async () => {
  const status = await waitForExecutionReceipt('ethereum', TX_HASH, {
    pollIntervalMs: 0,
    timeoutMs: 0,
    transport: {
      async request(method: string, _params: unknown[] = []) {
        if (method === 'eth_getTransactionReceipt') return null
        if (method === 'eth_getTransactionByHash') return null
        throw new Error(`unexpected method ${method}`)
      },
    },
  })

  assert.equal(status.status, 'pending')
  assert.ok(status.warnings?.includes('receipt_wait_timeout'))
})
