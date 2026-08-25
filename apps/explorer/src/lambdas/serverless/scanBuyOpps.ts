// import { performance } from 'perf_hooks'

// import * as mongoose from 'mongoose'
// // import emojiRegex from 'emoji-regex'
// import { BigNumber } from 'bignumber.js'
// import type { FlattenMaps, HydratedDocument } from 'mongoose'

// import isLocal from '../../config/isLocal.js'
// import { Stat } from '../../helpers/stats.js'
// import addresses from './../../config/addresses.js'
// import { databaseUrl } from '../../config/databaseUrl.js'
// import { Logger, randomLog } from '../../config/logger.js'
// import fromServerless from '../../config/fromServerless.js'
// import { getSelectorDataForToken } from '../../helpers/selectors.js'
// import { findOrCreateTradingParams } from '../../helpers/tradingParams.js'
// import { findOrCreateFakePortfolio, findOrCreatePortfolio } from '../../helpers/portfolios.js'

// import executeBuy from '../../lambdas/executeBuy.js'

// import * as models from '../../models/models.js'

// import {
//   CheckTypes, DexProtocols, ExecuteBuyParams, IPortfolio, IPrice, IToken,
//   HoldingsFromScan,
// } from '../../types.js'

// // const _emojiRegex = emojiRegex()

// export interface TokensFromScan {
//   [key: string]: TokenFromScan
// }

// export interface TokenFromScan {
//   // swapCount: number
//   // holders: string[]
//   // buyVolume: bigint
//   // sellVolume: bigint
//   // holderCount: number
//   // buyCountPct: number
//   // recentSwapCount: number
//   // holderCountRatio: number
//   // buyVolumesInUsd: number[]
//   // sellVolumesInUsd: number[]
//   // buySellVolumeRatio: BigNumber
//   token: HydratedDocument<IToken>
// }

// const {
//   BuyModel: Buy,
//   PoolModel: Pool,
//   SellModel: Sell,
//   CheckModel: Check,
//   TokenModel: Token,
//   PriceModel: Price,
//   HoldingModel: Holding,
//   TokenSwapModel: TokenSwap,
// } = models

// export default async (
//   tokenIn: HydratedDocument<IToken>
// ): Promise<void> => {
//   const scanStart = performance.now()

//   let tokenCount = 0
//   let swapsToExecuteCount = 0
//   let portfolioBalance = '0'

//   let execTime = '0'

//   // let tokens: TokensFromScan = {}
//   let tokensFromScan: TokensFromScan = {}
//   let holdingsFromScan: HoldingsFromScan = {}

//   const PORTFOLIO_ADDRESS = process.env.PORTFOLIO_ADDRESS
//   if (!PORTFOLIO_ADDRESS) {
//     return console.log('Could not find PORTFOLIO_ADDRESS')
//   }

//   let buyPromises: Array<Promise<void>> = []
//   let swapsToExecute: Array<ExecuteBuyParams> = []

//   const interval = 50 // 50 seconds.
//   const ceiling = Math.floor(Date.now() / 1000)
//   const floor = ceiling - (60 * 30) // 30 mins ago.

//   const oneMinAgo = ceiling - 60
//   const oneHourAgo = ceiling - ((60 * 60) * 1)
//   const sixHoursAgo = ceiling - ((60 * 60) * 6)
//   const oneDayAgo = ceiling - ((60 * 60) * 24)

//   const recentSpreadInMins = 60 * 3 // 3 mins

//   // let baseTokenPriceChange: Array<number> = []

//   let unwantedHolders = [
//     addresses.uniswap.v2.swapRouter02,
//     addresses.uniswap.v3.swapRouter02,
//     addresses.uniswap.v3.universalRouter,

//     addresses.pancakeswap.v2.router,
//     addresses.pancakeswap.v3.swapRouter,
//     addresses.pancakeswap.v3.universalRouter,
    
//     addresses.sushiswap.v2.swapRouter02
//   ]

//   try {
//     if (fromServerless) {
//       mongoose.set('strictQuery', false)
//       await mongoose.connect(databaseUrl)
//     }

//     let price = await Price.findOne({}).sort({ createdAt: -1 })
//     if (!price || BigInt(price.baseToken) === 0n) { return console.log('Could not get baseToken price...') }

//     const baseTokenPrice = price.baseToken

//     let portfolio: HydratedDocument<IPortfolio> | null = null
//     if (PORTFOLIO_ADDRESS === process.env.WALLET_ADDRESS) {
//       portfolio = await findOrCreatePortfolio(PORTFOLIO_ADDRESS)
//     } else {
//       portfolio = await findOrCreateFakePortfolio(Number(PORTFOLIO_ADDRESS))
//     }

//     if (!portfolio) return console.log('Could not find or create portfolio...')

