import assert from 'node:assert/strict'
import test from 'node:test'
import { AaveV3Adapter, discoverAaveV3Reserve } from '@mde/protocols'
import type { JsonRpcTransport } from '@mde/protocols'

const POOL = '0x87870Bca3F3fD6335C3F4ce8392D69350B4fA4E2'
const USDC = '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48'

function word(value: bigint): string {
  return value.toString(16).padStart(64, '0')
}

function reserveConfig({ active = true, frozen = false, borrowing = true, paused = false, flash = true, decimals = 6 }: {
  active?: boolean
  frozen?: boolean
  borrowing?: boolean
  paused?: boolean
  flash?: boolean
  decimals?: number
} = {}): bigint {
  let value = 0n
  value |= BigInt(decimals) << 48n
  if (active) value |= 1n << 56n
  if (frozen) value |= 1n << 57n
  if (borrowing) value |= 1n << 58n
  if (paused) value |= 1n << 60n
  if (flash) value |= 1n << 63n
  value |= 1_000_000n << 80n
  value |= 2_000_000n << 116n
  return value
}

class ReserveTransport implements JsonRpcTransport {
  constructor(private readonly config: bigint) {}

  async request(method: string): Promise<unknown> {
    assert.equal(method, 'eth_call')
    return `0x${word(this.config)}${word(0n)}${word(0n)}${word(0n)}${word(0n)}`
  }
}

test('discovers Aave reserve flags from live RPC response', async () => {
  const reserve = await discoverAaveV3Reserve({
    chainKey: 'ethereum',
    asset: 'USDC',
    addressBook: { USDC },
    transport: new ReserveTransport(reserveConfig()),
  })

  assert.ok(reserve)
  assert.equal(reserve?.poolAddress, POOL)
  assert.equal(reserve?.flashLoanEnabled, true)
  assert.equal(reserve?.borrowingEnabled, true)
  assert.equal(reserve?.decimals, 6)
})

test('Aave adapter suppresses quotes when live reserve state is not flash-eligible', async () => {
  const adapter = new AaveV3Adapter({ transportFactory: () => new ReserveTransport(reserveConfig({ flash: false })) })
  const quotes = await adapter.quote({
    intent: {
      intentId: 'live-aave-blocked',
      strategyType: 'cross_exchange_arbitrage',
      sourceChain: 'ethereum',
      inputAssets: ['USDC'],
      outputAssets: ['USDC'],
      amountIn: '1000000',
      maxSlippageBps: 50,
      requireFlashLiquidity: true,
      allowedProtocols: ['aave_v3'],
      deadlineMs: Date.now() + 60000,
      metadata: {
        assetAddresses: {
          USDC,
        },
      },
    },
    candidateProtocols: [],
  })

  assert.equal(quotes.length, 0)
})
