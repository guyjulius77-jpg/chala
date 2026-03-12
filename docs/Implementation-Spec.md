# Multi-Chain DeFi Trading Engine Implementation Specification

## Objective
Implement the PRD as a modular execution system with protocol adapters, chain registry, route planner, bridge router, liquidity analytics, concurrency manager, risk engine, and execution contracts.

## Phase 0: Delivery Principles
1. Build protocol-specific adapters behind a unified execution interface.
2. Separate route planning from route execution.
3. Treat same-chain atomic execution and cross-chain execution as different workflows.
4. Enforce per-trade isolation for capital accounting, gas budgeting, and callback state.
5. Make every protocol, chain, bridge, and pool source configurable through registries, not hardcoded business logic.

## Phase 1: Core Architecture

### 1.1 Services
Build these services:

1. **Chain Registry Service**  
   Stores chain IDs, RPC endpoints, native gas token symbols, protocol availability, bridge availability, and environment metadata.

2. **Protocol Registry Service**  
   Stores protocol deployments, pool contracts, fee models, callback requirements, supported assets, and flash-liquidity capabilities.

3. **Execution Planner**  
   Generates possible routes across chains and venues.

4. **Risk Engine**  
   Screens all routes before execution.

5. **Execution Engine**  
   Submits and monitors trades.

6. **Bridge Router**  
   Requests bridge quotes, validates bridging requirements, and handles bridge-specific exceptions.

7. **Liquidity Analytics Engine**  
   Builds heatmaps and LP position analytics, especially for Uniswap V3.

8. **Concurrency Manager**  
   Schedules and isolates parallel trades.

9. **Observability Layer**  
   Metrics, tracing, event logs, structured failure reasons.

### 1.2 Core Modules
Create these code modules:
- `/chains`
- `/protocols`
- `/routing`
- `/risk`
- `/execution`
- `/bridges`
- `/analytics`
- `/scheduler`
- `/contracts`
- `/storage`
- `/monitoring`

## Phase 2: Data Models

### 2.1 Chain Model
```ts
type ChainConfig = {
  chainKey: string
  chainId?: number
  name: string
  rpcUrls: string[]
  nativeGasToken: string
  isEvm: boolean
  supportsBridges: boolean
  bridgeProviders: string[]
  protocolKeys: string[]
}
```

### 2.2 Protocol Deployment Model
```ts
type ProtocolDeployment = {
  protocolKey: string
  chainKey: string
  routerType: "flash-loan" | "flash-swap" | "dex" | "bridge" | "lending"
  contracts: Record<string, string>
  feeModel: {
    type: "fixed_bps" | "tiered_pool" | "zero_fee" | "dynamic"
    value?: number
    tiers?: number[]
  }
  callbackType?: string
  supportedAssets?: string[]
  notes?: string[]
}
```

### 2.3 Pool Model
```ts
type PoolMetadata = {
  protocolKey: string
  chainKey: string
  poolAddress: string
  token0: string
  token1?: string
  feeTier?: number
  liquidityDepth?: string
  isFlashEnabled?: boolean
  reserveBorrowEnabled?: boolean
}
```

### 2.4 Trade Intent Model
```ts
type TradeIntent = {
  intentId: string
  strategyType:
    | "same_exchange_arbitrage"
    | "cross_exchange_arbitrage"
    | "cross_chain_execution"
    | "collateral_swap"
    | "liquidation"
    | "multi_hop_swap"
  sourceChain: string
  destinationChain?: string
  inputAssets: string[]
  outputAssets: string[]
  amountIn?: string
  maxSlippageBps: number
  requireFlashLiquidity: boolean
  allowedProtocols: string[]
  allowedBridgeProviders?: string[]
  deadlineMs: number
}
```

### 2.5 Execution Job Model
```ts
type ExecutionJob = {
  jobId: string
  intentId: string
  routeId: string
  status:
    | "planned"
    | "validated"
    | "submitted"
    | "pending"
    | "bridging"
    | "settled"
    | "repaid"
    | "failed"
    | "cancelled"
  chainLocks: string[]
  protocolLocks: string[]
  walletContext: string
  gasBudget: string
  flashPrincipal?: string
  flashFee?: string
  bridgeId?: string
}
```

## Phase 3: Chain Registry Implementation

### 3.1 Register Chains by Protocol

