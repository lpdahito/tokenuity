// import { performance } from 'perf_hooks'

// import * as mongoose from 'mongoose'
// import type { HydratedDocument } from 'mongoose'

// import { databaseUrl } from '../../config/databaseUrl.js'
// import { Logger, randomLog } from '../../config/logger.js'
// import fromServerless from '../../config/fromServerless.js'

// import { findOrCreateTradingParams } from '../../helpers/tradingParams.js'
// import { findOrCreateFakePortfolio, findOrCreatePortfolio } from '../../helpers/portfolios.js'

// import executeSell from '../../lambdas/executeSell.js'

// import * as models from '../../models/models.js'

// import {
//   ExecuteSellParams, IPortfolio, IToken, Triggers,
//   BuysFromScan, HoldingsFromScan
// } from '../../types.js'

// const {
//   BuyModel: Buy,
//   PoolModel: Pool,
//   PriceModel: Price,
//   TokenModel: Token,
//   HoldingModel: Holding
// } = models

// export default async (
//   tokenOut: HydratedDocument<IToken>
// ): Promise<void> => {
//   const scanStart = performance.now()

//   let execTime = '0'

//   let buys: BuysFromScan = {}
//   let holdings: HoldingsFromScan = {}

//   const PORTFOLIO_ADDRESS = process.env.PORTFOLIO_ADDRESS
//   if (!PORTFOLIO_ADDRESS) {
//     return console.log('Could not find PORTFOLIO_ADDRESS')
//   }

//   let sellPromises: Array<Promise<void>> = []
//   let swapsToExecute: Array<ExecuteSellParams> = []

//   const interval = 75 // 75 seconds.
//   const ceiling = Math.floor(Date.now() / 1000)

//   try {
//     if (fromServerless) {
//       mongoose.set('strictQuery', false)
//       await mongoose.connect(databaseUrl)
//     }

//     let price = await Price.findOne({}).sort({ createdAt: -1 })
//     if (!price || BigInt(price.baseToken) === 0n) { return console.log('Could not get baseToken price...') }

//     let portfolio: HydratedDocument<IPortfolio> | null = null
//     if (PORTFOLIO_ADDRESS === process.env.WALLET_ADDRESS) {
//       portfolio = await findOrCreatePortfolio(PORTFOLIO_ADDRESS)
//     } else {
//       portfolio = await findOrCreateFakePortfolio(Number(PORTFOLIO_ADDRESS))
//     }

//     if (!portfolio) return console.log('Could not find or create portfolio...')

//     let limits = await findOrCreateTradingParams()
//     if (!limits) { return }

//     const savedHoldings = await Holding.find({
//       wallet: portfolio.wallet 
//     }).lean()
//     if (!savedHoldings.length) { return }

//     for (const savedHolding of savedHoldings) {
//       const address = savedHolding.address

//       holdings[address] = {
//         wallet: savedHolding.wallet,
//         amount: savedHolding.amount,
//         tryCount: savedHolding.tryCount,
//         updatedAt: savedHolding.updatedAt,
//         createdAt: savedHolding.createdAt,
//         avgPriceInBase: savedHolding.avgPriceInBase,
//         oldAvgPriceInBase: savedHolding.oldAvgPriceInBase
//       }
//     }

//     const savedBuys = await Buy.find({
//       wallet: portfolio.wallet,
//       tokenAddress: { $in: Object.keys(holdings) }
//     }).sort({ createdAt: 1 }).lean()
//     if (!savedBuys.length) { return }

//     for (const savedBuy of savedBuys) {
//       const tokenAddress = savedBuy.tokenAddress

//       buys[tokenAddress] = {
//         wallet: savedBuy.wallet,
//         boughtAt: savedBuy.boughtAt,
//         createdAt: savedBuy.createdAt,
//         amountInUsd: savedBuy.amountInUsd || 0,
//         liquidityInUsd: savedBuy.liquidityInUsd || 0
//       }
//     }

//     const pools = await Pool.find({
//       $or:[
//         { token0: { $in: Object.keys(holdings) }},
//         { token1: { $in: Object.keys(holdings) }}
//       ],
//       lastSync: { $gte: ceiling - interval }
//     })

//     let tokenAddresses: string[] = []
//     for (const pool of pools) {
//       const quoteToken = pool.quoteToken()

//       if (!tokenAddresses.includes(quoteToken)) {
//         tokenAddresses.push(quoteToken)
//       }
//     }

//     const tokens = await Token.find({
//       address: { $in: [ tokenAddresses ] }
//     })

//     for (const token of tokens) {
//       const address = token.address

//       const holding = holdings[address]
//       if (!holding) continue

//       const buy = buys[address]
//       if (!buy) continue

//       swapsToExecute.push({
//         token: token,
//         limits: limits,
//         holding: holding,
//         baseToken: tokenOut,
//         buy: buys[token.address],
//         tryCount: holding.tryCount,
//         baseTokenPrice: BigInt(price.baseToken),
//         portfolioAddress: portfolio.wallet
//       })
//     }

//     for (const swapToExecute of swapsToExecute) {
//       sellPromises.push(
//         executeSell(swapToExecute)
//       )
//     }
//     await Promise.all(sellPromises)

//   } catch(err: any) {
//     Logger.err({ error: err, report: true })
//   } finally {
//     if (fromServerless) {
//       mongoose.disconnect()
//     }

//     const scanEnd = performance.now()
//     execTime = ((scanEnd - scanStart) / 1000).toFixed(2)

//     // if (randomLog()) {
//     //   console.log(
//     //     'exec:', execTime, 's', '/',
//     //     'swapsToExec:', swapsToExecute.length
//     //   )
//     // }
//   }
// }