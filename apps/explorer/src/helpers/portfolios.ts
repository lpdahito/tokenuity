import { ethers } from 'ethers'

import { BigNumber } from 'bignumber.js'

import { contracts } from '../contracts/contracts.js'
import * as models from '../models/models.js'

import isLocal from '../config/isLocal.js'

import { Logger } from '../config/logger.js'
import { providers, wallets } from '../config/provider.js'

import addresses from '../config/addresses.js'

const {
  BuyModel: Buy,
  SellModel: Sell,
  HoldingModel: Holding,
  PortfolioModel: Portfolio,
  TokenModel: Token,
} = models

import tradingParams from '../config/tradingParams.js'

import type { HydratedDocument } from 'mongoose'
import type { EventToken, ExecuteSellParams, ExecuteSwapParams, IHolding, IPortfolio, IToken, LimitsForSwaps, SwapMovementForToken } from '../types.js'

interface Call3 {
  target: string,
  allowFailure: boolean,
  callData: string
}

interface Result {
  success: boolean,
  returnData: string
}

const multicall3Contract = new ethers.Contract(
  addresses.multicall3, contracts.multicall3.abi, wallets[0]
)

export const findOrCreatePortfolio = async (
  walletAddress: string,
  fetchBalance = true
): Promise<HydratedDocument<IPortfolio> | null> => {
  if (walletAddress === '') return null

  let portfolio: HydratedDocument<IPortfolio> | null = null

  try {
    portfolio = await Portfolio.findOne({ wallet: walletAddress })

    if (!portfolio) {
      const now = Math.floor(Date.now() / 1000)

      let balance = 0n
      if (fetchBalance) {
        balance = await providers[0].getBalance(walletAddress)
      }

      portfolio = new Portfolio({
        wallet: walletAddress,
        balance: balance.toString(),
        createdAt: now,
        updatedAt: now,
      })

      await portfolio.save()      
    }

    return portfolio
  } catch (err: any) {
    Logger.err({ error: err, report: true })
    return null
  }
}

export const syncPortfolioHoldings = async (
  portfolio: HydratedDocument<IPortfolio>
): Promise<void> => {
  let calls: Array<Call3> = []

  try {
    let ethBalance = await providers[0].getBalance(portfolio.wallet)

    portfolio.balance = ethBalance.toString()
    portfolio.updatedAt = Math.floor(Date.now() / 1000)
    await portfolio.save()

    let holdings = await Holding.find({})

    if (!holdings.length) return console.log('No holdings found')

    for (let holding of holdings) {
      const tokenContract = new ethers.Contract(
        holding.address, contracts.erc20.abi, wallets[0]
      )

      const calldata = tokenContract.interface.encodeFunctionData(
        'balanceOf', [addresses.tokenuity]
      )

      calls.push({
        target: holding.address,
        allowFailure: true,
        callData: calldata
      })
    }
  
    const results: Array<Result> = await multicall3Contract.aggregate3.staticCall(calls)

    for (let i = 0; i < holdings.length; i++) {
      if (!results[i].success) continue

      let holding = holdings[i]

       const tokenContract = new ethers.Contract(
        holding.address, contracts.erc20.abi, wallets[0]
      )

      const amount = tokenContract.interface.decodeFunctionResult('balanceOf', results[i].returnData)[0]

      holding.amount = amount.toString()
      holding.updatedAt = Math.floor(Date.now() / 1000)
      await holding.save()
    }
  } catch (err: any) {
    Logger.err({ error: err, report: true })
  }
}

export const findOrCreateFakePortfolio = async (
  wallet: number
): Promise<HydratedDocument<IPortfolio> | null> => {
  let portfolio: HydratedDocument<IPortfolio> | null = null

  try {
    portfolio = await Portfolio.findOne({
      wallet: wallet.toString()
    })

    if (!portfolio) {
      const now = Math.floor(Date.now() / 1000)

      portfolio = new Portfolio({
        wallet: wallet.toString(),
        balance: '10000000000000000000',
        createdAt: now,
        updatedAt: now,
      })

      await portfolio.save()
    }
  } catch (err: any) {
    Logger.err({ error: err, report: true })
  } finally {
    return portfolio
  }
}

