// import crypto from 'crypto'

// import { ethers } from 'ethers'

// import BigNumber from 'bignumber.js'

// import isLocal from './../config/isLocal.js'

// import { chain } from './../config/chain.js'
// import explorer from './../config/explorer.js'
// import { Logger } from './../config/logger.js'
// import addresses from './../config/addresses.js'

// import { wallets } from './../config/provider.js'

// import { contracts } from './../contracts/contracts.js'
// import * as models from './../models/models.js'

// import { Swap } from './../helpers/swaps.js'
// import { lockedPercentage } from './../helpers/pools.js'
// import { findOrCreateSell } from './../helpers/sells.js'
// import { updatePortfolio } from './../helpers/portfolios.js'
// import { sendDiscordMessage } from './../helpers/discord.js'
// import { getDexscreenerData } from './../helpers/dexscreener'
// import { findOrCreateCreator } from './../helpers/creators.js'
// import { saveSnippetsForToken } from './../helpers/snippets.js'
// // import { saveSelectorsForToken } from './../helpers/selectors.js'
// import { getPoolLiquiditiesForToken, isOwnerRenounced } from './../helpers/tokens.js'

// const {
//   SellModel: Sell,
//   PoolModel: Pool,
//   HoldingModel: Holding,
//   PortfolioModel: Portfolio,
// } = models

// import type { HydratedDocument } from 'mongoose'
// import { DexProtocols, ExecuteSellParams, IPool, ISell, ISnippet, Routers, SwapResponse, Triggers } from '../types.js'

// let chainColor = '🔵'
// let baseCoin = 'ETH'

// switch (chain.name) {
//   case 'base':
//   chainColor = '🔵'; baseCoin = 'ETH'; break;

//   case 'bsc':
//   chainColor = '🟡'; baseCoin = 'BNB'; break;
// }

// export default async (
//   params: ExecuteSellParams
// ): Promise<void> => {
//   if (isLocal) return

//   let start = new Date()
//   let ceiling = Math.floor(Number(start) / 1000)

//   let token = params.token
//   if (!token.lastPriceInBase) { return }

//   let save = false
//   let track = false

//   // const RISK_SCORE_MAX = 5
//   // let riskScore = 5

//   let baseTokenPrice = params.baseTokenPrice
  
//   let baseToken = params.baseToken
//   let tryCount = params.tryCount
//   let portfolioAddress = params.portfolioAddress
//   let limits = params.limits

//   let buy = params.buy
//   let holding = params.holding
//   let timeMax = limits.timeMax

//   const tokenAge = ceiling - token.createdAt
//   const holdingAge = ceiling - holding.createdAt

//   let router = Routers.default

//   let msg = 'initializing'
//   let botMsg = `Couldn\'t sell ${token.name} (${token.symbol})`

//   const fake = portfolioAddress !== process.env.WALLET_ADDRESS!
//   const dir = (fake ? 'fake_trxn' : 'trxn')
//   const path = `${token.symbol} -> ${baseToken.symbol} `

//   const MAX_ATTEMPTS = 40

//   let sell: HydratedDocument<ISell> | null = null
//   let randomString = crypto.randomBytes(16).toString('hex')

//   let sellAll = true
//   const sellPercentage = 70

//   let amountIn = 0n
//   let amountOut = 0n
//   let portfolioBalance = 0n

//   let siphoned = false

//   let pool: HydratedDocument<IPool> | undefined = undefined
//   let liquidityInBase: bigint | undefined = undefined

//   const tokenuityContract = new ethers.Contract(
//     addresses.tokenuity, contracts.tokenuity.abi, wallets[0]
//   )

//   const tokenContract = new ethers.Contract(
//     token.address, contracts.erc20.abi, wallets[0]
//   )

//   let txResponse: SwapResponse | null = null

//   const avgPriceInBase = BigNumber(holding.avgPriceInBase)
  
