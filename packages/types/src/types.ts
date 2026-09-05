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
  extraction,
  scanBuy,
  scanSell,
  poolExtraction,
  swapExtraction
}

export enum Launchpads {
  unknown   = 0,

  virtuals  = 1,
  toshimart = 2,
  apestore  = 3,
  fourmeme  = 4,
  clanker   = 5,
  zora      = 6
}

export interface LimitsForSwaps {
  amountIn: number,
  takeProfit: number,
  stopLoss: number,
  timeMax: number,
  tryCountMax: number,
  protocols: Array<DexProtocols>,
  mustBeVerified: boolean,
  mustBeRenounced: boolean,
  ownerMustNotBeNull: boolean,
  mustNotContainEmojis: boolean,
  lockedPercentageMin: number,
  tokenAgeMin: number,
  tokenAgeMax: number,
  swapCountMin: number,
  swapCountMax: number,
  holderCountMin: number,
  swapsPerMinuteMin: number,
  liquidityInUsdMin: number,
  liquidityInUsdMax: number,
  buyCountPctMin: number,
  buyCountPctMax: number
  buySellVolumeRatioMin: number,
  buySellVolumeRatioMax: number,
  buyVolumeInUsdMedianMin: number,
  unwanted: Array<string>
}

export enum Triggers {
  takeProfit,
  stopLoss,
  time
}

export interface IBuy {
  tokenAddress: string,
  tx: string | null,
  status: string, // pending, success, failed, tracked
  attempts: number,
  tokenAgeOnTx: number,
  amount: string,
  otherAmount: string,
  amountInUsd: number,
  swapIndex: number,
  liquidityInBase?: string,
  liquidityInUsd?: number,
  baseTokenPrice: string,
  swapCount?: number,
  swapsPerMinute?: number,
  holderCount?: number,
  tokenHoldersWithOne?: number,
  tokenHoldersWithTwenty?: number,
  tokenHoldersWithOneHundred?: number,
  tokenHoldersWithOneThousand?: number,
  coinHoldersWithOne?: number,
  coinHoldersWithTwenty?: number,
  coinHoldersWithOneHundred?: number,
  coinHoldersWithOneThousand?: number,
  holderCountRatio?: number,
  buyCountPct?: number,
  buySellVolumeRatio?: number,
  // buyVolumeInUsdMedian?: number | null,
  // buyVolumeInUsdMean?: number | null,
  // buyVolumeInUsdIqr?: number | null,
  // sellVolumeInUsdMedian?: number | null,
  // sellVolumeInUsdMean?: number | null,
  // sellVolumeInUsdIqr?: number | null,
  volumeInUsdMedian?: number | null,
  volumeInUsdMean?: number | null,
  volumeInUsdIqr?: number | null,
  messages: Array<string>,
  updatedAt: number,
  createdAt: number,
  boughtAt: number | null
}

export interface ICheck {
  type: CheckTypes
  execTime: string
  createdAt: number
  poolCount?: number
  swapCount?: number
  tokenCount?: number
  timePerSwap?: string
  loopExecTime?: string
  portfolioBalance?: string
  rejectedPoolCount?: number
}

export interface ICreator {
  address: string
  failCount: number
  createdAt: number
  successCount: number
  // tokens: Array<string>
}

export interface IHolding {
  address: string,
  // quotedAmount: string,
  amount: string,
  avgPriceInBase: string,
  oldAvgPriceInBase: string | null,
  tryCount: number,
  updatedAt: number,
  createdAt: number,
}

export interface ILog {
  logType: string, // totalSwapCount, tokenSwapCount, tokenTracked
  token?: {
    name: string,
    symbol: string,
    address: string,
    createdAt?: number,
  },
  pump?: boolean,
  swapCount: number,
  buyCount: number,
  sellCount: number,
  createdAt: number,
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

export interface IPortfolio {
  wallet: string,
  balance: string,
  auto: boolean,
  createdAt: number,
  updatedAt: number
}

export interface IPortfolioBalance {
  body: string
  wallet: string
  createdAt: number
}

export interface IPrice {
  baseToken: string,
  virtual?: string,
  createdAt: number
}

export interface ISelector {
  body: string,
  unwanted: boolean | null,
  goodCount: number,
  badCount: number,
  lastGoods?: Array<string>,
  lastBads?: Array<string>,
  lastGoodTime?: number,
  lastBadTime?: number,
  updatedAt: number,
  createdAt: number,
}

export interface ISell {
  tokenAddress: string,
  tx: string | null,
  status: string, // pending, success, failed, tracked
  attempts: number,
  txAttempts: number,
  multiple: number,
  prices: Array<string>,
  stopLossCount: number,
  goodMultiple: number | null,
  remaining: boolean,
  lowestMultiple: number,
  highestMultiple: number,
  prevHighestMultiple: number,
  timeTo2x: number | null,
  timeTo3x: number | null,
  timeTo4x: number | null,
  timeToPoint90x: number | null,
  timeToPoint85x: number | null,
  timeToPoint75x: number | null,
  timeToPoint50x: number | null,
  timeToPoint25x: number | null,
  lowestBeforeTx: number | null,
  highestBeforeTx: number | null,
  tokenAgeOnTx: number,
  amount: string,
  amountInUsd: number,
  baseTokenPrice: string,
  siphoned: boolean,
  messages: Array<string>,
  trigger: Triggers | null,
  updatedAt: number,
  createdAt: number,
  soldAt: number | null
}

export interface ISnippet {
  body: string
  scope: string
  tokens: string[]
  blocked: boolean
  badStreak: number
  createdAt: number
  reviewed: boolean
  badTokens: string[]
  goodTokens: string[]
  badAmounts: number[]
  goodAmounts: number[]
  trustScore: number | null
}

export interface IStatReport {
  growth: string
  txCount: number
  rugPulls: number
  successfulExits: number
  highestMultiple: number
  createdAt: number
}

export interface IToken {
  name: string
  block: number
  symbol: string
  address: string
  follow: boolean
  decimals: number
  logIndex: number
  buyCount: number
  lastSwap: number
  swapCount: number
  sellCount: number
  createdAt: number
  totalSupply: string
  website: string | null
  isScam: boolean | null
  creator: string | null
  verified: boolean | null
  compliant: boolean | null
  snippetSafe: boolean | null
  launchpad: Launchpads | null
  ownerRenounced: boolean | null
  // protocols: Array<DexProtocols>
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

export interface ITradingReport {
  count: number
  profit: string
  createdAt: number
  bestProfit: string
  bestMultiple: number
  results: Array<{ count: number, multiple: number, profit: string }>
}