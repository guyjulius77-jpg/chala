
import assert from 'node:assert/strict'
import test from 'node:test'
import { loadExecutionSignerConfig, validateExecutionEnvironment } from '@mde/execution'

test('loads signer config for rpc unlocked mode', () => {
  const config = loadExecutionSignerConfig({
    ENGINE_OPERATOR_ADDRESS: '0x2222222222222222222222222222222222222222',
    EXECUTION_SIGNER_MODE: 'rpc_unlocked',
    EXECUTION_WAIT_FOR_RECEIPT: 'true',
    EXECUTION_CONFIRMATIONS: '2',
    EXECUTION_RECEIPT_POLL_MS: '500',
    EXECUTION_RECEIPT_TIMEOUT_MS: '5000',
    EXECUTION_GAS_LIMIT_BPS: '12500',
  } as NodeJS.ProcessEnv)

  assert.equal(config.mode, 'rpc_unlocked')
  assert.equal(config.defaultFrom, '0x2222222222222222222222222222222222222222')
  assert.equal(config.receiptPolicy.waitForReceipt, true)
  assert.equal(config.receiptPolicy.confirmations, 2)
  assert.equal(config.gasLimitMultiplierBps, 12500)
})

test('execution environment validates signer settings', () => {
  const summary = validateExecutionEnvironment({
    chainKeys: ['ethereum'],
    env: {
      ROUTE_EXECUTOR_ADDRESS: '0x1111111111111111111111111111111111111111',
      ENGINE_OPERATOR_ADDRESS: '0x2222222222222222222222222222222222222222',
      AAVE_RECEIVER_ADDRESS: '0x3333333333333333333333333333333333333333',
      ETHEREUM_RPC_URL: 'https://rpc.example',
      EXECUTION_SIGNER_MODE: 'rpc_unlocked',
      EXECUTION_WAIT_FOR_RECEIPT: 'true',
      EXECUTION_CONFIRMATIONS: '2',
      EXECUTION_RECEIPT_POLL_MS: '500',
      EXECUTION_RECEIPT_TIMEOUT_MS: '5000',
    } as NodeJS.ProcessEnv,
  })

  assert.equal(summary.ok, true)
  assert.equal(summary.signerConfig.mode, 'rpc_unlocked')
  assert.equal(summary.signerConfig.receiptPolicy.confirmations, 2)
})