//   const _multiple = BigNumber(token.lastPriceInBase).div(avgPriceInBase).toNumber() // ********* could be here **********
//   let multiple = parseFloat(_multiple.toFixed(2)) // ********* could be here **********

//   let snippets: Array<HydratedDocument<ISnippet>> = []

//   try {
//     sell = await findOrCreateSell(
//       portfolioAddress, token, tryCount, multiple, randomString
//     )

//     if (!sell) {
//       msg = 'Couldn\'t find or create sell'; return
//     }

//     if (sell.status === 'pending') {
//       if (sell.randomString !== randomString) {
//         if (sell.updatedAt < (ceiling - (60 * 3.5))) {
//           sell.randomString = randomString
//           sell.updatedAt = ceiling

//           await sell.save()
//         } else {
//           msg = 'Another sell is pending'; return
//         }        
//       }
//     }

//     if (multiple < sell.lowestMultiple) {
//       sell.lowestMultiple = multiple
//       sell.updatedAt = ceiling

//       await sell.save()
//     }

//     if (sell.highestMultiple < multiple) {
//       sell.prevHighestMultiple = sell.highestMultiple
//       sell.highestMultiple = multiple
      
//       sell.updatedAt = ceiling
      
//       await sell.save()
//     }

//     switch (true) {
//       case (multiple > 4):
//         if (buy.boughtAt && !sell.timeTo2x) {
//           sell.timeTo2x = ceiling - buy.boughtAt
//         }

//         if (buy.boughtAt && !sell.timeTo3x) {
//           sell.timeTo3x = ceiling - buy.boughtAt
//         }

//         if (buy.boughtAt && !sell.timeTo4x) {
//           sell.timeTo4x = ceiling - buy.boughtAt

//           await sell.save()
//         }

//         break;

//       case (multiple > 3):
//         if (buy.boughtAt && !sell.timeTo2x) {
//           sell.timeTo2x = ceiling - buy.boughtAt
//         }

//         if (buy.boughtAt && !sell.timeTo3x) {
//           sell.timeTo3x = ceiling - buy.boughtAt

//           await sell.save()
//         }
        
//         break;

//       case (multiple > 2):
//         if (buy.boughtAt && !sell.timeTo2x) {
//           sell.timeTo2x = ceiling - buy.boughtAt

//           await sell.save()
//         }
        
//         break;
//     }

//     if (!sell.remaining && sell.status === 'success') {
//       msg = 'Sell is already successful'; return
//     }
    
//     if (sell.status === 'failed') {
//       if (sell.attempts >= MAX_ATTEMPTS) {
//         msg = 'sell.attempts >= MAX_ATTEMPTS'; return
//       }
//     }

//     const prevStatus = sell.status

//     if (sell.status !== 'pending') {
//       sell.status = 'pending'
//       sell.multiple = multiple
//       sell.updatedAt = ceiling
//       sell.randomString = randomString

//       await sell.save()
//     }

//     const dexscreenerData = await getDexscreenerData(
//       token.address
//     )

//     let dexscreener = false

//     if (
//       dexscreenerData.boosts
//       || dexscreenerData.website
//       || dexscreenerData.twitter
//       || dexscreenerData.telegram
//       || dexscreenerData.tiktok
//       || dexscreenerData.discord
//       || dexscreenerData.github
//     ) {
//       dexscreener = true
//     }

//     let stopLoss = limits.stopLoss
//     // if (holdingAge < (60 * 15)) {
//     //   stopLoss = (limits.stopLoss * 0.80)
//     // }

//     // Initializing values
//     sell.trigger = Triggers.takeProfit
//     let takeProfit = limits.takeProfit

//     takeProfit = (takeProfit * 0.90)

//     if (dexscreener) {
//       timeMax *= 1.2
//       // stopLoss = (limits.stopLoss * 0.80)
//     }

//     switch (true) {
//       case (holdingAge >= timeMax):
//         sell.trigger = Triggers.time; break;

