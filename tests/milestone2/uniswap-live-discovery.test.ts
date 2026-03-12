import assert from 'node:assert/strict'
import test from 'node:test'
import { UniswapV3Adapter } from '@mde/protocols'
import type { JsonRpcTransport } from '@mde/protocols'
import { buildCallData, encodeAddress, encodeUint } from '@mde/protocols'

const FACTORY = '0x1F98431c8aD98523631AE4a59f267346ea31F984'
const POOL_500 = '0x1111111111111111111111111111111111111111'
const POOL_3000 = '0x2222222222222222222222222222222222222222'
const USDC = '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48'
const WETH = '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2'
const GET_POOL_SELECTOR = '0x1698ee82'
const SLOT0_SELECTOR = '0x3850c7bd'
const LIQUIDITY_SELECTOR = '0x1a686502'
const Q96 = 2n ** 96n

function word(value: bigint): string {
  return value.toString(16).padStart(64, '0')
}

class MockTransport implements JsonRpcTransport {
  async request(method: string, params: unknown[] = []): Promise<unknown> {
    assert.equal(method, 'eth_call')
    const call = params[0] as { to: string; data: string }

    const getPool500 = buildCallData(GET_POOL_SELECTOR, [encodeAddress(USDC), encodeAddress(WETH), encodeUint(500)])
    const getPool3000 = buildCallData(GET_POOL_SELECTOR, [encodeAddress(USDC), encodeAddress(WETH), encodeUint(3000)])

    if (call.to.toLowerCase() === FACTORY.toLowerCase()) {
      if (call.data === getPool500) return `0x${encodeAddress(POOL_500)}`
      if (call.data === getPool3000) return `0x${encodeAddress(POOL_3000)}`
      return `0x${encodeAddress('0x0000000000000000000000000000000000000000')}`
    }

    if (call.data === buildCallData(LIQUIDITY_SELECTOR)) {
      return `0x${word(12345678901234567890n)}`
    }

    if (call.data === buildCallData(SLOT0_SELECTOR)) {
      return `0x${word(Q96)}${word(0n)}${word(0n)}${word(0n)}${word(0n)}${word(0n)}${word(1n)}`
    }

    throw new Error(`Unexpected RPC call: ${JSON.stringify(call)}`)
  }
}

test('Uniswap adapter emits live quotes when transport and address metadata are available', async () => {
  const adapter = new UniswapV3Adapter({ transportFactory: () => new MockTransport() })
  const quotes = await adapter.quote({
    intent: {
      intentId: 'live-uni',
      strategyType: 'multi_hop_swap',
      sourceChain: 'ethereum',
      inputAssets: ['USDC'],
      outputAssets: ['WETH'],
      amountIn: '1000000',
      maxSlippageBps: 50,
      requireFlashLiquidity: false,
      allowedProtocols: ['uniswap_v3'],
      deadlineMs: Date.now() + 60000,
      metadata: {
        assetAddresses: {
          USDC,
          WETH,
        },
      },
    },
    candidateProtocols: [],
  })

  assert.ok(quotes.length >= 2)
  assert.equal(quotes[0].metadata?.quoteModel, 'live_uniswap_v3_slot0_heuristic')
  assert.equal(quotes[0].metadata?.discoveryMode, 'live_rpc')
  assert.equal(quotes[0].metadata?.poolAddress, POOL_500)
})