//     portfolioBalance = portfolio.balance

//     if (!portfolio.auto) {
//       return console.log('Auto trading is turned off for portfolio')
//     }

//     let limits = await findOrCreateTradingParams()
//     if (!limits) { return }

//     const pools = await Pool.find({
//       createdAt: { $gte: (ceiling - ((60 * 60) * 1)) }, // 1 hour
//       lastSync: { $gte: (ceiling - interval) }
//     })

//     let tokenAddresses: string[] = []
//     for (const pool of pools) {
//       const quoteToken = pool.quoteToken()

//       if (!tokenAddresses.includes(quoteToken)) {
//         tokenAddresses.push(quoteToken)
//       }
//     }

//     const tokens = await Token.find({
//       follow: true,
//       address: { $in: [ tokenAddresses ] }
//     })

//     tokenCount = tokens.length
    
//     for (const token of tokens) {
//       const address = token.address

//       tokensFromScan[address] = {
//         token: token,
//       }
//     }

//     if (!Object.keys(tokensFromScan).length) { return }

//     const holdings = await Holding.find({
//       wallet: portfolio.wallet, address: { $in: Object.keys(tokens) }
//     }, '-_id').lean()

//     let investedCount = 0
//     for (const holding of holdings) {
//       const address = holding.address

//       holdingsFromScan[address] = {
//         wallet: holding.wallet,
//         amount: holding.amount,
//         tryCount: holding.tryCount,
//         updatedAt: holding.updatedAt,
//         createdAt: holding.createdAt,
//         avgPriceInBase: holding.avgPriceInBase,
//         oldAvgPriceInBase: holding.oldAvgPriceInBase
//       }

//       if (
//         Number(holding.amount) > 0
//         && holding.updatedAt >= (ceiling - ( 60 * 15 ))
//       ) {
//         investedCount++
//       }
//     }

//     if (investedCount >= 4) {
//       console.log('4 or more holdings are currently invested'); return
//     }

//     // const swaps = await TokenSwap.find({
//     //   token: { $in: Object.keys(tokens) }, timestamp: { $gte: floor, $lte: ceiling }
//     // }, '-_id').sort({ block: -1 }).lean()

//     // if (!swaps.length) { return }

//     for (const address in tokens) {
//       let skipChecks = false
//       let token = tokens[address].token

//       if (isLocal) {
//         console.log('**********')
//       }
//       let msg = `${token.name} (${token.symbol}): ${token.address} Protocols: ${token.protocols} ::`

//       if (token.isScam) {
//         if (isLocal) {console.log(msg, 'Token is a scam.')}; continue
//       }

//       if (token.verified === false) {
//         if (isLocal) {console.log(msg, 'Token is not verified.')}; continue
//       }

//       const selectorData = await getSelectorDataForToken(token)

//       const holdingOut = holdings[address]

//       let tryCount = 1
//       if (holdingOut) {
//         if (Number(holdingOut.amount) > 1) {
//           if (isLocal) {console.log(msg, 'holdingOut already exists')}; continue
//         } else {
//           if (holdingOut.tryCount < limits.tryCountMax) {
//             if (
//               token.lastPriceInBase
//               && (BigNumber(token.lastPriceInBase).gte(BigNumber(holdingOut.avgPriceInBase).times(1.35)))
//               && (BigNumber(token.lastPriceInBase).lt(BigNumber(holdingOut.avgPriceInBase).times(1.85)))
//             ) {
//               const sell = await Sell.findOne({
//                 status: 'success',
//                 goodMultiple: { '$lt': 1 },
//                 wallet: portfolio.wallet,
//                 tokenAddress: token.address,
//                 tryCount: holdingOut.tryCount
//               }).lean()

//               if (sell) {
//                 if (sell.createdAt < (ceiling - 30)) {
//                   const lastBuy = await Buy.findOne({
//                     status: 'success',
//                     wallet: portfolio.wallet,
//                     tokenAddress: token.address,
//                     tryCount: holdingOut.tryCount,
//                     isTest: false
//                   }).lean()

//                   if (lastBuy) {
//                     tryCount = (holdingOut.tryCount + 1); skipChecks = true;
//                     // console.log(msg, 'Skipping checks.');
//                   } else {
//                     if (isLocal) {console.log(msg, 'Last buy is test.')}; continue
//                   }
//                 } else {
//                   if (isLocal) {console.log(msg, 'Previous sell is less than a minute old.')}; continue
//                 }
//               } else {
//                 if (isLocal) {console.log(msg, 'Previous sell was successful.')}; continue
//               }
//             } else {
//               if (isLocal) {console.log(msg, 'holdingOut.avgPriceInBase > token.lastPriceInBase')}; continue
//             }
//           } else {
//             if (isLocal) {console.log(msg, 'holdingOut.tryCount >= limits.tryCountMax')}; continue
//           }
//         }
//       }