//       case (multiple <= stopLoss):
//         if (dexscreener && holdingAge < (60 * 15)) {
//           sell.trigger = null
//         } else {
//           sell.trigger = Triggers.stopLoss
//         }
        
//         break;

//       case (multiple >= takeProfit):
//         sell.trigger = Triggers.takeProfit; break;

//       default:
//         sell.trigger = null; break;
//     }   

//     if (sell.trigger === Triggers.takeProfit) {
//       if (sell.goodMultiple) {
//         const prevMultiple = (sell.goodMultiple / (sellPercentage / 100))

//         if (Math.floor(multiple) <= Math.ceil(prevMultiple)) {
//           sell.attempts = 1
//           sell.updatedAt = ceiling
//           sell.status = prevStatus
//           sell.messages.unshift('Already sold at that level')

//           await sell.save(); return
//         }
//       }
//     }

//     /** Make sure to save tx */
//     save = true
//     /** Make sure to save tx */

//     let portfolio = await Portfolio.findOne({
//       wallet: portfolioAddress
//     })

//     if (!portfolio) {
//       msg = 'Portfolio not found'; return
//     }

//     portfolioBalance = BigInt(portfolio.balance)

//     if (sell.trigger === null && holdingAge < timeMax) {
//       track = true; return
//     }

//     const pools = await Pool.find({
//       $or:[
//         { token0: token.address },
//         { token1: token.address }
//       ]
//     }).sort({ fee: 1 })
  
//     if (!pools.length) {
//       msg = 'Couldn\'t find any pools for transaction'; return
//     }
  
//     let baseTokenPools = pools.filter((p) => { 
//       return (
//         p.token0 === addresses.tokens.base
//         || p.token1 === addresses.tokens.base
//       )
//     })

//     if (!baseTokenPools.length) {
//       msg = 'No pools with direct baseToken/Token pair'; return
//     }

//     // if (buy && limits.protocols && !limits.protocols.includes(pool.protocol)) {
//     //   msg = 'Protocol is not allowed'; return
//     // }

//     let holdingIn = await Holding.findOne({
//       wallet: portfolioAddress, address: token.address
//     })

//     if (!holdingIn?.amount || Number(holdingIn.amount) === 0) {
//       msg = 'tokenIn balance is 0'; return
//     }

//     let tokenBalance = BigInt(holdingIn.amount)

//     if (!fake) {
//       // Get real token balance from blockchain
//       tokenBalance = await tokenContract.balanceOf(
//         addresses.tokenuity
//       )

//       const tokenBalanceFromContract = await tokenuityContract.balanceFor(
//         token.address
//       )

//       if (tokenBalance < tokenBalanceFromContract) {
//         siphoned = true
//         holdingIn.amount = tokenBalance.toString()

//         await holdingIn.save()

//         // await saveSelectorsForToken(token, false)
//         await saveSnippetsForToken(
//           token.address, buy.amountInUsd, false
//         )
//       }
//     }

//     if (tokenBalance === 0n) {
//       msg = 'Portfolio\'s real balance is 0.'

//       if (siphoned) {
//         sell.attempts = MAX_ATTEMPTS - 1

//         msg += ' Token was siphoned.'

//         if (token.compliant) {
//           botMsg = '🚨 ' + botMsg + ' 🚨' + '\n'
//         }

//         sendDiscordMessage(
//           chainColor + ' ' + botMsg + ': ' + msg
//         )
//       }

//       return
//     }

//     // sell all but 1
//     amountIn = tokenBalance - 1n

//     if (amountIn <= 0n) {
//       msg = 'amountIn is 0'

//       // await saveSelectorsForToken(token, false)
//       sell.attempts = MAX_ATTEMPTS - 1

//       sendDiscordMessage(
//         chainColor + ' ' + botMsg + ': ' + msg
//       )

//       return
//     }

