import assert from 'node:assert/strict'
import test from 'node:test'
import { validateExecutionEnvironment } from '@mde/execution'

test('validates a minimally configured preflight environment', () => {
  const summary = validateExecutionEnvironment({
    chainKeys: ['ethereum'],
    env: {
      ROUTE_EXECUTOR_ADDRESS: '0x1111111111111111111111111111111111111111',
      ENGINE_OPERATOR_ADDRESS: '0x2222222222222222222222222222222222222222',
      AAVE_RECEIVER_ADDRESS: '0x3333333333333333333333333333333333333333',
      ETHEREUM_RPC_URL: 'https://rpc.example',
      EXECUTION_REQUIRE_PREFLIGHT: 'true',
    } as NodeJS.ProcessEnv,
  })

  assert.equal(summary.ok, true)
  assert.deepEqual(summary.configuredRpcChains, ['ethereum'])
  assert.equal(summary.issues.filter((issue) => issue.level === 'error').length, 0)
})

test('reports invalid executor/operator bindings', () => {
  const summary = validateExecutionEnvironment({
    chainKeys: ['ethereum'],
    env: {
      ROUTE_EXECUTOR_ADDRESS: '{{ROUTE_EXECUTOR}}',
      ENGINE_OPERATOR_ADDRESS: 'not-an-address',
      ETHEREUM_RPC_URL: '',
      EXECUTION_REQUIRE_PREFLIGHT: 'true',
    } as NodeJS.ProcessEnv,
  })

  assert.equal(summary.ok, false)
  assert.ok(summary.issues.some((issue) => issue.code === 'route_executor_invalid' || issue.code === 'route_executor_unset'))
  assert.ok(summary.issues.some((issue) => issue.code === 'engine_operator_invalid'))
  assert.ok(summary.issues.some((issue) => issue.code === 'rpc_unset'))
})