//       let tokenAgeMin = limits.tokenAgeMin

//       // if (
//       //   token.protocols?.length === 1
//       //   && token.protocols?.includes(DexProtocols.uniswapv3)
//       // ) {
//       //   tokenAgeMin = tokenAgeMin * 20
//       // }

//       if (!skipChecks && token.createdAt < (ceiling - limits.tokenAgeMax)) {
//         if (isLocal) {console.log(msg, 'token.createdAt < (ceiling - limits.tokenAgeMax)')}; continue
//       }
//       if (!skipChecks && token.createdAt > (ceiling - (tokenAgeMin))) {
//         if (isLocal) {console.log(msg, 'token.createdAt > (ceiling - (tokenAgeMin))')}; continue
//       }

//       if (!skipChecks && limits.ownerMustNotBeNull) {
//         if (token.ownerRenounced === null) {
//           if (isLocal) {console.log(msg, 'Owner can\'t be null.')}; continue
//         }
//       }

//       // if (!skipChecks && limits.mustNotContainEmojis) {
//       //   const emojiMatch = token.name.match(_emojiRegex)
        
//       //   if (emojiMatch && emojiMatch.length) {
//       //     if (isLocal) {console.log(msg, 'Token contains emojis.')}; continue
//       //   }
//       // }

//       // if (
//       //   !skipChecks
//       //   && token.selectors
//       //   && token.selectors.includes('d505accf')
//       // ) {
//       //   console.log('Token\' selectors contain d505accf.'); continue
//       // }

//       // if (
//       //   !skipChecks
//       //   && token.selectors.length === 1
//       //   && token.selectors.includes('d505accf')
//       // ) {
//       //   if (isLocal) { console.log(msg, 'Token\' only selector is d505accf.') }; continue
//       // }

//       // if (
//       //   !skipChecks
//       //   && token.selectors.length === 1
//       //   && token.selectors.includes('5a4fabb9') // inStart
//       // ) {
//       //   if (isLocal) { console.log(msg, 'Token\' only selector is 5a4fabb9.') }; continue
//       // }

//       // if (
//       //   !skipChecks
//       //   && token.selectors.includes('3ad66a9b') // ERC20Coefficient
//       // ) {
//       //   if (isLocal) { console.log(msg, 'Token\' contains selector 3ad66a9b.') }; continue
//       // }

//       // if (
//       //   !skipChecks
//       //   && token.selectors.includes('01339c21') // launch()
//       // ) {
//       //   if (isLocal) { console.log(msg, 'Token\' only selector is 01339c21.') }; continue
//       // }

//       // if (
//       //   !skipChecks
//       //   && token.ownerRenounced === null
//       //   && token.protocols?.length === 1
//       //   && token.protocols?.includes(DexProtocols.uniswapv3)
//       // ) {
//       //   if (isLocal) {console.log(msg, 'token.ownerRenounced === null and protocol is v3.')}; continue
//       // }

//       const growth = 0 // tokens[address].growth
//       const holders = <string[]>[] //tokens[address].holders
//       const swapCount = 12 // tokens[address].swapCount
//       const holderCount = 50 // tokens[address].holderCount
//       const buyCountPct = 85 // tokens[address].buyCountPct
//       // const recentSwapCount = tokens[address].recentSwapCount
//       const holderCountRatio = 1 // tokens[address].holderCountRatio
      
//       const buySellVolumeRatio = 2 // tokens[address].buySellVolumeRatio

//       // const tokenAgeInMinutes = (ceiling - token.createdAt) / 60

//       let swapsPerMinute = 3 // swapCount / 30
//       // if (tokenAgeInMinutes < 30) {
//       //   swapsPerMinute = swapCount / tokenAgeInMinutes
//       // }

//       // let recentSwapsPerMinute = recentSwapCount / recentSpreadInMins
//       // if (tokenAgeInMinutes < recentSpreadInMins) {
//       //   recentSwapsPerMinute = recentSwapCount / tokenAgeInMinutes
//       // }

//       if (!skipChecks && swapCount < limits.swapCountMin) {
//         if (isLocal) {console.log(msg, 'swapCount < limits.swapCountMin')}; continue
//       }

//       // if (!skipChecks && swapCount > limits.swapCountMax) {
//       //   if (isLocal) {console.log(msg, 'swapCount > limits.swapCountMax')}; continue
//       // }

//       // if (!skipChecks && swapsPerMinute < limits.swapsPerMinuteMin) {
//       //   if (isLocal) {console.log(msg, 'swapsPerMinute < limits.swapsPerMinuteMin')}; continue
//       // }

