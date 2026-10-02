export enum DexProtocols {
  unknown = 0,
  
  uniswapv2 = 1,
  uniswapv3 = 2,
  uniswapv4 = 7,

  sushiswapv2 = 3,
  sushiswapv3 = 4,

  pancakeswapv2 = 5,
  pancakeswapv3 = 6,

  virtuals = 20,
}

export enum CheckTypes {
  findPools = 0,
  findSwaps = 1,
  findTransfers = 2,
  computeTokenData = 3,
  cleanUp = 4,

  scanBuy = 5,
  scanSell = 6,
}

export const CURSOR_TYPES = [
  CheckTypes.findPools,
  CheckTypes.findSwaps,
  CheckTypes.findTransfers
] as const

export type CursorType = (typeof CURSOR_TYPES)[number]

export enum Launchpads {
  unknown   = 0,

  virtuals  = 1,
  toshimart = 2,
  apestore  = 3,
  fourmeme  = 4,
  clanker   = 5,
  zora      = 6
}

export interface ICheck {
  createdAt: Date
  type: CheckTypes
  execTime: string
  fromBlock?: number
  toBlock?: number
  logCount?: number
  poolCount?: number
  swapCount?: number
  tokenCount?: number
  timePerLog?: string
  holderCount?: number
  loopExecTime?: string
  transferCount?: number
  portfolioBalance?: string
  rejectedPoolCount?: number
}

export interface ICursor {
  type: CursorType
  lastBlock: number
  createdAt: Date
  updatedAt: Date
}

export interface IHolder {
  block: number,
  token: string,
  address: string,
  balance: string,
  sent: number,
  received: number,
  amountIn: string,
  amountOut: string,
  createdAt: Date,
}

export interface IPool {
  fee: number
  block: number
  token0: string
  token1: string
  address: string
  amount0: string
  amount1: string
  follow: boolean
  lastSync: number
  firstSwap: number
  decimals0: number
  decimals1: number
  createdAt: number
  swapCount: number
  firstBlock: number
  tickSpacing: number
  hooks: string | null
  swap0OutCount: number
  swap1OutCount: number
  protocol: DexProtocols
  lockedPercentage: number
  firstSwaps: Array<Array<string>>
  // renouncedPercentage: number
  // lpLockedOrRenounced: boolean
}

export interface IToken {
  name: string
  block: number
  symbol: string
  createdAt: Date
  address: string
  follow: boolean
  decimals: number
  lastActivityAt: Date
  verified: boolean | null
  launchpad: Launchpads | null
}

export interface ITokenSwap {
  tx: string
  pool: string
  block: number
  amount0: string
  amount1: string
  logIndex: number
  timestamp: number
  // sender: string | null
  // recipient: string | null
}

