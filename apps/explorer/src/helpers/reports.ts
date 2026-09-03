// docker run -it --rm --link mongo-server --env-file .env --env CHAIN_ID=8453 -v /Users/lpdahito/Projects/tokenuity/trends-explorer/dist:/app/dist explorer node -e 'require("./dist/playground/ai/createReport.js").default()'
// docker run -it --rm --link mongo-server --env-file .env --env CHAIN_ID=56 -v /Users/lpdahito/Projects/tokenuity/trends-explorer/dist:/app/dist explorer node -e 'require("./dist/playground/ai/createReport.js").default()'

import * as models from '@tokenuity/store'

import { databaseUrl } from './../config/databaseUrl'

import { findOrCreateTradingParams } from './../helpers/tradingParams.js'

import {
  IBuy, IHolding, IPool, ISell, IToken, ISelector,
} from './../types.js'

const {
  BuyModel: Buy,
  SellModel: Sell,
  PoolModel: Pool,
  TokenModel: Token,
  PriceModel: Price,
  HoldingModel: Holding,
  SelectorModel: Selector,
} = models

interface Position {
  status: string // success, siphoned, rugPulled
  multiple: number
  occurences: number,
  lowestMultiple: number
  highestMultiple: number

  swapCount: number,
  tokenAgeOnTx: number,
  swapsPerMinute: number
}

interface HoldingItem extends IHolding {
  txs: any[],
  token: IToken,
  growth: string,
  result: string,
  positive: number,
  multiple: number,
  siphoned: boolean,
  priceInUsd: string,
  rugPulled: boolean,
  balanceInUsd: string,
  goodMultiple: number,
  pools: Array<IPool> | null,
  selectors: Array<ISelector>
  // lowestMultiple: number,
  // highestMultiple: number,
  // lpRenounced: boolean | null
  // ownerRenounced: boolean | null
}

interface TradingReport {
  count: number,
  profit: string,
  bestProfit: string,
  bestMultiple: number,
  results: Array<{ count: number, multiple: number, profit: string }>
}

export default async (
): Promise<TradingReport> => {
  const ceiling = Math.floor(Date.now() / 1000)
  const oneWeekAgo = ceiling - (((60 * 60) * 24) * 7)

  let response: TradingReport = {
    count: 0, profit: '0.00', bestProfit: '0.00', bestMultiple: 0, results: []
  }

  const holdingCount = 50

  try {
    const walletAddress = process.env.WALLET_ADDRESS!
    if (!walletAddress) { throw new Error("Portfolio not found") }

    const tradingParams = await findOrCreateTradingParams()
    if (!tradingParams) { return response }

    const holdings = await Holding
      .find({ createdAt: { $gte: oneWeekAgo } })
      .sort({ createdAt: -1 })
      .skip(0)
      // .limit(holdingCount)
      .lean()

    const addresses = holdings.map(h => h.address)

    // console.log(addresses.length)

    const tokens = await Token.find({ address: { $in: addresses } })
      .limit(addresses.length)
      .lean()

    // const pools = await Pool.find({
    //   $or:[
    //     { token0: { $in: addresses } },
    //     { token1: { $in: addresses } }
    //   ]
    // }).limit(100).lean()

    const buys = await Buy.find({
      status: 'success', tokenAddress: { $in: addresses }
    }).sort({createdAt: -1}).limit(addresses.length).lean()

    const sells = await Sell.find({
      status: { $in: ['failed', 'success', 'tracked', 'pending'] }, tokenAddress: { $in: addresses }
    }).sort({createdAt: -1}).limit(addresses.length).lean()

    // let _selectors: string[] = []
    // for (const token of tokens) {
    //   for (let selector of token.selectors) {
    //     if (!_selectors.includes(selector)) {
    //       _selectors.push(selector)
    //     }
    //   }
    // }

    // const selectors = await Selector.find({
    //   body: { $in: _selectors }
    // }).lean()

    const lastPrice = await Price.findOne({}).sort({ createdAt: -1 }).lean()
    if (!lastPrice) { console.log('Couldn\'t find last price'); return response }

    const positions = buildPositionsArray(
      holdings, tokens, buys, sells, // lastPrice.baseToken
    )
    // console.log(positions)

    response = computePositions(positions)

    // const result = buildObject(
    //   holdingsArray
    // )

    // console.log(holdingsArray)
  } catch (err: any) {
    console.log(err)
  } finally {
    return response
  }
}