//       // if (!skipChecks && recentSwapsPerMinute < limits.swapsPerMinuteMin) {
//       //   if (isLocal) {console.log(msg, 'recentSwapsPerMinute < limits.swapsPerMinuteMin')}; continue
//       // }

//       // if (!skipChecks && holderCount && holderCount < limits.holderCountMin) {
//       //   if (isLocal) {console.log(msg, 'holderCount < limits.holderCountMin')}; continue
//       // }

//       // if (!skipChecks && buySellVolumeRatio.lt(BigNumber(limits.buySellVolumeRatioMin))) {
//       //   if (isLocal) {console.log(msg, 'buySellVolumeRatio.lt(BigNumber(limits.buySellVolumeRatioMin))')}; continue
//       // }

//       // if (!skipChecks && buySellVolumeRatio.gt(BigNumber(limits.buySellVolumeRatioMax))) {
//       //   if (isLocal) {console.log(msg, 'buySellVolumeRatio.gt(BigNumber(limits.buySellVolumeRatioMax))')}; continue
//       // }

//       // const buyVolumesInUsd = tokens[address].buyVolumesInUsd
//       // const sellVolumesInUsd = tokens[address].sellVolumesInUsd
//       // const volumesInUsd = buyVolumesInUsd.concat(sellVolumesInUsd)

//       // let buyVolumesInUsdStat: Stat | undefined
//       // if (buyVolumesInUsd.length) {
//       //   buyVolumesInUsdStat = new Stat(buyVolumesInUsd)
//       // }

//       // let sellVolumesInUsdStat: Stat | undefined
//       // if (sellVolumesInUsd.length) {
//       //   sellVolumesInUsdStat = new Stat(sellVolumesInUsd)
//       // }

//       // let volumesInUsdStat: Stat | undefined
//       // if (volumesInUsd.length) {
//       //   volumesInUsdStat = new Stat(volumesInUsd)
//       // }

//       let data: ExecuteBuyParams["data"] = {
//         growth: growth,
//         holders: holders,
//         swapCount: swapCount,
//         holderCount: holderCount,
//         swapsPerMinute: swapsPerMinute,
//         holderCountRatio: holderCountRatio,
//         buyCountPct: buyCountPct,
//         buySellVolumeRatio: Number(buySellVolumeRatio.toFixed())
//       }

//       // if (buyVolumesInUsdStat) {
//         // let median = buyVolumesInUsdStat.median
//         // data.buyVolumeInUsdMedian = median
//         // data.buyVolumeInUsdMean = buyVolumesInUsdStat.mean
//         // data.buyVolumeInUsdIqr = buyVolumesInUsdStat.iqr

//         // if (!skipChecks && median !== null && median < limits.buyVolumeInUsdMedianMin) {
//         //   if (isLocal) {console.log(msg, 'buyMedian < limits.buyVolumeInUsdMedianMin')}; continue
//         // }
//       // }

//       // if (sellVolumesInUsdStat) {
//       //   data.sellVolumeInUsdMedian = sellVolumesInUsdStat.median
//       //   data.sellVolumeInUsdMean = sellVolumesInUsdStat.mean
//       //   data.sellVolumeInUsdIqr = sellVolumesInUsdStat.iqr
//       // }

//       // if (volumesInUsdStat) {
//       //   data.volumeInUsdMedian = volumesInUsdStat.median
//       //   data.volumeInUsdMean = volumesInUsdStat.mean
//       //   data.volumeInUsdIqr = volumesInUsdStat.iqr
//       // }

//       swapsToExecute.push({
//         data: data,
//         multiple: 1,
//         limits: limits,
//         tokenIn: tokenIn,
//         tokenOut: token,
//         tryCount: tryCount,
//         skipChecks: skipChecks,
//         selectorData: selectorData,
//         baseTokenPrice: BigInt(baseTokenPrice),
//         // baseTokenPriceChange: baseTokenPriceChange,
//         portfolioAddress: portfolio.wallet
//       })
//     }

//     swapsToExecuteCount = swapsToExecute.length

//     for (const swapToExecute of swapsToExecute) {
//       buyPromises.push(
//         executeBuy(swapToExecute)
//       )
//     }

//     await Promise.all(buyPromises)
//   } catch(err: any) {
//     Logger.err({ error: err, report: true })
//   } finally {
//     if (fromServerless) {
//       mongoose.disconnect()
//     }

//     const scanEnd = performance.now()
//     execTime = ((scanEnd - scanStart) / 1000).toFixed(2)

//     await Check.create({
//       type: CheckTypes.scanBuy,
//       execTime, tokenCount, portfolioBalance
//     })

//     // if (randomLog()) {
//     //   console.log(
//     //     'exec:', execTime, 's', '/',
//     //     'tokens:', tokenCount, '/',
//     //     'swapsToExec:', swapsToExecuteCount
//     //   )
//     // }
    
//   }
// }