#### Aave V3
Register:
- Ethereum
- Arbitrum
- Optimism
- Polygon
- Avalanche
- Base
- BNB Chain
- Gnosis
- Metis
- Scroll
- zkSync Era
- Fantom

#### Uniswap V3
Register:
- Ethereum Mainnet
- Sepolia
- Arbitrum
- Optimism
- Polygon PoS
- BNB Chain
- Avalanche C-Chain
- Celo
- Base
- Blast
- zkSync
- Zora
- World Chain
- Unichain

#### PancakeSwap
Register:
- BNB Smart Chain
- Ethereum
- Arbitrum One
- Base
- Solana
- zkSync Era
- Linea
- opBNB
- Aptos
- Polygon zkEVM
- Monad

#### SushiSwap
Register:
- ApeChain
- Arbitrum One
- Arbitrum Nova
- Avalanche C-Chain
- Aptos
- Base
- Blast
- BNB Smart Chain
- Boba BNB
- Boba Eth
- Celo
- Core Blockchain
- Cronos
- Ethereum
- Fantom
- Filecoin
- Gnosis
- Haqq Network
- Hemi
- Katana
- Kava
- Linea
- Manta Pacific
- Mantle
- Metis Andromeda
- Mode
- Optimism
- Polygon
- Rootstock
- Scroll
- SKALE Europa
- Sonic
- Taiko Alethia
- ThunderCore
- Tron
- ZetaChain
- zkLink Nova
- zkSync

#### Curve
Register:
- Ethereum
- Avalanche
- BNB Chain
- Fantom
- Celo
- XDC
- Gnosis
- Moonbeam
- Harmony
- Aurora
- Kava
- Arbitrum
- Optimism
- Polygon
- Polygon zkEVM / Plasma
- Base
- Linea
- Metis
- Mantle
- Manta
- Fraxtal
- Blast
- Taiko
- Mode
- Ink
- Unichain
- Monad
- Etherlink
- X Layer
- TAC
- Hyperliquid L1
- Sonic
- Plume Mainnet
- Corn
- Unit Zero
- Crossfi

#### dYdX
Register:
- Ethereum Mainnet for Solo Margin flash loans
- dYdX Chain
- Noble and Cosmos connectivity metadata where required

### 3.2 Chain Registry Tasks
1. Create canonical chain keys.
2. Add RPC configuration support per environment.
3. Add gas token metadata.
4. Add bridge support flags.
5. Add EVM and non-EVM flags.
6. Add testnet/mainnet environment separation.

## Phase 4: Protocol Adapter Implementation

### 4.1 Common Adapter Interface
```ts
interface ProtocolAdapter {
  quote(routeInput: RouteInput): Promise<RouteQuote[]>
  validate(route: PlannedRoute): Promise<ValidationResult>
  buildExecution(route: PlannedRoute): Promise<ExecutionPayload>
  monitor(txHash: string): Promise<ExecutionStatus>
}
```

### 4.2 Aave Adapter
Implement:
- chain-specific pool bindings
- reserve discovery
- borrow-enabled checks
- `flashLoan()`
- `flashLoanSimple()`
- 0.05% fee handling
- provided mainnet pool addresses bootstrap

Add contract constants:
- Ethereum `0x87870Bca3F3fD6335C3F4ce8392D69350B4fA4E2`
- Optimism `0x794a61358D6845594F94dc1DB02A252b5b4814aD`
- Arbitrum `0x794a61358D6845594F94dc1DB02A252b5b4814aD`
- Polygon `0x794a61358D6845594F94dc1DB02A252b5b4814aD`
- Avalanche `0x794a61358D6845594F94dc1DB02A252b5b4814aD`
- Base `0xA238Dd80C259a72e81d7e4664a9801593F98d1c5`

### 4.3 Uniswap V3 Adapter
Implement:
- pool discovery
- flash quote simulation
- fee-tier awareness
- `uniswapV3FlashCallback` support
- multi-pool selection with liquidity ranking
- V2 analog support where relevant

### 4.4 PancakeSwap Adapter
Implement:
- chain-aware deployment registry
- swap and liquidity routing
- perpetual availability flags
- cross-chain swap integration with Across
- bridge-provider integration
- flash-swap support using `pancakeCall`
- V2 and V3 fee handling
- Infinity flash accounting compatibility layer