//     if (
//       buy
//       // && !buy.isTest
//       && tryCount < 2
//       && !sell.goodMultiple
//       && sell.trigger === Triggers.takeProfit
//     ) {
//       switch (true) {
//         case (Math.floor(multiple) < 4):
//           sellAll = false
//           amountIn = (((amountIn * BigInt(10000)) / BigInt(100)) * BigInt(sellPercentage)) / BigInt(10000)

//           break;
//       }
//     }

//     if (amountIn <= 0n) {
//       msg = 'amountIn is 0'; return
//     }

//     const liquidities = await getPoolLiquiditiesForToken(
//       token, baseTokenPools, baseTokenPrice
//     )

//     liquidityInBase = liquidities.total
//     pool = liquidities.pools[0].pool

//     if (pool.protocol === DexProtocols.pancakeswapv3) {
//       msg = 'pancakeswapv3 not supported'; return
//     }

//     if (liquidityInBase === 0n) {
//       msg = 'Liquidity is 0'; return
//     }

//     if (
//       pool.protocol === DexProtocols.uniswapv2
//       || pool.protocol === DexProtocols.pancakeswapv2
//     ) {
//       if (pool.lockedPercentage < limits.lockedPercentageMin) {
//         let percentage = await lockedPercentage(pool.address)

//         if (pool.lockedPercentage !== percentage) {
//           pool.lockedPercentage = percentage; await pool.save();
//         }
//       }
//     }

//     const swapParams = {
//       token: token.address,
//       amountIn: amountIn,
//       buy: false,
//       protocol: pool.protocol,
//       fee: pool.fee,
//       signer: wallets[0],
//       router: router
//     }

//     const swap = new Swap(swapParams)
//     amountOut = await swap.quote()
//     const calldata = await swap.encode()

//     if (!amountOut || amountOut === 0n) {
//       msg = 'amountOut is 0'; return
//     }

//     if (!calldata || calldata === '') {
//       msg = 'calldata is null'; return
//     }

//     /***************************/
//     /** Real transaction starts */
//     if (!fake) {
//       let estimateGas = false
//       if (sell.txAttempts > 0) estimateGas = true

//       txResponse = await swap.execute({
//         estimateGas: estimateGas
//       })
//       sell.txAttempts++

//       if (!txResponse.success) {
//         // await saveSelectorsForToken(token, false)
//         await saveSnippetsForToken(
//           token.address, buy.amountInUsd, false
//         )
        
//         if (sell.txAttempts === 1) {
//           const lastSell = await Sell.findOne({
//             wallet: portfolio.wallet,
//             tokenAddress: { $ne: token.address },
//             status: { $in: [ 'success', 'failed' ] }
//           }).sort({ createdAt: -1 })

//           if (lastSell && lastSell.status === 'failed') {
//             botMsg = '*** Trading halted *** ' + botMsg

//             portfolio.auto = false
//             await portfolio.save()
//           }

//           // const lastFailedSell = await Sell.findOne({
//           //   wallet: portfolio.wallet,
//           //   tokenAddress: { $ne: token.address },
//           //   status: 'failed'
//           // }).sort({ createdAt: -1 })

//           // if (lastFailedSell) {
//           //   let trxnSelectors: Array<string> = []
            
//           //   if (sell.token.selectors) {
//           //     trxnSelectors = sell.token.selectors
//           //   }

//           //   let lastFailedTrxnSelectors: Array<string> = []
//           //   if (lastFailedSell.token.selectors) {
//           //     lastFailedTrxnSelectors = lastFailedSell.token.selectors
//           //   }

//           //   let commonSelectors = trxnSelectors.filter(selector => lastFailedTrxnSelectors.includes(selector))

//           //   if (commonSelectors.length) {
//           //     botMsg = '*** Trading halted *** ' + botMsg + ': Check selectors'

//           //     portfolio.auto = false
//           //     await portfolio.save()
//           //   }
//           // }

