import type { HydratedDocument } from 'mongoose'
// import { } from './models/models'

import { BigNumber } from 'bignumber.js'

export enum Routers {
  default,
  universal,
  uniswap
}

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

export enum Launchpads {
  unknown   = 0,

  virtuals  = 1,
  toshimart = 2,
  apestore  = 3,
  fourmeme  = 4,
  clanker   = 5,
  zora      = 6
}

export enum Triggers {
  takeProfit,
  stopLoss,
  time
}

export enum CheckTypes {
  extraction,
  scanBuy,
  scanSell,
  poolExtraction,
  swapExtraction
}

export enum WatcherEvents {
  ownerRenounced,
}

export interface SelectorData {
  oneLastWasBad: boolean,
  unknown: Array<string>,
  unallowed: Array<string>,
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

export interface IPrice {
  baseToken: string,
  virtual?: string,
  createdAt: number
}

export interface IPortfolioBalance {
  body: string
  wallet: string
  createdAt: number
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

export interface ICreator {
  address: string
  failCount: number
  createdAt: number
  successCount: number
  // tokens: Array<string>
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

export interface IMetrics {
  tokenAgeMin: number,
  tokenAgeMax: number,
  swapCountMin: number,
  swapCountMax: number,
  liquidityInUsdMin: number,
  liquidityInUsdMax: number,
  buyCountPctMin: number,
  buyCountPctMax: number
  buySellVolumeRatioMin: number,
  buySellVolumeRatioMax: number,
}

export interface INotification {
  notificationType: string,
  token?: string,
  pump?: boolean,
  swapCount: number,
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

export interface IPushSubscription {
  subscriber_token: string,
  createdAt: number,
}

export interface ITradingReport {
  count: number
  profit: string
  createdAt: number
  bestProfit: string
  bestMultiple: number
  results: Array<{ count: number, multiple: number, profit: string }>
}

export interface IReport {
  portfolio: string,
  good: boolean,
  tokenAges?: Array<number>,
  swapCounts?: Array<number>,
  liquiditiesInUsd?: Array<number>,
  buyCountPcts?: Array<number>,
  buySellVolumeRatios?: Array<number>,
  createdAt: number
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

export interface ITransaction {
  randomString: string,
  wallet: string,
  status: string, // pending, success, failed
  attempts: number,
  multiple: number,
  highestMultiple: number,
  canBuyAndSell?: boolean | null,
  token: {
    name: string,
    symbol: string,
    address: string,
    decimals: number,
    protocols: Array<DexProtocols>,
    ownerRenounced: boolean | null,
    selectors?: Array<string>,
  },
  lpRenounced?: boolean | null,
  tokenAgeOnTx: number,
  buy: boolean,
  // quotedAmount: string,
  amount: string,
  avgPriceInBase?: string,
  liquidityInBase?: string,
  liquidityInUsd?: number,
  baseTokenPrice: string,
  protocol?: DexProtocols,
  swapCount?: number,
  holderCount?: number,
  holderCountRatio?: number,
  buyCountPct?: number,
  buySellVolumeRatio?: number,
  buyVolumeInUsdMedian?: number | null,
  buyVolumeInUsdMean?: number | null,
  sellVolumeInUsdMedian?: number | null,
  sellVolumeInUsdMean?: number | null,
  lastMessage: string,
  // code: string,
  updatedAt: number,
  createdAt: number,
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

export interface IWatcher {
  token: string,
  event: WatcherEvents,
  createdAt: number
}

export interface TokenSwapFilter {
  logIndex: number,
  tx: string,
  token: string
}

export interface SwapEvent {
  token: HydratedDocument<IToken>,
  tx: string,
  blockNumber: number,
  logIndex: number,
  buy?: boolean,
  amount?: bigint,
  sender?: string,
  recipient?: string,
  timestamp: number,
  delta?: bigint,
  priceInBase?: string,
  amountInBase?: string,
  protocol: DexProtocols,
}

export interface SyncEvent {
  token: HydratedDocument<IToken>,
  tx: string,
  blockNumber: number,
  logIndex: number,
  buy?: boolean,
  amount?: bigint,
  sender?: string,
  recipient?: string,
  timestamp: number,
  delta?: bigint,
  priceInBase?: string,
  protocol: DexProtocols,
}

export interface LockerCreatedEvent {
  token: HydratedDocument<IToken>,
  tx: string,
  blockNumber: number,
  logIndex: number,
  buy?: boolean,
  amount?: bigint,
  sender?: string,
  recipient?: string,
  timestamp: number,
  delta?: bigint,
  priceInBase?: string,
  protocol: DexProtocols,
}

export interface EventToken {
  token: HydratedDocument<IToken>,
  highestBlock: number,
  highestIndex: number,
  lastSwap: number,
  protocols: Array<DexProtocols>,
  lastPriceInBase?: string,
  highestPriceInBase?: string,
  lowestPriceInBase?: string,
}

export interface SwapMovementForToken {
  token: HydratedDocument<IToken>,
  swapCount: number,
  holderCount: number,
  holderCountRatio: number,
  buyCountPct: number,
  buyVolumesInUsd?: Array<number>,
  sellVolumesInUsd?: Array<number>,
  buySellVolumeRatio: BigNumber
}

export interface LimitsForLogs {
  buySellCountRatioPump: number,
  buySellCountRatioDump: number, 
  buySellVolumeRatioPump: number,
  buySellVolumeRatioDump: number,
  swapCount: {
    underOneDayOld: Array<number>,
    underOneWeekOld: Array<number>,
    moreThanOneWeekOld: Array<number>
  }
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

export interface ISwapLimit extends LimitsForSwaps {
  approved: boolean,
  createdAt: number,
}

export interface ExecuteSwapParams {
  portfolioAddress: string,
  // amountIn: bigint, //'22000000000000000'
  tokenIn: HydratedDocument<IToken>, // Token to sell
  tokenOut: HydratedDocument<IToken>, // Token to buy
  baseTokenPrice: bigint,
  limits: LimitsForSwaps,
  multiple: number,
  // endBlock: number,
  data?: {
    swapCount: number,
    holderCount: number,
    holderCountRatio: number,
    buyCountPct: number,
    buySellVolumeRatio: number,
    buyVolumeInUsdMedian?: number | null,
    buyVolumeInUsdMean?: number | null,
    sellVolumeInUsdMedian?: number | null,
    sellVolumeInUsdMean?: number | null
  }
}

export interface ExecuteBuyParams {
  portfolioAddress: string,
  // amountIn: bigint, //'22000000000000000'
  tokenIn: HydratedDocument<IToken>, // Token to sell
  tokenOut: HydratedDocument<IToken>, // Token to buy
  baseTokenPrice: bigint,
  // baseTokenPriceChange: Array<number>,
  selectorData: SelectorData,
  limits: LimitsForSwaps,
  skipChecks: boolean,
  multiple: number,
  tryCount: number,
  // endBlock: number,
  data: {
    growth: number,
    swapCount: number
    swapsPerMinute: number
    holders: string[],
    holderCount: number
    holderCountRatio: number
    buyCountPct: number
    buySellVolumeRatio: number
    buyVolumeInUsdMedian?: number | null
    buyVolumeInUsdMean?: number | null
    buyVolumeInUsdIqr?: number | null
    sellVolumeInUsdMedian?: number | null
    sellVolumeInUsdMean?: number | null
    sellVolumeInUsdIqr?: number | null
    volumeInUsdMedian?: number | null
    volumeInUsdMean?: number | null
    volumeInUsdIqr?: number | null
  }
}

export interface ExecuteSellParams {
  portfolioAddress: string,
  // amountIn: bigint, //'22000000000000000'
  token: HydratedDocument<IToken>, // Token to sell
  baseToken: HydratedDocument<IToken>, // Token to buy
  baseTokenPrice: bigint,
  limits: LimitsForSwaps,
  tryCount: number,
  buy: BuyFromScan
  holding: HoldingFromScan
  // endBlock: number,
}

export interface SwapResponse {
  success: boolean,
  tx: string | null,
  msg: string | null
}

export interface TokensFromExtractions {
  [key: string]: TokenFromExtraction
}

export interface TokenFromExtraction {
  name?: string
  block: number
  saved: boolean
  update: boolean
  symbol?: string
  follow?: boolean
  buyCount?: number
  lastSwap?: number
  decimals?: number
  logIndex: number
  createdAt?: number
  sellCount?: number
  swapCount?: number
  selectors?: string[]
  totalSupply?: string
  launchpad?: Launchpads
  isScam?: boolean | null
  creator?: string | null
  website?: string | null
  verified?: boolean | null
  protocols?: DexProtocols[]
  compliant?: boolean | null
  snippetSafe?: boolean | null
  lastPriceInBase?: string | null
  ownerRenounced?: boolean | null
  lowestPriceInBase?: string | null
  highestPriceInBase?: string | null
}

export interface TokenInsertData {
  updateOne: {
    filter: {
      address: string
    },
    update: {
      name: string
      block: number
      symbol: string
      follow: boolean
      buyCount: number
      lastSwap: number
      decimals: number
      logIndex: number
      createdAt: number
      sellCount: number
      swapCount: number
      selectors: string[]
      totalSupply: string
      website: string | null
      isScam: boolean | null
      creator: string | null
      verified: boolean | null
      protocols: DexProtocols[]
      compliant: boolean | null
      snippetSafe: boolean | null
      ownerRenounced: boolean | null
    },
    upsert: boolean
  }
}

export interface UnfollowedTokenUpdateData {
  updateOne: {
    filter: {
      address: string
    },
    update: {
      lastSwap: number
    },
    upsert: boolean
  }
}

export interface TokenUpdateData {
  updateOne: {
    filter: {
      address: string
    },
    update: {
      block: number
      follow: boolean
      lastSwap: number
      decimals: number
      logIndex: number
      launchpad?: Launchpads
      lastPriceInBase?: string
      protocols: DexProtocols[]
      lowestPriceInBase?: string
      highestPriceInBase?: string
    },
    upsert: boolean
  }
}

export interface SwapFromExtraction {
  tx: string
  buy: boolean
  pool: string
  block: number
  amount: string
  token?: string
  sender: string | null
  logIndex: number
  recipient: string | null
  timestamp: number
  otherToken?: string
  dexProtocol: string
  otherAmount: string
  isTokenZero: boolean
  protocol?: DexProtocols
}

export interface TokenSwapInsertData {
  updateOne: {
    filter: {
      tx: string
      token: string
      logIndex: number
    }
    update: {
      buy: boolean
      block: number
      amount: string
      timestamp: number
      otherToken: string
      otherAmount: string
      sender: string | null
      protocol: DexProtocols
      recipient: string | null
    }
    upsert: boolean
  }
}

export interface TokensFromSwapCounts {
  [key: string]: TokenFromSwapCount
}

export interface TokenFromSwapCount {
  buyCount: number
  sellCount: number
  swapCount: number
}

export interface TokenUpdateSwapCountData {
  updateOne: {
    filter: {
      address: string
    },
    update: {
      buyCount: number
      sellCount: number
      swapCount: number
    },
    upsert: boolean
  }
}

export interface TokensFromScan {
  [key: string]: TokenFromScan
}

export interface TokenFromScan {
  growth: number
  buyCount: number
  sellCount: number
  swapCount: number
  holders: string[]
  buyVolume: bigint
  sellVolume: bigint
  holderCount: number
  buyCountPct: number
  otherBuyVolume: bigint
  otherSellVolume: bigint
  recentSwapCount: number
  holderCountRatio: number
  buyVolumesInUsd: number[]
  sellVolumesInUsd: number[]
  smallestBlock: number | null
  buySellVolumeRatio: BigNumber
  lastPriceTracked: string | null
  token: HydratedDocument<IToken>
  firstPriceTracked: string | null
}

export interface HoldingsFromScan {
  [key: string]: HoldingFromScan
}

export interface HoldingFromScan {
  wallet: string
  amount: string
  tryCount: number
  updatedAt: number
  createdAt: number
  avgPriceInBase: string
  oldAvgPriceInBase: string | null
}

export interface BuysFromScan {
  [key: string]: BuyFromScan
}

export interface BuyFromScan {
  wallet: string
  createdAt: number
  amountInUsd: number
  liquidityInUsd: number
  boughtAt: number | null
}