### 4.5 SushiSwap Adapter
Implement:
- BentoBox liquidity sourcing
- Kashi pair handling
- chain deployment registry
- 0.05% flash fee application
- atomic flash-loan workflow support

### 4.6 Curve Adapter
Implement:
- crvUSD controller integration
- Stableswap-NG pool discovery
- asset support mapping
- crvUSD Flash Lender support:
  - `0xa7a4bb50af91f90b6feb3388e7f8286af45b299b`
- per-chain pool feature flags
- Ethereum-only governance and minting metadata constraints

### 4.7 dYdX Adapter
Implement:
- Solo Margin support on Ethereum only
- zero-fee flash loan accounting
- Withdraw-Call-Deposit execution builder
- dYdX Chain as non-flash-loan environment for routing metadata only

## Phase 5: Execution Contract Design

### 5.1 Contracts to Build
1. **FlashExecutor**
   - receives flash liquidity
   - executes swaps
   - repays principal plus fee
   - emits route diagnostics

2. **Callback Modules**
   - Aave receiver
   - Uniswap V3 flash callback
   - PancakeSwap callback
   - BentoBox-compatible repayment flow
   - Solo Margin integration wrapper

3. **RouteExecutor**
   - handles multi-hop paths
   - supports same-chain composable transactions

4. **Access Controller**
   - only authorized off-chain engine can trigger execution
   - role-based admin controls

### 5.2 Contract Requirements
- per-trade isolated state
- no shared mutable route state across concurrent jobs
- safe math and reentrancy protection
- deadline enforcement
- min-out protection
- explicit repayment assertions
- event emission for every major step

## Phase 6: Bridge Router Implementation

### 6.1 Supported Bridge Paths
Support PancakeSwap-related bridge routing through:
- Across
- Stargate
- LayerZero
- Wormhole
- cBridge
- deBridge
- Meson

Support chain combinations explicitly mentioned in scope, including:
- BNB Chain
- Ethereum
- Solana
- Arbitrum
- Base
- zkSync Era
- Linea
- opBNB
- Aptos

### 6.2 Bridge Quote Object
```ts
type BridgeQuote = {
  provider: string
  sourceChain: string
  destinationChain: string
  sourceAsset: string
  destinationAsset: string
  amountIn: string
  estimatedAmountOut: string
  estimatedTimeSec: number
  requiresManualRedeem: boolean
  gasTokenRequired: string
  warnings: string[]
}
```

### 6.3 Bridge Validation Rules
Reject or flag routes when:
- source-chain gas token is insufficient
- destination settlement is delayed beyond strategy threshold
- route requires unsupported manual redemption
- destination wallet type is incompatible, such as Aptos-specific requirements
- liquidity is too thin for target notional

## Phase 7: Route Planner

### 7.1 Route Generation
For each intent:
1. find all usable protocols on source chain
2. find all flash-liquidity options if required
3. find all candidate pools
4. find bridge options if destination chain differs
5. score routes

### 7.2 Route Score Formula
Score using:
- expected pnl
- flash fee
- swap fee
- bridge fee
- gas estimate
- slippage risk
- liquidity depth
- repayment certainty
- bridge completion confidence

### 7.3 Route Types
Support:
- same-exchange
- cross-exchange
- cross-chain
- collateral swap
- liquidation
- multi-hop

## Phase 8: Risk Engine

### 8.1 Pre-Trade Checks
Run:
1. reserve eligibility check
2. pool liquidity check
3. fee-tier check
4. callback support check
5. gas sufficiency check
6. token approval and allowance check
7. repayment simulation
8. slippage simulation
9. bridge compatibility check
10. deadline viability check

### 8.2 Advanced Checks
Add:
- concentrated liquidity range analysis
- out-of-range LP detection
- low-liquidity pool warning
- JIT liquidity anomaly warning
- cross-chain settlement hazard warning
- manual redeem warning
- stale oracle or stale pool state warning

## Phase 9: Concurrency Manager

### 9.1 Scheduling Model
Use job queue with:
- per-wallet isolation
- per-chain gas budget isolation
- per-protocol rate limiting
- optimistic parallelism for unrelated jobs

### 9.2 Locking Rules
Lock only when necessary:
- same wallet nonce domain
- same route-specific capital bucket
- same temporary bridge balance
- same atomic contract state if shared

Do not globally lock:
- same exchange
- same chain
- same strategy type