const computePositions = (
  positions: Array<Position>
): TradingReport => {
  const tradingAmount = 10

  const useStopLoss = true
  const stopLoss = 0.50 // 70%

  let profit = 0

  for (const position of positions) {
    profit -= tradingAmount
    profit += (tradingAmount * position.multiple)
  }

  let bestMultiple = 0
  let bestProfit = 0

  const multiples = [
    // 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7, 1.8, 1.9,
    2, 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7, 2.8, 2.9,
    3.0, 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 3.8, 3.9,
    4.0, 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7, 4.8, 4.9,
    5.0, 5.5, 6, 6.5, 7, 8, 9, 
    10, 11, 12, 13, 14, 15, 16, 17, 18, 19,
    20, 21, 22, 23, 24, 25, 26, 27, 28, 29,
    30, 31, 32, 33, 34, 35, 36, 37, 38, 39,
    40, 41, 42, 43, 44, 45, 46, 47, 48, 49,
    50, 51, 52, 53, 54, 55, 56, 57, 58, 59,
    60, 61, 62, 63, 64, 65, 66, 67, 68, 69,
    70, 71, 72, 73, 74, 75, 76, 77, 78, 79,
    80, 81, 82, 83, 84, 85, 86, 87, 88, 89,
    90, 91, 92, 93, 94, 95, 96, 97, 98, 99,
    100, 101, 102, 103, 104, 105, 106, 107, 108, 109
  ]

  let results: Array<{ count: number, multiple: number, profit: string }>  = []

  for (const multiple of multiples) {
    let profit = 0; let count = 0

    for (let j=0; j < positions.length; j++) {
      profit -= tradingAmount

      if (positions[j].highestMultiple >= multiple) {

        // Remove entries that don't make sense...
        if (positions[j].highestMultiple >= 100) { continue }

        profit += (tradingAmount * multiple); count++
      } else if (
        useStopLoss
        && stopLoss >= positions[j].lowestMultiple
      ) {
        profit += (tradingAmount * stopLoss)
      }

      if (j === positions.length - 1) {
        results.push({
          count: count,
          multiple: multiple,
          profit: profit.toFixed(2)
        })

        if (profit > bestProfit) {
          bestMultiple = multiple; bestProfit = profit;
        }
      }
    }
  }

  results = results.sort((a, b) => {
    return Number(b.profit) - Number(a.profit)
  })

  results = results.filter((r) => {
    return Number(r.profit) > 0
  })

  const count = positions.length

  return {
    count, profit: profit.toFixed(2), bestMultiple, bestProfit: bestProfit.toFixed(2), results: results.slice(0, 8)
  }
}

export const buildPositionsArray = (
  holdings: Array<IHolding>,
  tokens: Array<IToken>,
  buys: Array<IBuy>,
  sells: Array<ISell>,
  // pools: Array<IPool>,
  // selectors: Array<ISelector>,
  // baseTokenPrice: string
): Array<Position> => {
  const ceiling = Math.floor(Date.now() / 1000)
  const rugPullInterval = 60 * 3 // 3 minutes.

  let positionsArray: Array<Position> = []

  for (let holding of holdings) {
    let token = tokens.find((t) => t.address === holding.address)
    if (!token) { continue }

    // let _pools = pools.filter((pool) => {
    //   return [pool.token0, pool.token1].includes(token.address)
    // })

    let _buys = buys.filter((buy) => {
      return buy.tokenAddress === holding.address
    })
    if (!_buys.length) { continue }

    // console.log(_buys.length)

    // _buys = _buys.filter(
    //   (obj, index, self) =>
    //     index === self.findIndex(buy => buy.tokenAddress === obj.tokenAddress)
    // );

    // console.log(_buys.length)

    let _sells = sells.filter((sell) => {
      return sell.tokenAddress === holding.address
    })

    const buy = _buys[0]
    const sell = _sells[0]

    const position = <Position>{
      status: 'success',
      multiple: 0,
      lowestMultiple: 0,
      highestMultiple: 0,

      swapCount: buy.swapCount,
      tokenAgeOnTx: buy.tokenAgeOnTx,
      swapsPerMinute: buy.swapsPerMinute
    }

    const tokenActive = !(token.lastSwap < (ceiling - rugPullInterval))

    switch(true) {
      // Siphoned... could not exit
      case (sell.siphoned):
        position.status = 'siphoned'; break;

      // Success... closed position
      case (sell.goodMultiple && sell.goodMultiple > 0):
        position.multiple = sell.goodMultiple
        position.highestMultiple = sell.highestMultiple
        position.lowestMultiple = sell.lowestMultiple

        break;

      // Rug pulled... could not exit
      case (!tokenActive):
        position.status = 'rugPulled';

        if (
          sell
          && sell.prevHighestMultiple
          && sell.prevHighestMultiple < sell.highestMultiple
          && sell.prevHighestMultiple < 75 // Remove false `highestMultiple`s
        ) {
          sell.highestMultiple = sell.prevHighestMultiple
        }

        position.lowestMultiple = sell.lowestMultiple
        
        break;

      // Still invested... skip
      default:
        continue;
    }

    positionsArray.push(position)
  }

  return positionsArray
}

const buildObject = (
  holdingsArray: HoldingItem[]
): Array<any> => {
  let obj = []

  for (const item of holdingsArray) {
    let holding = {
      token: {
        name: item.token.name,
        symbol: item.token.symbol,
        address: item.token.address,
        verified: item.token.verified,
        // protocol: item.token.protocols,
        compliant: item.token.compliant,
        launchpad: item.token.launchpad,
        ownerRenounced: item.token.ownerRenounced
      },
      result: item.result,
      amount: item.amount,
      createdAt: item.createdAt,
      avgPriceInBase: item.avgPriceInBase,
      buy: null,
      // sell: item.txs[0].sell || null
    }

    if (
      item.txs
      && typeof item.txs === 'object'
    ) {
      if (item.txs[0].buy) {
        const buy = item.txs[0].buy

        let _buy = {
          protocol: buy.protocol,
          tokenAgeOnBuy: buy.tokenAgeOnTx,
          liquidityInUsd: buy.liquidityInUsd
        }

        // holding.buy = _buy
      }
    }

    obj.push(holding)
  }

  return obj
}