//           sendDiscordMessage(
//             chainColor + ' ' + botMsg
//           )
//         }

//         throw new Error('Sell failed')
//       }
//     }
//     /** Real transaction ends */
//     /***************************/

//     await updatePortfolio(
//       portfolio, token, baseToken, amountIn, amountOut
//     )
//     // portfolio = await Portfolio.findOne({ wallet: portfolio.wallet }) // reload portfolio because it was saved in updatePortfolio call: "__v" +1...

//     const usdAmount = (BigNumber(amountOut.toString()).div(baseTokenPrice.toString())).toFixed(2)
//     sell.amountInUsd += Number(usdAmount)
    
//     sell.goodMultiple = (sell.amountInUsd / buy.amountInUsd)

//     if (siphoned) {
//       // await saveSelectorsForToken(token, false)
//       await saveSnippetsForToken(
//         token.address, buy.amountInUsd, false
//       )
//     } else if (sell.goodMultiple >= 1) {
//       // await saveSelectorsForToken(token, true)
//       await saveSnippetsForToken(
//         token.address, buy.amountInUsd, true
//       )
//     }

//     sell.status = 'success'
//     sell.multiple = multiple
//     sell.remaining = !sellAll

//     if (sell.soldAt === null) { sell.soldAt = ceiling }
//     if (sell.trigger === null) { sell.trigger = Triggers.time }

//     let protocol = 'uniswapv2'
//     switch (pool.protocol) {
//       case DexProtocols.pancakeswapv2:
//         protocol = 'pancakeswapv2'
//         break;

//       case DexProtocols.uniswapv3:
//         protocol = 'uniswapv3'
//         break;
//     }

//     const _trigger = (sell.trigger === Triggers.time) ? 'time' : 'price'
      
//     msg = `Sold ${token.symbol} at *${multiple}x* ($${usdAmount}): ${amountIn.toString()} (${token.symbol}) >> ${amountOut.toString()} (${baseCoin})`
//     botMsg = `Sold $${usdAmount} worth of ${token.symbol} at *${multiple}x*\n`
//     botMsg += `Try count: ${tryCount}, Attempt: ${sell.attempts + 1}, Trigger: ${_trigger}, Protocol: ${protocol}`

//     if (txResponse) {
//       botMsg += '\n--\n'
//       botMsg += `${explorer.url}tx/${txResponse.tx}`
//     }

//     if (!fake) {
//       sendDiscordMessage(
//         chainColor + ' ' + botMsg
//       )
//     }
//   } catch (err: any) {
//     if ('message' in err) { msg = err.message }
//     Logger.err({ error: err, report: true })
//   } finally {
//     if (sell && track) {
//       msg = 'Tracking multiples'

//       sell.status = 'tracked'
//       sell.updatedAt = ceiling

//       await sell.save()
//     } else if (sell && save) {
//       if (sell.status !== 'success') {
//         sell.status = 'failed'
//       }

//       if (pool) {
//         sell.protocol = pool.protocol
//         sell.lockedPercentage = pool.lockedPercentage
//       }

//       if (txResponse && txResponse.tx) {
//         sell.tx = txResponse.tx
//       }

//       if (siphoned) {
//         sell.siphoned = true
//       }

//       sell.attempts++
//       sell.messages.unshift(msg)
//       sell.tokenAgeOnTx = tokenAge
//       sell.amount = amountOut.toString()
//       sell.ownerRenounced = token.ownerRenounced
//       sell.updatedAt = Math.floor(Date.now() / 1000)
//       sell.baseTokenPrice = baseTokenPrice.toString()
      
//       await sell.save()
//     }

//     if (isLocal) { console.log(msg) }
//   }
// }

// const computeNewScore = (
//   currentScore: number,
//   decreaseFactor: number
// ): number => {
//   let newScore = currentScore - decreaseFactor

//   if (newScore < 1) { newScore = 1 }

//   return newScore
// }