export const updatePortfolio = async (
  portfolio: HydratedDocument<IPortfolio>,
  tokenIn: IToken, // token sold
  tokenOut: IToken, // token bought
  amountIn: bigint,
  amountOut: bigint,
): Promise<{ holding: HydratedDocument<IHolding> | null }> => {
  let holding: HydratedDocument<IHolding> | null = null

  try {
    const obj = tokenIn.address === addresses.tokens.base ?
      await updatePortfolioForBuy(
        portfolio, tokenOut, amountIn, amountOut
      ) :
      await updatePortfolioForSell(
        portfolio, tokenIn, amountIn, amountOut
      )

    holding = obj.holding
  } catch (err: any) {
    Logger.err({ error: err, report: true })
  } finally {
    return { holding }
  }
}

const updatePortfolioForBuy = async (
  portfolio: HydratedDocument<IPortfolio>,
  tokenOut: IToken, // token bought
  amountIn: bigint,
  amountOut: bigint,
): Promise<{ holding: HydratedDocument<IHolding> | null }> => {
  let holdingOut: HydratedDocument<IHolding> | null = null

  try {
    holdingOut = await Holding.findOne({
      address: tokenOut.address
    })

    if (!holdingOut) {
      holdingOut = new Holding({
        address: tokenOut.address,
        amount: '0',
        avgPriceInBase: '0',
        oldAvgPriceInBase: null
      })
    } else {
      holdingOut.oldAvgPriceInBase = holdingOut.avgPriceInBase
      
      if (Number(holdingOut.amount) === 0) {
        holdingOut.avgPriceInBase = '0'
      }
    }

    if (isLocal) {
      console.log('Portfolio holdings (before trade):')
      console.log('ETH:', portfolio.balance)
      console.log('holdingOut:', holdingOut)
      console.log('------------------')
    }

    /** Selling Start */
    portfolio.balance = (BigInt(portfolio.balance) - amountIn).toString()
    /** Selling End */

    let oldAmount = BigInt(holdingOut.amount) // 100
    let newAmount = amountOut // 10

    let oldAvg = BigInt(holdingOut.avgPriceInBase) // 1.5
    let newAvg = amountIn * BigInt(10 ** tokenOut.decimals) / newAmount // 2.5

    let amountWithOldAvg = oldAvg * oldAmount // 150
    let amountWithNewAvg = newAvg * newAmount // 25
    let totalAmountWithAverages = amountWithOldAvg + amountWithNewAvg // 175

    let avgPrice = totalAmountWithAverages / (oldAmount + newAmount) // 1.59

    holdingOut.avgPriceInBase = avgPrice.toString()

    /** Buying Start */
    holdingOut.amount = (BigInt(holdingOut.amount) + amountOut).toString()
    /** Buying End */

    let updatedAt = Math.floor(Date.now() / 1000)

    portfolio.updatedAt = updatedAt
    await portfolio.save()

    holdingOut.updatedAt = updatedAt
    holdingOut.tryCount++
    await holdingOut.save()

    if (isLocal) {
      console.log('Portfolio holdings (after trade):')
      console.log('ETH:', portfolio.balance)
      console.log('holdingOut:', holdingOut)
    }
  } catch (err: any) {
    Logger.err({ error: err, report: true })
  } finally {
    return {
      holding: holdingOut
    }
  }
}

const updatePortfolioForSell = async (
  portfolio: HydratedDocument<IPortfolio>,
  tokenIn: IToken, // token sold
  amountIn: bigint,
  amountOut: bigint,
): Promise<{ holding: HydratedDocument<IHolding> | null }> => {
  let holdingIn: HydratedDocument<IHolding> | null = null

  try {
    holdingIn = await Holding.findOne({
      address: tokenIn.address
    })
    if (!holdingIn) {
      console.log('holdingIn not found')
      return { holding: holdingIn }
    }

    if (isLocal) {
      console.log('Portfolio holdings (before trade):')
      console.log('holdingIn:', holdingIn)
      console.log('ETH:', portfolio.balance)
      console.log('------------------')
    }

    /** Selling Start */
    const amount = (BigInt(holdingIn.amount) - amountIn)
    holdingIn.amount = (amount < 0n) ? '0' : amount.toString()
    /** Selling End */

    /** Buying Start */
    portfolio.balance = (BigInt(portfolio.balance) + amountOut).toString()
    /** Buying End */

    let updatedAt = Math.floor(Date.now() / 1000)

    holdingIn.updatedAt = updatedAt
    await holdingIn.save()

    portfolio.updatedAt = updatedAt
    await portfolio.save()

    if (isLocal) {
      console.log('Portfolio holdings (after trade):')
      console.log('holdingIn:', holdingIn)
      console.log('ETH:', portfolio.balance)
    }    
  } catch (err: any) {
    Logger.err({ error: err, report: true })
  } finally {
    return {
      holding: holdingIn
    }
  }
}