### 9.3 Failure Isolation
Each job must have:
- independent state
- independent logs
- independent retry policy
- no shared repayment assumptions

## Phase 10: Liquidity Analytics Engine

### 10.1 Uniswap V3 Analytics
Build event ingestion for:
- mint
- burn
- collect
- swap
- position updates

### 10.2 Heatmap Builder
Replay liquidity events:
- tick by tick
- day by day

Output:
- liquidity heatmap
- active tick bands
- fee-density estimation
- historical depth snapshots

### 10.3 Position Analytics
For each LP position:
- owner
- price range
- current in-range/out-of-range state
- position liquidity
- realized pnl usd
- unrealized pnl usd
- accrued fees
- anomaly flags

### 10.4 Data Infrastructure
Implement using indexed DeFi event storage comparable to the Datamint-style requirement in your scope:
- block-indexed event table
- position table
- pool snapshot table
- derived analytics table

## Phase 11: Storage and Observability

### 11.1 Persist
Store:
- route plans
- execution jobs
- tx hashes
- fee estimates
- bridge quotes
- risk rejections
- pool snapshots
- LP analytics
- failure reasons

### 11.2 Metrics
Track:
- route success rate
- flash-loan success rate
- repayment failures
- avg gas by chain
- avg bridge latency
- slippage exceeded count
- pnl by protocol
- concurrent job throughput

### 11.3 Alerts
Alert on:
- repayment failure
- repeated callback failure
- bridge route degradation
- pool illiquidity
- chain RPC instability
- abnormal revert rate

## Phase 12: Testing Strategy

### 12.1 Unit Tests
Cover:
- fee calculations
- route scoring
- adapter validation
- callback encoding
- bridge quote parsing
- concurrency locks

### 12.2 Fork Tests
Use chain forks for:
- Aave flash loans
- Uniswap V3 flash swaps
- PancakeSwap callbacks
- Sushi BentoBox flash loans
- Curve crvUSD lending flows
- dYdX Solo Margin repayment flow

### 12.3 Integration Tests
Test:
- same-exchange arbitrage
- cross-exchange arbitrage
- cross-chain bridge plus trade
- parallel execution of multiple jobs
- failure isolation across concurrent jobs

### 12.4 Analytics Tests
Validate:
- heatmap reconstruction
- position pnl computation
- out-of-range classification
- anomaly detection

## Phase 13: Rollout Plan

### 13.1 Milestone 1
Launch core same-chain engine on:
- Ethereum
- Arbitrum
- Base
- Optimism
with:
- Aave
- Uniswap
- Curve

### 13.2 Milestone 2
Add:
- PancakeSwap
- SushiSwap
- dYdX Solo Margin
- bridge routing
- concurrent execution

### 13.3 Milestone 3
Expand full chain matrix:
- zkSync
- Scroll
- Fantom
- Polygon
- Avalanche
- BNB Chain
- Gnosis
- Metis
- Linea
- opBNB
- Aptos
- Solana
- remaining listed ecosystems as applicable

### 13.4 Milestone 4
Add advanced analytics:
- LP position intelligence
- heatmaps
- route decisions using liquidity-history signals

## Phase 14: Developer Task Breakdown

### Sprint 1
- build chain registry
- build protocol registry
- define core interfaces
- bootstrap Aave and Uniswap adapters

### Sprint 2
- build execution contracts
- implement same-chain atomic execution
- integrate risk engine
- add fork tests

### Sprint 3
- add PancakeSwap and Sushi adapters
- implement bridge router
- implement concurrency manager

### Sprint 4
- add Curve and dYdX support
- add storage and observability
- add failure recovery logic

### Sprint 5
- build liquidity analytics ingestion
- build heatmap pipeline
- expose analytics to route planner

### Sprint 6
- expand full chain support
- harden production monitoring
- run staged rollout

## Phase 15: Definition of Done
The implementation is complete when:
1. all listed protocol adapters exist
2. all listed chains are registered
3. execution contracts support required callbacks and repayments
4. engine can run multiple trades simultaneously
5. bridge-aware routes can be quoted and validated
6. flash liquidity is available where supported
7. risk engine blocks unsafe routes
8. analytics engine reconstructs concentrated liquidity history
9. monitoring and audit logs are production-ready
10. at least one successful end-to-end workflow exists for each in-scope flash-liquidity provider