// const syncHolding = async (
//   holding: HydratedDocument<IHolding>
// ): Promise<void> => {
//   let contract = new ethers.Contract(
//     holding.address, contracts.erc20.abi, providers[0]
//   )

//   let balance = await contract.balanceOf(holding.wallet)

//   holding.amount = balance.toString()
//   holding.updatedAt = Math.floor(Date.now() / 1000)
//   await holding.save()
// }

// export const getPortfolioNav = async (
// ) => {
//   try {
//     const holdings = await Holding.find({}).sort({ createdAt: -1 }).lean()
//     if (!holdings.length) { return }

//     const addresses = holdings.map(h => h.address)

//     const buys = await Buy.find({
//       status: 'success', tokenAddress: { $in: addresses }
//     }).sort({createdAt: -1}).limit(addresses.length).lean()

//     const sells = await Sell.find({
//       status: { $in: ['failed', 'success', 'tracked', 'pending'] }, tokenAddress: { $in: addresses }
//     }).sort({createdAt: -1}).limit(addresses.length).lean()

//     buildPositionsArray(
//       holdings, tokens, buys, sells
//     )

    
//   } catch (err: any) {
//     Logger.err({ error: err, report: true })
//   }
// }

// export const buildPositionsArray = (
//   holdings: Array<IHolding>,
//   tokens: Array<IToken>,
//   buys: Array<IBuy>,
//   sells: Array<ISell>,
//   // pools: Array<IPool>,
//   // selectors: Array<ISelector>,
//   // baseTokenPrice: string
// ): Array<Position> => {
//   const ceiling = Math.floor(Date.now() / 1000)
//   const rugPullInterval = 60 * 3 // 3 minutes.

//   let positionsArray: Array<Position> = []

//   for (let holding of holdings) {
//     let token = tokens.find((t) => t.address === holding.address)
//     if (!token) { continue }

//     let _buys = buys.filter((buy) => {
//       return buy.tokenAddress === holding.address
//     })
//     if (!_buys.length) { continue }

//     let _sells = sells.filter((sell) => {
//       return sell.tokenAddress === holding.address
//     })

//     const buy = _buys[0]; const sell = _sells[0]

//     const position = <Position>{
//       status: 'success',
//       multiple: 0,
//       lowestMultiple: 0,
//       highestMultiple: 0,

//       swapCount: buy.swapCount,
//       tokenAgeOnTx: buy.tokenAgeOnTx,
//       swapsPerMinute: buy.swapsPerMinute
//     }

//     const tokenActive = !(token.lastSwap < (ceiling - rugPullInterval))

//     switch(true) {
//       // Siphoned... could not exit
//       case (sell.siphoned):
//         position.status = 'siphoned'; break;

//       // Success... closed position
//       case (sell.goodMultiple && sell.goodMultiple > 0):
//         position.multiple = sell.goodMultiple
//         position.highestMultiple = sell.highestMultiple
//         position.lowestMultiple = sell.lowestMultiple

//         break;

//       // Rug pulled... could not exit
//       case (!tokenActive):
//         position.status = 'rugPulled';

//         if (
//           sell
//           && sell.prevHighestMultiple
//           && sell.prevHighestMultiple < sell.highestMultiple
//           && sell.prevHighestMultiple < 75 // Remove false `highestMultiple`s
//         ) {
//           sell.highestMultiple = sell.prevHighestMultiple
//         }

//         position.lowestMultiple = sell.lowestMultiple
        
//         break;

//       // Still invested... skip
//       default:
//         continue;
//     }

//     positionsArray.push(position)
//   }

//   return positionsArray
// }